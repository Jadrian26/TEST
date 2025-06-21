
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import MenuIcon from '../icons/MenuIcon';
import CloseIcon from '../icons/CloseIcon';
// APP_NAME import removed as panelTitle is now static for this component's display logic
// import { APP_NAME } from '../../constants'; 
// useAuth import removed as currentUser is not directly used here for title, but panelTitle is static "U&B Panel" now for header
// import { useAuth } from '../../contexts/AuthContext'; 

const AdminLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  // const { currentUser } = useAuth(); // No longer needed here directly for panelTitle logic

  const panelTitle = "U&B Panel"; // Unificado para la cabecera móvil

  return (
    <div className="flex h-screen bg-brand-gray-light">
      {/* Sidebar for larger screens */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <AdminSidebar />
      </div>

      {/* Main content area */}
      <div className="flex flex-col flex-1 w-full overflow-hidden">
        {/* Admin Header for mobile/tablet */}
        <header className="lg:hidden bg-brand-primary shadow-md sticky top-0 z-30">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="icon-btn text-text-primary mr-2"
                aria-label="Alternar Menú Admin"
              >
                {isSidebarOpen ? <CloseIcon className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
              </button>
              <span className="text-base sm:text-lg font-semibold text-brand-secondary">{panelTitle}</span>
            </div>
          </div>
        </header>

        {/* Mobile Sidebar (Drawer) */}
        {isSidebarOpen && (
          <div 
            className="lg:hidden fixed inset-0 z-[50] bg-black bg-opacity-50 transition-opacity duration-300"
            onClick={() => setIsSidebarOpen(false)}
            aria-hidden="true"
          ></div>
        )}
        <div
          className={`lg:hidden fixed inset-y-0 left-0 z-[60] transform transition-transform duration-300 ease-in-out bg-brand-secondary w-64
                      ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
          role="dialog"
          aria-modal="true"
          aria-label="Menú de administración"
        >
          <AdminSidebar onLinkClick={() => setIsSidebarOpen(false)} />
        </div>
        
        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-brand-gray-light p-4 sm:p-6 lg:p-8">
          <Outlet /> 
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
