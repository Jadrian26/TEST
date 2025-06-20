import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { School } from '../types';

interface SchoolCardProps {
  school: School;
  variant?: 'default' | 'compact';
  isClickable?: boolean; // Nueva propiedad
}

const SchoolCard: React.FC<SchoolCardProps> = React.memo(({ school, variant = 'default', isClickable = true }) => {
  const navigate = useNavigate();

  const handleSchoolClick = () => {
    if (isClickable) {
      navigate(`/catalog/school/${school.id}`);
    }
  };
  
  const schoolNameContent = school.name;

  if (variant === 'compact') {
    const WrapperComponent = isClickable ? Link : 'div';
    const wrapperProps: any = isClickable 
      ? { to: `/catalog/school/${school.id}` } 
      : {};

    return (
      <WrapperComponent
        {...wrapperProps}
        className={`bg-brand-primary p-3 sm:p-4 rounded-lg shadow-card text-center group transition-all duration-300 ease-in-out h-44 sm:h-48 flex flex-col justify-between
                    ${isClickable ? 'hover:shadow-card-hover transform hover:-translate-y-1 hover:scale-[1.02] cursor-pointer' : 'cursor-default'}`}
        onClick={!isClickable ? (e: React.MouseEvent) => e.preventDefault() : undefined} 
      >
        <div> 
          <div 
            className={`w-24 h-24 mx-auto rounded-lg ${isClickable ? 'group-hover:scale-110' : ''} transition-transform mb-2 sm:mb-3 bg-white flex items-center justify-center overflow-hidden shadow-sm`}
          > 
            <img 
              className="max-w-full max-h-full object-contain p-1.5" 
              src={school.logoUrl} 
              alt={`Logo de ${school.name}`} 
              loading="lazy"
            />
          </div>
        </div>
        
        <h3 className={`text-base font-semibold text-brand-secondary ${isClickable ? 'group-hover:text-brand-tertiary' : ''} transition-colors line-clamp-2`} title={school.name}>
          {schoolNameContent}
        </h3>
      </WrapperComponent>
    );
  }

  // Default variant
  return (
    <div 
      className={`bg-brand-primary rounded-lg shadow-card ${isClickable ? 'hover:shadow-card-hover group cursor-pointer transform hover:-translate-y-1' : 'cursor-default'} flex flex-col h-full transition-all duration-300 ease-in-out`}
      onClick={isClickable ? handleSchoolClick : undefined}
      role={isClickable ? "link" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyPress={isClickable ? (e) => e.key === 'Enter' && handleSchoolClick() : undefined}
    >
      <div className="aspect-square overflow-hidden rounded-t-lg bg-white p-2 sm:p-3">
        <img 
          className={`w-full h-full object-contain ${isClickable ? 'group-hover:scale-105' : ''} transition-transform duration-300 ease-in-out`}
          src={school.logoUrl} 
          alt={`${school.name}`} 
          loading="lazy"
        />
      </div>
      <div className="p-3 sm:p-4 flex flex-col flex-grow">
        <h3 className={`text-base sm:text-lg font-semibold text-text-primary text-center mb-2 ${isClickable ? 'group-hover:text-brand-tertiary' : ''} transition-colors line-clamp-2`} title={school.name}>
           {schoolNameContent}
        </h3>
        {isClickable && (
          <button
            onClick={(e) => { e.stopPropagation(); handleSchoolClick();}}
            className="btn-primary w-full mt-auto text-sm py-2"
            aria-label={`Ver productos de ${school.name}`}
          >
            Ver Productos
          </button>
        )}
        {!isClickable && (
            <div className="mt-auto h-[calc(theme(height.8)+theme(lineHeight.5))]"> </div>
        )}
      </div>
    </div>
  );
});

export default SchoolCard;