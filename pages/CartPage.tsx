import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import ShoppingCartIcon from '../components/icons/ShoppingCartIcon';
import TrashIcon from '../components/icons/TrashIcon';
import useAuthRedirect from '../hooks/useAuthRedirect'; // Importado

const CartPage: React.FC = () => {
  const { cartItems, removeFromCart, updateQuantity, clearCart, itemCount, totalAmount } = useCart();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useAuthRedirect({
    redirectTo: '/account',
    state: { from: '/cart', message: 'Debes iniciar sesión para ver tu carrito.' }
  });

  const handleQuantityChange = (productId: string, size: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId, size);
    } else {
      updateQuantity(productId, size, newQuantity);
    }
  };

  const handleProceedToCheckout = () => {
    if (itemCount > 0 && currentUser) { 
        navigate('/checkout');
    } else if (!currentUser) {
        navigate('/account', { state: { from: '/checkout', message: 'Debes iniciar sesión para proceder al pago.' } });
    }
  };

  if (!currentUser) {
    return <div className="text-center py-20">Redirigiendo...</div>;
  }

  const shippingCost = itemCount > 0 ? 5.00 : 0.00;
  const grandTotal = totalAmount + shippingCost; 

  return (
    <div className="space-y-6 md:space-y-8">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-text-primary text-center">
        Carrito de Compras
      </h1>

      {itemCount === 0 ? (
        <div className="text-center py-12 sm:py-16 bg-brand-primary p-6 sm:p-8 rounded-lg shadow-card">
          <ShoppingCartIcon className="w-16 h-16 sm:w-20 sm:h-20 text-brand-quaternary mx-auto mb-6 sm:mb-8" />
          <p className="text-lg sm:text-xl text-text-secondary mb-6 sm:mb-8">Tu carrito está actualmente vacío.</p>
          <Link
            to="/catalog"
            className="btn-primary text-base sm:text-lg"
          >
            Continuar Comprando
          </Link>
        </div>
      ) : (
        <div className="lg:flex lg:gap-8 items-start">
          <div className="lg:w-2/3 bg-brand-primary p-4 sm:p-6 rounded-lg shadow-card">
            <div className="flex justify-between items-center mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-brand-gray-light">
              <h2 className="text-lg sm:text-xl font-semibold text-text-primary">Tus Artículos ({itemCount})</h2>
              <button
                onClick={clearCart}
                className="text-sm text-error hover:underline font-medium transition-colors flex items-center py-1 px-2 rounded hover:bg-error/10"
                aria-label="Vaciar carrito"
              >
                <TrashIcon className="w-4 h-4 mr-1 sm:mr-1.5" /> Vaciar Carrito
              </button>
            </div>
            <div className="space-y-4 sm:space-y-6">
              {cartItems.map(item => (
                <div key={`${item.product.id}-${item.selectedSize}`} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 border border-brand-gray-light rounded-md hover:shadow-subtle transition-shadow">
                  <img src={item.product.imageUrl} alt={item.product.name} className="w-24 h-24 sm:w-28 sm:h-28 object-contain rounded flex-shrink-0 border border-brand-gray-light bg-white" />
                  <div className="flex-grow">
                    <Link to={`/product/${item.product.id}`} className="text-sm sm:text-base font-semibold text-text-primary hover:text-brand-tertiary transition-colors line-clamp-2">
                      {item.product.name}
                    </Link>
                    <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
                      {item.selectedSize && item.selectedSize !== 'N/A' ? `Talla: ${item.selectedSize}` : ''}
                    </p>
                     <p className="text-sm sm:text-base text-text-secondary mt-1 sm:hidden">Precio Unit.: ${item.priceAtPurchase.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center space-x-1.5 sm:space-x-2 my-2 sm:my-0">
                    <button
                      onClick={() => handleQuantityChange(item.product.id, item.selectedSize, item.quantity - 1)}
                      className="p-1.5 sm:p-2 bg-brand-gray-light text-brand-secondary rounded hover:bg-brand-quaternary hover:text-white transition-colors focus:outline-none focus:ring-1 focus:ring-brand-tertiary"
                      aria-label="Disminuir cantidad"
                    >
                      -
                    </button>
                    <span className="w-8 sm:w-10 text-center text-sm sm:text-base font-medium" aria-live="polite">{item.quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(item.product.id, item.selectedSize, item.quantity + 1)}
                      className="p-1.5 sm:p-2 bg-brand-gray-light text-brand-secondary rounded hover:bg-brand-quaternary hover:text-white transition-colors focus:outline-none focus:ring-1 focus:ring-brand-tertiary"
                      aria-label="Aumentar cantidad"
                    >
                      +
                    </button>
                  </div>
                  <p className="font-semibold text-brand-secondary text-sm sm:text-base w-20 sm:w-24 text-right hidden sm:block">${(item.priceAtPurchase * item.quantity).toFixed(2)}</p>
                  <button
                    onClick={() => removeFromCart(item.product.id, item.selectedSize)}
                    className="text-error hover:underline text-xs font-medium transition-colors flex items-center sm:ml-2 self-start sm:self-center mt-2 sm:mt-0 p-1 rounded hover:bg-error/10"
                    aria-label="Eliminar artículo"
                  >
                    <TrashIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-1" /> <span className="hidden sm:inline">Eliminar</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:w-1/3 mt-6 lg:mt-0 bg-brand-primary p-4 sm:p-6 rounded-lg shadow-card h-fit lg:sticky lg:top-24">
            <h2 className="text-lg sm:text-xl font-semibold text-text-primary mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-brand-gray-light">Resumen del Pedido</h2>
            <div className="space-y-3 text-sm sm:text-base mb-4 sm:mb-6">
              <div className="flex justify-between">
                <span className="text-text-secondary">Subtotal ({itemCount} artículos):</span>
                <span className="font-medium text-text-primary">${totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Envío:</span>
                <span className="font-medium text-text-primary">${shippingCost.toFixed(2)}</span>
              </div>
            </div>
            
            <hr className="my-3 sm:my-4 border-brand-gray-light" />
            <div className="flex justify-between text-base sm:text-lg font-bold mb-4 sm:mb-6">
              <span className="text-text-primary">Total:</span>
              <span className="text-brand-secondary">${grandTotal.toFixed(2)}</span>
            </div>
            <button
              onClick={handleProceedToCheckout}
              className="btn-secondary w-full text-base sm:text-lg"
              disabled={itemCount === 0}
            >
              Proceder al Pago
            </button>
            <Link to="/catalog" className="block text-center mt-3 sm:mt-4 text-sm text-brand-tertiary hover:underline font-medium transition-colors">
              o Continuar Comprando
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;