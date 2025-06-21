import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import useFormHandler from '../hooks/useFormHandler';
import { useNotifications } from '../contexts/NotificationsContext';
import CloseIcon from './icons/CloseIcon';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoBackToLogin: () => void; 
}

// Minimal InputField component for this modal
interface InputFieldProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  name: string;
}
const InputField: React.FC<InputFieldProps> = ({ id, label, type = 'text', value, onChange, placeholder, required, error, name }) => (
  <div className="mb-4">
    <label htmlFor={id} className="block text-sm sm:text-base font-medium text-text-primary mb-1">
      {label} {required && <span className="text-error">*</span>}
    </label>
    <input
      type={type} id={id} name={name} value={value} onChange={onChange} placeholder={placeholder} required={required}
      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 text-sm sm:text-base transition-colors bg-brand-primary ${
        error ? 'border-error focus:ring-error focus:border-error' : 'border-brand-quaternary focus:ring-brand-tertiary focus:border-brand-tertiary'
      }`}
      aria-invalid={!!error}
    />
    {error && <p className="mt-1 text-xs text-error">{error}</p>}
  </div>
);


const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose, onGoBackToLogin }) => {
  const { sendPasswordResetEmail } = useAuth();
  const { showNotification } = useNotifications();
  const [isVisible, setIsVisible] = useState(false);

  const form = useFormHandler({
    initialValues: { email: '' },
    onSubmit: async (values) => {
      if (!values.email.trim()) {
        form.setFieldError('email', 'El correo electrónico es obligatorio.');
        return;
      }
      // The sendPasswordResetEmail function in AuthContext will handle the generic message.
      const result = await sendPasswordResetEmail(values.email);
      showNotification(result.message, result.success ? 'success' : 'error');
      if (result.success) {
        form.setValues({ email: '' }); // Clear email field on success
         // Optionally close modal after a delay or keep it open with the message
      }
    },
    validate: (values) => {
      const errors: { email?: string } = {};
      if (!values.email.trim()) {
        errors.email = 'El correo electrónico es obligatorio.';
      } else if (!/\S+@\S+\.\S+/.test(values.email)) {
        errors.email = 'Ingresa un correo electrónico válido.';
      }
      return errors;
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.setValues({ email: '' });
      form.clearErrors();
      form.setFormError(null);
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleModalClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300); 
  };
  
  const handleBackToLoginClick = () => {
    handleModalClose(); // Close this modal
    onGoBackToLogin(); // Potentially switch tab on AccountPage
  }

  if (!isOpen && !isVisible) return null;

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center p-4 z-[160] transition-opacity duration-300 ease-in-out ${
        isVisible ? 'bg-black bg-opacity-70 backdrop-blur-sm' : 'bg-opacity-0 pointer-events-none'
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="forgot-password-modal-title"
      onClick={handleModalClose}
    >
      <div
        className={`bg-brand-primary p-6 rounded-lg shadow-modal w-full max-w-md transform transition-all duration-300 ease-out-expo ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 id="forgot-password-modal-title" className="text-lg sm:text-xl font-semibold text-brand-secondary">
            Recuperar Contraseña
          </h2>
          <button onClick={handleModalClose} className="icon-btn" aria-label="Cerrar modal">
            <CloseIcon />
          </button>
        </div>

        <p className="text-sm text-text-secondary mb-5">
          Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña (simulado).
        </p>

        <form onSubmit={form.handleSubmit}>
          <InputField
            id="forgotPasswordEmail"
            name="email"
            label="Correo Electrónico"
            type="email"
            value={form.values.email}
            onChange={form.handleChange}
            required
            placeholder="tuCorreo@ejemplo.com"
            error={form.errors.email}
          />
          {form.formError && <p className="text-sm text-error mt-2 mb-3 text-center">{form.formError}</p>}
          <button type="submit" className="btn-primary w-full mt-3" disabled={form.isLoading}>
            {form.isLoading ? 'Enviando...' : 'Enviar Enlace de Recuperación'}
          </button>
        </form>

        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={handleBackToLoginClick}
            className="text-sm text-brand-tertiary hover:underline"
          >
            Volver a Iniciar Sesión
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
