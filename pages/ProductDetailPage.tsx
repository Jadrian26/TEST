import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { Product, School, ProductVariant } from '../types';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext'; 
import { useEditableContent } from '../contexts/EditableContentContext';
import ProductCard from '../components/ProductCard'; 
import { useNotifications } from '../contexts/NotificationsContext'; // Added

const ProductDetailPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart } = useCart();
  const { currentUser } = useAuth(); 
  const { products, schools, isLoading: isContentLoading } = useEditableContent();
  const { showNotification } = useNotifications(); // Added

  const [product, setProduct] = useState<Product | null>(null);
  const [school, setSchool] = useState<School | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>(''); 
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);

  const clientApprovedSchoolIds = useMemo(() => {
    if (currentUser && currentUser.role === 'client') {
      return currentUser.affiliations
        .filter(aff => aff.status === 'approved')
        .map(aff => aff.schoolId);
    }
    return [];
  }, [currentUser]);

  useEffect(() => {
    if (isContentLoading) return;

    const foundProduct = products.find(p => p.id === productId);
    if (foundProduct) {
      setProduct(foundProduct);
      setQuantity(1); 
      
      if (foundProduct.variants && foundProduct.variants.length > 0) {
        const initialVariant = foundProduct.variants[0];
        setSelectedVariant(initialVariant);
        setSelectedSize(initialVariant.size);
      } else {
        setSelectedVariant(null);
        setSelectedSize('N/A'); 
      }
      
      if (foundProduct.schoolId) {
        const foundSchool = schools.find(s => s.id === foundProduct.schoolId);
        setSchool(foundSchool || null);
      } else {
        setSchool(null);
      }

      let rawRelatedProducts: Product[];

      if (foundProduct.schoolId) {
        // Product belongs to a school, show other products from the same school
        rawRelatedProducts = products.filter(
            p => p.schoolId === foundProduct.schoolId && p.id !== foundProduct.id
        );
      } else {
          // Product is general (no schoolId), show other general products
          rawRelatedProducts = products.filter(
              p => !p.schoolId && p.id !== foundProduct.id
          );
      }

      // Sort the raw related products: by orderIndex (ascending), then by name (alphabetical)
      const sortedRelatedProducts = rawRelatedProducts.sort((a, b) => {
          const orderIndexA = a.orderIndex ?? Infinity; // Treat undefined/null orderIndex as last
          const orderIndexB = b.orderIndex ?? Infinity;
          if (orderIndexA !== orderIndexB) {
              return orderIndexA - orderIndexB;
          }
          return a.name.localeCompare(b.name);
      });
      
      setRelatedProducts(sortedRelatedProducts.slice(0, 4)); 

    } else {
      navigate('/catalog'); 
    }
     window.scrollTo(0, 0);
  }, [productId, navigate, products, schools, isContentLoading, currentUser, clientApprovedSchoolIds]); // clientApprovedSchoolIds is needed for price display logic

  const handleSizeSelect = (size: string) => {
    if (product && product.variants) {
      const variantForSize = product.variants.find(v => v.size === size);
      if (variantForSize) {
        setSelectedVariant(variantForSize);
        setSelectedSize(variantForSize.size);
      }
    }
  };
  
  const handleAddToCart = () => {
    if (product && selectedVariant) {
      addToCart(product, quantity, selectedVariant.size, selectedVariant.price);
      showNotification(`${product.name} (Talla: ${selectedVariant.size}, x${quantity}) añadido al carrito.`, 'success');
    } else if (product && (!product.variants || product.variants.length === 0)) {
      showNotification("Este producto no tiene variantes disponibles para añadir al carrito.", 'error');
    } else if (!selectedVariant) {
       showNotification("Por favor, selecciona una talla disponible.", 'error');
    }
  };
  
  if (isContentLoading || !product) {
    return <div className="text-center py-20 text-text-secondary">Cargando producto...</div>;
  }

  const productNameElement = <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-text-primary mb-1">{product.name}</h1>; 
  
  let productPriceElement: JSX.Element | null = null;
  
  const canViewPrice = 
    (currentUser?.role === 'admin' || currentUser?.role === 'sales') ||
    (currentUser?.role === 'client' && product?.schoolId && clientApprovedSchoolIds.includes(product.schoolId));


  if (canViewPrice) {
    if (selectedVariant) {
      productPriceElement = <p className="text-2xl sm:text-3xl font-bold text-brand-secondary mb-4 sm:mb-5">${selectedVariant.price.toFixed(2)}</p>;
    } else if (product.variants && product.variants.length > 0) {
      const prices = product.variants.map(v => v.price);
      const minPrice = Math.min(...prices);
      productPriceElement = <p className="text-2xl sm:text-3xl font-bold text-brand-secondary mb-4 sm:mb-5">Desde ${minPrice.toFixed(2)}</p>;
    } else {
      productPriceElement = <p className="text-2xl sm:text-3xl font-bold text-brand-secondary mb-4 sm:mb-5">Precio no disponible</p>;
    }
  } else if (!currentUser) { 
     productPriceElement = <p className="text-base sm:text-lg text-text-secondary mb-4 sm:mb-5">Inicia sesión para ver precios.</p>;
  } else if (currentUser?.role === 'client' && clientApprovedSchoolIds.length === 0) { 
     productPriceElement = <p className="text-base sm:text-lg text-text-secondary mb-4 sm:mb-5">Solicita aprobación de un colegio en "Mi Cuenta" para ver precios.</p>;
  } else if (currentUser?.role === 'client' && product?.schoolId && !clientApprovedSchoolIds.includes(product.schoolId)) { 
     productPriceElement = <p className="text-base sm:text-lg text-text-secondary mb-4 sm:mb-5">Este producto no pertenece a tus colegios aprobados.</p>;
  }


  const productDescriptionElement = <p className="text-sm sm:text-base">{product.description}</p>;
  const productImageElement = (
     <img
        src={product.imageUrl}
        alt={product.name}
        className="w-full h-full object-contain p-2 sm:p-4"
      />
  );

  const availableSizesForDisplay = product.variants ? [...new Set(product.variants.map(v => v.size))] : [];

  const canAddToCart = 
    (currentUser?.role === 'admin' || currentUser?.role === 'sales') ||
    (currentUser?.role === 'client' && canViewPrice);

  return (
    <div className="container mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 sm:mb-6 text-sm text-brand-tertiary hover:text-brand-secondary font-medium flex items-center transition-colors group"
        aria-label="Volver a la página anterior"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
        Volver
      </button>
      <div className="md:flex md:gap-6 lg:gap-10 bg-brand-primary p-4 sm:p-6 md:p-8 rounded-lg shadow-card">
        <div className="md:w-1/2 lg:w-2/5">
          <div className="aspect-square bg-brand-gray-light rounded-lg overflow-hidden border border-brand-quaternary/20 shadow-sm">
            {productImageElement}
          </div>
        </div>
        <div className="md:w-1/2 lg:w-3/5 mt-5 sm:mt-6 md:mt-0 flex flex-col">
          {productNameElement}
          {school && (
            <Link to={`/catalog/school/${school.id}`} className="text-xs sm:text-sm text-brand-tertiary hover:underline mb-2 sm:mb-3 block">
              {school.name}
            </Link>
          )}
          {productPriceElement} 
          
          <div className="prose prose-sm text-text-secondary mb-5 sm:mb-6 max-w-none">
            <h2 className="text-sm sm:text-base font-semibold text-text-primary mb-1 sm:mb-1.5">Descripción</h2>
            {productDescriptionElement}
          </div>

          {availableSizesForDisplay.length > 0 ? (
            <div className="mb-5 sm:mb-6">
              <label htmlFor="size" className="block text-sm sm:text-base font-medium text-text-primary mb-1.5 sm:mb-2">Talla:</label> 
              <div className="flex flex-wrap gap-2">
                {availableSizesForDisplay.map(size => (
                  <button
                    key={size}
                    onClick={() => handleSizeSelect(size)}
                    className={`px-3.5 py-1.5 sm:px-4 sm:py-2 border rounded-md text-sm sm:text-base font-medium transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1
                                ${selectedSize === size 
                                  ? 'bg-brand-secondary text-text-on-secondary-bg border-brand-secondary shadow-md' 
                                  : 'bg-brand-primary border-brand-quaternary text-text-primary hover:border-brand-secondary hover:text-brand-secondary hover:shadow-subtle'}`}
                    aria-pressed={selectedSize === size}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          ) : (
             <div className="mb-5 sm:mb-6">
                <p className="text-xs sm:text-sm text-text-secondary">No hay tallas disponibles para este producto.</p>
             </div>
          )}
          
          {canAddToCart && ( 
            <div className="mb-5 sm:mb-6 flex items-center gap-3 sm:gap-4">
              <label htmlFor="quantity" className="block text-sm sm:text-base font-medium text-text-primary">Cantidad:</label>
              <div className="flex items-center border border-brand-quaternary rounded-md shadow-sm">
                  <button 
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className="px-3 py-2 sm:px-3.5 sm:py-2.5 text-brand-secondary hover:bg-brand-gray-light transition-colors focus:outline-none focus:bg-brand-gray-light rounded-l-md"
                      aria-label="Disminuir cantidad"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" /></svg>
                  </button>
                  <span
                    id="quantity"
                    className="w-10 sm:w-12 p-2 sm:p-2.5 text-center bg-brand-primary text-text-primary text-sm sm:text-base border-x border-brand-quaternary"
                    aria-live="polite"
                  >
                    {quantity}
                  </span>
                  <button 
                      onClick={() => setQuantity(q => q + 1)}
                      className="px-3 py-2 sm:px-3.5 sm:py-2.5 text-brand-secondary hover:bg-brand-gray-light transition-colors focus:outline-none focus:bg-brand-gray-light rounded-r-md"
                      aria-label="Aumentar cantidad"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                  </button>
              </div>
            </div>
          )}
          
          <div className="mt-auto space-y-2 sm:space-y-3">
            <div className="flex gap-3">
              {canAddToCart ? (
                <button
                    onClick={handleAddToCart}
                    className="btn-primary flex-grow disabled:opacity-60 disabled:cursor-not-allowed" 
                    aria-label="Añadir al carrito"
                    disabled={!selectedVariant || (availableSizesForDisplay.length > 0 && !selectedSize)}
                >
                    Añadir al Carrito
                </button>
              ) : (
                <button
                    onClick={() => navigate('/account', { state: { from: location.pathname, message: "Inicia sesión para añadir productos al carrito." } })}
                    className="btn-outline flex-grow" 
                    aria-label="Inicia sesión para añadir al carrito"
                >
                    Inicia sesión para añadir al carrito
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {relatedProducts.length > 0 && (
         <div className="mt-12 sm:mt-16 pt-8 sm:pt-10 border-t border-brand-gray-light">
            <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-6 sm:mb-8 text-center">También te podría interesar</h2>
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {relatedProducts.map(relatedProd => {
                    const canViewRelatedPrice = 
                        (currentUser?.role === 'admin' || currentUser?.role === 'sales') ||
                        (currentUser?.role === 'client' && relatedProd.schoolId && clientApprovedSchoolIds.includes(relatedProd.schoolId));
                    return (
                        <ProductCard 
                            key={relatedProd.id} 
                            product={relatedProd} 
                            showPrice={canViewRelatedPrice}
                        />
                    );
                })}
            </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetailPage;
