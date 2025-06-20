import React, { useState, useEffect, FormEvent } from 'react';
import { useEditableContent } from '../../contexts/EditableContentContext';
import { useMedia } from '../../contexts/MediaContext';
import { MediaItem } from '../../types';
import CloseIcon from '../icons/CloseIcon';
import MediaSelectionModal from './MediaSelectionModal';
import MediaIcon from './icons/MediaIcon'; 
import useModalState from '../../hooks/useModalState'; 
import useFormHandler from '../../hooks/useFormHandler'; 
import { useNotifications } from '../../contexts/NotificationsContext'; 
import WazeIcon from '../icons/WazeIcon'; 
import GoogleMapsIcon from '../icons/GoogleMapsIcon';
import useButtonCooldown from '../../hooks/useButtonCooldown'; // Importar hook


interface EditVisitStoreSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EditVisitStoreSectionModal: React.FC<EditVisitStoreSectionModalProps> = ({ isOpen, onClose }) => {
  const {
    storeWazeUrl, storeGoogleMapsUrl, storeAddressDescription,
    visitStoreSection_MainImageId, visitStoreSection_WazeButtonIconId, visitStoreSection_GoogleMapsButtonIconId,
    updateStoreWazeUrl, updateStoreGoogleMapsUrl, updateStoreAddressDescription,
    updateVisitStoreSection_MainImageId, updateVisitStoreSection_WazeButtonIconId, updateVisitStoreSection_GoogleMapsButtonIconId,
  } = useEditableContent();
  const { mediaItems } = useMedia();
  const { showNotification } = useNotifications(); 

  const [currentMainImageId, setCurrentMainImageId] = useState<string | null>(null);
  const [currentWazeIconId, setCurrentWazeIconId] = useState<string | null>(null);
  const [currentGMapsIconId, setCurrentGMapsIconId] = useState<string | null>(null);
  
  const [isVisible, setIsVisible] = useState(false);
  const { isOpen: isMediaModalOpen, openModal: openMediaModalDirect, closeModal: closeMediaModal } = useModalState();
  const [mediaTargetField, setMediaTargetField] = useState<'mainImage' | 'wazeIcon' | 'gmapsIcon' | null>(null);

  const saveVisitStoreAction = async (values: { addressDesc: string, wazeUrl: string, gmapsUrl: string }) => {
    await Promise.all([
        updateVisitStoreSection_MainImageId(currentMainImageId),
        updateStoreAddressDescription(values.addressDesc),
        updateStoreWazeUrl(values.wazeUrl),
        updateVisitStoreSection_WazeButtonIconId(currentWazeIconId),
        updateStoreGoogleMapsUrl(values.gmapsUrl),
        updateVisitStoreSection_GoogleMapsButtonIconId(currentGMapsIconId)
    ]);
    showNotification("Sección 'Visita Nuestra Tienda' actualizada.", 'success');
    handleCloseModal();
  };
  
  const { 
    trigger: triggerSaveChanges, 
    isCoolingDown, 
    timeLeft 
  } = useButtonCooldown(
    async (values: { addressDesc: string, wazeUrl: string, gmapsUrl: string }) => saveVisitStoreAction(values), 
    2000
  );

  const form = useFormHandler({
    initialValues: {
      addressDesc: storeAddressDescription,
      wazeUrl: storeWazeUrl,
      gmapsUrl: storeGoogleMapsUrl,
    },
    onSubmit: async (values) => {
      await triggerSaveChanges(values);
    },
    validate: (values) => {
      const errors: { addressDesc?: string; wazeUrl?: string; gmapsUrl?: string; } = {};
      if (!values.addressDesc.trim()) errors.addressDesc = "La descripción de la dirección es obligatoria.";
      if (!values.wazeUrl.trim()) errors.wazeUrl = "La URL de Waze es obligatoria.";
      else try { new URL(values.wazeUrl); } catch { errors.wazeUrl = "URL de Waze no válida."; }
      if (!values.gmapsUrl.trim()) errors.gmapsUrl = "La URL de Google Maps es obligatoria.";
      else try { new URL(values.gmapsUrl); } catch { errors.gmapsUrl = "URL de Google Maps no válida."; }
      return errors;
    }
  });


  useEffect(() => {
    if (isOpen) {
      setCurrentMainImageId(visitStoreSection_MainImageId);
      form.setValues({
        addressDesc: storeAddressDescription,
        wazeUrl: storeWazeUrl,
        gmapsUrl: storeGoogleMapsUrl,
      });
      setCurrentWazeIconId(visitStoreSection_WazeButtonIconId);
      setCurrentGMapsIconId(visitStoreSection_GoogleMapsButtonIconId);
      form.clearErrors();
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, visitStoreSection_MainImageId, storeAddressDescription, storeWazeUrl, visitStoreSection_WazeButtonIconId, storeGoogleMapsUrl, visitStoreSection_GoogleMapsButtonIconId]);

  const handleCloseModal = () => {
    setIsVisible(false);
    setTimeout(() => onClose(), 300);
  };

  const openMediaSelector = (target: 'mainImage' | 'wazeIcon' | 'gmapsIcon') => {
    setMediaTargetField(target);
    openMediaModalDirect();
  };

  const handleSelectMedia = (selectedMedia: MediaItem) => {
    if (mediaTargetField === 'mainImage') setCurrentMainImageId(selectedMedia.id);
    else if (mediaTargetField === 'wazeIcon') setCurrentWazeIconId(selectedMedia.id);
    else if (mediaTargetField === 'gmapsIcon') setCurrentGMapsIconId(selectedMedia.id);
    closeMediaModal();
    setMediaTargetField(null);
  };
  
  const renderPreview = (mediaId: string | null, targetFieldForDefault: 'wazeIcon' | 'gmapsIcon' | 'mainImage') => {
    const item = mediaItems.find(m => m.id === mediaId);
    if (item) return <img src={item.public_url} alt="Preview" className="h-20 w-auto object-contain rounded border border-brand-quaternary p-1 bg-white" />;
    
    let defaultIconElement: React.ReactNode = <MediaIcon className="w-10 h-10 text-brand-gray-medium" />;
    if (targetFieldForDefault === 'wazeIcon') {
        defaultIconElement = <WazeIcon className="w-8 h-8 text-brand-secondary" />;
    } else if (targetFieldForDefault === 'gmapsIcon') {
        defaultIconElement = <GoogleMapsIcon className="w-8 h-8 text-brand-secondary" />;
    }

    return <div className="h-20 w-20 flex items-center justify-center bg-brand-gray-light rounded border border-brand-quaternary p-1">{defaultIconElement}</div>;
  };

  const inputBaseClasses = `w-full p-2.5 bg-brand-primary border rounded-md shadow-sm focus:ring-2 focus:border-transparent text-sm sm:text-base transition-colors duration-150 placeholder:text-brand-gray-medium border-brand-quaternary focus:ring-brand-tertiary`;


  if (!isOpen && !isVisible) return null;

  return (
    <>
      <div
        className={`fixed inset-0 flex items-center justify-center p-4 z-[150] transition-opacity duration-300 ease-in-out ${isVisible ? 'bg-black bg-opacity-70 backdrop-blur-sm' : 'bg-opacity-0 pointer-events-none'}`}
        role="dialog" aria-modal="true" aria-labelledby="edit-visit-store-title" onClick={handleCloseModal}
      >
        <div
          className={`bg-brand-primary p-6 rounded-lg shadow-modal w-full max-w-2xl max-h-[90vh] flex flex-col transform transition-all duration-300 ease-out-expo ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-brand-gray-light">
            <h2 id="edit-visit-store-title" className="text-lg sm:text-xl font-semibold text-brand-secondary">
              Editar Sección "Visita Nuestra Tienda"
            </h2>
            <button onClick={handleCloseModal} className="icon-btn" aria-label="Cerrar modal"><CloseIcon /></button>
          </div>

          <form onSubmit={form.handleSubmit} className="flex-grow overflow-y-auto pr-1 space-y-5">
            <div>
              <label className="block text-sm sm:text-base font-medium text-text-primary mb-1.5">Imagen Principal de la Sección</label>
              <div className="flex items-center gap-4">
                {renderPreview(currentMainImageId, 'mainImage')}
                <button type="button" onClick={() => openMediaSelector('mainImage')} className="btn-outline">
                  {currentMainImageId ? 'Cambiar Imagen' : 'Seleccionar Imagen'}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="storeAddressDescEdit" className="block text-sm sm:text-base font-medium text-text-primary mb-1">Descripción de Dirección <span className="text-error">*</span></label>
              <textarea id="storeAddressDescEdit" name="addressDesc" value={form.values.addressDesc} onChange={form.handleChange} rows={3} required 
                        className={`${inputBaseClasses} ${form.errors.addressDesc ? 'border-error focus:ring-error' : 'border-brand-quaternary focus:ring-brand-tertiary'}`} />
              {form.errors.addressDesc && <p className="text-xs text-error mt-1">{form.errors.addressDesc}</p>}
            </div>
            
            <fieldset className="border border-brand-quaternary p-3 rounded-md">
                <legend className="text-base sm:text-lg font-medium text-text-primary px-1">Botón de Waze</legend>
                <div className="space-y-3 mt-1">
                    <div>
                        <label htmlFor="storeWazeUrlEdit" className="block text-sm sm:text-base font-medium text-text-primary mb-0.5">URL de Waze <span className="text-error">*</span></label>
                        <input type="url" id="storeWazeUrlEdit" name="wazeUrl" value={form.values.wazeUrl} onChange={form.handleChange} required placeholder="https://www.waze.com/..." 
                               className={`${inputBaseClasses} ${form.errors.wazeUrl ? 'border-error focus:ring-error' : 'border-brand-quaternary focus:ring-brand-tertiary'}`} />
                        {form.errors.wazeUrl && <p className="text-xs text-error mt-1">{form.errors.wazeUrl}</p>}
                    </div>
                    <div>
                        <label className="block text-sm sm:text-base font-medium text-text-primary mb-1">Icono del Botón de Waze (Opcional)</label>
                        <div className="flex items-center gap-3">
                            {renderPreview(currentWazeIconId, 'wazeIcon')}
                            <button type="button" onClick={() => openMediaSelector('wazeIcon')} className="btn-outline">
                                {currentWazeIconId ? 'Cambiar Icono' : 'Seleccionar Icono'}
                            </button>
                            {currentWazeIconId && <button type="button" onClick={() => setCurrentWazeIconId(null)} className="text-xs text-error hover:underline">Quitar Icono</button>}
                        </div>
                    </div>
                </div>
            </fieldset>

            <fieldset className="border border-brand-quaternary p-3 rounded-md">
                <legend className="text-base sm:text-lg font-medium text-text-primary px-1">Botón de Google Maps</legend>
                 <div className="space-y-3 mt-1">
                    <div>
                        <label htmlFor="storeGMapsUrlEdit" className="block text-sm sm:text-base font-medium text-text-primary mb-0.5">URL de Google Maps <span className="text-error">*</span></label>
                        <input type="url" id="storeGMapsUrlEdit" name="gmapsUrl" value={form.values.gmapsUrl} onChange={form.handleChange} required placeholder="https://www.google.com/maps/..." 
                               className={`${inputBaseClasses} ${form.errors.gmapsUrl ? 'border-error focus:ring-error' : 'border-brand-quaternary focus:ring-brand-tertiary'}`} />
                        {form.errors.gmapsUrl && <p className="text-xs text-error mt-1">{form.errors.gmapsUrl}</p>}
                    </div>
                    <div>
                        <label className="block text-sm sm:text-base font-medium text-text-primary mb-1">Icono del Botón de Google Maps (Opcional)</label>
                        <div className="flex items-center gap-3">
                           {renderPreview(currentGMapsIconId, 'gmapsIcon')}
                            <button type="button" onClick={() => openMediaSelector('gmapsIcon')} className="btn-outline">
                                {currentGMapsIconId ? 'Cambiar Icono' : 'Seleccionar Icono'}
                            </button>
                             {currentGMapsIconId && <button type="button" onClick={() => setCurrentGMapsIconId(null)} className="text-xs text-error hover:underline">Quitar Icono</button>}
                        </div>
                    </div>
                </div>
            </fieldset>

            {form.formError && <p className="text-sm text-error mt-2 text-center">{form.formError}</p>}
          </form>

          <div className="mt-auto pt-6 border-t border-brand-gray-light flex justify-end space-x-3">
            <button type="button" onClick={handleCloseModal} className="btn-ghost" disabled={form.isLoading || isCoolingDown}>Cancelar</button>
            <button 
              type="button" 
              onClick={form.handleSubmit as any} 
              className="btn-primary" 
              disabled={form.isLoading || isCoolingDown}
            >
              {isCoolingDown ? `Guardando... (${timeLeft}s)` : (form.isLoading ? 'Guardando...' : 'Guardar Cambios')}
            </button>
          </div>
        </div>
      </div>
      <MediaSelectionModal
        isOpen={isMediaModalOpen}
        onClose={closeMediaModal}
        onSelectMedia={handleSelectMedia}
        modalIdPrefix="visit-store-media-select"
      />
    </>
  );
};

export default EditVisitStoreSectionModal;
