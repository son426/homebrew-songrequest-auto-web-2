import { useSetRecoilState } from "recoil";
import { modalState } from "../components/modal/modal.atom";

export const useModal = () => {
  const setModal = useSetRecoilState(modalState);

  const openModal = (content: React.ReactNode) => {
    setModal({ isOpen: true, content });
  };

  const closeModal = () => {
    setModal({ isOpen: false, content: null });
  };

  return { openModal, closeModal };
};
