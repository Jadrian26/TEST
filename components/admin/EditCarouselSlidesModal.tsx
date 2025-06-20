import React, { useState, useEffect } from 'react';
import { useEditableContent } from '../../contexts/EditableContentContext';
import { useMedia } from '../../contexts/MediaContext';
import { MediaItem } from '../../types';
import CloseIcon from '../icons/CloseIcon';
import TrashIcon from '../icons/TrashIcon';
import MediaSelectionModal from './MediaSelectionModal';
import MediaIcon from './icons/MediaIcon'; 
import useModalState from '../../hooks/useModalState'; 
import { useNotifications } from '../../contexts/NotificationsContext'; 
import useButtonCooldown from '../../hooks/useButtonCooldown'; // Importar hook

interface EditCarouselSlidesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EditCarouselSlidesModal: React.FC<EditCarouselSlidesModalProps> = ({ isOpen, onClose }) => {
  const { 
    heroSlides, 
    updateHeroSlides: updateHeroSlidesContext, 
    heroCarouselInterval, 
    updateHeroCarouselInterval 
  } = useEditableContent();
  const { mediaItems: allMediaFromLibrary } = useMedia();
  const { showNotification } = useNotifications(); 

  const [selectedSlidesForEditing, setSelectedSlidesForEditing] = useState<MediaItem[]>([]);
  const [currentInterval, setCurrentInterval] = useState<number>(heroCarouselInterval);
  const { isOpen: isMediaSelectionModalOpen, openModal: openMediaSelectionModal, closeModal: closeMediaSelectionModal } = useModalState();
  const [isVisible, setIsVisible] = useState(false);

  const saveChangesAction = async () => {
    await updateHeroSlidesContext(selectedSlidesForEditing.map(slide => slide.id));
    await updateHeroCarouselInterval(currentInterval);
    showNotification("Carrusel principal actualizado.", 'success');
    handleCloseModal();
  };

  const { 
    trigger: triggerSaveChanges, 
    isCoolingDown, 
    timeLeft 
  } = useButtonCooldown(saveChangesAction, 2000);


  useEffect(() => {
    if (isOpen) {
      const validCurrentSlides = heroSlides.filter(slide => 
        allMediaFromLibrary.some(libItem => libItem.id === slide.id)
      );
      setSelectedSlidesForEditing(validCurrentSlides);
      setCurrentInterval(heroCarouselInterval);
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [isOpen, heroSlides, heroCarouselInterval, allMediaFromLibrary]);

  const handleCloseModal = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleAddImageFromLibrary = (selectedMedia: MediaItem) => {
    if (!selectedSlidesForEditing.find(slide => slide.id === selectedMedia.id)) {
      setSelectedSlidesForEditing(prevSlides => [...prevSlides, selectedMedia]);
    } else {
      showNotification("Esta imagen ya está en el carrusel.", "info");
    }
    closeMediaSelectionModal();
  };

  const handleRemoveSlide = (slideIdToRemove: string) => {
    setSelectedSlidesForEditing(prevSlides => prevSlides.filter(slide => slide.id !== slideIdToRemove));
  };
  
  const moveSlide = (index: number, direction: 'up' | 'down') => {
    const newSlides = [...selectedSlidesForEditing];
    const item = newSlides[index];
    newSlides.splice(index, 1);
    if (direction === 'up') {
      newSlides.splice(Math.max(0, index - 1), 0, item);
    } else {
      newSlides.splice(Math.min(newSlides.length, index + 1), 0, item);
    }
    setSelectedSlidesForEditing(newSlides);
  };

  const handleIntervalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentInterval(isNaN(val) ? heroCarouselInterval : val);
  };

  if (!isOpen && !isVisible) return null;

  return (
    <>
      <div
        className={`fixed inset-0 flex items-center justify-center p-4 z-[150] transition-opacity duration-300 ease-in-out ${isVisible ? 'bg-black bg-opacity-70 backdrop-blur-sm' : 'bg-opacity-0 pointer-events-none'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-carousel-slides-title"
        onClick={handleCloseModal}
      >
        <div
          className={`bg-brand-primary p-6 rounded-lg shadow-modal w-full max-w-2xl max-h-[90vh] flex flex-col transform transition-all duration-300 ease-out-expo ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4 pb-4 border-b border-brand-gray-light">
            <h2 id="edit-carousel-slides-title" className="text-lg sm:text-xl font-semibold text-brand-secondary">
              Editar Diapositivas del Carrusel Principal
            </h2>
            <button onClick={handleCloseModal} className="icon-btn" aria-label="Cerrar modal">
              <CloseIcon />
            </button>
          </div>

          <div className="mb-4">
            <button
              onClick={openMediaSelectionModal}
              className="btn-secondary w-full py-2"
            >
              + Añadir Imagen
            </button>
          </div>
          
          <div className="mb-5 border-b border-brand-gray-light pb-4">
              <label htmlFor="heroInterval" className="block text-sm sm:text-base font-medium text-text-primary mb-1">Intervalo entre Diapositivas (segundos):</label>
              <input 
                type="number"
                id="heroInterval"
                value={currentInterval}
                onChange={handleIntervalChange}
                min="1"
                max="60"
                step="1"
                className="w-full md:w-1/2 p-2.5 bg-brand-primary border border-brand-quaternary rounded-md shadow-sm focus:ring-2 focus:ring-brand-tertiary focus:border-transparent text-sm sm:text-base"
              />
              <p className="text-xs text-brand-gray-medium mt-1">Valores entre 1 y 60 segundos.</p>
          </div>


          <div className="flex-grow overflow-y-auto pr-1 space-y-3 mb-4">
            {selectedSlidesForEditing.length === 0 ? (
              <div className="text-center py-10 text-text-secondary">
                <MediaIcon className="w-16 h-16 mx-auto text-brand-quaternary mb-3" />
                <p>No hay diapositivas seleccionadas.</p>
                <p className="text-sm">Añade imágenes desde la biblioteca para el carrusel.</p>
              </div>
            ) : (
              selectedSlidesForEditing.map((slide, index) => (
                <div key={slide.id} className="flex items-center justify-between p-2.5 border border-brand-quaternary rounded-md bg-brand-gray-light hover:shadow-sm">
                  <div className="flex items-center space-x-3 flex-grow min-w-0">
                    <img src={slide.public_url} alt={slide.name} className="w-16 h-16 object-contain rounded bg-white border border-brand-gray-light" />
                    <span className="text-sm text-text-primary truncate" title={slide.name}>{slide.name}</span>
                  </div>
                  <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
                    <button 
                        onClick={() => moveSlide(index, 'up')} 
                        disabled={index === 0}
                        className="icon-btn !p-1.5 disabled:opacity-30 disabled:cursor-not-allowed" 
                        title="Mover arriba">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" /></svg>
                    </button>
                    <button 
                        onClick={() => moveSlide(index, 'down')}
                        disabled={index === selectedSlidesForEditing.length - 1}
                        className="icon-btn !p-1.5 disabled:opacity-30 disabled:cursor-not-allowed" 
                        title="Mover abajo">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    <button onClick={() => handleRemoveSlide(slide.id)} className="icon-btn !p-1.5 text-error hover:bg-error/10" title="Eliminar diapositiva">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-auto pt-4 border-t border-brand-gray-light flex justify-end space-x-3">
            <button type="button" onClick={handleCloseModal} className="btn-ghost" disabled={isCoolingDown}>
              Cancelar
            </button>
            <button 
              type="button" 
              onClick={triggerSaveChanges} 
              className="btn-primary"
              disabled={isCoolingDown}
            >
              {isCoolingDown ? `Guardando... (${timeLeft}s)` : 'Guardar Cambios'}
            </button>
          </div>
        </div>
      </div>

      <MediaSelectionModal
        isOpen={isMediaSelectionModalOpen}
        onClose={closeMediaSelectionModal}
        onSelectMedia={handleAddImageFromLibrary}
        modalIdPrefix="carousel-slide-select"
      />
    </>
  );
};

export default EditCarouselSlidesModal;
