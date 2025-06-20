
import React, { useState, useEffect, FormEvent } from 'react';
import { useEditableContent } from '../../contexts/EditableContentContext';
import { useMedia } from '../../contexts/MediaContext';
import { ValuePropositionCardData, MediaItem } from '../../types';
import CloseIcon from '../icons/CloseIcon';
import MediaSelectionModal from './MediaSelectionModal';
import StoreIconUyB from '../icons/StoreIconUyB'; 
import DeliveryIconUyB from '../icons/DeliveryIconUyB'; 
import CustomerServiceIconUyB from '../icons/CustomerServiceIconUyB'; 
import useModalState from '../../hooks/useModalState'; 
import { useNotifications } from '../../contexts/NotificationsContext'; // Added

interface EditValuePropositionCardsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const fallbackIcons: { [key: string]: React.FC<{ className?: string }> } = {
  storeUyB: StoreIconUyB,
  deliveryUyB: DeliveryIconUyB,
  customerServiceUyB: CustomerServiceIconUyB,
  // Keep general ones as true fallbacks if defaultIconName might not match new specific ones
  store: StoreIconUyB,
  delivery: DeliveryIconUyB,
  customerService: CustomerServiceIconUyB,
};


const EditValuePropositionCardsModal: React.FC<EditValuePropositionCardsModalProps> = ({ isOpen, onClose }) => {
  const { valuePropositionCardsData, updateValuePropositionCardsData: updateCardsContext } = useEditableContent();
  const { mediaItems } = useMedia();
  const { showNotification } = useNotifications(); // Added

  const [cardsToEdit, setCardsToEdit] = useState<ValuePropositionCardData[]>([]);
  const { isOpen: isMediaModalOpen, openModal: openMediaModal, closeModal: closeMediaModal } = useModalState();
  const [currentCardIndexForIconChange, setCurrentCardIndexForIconChange] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCardsToEdit(JSON.parse(JSON.stringify(valuePropositionCardsData))); 
      setFormError(null);
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [isOpen, valuePropositionCardsData]);

  const handleCloseModal = () => {
    setIsVisible(false);
    setTimeout(() => onClose(), 300);
  };

  const handleInputChange = (index: number, field: 'title' | 'subtitle', value: string) => {
    const updatedCards = [...cardsToEdit];
    updatedCards[index] = { ...updatedCards[index], [field]: value };
    setCardsToEdit(updatedCards);
  };

  const handleOpenMediaModalForCard = (index: number) => {
    setCurrentCardIndexForIconChange(index);
    openMediaModal();
  };

  const handleSelectIcon = (selectedMedia: MediaItem) => {
    if (currentCardIndexForIconChange !== null) {
      const updatedCards = [...cardsToEdit];
      updatedCards[currentCardIndexForIconChange].iconId = selectedMedia.id;
      setCardsToEdit(updatedCards);
    }
    closeMediaModal();
    setCurrentCardIndexForIconChange(null);
  };
  
  const handleRemoveCustomIcon = (index: number) => {
    const updatedCards = [...cardsToEdit];
    updatedCards[index].iconId = null;
    setCardsToEdit(updatedCards);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    for (const card of cardsToEdit) {
        if (!card.title.trim() || !card.subtitle.trim()) {
            showNotification(`Todos los campos de título y subtítulo son obligatorios para la tarjeta "${card.defaultIconName}".`, 'error');
            return;
        }
    }
    try {
      // Prepare data for context, removing client-side 'id' if it's temporary
      const dataToSave = cardsToEdit.map(({ id, ...rest }) => ({
        ...rest,
        // If 'id' was a placeholder, don't send it. If it's a real DB UUID, send it for potential updates (though current context logic deletes all and re-inserts).
        // For simplicity, let's assume context's update function handles this correctly.
      })) as Array<Omit<ValuePropositionCardData, 'id' | 'created_at' | 'updated_at'>>;

      const result = await updateCardsContext(dataToSave);
      if (result.success) {
        showNotification("Tarjetas de propuesta de valor actualizadas.", 'success');
        handleCloseModal();
      } else {
        showNotification(result.message || "Error al actualizar las tarjetas.", 'error');
      }
    } catch (error) {
      showNotification("Error al actualizar las tarjetas.", 'error');
      console.error("Error saving value proposition cards:", error);
    }
  };

  if (!isOpen && !isVisible) return null;

  return (
    <>
      <div
        className={`fixed inset-0 flex items-center justify-center p-4 z-[150] transition-opacity duration-300 ease-in-out ${isVisible ? 'bg-black bg-opacity-70 backdrop-blur-sm' : 'bg-opacity-0 pointer-events-none'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-value-prop-cards-title"
        onClick={handleCloseModal}
      >
        <div
          className={`bg-brand-primary p-6 rounded-lg shadow-modal w-full max-w-3xl max-h-[90vh] flex flex-col transform transition-all duration-300 ease-out-expo ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-brand-gray-light">
            <h2 id="edit-value-prop-cards-title" className="text-lg sm:text-xl font-semibold text-brand-secondary">
              Editar Tarjetas de Propuesta de Valor
            </h2>
            <button onClick={handleCloseModal} className="icon-btn" aria-label="Cerrar modal">
              <CloseIcon />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto pr-1 space-y-6">
            {cardsToEdit.map((card, index) => {
              const FallbackIcon = fallbackIcons[card.defaultIconName] || fallbackIcons.customerService; // Default to a generic one if specific not found
              let iconPreviewElement: JSX.Element;
              const selectedMediaItem = card.iconId ? mediaItems.find(m => m.id === card.iconId) : null;

              if (selectedMediaItem) {
                iconPreviewElement = <img src={selectedMediaItem.public_url} alt={card.title} className="w-10 h-10 object-contain" />;
              } else {
                iconPreviewElement = FallbackIcon ? <FallbackIcon className="w-10 h-10 text-white" /> : <div className="w-10 h-10 bg-gray-300 rounded"></div>;
              }

              return (
                <fieldset key={card.id || index} className="border border-brand-quaternary p-4 rounded-md">
                  <legend className="text-base sm:text-lg font-semibold text-brand-secondary px-2">Tarjeta {index + 1}: {card.title || `(Tarjeta ${card.defaultIconName})`}</legend>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                    <div className="md:col-span-3">
                      <label className="block text-sm sm:text-base font-medium text-text-primary mb-1">Icono</label>
                      <div className="flex flex-col items-center space-y-2">
                        <div className="w-20 h-20 bg-brand-secondary rounded-lg flex items-center justify-center mb-1">
                          {iconPreviewElement}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleOpenMediaModalForCard(index)}
                          className="btn-outline w-full py-1.5"
                        >
                          {selectedMediaItem ? 'Cambiar Icono' : 'Seleccionar Icono'}
                        </button>
                        {card.iconId && (
                            <button
                                type="button"
                                onClick={() => handleRemoveCustomIcon(index)}
                                className="text-xs text-error hover:underline"
                            >
                                Usar icono por defecto
                            </button>
                        )}
                      </div>
                    </div>
                    <div className="md:col-span-9 space-y-3">
                      <div>
                        <label htmlFor={`card-title-${index}`} className="block text-sm sm:text-base font-medium text-text-primary mb-0.5">Título <span className="text-error">*</span></label>
                        <input
                          type="text"
                          id={`card-title-${index}`}
                          value={card.title}
                          onChange={(e) => handleInputChange(index, 'title', e.target.value)}
                          required
                          className="w-full p-2.5 bg-brand-primary border border-brand-quaternary rounded-md shadow-sm focus:ring-2 focus:ring-brand-tertiary focus:border-transparent text-sm sm:text-base"
                        />
                      </div>
                      <div>
                        <label htmlFor={`card-subtitle-${index}`} className="block text-sm sm:text-base font-medium text-text-primary mb-0.5">Subtítulo <span className="text-error">*</span></label>
                        <textarea
                          id={`card-subtitle-${index}`}
                          value={card.subtitle}
                          onChange={(e) => handleInputChange(index, 'subtitle', e.target.value)}
                          rows={2}
                          required
                          className="w-full p-2.5 bg-brand-primary border border-brand-quaternary rounded-md shadow-sm focus:ring-2 focus:ring-brand-tertiary focus:border-transparent text-sm sm:text-base"
                        />
                      </div>
                    </div>
                  </div>
                </fieldset>
              );
            })}
            {formError && <p className="text-sm text-error mt-3 text-center">{formError}</p>}
          </form>

          <div className="mt-auto pt-6 border-t border-brand-gray-light flex justify-end space-x-3">
            <button type="button" onClick={handleCloseModal} className="btn-ghost">
              Cancelar
            </button>
            <button type="submit" form="value-prop-cards-form" onClick={handleSubmit} className="btn-primary">
              Guardar Cambios
            </button>
          </div>
        </div>
      </div>

      <MediaSelectionModal
        isOpen={isMediaModalOpen}
        onClose={closeMediaModal}
        onSelectMedia={handleSelectIcon}
        modalIdPrefix="value-prop-icon-select"
      />
    </>
  );
};

export default EditValuePropositionCardsModal;
