export const stringUtils = {
  // 기본 정규화: 소문자 변환 및 앞뒤 공백 제거
  normalize: (text: string): string => text.toLowerCase().trim(),

  // 모든 연속된 공백을 단일 공백으로 변환
  normalizeSpaces: (text: string): string => text.replace(/\s+/g, " "),

  // 모든 공백 제거
  removeAllSpaces: (text: string): string => text.replace(/\s+/g, ""),

  // 특수문자 제거 (공백 유지)
  removeSpecialChars: (text: string): string =>
    text.replace(/[^a-zA-Z0-9가-힣\s]/g, " "),

  isSingleKoreanCharacter: (text: string): boolean =>
    /^[ㄱ-ㅎㅏ-ㅣ]$/.test(text),

  // 모든 공백, 특수문자 제거 및 소문자화
  cleanText: (text: string): string => {
    return text.toLowerCase().replace(/[^a-z0-9가-힣]/g, ""); // 영문, 숫자, 한글만 남기고 모두 제거
  },
};

export const generateSearchKeywordList = (text: string): string[] => {
  if (!text) return [];

  const keywords: Set<string> = new Set();
  const normalizedText = stringUtils.cleanText(text); // "슬픈표정하지말아요"

  // 1. 정규화된 전체 문자열 추가
  keywords.add(normalizedText); // "슬픈표정하지말아요"

  // 2. 원본 텍스트에서 공백만 제거한 버전 (대소문자 유지)
  keywords.add(text.replace(/\s+/g, "")); // "슬픈표정하지말아요"

  // 3. 띄어쓰기로 분리된 각 단어와 그 조합들
  const words = text.split(/\s+/).filter((word) => word.length > 0);
  words.forEach((word) => {
    const cleanWord = stringUtils.cleanText(word);
    keywords.add(cleanWord); // "슬픈", "표정", "하지", "말아요"

    // 각 단어의 부분 문자열 (2글자 이상)
    if (cleanWord.length >= 2) {
      for (let i = 2; i <= cleanWord.length; i++) {
        keywords.add(cleanWord.slice(0, i)); // "슬픈", "표정", "하지", "말아", "말아요"
      }
    }
  });

  // 4. 연속된 단어 조합
  for (let i = 0; i < words.length; i++) {
    let combined = "";
    for (let j = i; j < words.length; j++) {
      combined += stringUtils.cleanText(words[j]);
      keywords.add(combined); // "슬픈표정", "슬픈표정하지", "슬픈표정하지말아요", ...
    }
  }

  // 5. 한글 처리
  let partialString = "";
  for (const char of normalizedText) {
    partialString += char;
    keywords.add(partialString); // "슬", "슬픈", "슬픈표", ...

    if (/[가-힣]/.test(char)) {
      const decomposed = decomposeHangul(char);
      if (decomposed) {
        // 초성 추가
        keywords.add(decomposed.initial); // "ㅅ", "ㅍ", "ㅎ", "ㅁ"

        // 초성 누적 추가
        const initials = Array.from(normalizedText)
          .map((c) => {
            const d = decomposeHangul(c);
            return d ? d.initial : c;
          })
          .join("");
        keywords.add(initials); // "ㅅㅍㅈㅎㅁㅇ"

        // 현재까지의 초성 추가
        const partialinitials = Array.from(partialString)
          .map((c) => {
            const d = decomposeHangul(c);
            return d ? d.initial : c;
          })
          .join("");
        keywords.add(partialinitials); // "ㅅ", "ㅅㅍ", "ㅅㅍㅈ", ...
      }
    }
  }

  // 6. 2음절 이상 조합 추가
  const chars = Array.from(normalizedText);
  for (let i = 0; i < chars.length - 1; i++) {
    for (let j = i + 2; j <= chars.length; j++) {
      keywords.add(chars.slice(i, j).join("")); // "슬픈", "픈표", "표정", ...
    }
  }

  return Array.from(keywords)
    .filter((keyword) => keyword.length > 0)
    .filter((keyword) => keyword.length <= 50)
    .filter((keyword) => !stringUtils.isSingleKoreanCharacter(keyword));
};

const decomposeHangul = (char: string) => {
  const INITIALS = [
    "ㄱ",
    "ㄲ",
    "ㄴ",
    "ㄷ",
    "ㄸ",
    "ㄹ",
    "ㅁ",
    "ㅂ",
    "ㅃ",
    "ㅅ",
    "ㅆ",
    "ㅇ",
    "ㅈ",
    "ㅉ",
    "ㅊ",
    "ㅋ",
    "ㅌ",
    "ㅍ",
    "ㅎ",
  ];
  const MEDIALS = [
    "ㅏ",
    "ㅐ",
    "ㅑ",
    "ㅒ",
    "ㅓ",
    "ㅔ",
    "ㅕ",
    "ㅖ",
    "ㅗ",
    "ㅘ",
    "ㅙ",
    "ㅚ",
    "ㅛ",
    "ㅜ",
    "ㅝ",
    "ㅞ",
    "ㅟ",
    "ㅠ",
    "ㅡ",
    "ㅢ",
    "ㅣ",
  ];
  const FINALS = [
    "",
    "ㄱ",
    "ㄲ",
    "ㄳ",
    "ㄴ",
    "ㄵ",
    "ㄶ",
    "ㄷ",
    "ㄹ",
    "ㄺ",
    "ㄻ",
    "ㄼ",
    "ㄽ",
    "ㄾ",
    "ㄿ",
    "ㅀ",
    "ㅁ",
    "ㅂ",
    "ㅄ",
    "ㅅ",
    "ㅆ",
    "ㅇ",
    "ㅈ",
    "ㅊ",
    "ㅋ",
    "ㅌ",
    "ㅍ",
    "ㅎ",
  ];

  const charCode = char.charCodeAt(0) - 0xac00;
  if (charCode < 0 || charCode > 11171) return null;

  const initialIndex = Math.floor(charCode / 28 / 21);
  const medialIndex = Math.floor((charCode / 28) % 21);
  const finalIndex = charCode % 28;

  return {
    initial: INITIALS[initialIndex],
    medial: MEDIALS[medialIndex],
    final: FINALS[finalIndex],
  };
};

export const generateRandomString = (length?: number): string => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const stringLength = length || 6;
  let result = "";
  for (let i = 0; i < stringLength; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

export const generateIdByNowDate = (): string => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  // songId가 없으면 userId + MMDDHHSS 형식으로 ID 생성
  return `${month}월${day}일${hours}:${minutes}:${seconds}`;
};
