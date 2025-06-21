import React, { useState, useEffect, ChangeEvent, FormEvent, useMemo, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom'; 
import { useAuth } from '../contexts/AuthContext';
import { useEditableContent } from '../contexts/EditableContentContext'; 
import { UserProfile, Address, Order, School, SchoolApprovalStatus, UserSchoolAffiliation } from '../types';
import PhoneNumberInput from '../components/PhoneNumberInput';
import AddAddressModal from '../components/AddAddressModal'; 
import ForgotPasswordModal from '../components/ForgotPasswordModal'; 
import useFormHandler from '../hooks/useFormHandler'; 
import useModalState from '../hooks/useModalState';
import { useNotifications } from '../contexts/NotificationsContext'; 
import PlusCircleIcon from '../components/icons/PlusCircleIcon';
import CloseIcon from '../components/icons/CloseIcon';

// SVG Icons for Password Toggle
const EyeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const EyeSlashIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243l-4.243-4.243" />
  </svg>
);

interface InputFieldProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void; 
  placeholder?: string;
  required?: boolean;
  error?: string;
  wrapperClassName?: string;
  as?: 'input' | 'textarea' | 'select'; 
  rows?: number;
  showPasswordToggle?: boolean; 
  children?: React.ReactNode; 
  pattern?: string;
  title?: string;
  disabled?: boolean;
  name?: string; 
}

const InputField: React.FC<InputFieldProps> = ({ 
  id, label, type = 'text', value, onChange, placeholder, required, error, wrapperClassName, as = 'input', rows, showPasswordToggle, children, pattern, title, disabled, name
}) => {
  const [currentType, setCurrentType] = useState(type);

  const togglePasswordVisibility = () => {
    setCurrentType(prevType => prevType === 'password' ? 'text' : 'password');
  };
  
  const commonClasses = `w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 text-sm sm:text-base transition-colors bg-brand-primary ${
    error ? 'border-error focus:ring-error focus:border-error' : 'border-brand-quaternary focus:ring-brand-tertiary focus:border-brand-tertiary'
  } ${disabled ? 'bg-brand-gray-light cursor-not-allowed opacity-70' : ''}`;

  return (
    <div className={`mb-4 ${wrapperClassName || ''}`}>
      <label htmlFor={id} className="block text-sm sm:text-base font-medium text-text-primary mb-1">
        {label} {required && <span className="text-error">*</span>}
      </label>
      <div className="relative">
        {as === 'textarea' ? (
          <textarea
            id={id} name={name || id} value={value} onChange={onChange} placeholder={placeholder} required={required} rows={rows || 3}
            className={commonClasses}
            aria-invalid={!!error}
            disabled={disabled}
          />
        ) : as === 'select' ? (
          <select
            id={id} name={name || id} value={value} onChange={onChange} required={required}
            className={commonClasses}
            aria-invalid={!!error}
            disabled={disabled}
          >
            {children}
          </select>
        ) : (
          <input
            type={currentType} id={id} name={name || id} value={value} onChange={onChange} placeholder={placeholder} required={required}
            pattern={pattern} title={title}
            className={`${commonClasses} ${showPasswordToggle ? 'pr-10' : ''}`}
            aria-invalid={!!error}
            disabled={disabled}
          />
        )}
        {showPasswordToggle && type === 'password' && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-brand-gray-medium hover:text-brand-secondary focus:outline-none"
            aria-label={currentType === 'password' ? 'Mostrar contraseña' : 'Ocultar contraseña'}
            disabled={disabled}
          >
            {currentType === 'password' ? <EyeIcon className="w-5 h-5" /> : <EyeSlashIcon className="w-5 h-5" />}
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-error">{error}</p>}
    </div>
  );
};

interface AddressCardProps {
  address: Address;
  onDelete: (addressId: string) => void;
  onSetDefault: (addressId: string) => void;
  onEdit: (address: Address) => void; 
}
const AddressCard: React.FC<AddressCardProps> = ({ address, onDelete, onSetDefault, onEdit }) => (
  <div className="bg-brand-gray-light p-4 rounded-md border border-brand-quaternary shadow-subtle flex flex-col h-full">
    <p className="font-semibold text-text-primary text-sm sm:text-base">{address.primaryAddress}</p>
    {address.apartmentOrHouseNumber && <p className="text-xs sm:text-sm text-text-secondary">Nº Piso/Apto/Casa: {address.apartmentOrHouseNumber}</p>}
    {address.deliveryInstructions && <p className="text-xs sm:text-sm text-text-secondary mt-1 pt-1 border-t border-brand-quaternary border-opacity-30">Indicaciones: {address.deliveryInstructions}</p>}
    
    <div className="mt-3 pt-3 border-t border-brand-quaternary border-opacity-50 flex flex-wrap gap-2 items-center justify-between">
      {address.isDefault ? (
        <span className="text-xs font-medium text-success bg-success bg-opacity-10 px-2 py-0.5 rounded-full">Predeterminada</span>
      ) : (
        <button onClick={() => onSetDefault(address.id)} className="text-xs text-brand-tertiary hover:underline">Marcar como predeterminada</button>
      )}
      <div className="flex space-x-2 sm:space-x-3">
        <button onClick={() => onEdit(address)} className="text-xs text-brand-secondary hover:underline">Editar</button>
        <button onClick={() => onDelete(address.id)} className="text-xs text-error hover:underline">Eliminar</button>
      </div>
    </div>
  </div>
);

// Modal for Requesting New School Affiliation
interface RequestSchoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableSchools: School[];
  onConfirmRequest: (schoolId: string) => void;
  isLoading?: boolean;
}
const RequestSchoolModal: React.FC<RequestSchoolModalProps> = ({ isOpen, onClose, availableSchools, onConfirmRequest, isLoading }) => {
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedSchoolId('');
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleSubmit = () => {
    if (selectedSchoolId) {
      onConfirmRequest(selectedSchoolId);
    }
  };

  if (!isOpen && !isVisible) return null;

  return (
    <div className={`fixed inset-0 flex items-center justify-center p-4 z-[140] transition-opacity duration-300 ${isVisible ? 'bg-black bg-opacity-70 backdrop-blur-sm' : 'bg-opacity-0 pointer-events-none'}`}>
      <div className={`bg-brand-primary p-6 rounded-lg shadow-modal w-full max-w-md transform transition-all duration-300 ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`} onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-brand-secondary">Solicitar Afiliación a Colegio</h2>
          <button onClick={handleClose} className="icon-btn"><CloseIcon /></button>
        </div>
        <p className="text-sm text-text-secondary mb-4">Selecciona un colegio al que deseas solicitar afiliación. Tu solicitud será revisada por un administrador.</p>
        <select
          value={selectedSchoolId}
          onChange={(e) => setSelectedSchoolId(e.target.value)}
          className="w-full p-2.5 border border-brand-quaternary rounded-md shadow-sm focus:ring-2 focus:ring-brand-tertiary focus:border-transparent text-sm sm:text-base"
          disabled={isLoading || availableSchools.length === 0}
        >
          <option value="" disabled>-- Selecciona un colegio --</option>
          {isLoading ? <option disabled>Cargando colegios...</option> : 
            availableSchools.length === 0 ? <option disabled>No hay más colegios disponibles para solicitar.</option> :
            availableSchools.map(school => (
              <option key={school.id} value={school.id}>{school.name}</option>
            ))
          }
        </select>
        <div className="mt-6 flex justify-end space-x-3">
          <button type="button" onClick={handleClose} className="btn-ghost" disabled={isLoading}>Cancelar</button>
          <button type="button" onClick={handleSubmit} className="btn-primary" disabled={isLoading || !selectedSchoolId || availableSchools.length === 0}>
            {isLoading ? 'Solicitando...' : 'Solicitar'}
          </button>
        </div>
      </div>
    </div>
  );
};


// Confirmation Modal
interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
}
const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, title, message }) => {
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    if (isOpen) setIsVisible(true);
    else setIsVisible(false);
  }, [isOpen]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  if (!isOpen && !isVisible) return null;

  return (
    <div className={`fixed inset-0 flex items-center justify-center p-4 z-[150] transition-opacity duration-300 ${isVisible ? 'bg-black bg-opacity-70 backdrop-blur-sm' : 'bg-opacity-0 pointer-events-none'}`}>
      <div className={`bg-brand-primary p-6 rounded-lg shadow-modal w-full max-w-md transform transition-all duration-300 ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`} onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-brand-secondary">{title}</h2>
          <button onClick={handleClose} className="icon-btn"><CloseIcon /></button>
        </div>
        <p className="text-sm text-text-secondary mb-6">{message}</p>
        <div className="mt-6 flex justify-end">
          <button type="button" onClick={handleClose} className="btn-primary">Aceptar</button>
        </div>
      </div>
    </div>
  );
};


const AccountPage: React.FC = () => {
  const { currentUser, login, register, logout, updateCurrentUserProfile, updateUserAddresses, requestSchoolAffiliation } = useAuth();
  const { schools, isLoading: isLoadingSchools } = useEditableContent(); 
  const location = useLocation();
  const { showNotification } = useNotifications(); 
  const locationState = location.state as { from?: string; message?: string } | undefined;

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [addressToEdit, setAddressToEdit] = useState<Address | null>(null);
  
  const { isOpen: isAddressModalOpen, openModal: openAddressModal, closeModal: closeAddressModal } = useModalState();
  const { isOpen: isForgotPasswordModalOpen, openModal: openForgotPasswordModal, closeModal: closeForgotPasswordModal } = useModalState(); 
  const { isOpen: isRequestSchoolModalOpen, openModal: openRequestSchoolModal, closeModal: closeRequestSchoolModal } = useModalState();
  const { isOpen: isConfirmationModalOpen, openModal: openConfirmationModal, closeModal: closeConfirmationModal } = useModalState();
  const [confirmationModalMessage, setConfirmationModalMessage] = useState('');

  useEffect(() => {
    if (locationState?.message) {
        showNotification(locationState.message, 'info'); 
        window.history.replaceState({}, document.title) 
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationState, showNotification]);

  // Login Form
  const loginForm = useFormHandler({
    initialValues: { email: '', password: '' },
    onSubmit: async (values) => {
      const result = await login(values.email, values.password);
      if (!result.success) {
        showNotification(result.message || 'Error al iniciar sesión.', 'error');
        loginForm.setFieldError('email', ' '); 
        loginForm.setFieldError('password', result.message || 'Error al iniciar sesión.');
      } else {
        showNotification('Inicio de sesión exitoso.', 'success');
      }
    },
    validate: (values) => {
        const errors: Partial<typeof values> = {};
        if (!values.email) errors.email = "El correo es obligatorio.";
        if (!values.password) errors.password = "La contraseña es obligatoria.";
        return errors;
    }
  });

  // Registration Form
  const registrationForm = useFormHandler({
    initialValues: {
      firstName: '', lastName: '', email: '', phone: '', idCardNumber: '', password: '', initialSchoolIdRequest: ''
    },
    onSubmit: async (values) => {
      const result = await register({ 
        firstName: values.firstName, 
        lastName: values.lastName, 
        email: values.email, 
        phone: values.phone, 
        idCardNumber: values.idCardNumber,
        password: values.password,
        initialSchoolIdRequest: values.initialSchoolIdRequest 
      });
      if (!result.success) {
        showNotification(result.message || 'Error al registrar la cuenta.', 'error');
        registrationForm.setFieldError('email', result.message || 'Error al registrar la cuenta.'); 
      } else {
         showNotification(result.message || 'Cuenta creada con éxito. Iniciando sesión...', 'success');
      }
    },
    validate: (values) => {
        const errors: Partial<typeof values> = {};
        if (!values.firstName) errors.firstName = "El nombre es obligatorio.";
        if (!values.lastName) errors.lastName = "El apellido es obligatorio.";
        if (!values.email) errors.email = "El correo es obligatorio.";
        if (!values.phone) errors.phone = "El teléfono es obligatorio.";
        else if (!/^[6234789]\d{2,3}-\d{4}$/.test(values.phone) && !/^\d{7,8}$/.test(values.phone.replace(/-/g, '')) ) {
             errors.phone = "Formato de teléfono inválido. Ej: 6123-4567 o 234-5678.";
        }
        if (!values.idCardNumber) errors.idCardNumber = "La cédula es obligatoria.";
        if (!values.password) errors.password = "La contraseña es obligatoria.";
        else if (values.password.length < 6) errors.password = "La contraseña debe tener al menos 6 caracteres.";
        if (!values.initialSchoolIdRequest) errors.initialSchoolIdRequest = "Debes seleccionar un colegio para tu solicitud inicial.";
        return errors;
    }
  });

  // Account Update Form (Profile details only, no school requests here)
  const accountUpdateForm = useFormHandler({
    initialValues: {
      firstName: currentUser?.firstName || '',
      lastName: currentUser?.lastName || '',
      email: currentUser?.email || '',
      phone: currentUser?.phone || '',
      idCardNumber: currentUser?.idCardNumber || '',
    },
    onSubmit: async (values) => {
      if (!currentUser) return;
      
      if (!values.idCardNumber.trim()) {
        showNotification('La cédula de identificación es obligatoria.', 'error');
        accountUpdateForm.setFieldError('idCardNumber', 'La cédula de identificación es obligatoria.');
        return;
      }
      
      const profileUpdateData: Partial<Pick<UserProfile, 'firstName' | 'lastName' | 'email' | 'phone' | 'idCardNumber'>> = {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email, 
          phone: values.phone,
          idCardNumber: values.idCardNumber,
      };
      
      const result = await updateCurrentUserProfile(profileUpdateData);
      showNotification(result.message || (result.success ? 'Detalles actualizados.' : 'Error al actualizar.'), result.success ? 'success' : 'error');
      if (!result.success) {
        accountUpdateForm.setFieldError('email', result.message || 'Error al actualizar.');
      }
    },
    validate: (values) => {
        const errors: Partial<typeof values> = {};
        if (!values.firstName) errors.firstName = "El nombre es obligatorio.";
        if (!values.lastName) errors.lastName = "El apellido es obligatorio.";
        if (!values.email) errors.email = "El correo es obligatorio.";
        if (values.phone && !/^[6234789]\d{2,3}-\d{4}$/.test(values.phone) && !/^\d{7,8}$/.test(values.phone.replace(/-/g, '')) ) {
             errors.phone = "Formato de teléfono inválido. Ej: 6123-4567 o 234-5678.";
        }
        if (!values.idCardNumber) errors.idCardNumber = "La cédula es obligatoria.";
        return errors;
    }
  });
  
  useEffect(() => {
    if (currentUser) {
      accountUpdateForm.setValues({
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        email: currentUser.email,
        phone: currentUser.phone || '',
        idCardNumber: currentUser.idCardNumber || '',
      });
      loginForm.setValues({ email: '', password: '' });
      loginForm.clearErrors();
      registrationForm.setValues({ firstName: '', lastName: '', email: '', phone: '', idCardNumber: '', password: '', initialSchoolIdRequest: ''});
      registrationForm.clearErrors();
    } else {
      accountUpdateForm.setValues({ firstName: '', lastName: '', email: '', phone: '', idCardNumber: ''});
      accountUpdateForm.clearErrors();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const handleOpenEditAddressModal = (address: Address) => {
    setAddressToEdit(address);
    openAddressModal();
  };

  const handleSaveAddress = async (addressData: Omit<Address, 'id' | 'isDefault'>, editingAddressId?: string) => {
    if (!currentUser) return;
    let updatedAddresses: Address[];
    let successMessage: string;

    if (editingAddressId) { 
      updatedAddresses = currentUser.addresses.map(addr =>
        addr.id === editingAddressId ? { ...addr, ...addressData } : addr
      );
      successMessage = 'Dirección actualizada.';
    } else { 
      const newAddress: Address = {
        ...addressData,
        id: `addr-${Date.now()}`,
        isDefault: currentUser.addresses.length === 0,
      };
      updatedAddresses = [...currentUser.addresses, newAddress];
      successMessage = 'Dirección añadida.';
    }
    
    const result = await updateUserAddresses(updatedAddresses);
    showNotification(result.message || (result.success ? successMessage : 'Error al guardar dirección.'), result.success ? 'success' : 'error');
    if (result.success) {
        closeAddressModal(); 
        setAddressToEdit(null); 
    }
  };


  const handleDeleteAddress = async (addressId: string) => {
    if (!currentUser) return;
    let updatedAddresses = currentUser.addresses.filter(addr => addr.id !== addressId);
    const wasDefault = currentUser.addresses.find(a => a.id === addressId)?.isDefault;
    if (wasDefault && updatedAddresses.length > 0 && !updatedAddresses.some(a => a.isDefault)) {
        updatedAddresses[0].isDefault = true;
    }
    const result = await updateUserAddresses(updatedAddresses);
    showNotification(result.message || (result.success ? 'Dirección eliminada.' : 'Error al eliminar dirección.'), result.success ? 'success' : 'error');
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    if (!currentUser) return;
    const updatedAddresses = currentUser.addresses.map(addr => ({
        ...addr,
        isDefault: addr.id === addressId,
    }));
    const result = await updateUserAddresses(updatedAddresses);
    showNotification(result.message || (result.success ? 'Dirección predeterminada actualizada.' : 'Error al actualizar dirección.'), result.success ? 'success' : 'error');
  };

  const getOrderStatusText = (status: Order['status']): string => {
    switch (status) {
      case 'Processing': return 'Procesando';
      case 'Shipped': return 'Enviado';
      case 'Delivered': return 'Entregado';
      case 'Cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const getSchoolStatusText = (status: SchoolApprovalStatus | undefined): string => {
    if (!status) return 'Desconocido';
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'approved': return 'Aprobado';
      case 'rejected': return 'Rechazado';
      default: return 'Desconocido';
    }
  };
  
  const getSchoolName = (schoolId: string): string => schools.find(s => s.id === schoolId)?.name || 'Colegio Desconocido';

  const availableSchoolsForNewRequest = useMemo(() => {
    if (!currentUser || isLoadingSchools) return [];
    const affiliatedSchoolIds = new Set(currentUser.affiliations.map(aff => aff.schoolId));
    return schools.filter(school => !affiliatedSchoolIds.has(school.id));
  }, [currentUser, schools, isLoadingSchools]);

  const handleConfirmNewSchoolRequest = async (schoolId: string) => {
    const result = await requestSchoolAffiliation(schoolId);
    showNotification(result.message || (result.success ? 'Solicitud enviada.' : 'Error al enviar solicitud.'), result.success ? 'success' : 'error');
    if (result.success) {
      closeRequestSchoolModal();
      const schoolName = schools.find(s => s.id === schoolId)?.name || "el colegio seleccionado";
      setConfirmationModalMessage(`Solicitud para agregar colegio ${schoolName} ha sido enviada. Por favor, póngase en contacto si requiere agilizar el proceso.`);
      openConfirmationModal();
    }
  };


  if (!currentUser) {
    return (
      <>
      <div className="max-w-md mx-auto bg-brand-primary p-6 sm:p-8 rounded-lg shadow-card">
        <div className="flex border-b border-brand-quaternary mb-6">
          <button
            onClick={() => { setActiveTab('login'); loginForm.clearErrors(); loginForm.setFormError(null); }}
            className={`py-3 px-4 sm:px-6 font-medium transition-colors focus:outline-none text-base sm:text-lg ${activeTab === 'login' ? 'border-b-2 border-brand-secondary text-brand-secondary' : 'text-text-secondary hover:text-text-primary'}`}
          >
            Iniciar Sesión
          </button>
          <button
            onClick={() => { setActiveTab('register'); registrationForm.clearErrors(); registrationForm.setFormError(null); }}
            className={`py-3 px-4 sm:px-6 font-medium transition-colors focus:outline-none text-base sm:text-lg ${activeTab === 'register' ? 'border-b-2 border-brand-secondary text-brand-secondary' : 'text-text-secondary hover:text-text-primary'}`}
          >
            Crear Cuenta
          </button>
        </div>
        
        {activeTab === 'login' && (
          <form onSubmit={loginForm.handleSubmit}>
            <h2 className="text-lg sm:text-xl font-semibold text-brand-secondary mb-1">Bienvenido de Nuevo</h2>
            <p className="text-base sm:text-lg text-text-secondary mb-6">Ingresa tus credenciales para acceder a tu cuenta.</p>
            <InputField id="loginEmail" name="email" label="Correo Electrónico" type="email" value={loginForm.values.email} onChange={loginForm.handleChange} required error={loginForm.errors.email}/>
            <InputField id="loginPassword" name="password" label="Contraseña" type="password" value={loginForm.values.password} onChange={loginForm.handleChange} required showPasswordToggle error={loginForm.errors.password} />
            <div className="text-right mb-4 mt-1"> 
              <button
                type="button"
                onClick={openForgotPasswordModal}
                className="text-xs sm:text-sm text-brand-tertiary hover:underline focus:outline-none"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loginForm.isLoading}>
              {loginForm.isLoading ? 'Iniciando Sesión...' : 'Iniciar Sesión'}
            </button>
          </form>
        )}

        {activeTab === 'register' && (
          <form onSubmit={registrationForm.handleSubmit}>
            <h2 className="text-lg sm:text-xl font-semibold text-brand-secondary mb-1">Crea tu Cuenta</h2>
            <p className="text-base sm:text-lg text-text-secondary mb-6">Completa el formulario para crear tu cuenta.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              <InputField id="regFirstName" name="firstName" label="Nombre" value={registrationForm.values.firstName} onChange={registrationForm.handleChange} required placeholder="Ingresa tu Nombre" error={registrationForm.errors.firstName}/>
              <InputField id="regLastName" name="lastName" label="Apellido" value={registrationForm.values.lastName} onChange={registrationForm.handleChange} required placeholder="Ingresa tu Apellido" error={registrationForm.errors.lastName}/>
            </div>
            <InputField id="regEmail" name="email" label="Correo Electrónico" type="email" value={registrationForm.values.email} onChange={registrationForm.handleChange} required placeholder="ejemplo@gmail.com" error={registrationForm.errors.email}/>
            <PhoneNumberInput 
              id="regPhone" 
              label="Teléfono" 
              value={registrationForm.values.phone} 
              onChange={(e) => registrationForm.setValues(prev => ({...prev, phone: e.target.value}))} 
              placeholder="Ej: 6XXX-XXXX o 2XX-XXXX"
              required
              error={registrationForm.errors.phone}
            />
            <InputField 
              id="regIdCardNumber" name="idCardNumber" label="Cédula de Identificación" value={registrationForm.values.idCardNumber} onChange={registrationForm.handleChange} required placeholder="Ej: 1-234-567 o PE-12345"
              pattern="^[A-Za-z0-9\-]+$" title="Cédula puede contener letras, números y guiones." error={registrationForm.errors.idCardNumber}
            />
            <InputField 
              id="regInitialSchoolIdRequest" name="initialSchoolIdRequest" label="Selecciona tu Colegio (para solicitud inicial)" as="select" value={registrationForm.values.initialSchoolIdRequest} onChange={registrationForm.handleChange} required error={registrationForm.errors.initialSchoolIdRequest}
            >
              <option value="" disabled>-- Elige un colegio --</option>
              {isLoadingSchools ? (
                <option value="" disabled>Cargando colegios...</option>
              ) : (
                schools.map(school => (
                  <option key={school.id} value={school.id}>{school.name}</option>
                ))
              )}
            </InputField>
            <InputField id="regPassword" name="password" label="Contraseña" type="password" value={registrationForm.values.password} onChange={registrationForm.handleChange} required showPasswordToggle error={registrationForm.errors.password} />
            <button type="submit" className="btn-primary w-full mt-2" disabled={registrationForm.isLoading || isLoadingSchools}>
              {registrationForm.isLoading ? 'Creando Cuenta...' : 'Crear Cuenta'}
            </button>
          </form>
        )}
      </div>
      <ForgotPasswordModal
        isOpen={isForgotPasswordModalOpen}
        onClose={closeForgotPasswordModal}
        onGoBackToLogin={() => {
          closeForgotPasswordModal();
          setActiveTab('login'); 
        }}
      />
      </>
    );
  }

  // Logged-in user view
  return (
    <div className="space-y-8 md:space-y-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-brand-quaternary">
        <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-brand-secondary">Hola, {currentUser.firstName}!</h1>
            <p className="text-base sm:text-lg text-text-secondary mt-1">Gestiona tu información personal, colegios, pedidos y direcciones.</p>
        </div>
        <button onClick={() => { logout(); showNotification("Has cerrado sesión.", "info");}} className="btn-outline py-2 px-4 whitespace-nowrap mt-3 sm:mt-0">
          Cerrar Sesión
        </button>
      </div>
      
      <section className="bg-brand-primary p-5 sm:p-6 rounded-lg shadow-card">
        <h2 className="text-lg md:text-xl font-semibold text-brand-secondary mb-4">Detalles de la Cuenta</h2>
        <form onSubmit={accountUpdateForm.handleSubmit} className="max-w-lg space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 sm:gap-x-6">
                <InputField id="accFirstName" name="firstName" label="Nombre" value={accountUpdateForm.values.firstName} onChange={accountUpdateForm.handleChange} required error={accountUpdateForm.errors.firstName}/>
                <InputField id="accLastName" name="lastName" label="Apellido" value={accountUpdateForm.values.lastName} onChange={accountUpdateForm.handleChange} required error={accountUpdateForm.errors.lastName}/>
            </div>
            <InputField id="accEmail" name="email" label="Correo Electrónico" type="email" value={accountUpdateForm.values.email} onChange={accountUpdateForm.handleChange} required error={accountUpdateForm.errors.email}/>
             <PhoneNumberInput 
              id="accPhone" 
              label="Teléfono" 
              value={accountUpdateForm.values.phone} 
              onChange={(e) => accountUpdateForm.setValues(prev => ({...prev, phone: e.target.value}))} 
              placeholder="Ej: 6XXX-XXXX o 2XX-XXXX"
              error={accountUpdateForm.errors.phone}
            />
            <InputField 
              id="accIdCardNumber" name="idCardNumber" label="Cédula de Identificación" value={accountUpdateForm.values.idCardNumber} onChange={accountUpdateForm.handleChange} required placeholder="Ej: 1-234-567 o PE-12345"
              pattern="^[A-Za-z0-9\-]+$" title="Cédula puede contener letras, números y guiones." error={accountUpdateForm.errors.idCardNumber}
            />
            <div className="pt-2">
                <button type="submit" className="btn-primary py-2 px-4" disabled={accountUpdateForm.isLoading}>
                    {accountUpdateForm.isLoading ? 'Actualizando...' : 'Actualizar Datos Personales'}
                </button>
            </div>
        </form>
      </section>
      
      {/* School Affiliations Section */}
      {currentUser.role === 'client' && (
        <section className="bg-brand-primary p-5 sm:p-6 rounded-lg shadow-card">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
            <h2 className="text-lg md:text-xl font-semibold text-brand-secondary mb-2 sm:mb-0">Mis Colegios</h2>
            <button 
              onClick={openRequestSchoolModal} 
              className="btn-secondary py-2 px-3 text-sm flex items-center"
              disabled={isLoadingSchools || availableSchoolsForNewRequest.length === 0}
              title={availableSchoolsForNewRequest.length === 0 ? "No hay más colegios para solicitar o ya tienes solicitudes para todos." : "Solicitar afiliación a un nuevo colegio"}
            >
              <PlusCircleIcon className="w-4 h-4 mr-1.5" /> Solicitar Nuevo Colegio
            </button>
          </div>
          {currentUser.affiliations.length === 0 ? (
            <p className="text-text-secondary text-base sm:text-lg">No tienes colegios afiliados o solicitudes pendientes. Haz clic en "Solicitar Nuevo Colegio" para empezar.</p>
          ) : (
            <div className="space-y-3">
              {currentUser.affiliations.map((affiliation, index) => (
                <div key={`${affiliation.schoolId}-${index}`} className="p-3 border border-brand-gray-light rounded-md">
                  <p className="font-medium text-text-primary">{getSchoolName(affiliation.schoolId)}</p>
                  <p className="text-xs text-text-secondary">
                    Estado: <span className={`font-semibold ${
                      affiliation.status === 'approved' ? 'text-success' :
                      affiliation.status === 'pending' ? 'text-yellow-600' :
                      affiliation.status === 'rejected' ? 'text-error' : 'text-text-secondary'
                    }`}>
                      {getSchoolStatusText(affiliation.status)}
                    </span>
                    <span className="text-brand-gray-medium"> (Solicitado: {new Date(affiliation.requestedAt).toLocaleDateString('es-PA')})</span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}


      {/* Order History Section */}
      <section className="bg-brand-primary p-5 sm:p-6 rounded-lg shadow-card">
        <h2 className="text-lg md:text-xl font-semibold text-brand-secondary mb-4">Historial de Pedidos</h2>
        {currentUser.orders && currentUser.orders.length > 0 ? (
          <div className="overflow-x-auto rounded-md border border-brand-gray-light">
            <table className="w-full text-sm text-left text-text-secondary">
              <thead className="text-xs text-text-primary uppercase bg-brand-gray-light">
                <tr>
                  <th scope="col" className="px-4 py-3">Pedido #</th>
                  <th scope="col" className="px-4 py-3">Fecha</th>
                  <th scope="col" className="px-4 py-3">Estado</th>
                  <th scope="col" className="px-4 py-3">Total</th>
                  <th scope="col" className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-gray-light">
                {currentUser.orders.map(order => (
                  <tr key={order.id} className="hover:bg-brand-gray-light hover:bg-opacity-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-text-primary whitespace-nowrap text-xs sm:text-sm">{order.id.replace('#','')}</td>
                    <td className="px-4 py-3 text-xs sm:text-sm">{new Date(order.date).toLocaleDateString('es-PA')}</td>
                    <td className="px-4 py-3 text-xs sm:text-sm">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        order.status === 'Delivered' ? 'bg-success/20 text-green-700' : 
                        order.status === 'Shipped' ? 'bg-brand-tertiary/20 text-brand-secondary' : 
                        order.status === 'Processing' ? 'bg-yellow-500/20 text-yellow-700' :
                        'bg-error/20 text-red-700' 
                      }`}>
                        {getOrderStatusText(order.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs sm:text-sm">${order.total.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/account/orders/${order.id.replace('#','')}`} className="font-medium text-brand-tertiary hover:underline text-xs sm:text-sm">
                        Ver Detalles
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-text-secondary text-base sm:text-lg">No tienes pedidos anteriores.</p>
        )}
      </section>

      {/* Address Book Section */}
      <section className="bg-brand-primary p-5 sm:p-6 rounded-lg shadow-card">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
            <h2 className="text-lg md:text-xl font-semibold text-brand-secondary mb-2 sm:mb-0">Libreta de Direcciones</h2>
            <button onClick={() => { setAddressToEdit(null); openAddressModal(); }} className="btn-secondary py-2 px-4">Añadir Nueva Dirección</button>
        </div>
        {currentUser.addresses && currentUser.addresses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentUser.addresses.map(address => (
              <AddressCard 
                key={address.id} 
                address={address} 
                onDelete={handleDeleteAddress}
                onSetDefault={handleSetDefaultAddress}
                onEdit={handleOpenEditAddressModal}
              />
            ))}
          </div>
        ) : (
          <p className="text-text-secondary text-base sm:text-lg">No tienes direcciones guardadas.</p>
        )}
      </section>
      <AddAddressModal 
        isOpen={isAddressModalOpen} 
        onClose={() => { closeAddressModal(); setAddressToEdit(null); }} 
        onSave={handleSaveAddress}
        initialData={addressToEdit}
        editingAddressId={addressToEdit?.id}
        modalIdPrefix="cuenta" 
      />
       <ForgotPasswordModal
        isOpen={isForgotPasswordModalOpen}
        onClose={closeForgotPasswordModal}
        onGoBackToLogin={() => {
          closeForgotPasswordModal();
          setActiveTab('login'); 
        }}
      />
       <RequestSchoolModal
        isOpen={isRequestSchoolModalOpen}
        onClose={closeRequestSchoolModal}
        availableSchools={availableSchoolsForNewRequest}
        onConfirmRequest={handleConfirmNewSchoolRequest}
        isLoading={isLoadingSchools}
      />
      <ConfirmationModal
        isOpen={isConfirmationModalOpen}
        onClose={closeConfirmationModal}
        title="Solicitud Enviada"
        message={confirmationModalMessage}
      />
    </div>
  );
};

export default AccountPage;