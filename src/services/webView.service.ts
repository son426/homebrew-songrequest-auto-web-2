import { Song, User } from "../types/schema";

/**
 * 웹뷰 메시지 타입 정의
 *
 * NAVIGATION: 화면 이동
 * SHARE_SONG: 노래 공유
 * PRESS_SONG: 노래 선택
 * USER_INFO_CHECK, USER_INFO: 유저 정보 관련
 */
export type WebViewMessageType =
  | "NAVIGATION"
  | "SHARE_SONG"
  | "PRESS_SONG"
  | "USER_INFO_CHECK"
  | "USER_INFO"
  | "OPEN_URL";

/**
 * 웹뷰 메시지 인터페이스 정의
 *
 * BaseWebViewMessage: 기본 메시지 형태
 * NavigationMessage: 화면 이동 메시지
 * ShareSongMessage: 노래 공유 메시지
 * PressSongMessage: 노래 선택 메시지
 * UserInfoMessage: 유저 정보 관련 메시지
 */
interface BaseWebViewMessage {
  type: WebViewMessageType;
}

interface NavigationMessage extends BaseWebViewMessage {
  type: "NAVIGATION";
  screen: string;
}

interface ShareSongMessage extends BaseWebViewMessage {
  type: "SHARE_SONG";
  song: Song;
}

interface PressSongMessage extends BaseWebViewMessage {
  type: "PRESS_SONG";
  song: Song;
}

interface UserInfoMessage extends BaseWebViewMessage {
  type: "USER_INFO" | "USER_INFO_CHECK";
  data?: User;
  payload?: User;
}

interface OpenUrlMessage extends BaseWebViewMessage {
  type: "OPEN_URL";
  payload: string;
}

export type WebViewMessage =
  | NavigationMessage
  | ShareSongMessage
  | PressSongMessage
  | UserInfoMessage
  | OpenUrlMessage;

type NavigationScreens =
  | "Home"
  | "ArtistDetail"
  | "EditArtist"
  | "Make"
  | "Chart"
  | "Recent"
  | "Signin"
  | "CreditGuide"
  | "Purchase"
  | "SongList"
  | "MakeModal"
  | "ShortList"
  | "Short"
  | "SongRequestList"
  | "MyBrewingList"
  | "AutoBrewing"
  | "Search"
  | "SearchOn"
  | "My"
  | "Setting"
  | "SearchModal"
  | "Playlist";

/**
 * 웹뷰 메시지 전송 함수
 * ReactNativeWebView가 있을 경우에만 메시지 전송
 * 없을 경우 경고 메시지 출력
 */
const sendWebViewMessage = (message: WebViewMessage): void => {
  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(JSON.stringify(message));
  } else {
    console.warn("ReactNativeWebView is not available");
  }
};

/**
 * 웹뷰 액션 모음
 *
 * navigate: 특정 화면으로 이동
 * shareSong: 노래 공유하기
 * pressSong: 노래 선택하기
 * openUrl: 외부 URL 열기
 *
 * 사용 예시:
 * webViewActions.navigate('Signin')
 * webViewActions.shareSong(song)
 * webViewActions.pressSong(song)
 * webViewActions.openUrl('http://example.com')
 */
export const webViewActions = {
  navigate: (screen: NavigationScreens): void => {
    sendWebViewMessage({ type: "NAVIGATION", screen });
  },
  shareSong: (song: Song): void => {
    sendWebViewMessage({ type: "SHARE_SONG", song });
  },
  pressSong: (song: Song): void => {
    sendWebViewMessage({ type: "PRESS_SONG", song });
  },
  openUrl: (url: string): void => {
    sendWebViewMessage({ type: "OPEN_URL", payload: url });
  },
};

/**
 * 웹뷰 메시지 리스너 설정
 *
 * @param onUserInfo - 유저 정보를 받았을 때 실행할 콜백 함수
 * @returns cleanup 함수 - 컴포넌트 언마운트시 리스너 제거용
 *
 * 사용 예시:
 * useEffect(() => {
 *   const cleanup = setupWebViewMessageListener((user) => {
 *     setUserInfo(user);
 *   });
 *   return cleanup;
 * }, []);
 */
export const setupWebViewMessageListener = (
  onUserInfo: (user: User) => void
): (() => void) => {
  const handleMessage = (event: MessageEvent) => {
    try {
      // 디버깅을 위해 들어오는 모든 메시지 로깅
      console.log("수신된 웹뷰 메시지:", event.data);

      if (typeof event.data !== "string") {
        console.warn("메시지가 문자열이 아님:", typeof event.data);
        return;
      }

      const data = JSON.parse(event.data) as WebViewMessage;
      if (data.type === "USER_INFO" || data.type === "USER_INFO_CHECK") {
        const userInfo = data.data || data.payload;
        if (userInfo) {
          onUserInfo(userInfo);
        }
      }
    } catch (error) {
      console.error("웹뷰 메시지 처리 중 에러 발생:", error);
      console.debug("파싱 실패한 메시지 내용:", event.data);
    }
  };

  window.addEventListener("message", handleMessage);
  return () => window.removeEventListener("message", handleMessage);
};
