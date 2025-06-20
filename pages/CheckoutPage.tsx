import React, { useState, useEffect, FormEvent, ChangeEvent, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { Address, DeliveryMethod } from '../types';
import AddAddressModal from '../components/AddAddressModal'; 
import useAuthRedirect from '../hooks/useAuthRedirect';
import { useNotifications } from '../contexts/NotificationsContext'; 
import SpinnerIcon from '../components/icons/SpinnerIcon'; // Import SpinnerIcon

interface InputFieldProps {
    id: string;
    label: string;
    type?: string;
    value: string;
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    placeholder?: string;
    required?: boolean;
    as?: 'input' | 'textarea';
    rows?: number;
    autoComplete?: string;
    error?: string; 
    pattern?: string;
    title?: string;
    name: string; // Added name prop
}

// Basic InputField component (can be expanded or moved to a shared location if needed)
const InputField: React.FC<InputFieldProps> = ({ 
    id, 
    label, 
    type = 'text', 
    value, 
    onChange, 
    placeholder, 
    required, 
    as = 'input', 
    rows, 
    autoComplete, 
    error, 
    pattern, 
    title,
    name // Destructured name prop
}) => (
    <div className="mb-4">
        <label htmlFor={id} className="block text-sm sm:text-base font-medium text-text-primary mb-1">
            {label} {required && <span className="text-error">*</span>}
        </label>
        {as === 'textarea' ? (
            <textarea
                id={id} 
                name={name} // Used name prop
                value={value} 
                onChange={onChange} 
                placeholder={placeholder} 
                required={required} 
                rows={rows || 3}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 text-sm sm:text-base transition-colors bg-brand-primary ${
                error ? 'border-error focus:ring-error focus:border-error' : 'border-brand-quaternary focus:ring-brand-tertiary focus:border-brand-tertiary'
                }`}
                aria-invalid={!!error}
            />
            ) : (
            <input
                type={type} 
                id={id} 
                name={name} // Used name prop
                value={value} 
                onChange={onChange} 
                placeholder={placeholder} 
                required={required} 
                autoComplete={autoComplete} 
                pattern={pattern} 
                title={title}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 text-sm sm:text-base transition-colors bg-brand-primary ${
                error ? 'border-error focus:ring-error focus:border-error' : 'border-brand-quaternary focus:ring-brand-tertiary focus:border-brand-tertiary'
                }`}
                aria-invalid={!!error}
            />
        )}
        {error && <p className="mt-1 text-xs text-error">{error}</p>}
    </div>
);


const CheckoutPage: React.FC = () => {
  useAuthRedirect({
    redirectTo: '/account',
    state: { from: '/checkout', message: 'Debes iniciar sesión para proceder al pago.' }
  });

  const { currentUser, createOrder } = useAuth();
  const { cartItems, totalAmount, clearCart, itemCount } = useCart();
  const { showNotification } = useNotifications();
  const navigate = useNavigate();

  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('delivery');
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [customerNameForOrder, setCustomerNameForOrder] = useState('');
  const [customerIdCardForOrder, setCustomerIdCardForOrder] = useState('');
  const [formErrors, setFormErrors] = useState<{ name?: string, idCard?: string, address?: string }>({});
  const [isProcessingOrder, setIsProcessingOrder] = useState(false); // New state for order processing

  const shippingCost = deliveryMethod === 'delivery' && itemCount > 0 ? 5.00 : 0.00;
  const grandTotal = totalAmount + shippingCost;

  useEffect(() => {
    if (currentUser?.addresses?.length) {
      const defaultAddress = currentUser.addresses.find(addr => addr.isDefault) || currentUser.addresses[0];
      setSelectedAddressId(defaultAddress.id);
    }
    if (currentUser && !currentUser.isAdmin && !currentUser.isSales) {
        setCustomerNameForOrder(`${currentUser.firstName} ${currentUser.lastName}`);
        setCustomerIdCardForOrder(currentUser.idCardNumber);
    }
  }, [currentUser]);

  const validateForm = useCallback((): boolean => {
    const errors: { name?: string, idCard?: string, address?: string } = {};
    if ((currentUser?.isAdmin || currentUser?.isSales) && !customerNameForOrder.trim()) {
        errors.name = "El nombre del cliente es obligatorio.";
    }
    if ((currentUser?.isAdmin || currentUser?.isSales) && !customerIdCardForOrder.trim()) {
        errors.idCard = "La cédula del cliente es obligatoria.";
    }
    if (deliveryMethod === 'delivery' && !selectedAddressId) {
        errors.address = "Debes seleccionar o añadir una dirección de envío.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [currentUser, customerNameForOrder, customerIdCardForOrder, deliveryMethod, selectedAddressId]);

  const handlePlaceOrder = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser || cartItems.length === 0) return;
    if (!validateForm()) {
        showNotification("Por favor, completa todos los campos requeridos.", "error");
        return;
    }

    setIsProcessingOrder(true); 
    let finalAddress: Address | null = null;
    if (deliveryMethod === 'delivery') {
        finalAddress = currentUser.addresses.find(addr => addr.id === selectedAddressId) || null;
        if (!finalAddress) {
            showNotification("Dirección de envío no válida.", "error");
            setIsProcessingOrder(false); 
            return;
        }
    }
    
    const customerDetailsForOrder = (currentUser.isAdmin || currentUser.isSales) 
        ? { name: customerNameForOrder, idCard: customerIdCardForOrder } 
        : undefined;
    
    try {
      const result = await createOrder(cartItems, finalAddress, deliveryMethod, customerDetailsForOrder);

      if (result.success && result.orderId) {
        clearCart();
        showNotification(result.message || 'Pedido realizado con éxito.', 'success');
        navigate('/order-confirmation', { state: { orderId: result.orderId, deliveryMethod: deliveryMethod } });
      } else {
        showNotification(result.message || 'Error al procesar el pedido.', 'error');
      }
    } catch (error) {
      console.error("CheckoutPage: Error during createOrder:", error);
      showNotification('Error inesperado al procesar el pedido.', 'error');
    } finally {
      setIsProcessingOrder(false); 
    }
  }, [currentUser, cartItems, createOrder, clearCart, showNotification, navigate, deliveryMethod, selectedAddressId, customerNameForOrder, customerIdCardForOrder, validateForm]);
  
  const handleAddNewAddress = () => {
    setIsAddressModalOpen(true);
  };
  
  const onAddressSaved = () => { 
    setIsAddressModalOpen(false);
  };

  if (!currentUser) return <div className="text-center py-20">Cargando...</div>;

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-text-primary text-center">Checkout</h1>
        
        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 bg-brand-primary p-6 rounded-lg shadow-card space-y-6">
            
            {(currentUser.isAdmin || currentUser.isSales) && (
                 <div className="border-b border-brand-gray-light pb-6">
                    <h2 className="text-lg sm:text-xl font-semibold text-text-primary mb-3">Información del Cliente (Para Pedido)</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField
                            id="customerNameForOrder"
                            name="customerNameForOrder"
                            label="Nombre Completo del Cliente"
                            value={customerNameForOrder}
                            onChange={(e) => setCustomerNameForOrder(e.target.value)}
                            required={currentUser.isAdmin || currentUser.isSales}
                            error={formErrors.name}
                        />
                        <InputField
                            id="customerIdCardForOrder"
                            name="customerIdCardForOrder"
                            label="Cédula del Cliente"
                            value={customerIdCardForOrder}
                            onChange={(e) => setCustomerIdCardForOrder(e.target.value)}
                            required={currentUser.isAdmin || currentUser.isSales}
                            error={formErrors.idCard}
                        />
                    </div>
                </div>
            )}


            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-text-primary mb-3">Método de Entrega</h2>
              <div className="space-y-3">
                <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${deliveryMethod === 'delivery' ? 'border-brand-tertiary ring-2 ring-brand-tertiary bg-brand-tertiary/5' : 'border-brand-quaternary hover:border-brand-gray-dark'}`}>
                  <input type="radio" name="deliveryMethod" value="delivery" checked={deliveryMethod === 'delivery'} onChange={() => setDeliveryMethod('delivery')} className="form-radio text-brand-tertiary focus:ring-brand-tertiary mr-3" />
                  <div>
                    <span className="font-medium text-text-primary">Entrega a Domicilio</span>
                    <p className="text-sm text-text-secondary">Costo de envío: $5.00</p>
                  </div>
                </label>
                <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${deliveryMethod === 'pickup' ? 'border-brand-tertiary ring-2 ring-brand-tertiary bg-brand-tertiary/5' : 'border-brand-quaternary hover:border-brand-gray-dark'}`}>
                  <input type="radio" name="deliveryMethod" value="pickup" checked={deliveryMethod === 'pickup'} onChange={() => setDeliveryMethod('pickup')} className="form-radio text-brand-tertiary focus:ring-brand-tertiary mr-3" />
                   <div>
                    <span className="font-medium text-text-primary">Retiro en Local</span>
                    <p className="text-sm text-text-secondary">Gratis. Recoge en nuestra tienda.</p>
                  </div>
                </label>
              </div>
            </div>

            {deliveryMethod === 'delivery' && (
              <div>
                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-lg sm:text-xl font-semibold text-text-primary">Dirección de Envío</h2>
                    <button type="button" onClick={handleAddNewAddress} className="btn-outline text-xs py-1 px-2.5">
                        + Nueva Dirección
                    </button>
                </div>
                {currentUser.addresses && currentUser.addresses.length > 0 ? (
                  <div className="space-y-2">
                    {currentUser.addresses.map(addr => (
                      <label key={addr.id} className={`flex items-start p-3 border rounded-lg cursor-pointer transition-all ${selectedAddressId === addr.id ? 'border-brand-tertiary ring-2 ring-brand-tertiary bg-brand-tertiary/5' : 'border-brand-quaternary hover:border-brand-gray-dark'}`}>
                        <input type="radio" name="selectedAddress" value={addr.id} checked={selectedAddressId === addr.id} onChange={() => setSelectedAddressId(addr.id)} className="form-radio text-brand-tertiary focus:ring-brand-tertiary mr-3 mt-1 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-sm text-text-primary">{addr.primaryAddress}</p>
                          <p className="text-xs text-text-secondary">{addr.apartmentOrHouseNumber}</p>
                          {addr.deliveryInstructions && <p className="text-xs text-text-secondary mt-0.5"><i>Instrucciones: {addr.deliveryInstructions}</i></p>}
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-text-secondary text-sm">No tienes direcciones guardadas. Por favor, añade una.</p>
                )}
                {formErrors.address && <p className="text-xs text-error mt-1">{formErrors.address}</p>}
              </div>
            )}
          </div>
          
          <div className="lg:col-span-1 bg-brand-primary p-6 rounded-lg shadow-card h-fit lg:sticky lg:top-24">
            <h2 className="text-lg sm:text-xl font-semibold text-text-primary mb-4 pb-3 border-b border-brand-gray-light">Resumen del Pedido</h2>
            <div className="space-y-2 text-sm mb-4">
              {cartItems.map(item => (
                <div key={`${item.product.id}-${item.selectedSize}`} className="flex justify-between items-start">
                  <div className="flex-grow">
                    <p className="text-text-primary font-medium leading-tight">{item.product.name} <span className="text-xs text-text-secondary"> (x{item.quantity}, Talla: {item.selectedSize})</span></p>
                  </div>
                  <p className="text-text-secondary flex-shrink-0 ml-2">${(item.priceAtPurchase * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
            <hr className="my-3 border-brand-gray-light" />
            <div className="space-y-1.5 text-sm mb-4">
                <div className="flex justify-between">
                    <span className="text-text-secondary">Subtotal:</span>
                    <span className="font-medium text-text-primary">${totalAmount.toFixed(2)}</span>
                </div>
                 <div className="flex justify-between">
                    <span className="text-text-secondary">Envío:</span>
                    <span className="font-medium text-text-primary">${shippingCost.toFixed(2)}</span>
                </div>
            </div>
            <hr className="my-3 border-brand-gray-light" />
            <div className="flex justify-between text-base font-bold mb-6">
              <span className="text-text-primary">Total a Pagar:</span>
              <span className="text-brand-secondary">${grandTotal.toFixed(2)}</span>
            </div>
            <button 
              type="submit" 
              className="btn-secondary w-full text-base flex items-center justify-center min-h-[44px]" // Added min-h for consistent height
              disabled={cartItems.length === 0 || isProcessingOrder}
            >
              {isProcessingOrder ? (
                <>
                  <SpinnerIcon className="w-5 h-5 mr-2" />
                  Procesando Pedido...
                </>
              ) : (
                'Realizar Pedido'
              )}
            </button>
            <Link to="/cart" className="block text-center mt-3 text-sm text-brand-tertiary hover:underline">
              Volver al Carrito
            </Link>
          </div>
        </form>
      </div>
      <AddAddressModal 
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onSave={onAddressSaved} 
        modalIdPrefix="checkout"
      />
    </>
  );
};

export default CheckoutPage;