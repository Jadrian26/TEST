
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useEditableContent } from '../../contexts/EditableContentContext';
import { UserProfile, School, UserRole, SchoolApprovalStatus, UserSchoolAffiliation } from '../../types';
import useFormHandler from '../../hooks/useFormHandler';
import { useNotifications } from '../../contexts/NotificationsContext';
import PhoneNumberInput from '../../components/PhoneNumberInput'; 
import PlusCircleIcon from '../../components/icons/PlusCircleIcon';
import TrashIcon from '../../components/icons/TrashIcon';
import CheckCircleIcon from '../../components/icons/CheckCircleIcon'; // Added
import XCircleIcon from '../../components/icons/XCircleIcon'; // Added
import ArrowPathIcon from '../../components/icons/ArrowPathIcon'; // Added

// Minimal InputField for this page
interface InputFieldProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  name: string;
  as?: 'input' | 'select';
  children?: React.ReactNode;
  disabled?: boolean;
  autoComplete?: string;
  pattern?: string;
  title?: string;
}
const InputField: React.FC<InputFieldProps> = ({
  id, label, type = 'text', value, onChange, placeholder, required, error, name, as = 'input', children, disabled, autoComplete, pattern, title
}) => (
  <div className="mb-4">
    <label htmlFor={id} className="block text-sm sm:text-base font-medium text-text-primary mb-1">
      {label} {required && <span className="text-error">*</span>}
    </label>
    {as === 'select' ? (
      <select
        id={id} name={name} value={value} onChange={onChange} required={required} disabled={disabled}
        className={`w-full p-2.5 bg-brand-primary border rounded-md shadow-sm focus:ring-2 text-sm sm:text-base transition-colors ${
          error ? 'border-error focus:ring-error focus:border-transparent' : 'border-brand-quaternary focus:ring-brand-tertiary focus:border-transparent'
        } ${disabled ? 'bg-brand-gray-light cursor-not-allowed opacity-70' : ''}`}
      >
        {children}
      </select>
    ) : (
      <input
        type={type} id={id} name={name} value={value} onChange={onChange} placeholder={placeholder} required={required} disabled={disabled}
        autoComplete={autoComplete} pattern={pattern} title={title}
        className={`w-full p-2.5 bg-brand-primary border rounded-md shadow-sm focus:ring-2 text-sm sm:text-base transition-colors ${
          error ? 'border-error focus:ring-error focus:border-transparent' : 'border-brand-quaternary focus:ring-brand-tertiary focus:border-transparent'
        } ${disabled ? 'bg-brand-gray-light cursor-not-allowed opacity-70' : ''}`}
      />
    )}
    {error && <p className="mt-1 text-xs text-error">{error}</p>}
  </div>
);


const AdminEditUserPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { currentUser, registeredUsers, updateUserProfileByAdmin, sendPasswordResetEmail } = useAuth();
  const { schools, isLoading: isLoadingSchools } = useEditableContent();
  const { showNotification } = useNotifications();

  const [userToEdit, setUserToEdit] = useState<UserProfile | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // Form for basic user details
  const profileForm = useFormHandler({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      idCardNumber: '',
      role: 'client' as UserRole,
    },
    onSubmit: async (values) => {
      if (!userToEdit || !userId) return;

      const profileUpdateData: Partial<UserProfile> = {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone,
        idCardNumber: values.idCardNumber,
        role: values.role,
      };
      // Affiliations are handled separately
      
      const result = await updateUserProfileByAdmin(userId, profileUpdateData);
      showNotification(result.message || (result.success ? 'Datos del usuario actualizados.' : 'Error al actualizar datos.'), result.success ? 'success' : 'error');
      if (result.success) {
         const updatedUser = registeredUsers.find(u => u.id === userId);
         if (updatedUser) setUserToEdit(updatedUser); // Refresh local state
      }
    },
    validate: (values) => {
      const errors: Partial<typeof values> = {};
      if (!values.firstName.trim()) errors.firstName = "El nombre es obligatorio.";
      if (!values.lastName.trim()) errors.lastName = "El apellido es obligatorio.";
      if (!values.email.trim()) errors.email = "El correo es obligatorio.";
      else if (!/\S+@\S+\.\S+/.test(values.email)) errors.email = "Correo inválido.";
      if (values.phone && !/^[6234789]\d{2,3}-\d{4}$/.test(values.phone) && !/^\d{7,8}$/.test(values.phone.replace(/-/g, ''))) {
        errors.phone = "Formato de teléfono inválido. Ej: 6123-4567 o 234-5678.";
      }
      if (!values.idCardNumber.trim()) errors.idCardNumber = "La cédula es obligatoria.";
      return errors;
    }
  });

  useEffect(() => {
    setIsLoadingUser(true);
    const foundUser = registeredUsers.find(u => u.id === userId);
    if (foundUser) {
      setUserToEdit(foundUser);
      profileForm.setValues({
        firstName: foundUser.firstName,
        lastName: foundUser.lastName,
        email: foundUser.email,
        phone: foundUser.phone || '',
        idCardNumber: foundUser.idCardNumber || '',
        role: foundUser.role,
      });
    } else {
      showNotification("Usuario no encontrado.", "error");
      navigate('/admin/usuarios');
    }
    setIsLoadingUser(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, registeredUsers]);


  const handlePasswordReset = async () => {
    if (!userToEdit) return;
    const result = await sendPasswordResetEmail(userToEdit.email);
    showNotification(result.message, result.success ? 'success' : 'info');
  };

  const handleAffiliationStatusChange = async (affiliationSchoolId: string, newStatus: SchoolApprovalStatus) => {
    if (!userToEdit || !userId || newStatus === null) return;

    const currentAffiliations = userToEdit.affiliations || [];
    const updatedAffiliations = currentAffiliations.map(aff => {
      if (aff.schoolId === affiliationSchoolId) {
        return { ...aff, status: newStatus, lastUpdatedAt: new Date().toISOString() };
      }
      return aff;
    });
    
    const result = await updateUserProfileByAdmin(userId, { affiliations: updatedAffiliations });
    showNotification(result.message || `Estado de afiliación actualizado a ${getSchoolStatusText(newStatus)}.`, result.success ? 'success' : 'error');
    if (result.success) {
        const updatedUser = registeredUsers.find(u => u.id === userId);
        if (updatedUser) setUserToEdit(updatedUser);
    }
  };

  const handleRemoveAffiliation = async (affiliationSchoolId: string) => {
     if (!userToEdit || !userId) return;
     const currentAffiliations = userToEdit.affiliations || [];
     const updatedAffiliations = currentAffiliations.filter(aff => aff.schoolId !== affiliationSchoolId);
     const result = await updateUserProfileByAdmin(userId, { affiliations: updatedAffiliations });
     showNotification(result.message || `Afiliación eliminada.`, result.success ? 'success' : 'error');
     if (result.success) {
        const updatedUser = registeredUsers.find(u => u.id === userId);
        if (updatedUser) setUserToEdit(updatedUser);
     }
  };

  const handleAddAffiliation = async (schoolId: string) => {
    if (!userToEdit || !userId || !schoolId) return;
    const currentAffiliations = userToEdit.affiliations || [];
    if (currentAffiliations.some(aff => aff.schoolId === schoolId)) {
        showNotification("El usuario ya tiene una afiliación (o solicitud) con este colegio.", "info");
        return;
    }
    const newAffiliation: UserSchoolAffiliation = {
        schoolId: schoolId,
        status: 'approved', // Admin directly adds as approved
        requestedAt: new Date().toISOString(),
        lastUpdatedAt: new Date().toISOString(),
        adminNotes: `Añadido por ${currentUser?.role} el ${new Date().toLocaleDateString()}`
    };
    const updatedAffiliations = [...currentAffiliations, newAffiliation];
    const result = await updateUserProfileByAdmin(userId, { affiliations: updatedAffiliations });
    showNotification(result.message || `Colegio añadido y aprobado para el usuario.`, result.success ? 'success' : 'error');
     if (result.success) {
        const updatedUser = registeredUsers.find(u => u.id === userId);
        if (updatedUser) setUserToEdit(updatedUser);
     }
  };

  if (isLoadingUser || isLoadingSchools) {
    return <div className="text-center py-10 text-text-secondary">Cargando datos del usuario...</div>;
  }

  if (!userToEdit) {
    return <div className="text-center py-10 text-error">Usuario no encontrado.</div>;
  }
  
  const canEditRole = (currentUser?.role === 'admin' || currentUser?.role === 'sales') && currentUser.id !== userToEdit.id;
  const isTargetAdminOrSales = userToEdit.role === 'admin' || userToEdit.role === 'sales';

  const getSchoolName = (schoolId: string) => schools.find(s => s.id === schoolId)?.name || 'Desconocido';
  
  const getSchoolStatusText = (status: SchoolApprovalStatus | undefined): string => {
    if (!status) return 'Desconocido';
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'approved': return 'Aprobado';
      case 'rejected': return 'Rechazado';
      default: return 'Desconocido';
    }
  };

  const getStatusDisplayClass = (status: SchoolApprovalStatus) => {
    if (status === 'approved') return 'bg-success/20 text-green-700';
    if (status === 'pending') return 'bg-yellow-500/20 text-yellow-700';
    if (status === 'rejected') return 'bg-error/20 text-red-700';
    return 'bg-brand-gray-light text-text-secondary';
  };
  
  const availableSchoolsForNewAffiliation = schools.filter(
    s => !(userToEdit.affiliations || []).some(aff => aff.schoolId === s.id)
  );


  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-brand-quaternary border-opacity-30">
        <Link to="/admin/usuarios" className="text-sm text-brand-tertiary hover:text-brand-secondary font-medium flex items-center mb-2 group">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          Volver a Gestión de Usuarios
        </Link>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-brand-secondary">
          Editar Usuario: <span className="text-brand-tertiary">{userToEdit.firstName} {userToEdit.lastName}</span>
        </h1>
      </div>

      {/* User Profile Form */}
      <form onSubmit={profileForm.handleSubmit} className="bg-brand-primary p-6 rounded-lg shadow-card space-y-6">
        <h2 className="text-lg font-semibold text-brand-secondary border-b pb-2 mb-4">Datos Personales</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <InputField id="firstName" name="firstName" label="Nombre" value={profileForm.values.firstName} onChange={profileForm.handleChange} required error={profileForm.errors.firstName} />
          <InputField id="lastName" name="lastName" label="Apellido" value={profileForm.values.lastName} onChange={profileForm.handleChange} required error={profileForm.errors.lastName} />
          <InputField id="email" name="email" type="email" label="Correo Electrónico" value={profileForm.values.email} onChange={profileForm.handleChange} required error={profileForm.errors.email} />
          <PhoneNumberInput id="phone" label="Teléfono" value={profileForm.values.phone} onChange={(e) => profileForm.setValues(prev => ({...prev, phone: e.target.value}))} error={profileForm.errors.phone} />
          <InputField id="idCardNumber" name="idCardNumber" label="Cédula" value={profileForm.values.idCardNumber} onChange={profileForm.handleChange} required error={profileForm.errors.idCardNumber} pattern="^[A-Za-z0-9\-]+$" title="Cédula puede contener letras, números y guiones." />
          
          <InputField
            id="role"
            name="role"
            label="Rol de Usuario"
            as="select"
            value={profileForm.values.role}
            onChange={profileForm.handleChange}
            required
            disabled={!canEditRole || (isTargetAdminOrSales && userToEdit.id !== currentUser?.id)}
            error={profileForm.errors.role}
          >
            <option value="client">Cliente</option>
            {/* Show Sales/Admin options if target is not already Sales/Admin OR if target is self (though self-edit is disabled) */}
            {/* This logic ensures that if user is client, admin/sales can change them.
                If user is admin/sales, they cannot be changed by anyone except potentially a higher admin (not implemented).
                The disabled prop handles not being able to edit self or other admins/sales.
            */}
            {(!isTargetAdminOrSales || userToEdit.id === currentUser?.id) && <option value="sales">Ventas</option>}
            {(!isTargetAdminOrSales || userToEdit.id === currentUser?.id) && <option value="admin">Admin</option>}
          </InputField>

           {(!canEditRole || (isTargetAdminOrSales && userToEdit.id !== currentUser?.id)) && userToEdit.id !== currentUser?.id &&
            <p className="text-xs text-brand-gray-medium -mt-3 md:col-span-2">El rol de otros administradores o personal de ventas no puede ser modificado aquí.</p>
           }
            {userToEdit.id === currentUser?.id &&
            <p className="text-xs text-brand-gray-medium -mt-3 md:col-span-2">No puedes cambiar tu propio rol.</p>
           }
        </div>
        <div className="pt-4 border-t border-brand-gray-light space-y-3 md:space-y-0 md:flex md:items-center md:justify-between">
          <button
            type="button"
            onClick={handlePasswordReset}
            className="btn-outline w-full md:w-auto"
            disabled={profileForm.isLoading}
          >
            Restablecer Contraseña (Enviar Email)
          </button>
          <button
            type="submit"
            className="btn-primary w-full md:w-auto"
            disabled={profileForm.isLoading}
          >
            {profileForm.isLoading ? 'Guardando...' : 'Guardar Datos Personales'}
          </button>
        </div>
         {profileForm.formError && <p className="text-sm text-error text-center mt-2">{profileForm.formError}</p>}
      </form>

      {/* School Affiliations Management (Only for Clients) */}
      {userToEdit.role === 'client' && (
        <div className="bg-brand-primary p-6 rounded-lg shadow-card space-y-4">
          <h2 className="text-lg font-semibold text-brand-secondary border-b pb-2 mb-4">Afiliaciones de Colegios</h2>
          {(userToEdit.affiliations || []).length === 0 && (
            <p className="text-text-secondary">Este usuario no tiene afiliaciones de colegio.</p>
          )}
          {(userToEdit.affiliations || []).map(aff => (
            <div key={aff.schoolId} className="p-3 border border-brand-gray-light rounded-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <p className="font-medium text-text-primary">{getSchoolName(aff.schoolId)}</p>
                <p className="text-xs">
                  Estado: <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${getStatusDisplayClass(aff.status)}`}>{getSchoolStatusText(aff.status)}</span>
                </p>
                <p className="text-xs text-brand-gray-medium">Solicitado: {new Date(aff.requestedAt).toLocaleDateString()}</p>
                {aff.lastUpdatedAt && <p className="text-xs text-brand-gray-medium">Últ. Act.: {new Date(aff.lastUpdatedAt).toLocaleDateString()}</p>}
                {aff.adminNotes && <p className="text-xs text-brand-gray-medium mt-1 italic">Nota Admin: {aff.adminNotes}</p>}
              </div>
              <div className="flex flex-col sm:flex-row flex-wrap gap-2 mt-2 sm:mt-0 items-center">
                {aff.status === 'pending' && (
                  <>
                    <button onClick={() => handleAffiliationStatusChange(aff.schoolId, 'approved')} className="btn-primary !bg-success hover:!bg-green-600 text-xs px-2 py-1.5 flex items-center"><CheckCircleIcon className="w-3.5 h-3.5 mr-1"/> Aprobar</button>
                    <button onClick={() => handleAffiliationStatusChange(aff.schoolId, 'rejected')} className="btn-outline !border-error !text-error hover:!bg-error hover:!text-white text-xs px-2 py-1.5 flex items-center"><XCircleIcon className="w-3.5 h-3.5 mr-1"/>Rechazar</button>
                  </>
                )}
                {aff.status === 'approved' && (
                  <>
                    <button onClick={() => handleAffiliationStatusChange(aff.schoolId, 'rejected')} className="btn-outline !border-error !text-error hover:!bg-error hover:!text-white text-xs px-2 py-1.5 flex items-center"><XCircleIcon className="w-3.5 h-3.5 mr-1"/>Revocar (Rechazar)</button>
                    <button onClick={() => handleAffiliationStatusChange(aff.schoolId, 'pending')} className="btn-outline text-xs px-2 py-1.5 flex items-center"><ArrowPathIcon className="w-3.5 h-3.5 mr-1"/>Poner Pendiente</button>
                    <button onClick={() => handleRemoveAffiliation(aff.schoolId)} className="btn-ghost !text-error hover:!bg-error/10 text-xs px-2 py-1.5 flex items-center"><TrashIcon className="w-3.5 h-3.5 mr-1"/> Quitar</button>
                  </>
                )}
                {aff.status === 'rejected' && (
                  <>
                    <button onClick={() => handleAffiliationStatusChange(aff.schoolId, 'approved')} className="btn-primary !bg-success hover:!bg-green-600 text-xs px-2 py-1.5 flex items-center"><CheckCircleIcon className="w-3.5 h-3.5 mr-1"/> Aprobar</button>
                    <button onClick={() => handleAffiliationStatusChange(aff.schoolId, 'pending')} className="btn-outline text-xs px-2 py-1.5 flex items-center"><ArrowPathIcon className="w-3.5 h-3.5 mr-1"/>Poner Pendiente</button>
                     <button onClick={() => handleRemoveAffiliation(aff.schoolId)} className="btn-ghost !text-error hover:!bg-error/10 text-xs px-2 py-1.5 flex items-center"><TrashIcon className="w-3.5 h-3.5 mr-1"/> Quitar</button>
                  </>
                )}
              </div>
            </div>
          ))}
          <div className="pt-4 border-t border-brand-gray-light">
            <h3 className="text-base font-medium text-brand-secondary mb-2">Añadir Nueva Afiliación (Aprobada Directamente)</h3>
            {availableSchoolsForNewAffiliation.length > 0 ? (
              <div className="flex flex-col sm:flex-row gap-2 items-end">
                <div className="flex-grow">
                    <label htmlFor="addSchoolAffiliation" className="sr-only">Seleccionar colegio para añadir</label>
                    <select
                        id="addSchoolAffiliation"
                        className="w-full p-2.5 border border-brand-quaternary rounded-md shadow-sm focus:ring-2 focus:ring-brand-tertiary focus:border-transparent text-sm"
                        defaultValue=""
                    >
                        <option value="" disabled>-- Selecciona un colegio --</option>
                        {availableSchoolsForNewAffiliation.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
                <button 
                    type="button"
                    onClick={() => {
                        const select = document.getElementById('addSchoolAffiliation') as HTMLSelectElement;
                        if (select.value) handleAddAffiliation(select.value);
                    }}
                    className="btn-secondary text-sm px-3 py-2 flex items-center w-full sm:w-auto justify-center"
                >
                    <PlusCircleIcon className="w-4 h-4 mr-1.5" /> Añadir y Aprobar Colegio
                </button>
              </div>
            ) : (
              <p className="text-sm text-text-secondary">El usuario ya tiene afiliaciones (o solicitudes) con todos los colegios disponibles.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEditUserPage;
