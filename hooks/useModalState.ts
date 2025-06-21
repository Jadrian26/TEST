import { useState, useCallback } from 'react';

interface UseModalStateOutput {
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  toggleModal: () => void;
}

function useModalState(initialOpen: boolean = false): UseModalStateOutput {
  const [isOpen, setIsOpen] = useState<boolean>(initialOpen);

  const openModal = useCallback(() => setIsOpen(true), []);
  const closeModal = useCallback(() => setIsOpen(false), []);
  const toggleModal = useCallback(() => setIsOpen(prev => !prev), []);

  return { isOpen, openModal, closeModal, toggleModal };
}

export default useModalState;
