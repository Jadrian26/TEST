import React, { useState, useEffect } from 'react';
import { useEditableContent } from '../../contexts/EditableContentContext';
import { useMedia } from '../../contexts/MediaContext';
import { MediaItem } from '../../types';
import CloseIcon from '../icons/CloseIcon';
import MediaSelectionModal from './MediaSelectionModal';
import MediaIcon from './icons/MediaIcon'; 
import useModalState from '../../hooks/useModalState'; 
import { useNotifications } from '../../contexts/NotificationsContext'; // Added

interface EditBrandLogoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EditBrandLogoModal: React.FC<EditBrandLogoModalProps> = ({ isOpen, onClose }) => {
  const { brandLogoId, updateBrandLogoId } = useEditableContent();
  const { mediaItems } = useMedia();
  const { showNotification } = useNotifications(); // Added

  const [currentLogoId, setCurrentLogoId] = useState<string | null>(null);
  const { isOpen: isMediaSelectionModalOpen, openModal: openMediaSelectionModal, closeModal: closeMediaSelectionModal } = useModalState();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentLogoId(brandLogoId);
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [isOpen, brandLogoId]);

  const handleCloseModal = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleSelectLogoFromLibrary = (selectedMedia: MediaItem) => {
    setCurrentLogoId(selectedMedia.id);
    closeMediaSelectionModal();
  };

  const handleRemoveLogo = () => {
    setCurrentLogoId(null); // Set to null to use APP_NAME as text fallback
  };

  const handleSaveChanges = () => {
    try {
      updateBrandLogoId(currentLogoId);
      showNotification("Logo del sitio actualizado.", 'success');
      handleCloseModal();
    } catch (error) {
      showNotification("Error al actualizar el logo.", 'error');
      console.error("Error saving brand logo:", error);
    }
  };

  const currentLogoPreviewItem = currentLogoId ? mediaItems.find(item => item.id === currentLogoId) : null;

  if (!isOpen && !isVisible) return null;

  return (
    <>
      <div
        className={`fixed inset-0 flex items-center justify-center p-4 z-[170] transition-opacity duration-300 ease-in-out ${isVisible ? 'bg-black bg-opacity-70 backdrop-blur-sm' : 'bg-opacity-0 pointer-events-none'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-brand-logo-title"
        onClick={handleCloseModal}
      >
        <div
          className={`bg-brand-primary p-6 rounded-lg shadow-modal w-full max-w-md transform transition-all duration-300 ease-out-expo ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 id="edit-brand-logo-title" className="text-lg sm:text-xl font-semibold text-brand-secondary">
              Editar Logo del Sitio Web
            </h2>
            <button onClick={handleCloseModal} className="icon-btn" aria-label="Cerrar modal">
              <CloseIcon />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm sm:text-base font-medium text-text-primary mb-2">Logo Actual:</label>
              <div className="w-full min-h-[80px] p-2 border border-brand-quaternary rounded-md bg-brand-gray-light flex items-center justify-center">
                {currentLogoPreviewItem ? (
                  <img src={currentLogoPreviewItem.dataUrl} alt="Logo actual" className="max-h-24 max-w-full object-contain" />
                ) : (
                  <div className="text-center text-text-secondary">
                    <MediaIcon className="w-10 h-10 mx-auto text-brand-gray-medium mb-1" />
                    <p className="text-xs">Ningún logo seleccionado.</p>
                    <p className="text-xs">Se mostrará el nombre del sitio como texto.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={openMediaSelectionModal}
                className="btn-secondary w-full"
              >
                {currentLogoPreviewItem ? 'Cambiar Logo' : 'Seleccionar Logo'}
              </button>
              {currentLogoPreviewItem && ( 
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="btn-outline !border-error !text-error hover:!bg-error hover:!text-white w-full"
                >
                  Quitar Logo
                </button>
              )}
            </div>
            <p className="text-xs text-brand-gray-medium">
              El logo se mostrará en la barra de navegación. Si no se selecciona ninguno, se usará el nombre del sitio.
            </p>
          </div>

          <div className="mt-8 flex justify-end space-x-3">
            <button type="button" onClick={handleCloseModal} className="btn-ghost">
              Cancelar
            </button>
            <button type="button" onClick={handleSaveChanges} className="btn-primary">
              Guardar Cambios
            </button>
          </div>
        </div>
      </div>

      <MediaSelectionModal
        isOpen={isMediaSelectionModalOpen}
        onClose={closeMediaSelectionModal}
        onSelectMedia={handleSelectLogoFromLibrary}
        modalIdPrefix="brand-logo-select"
      />
    </>
  );
};

export default EditBrandLogoModal;