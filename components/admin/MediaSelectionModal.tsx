
import React, { useState, useEffect, useMemo, ChangeEvent, useCallback } from 'react';
import { useMedia } from '../../contexts/MediaContext';
import { MediaItem } from '../../types';
import CloseIcon from '../icons/CloseIcon';
import MediaIcon from './icons/MediaIcon'; 
import UploadIcon from './icons/UploadIcon'; 
import useFileUpload from '../../hooks/useFileUpload'; 
import { useNotifications } from '../../contexts/NotificationsContext';
import { useSearchAndFilter } from '../../hooks/useSearchAndFilter'; 
import useDebounce from '../../hooks/useDebounce'; // Import useDebounce

interface MediaSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMedia: (mediaItem: MediaItem) => void;
  modalIdPrefix?: string;
}

const MediaSelectionModal: React.FC<MediaSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectMedia,
  modalIdPrefix = "media-select"
}) => {
  const { mediaItems, isLoadingMedia } = useMedia();
  const { showNotification } = useNotifications();
  const [isVisible, setIsVisible] = useState(false);

  const imageMediaItems = useMemo(() => {
    return mediaItems.filter(item => item.mimeType.startsWith('image/'))
                     .sort((a,b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  }, [mediaItems]);

  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(localSearchTerm, 300);

  const {
    processedData: filteredMediaItems,
    // searchTerm, // Not used directly for input value anymore
    setSearchTerm
  } = useSearchAndFilter<MediaItem>(imageMediaItems, { searchKeys: ['name'] });

  useEffect(() => {
    setSearchTerm(debouncedSearchTerm);
  }, [debouncedSearchTerm, setSearchTerm]);


  const {
    feedback: uploadFeedback,
    isDraggingOver: isDraggingOverModal,
    handleDragOver: handleModalDragOver,
    handleDragLeave: handleModalDragLeave,
    handleDrop: handleModalDrop,
    triggerFileInput,
    handleFileInputChange,
    fileInputRef,
    clearFeedback: clearUploadFeedback
  } = useFileUpload();

  useEffect(() => {
    if (uploadFeedback) {
      uploadFeedback.messages.forEach(msg => {
        showNotification(msg, uploadFeedback.type);
      });
      clearUploadFeedback();
    }
  }, [uploadFeedback, showNotification, clearUploadFeedback]);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setLocalSearchTerm(''); // Clear local search term on open
      clearUploadFeedback();
    } else {
      setIsVisible(false);
    }
  }, [isOpen, clearUploadFeedback]);

  const handleCloseModal = () => {
    setIsVisible(false);
    clearUploadFeedback();
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleSelect = (item: MediaItem) => {
    onSelectMedia(item);
    handleCloseModal();
  };
  

  if (!isOpen && !isVisible) return null;

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center p-4 z-[180] transition-opacity duration-300 ease-in-out ${isVisible ? 'bg-black bg-opacity-70 backdrop-blur-sm' : 'bg-opacity-0 pointer-events-none'}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${modalIdPrefix}-title`}
      onClick={handleCloseModal}
    >
      <div
        className={`bg-brand-primary p-6 rounded-lg shadow-modal w-full max-w-3xl max-h-[90vh] flex flex-col transform transition-all duration-300 ease-out-expo ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-brand-gray-light">
          <h2 id={`${modalIdPrefix}-title`} className="text-lg sm:text-xl font-semibold text-brand-secondary">
            Seleccionar Imagen
          </h2>
          <button onClick={handleCloseModal} className="icon-btn" aria-label="Cerrar modal">
            <CloseIcon />
          </button>
        </div>
        
        <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/gif,image/svg+xml,image/webp"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            className="hidden"
            aria-label="Selector de archivos para subir"
        />

        <div className="mb-4 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Buscar imagen por nombre..."
            value={localSearchTerm}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setLocalSearchTerm(e.target.value)}
            className="flex-grow w-full sm:w-auto p-2.5 bg-brand-primary border border-brand-quaternary rounded-md shadow-sm focus:ring-2 focus:ring-brand-tertiary focus:border-transparent text-sm sm:text-base"
            aria-label="Buscar en biblioteca de medios"
          />
           <button
            type="button"
            onClick={triggerFileInput}
            className="btn-secondary px-4 py-2 flex items-center justify-center sm:w-auto w-full"
            title="Subir nuevos archivos a la biblioteca"
          >
            <UploadIcon className="w-4 h-4 mr-2" />
            Subir Archivo
          </button>
        </div>

        <div
          className={`flex-grow overflow-y-auto pr-1 relative rounded-md transition-all duration-200 ${
            isDraggingOverModal 
              ? 'border-2 border-dashed border-brand-tertiary bg-brand-tertiary/5 outline-none ring-2 ring-brand-tertiary ring-offset-2' 
              : 'border-2 border-transparent'
          }`}
          onDragOver={handleModalDragOver}
          onDragEnter={handleModalDragOver} 
          onDragLeave={handleModalDragLeave}
          onDrop={handleModalDrop}
        >
          {isDraggingOverModal && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-brand-primary bg-opacity-80 z-10 pointer-events-none rounded-md">
              <UploadIcon className="w-12 h-12 text-brand-tertiary mb-2" />
              <p className="text-lg font-semibold text-brand-secondary">Soltar para Subir Archivos</p>
            </div>
          )}
          {isLoadingMedia ? (
            <p className="text-text-secondary text-sm text-center py-10">Cargando imágenes...</p>
          ) : filteredMediaItems.length === 0 ? (
            <div className="text-center py-10 text-text-secondary flex flex-col items-center justify-center h-full">
              <MediaIcon className="w-16 h-16 mx-auto text-brand-quaternary mb-4" />
              <p className="text-base">
                {imageMediaItems.length === 0 ? "No hay imágenes en la biblioteca." : "No se encontraron imágenes con ese nombre."}
              </p>
              <p className="text-sm mt-1">Arrastra archivos aquí o usa el botón para subir.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredMediaItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className="group bg-brand-gray-light border border-brand-quaternary rounded-lg shadow-subtle overflow-hidden flex flex-col hover:border-brand-tertiary hover:ring-2 hover:ring-brand-tertiary focus:outline-none focus:ring-2 focus:ring-brand-tertiary focus:ring-offset-1 transition-all aspect-square"
                  aria-label={`Seleccionar ${item.name}`}
                >
                  <div className="flex-grow flex items-center justify-center p-1 bg-white">
                    <img src={item.public_url} alt={item.name} className="max-w-full max-h-full object-contain transition-transform group-hover:scale-105" />
                  </div>
                  <div className="p-1.5 text-xs bg-brand-gray-light border-t border-brand-quaternary">
                    <p className="font-medium text-text-primary break-all truncate" title={item.name}>
                      {item.name}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="mt-auto pt-6 border-t border-brand-gray-light flex justify-end">
            <button type="button" onClick={handleCloseModal} className="btn-ghost">
              Cancelar
            </button>
        </div>
      </div>
    </div>
  );
};

export default MediaSelectionModal;
