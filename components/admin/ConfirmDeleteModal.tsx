
import React, { useEffect, useState } from 'react';
import CloseIcon from '../icons/CloseIcon'; 

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void; // Parent will handle notifications
  title: string;
  message: string;
  itemName?: string; 
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemName,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  const handleCloseModal = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300); 
  };

  const handleConfirmAction = () => {
    onConfirm(); // Call the passed onConfirm, parent handles notifications
    handleCloseModal();
  };
  
  if (!isOpen && !isVisible) return null;

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center p-4 z-[130] transition-opacity duration-300 ease-in-out ${isVisible ? 'bg-black bg-opacity-70 backdrop-blur-sm' : 'bg-opacity-0 pointer-events-none'}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-delete-title"
      onClick={handleCloseModal}
    >
      <div
        className={`bg-brand-primary p-6 rounded-lg shadow-modal w-full max-w-md transform transition-all duration-300 ease-out-expo ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <h2 id="confirm-delete-title" className="text-lg sm:text-xl font-semibold text-error">
            {title}
          </h2>
          <button onClick={handleCloseModal} className="icon-btn text-text-secondary hover:text-error" aria-label="Cerrar modal">
            <CloseIcon className="w-5 h-5"/>
          </button>
        </div>
        <p className="text-sm sm:text-base text-text-secondary mb-2">
          {message}
        </p>
        {itemName && (
          <p className="text-sm sm:text-base text-text-primary font-medium bg-brand-gray-light p-2 rounded-md mb-6">
            Ítem a eliminar: <span className="font-bold">{itemName}</span>
          </p>
        )}
         <p className="text-xs sm:text-sm text-error mb-6">
          Esta acción no se puede deshacer.
        </p>
        <div className="mt-6 flex justify-end space-x-3">
          <button type="button" onClick={handleCloseModal} className="btn-ghost text-sm sm:text-base">
            Cancelar
          </button>
          <button type="button" onClick={handleConfirmAction} className="btn bg-error text-white hover:bg-red-700 focus:ring-error text-sm sm:text-base">
            Confirmar Eliminación
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;