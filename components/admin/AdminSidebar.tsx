
import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import DashboardIcon from './icons/DashboardIcon';
import SchoolIcon from './icons/SchoolIcon';
import MediaIcon from './icons/MediaIcon'; 
import UserIcon from '../icons/UserIcon'; 
import OrdersIcon from './icons/OrdersIcon';
import SignOutIcon from './icons/SignOutIcon';
import HomeIcon from './icons/HomeIcon'; 
// SettingsIcon import removed as it's no longer used for the PDF config link here
import { useAuth } from '../../contexts/AuthContext';

interface AdminSidebarProps {
  onLinkClick?: () => void; 
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ onLinkClick }) => {
  const { currentUser, logout } = useAuth();

  const navLinkClasses = "flex items-center px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base font-medium rounded-lg transition-colors";
  const activeNavLinkClasses = "bg-brand-tertiary text-text-on-tertiary-bg shadow-sm";
  const inactiveNavLinkClasses = "text-brand-gray-light hover:bg-brand-primary hover:bg-opacity-10 hover:text-white";
  const iconClasses = "w-5 h-5 mr-2.5 sm:mr-3"; 

  // Common links for both Admin and Sales
  const baseCommonLinks = [
    { to: '/admin/dashboard', text: 'Panel Principal', icon: <DashboardIcon className={iconClasses} /> },
    { to: '/admin/usuarios', text: 'Gestión de Usuarios', icon: <UserIcon className={iconClasses} /> }, 
    { to: '/admin/pedidos', text: 'Gestión de Pedidos', icon: <OrdersIcon className={iconClasses} /> },
  ];

  // Links that were previously Admin exclusive, now for Sales too
  const formerlyAdminExclusiveLinks = [
    { to: '/admin/colegios', text: 'Gestión de Catálogo', icon: <SchoolIcon className={iconClasses} /> },
    { to: '/admin/medios', text: 'Gestión de Medios', icon: <MediaIcon className={iconClasses} /> }, 
  ];

  let linksToShow: Array<{ to: string; text: string; icon: JSX.Element }> = [];

  if (currentUser?.role === 'admin' || currentUser?.role === 'sales') {
    const dashboardLink = baseCommonLinks.find(l => l.to === '/admin/dashboard')!;
    // Order: Dashboard, Catalog, Media, then rest of common (Users, Orders)
    linksToShow = [
      dashboardLink,
      ...formerlyAdminExclusiveLinks,
      ...baseCommonLinks.filter(l => l.to !== '/admin/dashboard') // Users, Orders
    ];
  }


  const panelTitle = "U&B PANEL"; // Unificado


  return (
    <div className="flex flex-col w-64 bg-brand-secondary h-full shadow-lg">
      <div className="flex items-center justify-center h-16 sm:h-20 border-b border-brand-primary border-opacity-20 lg:justify-start lg:px-4 sm:lg:px-6">
        <Link to="/admin/dashboard" className="text-brand-primary hover:text-brand-tertiary transition-colors text-center lg:text-left">
          <span className="block text-lg sm:text-xl font-bold text-brand-tertiary tracking-wider">{panelTitle}</span>
        </Link>
      </div>
      <nav className="flex-1 px-2 sm:px-3 py-3 sm:py-4 space-y-1 sm:space-y-1.5 overflow-y-auto">
        {linksToShow.map(linkInfo => (
          <React.Fragment key={linkInfo.to}>
            <NavLink
              to={linkInfo.to}
              onClick={onLinkClick}
              className={({ isActive }) => 
                `${navLinkClasses} ${isActive ? activeNavLinkClasses : inactiveNavLinkClasses}`
              }
            >
              {linkInfo.icon}
              {linkInfo.text}
            </NavLink>
          </React.Fragment>
        ))}
      </nav>
      <div className="px-2 sm:px-3 py-3 sm:py-4 border-t border-brand-primary border-opacity-20 space-y-1 sm:space-y-2">
        <Link
            to="/"
            onClick={onLinkClick}
            className={`${navLinkClasses} ${inactiveNavLinkClasses}`}
            title="Ir al Sitio Público"
          >
            <HomeIcon className={iconClasses} />
            Sitio Público
        </Link>
        <button
            onClick={() => { if(onLinkClick) onLinkClick(); logout(); }}
            className={`${navLinkClasses} ${inactiveNavLinkClasses} w-full`}
            title="Cerrar Sesión"
          >
            <SignOutIcon className={iconClasses} />
            Cerrar Sesión
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
