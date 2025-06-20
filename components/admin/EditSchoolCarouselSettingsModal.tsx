import React, { useState, useEffect } from 'react';
import { useEditableContent } from '../../contexts/EditableContentContext';
import CloseIcon from '../icons/CloseIcon';
import { useNotifications } from '../../contexts/NotificationsContext'; 
import useButtonCooldown from '../../hooks/useButtonCooldown'; // Importar hook

interface EditSchoolCarouselSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EditSchoolCarouselSettingsModal: React.FC<EditSchoolCarouselSettingsModalProps> = ({ isOpen, onClose }) => {
  const { 
    schoolCarouselAnimationDurationPerItem,
    updateSchoolCarouselAnimationDurationPerItem
  } = useEditableContent();
  const { showNotification } = useNotifications(); 

  const [currentAnimationDuration, setCurrentAnimationDuration] = useState<number>(schoolCarouselAnimationDurationPerItem);
  const [isVisible, setIsVisible] = useState(false);

  const saveSettingsAction = async () => {
    await updateSchoolCarouselAnimationDurationPerItem(currentAnimationDuration);
    showNotification("Ajustes del carrusel de colegios actualizados.", 'success');
    handleCloseModal();
  };

  const { 
    trigger: triggerSaveChanges, 
    isCoolingDown, 
    timeLeft 
  } = useButtonCooldown(saveSettingsAction, 2000);

  useEffect(() => {
    if (isOpen) {
      setCurrentAnimationDuration(schoolCarouselAnimationDurationPerItem);
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [isOpen, schoolCarouselAnimationDurationPerItem]);

  const handleCloseModal = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleAnimationDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentAnimationDuration(isNaN(val) ? schoolCarouselAnimationDurationPerItem : val);
  };

  if (!isOpen && !isVisible) return null;

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center p-4 z-[150] transition-opacity duration-300 ease-in-out ${isVisible ? 'bg-black bg-opacity-70 backdrop-blur-sm' : 'bg-opacity-0 pointer-events-none'}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-school-carousel-settings-title"
      onClick={handleCloseModal}
    >
      <div
        className={`bg-brand-primary p-6 rounded-lg shadow-modal w-full max-w-md transform transition-all duration-300 ease-out-expo ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 id="edit-school-carousel-settings-title" className="text-lg sm:text-xl font-semibold text-brand-secondary">
            Ajustes del Carrusel de Colegios
          </h2>
          <button onClick={handleCloseModal} className="icon-btn" aria-label="Cerrar modal">
            <CloseIcon />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="schoolCarouselAnimationDuration" className="block text-sm sm:text-base font-medium text-text-primary mb-1">
              Duración de Animación por Colegio (segundos):
            </label>
            <input
              type="number"
              id="schoolCarouselAnimationDuration"
              value={currentAnimationDuration}
              onChange={handleAnimationDurationChange}
              min="1"
              max="20" 
              step="0.5"
              className="w-full p-2.5 bg-brand-primary border border-brand-quaternary rounded-md shadow-sm focus:ring-2 focus:ring-brand-tertiary focus:border-transparent text-sm sm:text-base"
            />
            <p className="text-xs text-brand-gray-medium mt-1">
              Tiempo que tarda cada colegio en pasar. Valores entre 1 y 20 segundos.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
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
  );
};

export default EditSchoolCarouselSettingsModal;
