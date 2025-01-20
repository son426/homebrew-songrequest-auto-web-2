import { User } from "./schema";

// Window 인터페이스 확장
declare global {
  interface Window {
    USER_INFO: User | undefined;
    ReactNativeWebView: {
      postMessage: (message: string) => void;
    };
  }
}
