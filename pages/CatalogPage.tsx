
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEditableContent } from '../contexts/EditableContentContext';
import { useAuth } from '../contexts/AuthContext'; 
import ProductCard from '../components/ProductCard';
import SchoolCard from '../components/SchoolCard';
import { UserSchoolAffiliation, School } from '../types'; // Added School type

const CatalogPage: React.FC = () => {
  const { schoolId: routeSchoolId } = useParams<{ schoolId?: string }>();
  const navigate = useNavigate();
  
  const { schools, products, isLoading: isLoadingContent } = useEditableContent();
  const { currentUser } = useAuth();

  const [activeSchoolIdParam, setActiveSchoolIdParam] = useState<string | null>(null);

  useEffect(() => {
    setActiveSchoolIdParam(routeSchoolId || null);
  }, [routeSchoolId]);
  
  const handleSchoolSelect = (sId: string) => {
    navigate(`/catalog/school/${sId}`);
  };
  
  const handleClearSchoolFilter = () => {
    navigate('/catalog');
  };
  
  const clientApprovedSchoolIds = useMemo(() => {
    if (currentUser && currentUser.role === 'client') {
      return currentUser.affiliations
        .filter(aff => aff.status === 'approved')
        .map(aff => aff.schoolId);
    }
    return [];
  }, [currentUser]);

  const clientApprovedSchools = useMemo<School[]>(() => {
    if (currentUser && currentUser.role === 'client' && clientApprovedSchoolIds.length > 0) {
      return schools.filter(s => clientApprovedSchoolIds.includes(s.id));
    }
    return [];
  }, [currentUser, clientApprovedSchoolIds, schools]);

  const productsToDisplay = useMemo(() => {
    if (isLoadingContent) return [];

    if (currentUser && currentUser.role === 'client') {
      if (clientApprovedSchoolIds.length === 1 && !activeSchoolIdParam) {
        // Client with one approved school, show its products by default
        return products.filter(p => p.schoolId && p.schoolId === clientApprovedSchoolIds[0]);
      }
      if (activeSchoolIdParam && clientApprovedSchoolIds.includes(activeSchoolIdParam)) {
        // Client viewing a specific (approved) school's products
        return products.filter(p => p.schoolId === activeSchoolIdParam);
      }
      // Client has multiple approved schools but no specific one selected OR no approved schools
      // In the case of multiple approved and no activeSchoolIdParam, we show school cards, not products here.
      return []; 
    }
    // Admin, Sales, or Guest
    if (activeSchoolIdParam) {
      return products.filter(p => p.schoolId === activeSchoolIdParam);
    }
    return []; // No school selected by admin/sales/guest, so no products to show directly (they see school cards)
  }, [currentUser, clientApprovedSchoolIds, activeSchoolIdParam, products, isLoadingContent]);

  
  const currentSchoolForDisplayInfo = useMemo(() => {
    let schoolIdForInfo: string | null = activeSchoolIdParam; 
    
    if (currentUser?.role === 'client') {
      if (clientApprovedSchoolIds.length === 1 && !activeSchoolIdParam) {
        schoolIdForInfo = clientApprovedSchoolIds[0];
      } else if (activeSchoolIdParam && clientApprovedSchoolIds.includes(activeSchoolIdParam)) {
        schoolIdForInfo = activeSchoolIdParam;
      } else {
        schoolIdForInfo = null; // For "Mis Colegios" view or no approved schools
      }
    }
    // For Admin/Sales, activeSchoolIdParam is already set correctly
    if (isLoadingContent || !schoolIdForInfo) return null;
    return schools.find(s => s.id === schoolIdForInfo);
  }, [activeSchoolIdParam, schools, isLoadingContent, currentUser, clientApprovedSchoolIds]);
  

  let pageTitle = "Catálogo de Productos";
  let pageDescription = "Explora nuestros productos."; 

  const clientHasPendingRequests = currentUser?.role === 'client' && currentUser.affiliations.some(aff => aff.status === 'pending');
  const clientHasRejectedRequestsOnly = currentUser?.role === 'client' && 
                                       clientApprovedSchoolIds.length === 0 &&
                                       !clientHasPendingRequests &&
                                       currentUser.affiliations.some(aff => aff.status === 'rejected');

  if (!isLoadingContent) {
    if (currentUser?.role === 'client') {
      if (clientApprovedSchoolIds.length === 0) {
        pageTitle = "Solicitar Afiliación a Colegio";
        if (clientHasPendingRequests) {
            pageDescription = "Tu solicitud de colegio está pendiente de aprobación. Un administrador la revisará pronto.";
        } else if (clientHasRejectedRequestsOnly) {
             pageDescription = "Una o más de tus solicitudes de colegio anteriores fueron rechazadas. Por favor, ve a Mi Cuenta para solicitar una nueva o contacta a soporte.";
        } else { 
            pageDescription = "Para ver los productos y precios, por favor, solicita la afiliación a un colegio desde Mi Cuenta.";
        }
      } else if (clientApprovedSchoolIds.length === 1 && !activeSchoolIdParam) {
        const singleApprovedSchool = schools.find(s => s.id === clientApprovedSchoolIds[0]);
        if (singleApprovedSchool) {
          pageTitle = singleApprovedSchool.name;
          pageDescription = `Explora los productos disponibles para ${singleApprovedSchool.name}.`;
        }
      } else if (clientApprovedSchoolIds.length > 1 && !activeSchoolIdParam) {
        pageTitle = "Mis Colegios"; // UPDATED
        pageDescription = "Selecciona un colegio para ver sus productos.";
      } else if (activeSchoolIdParam && currentSchoolForDisplayInfo) {
        pageTitle = currentSchoolForDisplayInfo.name;
        pageDescription = `Explora los productos disponibles para ${currentSchoolForDisplayInfo.name}.`;
      }
    } else if (currentSchoolForDisplayInfo) { // Admin, Sales or Guest viewing a specific school
      pageTitle = currentSchoolForDisplayInfo.name;
      pageDescription = `Explora los productos disponibles para ${currentSchoolForDisplayInfo.name}.`;
      if (currentUser?.role === 'admin') pageTitle = `${currentSchoolForDisplayInfo.name} (Admin)`;
      else if (currentUser?.role === 'sales') pageTitle = `${currentSchoolForDisplayInfo.name} (Ventas)`;
    } else { // Admin, Sales or Guest on general /catalog
      pageTitle = "Catálogo de Productos";
      pageDescription = "Selecciona un colegio de la lista para ver sus productos.";
    }
  }


  if (isLoadingContent) {
    return <div className="text-center py-20">Cargando catálogo...</div>;
  }
  
  const shouldShowClientSchoolSetupMessage = currentUser?.role === 'client' && clientApprovedSchoolIds.length === 0;

  if (shouldShowClientSchoolSetupMessage) {
    return (
      <div className="text-center py-12 bg-brand-primary p-8 rounded-lg shadow-card max-w-lg mx-auto">
        <svg className="mx-auto h-12 w-12 text-brand-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <h2 className="mt-4 text-xl sm:text-2xl lg:text-3xl font-semibold text-brand-secondary">{pageTitle}</h2>
        <p className="mt-2 text-base sm:text-lg text-text-secondary">
          {pageDescription}
        </p>
        <div className="mt-6">
          <Link to="/account" className="btn-primary text-sm sm:text-base">
            Ir a Mi Cuenta
          </Link>
        </div>
      </div>
    );
  }

  // Determine if products for a specific school should be shown
  const showProductsForSpecificSchool = 
    (currentUser?.role === 'client' && clientApprovedSchoolIds.length === 1 && !activeSchoolIdParam) || // Client with 1 approved school, on /catalog
    (currentUser?.role === 'client' && activeSchoolIdParam && clientApprovedSchoolIds.includes(activeSchoolIdParam)) || // Client viewing specific approved school
    ((!currentUser || currentUser.role === 'admin' || currentUser.role === 'sales') && activeSchoolIdParam); // Admin/Sales/Guest viewing specific school

  // Determine if the school selection (cards) should be shown for clients with multiple approved schools
  const showClientSchoolSelectionCards =
    currentUser?.role === 'client' &&
    clientApprovedSchoolIds.length > 1 &&
    !activeSchoolIdParam;

  // Determine if the sidebar for school selection should be shown
  const showAdminGuestSchoolSelectionSidebar = 
    (!currentUser || currentUser.role === 'admin' || currentUser.role === 'sales') && 
    schools.length > 0;
    
  const showClientSchoolSelectionSidebar = 
    currentUser?.role === 'client' &&
    clientApprovedSchools.length > 1; 

  const showAnySidebar = showAdminGuestSchoolSelectionSidebar || showClientSchoolSelectionSidebar;

  const canShowPriceOnCard = (productSchoolId?: string) => {
    if (currentUser?.role === 'admin' || currentUser?.role === 'sales') return true;
    if (currentUser?.role === 'client' && productSchoolId && clientApprovedSchoolIds.includes(productSchoolId)) return true;
    return false;
  };

  const sidebarSchools = showClientSchoolSelectionSidebar ? clientApprovedSchools : schools;

  return (
    <div className={`flex flex-col ${showAnySidebar ? 'md:flex-row' : ''} gap-8`}>
      {showAnySidebar && (
        <aside className="md:w-1/4 lg:w-1/5 space-y-6 bg-brand-primary p-4 rounded-lg shadow-card self-start md:sticky md:top-24">
          <div>
            <h3 className="text-lg md:text-xl font-semibold text-brand-secondary mb-3 border-b pb-2 border-brand-gray-light">
              {showClientSchoolSelectionSidebar ? "Colegios" : "Colegios"} {/* UPDATED */}
            </h3>
            <ul className="space-y-1">
              {sidebarSchools.map(school => (
                <li key={school.id}>
                  <button
                    onClick={() => handleSchoolSelect(school.id)}
                    className={`w-full text-left px-3 py-2 rounded-md text-base md:text-lg transition-colors ${activeSchoolIdParam === school.id ? 'bg-brand-tertiary bg-opacity-20 text-brand-secondary font-semibold ring-1 ring-brand-tertiary' : 'text-text-primary hover:bg-brand-gray-light'}`}
                    aria-pressed={activeSchoolIdParam === school.id}
                  >
                    {school.name}
                  </button>
                </li>
              ))}
              <li>
                <button
                  onClick={handleClearSchoolFilter}
                  className="w-full text-left px-3 py-2 mt-2 rounded-md text-sm md:text-base text-brand-tertiary hover:underline"
                  aria-label="Ver todos los colegios"
                >
                  {showClientSchoolSelectionSidebar ? "Ver todos mis colegios" : "Ver todos los colegios"}
                </button>
              </li>
            </ul>
          </div>
        </aside>
      )}

      <main className={`${showAnySidebar ? 'md:w-3/4 lg:w-4/5' : 'w-full'}`}>
        <div className="mb-6 pb-4 border-b border-brand-gray-light">
          <div className="sm:flex sm:justify-between sm:items-center">
            <div className="mb-4 sm:mb-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-brand-secondary">{pageTitle}</h1>
              <p className={`mt-1 text-text-secondary ${(!currentUser || currentUser.role === 'admin' || currentUser.role === 'sales' || (currentUser.role === 'client' && clientApprovedSchoolIds.length > 1)) && !activeSchoolIdParam ? 'text-base sm:text-lg' : 'text-sm sm:text-base md:text-lg'}`}>{pageDescription}</p>
            </div>
          </div>
        </div>

        {/* Client view: Show their approved schools as cards if on /catalog and multiple approved */}
        {showClientSchoolSelectionCards && clientApprovedSchools.length > 0 && (
           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6"> {/* Adjusted to 3 columns for clients too */}
            {clientApprovedSchools.map(school => (
              <SchoolCard key={school.id} school={school} variant="default" isClickable={true} />
            ))}
          </div>
        )}
        
        {/* Admin/Guest view: Show all schools as cards if on /catalog */}
        {(!currentUser || currentUser.role === 'admin' || currentUser.role === 'sales') && !activeSchoolIdParam && (
          schools.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {schools.map(school => (
                <SchoolCard key={school.id} school={school} variant="default" isClickable={true} />
              ))}
            </div>
          ) : (
             <div className="text-center py-12 bg-brand-primary p-6 rounded-lg shadow-card">
              <svg className="mx-auto h-12 w-12 text-brand-quaternary" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2zm3-12V3m0 18v-2" />
              </svg>
              <h3 className="mt-2 text-lg sm:text-xl font-medium text-text-primary">No hay colegios disponibles.</h3>
              <p className="mt-1 text-base sm:text-lg text-text-secondary">Pronto agregaremos más colegios. ¡Vuelve a visitarnos!</p>
            </div>
          )
        )}

        {/* Show products if a specific school is selected (by any user type) OR if client has 1 approved school */}
        {showProductsForSpecificSchool && (
          productsToDisplay.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
              {productsToDisplay.map(product => (
                <ProductCard key={product.id} product={product} showPrice={canShowPriceOnCard(product.schoolId)} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-brand-primary p-6 rounded-lg shadow-card">
              <svg className="mx-auto h-12 w-12 text-brand-quaternary" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2zm3-12V3m0 18v-2" />
              </svg>
              <h3 className="mt-2 text-base sm:text-lg font-medium text-text-primary">
                {currentSchoolForDisplayInfo ? `No hay productos disponibles para ${currentSchoolForDisplayInfo.name}.` : 
                 (currentUser?.role === 'client' ? 'No hay productos disponibles para tus colegios aprobados.' : 'Selecciona un colegio para ver productos.')
                }
              </h3>
              <p className="mt-1 text-sm text-text-secondary">
                 Pronto agregaremos más productos. ¡Vuelve a visitarnos!
              </p>
              {(!currentUser || currentUser.role === 'admin' || currentUser.role === 'sales') && !currentSchoolForDisplayInfo && activeSchoolIdParam && ( 
                <div className="mt-6">
                    <p className="text-sm text-error mb-3">El colegio seleccionado no existe o no tiene productos.</p>
                    <button
                        onClick={handleClearSchoolFilter}
                        className="btn-secondary text-sm"
                        aria-label="Ver todos los colegios"
                    >
                        Ver Todos los Colegios
                    </button>
                </div>
              )}
              {(!currentUser || currentUser.role === 'admin' || currentUser.role === 'sales' || (currentUser?.role === 'client' && clientApprovedSchoolIds.length > 1)) && currentSchoolForDisplayInfo && productsToDisplay.length === 0 && ( 
                 <div className="mt-6">
                    <button
                        onClick={handleClearSchoolFilter}
                        className="btn-outline text-sm"
                        aria-label="Explorar Otros Colegios"
                    >
                        {currentUser?.role === 'client' ? "Explorar Mis Otros Colegios" : "Explorar Otros Colegios"}
                    </button>
                </div>
              )}
            </div>
          )
        )}
      </main>
    </div>
  );
};

export default CatalogPage;
