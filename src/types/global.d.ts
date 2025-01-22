import { User } from "./schema";

// Window 인터페이스 확장
declare global {
  interface Window {
    USER_INFO: User | undefined;
    ReactNativeWebView: {
      postMessage: (message: string) => void;
    };
    // updateUserState 함수 타입 추가
    updateUserState?: (newUserInfo: User) => void;
  }
}

// Message 타입 정의 (타입 안정성을 위해)
export interface WebViewMessage {
  type:
    | "USER_INFO_CHECK"
    | "USER_INFO"
    | "NAVIGATION"
    | "PRESS_SONG"
    | "SHARE_SONG"
    | "USER_STATE_UPDATED";
  data?: User;
  payload?: User;
  screen?: string;
  song?: any; // Song 타입이 있다면 그걸로 교체
}
