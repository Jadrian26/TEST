
import React, { useState, useEffect } from 'react';
import { useEditableContent } from '../../contexts/EditableContentContext';
import { useMedia } from '../../contexts/MediaContext';
import { MediaItem, PdfConfig } from '../../types';
import MediaSelectionModal from '../../components/admin/MediaSelectionModal';
import useModalState from '../../hooks/useModalState';
import { useNotifications } from '../../contexts/NotificationsContext';
import MediaIcon from '../../components/admin/icons/MediaIcon';
import SettingsIcon from '../../components/admin/icons/SettingsIcon'; // Reuse or create specific PDF icon
import { APP_NAME, SECONDARY_COLOR } from '../../constants';


const AdminPdfConfigPage: React.FC = () => {
  const { pdfConfig, updatePdfConfig: updatePdfConfigContext, isLoading: isLoadingContent } = useEditableContent();
  const { mediaItems, isLoadingMedia } = useMedia();
  const { showNotification } = useNotifications();

  const [currentConfig, setCurrentConfig] = useState<PdfConfig>(pdfConfig);
  const [isSaving, setIsSaving] = useState(false);

  const { isOpen: isMediaModalOpen, openModal: openMediaModal, closeModal: closeMediaModal } = useModalState();

  useEffect(() => {
    if (!isLoadingContent) {
      setCurrentConfig(pdfConfig);
    }
  }, [pdfConfig, isLoadingContent]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentConfig(prev => ({ ...prev, [name]: value }));
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentConfig(prev => ({ ...prev, accentColor: e.target.value }));
  };
  
  const handleSelectLogo = (selectedMedia: MediaItem) => {
    setCurrentConfig(prev => ({ ...prev, logoId: selectedMedia.id }));
    closeMediaModal();
  };

  const handleRemoveLogo = () => {
    setCurrentConfig(prev => ({ ...prev, logoId: null }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // Prepare data for context, removing client-side only properties if any
      const configToSave: Partial<Omit<PdfConfig, 'updated_at'>> = { ...currentConfig };
      const result = await updatePdfConfigContext(configToSave);
      if(result.success) {
        showNotification("Configuración del PDF actualizada exitosamente.", "success");
      } else {
        showNotification(result.message || "Error al actualizar la configuración del PDF.", "error");
      }
    } catch (error) {
      showNotification("Error al actualizar la configuración del PDF.", "error");
      console.error("Error updating PDF config:", error);
    } finally {
      setIsSaving(false);
    }
  };
  
  const logoPreviewUrl = currentConfig.logoId ? mediaItems.find(item => item.id === currentConfig.logoId)?.public_url : null;

  if (isLoadingContent || isLoadingMedia) {
    return <div className="text-center py-10 text-text-secondary">Cargando configuración...</div>;
  }

  const inputBaseClasses = `w-full p-2.5 bg-brand-primary border rounded-md shadow-sm focus:ring-2 focus:border-transparent text-sm sm:text-base transition-colors duration-150 placeholder:text-brand-gray-medium border-brand-quaternary focus:ring-brand-tertiary`;

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-brand-quaternary border-opacity-30">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-brand-secondary flex items-center">
          <SettingsIcon className="w-7 h-7 sm:w-8 sm:h-8 mr-2 sm:mr-3 text-brand-tertiary" /> Configuración de PDF para Pedidos
        </h1>
        <p className="text-text-secondary text-base sm:text-lg mt-1">Personaliza la apariencia y contenido de los PDFs de los pedidos.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Logo Section */}
        <section className="bg-brand-primary p-5 rounded-lg shadow-card">
          <h2 className="text-lg font-semibold text-brand-secondary mb-3">Logo del PDF</h2>
          <div className="flex items-center gap-4 mb-2">
            <div className="w-32 h-16 p-1 border border-brand-quaternary rounded-md bg-brand-gray-light flex items-center justify-center">
              {logoPreviewUrl ? (
                <img src={logoPreviewUrl} alt="Logo Preview" className="max-h-full max-w-full object-contain" />
              ) : (
                <MediaIcon className="w-8 h-8 text-brand-gray-medium" />
              )}
            </div>
            <div className="space-x-2">
              <button type="button" onClick={openMediaModal} className="btn-outline text-sm">
                {logoPreviewUrl ? 'Cambiar Logo' : 'Seleccionar Logo'}
              </button>
              {logoPreviewUrl && (
                <button type="button" onClick={handleRemoveLogo} className="btn-ghost !text-error hover:!bg-error/10 text-sm">
                  Quitar Logo
                </button>
              )}
            </div>
          </div>
           <p className="text-xs text-brand-gray-medium">Si no se selecciona un logo, se usará el logo por defecto del sistema.</p>
        </section>

        {/* Company Info Section */}
        <section className="bg-brand-primary p-5 rounded-lg shadow-card">
          <h2 className="text-lg font-semibold text-brand-secondary mb-3">Información de la Empresa (Para PDF)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="pdfCompanyName" className="block text-sm font-medium text-text-primary mb-1">Nombre de la Empresa</label>
              <input type="text" name="companyName" id="pdfCompanyName" value={currentConfig.companyName} onChange={handleChange} className={inputBaseClasses} placeholder={APP_NAME} />
            </div>
            <div>
              <label htmlFor="pdfContactPhone" className="block text-sm font-medium text-text-primary mb-1">Teléfono de Contacto</label>
              <input type="tel" name="contactPhone" id="pdfContactPhone" value={currentConfig.contactPhone} onChange={handleChange} className={inputBaseClasses} placeholder="Ej: +507 123-4567" />
            </div>
            <div>
              <label htmlFor="pdfContactEmail" className="block text-sm font-medium text-text-primary mb-1">Email de Contacto</label>
              <input type="email" name="contactEmail" id="pdfContactEmail" value={currentConfig.contactEmail} onChange={handleChange} className={inputBaseClasses} placeholder="Ej: contacto@empresa.com" />
            </div>
            <div>
              <label htmlFor="pdfWebsite" className="block text-sm font-medium text-text-primary mb-1">Sitio Web</label>
              <input type="url" name="website" id="pdfWebsite" value={currentConfig.website} onChange={handleChange} className={inputBaseClasses} placeholder="Ej: www.empresa.com" />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="pdfAddress" className="block text-sm font-medium text-text-primary mb-1">Dirección</label>
              <textarea name="address" id="pdfAddress" value={currentConfig.address} onChange={handleChange} rows={2} className={inputBaseClasses} placeholder="Ej: Edificio Principal, Calle 1, Ciudad" />
            </div>
          </div>
        </section>

        {/* Footer and Accent Color Section */}
        <section className="bg-brand-primary p-5 rounded-lg shadow-card">
          <h2 className="text-lg font-semibold text-brand-secondary mb-3">Personalización Adicional del PDF</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="pdfFooterText" className="block text-sm font-medium text-text-primary mb-1">Texto del Pie de Página</label>
              <input type="text" name="footerText" id="pdfFooterText" value={currentConfig.footerText} onChange={handleChange} className={inputBaseClasses} placeholder="Gracias por su compra." />
            </div>
            <div>
              <label htmlFor="pdfAccentColor" className="block text-sm font-medium text-text-primary mb-1">Color de Acento</label>
              <div className="flex items-center gap-2">
                <input type="color" name="accentColor" id="pdfAccentColor" value={currentConfig.accentColor} onChange={handleColorChange} className="h-10 w-16 p-0 border-none cursor-pointer rounded-md shadow-sm" />
                <input type="text" value={currentConfig.accentColor} onChange={handleColorChange} className={`${inputBaseClasses} w-auto flex-1`} placeholder={SECONDARY_COLOR} />
              </div>
              <p className="text-xs text-brand-gray-medium mt-1">Usado para encabezados de tabla y títulos.</p>
            </div>
          </div>
        </section>
        
        <div className="flex justify-end pt-4 border-t border-brand-gray-light">
          <button type="submit" className="btn-primary" disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Guardar Configuración'}
          </button>
        </div>
      </form>

      <MediaSelectionModal
        isOpen={isMediaModalOpen}
        onClose={closeMediaModal}
        onSelectMedia={handleSelectLogo}
        modalIdPrefix="pdf-logo-select"
      />
    </div>
  );
};

export default AdminPdfConfigPage;
