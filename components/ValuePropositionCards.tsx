
import React, { useState } from 'react';
import { useEditableContent } from '../contexts/EditableContentContext';
import { useAuth } from '../contexts/AuthContext';
import { useMedia } from '../contexts/MediaContext';
import { ValuePropositionCardData as CardDataType, MediaItem } from '../types';
import EditIcon from './admin/icons/EditIcon';
import EditValuePropositionCardsModal from './admin/EditValuePropositionCardsModal';

// Fallback Icon Components
import StoreIcon from './icons/StoreIcon';
import StoreIconUyB from './icons/StoreIconUyB'; 
import DeliveryScooterIcon from './icons/DeliveryScooterIcon';
import DeliveryIconUyB from './icons/DeliveryIconUyB'; 
import CustomerServiceIcon from './icons/CustomerServiceIcon';
import CustomerServiceIconUyB from './icons/CustomerServiceIconUyB'; // Added new icon

const fallbackIcons: { [key: string]: React.FC<{ className?: string }> } = {
  store: StoreIcon, 
  storeUyB: StoreIconUyB,
  delivery: DeliveryScooterIcon,
  deliveryUyB: DeliveryIconUyB, 
  customerService: CustomerServiceIcon, // Kept for any other potential use or as a true fallback
  customerServiceUyB: CustomerServiceIconUyB, // Mapped new icon
};


const ValuePropositionCards: React.FC = () => {
  const { valuePropositionCardsData, isLoading: isLoadingContent } = useEditableContent();
  const { mediaItems, isLoadingMedia } = useMedia();
  const { currentUser } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const canEditCards = currentUser?.role === 'admin' || currentUser?.role === 'sales';

  if (isLoadingContent || isLoadingMedia) {
    return (
      <section className="bg-brand-gray-light py-8 md:py-10">
        {/* Removed container div from here, parent will provide */}
        <div className="text-center text-text-secondary">Cargando tarjetas de valor...</div>
      </section>
    );
  }

  const getIconElement = (card: CardDataType): JSX.Element => {
    const FallbackIcon = fallbackIcons[card.defaultIconName];
    let iconSrc: string | null = null;

    if (card.iconId) {
      const mediaImage = mediaItems.find(m => m.id === card.iconId);
      if (mediaImage) {
        iconSrc = mediaImage.dataUrl;
      }
    }

    if (iconSrc) {
      return <img src={iconSrc} alt={`${card.title} icon`} className="w-10 h-10 object-contain" />;
    }
    
    return FallbackIcon ? <FallbackIcon className="w-10 h-10 text-white" /> : <div className="w-10 h-10 bg-white/20 rounded"></div>;
  };


  return (
    <>
      <section className="bg-brand-gray-light py-8 md:py-10 relative group">
         {canEditCards && (
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="absolute top-2 right-2 z-10 btn-secondary text-xs px-2.5 py-1 flex items-center shadow-md hover:shadow-lg opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
            aria-label="Editar Tarjetas de Propuesta de Valor"
          >
            <EditIcon className="w-3.5 h-3.5 mr-1" /> Editar Tarjetas
          </button>
        )}
        {/* Removed the container div: <div className="container mx-auto px-4"> */}
        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 gap-6">
          {valuePropositionCardsData.map((card) => (
            <div
              key={card.id}
              className="bg-brand-primary p-4 rounded-xl shadow-card flex items-center space-x-4 hover:shadow-card-hover transition-shadow duration-300 transform hover:-translate-y-1"
              role="region"
              aria-label={card.ariaLabel || card.title}
            >
              <div className="flex-shrink-0 bg-brand-secondary w-16 h-16 rounded-lg flex items-center justify-center">
                {getIconElement(card)}
              </div>
              <div className="flex-grow">
                <p className="font-semibold text-brand-secondary text-lg sm:text-xl md:text-2xl leading-tight mb-0.5">
                  {card.title}
                </p>
                <p className="text-text-secondary text-sm sm:text-base md:text-lg line-clamp-3">
                  {card.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>
        {/* End of removed container div */}
      </section>
      {canEditCards && (
        <EditValuePropositionCardsModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}
    </>
  );
};

export default ValuePropositionCards;
