import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { Address, DeliveryMethod } from '../types';
import AddAddressModal from '../components/AddAddressModal'; 
import useAuthRedirect from '../hooks/useAuthRedirect';
import { useNotifications } from '../contexts/NotificationsContext'; // Added

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
}

const InputField: React.FC<InputFieldProps> = ({ id, label, type = 'text', value, onChange, placeholder, required, as = 'input', rows, autoComplete, error, pattern, title }) => (
    <div className="mb-4">
        <label htmlFor={id} className="block text-sm sm:text-base font-medium text-text-primary mb-1">
            {label} {required && <span className="text-error">*</span>}
        </label>
        {as === 'textarea' ? (
            <textarea
                id={id} name={id} value={value} onChange={onChange} placeholder={placeholder} required={required} rows={rows || 3}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 text-sm sm:text-base transition-colors bg-brand-primary ${
                  error ? 'border-error focus:ring-error focus:border-error' : 'border-brand-quaternary focus:ring-brand-tertiary focus:border-brand-tertiary'
                }`}
                aria-invalid={!!error}
            />
        ) : (
            <input
                type={type} id={id} name={id} value={value} onChange={onChange} placeholder={placeholder} required={required} autoComplete={autoComplete}
                pattern={pattern} title={title}
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
  const { currentUser, addMockOrder, updateUserAddresses } = useAuth();
  const { cartItems, totalAmount, clearCart } = useCart();
  const navigate = useNavigate();
  const { showNotification } = useNotifications();

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('delivery');
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [processingOrder, setProcessingOrder] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Campos para Admin/Ventas
  const [customerNameForOrder, setCustomerNameForOrder] = useState('');
  const [customerIdCardForOrder, setCustomerIdCardForOrder] = useState('');
  const [customerNameError, setCustomerNameError] = useState('');
  const [customerIdCardError, setCustomerIdCardError] = useState('');

  useAuthRedirect({
    redirectTo: '/account',
    state: { from: '/checkout', message: 'Debes iniciar sesión para proceder al pago.' }
  });

  useEffect(() => {
    if (currentUser) {
      if (deliveryMethod === 'delivery') {
        if (currentUser.addresses.length > 0) {
          const defaultAddress = currentUser.addresses.find(addr => addr.isDefault) || currentUser.addresses[0];
          setSelectedAddressId(defaultAddress.id);
        } else {
          setSelectedAddressId(null);
        }
      } else if (deliveryMethod === 'pickup') {
        setSelectedAddressId(null);
      }
    }
  }, [currentUser, deliveryMethod]);

  const validateAdminOrderFields = (): boolean => {
    let isValid = true;
    setCustomerNameError('');
    setCustomerIdCardError('');

    if (!customerNameForOrder.trim()) {
      setCustomerNameError('El nombre del cliente es obligatorio.');
      isValid = false;
    }
    if (!customerIdCardForOrder.trim()) {
      setCustomerIdCardError('La cédula del cliente es obligatoria.');
      isValid = false;
    } else if (!/^[A-Za-z0-9\-]+$/.test(customerIdCardForOrder)) {
        setCustomerIdCardError('Formato de cédula inválido.');
        isValid = false;
    }
    return isValid;
  }

  const handlePlaceOrder = async () => {
    if (!currentUser || cartItems.length === 0) {
      setCheckoutError("Error en la información del pedido. Verifica tu carrito.");
      showNotification("Error en la información del pedido. Verifica tu carrito.", "error");
      return;
    }
    
    if (deliveryMethod === 'delivery') {
      if (!selectedAddressId) { 
        if (currentUser.addresses.length === 0) { 
            setIsAddressModalOpen(true); 
            showNotification("Por favor, añade una dirección de envío.", "error");
            setCheckoutError("Por favor, añade y selecciona una dirección de envío.");
        } else { 
            showNotification("Por favor, selecciona una dirección de envío de la lista.", "error");
            setCheckoutError("Por favor, selecciona una dirección de envío.");
        }
        return; 
      }
    }
    
    let customerForOrderData: { name: string; idCard: string; } | undefined = undefined;
    if (currentUser.role === 'admin' || currentUser.role === 'sales') {
        if (!validateAdminOrderFields()) {
            showNotification("Por favor, completa los campos de información del cliente.", "error");
            return;
        }
        customerForOrderData = { name: customerNameForOrder, idCard: customerIdCardForOrder };
    }

    const shippingAddress = deliveryMethod === 'delivery' 
        ? currentUser.addresses.find(addr => addr.id === selectedAddressId) 
        : null; 

    if (deliveryMethod === 'delivery' && !shippingAddress) {
        setCheckoutError("Dirección de envío no encontrada.");
        showNotification("Dirección de envío no encontrada. Por favor, selecciona o añade una.", "error");
        return;
    }

    setProcessingOrder(true);
    setCheckoutError(null);
    const result = await addMockOrder(cartItems, shippingAddress, deliveryMethod, customerForOrderData);
    setProcessingOrder(false);

    if (result.success && result.orderId) {
      clearCart();
      navigate('/order-confirmation', { state: { orderId: result.orderId, deliveryMethod } });
    } else {
      setCheckoutError(result.message || "Ocurrió un error al procesar tu pedido.");
      showNotification(result.message || "Ocurrió un error al procesar tu pedido.", "error");
    }
  };
  
  const handleSaveNewAddressFromCheckout = async (newAddressData: Omit<Address, 'id' | 'isDefault'>) => {
    if (!currentUser) return;
    const newAddress: Address = {
      ...newAddressData,
      id: `addr-checkout-${Date.now()}`,
      isDefault: currentUser.addresses.length === 0,
    };
    const updatedAddresses = [...currentUser.addresses, newAddress];
    const result = await updateUserAddresses(updatedAddresses);
    if(result.success) {
      setSelectedAddressId(newAddress.id); 
      showNotification("Nueva dirección guardada y seleccionada.", "success");
      setIsAddressModalOpen(false); 
    } else {
      showNotification(result.message || "Error al guardar la dirección.", "error");
    }
  };


  if (!currentUser) {
    return <div className="text-center py-20">Redirigiendo...</div>;
  }

  const shippingCost = deliveryMethod === 'delivery' && cartItems.length > 0 ? 5.00 : 0.00;
  const grandTotal = totalAmount + shippingCost; 
  const isPrivilegedUser = currentUser.role === 'admin' || currentUser.role === 'sales';

  return (
    <div className="space-y-6 md:space-y-8">
      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-brand-secondary text-center">Checkout</h1>
      
      <div className="lg:flex lg:gap-8 items-start">
        <div className="lg:w-2/3 space-y-6 md:space-y-8">
          {isPrivilegedUser && (
            <section className="bg-brand-primary p-4 sm:p-6 rounded-lg shadow-card">
              <h2 className="text-lg sm:text-xl font-semibold text-brand-secondary mb-4">Información del Cliente (Para Pedido)</h2>
              <InputField 
                id="customerNameForOrder" 
                label="Nombre Completo del Cliente" 
                value={customerNameForOrder} 
                onChange={(e) => setCustomerNameForOrder(e.target.value)} 
                required 
                placeholder="Nombre Apellido"
                error={customerNameError}
              />
              <InputField 
                id="customerIdCardForOrder" 
                label="Cédula del Cliente" 
                value={customerIdCardForOrder} 
                onChange={(e) => setCustomerIdCardForOrder(e.target.value)} 
                required 
                placeholder="Ej: 8-123-456 o PE-12345"
                pattern="^[A-Za-z0-9\-]+$" 
                title="Cédula puede contener letras, números y guiones."
                error={customerIdCardError}
              />
            </section>
          )}
          
          <section className="bg-brand-primary p-4 sm:p-6 rounded-lg shadow-card">
            <h2 className="text-lg sm:text-xl font-semibold text-brand-secondary mb-4">Método de Entrega</h2>
            <div className="space-y-3">
                <div>
                    <label className="flex items-center p-3 border border-brand-quaternary rounded-md hover:border-brand-secondary transition-colors cursor-pointer has-[:checked]:border-brand-tertiary has-[:checked]:ring-2 has-[:checked]:ring-brand-tertiary has-[:checked]:bg-brand-tertiary/5">
                        <input 
                            type="radio" 
                            name="deliveryMethod" 
                            value="delivery"
                            checked={deliveryMethod === 'delivery'}
                            onChange={() => setDeliveryMethod('delivery')}
                            className="h-4 w-4 text-brand-tertiary focus:ring-brand-tertiary border-brand-quaternary"
                        />
                        <span className="ml-3 text-sm sm:text-base text-text-primary">Entrega a Domicilio ($5.00)</span>
                    </label>
                </div>
                <div>
                    <label className="flex items-center p-3 border border-brand-quaternary rounded-md hover:border-brand-secondary transition-colors cursor-pointer has-[:checked]:border-brand-tertiary has-[:checked]:ring-2 has-[:checked]:ring-brand-tertiary has-[:checked]:bg-brand-tertiary/5">
                        <input 
                            type="radio" 
                            name="deliveryMethod" 
                            value="pickup"
                            checked={deliveryMethod === 'pickup'}
                            onChange={() => setDeliveryMethod('pickup')}
                            className="h-4 w-4 text-brand-tertiary focus:ring-brand-tertiary border-brand-quaternary"
                        />
                        <span className="ml-3 text-sm sm:text-base text-text-primary">Retiro en local (Gratis)</span>
                    </label>
                </div>
            </div>
          </section>

          {deliveryMethod === 'delivery' && (
            <section className="bg-brand-primary p-4 sm:p-6 rounded-lg shadow-card">
              <h2 className="text-lg sm:text-xl font-semibold text-brand-secondary mb-4">Dirección de Envío</h2>
              {currentUser.addresses.length > 0 ? (
                <div className="space-y-3 mb-4">
                  {currentUser.addresses.map(addr => (
                    <div key={addr.id} 
                         className={`p-3 sm:p-4 border rounded-md cursor-pointer transition-all ${selectedAddressId === addr.id ? 'border-brand-tertiary ring-2 ring-brand-tertiary bg-brand-tertiary bg-opacity-5 shadow-md' : 'border-brand-quaternary hover:border-brand-gray-dark hover:shadow-subtle'}`}
                         onClick={() => setSelectedAddressId(addr.id)}>
                      <p className="font-medium text-text-primary text-sm sm:text-base">{addr.primaryAddress}</p>
                      {addr.apartmentOrHouseNumber && <p className="text-xs sm:text-sm text-text-secondary">Nº Piso/Apto/Casa: {addr.apartmentOrHouseNumber}</p>}
                      {addr.deliveryInstructions && <p className="text-xs sm:text-sm text-brand-gray-medium mt-1">Indicaciones: {addr.deliveryInstructions}</p>}
                      {addr.isDefault && <span className="text-xs font-medium text-success mt-1 inline-block bg-success/10 px-1.5 py-0.5 rounded-full">Predeterminada</span>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-text-secondary text-sm sm:text-base mb-3">No tienes direcciones guardadas. Por favor, añade una.</p>
              )}
              <button onClick={() => setIsAddressModalOpen(true)} className="btn-outline py-2 px-4">
                Añadir Nueva Dirección
              </button>
            </section>
          )}

          <section className="bg-brand-primary p-4 sm:p-6 rounded-lg shadow-card">
            <h2 className="text-lg sm:text-xl font-semibold text-brand-secondary mb-4">Detalles de Pago</h2>
            <p className="text-text-secondary text-sm sm:text-base mb-3">Esta es una simulación. No ingrese datos reales.</p>
            <form className="space-y-4">
              <InputField id="cardName" label="Nombre en la Tarjeta" value="Juan Perez (Simulado)" onChange={() => {}} autoComplete="cc-name" />
              <InputField id="cardNumber" label="Número de Tarjeta" value="**** **** **** 1234" onChange={() => {}} placeholder="xxxx xxxx xxxx xxxx" autoComplete="cc-number" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField id="expiryDate" label="Fecha de Expiración" value="12/25" onChange={() => {}} placeholder="MM/AA" autoComplete="cc-exp" />
                <InputField id="cvv" label="CVV" value="123" onChange={() => {}} placeholder="123" autoComplete="cc-csc" />
              </div>
            </form>
          </section>
        </div>

        <div className="lg:w-1/3 mt-6 lg:mt-0 bg-brand-primary p-4 sm:p-6 rounded-lg shadow-card h-fit lg:sticky lg:top-24">
            <h2 className="text-lg sm:text-xl font-semibold text-text-primary mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-brand-gray-light">Resumen del Pedido</h2>
            {cartItems.map(item => (
                <div key={item.product.id + item.selectedSize} className="flex justify-between items-center py-2 border-b border-brand-gray-light border-opacity-50 text-sm last:border-b-0">
                    <div>
                        <p className="font-medium text-text-primary text-xs sm:text-sm">{item.product.name} <span className="text-xs text-text-secondary"> (x{item.quantity})</span></p>
                        <p className="text-xs text-text-secondary">
                          {item.selectedSize !== 'N/A' ? `Talla: ${item.selectedSize}` : ''}
                        </p>
                    </div>
                    <p className="text-text-primary font-medium text-xs sm:text-sm">${(item.priceAtPurchase * item.quantity).toFixed(2)}</p>
                </div>
            ))}
            <div className="space-y-2 text-sm sm:text-base my-4 pt-2">
              <div className="flex justify-between">
                <span className="text-text-secondary">Método de Entrega:</span>
                <span className="font-medium text-text-primary">{deliveryMethod === 'pickup' ? 'Retiro en local' : 'Entrega a Domicilio'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Subtotal:</span>
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
            {checkoutError && <p className="text-sm text-error mb-3 sm:mb-4">{checkoutError}</p>}
            <button
              onClick={handlePlaceOrder}
              disabled={processingOrder || (deliveryMethod === 'delivery' && !selectedAddressId && currentUser.addresses.length > 0) || cartItems.length === 0}
              className="btn-secondary w-full"
            >
              {processingOrder ? 'Procesando Pedido...' : 'Realizar Pedido'}
            </button>
        </div>
      </div>
      <AddAddressModal 
        isOpen={isAddressModalOpen} 
        onClose={() => setIsAddressModalOpen(false)} 
        onSave={handleSaveNewAddressFromCheckout} 
        modalIdPrefix="checkout"
      />
    </div>
  );
};

export default CheckoutPage;