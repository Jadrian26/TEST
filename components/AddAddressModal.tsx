
import React, { useState, useEffect, FormEvent } from 'react';
import { Address } from '../types';
import CloseIcon from './icons/CloseIcon';
import MapPinIcon from './icons/MapPinIcon';
import InteractiveMapModal from './InteractiveMapModal';
import useModalState from '../hooks/useModalState'; 
import useFormHandler from '../hooks/useFormHandler'; 
import { useNotifications } from '../contexts/NotificationsContext'; 

interface InputFieldProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  as?: 'input' | 'textarea';
  rows?: number;
  autoComplete?: string;
  name: string; 
  helperText?: string;
}
const InputField: React.FC<InputFieldProps> = ({ 
  id, label, type = 'text', value, onChange, placeholder, required, error, as = 'input', rows, autoComplete, name, helperText
}) => (
  <div className="mb-4">
    <label htmlFor={id} className="block text-sm sm:text-base font-medium text-text-primary mb-1">
      {label} {required && <span className="text-error">*</span>}
    </label>
    {as === 'textarea' ? (
      <textarea
        id={id} name={name} value={value} onChange={onChange} placeholder={placeholder} required={required} rows={rows || 3}
        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 text-sm sm:text-base transition-colors bg-brand-primary ${
          error ? 'border-error focus:ring-error focus:border-error' : 'border-brand-quaternary focus:ring-brand-tertiary focus:border-brand-tertiary'
        }`}
        aria-invalid={!!error}
      />
    ) : (
      <input
        type={type} id={id} name={name} value={value} onChange={onChange} placeholder={placeholder} required={required} autoComplete={autoComplete}
        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 text-sm sm:text-base transition-colors bg-brand-primary ${
          error ? 'border-error focus:ring-error focus:border-error' : 'border-brand-quaternary focus:ring-brand-tertiary focus:border-brand-tertiary'
        }`}
        aria-invalid={!!error}
      />
    )}
    {helperText && <p className="mt-1 text-xs text-brand-gray-medium">{helperText}</p>}
    {error && <p className="mt-1 text-xs text-error">{error}</p>}
  </div>
);


interface AddAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (addressData: Omit<Address, 'id' | 'isDefault'>, editingAddressId?: string) => void;
  initialData?: Address | null; 
  editingAddressId?: string; 
  modalIdPrefix?: string; 
}

const AddAddressModal: React.FC<AddAddressModalProps> = ({ 
    isOpen, 
    onClose, 
    onSave, 
    initialData, 
    editingAddressId, 
    modalIdPrefix = "global" 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const { showNotification } = useNotifications(); 
  const { isOpen: isInteractiveMapOpen, openModal: openInteractiveMap, closeModal: closeInteractiveMap } = useModalState();
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lon: number } | null>(null);
  
  const isEditing = !!editingAddressId;

  const form = useFormHandler({
    initialValues: { 
      primaryAddress: '', 
      apartmentOrHouseNumber: '', 
      deliveryInstructions: '',
    },
    onSubmit: async (values) => {
      try {
        let wazeUrl, googleMapsUrl;
        const addressString = values.primaryAddress;

        if (selectedCoords && selectedCoords.lat && selectedCoords.lon) {
          wazeUrl = `https://waze.com/ul?ll=${selectedCoords.lat},${selectedCoords.lon}&navigate=yes`;
          googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${selectedCoords.lat},${selectedCoords.lon}`;
        } else {
          const encodedAddress = encodeURIComponent(addressString);
          wazeUrl = `https://www.waze.com/ul?q=${encodedAddress}`;
          googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
        }

        onSave({ 
            primaryAddress: values.primaryAddress, 
            apartmentOrHouseNumber: values.apartmentOrHouseNumber, 
            deliveryInstructions: values.deliveryInstructions,
            wazeUrl: wazeUrl, 
            googleMapsUrl: googleMapsUrl,
            lat: selectedCoords?.lat,
            lon: selectedCoords?.lon,
        }, editingAddressId); 
      } catch (error) {
        showNotification("Error al guardar la dirección.", "error");
        console.error("Error saving address:", error);
      }
    },
    validate: (values) => {
      const errors: { primaryAddress?: string; apartmentOrHouseNumber?: string; deliveryInstructions?: string } = {};
      if (!values.primaryAddress.trim()) errors.primaryAddress = "La dirección es obligatoria.";
      // Campos de número y de indicaciones ya no son obligatorios
      // if (!values.apartmentOrHouseNumber.trim()) errors.apartmentOrHouseNumber = "El número de piso/apto/casa es obligatorio.";
      // if (!values.deliveryInstructions.trim()) errors.deliveryInstructions = "Las indicaciones son obligatorias.";
      return errors;
    }
  });


  useEffect(() => {
    if (isOpen) {
      if (isEditing && initialData) { 
        form.setValues({
          primaryAddress: initialData.primaryAddress,
          apartmentOrHouseNumber: initialData.apartmentOrHouseNumber,
          deliveryInstructions: initialData.deliveryInstructions,
        });
        if (initialData.lat && initialData.lon) {
          setSelectedCoords({ lat: initialData.lat, lon: initialData.lon });
        } else {
          setSelectedCoords(null);
        }
      } else { 
        form.setValues({ primaryAddress: '', apartmentOrHouseNumber: '', deliveryInstructions: '' });
        setSelectedCoords(null);
      }
      form.clearErrors();
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialData, isEditing]);

  const handleCloseModal = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose(); 
    }, 300); 
  };
  
  const handleConfirmMapLocation = (selectedAddress: string, lat?: number, lon?: number) => {
    form.setValues(prev => ({ ...prev, primaryAddress: selectedAddress }));
    if (lat && lon) {
      setSelectedCoords({ lat, lon });
    } else {
      setSelectedCoords(null); // Clear coords if map didn't return them
    }
    closeInteractiveMap();
  };

  if (!isOpen && !isVisible) return null;

  return (
    <>
      <div 
        className={`fixed inset-0 flex items-center justify-center p-4 z-[100] transition-opacity duration-300 ease-in-out ${isVisible ? 'bg-black bg-opacity-70 backdrop-blur-sm' : 'bg-opacity-0 pointer-events-none'}`}
        role="dialog" aria-modal="true" aria-labelledby={`${modalIdPrefix}-address-modal-title`}
        onClick={handleCloseModal}
      >
        <div 
          className={`bg-brand-primary p-5 sm:p-6 rounded-lg shadow-modal w-full max-w-lg max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-out-expo ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4 sm:mb-5">
            <h2 id={`${modalIdPrefix}-address-modal-title`} className="text-lg sm:text-xl font-semibold text-brand-secondary">
              {isEditing ? 'Editar Dirección' : 'Añadir Nueva Dirección'}
            </h2>
            <button onClick={handleCloseModal} className="icon-btn" aria-label="Cerrar modal"> <CloseIcon className="w-5 h-5"/> </button>
          </div>
          <form onSubmit={form.handleSubmit}>
            <InputField 
                id={`${modalIdPrefix}_primaryAddress`} 
                name="primaryAddress"
                label="Dirección de Entrega (o punto de referencia)" 
                value={form.values.primaryAddress} 
                onChange={form.handleChange} 
                required 
                as="textarea"
                rows={3}
                placeholder="Ej: Calle 50, Edificio Tower, frente al Supermercado Rey"
                error={form.errors.primaryAddress}
            />
            <button 
                type="button" 
                onClick={openInteractiveMap}
                className="btn-outline mb-4 w-full flex items-center justify-center py-2"
            >
                <MapPinIcon className="w-4 h-4 mr-2"/> Usar Mapa
            </button>
            <InputField 
                id={`${modalIdPrefix}_apartmentOrHouseNumber`} 
                name="apartmentOrHouseNumber"
                label="Número de piso/apartamento/casa" 
                value={form.values.apartmentOrHouseNumber} 
                onChange={form.handleChange} 
                placeholder="Ej: Piso 10, Apto 10B o Casa #123"
                error={form.errors.apartmentOrHouseNumber}
            />
            <InputField 
                id={`${modalIdPrefix}_deliveryInstructions`} 
                name="deliveryInstructions"
                label="Indicaciones para la entrega" 
                value={form.values.deliveryInstructions} 
                onChange={form.handleChange} 
                as="textarea" 
                rows={3}
                placeholder="Ej: Casa blanca con rejas negras, al lado de la tienda."
                error={form.errors.deliveryInstructions}
                helperText="Opcional. Ayuda al mensajero a encontrar el lugar."
            />

            {form.formError && <p className="text-sm text-error mt-2 mb-3">{form.formError}</p>}
            <div className="mt-6 flex justify-end space-x-3">
              <button type="button" onClick={handleCloseModal} className="btn-ghost py-2 px-4" disabled={form.isLoading}>Cancelar</button>
              <button type="submit" className="btn-primary py-2 px-4" disabled={form.isLoading}>
                {form.isLoading ? 'Guardando...' : (isEditing ? 'Actualizar Dirección' : 'Guardar Dirección')}
              </button>
            </div>
          </form>
        </div>
      </div>

      <InteractiveMapModal
        isOpen={isInteractiveMapOpen}
        onClose={closeInteractiveMap}
        onConfirmLocation={handleConfirmMapLocation}
        initialAddress={form.values.primaryAddress} 
        title="Seleccionar Dirección en Mapa"
        modalIdPrefix={`${modalIdPrefix}-map`}
      />
    </>
  );
};

export default AddAddressModal;