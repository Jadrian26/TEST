
import React, { ChangeEvent, useMemo } from 'react';
import { Link } from 'react-router-dom'; 
import { useAuth } from '../../contexts/AuthContext';
import { useEditableContent } from '../../contexts/EditableContentContext';
import { UserProfile, School } from '../../types';
import { useSearchAndFilter } from '../../hooks/useSearchAndFilter';
import { useNotifications } from '../../contexts/NotificationsContext';
import EditIcon from '../../components/admin/icons/EditIcon'; 

const AdminManageUsersPage: React.FC = () => {
  const { currentUser, registeredUsers } = useAuth(); // Removed updateUserProfileByAdmin as it's not used here
  const { schools, isLoading: isLoadingSchools } = useEditableContent();
  // const { showNotification } = useNotifications(); // Removed as notifications are not triggered here

  const {
    processedData: filteredUsers,
    searchTerm,
    setSearchTerm,
    filters,
    setFilter
  } = useSearchAndFilter<UserProfile>(registeredUsers, {
    searchKeys: ['firstName', 'lastName', 'email', 'idCardNumber'],
    // For filtering by school, we need a custom filter logic since affiliations is an array
    // This will be handled by the filter logic inside useMemo for processedData
  });
  
  const usersWithFormattedSchools = useMemo(() => {
    return filteredUsers.map(user => {
      let schoolDisplay = 'N/A';
      if (user.role === 'client' && user.affiliations && user.affiliations.length > 0) {
        const approvedSchools = user.affiliations
          .filter(aff => aff.status === 'approved')
          .map(aff => schools.find(s => s.id === aff.schoolId)?.name)
          .filter(Boolean); // Remove undefined if school not found
        if (approvedSchools.length > 0) {
          schoolDisplay = approvedSchools.join(', ');
        } else {
          const pendingSchools = user.affiliations
            .filter(aff => aff.status === 'pending')
            .map(aff => schools.find(s => s.id === aff.schoolId)?.name)
            .filter(Boolean);
          if (pendingSchools.length > 0) schoolDisplay = `Pendiente: ${pendingSchools.join(', ')}`;
          else schoolDisplay = 'Sin colegio aprobado';
        }
      }
      return { ...user, schoolDisplay };
    });
  }, [filteredUsers, schools]);
  
  const finalFilteredUsers = useMemo(() => {
    if (filters.schoolId && filters.schoolId !== '') {
        return usersWithFormattedSchools.filter(user => {
            if (user.role !== 'client' || !user.affiliations) return false;
            // Check if any approved affiliation matches the filter
            return user.affiliations.some(aff => aff.status === 'approved' && aff.schoolId === filters.schoolId);
        });
    }
    return usersWithFormattedSchools;
  }, [usersWithFormattedSchools, filters.schoolId]);


  const getUserRoleDisplay = (user: UserProfile) => {
    if (user.role === 'admin') {
      return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-error text-white shadow-sm">Admin</span>;
    }
    if (user.role === 'sales') {
      return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-600 text-white shadow-sm">Ventas</span>;
    }
    return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-brand-quaternary text-white shadow-sm">Cliente</span>;
  };

  const canCurrentUserEditTargetUser = (targetUser: UserProfile): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin' || currentUser.role === 'sales') {
      // Admins/Sales can edit clients.
      // They cannot edit another Admin or Sales user if their own ID is different from the target.
      // They cannot edit themselves (this is handled by comparing IDs, but role check ensures only privileged users try to edit).
      if (targetUser.role === 'client') return true;
      if ((targetUser.role === 'admin' || targetUser.role === 'sales') && currentUser.id !== targetUser.id) {
        // This is where finer-grained control could be added, e.g., an Admin can edit Sales, but Sales cannot edit Admin.
        // For "same permissions", both Admin and Sales can edit Clients, but not other Admins or Sales.
        // The AdminEditUserPage itself has logic to prevent role escalation or modification of other Admins/Sales.
        // Here, we just decide if the "Edit" button shows.
        // If Sales has same permissions as Admin, they can edit users except other Admins/Sales or themselves.
        // This is more about *initiating* an edit. The Edit page handles restrictions.
        // For now, let's say an admin can initiate edit for any other user. Sales can initiate for clients.
        // If user request is "same permissions", then sales should be able to click edit for other sales too,
        // but the edit page will restrict actual role changes.
        // return currentUser.id !== targetUser.id; // This allows editing anyone but self.
        // Let's refine: if current user is admin, they can edit anyone but self.
        // If current user is sales, they can edit clients, and potentially other sales (but not admins).
        // For "same permissions as admin", sales should be able to edit other sales users.
        if (currentUser.role === 'admin') return currentUser.id !== targetUser.id;
        if (currentUser.role === 'sales') {
            if (targetUser.role === 'admin') return false; // Sales cannot edit Admins
            return currentUser.id !== targetUser.id; // Sales can edit clients and other sales (but not self)
        }
      }
      return false; // Should not happen if roles are admin/sales/client
    }
    return false;
  };
  
  const showEditButton = (targetUser: UserProfile): boolean => {
    if (!currentUser) return false;
    // An admin can edit anyone (except themselves, which is not relevant for button display here, but for edit page logic).
    // Sales can edit anyone (except themselves). The AdminEditUserPage will enforce specific role change restrictions.
    return (currentUser.role === 'admin' || currentUser.role === 'sales') && currentUser.id !== targetUser.id;
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
              value={searchTerm}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="w-full text-sm"
            />
          </div>
          <div>
            <label htmlFor="schoolFilterUsers" className="block text-sm sm:text-base font-medium text-text-secondary mb-1">Filtrar por Colegio (Aprobado):</label>
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

      {isLoadingSchools && !finalFilteredUsers.length ? (
        <div className="text-center py-12 bg-brand-primary p-6 rounded-lg shadow-card">
           <p className="text-text-secondary text-sm sm:text-base">Cargando datos...</p>
        </div>
      ) : finalFilteredUsers.length === 0 ? (
        <div className="text-center py-12 bg-brand-primary p-6 rounded-lg shadow-card">
          <svg className="mx-auto h-12 w-12 text-brand-quaternary" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 016-6h6a6 6 0 016 6v1h-3M15 21H9" />
          </svg>
          <h3 className="mt-2 text-base sm:text-lg font-medium text-text-primary">
            {registeredUsers.length === 0 ? "No hay usuarios registrados." : "No se encontraron usuarios."}
          </h3>
          <p className="mt-1 text-sm text-text-secondary">
            {registeredUsers.length > 0 ? "Intenta ajustar tu búsqueda o filtros." : "Cuando los usuarios se registren, aparecerán aquí."}
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
                  <th scope="col" className="px-4 py-3">Colegios (Cliente)</th>
                  <th scope="col" className="px-4 py-3 text-center">Rol</th>
                  <th scope="col" className="px-4 py-3 text-center">Pedidos</th>
                  <th scope="col" className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-gray-light">
                {finalFilteredUsers.map((user) => {
                  return (
                    <tr key={user.id} className="hover:bg-brand-gray-light hover:bg-opacity-30 transition-colors">
                      <td className="px-4 py-2 font-medium text-text-primary whitespace-nowrap text-xs sm:text-sm">{user.firstName} {user.lastName}</td>
                      <td className="px-4 py-2 text-xs sm:text-sm">{user.email}</td>
                      <td className="px-4 py-2 text-xs sm:text-sm">{user.phone || 'N/A'}</td>
                      <td className="px-4 py-2 text-xs sm:text-sm">{user.idCardNumber || 'N/A'}</td>
                      <td className="px-4 py-2 text-xs sm:text-sm max-w-xs truncate" title={user.schoolDisplay}>
                        {user.schoolDisplay}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {getUserRoleDisplay(user)}
                      </td>
                      <td className="px-4 py-2 text-center text-xs sm:text-sm">{user.orders?.length || 0}</td>
                      <td className="px-4 py-2 text-right whitespace-nowrap">
                        {showEditButton(user) && ( 
                           <Link
                             to={`/admin/usuarios/editar/${user.id}`}
                             className="icon-btn !p-1.5 text-brand-secondary hover:text-brand-tertiary"
                             title="Editar Usuario"
                            >
                              <EditIcon className="w-4 h-4" />
                           </Link>
                        )}
                      </td>
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
