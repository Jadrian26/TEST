
import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext'; 
import { useEditableContent } from '../contexts/EditableContentContext';
import { useMedia } from '../contexts/MediaContext';
import { APP_NAME, NAV_LINKS_PRIMARY } from '../constants';
import ShoppingCartIcon from './icons/ShoppingCartIcon';
import UserIcon from './icons/UserIcon';
import MenuIcon from './icons/MenuIcon';
import CloseIcon from './icons/CloseIcon';
import ShieldCheckIcon from './icons/ShieldCheckIcon'; 
import EditIcon from './admin/icons/EditIcon';
import EditBrandLogoModal from './admin/EditBrandLogoModal';
import useClickOutside from '../hooks/useClickOutside'; // Importado
import useModalState from '../hooks/useModalState'; // Importado

const BrandDisplay: React.FC<{ brandLogoItem: ReturnType<typeof useMedia>['mediaItems'][0] | null | undefined }> = React.memo(({ brandLogoItem }) => {
  if (brandLogoItem) {
    return (
      <img 
        src={brandLogoItem.public_url} 
        alt={APP_NAME} 
        className="h-10 sm:h-12 md:h-14 w-auto object-contain transition-all duration-300" // Adjusted height
        aria-label={APP_NAME}
      />
    );
  }
  return (
    <span className="text-lg sm:text-xl font-bold text-brand-secondary hover:text-brand-tertiary transition-colors flex-shrink-0"> {/* Adjusted text size */}
      {APP_NAME}
    </span>
  );
});
BrandDisplay.displayName = 'BrandDisplay'; // For better debugging

const Navbar: React.FC = () => {
  const { itemCount: cartItemCount, totalAmount } = useCart();
  const { currentUser } = useAuth(); 
  const { brandLogoId } = useEditableContent();
  const { mediaItems } = useMedia();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  
  const { 
    isOpen: isEditBrandLogoModalOpen, 
    openModal: openEditBrandLogoModal, 
    closeModal: closeEditBrandLogoModal 
  } = useModalState();

  const navLinkClasses = "text-sm md:text-base font-medium text-text-primary hover:text-brand-tertiary transition-colors py-2"; // Adjusted text size
  const activeNavLinkClasses = "text-brand-tertiary border-b-2 border-brand-tertiary";
  
  const iconTextButtonClasses = "flex items-center text-text-secondary hover:text-brand-tertiary px-2 py-1.5 rounded-md hover:bg-brand-tertiary/10 transition-colors duration-150 group";

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  }

  const handleMobileMenuClose = () => {
    setIsMobileMenuOpen(false);
  }

  useClickOutside(mobileMenuRef, (event) => {
    const menuToggle = document.getElementById('mobile-menu-button');
    if (menuToggle && menuToggle.contains(event.target as Node)) {
      return; 
    }
    handleMobileMenuClose();
  });


  const brandLogoItem = brandLogoId ? mediaItems.find(item => item.id === brandLogoId) : null;
  
  const showAdminPanelLink = currentUser?.isAdmin || currentUser?.isSales;
  const adminPanelText = currentUser?.isAdmin ? "Panel Admin" : (currentUser?.isSales ? "Panel Ventas" : "Panel");


  return (
    <>
      <header className="bg-brand-primary shadow-card sticky top-0 z-50">
        <div className="container mx-auto px-4">
          {/* Adjusted navbar height from h-24 to h-20 */}
          <div className="flex items-center justify-between h-20 relative"> 
            <div className="flex items-center">
              <button
                id="mobile-menu-button"
                onClick={handleMobileMenuToggle}
                className="icon-btn md:hidden mr-2"
                aria-label="Alternar menú"
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-menu"
              >
                {isMobileMenuOpen ? <CloseIcon className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />} {/* Consistent icon size */}
              </button>

              <div className="flex items-center group">
                <Link to="/" className="flex items-center" aria-label={`Ir a la página de inicio de ${APP_NAME}`}>
                  <BrandDisplay brandLogoItem={brandLogoItem} />
                </Link>
                {currentUser?.isAdmin && (
                  <button
                    onClick={openEditBrandLogoModal} 
                    className="ml-2 p-1 rounded-full hover:bg-brand-tertiary/15 text-text-secondary hover:text-brand-secondary opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-150 self-center" // Adjusted self-start mt-1 to self-center
                    aria-label="Editar logo del sitio"
                    title="Editar Logo del Sitio"
                  >
                    <EditIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <nav className="hidden md:flex flex-grow justify-center items-center">
              <div className="flex space-x-5 lg:space-x-6 items-center"> {/* Adjusted spacing slightly */}
                {NAV_LINKS_PRIMARY.map((link) => (
                  <NavLink
                    key={link.name}
                    to={link.path}
                    className={({ isActive }) =>
                      isActive ? `${navLinkClasses} ${activeNavLinkClasses}` : navLinkClasses
                    }
                  >
                    {link.name}
                  </NavLink>
                ))}
                {showAdminPanelLink && (
                  <NavLink
                    to="/admin/dashboard" 
                    className={({ isActive }) =>
                      `${isActive ? `${navLinkClasses} ${activeNavLinkClasses}` : navLinkClasses} flex items-center`
                    }
                  >
                    <ShieldCheckIcon className="w-5 h-5 mr-1.5 text-brand-secondary group-hover:text-brand-tertiary" />
                    {adminPanelText}
                  </NavLink>
                )}
              </div>
            </nav>
            
            <div className="flex items-center space-x-1 sm:space-x-2">
              {(currentUser?.isAdmin || (currentUser?.isSales && !currentUser.isAdmin)) && (
                <span 
                  className={`hidden md:inline-block mr-2 text-xs font-bold px-2 py-0.5 rounded-full border ${
                    currentUser.isAdmin 
                      ? 'text-error bg-error/10 border-error/50' 
                      : 'text-blue-600 bg-blue-600/10 border-blue-600/50' // Sales Mode Style
                  }`}
                  title={currentUser.isAdmin ? "Modo Administrador Activo" : "Modo Ventas Activo"}
                >
                  {currentUser.isAdmin ? "MODO ADMIN" : "MODO VENTAS"}
                </span>
              )}
              <Link 
                to="/account" 
                className={iconTextButtonClasses}
                aria-label="Mi cuenta"
              >
                <UserIcon className="w-5 h-5 transition-colors" /> {/* Consistent icon size */}
                <span className="ml-1.5 text-sm md:text-base font-medium hidden sm:inline">Mi Cuenta</span> {/* Adjusted text size */}
              </Link>
              <Link 
                to="/cart" 
                className={`${iconTextButtonClasses} relative`}
                aria-label="Carrito de compras"
              >
                <ShoppingCartIcon className="w-5 h-5 transition-colors" /> {/* Consistent icon size */}
                {currentUser && cartItemCount > 0 && (
                  <span className="ml-1.5 text-sm md:text-base font-semibold text-brand-secondary hidden sm:inline"> {/* Adjusted text size */}
                    ${totalAmount.toFixed(2)}
                  </span>
                )}
                {currentUser && cartItemCount > 0 && ( 
                  <span className="absolute -top-1 -right-1.5 bg-red-500 text-white text-xs font-bold rounded-full h-4.5 w-4.5 flex items-center justify-center p-0.5"> {/* Adjusted badge size/position */}
                    {cartItemCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>

        <div
          id="mobile-menu"
          ref={mobileMenuRef} 
          className={`md:hidden bg-brand-primary shadow-lg absolute w-full z-40 overflow-hidden transition-all duration-300 ease-out-expo
                        ${isMobileMenuOpen ? 'max-h-screen opacity-100 visible pb-4 translate-y-0' : 'max-h-0 opacity-0 invisible -translate-y-4'}`}
        >
          <nav className="flex flex-col space-y-1 px-4 pt-3">
            {(currentUser?.isAdmin || (currentUser?.isSales && !currentUser.isAdmin)) && (
                <div className={`px-3 py-2 text-sm font-bold rounded-md text-center mb-2 ${
                    currentUser.isAdmin 
                      ? 'text-error bg-error/10' 
                      : 'text-blue-600 bg-blue-600/10' // Sales Mode Style
                  }`}>
                  {currentUser.isAdmin ? "MODO ADMIN ACTIVO" : "MODO VENTAS ACTIVO"}
                </div>
              )}
            {NAV_LINKS_PRIMARY.map((link) => (
              <NavLink
                key={link.name}
                to={link.path}
                onClick={handleMobileMenuClose}
                className={({ isActive }) =>
                  `${isActive ? 'bg-brand-tertiary/20 text-brand-secondary font-semibold' : 'text-text-primary'} block px-3 py-3 rounded-md text-base hover:bg-brand-gray-light hover:text-brand-secondary transition-colors` // Increased py for better touch
                }
              >
                {link.name}
              </NavLink>
            ))}
             {showAdminPanelLink && (
                <NavLink
                  to="/admin/dashboard" 
                  onClick={handleMobileMenuClose}
                  className={({ isActive }) =>
                      `${isActive ? 'bg-brand-tertiary/20 text-brand-secondary font-semibold' : 'text-text-primary'} block px-3 py-3 rounded-md text-base hover:bg-brand-gray-light hover:text-brand-secondary transition-colors flex items-center` // Increased py
                  }
                >
                  <ShieldCheckIcon className="w-5 h-5 mr-2" />
                  {adminPanelText}
                </NavLink>
              )}
            <hr className="my-2 border-brand-quaternary opacity-30" />
            <NavLink
              to="/account"
              onClick={handleMobileMenuClose}
              className={({ isActive }) =>
                `${isActive ? 'bg-brand-tertiary/20 text-brand-secondary font-semibold' : 'text-text-primary'} block px-3 py-3 rounded-md text-base hover:bg-brand-gray-light hover:text-brand-secondary transition-colors` // Increased py
              }
            >
              Mi Cuenta
            </NavLink>
          </nav>
        </div>
      </header>
      {currentUser?.isAdmin && (
        <EditBrandLogoModal 
          isOpen={isEditBrandLogoModalOpen} 
          onClose={closeEditBrandLogoModal} 
        />
      )}
    </>
  );
};

export default Navbar;