import React, { useEffect } from "react";
import { modalState } from "./modal.atom";
import { useRecoilState } from "recoil";

interface ModalProps {
  onClose?: () => void;
}

const Modal: React.FC<ModalProps> = ({ onClose }) => {
  const [modal, setModal] = useRecoilState(modalState);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const handleClose = () => {
    setModal({ isOpen: false, content: null });
    onClose?.();
  };

  if (!modal.isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={handleClose}
      />
      <div className="relative z-10 bg-neutral-900 rounded-lg p-6 max-w-md w-full mx-4 transform transition-all duration-300 opacity-100 scale-100">
        {modal.content}
      </div>
    </div>
  );
};

export default Modal;
