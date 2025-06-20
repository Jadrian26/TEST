
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEditableContent } from '../contexts/EditableContentContext';
import { useAuth } from '../contexts/AuthContext'; // Import useAuth
import ProductCard from '../components/ProductCard';
import SchoolCard from '../components/SchoolCard';

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

  const determinedSchoolId = useMemo(() => {
    // Admin y Ventas pueden ver cualquier colegio según el parámetro de ruta
    if (currentUser && (currentUser.isAdmin || currentUser.isSales)) {
      return activeSchoolIdParam;
    }
    // Cliente autenticado sin rol especial va a su colegio si lo tiene
    if (currentUser && !currentUser.isAdmin && !currentUser.isSales && currentUser.schoolId) {
      return currentUser.schoolId;
    }
    // Si no, usa el de la ruta (para no autenticados o autenticados sin colegio que exploran)
    return activeSchoolIdParam;
  }, [currentUser, activeSchoolIdParam]);

  const productsToDisplay = useMemo(() => {
    if (isLoadingContent || !determinedSchoolId) return [];
    return products.filter(p => p.schoolId === determinedSchoolId);
  }, [determinedSchoolId, products, isLoadingContent]);

  const currentSchoolForDisplay = useMemo(() => {
    if (isLoadingContent || !determinedSchoolId) return null;
    return schools.find(s => s.id === determinedSchoolId);
  }, [determinedSchoolId, schools, isLoadingContent]);
  
  let pageTitle = "Catálogo de Productos";
  let pageDescription = "Explora nuestros productos."; // Default description

  if (!isLoadingContent) {
    if (currentUser && !currentUser.isAdmin && !currentUser.isSales && !currentUser.schoolId) {
      pageTitle = "Asocia tu Colegio";
      pageDescription = "Para ver los productos y precios, por favor, asocia un colegio a tu cuenta.";
    } else if (currentSchoolForDisplay) {
      pageTitle = currentSchoolForDisplay.name;
      pageDescription = "Explora los productos disponibles.";
      if (currentUser?.isAdmin) {
        pageTitle = `${currentSchoolForDisplay.name} (Admin)`;
        pageDescription = `Viendo como administrador los productos de ${currentSchoolForDisplay.name}.`;
      } else if (currentUser?.isSales) {
        pageTitle = `${currentSchoolForDisplay.name} (Ventas)`;
        pageDescription = `Viendo como personal de ventas los productos de ${currentSchoolForDisplay.name}.`;
      }
    } else if (!determinedSchoolId && (!currentUser || currentUser.isAdmin || currentUser.isSales)) {
      pageTitle = "Catálogo de Productos";
      pageDescription = "Selecciona un colegio de la lista para ver sus productos.";
    }
  }


  if (isLoadingContent) {
    return <div className="text-center py-20">Cargando catálogo...</div>;
  }

  if (currentUser && !currentUser.isAdmin && !currentUser.isSales && !currentUser.schoolId) {
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

  const showProductsView = !!determinedSchoolId;
  // Mostrar sidebar si: (no hay currentUser O currentUser es Admin O currentUser es Sales) Y (hay un colegio determinado O no hay colegio determinado pero hay colegios para listar)
  const showSchoolSelectionSidebar = 
    (!currentUser || currentUser.isAdmin || currentUser.isSales) && 
    (schools.length > 0);


  const canShowPriceOnCard = !!(currentUser?.isAdmin || currentUser?.isSales || (currentUser && !currentUser.isAdmin && !currentUser.isSales && determinedSchoolId === currentUser.schoolId));

  return (
    <div className={`flex flex-col ${showSchoolSelectionSidebar ? 'md:flex-row' : ''} gap-8`}>
      {showSchoolSelectionSidebar && (
        <aside className="md:w-1/4 lg:w-1/5 space-y-6 bg-brand-primary p-4 rounded-lg shadow-card self-start md:sticky md:top-24">
          <div>
            <h3 className="text-lg md:text-xl font-semibold text-brand-secondary mb-3 border-b pb-2 border-brand-gray-light">Colegios</h3>
            <ul className="space-y-1">
              {schools.map(school => (
                <li key={school.id}>
                  <button
                    onClick={() => handleSchoolSelect(school.id)}
                    className={`w-full text-left px-3 py-2 rounded-md text-base md:text-lg transition-colors ${determinedSchoolId === school.id ? 'bg-brand-tertiary bg-opacity-20 text-brand-secondary font-semibold ring-1 ring-brand-tertiary' : 'text-text-primary hover:bg-brand-gray-light'}`}
                    aria-pressed={determinedSchoolId === school.id}
                  >
                    {school.name}
                  </button>
                </li>
              ))}
              <li>
                <button
                  onClick={handleClearSchoolFilter}
                  className="w-full text-left px-3 py-2 mt-2 rounded-md text-sm md:text-base text-brand-tertiary hover:underline"
                  aria-label="Ver todos los colegios y productos"
                >
                  Ver todos los colegios
                </button>
              </li>
            </ul>
          </div>
        </aside>
      )}

      <main className={`${showSchoolSelectionSidebar ? 'md:w-3/4 lg:w-4/5' : 'w-full'}`}>
        <div className="mb-6 pb-4 border-b border-brand-gray-light">
          <div className="sm:flex sm:justify-between sm:items-center">
            <div className="mb-4 sm:mb-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-brand-secondary">{pageTitle}</h1>
              <p className={`mt-1 text-text-secondary ${(!currentUser || currentUser.isAdmin || currentUser.isSales) && !determinedSchoolId ? 'text-base sm:text-lg' : 'text-sm sm:text-base md:text-lg'}`}>{pageDescription}</p>
            </div>
          </div>
        </div>

        {(!currentUser || currentUser.isAdmin || currentUser.isSales) && !determinedSchoolId && (
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
              <h3 className="mt-2 text-lg sm:text-xl font-medium text-text-primary">
                No hay colegios disponibles.
              </h3>
              <p className="mt-1 text-base sm:text-lg text-text-secondary">
                Pronto agregaremos más colegios. ¡Vuelve a visitarnos!
              </p>
            </div>
          )
        )}

        {showProductsView && (
          productsToDisplay.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
              {productsToDisplay.map(product => (
                <ProductCard key={product.id} product={product} showPrice={canShowPriceOnCard} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-brand-primary p-6 rounded-lg shadow-card">
              <svg className="mx-auto h-12 w-12 text-brand-quaternary" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2zm3-12V3m0 18v-2" />
              </svg>
              <h3 className="mt-2 text-base sm:text-lg font-medium text-text-primary">
                {currentSchoolForDisplay ? 'No hay productos disponibles para este colegio.' : 'Selecciona un colegio para ver productos.'}
              </h3>
              <p className="mt-1 text-sm text-text-secondary">
                 Pronto agregaremos más productos. ¡Vuelve a visitarnos!
              </p>
              {(!currentUser || currentUser.isAdmin || currentUser.isSales) && !currentSchoolForDisplay && activeSchoolIdParam && ( 
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
              {(!currentUser || currentUser.isAdmin || currentUser.isSales) && currentSchoolForDisplay && productsToDisplay.length === 0 && ( 
                 <div className="mt-6">
                    <button
                        onClick={handleClearSchoolFilter}
                        className="btn-outline text-sm"
                        aria-label="Explorar Otros Colegios"
                    >
                        Explorar Otros Colegios
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
