
import React from 'react'; 
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useEditableContent } from '../../contexts/EditableContentContext';
// Icons for summary cards (can reuse from AdminSidebar or create specific ones)
import SchoolIcon from '../../components/admin/icons/SchoolIcon';
// ProductIcon import removed as SchoolIcon will be used for product-related stat card linking to school management
import UserIcon from '../../components/icons/UserIcon'; 
import OrdersIcon from '../../components/admin/icons/OrdersIcon';
// EditIcon import removed as it's no longer used here for Brand Logo
// EditBrandLogoModal import removed as it's no longer used here

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; linkTo: string; linkText: string; bgColorClass?: string }> = ({ title, value, icon, linkTo, linkText, bgColorClass = "bg-brand-primary" }) => (
    <div className={`${bgColorClass} p-6 rounded-xl shadow-card hover:shadow-card-hover transition-shadow transform hover:-translate-y-1 flex flex-col`}>
        <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 bg-brand-tertiary bg-opacity-20 rounded-lg text-brand-tertiary">
                {icon}
            </div>
        </div>
        <h3 className="text-base sm:text-lg font-semibold text-text-secondary mb-1">{title}</h3>
        <p className="text-2xl sm:text-3xl font-bold text-brand-secondary mb-4">{value}</p>
        <Link to={linkTo} className="mt-auto text-sm font-medium text-brand-tertiary hover:text-brand-secondary transition-colors self-start group">
            {linkText} <span className="ml-1 transition-transform group-hover:translate-x-0.5">&rarr;</span>
        </Link>
    </div>
);


const AdminDashboardPage: React.FC = () => {
  const { currentUser, allUsers } = useAuth(); // Changed registeredUsers to allUsers
  const { schools, products, isLoading: isLoadingContent } = useEditableContent();
  // isEditBrandLogoModalOpen state removed

  const totalOrders = allUsers.reduce((sum, user) => sum + (user.orders?.length || 0), 0);

  if (isLoadingContent) {
    return <div className="text-center py-10 text-text-secondary">Cargando datos del panel...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="pb-6 border-b border-brand-quaternary border-opacity-30">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-brand-secondary mb-1">Panel de Administración</h1>
        <p className="text-text-secondary text-base sm:text-lg">¡Bienvenido de nuevo, {currentUser?.firstName || 'Admin'}! Resumen de tu aplicación.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
            title="Colegios Totales" 
            value={schools.length} 
            icon={<SchoolIcon className="w-6 h-6"/>}
            linkTo="/admin/colegios"
            linkText="Ver Gestión de Catálogo"
        />
        <StatCard 
            title="Productos Totales" 
            value={products.length} 
            icon={<SchoolIcon className="w-6 h-6"/>} 
            linkTo="/admin/colegios" 
            linkText="Gestionar Productos" 
        />
         <StatCard 
            title="Usuarios Registrados" 
            value={allUsers.length}  // Changed registeredUsers to allUsers
            icon={<UserIcon className="w-6 h-6"/>} 
            linkTo="/admin/usuarios"
            linkText="Ver Gestión de Usuarios"
        />
        <StatCard 
            title="Pedidos Totales" 
            value={totalOrders} 
            icon={<OrdersIcon className="w-6 h-6"/>}
            linkTo="/admin/pedidos"
            linkText="Ver Gestión de Pedidos"
        />
      </div>

      {/* Sección "Configuración y Acciones Rápidas" eliminada */}
      
      {/* EditBrandLogoModal instance removed from here */}
    </div>
  );
};

export default AdminDashboardPage;