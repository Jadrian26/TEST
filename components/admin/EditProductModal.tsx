import React, { useState, useEffect, FormEvent } from 'react';
import { useEditableContent } from '../../contexts/EditableContentContext';
import { Product, School, ProductVariant, MediaItem } from '../../types';
import CloseIcon from '../icons/CloseIcon';
import TrashIcon from '../icons/TrashIcon';
import MediaSelectionModal from './MediaSelectionModal';
import useModalState from '../../hooks/useModalState'; 
import useFormHandler from '../../hooks/useFormHandler'; 
import { useNotifications } from '../../contexts/NotificationsContext'; 
import useButtonCooldown from '../../hooks/useButtonCooldown'; // Importar hook

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit: Product | null;
}

const EditProductModal: React.FC<EditProductModalProps> = ({ isOpen, onClose, productToEdit }) => {
  const { schools, updateProduct: updateProductContext } = useEditableContent();
  const { showNotification } = useNotifications(); 

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [currentProductSchoolId, setCurrentProductSchoolId] = useState<string | null | undefined>(null); 
  const [variants, setVariants] = useState<Array<Partial<ProductVariant> & { tempId: string }>>([]);
  const [isVisible, setIsVisible] = useState(false);
  
  const { isOpen: isMediaModalOpen, openModal: openMediaModal, closeModal: closeMediaModal } = useModalState();

  const updateProductAction = async (values: { name: string, description: string, imageUrl: string }) => {
    if (!productToEdit) {
        showNotification("Error: No hay información del producto para editar.", 'error');
        return;
    }
    if (variants.length === 0 || variants.some(v => !v.size?.trim() || v.price === undefined || isNaN(v.price) || v.price <= 0)) {
        showNotification("Todas las variantes deben tener Talla y Precio válido (mayor que 0). El producto debe tener al menos una variante.", 'error');
        return;
    }
    
    const finalVariants: ProductVariant[] = variants.map(v => ({
        id: v.id || `variant-final-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        size: v.size!,
        price: v.price!
    }));
    
    const productUpdateData: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at' | 'orderIndex'>> = {
        name: values.name,
        description: values.description,
        variants: finalVariants,
        imageUrl: values.imageUrl,
    };

    const result = await updateProductContext(productToEdit.id, productUpdateData);
    if (result.success) {
        showNotification(`Producto "${values.name}" actualizado exitosamente.`, 'success');
        handleCloseModal();
    } else {
        showNotification(result.message || 'Error al actualizar el producto.', 'error');
    }
  };
  
  const { 
    trigger: triggerUpdateProduct, 
    isCoolingDown, 
    timeLeft 
  } = useButtonCooldown(updateProductAction, 2500);


  const form = useFormHandler({
    initialValues: { name: '', description: '', imageUrl: '' },
    onSubmit: async (values) => {
      await triggerUpdateProduct(values);
    },
    validate: (values) => {
      const errors: { name?: string; description?: string; imageUrl?: string; } = {}; 
      if (!values.name.trim()) errors.name = "El nombre es obligatorio.";
      if (!values.description.trim()) errors.description = "La descripción es obligatoria.";
      if (!values.imageUrl.trim()) errors.imageUrl = "La imagen es obligatoria.";
      return errors;
    }
  });


  useEffect(() => {
    if (isOpen && productToEdit) {
      form.setValues({
        name: productToEdit.name,
        description: productToEdit.description,
        imageUrl: productToEdit.imageUrl
      });
      setImagePreview(productToEdit.imageUrl);
      setCurrentProductSchoolId(productToEdit.schoolId);
      setVariants(productToEdit.variants.map(v => ({ 
        ...v, 
        tempId: v.id || `variant-edit-${Date.now()}-${Math.random().toString(36).substr(2, 5)}` 
      })));
      form.clearErrors();
      setIsVisible(true);
    } else if (!isOpen) {
      setIsVisible(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, productToEdit]);

  const handleCloseModal = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleSelectImage = (selectedMedia: MediaItem) => {
    form.setValues(prev => ({ ...prev, imageUrl: selectedMedia.public_url }));
    setImagePreview(selectedMedia.public_url);
    form.setFieldError('imageUrl', null);
    closeMediaModal();
  };

  const handleAddVariant = () => {
    setVariants([...variants, { tempId: `variant-new-${Date.now()}-${variants.length}`, size: '', price: undefined }]);
    form.setFormError(null); 
  };

  const handleVariantChange = (tempId: string, field: 'size' | 'price', value: string) => {
    setVariants(currentVariants => 
      currentVariants.map(v => 
        v.tempId === tempId 
        ? { ...v, [field]: field === 'price' ? (value === '' ? undefined : parseFloat(value)) : value } 
        : v
      )
    );
    form.setFormError(null);
  };

  const handleRemoveVariant = (tempId: string) => {
    if (variants.length > 1) {
      setVariants(currentVariants => currentVariants.filter(v => v.tempId !== tempId));
      form.setFormError(null); 
    } else {
      showNotification("Debe haber al menos una variante de producto.", 'error');
    }
  };
  
  const schoolName = currentProductSchoolId ? schools.find(s => s.id === currentProductSchoolId)?.name : 'Producto Genérico (Sin Colegio Asociado)';

  if (!isOpen && !isVisible) return null;
  if (!productToEdit && isOpen) { 
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[120]">
          <p className="text-white bg-error p-4 rounded-md">Error: Producto no especificado para editar.</p>
        </div>
      );
  }

  return (
    <>
      <div
        className={`fixed inset-0 flex items-center justify-center p-4 z-[120] transition-opacity duration-300 ease-in-out ${isVisible ? 'bg-black bg-opacity-70 backdrop-blur-sm' : 'bg-opacity-0 pointer-events-none'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-product-modal-title"
        onClick={handleCloseModal}
      >
        <div
          className={`bg-brand-primary p-6 rounded-lg shadow-modal w-full max-w-xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-out-expo ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 id="edit-product-modal-title" className="text-lg sm:text-xl font-semibold text-brand-secondary">
              Editar Producto: <span className="font-normal">{productToEdit?.name}</span>
            </h2>
            <button onClick={handleCloseModal} className="icon-btn" aria-label="Cerrar modal">
              <CloseIcon />
            </button>
          </div>
          <form onSubmit={form.handleSubmit} noValidate className="space-y-4">
            <div>
              <label htmlFor="editProductNameModal" className="block text-sm sm:text-base font-medium text-text-primary mb-1">Nombre del Producto <span className="text-error">*</span></label>
              <input type="text" id="editProductNameModal" name="name" value={form.values.name} onChange={form.handleChange} required 
                     className={`w-full p-2.5 bg-brand-primary border rounded-md shadow-sm focus:ring-2 focus:border-transparent text-sm sm:text-base ${form.errors.name ? 'border-error focus:ring-error' : 'border-brand-quaternary focus:ring-brand-tertiary'}`} />
              {form.errors.name && <p className="text-xs text-error mt-1">{form.errors.name}</p>}
            </div>
            <div>
              <label htmlFor="editProductDescriptionModal" className="block text-sm sm:text-base font-medium text-text-primary mb-1">Descripción <span className="text-error">*</span></label>
              <textarea id="editProductDescriptionModal" name="description" value={form.values.description} onChange={form.handleChange} rows={3} required 
                        className={`w-full p-2.5 bg-brand-primary border rounded-md shadow-sm focus:ring-2 focus:border-transparent text-sm sm:text-base ${form.errors.description ? 'border-error focus:ring-error' : 'border-brand-quaternary focus:ring-brand-tertiary'}`} />
              {form.errors.description && <p className="text-xs text-error mt-1">{form.errors.description}</p>}
            </div>
            
            <div className="mb-4">
              <label className="block text-sm sm:text-base font-medium text-text-primary mb-1">Imagen del Producto <span className="text-error">*</span></label>
               <button
                type="button"
                onClick={openMediaModal}
                className="btn-outline w-full py-2"
              >
                {imagePreview ? 'Cambiar Imagen' : 'Seleccionar Imagen'}
              </button>
              {imagePreview && (
                <div className="mt-3 border border-brand-quaternary rounded-md p-2 inline-block bg-brand-gray-light">
                  <img src={imagePreview} alt="Vista previa de la imagen" className="h-24 w-auto object-contain" />
                </div>
              )}
               {!imagePreview && !form.errors.imageUrl && <p className="mt-1 text-xs text-brand-gray-medium">Ninguna imagen seleccionada.</p>}
               {form.errors.imageUrl && <p className="text-xs text-error mt-1">{form.errors.imageUrl}</p>}
            </div>

            {schoolName && (
                <div className="p-2.5 bg-brand-gray-light rounded-md border border-brand-quaternary">
                    <p className="text-sm sm:text-base font-medium text-text-primary">
                        Colegio: <span className="font-semibold text-brand-secondary">{schoolName}</span>
                    </p>
                    <p className="text-xs text-brand-gray-medium">El colegio de este producto no se puede cambiar aquí.</p>
                </div>
            )}


            <fieldset className="border border-brand-quaternary p-4 rounded-md mt-6">
              <legend className="text-base sm:text-lg font-semibold text-brand-secondary px-2">Variantes del Producto</legend>
              {variants.map((variant) => (
                <div key={variant.tempId} className="grid grid-cols-12 gap-3 items-end mb-3 p-2 border-b border-brand-gray-light last:border-b-0 last:mb-0">
                  <div className="col-span-5">
                    <label htmlFor={`editVariantSize-${variant.tempId}`} className="block text-sm sm:text-base font-medium text-text-primary mb-0.5">Talla <span className="text-error">*</span></label>
                    <input
                      type="text"
                      id={`editVariantSize-${variant.tempId}`}
                      value={variant.size || ''}
                      onChange={(e) => handleVariantChange(variant.tempId, 'size', e.target.value)}
                      placeholder="Ej: S, M, 10, 12"
                      required
                      className="w-full text-sm sm:text-base p-2 bg-brand-primary border border-brand-quaternary rounded-md shadow-sm focus:ring-2 focus:ring-brand-tertiary focus:border-transparent"
                    />
                  </div>
                  <div className="col-span-5">
                    <label htmlFor={`editVariantPrice-${variant.tempId}`} className="block text-sm sm:text-base font-medium text-text-primary mb-0.5">Precio (B/.) <span className="text-error">*</span></label>
                    <input
                      type="number"
                      id={`editVariantPrice-${variant.tempId}`}
                      value={variant.price === undefined ? '' : variant.price}
                      onChange={(e) => handleVariantChange(variant.tempId, 'price', e.target.value)}
                      placeholder="0.00"
                      required
                      min="0.01"
                      step="0.01"
                      className="w-full text-sm sm:text-base p-2 bg-brand-primary border border-brand-quaternary rounded-md shadow-sm focus:ring-2 focus:ring-brand-tertiary focus:border-transparent"
                    />
                  </div>
                  <div className="col-span-2 flex justify-end">
                    {variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(variant.tempId)}
                        className="icon-btn text-error hover:bg-error/10"
                        aria-label="Eliminar variante"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddVariant}
                className="btn-outline mt-3 w-full py-2"
              >
                + Añadir Variante
              </button>
            </fieldset>
            
            {form.formError && <p className="text-sm text-error mt-3 text-center">{form.formError}</p>}

            <div className="mt-8 flex justify-end space-x-3">
              <button type="button" onClick={handleCloseModal} className="btn-ghost" disabled={form.isLoading || isCoolingDown}>
                Cancelar
              </button>
              <button type="submit" className="btn-primary" disabled={form.isLoading || isCoolingDown}>
                {isCoolingDown ? `Guardando... (${timeLeft}s)` : (form.isLoading ? 'Guardando...' : 'Guardar Cambios')}
              </button>
            </div>
          </form>
        </div>
      </div>
      <MediaSelectionModal
        isOpen={isMediaModalOpen}
        onClose={closeMediaModal}
        onSelectMedia={handleSelectImage}
        modalIdPrefix="edit-product-image"
      />
    </>
  );
};

export default EditProductModal;
