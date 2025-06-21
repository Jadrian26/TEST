import React, { useState, useEffect, FormEvent } from 'react';
import { useEditableContent } from '../../contexts/EditableContentContext';
import { School, MediaItem } from '../../types'; 
import CloseIcon from '../icons/CloseIcon';
import MediaSelectionModal from './MediaSelectionModal'; 
import useModalState from '../../hooks/useModalState'; 
import useFormHandler from '../../hooks/useFormHandler'; 
import { useNotifications } from '../../contexts/NotificationsContext'; // Added

interface EditSchoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolToEdit: School | null;
}

const EditSchoolModal: React.FC<EditSchoolModalProps> = ({ isOpen, onClose, schoolToEdit }) => {
  const { updateSchool: updateSchoolContext } = useEditableContent();
  const { showNotification } = useNotifications(); // Added
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const { isOpen: isMediaModalOpen, openModal: openMediaModal, closeModal: closeMediaModal } = useModalState();
  
  const form = useFormHandler({
    initialValues: { name: '', logoUrl: '' },
    onSubmit: async (values) => {
      if (!schoolToEdit) {
        showNotification("Error: No hay información del colegio para editar.", 'error');
        return;
      }
      try {
        updateSchoolContext(schoolToEdit.id, { name: values.name, logoUrl: values.logoUrl });
        showNotification(`Colegio "${values.name}" actualizado exitosamente.`, 'success');
        handleCloseModal();
      } catch (error) {
        showNotification('Error al actualizar el colegio.', 'error');
        console.error("Error updating school:", error);
      }
    },
    validate: (values) => {
      const errors: { name?: string; logoUrl?: string } = {};
      if (!values.name.trim()) errors.name = "El nombre del colegio es obligatorio.";
      if (!values.logoUrl.trim()) errors.logoUrl = "El logo del colegio es obligatorio.";
      return errors;
    }
  });

  useEffect(() => {
    if (isOpen && schoolToEdit) {
      form.setValues({ name: schoolToEdit.name, logoUrl: schoolToEdit.logoUrl });
      setLogoPreview(schoolToEdit.logoUrl); 
      form.clearErrors();
      setIsVisible(true);
    } else if (!isOpen) {
      setIsVisible(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, schoolToEdit]);

  const handleCloseModal = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleSelectLogo = (selectedMedia: MediaItem) => {
    form.setValues(prev => ({ ...prev, logoUrl: selectedMedia.dataUrl }));
    setLogoPreview(selectedMedia.dataUrl);
    form.setFieldError('logoUrl', null);
    closeMediaModal();
  };


  if (!isOpen && !isVisible) return null;
  if (!schoolToEdit && isOpen) { 
      return <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[130]"><p className="text-white">Error: Colegio no especificado.</p></div>;
  }


  return (
    <>
      <div
        className={`fixed inset-0 flex items-center justify-center p-4 z-[130] transition-opacity duration-300 ease-in-out ${isVisible ? 'bg-black bg-opacity-70 backdrop-blur-sm' : 'bg-opacity-0 pointer-events-none'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-school-modal-title"
        onClick={handleCloseModal}
      >
        <div
          className={`bg-brand-primary p-6 rounded-lg shadow-modal w-full max-w-md transform transition-all duration-300 ease-out-expo ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 id="edit-school-modal-title" className="text-lg sm:text-xl font-semibold text-brand-secondary">
              Editar Colegio: {schoolToEdit?.name}
            </h2>
            <button onClick={handleCloseModal} className="icon-btn" aria-label="Cerrar modal">
              <CloseIcon />
            </button>
          </div>
          <form onSubmit={form.handleSubmit} noValidate>
            <div className="mb-4">
              <label htmlFor="editSchoolName" className="block text-sm sm:text-base font-medium text-text-primary mb-1">Nombre del Colegio <span className="text-error">*</span></label>
              <input
                type="text"
                id="editSchoolName"
                name="name"
                value={form.values.name}
                onChange={form.handleChange}
                required
                className={`w-full p-2.5 bg-brand-primary border rounded-md shadow-sm focus:ring-2 focus:border-transparent text-sm sm:text-base ${form.errors.name ? 'border-error focus:ring-error' : 'border-brand-quaternary focus:ring-brand-tertiary'}`}
              />
              {form.errors.name && <p className="text-xs text-error mt-1">{form.errors.name}</p>}
            </div>
            <div className="mb-4">
              <label className="block text-sm sm:text-base font-medium text-text-primary mb-1">Logo del Colegio <span className="text-error">*</span></label>
               <button
                type="button"
                onClick={openMediaModal}
                className="btn-outline w-full py-2 mb-2"
              >
                {logoPreview ? 'Cambiar Logo' : 'Seleccionar Logo'}
              </button>
              {logoPreview && (
                <div className="mt-1 border border-brand-quaternary rounded-md p-2 inline-block bg-brand-gray-light h-24 flex items-center justify-center">
                  <img src={logoPreview} alt="Vista previa del logo" className="max-h-full max-w-full object-contain" />
                </div>
              )}
               {!logoPreview && !form.errors.logoUrl && <p className="mt-1 text-xs text-brand-gray-medium">Ningún logo seleccionado.</p>}
               {form.errors.logoUrl && <p className="text-xs text-error mt-1">{form.errors.logoUrl}</p>}
            </div>
            
            {form.formError && <p className="text-sm text-error mb-3">{form.formError}</p>}
            <div className="mt-6 flex justify-end space-x-3">
              <button type="button" onClick={handleCloseModal} className="btn-ghost" disabled={form.isLoading}>
                Cancelar
              </button>
              <button type="submit" className="btn-primary" disabled={form.isLoading}>
                {form.isLoading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>
      <MediaSelectionModal
        isOpen={isMediaModalOpen}
        onClose={closeMediaModal}
        onSelectMedia={handleSelectLogo}
        modalIdPrefix="edit-school-logo"
      />
    </>
  );
};

export default EditSchoolModal;