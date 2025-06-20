import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  showPrice: boolean; // New prop
}

const ProductCard: React.FC<ProductCardProps> = React.memo(({ product, showPrice }) => {
  const navigate = useNavigate();

  const handleViewProduct = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault(); 
    e.stopPropagation();
    navigate(`/product/${product.id}`);
  };
  
  const productNameContent = (
    <Link to={`/product/${product.id}`} className="hover:text-brand-tertiary transition-colors">{product.name}</Link>
  );
  
  let productPriceText: string | null = null;
  if (showPrice) {
    if (product.variants && product.variants.length > 0) {
      const prices = product.variants.map(v => v.price);
      const minPrice = Math.min(...prices);
      if (prices.every(p => p === minPrice)) { 
          productPriceText = `$${minPrice.toFixed(2)}`;
      } else {
          productPriceText = `Desde $${minPrice.toFixed(2)}`;
      }
    } else {
      productPriceText = "Precio no disponible"; // Fallback if variants are missing but showPrice is true
    }
  }


  return (
    <div className="bg-brand-primary rounded-lg border border-brand-gray-light shadow-card hover:shadow-card-hover flex flex-col h-full group transition-all duration-300 transform hover:-translate-y-1">
      <div className="relative">
        <Link to={`/product/${product.id}`} className="block overflow-hidden aspect-square rounded-t-lg bg-white"> 
          <img
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 ease-in-out p-2 sm:p-3"
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
          />
        </Link>
      </div>
      <div className="p-3 sm:p-4 flex flex-col flex-grow">
        <h3 className="text-lg md:text-xl font-semibold text-text-primary mb-1 truncate group-hover:text-brand-tertiary transition-colors" title={product.name}>
          {productNameContent}
        </h3>
        
        <div className="mt-auto">
          {showPrice && productPriceText ? (
            <p className="text-base sm:text-lg font-bold text-brand-secondary mb-2 sm:mb-3">
              {productPriceText}
            </p>
          ) : (
             // Placeholder for when price is not shown, ensuring no accidental text rendering.
             <div className="h-[calc(1.5rem+0.5rem)] sm:h-[calc(1.75rem+0.75rem)]" /> // text-base sm:text-lg equivalent height
          )}
          {/* The "Ver Producto" button should directly follow the price or its placeholder.
              Any extraneous characters like ')}' reported between the price/placeholder 
              and this button are not present in this code structure.
           */}
          <button
            onClick={handleViewProduct}
            aria-label={`Ver detalles de ${product.name}`}
            className="btn-primary w-full text-base md:text-lg py-2"
          >
            Ver Producto
          </button>
        </div>
      </div>
    </div>
  );
});

export default ProductCard;