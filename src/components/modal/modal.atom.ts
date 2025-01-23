import { atom } from "recoil";

// Modal state
export const modalState = atom({
  key: "modalState",
  default: {
    isOpen: false,
    content: null as React.ReactNode | null,
  },
});
