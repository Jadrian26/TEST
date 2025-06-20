
import React, { ChangeEvent, useState, useEffect } from 'react'; 
import { useAuth } from '../../contexts/AuthContext';
import { useEditableContent } from '../../contexts/EditableContentContext'; 
import { UserProfile, School } from '../../types'; 
import { useSearchAndFilter } from '../../hooks/useSearchAndFilter'; 
import { useNotifications } from '../../contexts/NotificationsContext'; 
import useDebounce from '../../hooks/useDebounce'; // Import useDebounce

const AdminManageUsersPage: React.FC = () => {
  const { currentUser, allUsers, updateUserProfileByAdmin } = useAuth(); 
  const { schools, isLoading: isLoadingSchools } = useEditableContent(); 
  const { showNotification } = useNotifications(); 

  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(localSearchTerm, 300);

  const {
    processedData: filteredUsers,
    // searchTerm, // Not used directly for input value anymore
    setSearchTerm, // Used with debounced value
    filters,
    setFilter
  } = useSearchAndFilter<UserProfile>(allUsers, { 
    searchKeys: ['firstName', 'lastName', 'email', 'idCardNumber']
  });

  useEffect(() => {
    setSearchTerm(debouncedSearchTerm);
  }, [debouncedSearchTerm, setSearchTerm]);

  const getSchoolName = (schoolId: string | null): string => {
    if (isLoadingSchools || !schoolId) return 'No asignado';
    const school = schools.find(s => s.id === schoolId);
    return school ? school.name : 'No asignado';
  };

  const handleSchoolChangeForUser = async (userId: string, newSchoolId: string) => {
    if (!currentUser || !currentUser.isAdmin) {
      showNotification("No tienes permiso para realizar esta acción.", "error");
      return;
    }
    
    const targetUser = allUsers.find(u => u.id === userId); 
    if (!targetUser) {
      showNotification("Usuario no encontrado.", "error");
      return;
    }

    // Prevent admin from changing other admins' or sales' schools here
    if (targetUser.id !== currentUser.id && (targetUser.isAdmin || targetUser.isSales)) {
        showNotification("No puedes cambiar el colegio de otros administradores o personal de ventas desde esta interfaz.", "error");
        return;
    }
    // Prevent admin from changing own school here (should use My Account)
    if (targetUser.id === currentUser.id) {
        showNotification("Para cambiar tu propio colegio, usa la página 'Mi Cuenta'.", "info");
        return;
    }


    const result = await updateUserProfileByAdmin(userId, { schoolId: newSchoolId === '' ? null : newSchoolId });
    if (result.success) {
      showNotification(`Colegio de ${targetUser.firstName} ${targetUser.lastName} actualizado.`, 'success');
    } else {
      showNotification(result.message || 'Error al actualizar el colegio del usuario.', 'error');
    }
  };

  const getUserRoleDisplay = (user: UserProfile) => {
    if (user.isAdmin) {
      return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-error text-white shadow-sm">Admin</span>;
    }
    if (user.isSales) {
      return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-600 text-white shadow-sm">Ventas</span>;
    }
    return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-brand-quaternary text-white shadow-sm">Cliente</span>;
  };


  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-brand-quaternary border-opacity-30">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-brand-secondary">Gestión de Usuarios</h1>
        <p className="text-text-secondary text-base sm:text-lg mt-1">Visualiza y gestiona los usuarios registrados en la plataforma.</p>
      </div>

      <div className="bg-brand-primary p-4 rounded-lg shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div>
            <label htmlFor="userSearch" className="block text-sm sm:text-base font-medium text-text-secondary mb-1">Buscar por Nombre, Correo o Cédula:</label>
            <input
              type="text"
              id="userSearch"
              placeholder="Escribe para buscar..."
              value={localSearchTerm}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setLocalSearchTerm(e.target.value)}
              className="w-full text-sm"
            />
          </div>
          <div>
            <label htmlFor="schoolFilterUsers" className="block text-sm sm:text-base font-medium text-text-secondary mb-1">Filtrar por Colegio:</label>
            <select
              id="schoolFilterUsers"
              value={filters.schoolId || ''} 
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setFilter('schoolId', e.target.value)} 
              className="w-full text-sm"
              disabled={isLoadingSchools}
            >
              <option value="">Todos los Colegios</option>
              {isLoadingSchools ? (
                <option disabled>Cargando colegios...</option>
              ) : (
                schools.map(school => (
                  <option key={school.id} value={school.id}>{school.name}</option>
                ))
              )}
            </select>
          </div>
        </div>
      </div>

      {isLoadingSchools && !filteredUsers.length ? (
        <div className="text-center py-12 bg-brand-primary p-6 rounded-lg shadow-card">
           <p className="text-text-secondary text-sm sm:text-base">Cargando datos...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-12 bg-brand-primary p-6 rounded-lg shadow-card">
          <svg className="mx-auto h-12 w-12 text-brand-quaternary" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 016-6h6a6 6 0 016 6v1h-3M15 21H9" />
          </svg>
          <h3 className="mt-2 text-base sm:text-lg font-medium text-text-primary">
            {allUsers.length === 0 ? "No hay usuarios registrados." : "No se encontraron usuarios."} 
          </h3>
          <p className="mt-1 text-sm text-text-secondary">
            {allUsers.length > 0 ? "Intenta ajustar tu búsqueda o filtros." : "Cuando los usuarios se registren, aparecerán aquí."} 
          </p>
        </div>
      ) : (
        <div className="bg-brand-primary shadow-card rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm text-left text-text-secondary">
              <thead className="text-xs text-text-primary uppercase bg-brand-gray-light bg-opacity-50">
                <tr>
                  <th scope="col" className="px-4 py-3">Nombre Completo</th>
                  <th scope="col" className="px-4 py-3">Correo Electrónico</th>
                  <th scope="col" className="px-4 py-3">Teléfono</th>
                  <th scope="col" className="px-4 py-3">Cédula</th>
                  <th scope="col" className="px-4 py-3">Colegio</th>
                  <th scope="col" className="px-4 py-3 text-center">Rol</th> 
                  <th scope="col" className="px-4 py-3 text-center">Pedidos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-gray-light">
                {filteredUsers.map((user: UserProfile) => {
                  const isCurrentUserAdmin = currentUser?.isAdmin;
                  const isTargetUserAdminOrSales = user.isAdmin || user.isSales;
                  const isSelf = currentUser?.id === user.id;
                  const canEditSchool = isCurrentUserAdmin && !isTargetUserAdminOrSales && !isSelf;

                  return (
                    <tr key={user.id} className="hover:bg-brand-gray-light hover:bg-opacity-30 transition-colors">
                      <td className="px-4 py-2 font-medium text-text-primary whitespace-nowrap text-xs sm:text-sm">{user.firstName} {user.lastName}</td>
                      <td className="px-4 py-2 text-xs sm:text-sm">{user.email}</td>
                      <td className="px-4 py-2 text-xs sm:text-sm">{user.phone || 'N/A'}</td>
                      <td className="px-4 py-2 text-xs sm:text-sm">{user.idCardNumber || 'N/A'}</td>
                      <td className="px-4 py-2 text-xs sm:text-sm">
                        {canEditSchool ? (
                          <select
                            value={user.schoolId || ''}
                            onChange={(e) => handleSchoolChangeForUser(user.id, e.target.value)}
                            className="w-full p-1.5 text-xs bg-brand-primary border border-brand-quaternary rounded-md shadow-sm focus:ring-1 focus:ring-brand-tertiary focus:border-transparent transition-colors"
                            disabled={isLoadingSchools}
                            aria-label={`Cambiar colegio para ${user.firstName} ${user.lastName}`}
                          >
                            <option value="">No asignado</option>
                            {isLoadingSchools ? (
                              <option disabled>Cargando...</option>
                            ) : (
                              schools.map(school => (
                                <option key={school.id} value={school.id}>{school.name}</option>
                              ))
                            )}
                          </select>
                        ) : (
                          getSchoolName(user.schoolId)
                        )}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {getUserRoleDisplay(user)}
                      </td>
                      <td className="px-4 py-2 text-center text-xs sm:text-sm">{user.orders?.length || 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManageUsersPage;
