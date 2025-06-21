
import React, { useMemo, ChangeEvent, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useEditableContent } from '../../contexts/EditableContentContext'; 
import { Order, UserProfile, School } from '../../types'; 
import ViewIcon from '../../components/admin/icons/ViewIcon';
import SettingsIcon from '../../components/admin/icons/SettingsIcon'; // Import SettingsIcon
import { useNotifications } from '../../contexts/NotificationsContext';
import WazeIcon from '../../components/icons/WazeIcon';
import GoogleMapsIcon from '../../components/icons/GoogleMapsIcon';
import { useSearchAndFilter } from '../../hooks/useSearchAndFilter';

interface ExtendedOrder extends Order {
  customerName: string; 
  customerEmail: string; 
  customerSchoolIds?: string[]; // Can be multiple approved school IDs
}

const AdminViewOrdersPage: React.FC = () => {
  const { currentUser, registeredUsers, updateOrderStatus } = useAuth();
  const { schools, isLoading: isLoadingSchools } = useEditableContent(); 
  const { showNotification } = useNotifications(); 
  
  const allOrdersForRole = useMemo<ExtendedOrder[]>(() => {
    let orders: ExtendedOrder[] = [];
    registeredUsers.forEach(user => {
      user.orders.forEach(order => {
        const orderOwner = registeredUsers.find(u => u.id === order.userId);
        
        let customerSchoolIds: string[] | undefined = undefined;
        if (orderOwner?.role === 'client' && orderOwner.affiliations) {
            customerSchoolIds = orderOwner.affiliations
                .filter(aff => aff.status === 'approved')
                .map(aff => aff.schoolId);
        }

        orders.push({
          ...order,
          customerName: order.customerNameForOrder || `${orderOwner?.firstName || 'Cliente'} ${orderOwner?.lastName || 'Desconocido'}`,
          customerEmail: orderOwner?.email || 'N/A',
          userId: order.userId, 
          customerSchoolIds: customerSchoolIds,
        });
      });
    });
    return orders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [registeredUsers]);
  
  const {
    processedData, // This will be further filtered by school
    searchTerm,
    setSearchTerm,
    filters,
    setFilter
  } = useSearchAndFilter<ExtendedOrder>(allOrdersForRole, {
    searchKeys: ['id', 'customerName', 'customerEmail', 'customerIdCardForOrder']
  });

  const filteredOrders = useMemo(() => {
    if (filters.customerSchoolId && filters.customerSchoolId !== '' && filters.customerSchoolId !== 'No asignado') {
      return processedData.filter(order => 
        order.customerSchoolIds && order.customerSchoolIds.includes(filters.customerSchoolId as string)
      );
    }
    if (filters.customerSchoolId === 'No asignado') {
      return processedData.filter(order => !order.customerSchoolIds || order.customerSchoolIds.length === 0);
    }
    return processedData;
  }, [processedData, filters.customerSchoolId]);


  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    const originalOrderData = allOrdersForRole.find(o => o.id === orderId);
    if (!originalOrderData) {
      showNotification('Error: No se encontró el pedido original.', 'error');
      return;
    }

    const result = await updateOrderStatus(originalOrderData.userId, orderId, newStatus);
    showNotification(result.message || (result.success ? 'Estado del pedido actualizado.' : 'Error al actualizar el estado.'), result.success ? 'success' : 'error');
  };
  
  const getSchoolNamesForOrder = (customerSchoolIds?: string[]): string => {
    if (isLoadingSchools || !customerSchoolIds || customerSchoolIds.length === 0) return 'No asignado';
    return customerSchoolIds
        .map(id => schools.find(s => s.id === id)?.name)
        .filter(Boolean) // Remove undefined if a school name wasn't found
        .join(', ') || 'No asignado';
  };

  const orderStatuses: Order['status'][] = ['Processing', 'Shipped', 'Delivered', 'Cancelled'];
  const getOrderStatusText = (status: Order['status']): string => {
    switch (status) {
      case 'Processing': return 'Procesando';
      case 'Shipped': return 'Enviado';
      case 'Delivered': return 'Entregado';
      case 'Cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const canManagePdfConfig = currentUser?.role === 'admin' || currentUser?.role === 'sales';


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-brand-quaternary border-opacity-30">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-brand-secondary">Gestión de Pedidos</h1>
          <p className="text-text-secondary text-base sm:text-lg mt-1">Revisa y gestiona todos los pedidos realizados en la plataforma.</p>
        </div>
        {canManagePdfConfig && (
          <Link
            to="/admin/pdf-config"
            className="btn-outline text-sm sm:text-base mt-3 sm:mt-0 py-2 px-4 flex items-center whitespace-nowrap"
            title="Configurar PDF de Pedidos"
          >
            <SettingsIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Configurar PDF
          </Link>
        )}
      </div>

      <div className="bg-brand-primary p-4 rounded-lg shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label htmlFor="orderSearch" className="block text-sm sm:text-base font-medium text-text-secondary mb-1">Buscar por ID Pedido, Cliente, Correo o Cédula:</label>
            <input
              type="text"
              id="orderSearch"
              placeholder="Escribe para buscar..."
              value={searchTerm}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="w-full text-sm"
            />
          </div>
          <div>
            <label htmlFor="statusFilter" className="block text-sm sm:text-base font-medium text-text-secondary mb-1">Filtrar por estado:</label>
            <select
              id="statusFilter"
              value={filters.status || ''}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setFilter('status', e.target.value as Order['status'] | '')}
              className="w-full text-sm"
            >
              <option value="">Todos los Estados</option>
              {orderStatuses.map(status => (
                <option key={status} value={status}>{getOrderStatusText(status)}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="schoolFilter" className="block text-sm sm:text-base font-medium text-text-secondary mb-1">Filtrar por Colegio del Cliente:</label>
            <select
              id="schoolFilter"
              value={filters.customerSchoolId || ''} // Note: filter key is customerSchoolId
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setFilter('customerSchoolId', e.target.value)}
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
               <option value="No asignado">No Asignado</option>
            </select>
          </div>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-12 bg-brand-primary p-6 rounded-lg shadow-card">
          <svg className="mx-auto h-12 w-12 text-brand-quaternary" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="mt-2 text-base sm:text-lg font-medium text-text-primary">
            {allOrdersForRole.length === 0 ? "No hay pedidos registrados." : "No se encontraron pedidos con los filtros actuales."}
          </h3>
          <p className="mt-1 text-sm text-text-secondary">
            {allOrdersForRole.length > 0 ? "Intenta ajustar tu búsqueda o filtros." : "Cuando se realicen pedidos, aparecerán aquí."}
          </p>
        </div>
      ) : (
        <div className="bg-brand-primary shadow-card rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] text-sm text-left text-text-secondary">
              <thead className="text-xs text-text-primary uppercase bg-brand-gray-light bg-opacity-50">
                <tr>
                  <th scope="col" className="px-4 py-3">ID Pedido</th>
                  <th scope="col" className="px-4 py-3">Fecha</th>
                  <th scope="col" className="px-4 py-3">Cliente</th>
                   { (currentUser?.role === 'admin' || currentUser?.role === 'sales') && <th scope="col" className="px-4 py-3">Cédula Cliente</th>}
                  <th scope="col" className="px-4 py-3">Colegios Cliente</th>
                  <th scope="col" className="px-4 py-3">Total</th>
                  <th scope="col" className="px-4 py-3">Estado</th>
                  <th scope="col" className="px-4 py-3">Dirección Envío</th>
                  <th scope="col" className="px-4 py-3">Mapas</th>
                  <th scope="col" className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-gray-light">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-brand-gray-light hover:bg-opacity-30 transition-colors">
                    <td className="px-4 py-2 font-medium text-text-primary whitespace-nowrap text-xs sm:text-sm">{order.id.replace('#','')}</td>
                    <td className="px-4 py-2 text-xs sm:text-sm">{new Date(order.date).toLocaleDateString('es-PA')}</td>
                    <td className="px-4 py-2 text-xs sm:text-sm">
                      <div>{order.customerName}</div>
                      <div className="text-xs text-brand-gray-medium">{order.customerEmail}</div>
                    </td>
                    {(currentUser?.role === 'admin' || currentUser?.role === 'sales') && <td className="px-4 py-2 text-xs sm:text-sm">{order.customerIdCardForOrder || 'N/A'}</td>}
                    <td className="px-4 py-2 text-xs sm:text-sm max-w-xs truncate" title={getSchoolNamesForOrder(order.customerSchoolIds)}>{getSchoolNamesForOrder(order.customerSchoolIds)}</td>
                    <td className="px-4 py-2 text-xs sm:text-sm">${order.total.toFixed(2)}</td>
                    <td className="px-4 py-2">
                      <select 
                        value={order.status} 
                        onChange={(e) => handleStatusChange(order.id, e.target.value as Order['status'])}
                        className={`text-xs p-1.5 border rounded-md w-full max-w-[120px] focus:ring-1 focus:outline-none transition-colors ${
                            order.status === 'Delivered' ? 'bg-success/10 text-green-700 border-success/30 focus:ring-success' : 
                            order.status === 'Shipped' ? 'bg-brand-tertiary/10 text-brand-secondary border-brand-tertiary/30 focus:ring-brand-tertiary' :
                            order.status === 'Processing' ? 'bg-yellow-400/10 text-yellow-600 border-yellow-400/30 focus:ring-yellow-500' :
                            'bg-error/10 text-red-600 border-error/30 focus:ring-error' 
                          }`}
                          aria-label={`Estado del pedido ${order.id}`}
                       >
                        {orderStatuses.map(status => (
                          <option key={status} value={status}>{getOrderStatusText(status)}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2 text-xs max-w-xs truncate" title={order.shippingAddress.primaryAddress}>
                        {order.shippingAddress.primaryAddress}
                        {order.shippingAddress.apartmentOrHouseNumber && `, ${order.shippingAddress.apartmentOrHouseNumber}`}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <div className="flex space-x-1.5 justify-center">
                        {order.shippingAddress.wazeUrl && (
                          <a href={order.shippingAddress.wazeUrl} target="_blank" rel="noopener noreferrer" className="icon-btn !p-1 text-brand-secondary hover:text-brand-tertiary" title="Abrir en Waze">
                            <WazeIcon className="w-4 h-4" ariaHidden={true}/>
                          </a>
                        )}
                        {order.shippingAddress.googleMapsUrl && (
                          <a href={order.shippingAddress.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="icon-btn !p-1 text-brand-secondary hover:text-brand-tertiary" title="Abrir en Google Maps">
                            <GoogleMapsIcon className="w-4 h-4" ariaHidden={true}/>
                          </a>
                        )}
                        {(!order.shippingAddress.wazeUrl && !order.shippingAddress.googleMapsUrl) && (
                            <span className="text-xs text-brand-gray-medium">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-right space-x-1 whitespace-nowrap">
                      <Link 
                        to={`/account/orders/${order.id.replace('#','')}`} 
                        className="icon-btn text-brand-secondary hover:text-brand-tertiary" 
                        title="Ver Detalles del Pedido"
                      >
                        <ViewIcon className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminViewOrdersPage;
