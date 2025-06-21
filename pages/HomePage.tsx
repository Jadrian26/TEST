
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useEditableContent } from '../contexts/EditableContentContext';
import { useAuth } from '../contexts/AuthContext'; 
import { useMedia } from '../contexts/MediaContext'; 
import SchoolCard from '../components/SchoolCard';
import EditCarouselSlidesModal from '../components/admin/EditCarouselSlidesModal';
import EditSchoolCarouselSettingsModal from '../components/admin/EditSchoolCarouselSettingsModal';
import EditVisitStoreSectionModal from '../components/admin/EditVisitStoreSectionModal'; 
import EditIcon from '../components/admin/icons/EditIcon'; 
import { School, MediaItem } from '../types';
import ValuePropositionCards from '../components/ValuePropositionCards';
import useModalState from '../hooks/useModalState'; // Importado
import WazeIcon from '../components/icons/WazeIcon'; 
import GoogleMapsIcon from '../components/icons/GoogleMapsIcon'; 

// Unused WazeIconDefault was removed. Fallbacks use imported WazeIcon and GoogleMapsIcon.

const ChevronLeftIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
);

const ChevronRightIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);

const MIN_SCHOOLS_FOR_CAROUSEL = 5;

const HomePage: React.FC = () => {
  const { 
    schools, heroSlides, heroCarouselInterval, 
    schoolCarouselAnimationDurationPerItem,
    storeWazeUrl, storeGoogleMapsUrl, storeAddressDescription,
    visitStoreSection_MainImageId,
    visitStoreSection_WazeButtonIconId,
    visitStoreSection_GoogleMapsButtonIconId, 
    isLoading: isLoadingContent 
  } = useEditableContent();
  const { currentUser } = useAuth();
  const { mediaItems, isLoadingMedia } = useMedia(); 

  const [currentHeroSlideIndex, setCurrentHeroSlideIndex] = useState(0);
  const [isHeroHovered, setIsHeroHovered] = useState(false);
  const [isHeroManuallyNavigated, setIsHeroManuallyNavigated] = useState(false);
  
  const { isOpen: isEditCarouselModalOpen, openModal: openEditCarouselModal, closeModal: closeEditCarouselModal } = useModalState();
  const { isOpen: isEditSchoolCarouselSettingsModalOpen, openModal: openEditSchoolCarouselSettingsModal, closeModal: closeEditSchoolCarouselSettingsModal } = useModalState();
  const { isOpen: isEditVisitStoreSectionModalOpen, openModal: openEditVisitStoreSectionModal, closeModal: closeEditVisitStoreSectionModal } = useModalState();
  
  const storeDisplayName = "Uniformes & Bordados Escolares";
  const canEditHomepageContent = currentUser?.role === 'admin' || currentUser?.role === 'sales';

  const nextHeroSlide = useCallback(() => {
    if (heroSlides.length > 0) setCurrentHeroSlideIndex((prevIndex) => (prevIndex + 1) % heroSlides.length);
  }, [heroSlides.length]);

  const prevHeroSlide = () => {
    if (heroSlides.length > 0) setCurrentHeroSlideIndex((prevIndex) => (prevIndex - 1 + heroSlides.length) % heroSlides.length);
  };

  const goToHeroSlide = (index: number) => {
    if (heroSlides.length > 0) setCurrentHeroSlideIndex(index);
  };
  
  const handleHeroManualNavigation = (action: () => void) => {
    action(); setIsHeroManuallyNavigated(true);
    setTimeout(() => setIsHeroManuallyNavigated(false), heroCarouselInterval * 1000 + 3000); 
  };

  useEffect(() => {
    let intervalId: number | undefined; 
    if (heroSlides.length > 1 && !isHeroHovered && !isHeroManuallyNavigated) {
      intervalId = window.setInterval(nextHeroSlide, heroCarouselInterval * 1000);
    }
    return () => window.clearInterval(intervalId);
  }, [nextHeroSlide, isHeroHovered, isHeroManuallyNavigated, heroSlides.length, heroCarouselInterval]);
  
  useEffect(() => {
    if (isHeroManuallyNavigated) {
      const timer: number = window.setTimeout(() => setIsHeroManuallyNavigated(false), heroCarouselInterval * 1000 + 3000); 
      return () => window.clearTimeout(timer); 
    }
  }, [isHeroManuallyNavigated, heroCarouselInterval]);

  const enableSchoolCarousel = schools.length >= MIN_SCHOOLS_FOR_CAROUSEL;
  let duplicatedSchoolsForCarousel: School[] = [];
  if (enableSchoolCarousel) {
      duplicatedSchoolsForCarousel = schools.length < 8 ? [...schools, ...schools, ...schools, ...schools] : [...schools, ...schools];
  }
  const schoolAnimationTotalDuration = enableSchoolCarousel ? schools.length * schoolCarouselAnimationDurationPerItem : 0;
  const numberOfDuplicateSetsForAnimation = enableSchoolCarousel ? (schools.length < 8 && schools.length > 0 ? 4 : (schools.length >= 8 ? 2 : 1) ) : 1;

  const configuredStoreImageUrl = mediaItems.find(item => item.id === visitStoreSection_MainImageId)?.dataUrl;
  const wazeButtonIconSrc = mediaItems.find(item => item.id === visitStoreSection_WazeButtonIconId)?.dataUrl;
  const googleMapsButtonIconSrc = mediaItems.find(item => item.id === visitStoreSection_GoogleMapsButtonIconId)?.dataUrl;


  if (isLoadingContent || isLoadingMedia) { 
    return <div className="text-center py-20">Cargando contenido...</div>;
  }

  return (
    <>
    <div className="space-y-12 md:space-y-16">
      {/* Hero Carousel */}
      <section
        className="relative aspect-video rounded-lg shadow-xl overflow-hidden group bg-brand-gray-light w-full max-w-5xl mx-auto"
        onMouseEnter={() => setIsHeroHovered(true)} onMouseLeave={() => setIsHeroHovered(false)}
        aria-roledescription="carousel" aria-label="Promociones principales"
      >
        {canEditHomepageContent && (
          <button
            onClick={openEditCarouselModal}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 z-30 btn-secondary text-xs px-3 py-1.5 flex items-center shadow-md hover:shadow-lg" 
            aria-label="Editar Carrusel"
          >
            <EditIcon className="w-4 h-4 mr-1.5" /> Editar Carrusel
          </button>
        )}
        {heroSlides.length === 0 ? (
          <div className="absolute inset-0 bg-brand-secondary flex flex-col items-center justify-center text-center p-4" aria-label="Carrusel no configurado">
            <h2 className="text-lg sm:text-xl font-semibold text-text-on-secondary-bg mb-2">Imagen no configurada</h2>
            <p className="text-base sm:text-lg text-brand-gray-light">El administrador o personal de ventas puede añadir una imagen para esta sección</p>
          </div>
        ) : (
          <>
            {heroSlides.map((slide, index) => (
              <div
                key={slide.id || index} 
                className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${ index === currentHeroSlideIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                style={{ backgroundImage: `url('${slide.dataUrl}')` }} 
                role="group" aria-roledescription="slide" aria-label={`Diapositiva ${index + 1} de ${heroSlides.length}`} aria-hidden={index !== currentHeroSlideIndex}
              ></div>
            ))}
            { heroSlides.length > 1 && (
              <>
                <button onClick={() => handleHeroManualNavigation(prevHeroSlide)} className="absolute top-1/2 left-2 sm:left-3 -translate-y-1/2 z-30 p-1.5 sm:p-2 bg-black/30 hover:bg-black/50 text-white rounded-full transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-brand-tertiary focus:ring-offset-2 focus:ring-offset-transparent" aria-label="Diapositiva anterior">
                  <ChevronLeftIcon className="w-5 h-5 sm:w-6 sm:h-6" /> 
                </button>
                <button onClick={() => handleHeroManualNavigation(nextHeroSlide)} className="absolute top-1/2 right-2 sm:right-3 -translate-y-1/2 z-30 p-1.5 sm:p-2 bg-black/30 hover:bg-black/50 text-white rounded-full transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-brand-tertiary focus:ring-offset-2 focus:ring-offset-transparent" aria-label="Siguiente diapositiva">
                  <ChevronRightIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
                <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-30 flex space-x-2 sm:space-x-2.5" role="tablist" aria-label="Navegación de diapositivas">
                  {heroSlides.map((_, index) => (
                    <button key={`dot-${index}`} onClick={() => handleHeroManualNavigation(() => goToHeroSlide(index))}
                      className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-all duration-300 ease-in-out ${index === currentHeroSlideIndex ? 'bg-brand-tertiary scale-125' : 'bg-white/50 hover:bg-white/80'}`}
                      role="tab" aria-selected={index === currentHeroSlideIndex} aria-label={`Ir a la diapositiva ${index + 1}`} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </section>

      <div className="w-full max-w-6xl mx-auto px-4"> {/* Changed max-w-5xl to max-w-6xl and added px-4 */}
        <ValuePropositionCards />
      </div>

      {/* Nuestros Colegios Aliados */}
      <section aria-label="Nuestros Colegios Aliados" className="py-6 md:py-8 w-full max-w-5xl mx-auto">
        <div className="flex justify-center items-center mb-6 md:mb-8 relative">
            <h2 className="text-2xl sm:text-3xl font-bold text-brand-secondary text-center">Nuestros Colegios Aliados</h2>
            {canEditHomepageContent && (
              <button onClick={openEditSchoolCarouselSettingsModal} className="ml-3 icon-btn !p-1.5" title="Editar Ajustes del Carrusel de Colegios" aria-label="Editar ajustes carrusel colegios">
                <EditIcon className="w-5 h-5 text-brand-secondary" />
              </button>
            )}
        </div>
        {schools.length === 0 ? (
          <p className="text-center text-text-secondary text-base sm:text-lg py-4">No hay colegios aliados disponibles.</p>
        ) : enableSchoolCarousel ? ( 
          <div className="relative w-full overflow-hidden group py-4 school-carousel-container">
            <div className="flex school-carousel-track animated" style={{ '--animation-duration': `${schoolAnimationTotalDuration}s` } as React.CSSProperties}>
              {duplicatedSchoolsForCarousel.map((school, index) => (
                <div key={`${school.id}-clone-${index}`} className="school-carousel-item flex-shrink-0 mx-2 md:mx-3">
                  <SchoolCard school={school} variant="compact" isClickable={false} /> 
                </div>
              ))}
            </div>
          </div>
        ) : ( 
          <div className="flex justify-center flex-wrap gap-4 md:gap-6 py-4"> 
            {schools.map((school) => (
              <div key={school.id} className="w-44 sm:w-48">
                 <SchoolCard school={school} variant="compact" isClickable={false} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Visita Nuestra Tienda */}
      <section className="bg-brand-primary px-4 sm:px-6 py-6 sm:py-8 rounded-lg shadow-lg relative group w-full max-w-5xl mx-auto">
        {canEditHomepageContent && (
          <button
            onClick={openEditVisitStoreSectionModal} 
            className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 btn-secondary text-xs px-3 py-1.5 flex items-center shadow-md hover:shadow-lg opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
            aria-label="Editar Sección Visita Nuestra Tienda"
          >
            <EditIcon className="w-4 h-4 mr-1.5" /> Editar Ubicación
          </button>
        )}
        <h2 className="text-2xl sm:text-3xl font-bold text-brand-secondary mb-6 text-center">Visita Nuestra Tienda</h2>
        <div className="lg:flex lg:space-x-8 items-center">
          <div className="lg:w-5/12 aspect-square rounded-md mb-6 lg:mb-0 overflow-hidden">
            {configuredStoreImageUrl ? (
                <div
                    className="w-full h-full bg-cover bg-center rounded-md"
                    style={{ backgroundImage: `url('${configuredStoreImageUrl}')` }}
                    aria-label="Imagen de la tienda"
                ></div>
            ) : (
                <div className="w-full h-full bg-brand-secondary flex flex-col items-center justify-center text-center p-4 rounded-md text-text-on-secondary-bg" aria-label="Imagen de tienda no configurada">
                    <h3 className="text-lg font-semibold mb-1">Imagen no configurada</h3>
                    <p className="text-sm md:text-base">El administrador o personal de ventas puede añadir una imagen</p>
                </div>
            )}
          </div>
          <div className="lg:w-7/12 text-center lg:text-left">
            <h3 className="text-xl sm:text-2xl font-semibold text-brand-secondary mb-2">{storeDisplayName}</h3>
            <p className="text-base sm:text-lg text-brand-gray-medium mb-4">{storeAddressDescription}</p>
            <div className="flex flex-col sm:flex-row justify-center lg:justify-start space-y-3 sm:space-y-0 sm:space-x-3">
              <a 
                href={storeWazeUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn-outline flex items-center justify-center text-sm sm:text-base md:text-lg"
                title="Abrir en Waze"
              >
                {wazeButtonIconSrc ? <img src={wazeButtonIconSrc} alt="Waze Icon" className="w-4 h-4 mr-2 object-contain flex-shrink-0" /> : <WazeIcon className="w-4 h-4 mr-2 flex-shrink-0" />}
                 Navegar con Waze
              </a>
              <a 
                href={storeGoogleMapsUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn-outline flex items-center justify-center text-sm sm:text-base md:text-lg"
                title="Abrir en Google Maps"
              >
                {googleMapsButtonIconSrc ? <img src={googleMapsButtonIconSrc} alt="Google Maps Icon" className="w-4 h-4 mr-2 object-contain flex-shrink-0" /> : <GoogleMapsIcon className="w-4 h-4 mr-2 flex-shrink-0" />}
                 Navegar con Google Maps
              </a>
            </div>
          </div>
        </div>
      </section>
      
      {canEditHomepageContent && (<EditCarouselSlidesModal isOpen={isEditCarouselModalOpen} onClose={closeEditCarouselModal} />)}
      {canEditHomepageContent && (<EditSchoolCarouselSettingsModal isOpen={isEditSchoolCarouselSettingsModalOpen} onClose={closeEditSchoolCarouselSettingsModal} />)}
      {canEditHomepageContent && (<EditVisitStoreSectionModal isOpen={isEditVisitStoreSectionModalOpen} onClose={closeEditVisitStoreSectionModal} />)} 
    </div>
     <style>{`
        .school-carousel-container { mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent); -webkit-mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent); }
        .school-carousel-track.animated { display: flex; width: fit-content; animation: scrollSchools var(--animation-duration, 30s) linear infinite; }
        .school-carousel-item { width: 176px; /* w-44 */ }
        @media (min-width: 640px) { .school-carousel-item { width: 192px; /* w-48 */ } }
        @keyframes scrollSchools { 0% { transform: translateX(0%); } 100% { transform: translateX(calc(-100% / ${numberOfDuplicateSetsForAnimation})); } }

        /* Tailwind aspect-ratio plugin classes if not available by default (CDN might have it) */
        .aspect-video { aspect-ratio: 16 / 9; }
        .aspect-square { aspect-ratio: 1 / 1; }
        .aspect-w-3 { --tw-aspect-w: 3; aspect-ratio: var(--tw-aspect-w) / var(--tw-aspect-h); }
        .aspect-h-4 { --tw-aspect-h: 4; }
        .aspect-w-4 { --tw-aspect-w: 4; }
        .aspect-h-5 { --tw-aspect-h: 5; }

      `}</style>
    </>
  );
};

export default HomePage;
