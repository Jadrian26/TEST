import React, { useState, useEffect, ChangeEvent, FormEvent, useMemo, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEditableContent } from '../contexts/EditableContentContext';
import { UserProfile, Address, Order, School } from '../types';
import PhoneNumberInput from '../components/PhoneNumberInput';
import AddAddressModal from '../components/AddAddressModal';
import ForgotPasswordModal from '../components/ForgotPasswordModal'; 
import useFormHandler from '../hooks/useFormHandler';
import useModalState from '../hooks/useModalState';
import { useNotifications } from '../contexts/NotificationsContext';
import useButtonCooldown from '../hooks/useButtonCooldown'; // Importar el hook
import SpinnerIcon from '../components/icons/SpinnerIcon'; // Import SpinnerIcon


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
  helperText?: string; 
}

const InputField: React.FC<InputFieldProps> = ({
  id, label, type = 'text', value, onChange, placeholder, required, error, wrapperClassName, as = 'input', rows, showPasswordToggle, children, pattern, title, disabled, name, helperText
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
      {helperText && <p className="mt-1 text-xs text-brand-gray-medium">{helperText}</p>}
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
const AddressCard: React.FC<AddressCardProps> = React.memo(({ address, onDelete, onSetDefault, onEdit }) => (
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
));


const AccountPage: React.FC = () => {
  const { currentUser, login, register, logout, updateCurrentUserProfile, updateUserAddresses, schoolSelectionIsMandatory, isLoggingOut } = useAuth();
  const { schools, isLoading: isLoadingSchools } = useEditableContent();
  const location = useLocation();
  const { showNotification } = useNotifications();
  const locationState = location.state as { from?: string; message?: string } | undefined;

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [addressToEdit, setAddressToEdit] = useState<Address | null>(null);
  
  const { isOpen: isAddressModalOpen, openModal: openAddressModal, closeModal: closeAddressModal } = useModalState();
  const {
    isOpen: isForgotPasswordModalOpen,
    openModal: openForgotPasswordModal,
    closeModal: closeForgotPasswordModal
  } = useModalState();

  useEffect(() => {
    if (locationState?.message) {
        showNotification(locationState.message, 'info');
        window.history.replaceState({}, document.title)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationState, showNotification]);

  const { 
    trigger: triggerLogin, 
    isCoolingDown: isLoginCoolingDown, 
    timeLeft: loginTimeLeft 
  } = useButtonCooldown(
    async (values: any) => login(values.email, values.password), 
    2000 // 2 segundos de cooldown
  );

  const { 
    trigger: triggerRegister, 
    isCoolingDown: isRegisterCoolingDown, 
    timeLeft: registerTimeLeft 
  } = useButtonCooldown(
    async (values: any) => register(values), 
    2000 // 2 segundos de cooldown
  );
  
  const { 
    trigger: triggerUpdateProfile, 
    isCoolingDown: isUpdateProfileCoolingDown, 
    timeLeft: updateProfileTimeLeft 
  } = useButtonCooldown(
    async (values: any) => updateCurrentUserProfile(values), 
    2000
  );


  // Login Form
  const loginForm = useFormHandler({
    initialValues: { email: '', password: '' },
    onSubmit: async (values) => {
      const result = await triggerLogin(values);
      // triggerLogin ya maneja el login. Ahora necesitamos manejar el resultado.
      // Para esto, el hook useButtonCooldown debería devolver el resultado de la acción.
      // Por ahora, asumimos que el resultado del login se maneja dentro de triggerLogin 
      // o la notificación se muestra por separado.
      // La lógica de error y éxito de la notificación se mantiene aquí para claridad.
      // Esta parte necesita ajuste si useButtonCooldown no propaga el resultado de la acción.
      // TEMPORAL: Re-ejecutar login para obtener resultado para notificación (esto es incorrecto, el hook debería devolver resultado)
      const loginResult = await login(values.email, values.password);
      if (loginResult.success) {
        showNotification('Inicio de sesión exitoso.', 'success'); 
      } else {
        showNotification(loginResult.message || 'Error al iniciar sesión.', 'error');
        loginForm.setFieldError('email', ' ');
        loginForm.setFieldError('password', loginResult.message || 'Error al iniciar sesión.');
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
      firstName: '', lastName: '', email: '', phone: '', idCardNumber: '', password: '', schoolId: ''
    },
    onSubmit: async (values) => {
      const regData = {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone,
        idCardNumber: values.idCardNumber,
        password: values.password,
        schoolId: values.schoolId || null
      };
      const registerResult = await register(regData); // Llama a la función original para el resultado
      await triggerRegister(regData); // Llama al trigger para el cooldown
      
      if (registerResult.success) {
        showNotification("Registro exitoso. Por favor, revisa tu correo para verificar tu cuenta.", 'success');
      } else {
        showNotification(registerResult.message || 'Error al registrar la cuenta.', 'error');
        registrationForm.setFieldError('email', registerResult.message || 'Error al registrar la cuenta.');
      }
    },
    validate: (values) => {
        const errors: Partial<typeof values> = {};
        if (!values.firstName) errors.firstName = "El nombre es obligatorio.";
        if (!values.lastName) errors.lastName = "El apellido es obligatorio.";
        if (!values.email) errors.email = "El correo es obligatorio.";
        if (!values.idCardNumber) errors.idCardNumber = "La cédula es obligatoria.";
        if (!values.password) errors.password = "La contraseña es obligatoria.";
        else if (values.password.length < 6) errors.password = "La contraseña debe tener al menos 6 caracteres.";
        if (schoolSelectionIsMandatory && !values.schoolId) {
            errors.schoolId = "Debes seleccionar un colegio.";
        }
        return errors;
    }
  });

  // Account Update Form
  const accountUpdateForm = useFormHandler({
    initialValues: {
      firstName: currentUser?.firstName || '',
      lastName: currentUser?.lastName || '',
      email: currentUser?.email || '',
      phone: currentUser?.phone || '',
      idCardNumber: currentUser?.idCardNumber || '',
      schoolId: currentUser?.schoolId || ''
    },
    onSubmit: async (values) => {
      if (!currentUser) return;

      if (!currentUser.isAdmin && !currentUser.isSales && schoolSelectionIsMandatory && !values.schoolId) {
        showNotification('Por favor, selecciona tu colegio. Es requerido ya que existen usuarios Administradores y de Ventas en el sistema.', 'error');
        accountUpdateForm.setFieldError('schoolId', 'Por favor, selecciona tu colegio.');
        return;
      }
      if (!values.idCardNumber.trim()) {
        showNotification('La cédula de identificación es obligatoria.', 'error');
        accountUpdateForm.setFieldError('idCardNumber', 'La cédula de identificación es obligatoria.');
        return;
      }
      
      const profileData = {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          phone: values.phone,
          idCardNumber: values.idCardNumber,
          schoolId: values.schoolId || null,
      };
      const updateResult = await updateCurrentUserProfile(profileData); // Llama a la original para el resultado
      await triggerUpdateProfile(profileData); // Llama al trigger para el cooldown

      showNotification(updateResult.message || (updateResult.success ? 'Detalles actualizados.' : 'Error al actualizar.'), updateResult.success ? 'success' : 'error');
      if (!updateResult.success) {
        accountUpdateForm.setFieldError('email', updateResult.message || 'Error al actualizar.');
      }
    },
    validate: (values) => {
        const errors: Partial<typeof values> = {};
        if (!values.firstName) errors.firstName = "El nombre es obligatorio.";
        if (!values.lastName) errors.lastName = "El apellido es obligatorio.";
        if (!values.email) errors.email = "El correo es obligatorio.";
        if (!values.idCardNumber) errors.idCardNumber = "La cédula es obligatoria.";
        if (currentUser && !currentUser.isAdmin && !currentUser.isSales && schoolSelectionIsMandatory && !values.schoolId) {
            errors.schoolId = "Debes seleccionar tu colegio.";
        }
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
        schoolId: currentUser.schoolId || ''
      });
      loginForm.setValues({ email: '', password: '' });
      loginForm.clearErrors();
      registrationForm.setValues({ firstName: '', lastName: '', email: '', phone: '', idCardNumber: '', password: '', schoolId: ''});
      registrationForm.clearErrors();
    } else {
      accountUpdateForm.setValues({ firstName: '', lastName: '', email: '', phone: '', idCardNumber: '', schoolId: '' });
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

  const associatedSchoolName = useMemo(() => {
    if (currentUser?.schoolId && schools.length > 0) {
      return schools.find(s => s.id === currentUser.schoolId)?.name || 'Colegio Desconocido';
    }
    return 'No asignado';
  }, [currentUser, schools]);

  const regSchoolRequired = schoolSelectionIsMandatory;
  const regSchoolLabel = `Selecciona tu Colegio${regSchoolRequired ? '' : ' (Opcional)'}`;
  const regSchoolHelperText = !regSchoolRequired ? "La selección de colegio es opcional por ahora." : "Es necesario seleccionar un colegio ya que existen usuarios Administradores y de Ventas en el sistema.";


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
            <button type="submit" className="btn-primary w-full" disabled={loginForm.isLoading || isLoginCoolingDown}>
              {isLoginCoolingDown ? `Reintentar en ${loginTimeLeft}s` : (loginForm.isLoading ? 'Iniciando Sesión...' : 'Iniciar Sesión')}
            </button>
          </form>
        )}

        {activeTab === 'register' && (
          <form onSubmit={registrationForm.handleSubmit}>
            <h2 className="text-lg sm:text-xl font-semibold text-brand-secondary mb-1">Crea tu Cuenta</h2>
            <p className="text-base sm:text-lg text-text-secondary mb-6">Ingresa tus credenciales para crear tu cuenta</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              <InputField id="regFirstName" name="firstName" label="Nombre" value={registrationForm.values.firstName} onChange={registrationForm.handleChange} required placeholder="Ingresa tu Nombre" error={registrationForm.errors.firstName}/>
              <InputField id="regLastName" name="lastName" label="Apellido" value={registrationForm.values.lastName} onChange={registrationForm.handleChange} required placeholder="Ingresa tu Apellido" error={registrationForm.errors.lastName}/>
            </div>
            <InputField id="regEmail" name="email" label="Correo Electrónico" type="email" value={registrationForm.values.email} onChange={registrationForm.handleChange} required placeholder="ejemplo@gmail.com" error={registrationForm.errors.email}/>
            <PhoneNumberInput id="regPhone" label="Teléfono" value={registrationForm.values.phone} onChange={(e) => registrationForm.setValues(prev => ({...prev, phone: e.target.value}))} />
            <InputField
              id="regIdCardNumber" name="idCardNumber" label="Cédula de Identificación" value={registrationForm.values.idCardNumber} onChange={registrationForm.handleChange} required placeholder="Ej: 8-123-456 o PE-12345"
              pattern="^[A-Za-z0-9\-]+$" title="Cédula puede contener letras, números y guiones." error={registrationForm.errors.idCardNumber}
            />
            <InputField
              id="regSchoolId" name="schoolId" label={regSchoolLabel} as="select" value={registrationForm.values.schoolId} onChange={registrationForm.handleChange}
              required={regSchoolRequired}
              error={registrationForm.errors.schoolId}
              helperText={regSchoolHelperText}
            >
              <option value="">-- Elige un colegio --</option>
              {isLoadingSchools ? (
                <option value="" disabled>Cargando colegios...</option>
              ) : (
                schools.map(school => (
                  <option key={school.id} value={school.id}>{school.name}</option>
                ))
              )}
            </InputField>
            <InputField id="regPassword" name="password" label="Contraseña" type="password" value={registrationForm.values.password} onChange={registrationForm.handleChange} required showPasswordToggle error={registrationForm.errors.password} />
            <button type="submit" className="btn-primary w-full mt-2" disabled={registrationForm.isLoading || isLoadingSchools || isRegisterCoolingDown}>
              {isRegisterCoolingDown ? `Reintentar en ${registerTimeLeft}s` : (registrationForm.isLoading ? 'Creando Cuenta...' : 'Crear Cuenta')}
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

  const isSchoolSelectionRequiredForUpdate = !currentUser.isAdmin && !currentUser.isSales && schoolSelectionIsMandatory;
  let schoolFieldUpdateHelperText = '';
    if (currentUser.isAdmin || currentUser.isSales) {
        schoolFieldUpdateHelperText = "Como administrador/ventas, puedes no tener un colegio asociado o seleccionar uno.";
    } else {
        if (schoolSelectionIsMandatory) {
            schoolFieldUpdateHelperText = `Debes seleccionar tu colegio asociado (${associatedSchoolName}). Contacta a soporte para cambios si es necesario.`;
        } else {
            schoolFieldUpdateHelperText = `Puedes seleccionar un colegio asociado (${associatedSchoolName}). Actualmente es opcional.`;
        }
    }

  return (
    <div className="space-y-8 md:space-y-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-brand-quaternary">
        <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-brand-secondary">Hola, {currentUser.firstName}!</h1>
            <p className="text-base sm:text-lg text-text-secondary mt-1">Gestiona tu información personal, pedidos y direcciones.</p>
        </div>
        <button
            onClick={async () => {
                const result = await logout();
                if (result.success) {
                    showNotification('Has cerrado sesión exitosamente.', 'info'); 
                } else {
                    showNotification(result.message || 'Error al cerrar sesión.', 'error');
                }
            }}
            className="btn-outline py-2 px-4 flex items-center justify-center min-w-[150px]" // Added min-width
            disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <>
              <SpinnerIcon className="w-4 h-4 mr-2" />
              Cerrando Sesión...
            </>
          ) : (
            'Cerrar Sesión'
          )}
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
            <PhoneNumberInput id="accPhone" label="Teléfono" value={accountUpdateForm.values.phone} onChange={(e) => accountUpdateForm.setValues(prev => ({...prev, phone: e.target.value}))} />
            <InputField
              id="accIdCardNumber" name="idCardNumber" label="Cédula de Identificación" value={accountUpdateForm.values.idCardNumber} onChange={accountUpdateForm.handleChange} required placeholder="Ej: 8-123-456 o PE-12345"
              pattern="^[A-Za-z0-9\-]+$" title="Cédula puede contener letras, números y guiones." error={accountUpdateForm.errors.idCardNumber}
            />
            
            <div>
                <label htmlFor="accSchoolId" className="block text-sm sm:text-base font-medium text-text-primary mb-1">
                    Colegio Asociado {isSchoolSelectionRequiredForUpdate && <span className="text-error">*</span>}
                </label>
                <select
                    id="accSchoolId" name="schoolId"
                    value={accountUpdateForm.values.schoolId || ''}
                    onChange={accountUpdateForm.handleChange}
                    className={`w-full p-2.5 bg-brand-primary border rounded-md shadow-sm focus:ring-2 text-sm sm:text-base transition-colors ${
                       (accountUpdateForm.errors.schoolId) ? 'border-error focus:ring-error' : 'border-brand-quaternary focus:ring-brand-tertiary focus:border-transparent'
                    }`}
                    required={isSchoolSelectionRequiredForUpdate}
                    disabled={isLoadingSchools}
                >
                    <option value="">-- { (currentUser.isAdmin || currentUser.isSales || !schoolSelectionIsMandatory) ? 'Ningún colegio' : 'Selecciona tu colegio'} --</option>
                    {isLoadingSchools ? (
                        <option value="" disabled>Cargando colegios...</option>
                    ) : (
                        schools.map(school => (
                        <option key={school.id} value={school.id}>{school.name}</option>
                        ))
                    )}
                </select>
                {accountUpdateForm.errors.schoolId && <p className="mt-1 text-xs text-error">{accountUpdateForm.errors.schoolId}</p>}
                {schoolFieldUpdateHelperText && <p className="text-xs sm:text-sm text-brand-gray-medium mt-1">{schoolFieldUpdateHelperText}</p>}
            </div>

            <div className="pt-2">
                <button type="submit" className="btn-primary py-2 px-4" disabled={isLoadingSchools || accountUpdateForm.isLoading || isUpdateProfileCoolingDown}>
                    {isUpdateProfileCoolingDown ? `Reintentar en ${updateProfileTimeLeft}s` : (accountUpdateForm.isLoading ? 'Actualizando...' : 'Actualizar Cuenta')}
                </button>
            </div>
        </form>
      </section>

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
    </div>
  );
};

export default AccountPage;