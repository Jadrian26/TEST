import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEditableContent } from '../contexts/EditableContentContext';
import { useMedia } from '../contexts/MediaContext';
import { Order, Address as AddressType, MediaItem, DeliveryMethod } from '../types';
import WazeIcon from '../components/icons/WazeIcon';
import GoogleMapsIcon from '../components/icons/GoogleMapsIcon';
import DownloadIcon from '../components/icons/DownloadIcon';
import useOrderPdfGenerator from '../hooks/useOrderPdfGenerator'; // Import the new hook

// jsPDF is now handled by the hook, no need to declare here

const OrderDetailPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { currentUser } = useAuth();
  const { brandLogoId } = useEditableContent();
  const { mediaItems } = useMedia();
  const navigate = useNavigate();
  const location = useLocation(); // Get location to access state
  
  const [order, setOrder] = useState<Order | null>(null);
  const [brandLogo, setBrandLogo] = useState<MediaItem | null>(null); 
  
  const { generatePdf, isGeneratingPdf } = useOrderPdfGenerator(); 

  // Attempt to get deliveryMethod from location state, fallback to order object if needed
  const deliveryMethodFromState = location.state?.deliveryMethod as DeliveryMethod | undefined;

  useEffect(() => {
    if (!currentUser) {
      navigate('/account', { state: { from: `/account/orders/${orderId}` } });
      return;
    }
    const foundOrder = currentUser.orders.find(o => o.id.replace('#','') === orderId);
    if (foundOrder) {
      setOrder(foundOrder);
    } else {
      navigate('/account'); 
    }
  }, [currentUser, orderId, navigate]);

  useEffect(() => {
    if (brandLogoId) {
      const logoItem = mediaItems.find(item => item.id === brandLogoId);
      setBrandLogo(logoItem || null);
    } else {
      setBrandLogo(null);
    }
  }, [brandLogoId, mediaItems]);

  const handleGeneratePdf = async () => {
    if (order && currentUser) {
      // Pass deliveryMethod to PDF generator. Use from state if available, else from order.
      const finalDeliveryMethod = deliveryMethodFromState || order.deliveryMethod;
      await generatePdf(order, currentUser, brandLogo, finalDeliveryMethod);
    }
  };

  const getOrderStatusText = (status: Order['status']): string => {
    switch (status) {
      case 'Processing': return 'Procesando';
      case 'Shipped': return 'Enviado';
      case 'Delivered': return 'Entregado';
      case 'Cancelled': return 'Cancelado';
      default: return status;
    }
  };
  
  const getDeliveryMethodText = (method: DeliveryMethod): string => {
    return method === 'pickup' ? 'Retiro en local' : 'Entrega a Domicilio';
  };


  if (!currentUser) {
    return <div className="text-center py-20">Redirigiendo a inicio de sesión...</div>;
  }

  if (!order) {
    return <div className="text-center py-20">Buscando detalles del pedido...</div>;
  }
  
  const effectiveDeliveryMethod = deliveryMethodFromState || order.deliveryMethod;
  const isPickup = effectiveDeliveryMethod === 'pickup';


  const AddressDisplay: React.FC<{ address: AddressType | null }> = ({ address }) => {
    if (!address) return <p className="text-text-secondary">N/A (Retiro en local)</p>;
    return (
      <div className="space-y-1">
        <p className="font-medium text-sm sm:text-base">{address.primaryAddress}</p>
        {address.apartmentOrHouseNumber && <p className="text-xs sm:text-sm">Nº Piso/Apto/Casa: {address.apartmentOrHouseNumber}</p>}
        {address.deliveryInstructions && <p className="text-xs sm:text-sm text-brand-gray-medium">Indicaciones: {address.deliveryInstructions}</p>}
        <div className="flex flex-wrap gap-2 pt-2 mt-2 border-t border-brand-gray-light border-opacity-30">
          {address.wazeUrl && (
            <a 
              href={address.wazeUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn-outline !py-1.5 !px-2.5 text-xs flex items-center"
              title="Abrir en Waze"
            >
              <WazeIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" ariaHidden={true} /> Waze
            </a>
          )}
          {address.googleMapsUrl && (
            <a 
              href={address.googleMapsUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn-outline !py-1.5 !px-2.5 text-xs flex items-center"
              title="Abrir en Google Maps"
            >
              <GoogleMapsIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" ariaHidden={true} /> Google Maps
            </a>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 md:space-y-8">
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-brand-quaternary">
            <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-brand-secondary">Detalles del Pedido: {order.id.replace('#','')}</h1>
                <p className="text-text-secondary text-xs sm:text-sm mt-1">
                    Realizado el: {new Date(order.date).toLocaleDateString('es-PA')} | Estado: 
                    <span className={`ml-1.5 px-2 py-0.5 text-xs font-medium rounded-full ${
                        order.status === 'Delivered' ? 'bg-success/20 text-green-700' : 
                        order.status === 'Shipped' ? 'bg-brand-tertiary/20 text-brand-secondary' :
                        order.status === 'Processing' ? 'bg-yellow-500/20 text-yellow-700' :
                        'bg-error/20 text-red-700' 
                      }`}>
                        {getOrderStatusText(order.status)}
                    </span>
                </p>
                 <p className="text-text-secondary text-xs sm:text-sm mt-0.5">
                    Método de Entrega: <span className="font-medium text-text-primary">{getDeliveryMethodText(effectiveDeliveryMethod)}</span>
                </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-3 sm:mt-0">
                <button
                    onClick={handleGeneratePdf}
                    disabled={isGeneratingPdf}
                    className="btn-secondary py-2 px-4 text-sm sm:text-base flex items-center justify-center disabled:opacity-70"
                >
                    <DownloadIcon className="w-4 h-4 mr-2" />
                    {isGeneratingPdf ? 'Generando...' : 'Descargar PDF'}
                </button>
                <Link to="/account" className="btn-outline py-2 px-4 text-sm sm:text-base text-center">
                &larr; Volver a Mi Cuenta
                </Link>
            </div>
        </div>

      <section className="bg-brand-primary p-4 sm:p-6 rounded-lg shadow-card">
        <h2 className="text-lg sm:text-xl font-semibold text-brand-secondary mb-4">Artículos del Pedido</h2>
        <div className="space-y-3 sm:space-y-4">
          {order.items.map((item, index) => (
            <div key={index} className="flex flex-col sm:flex-row justify-between sm:items-center py-2 sm:py-3 border-b border-brand-gray-light last:border-b-0">
              <div className="mb-1 sm:mb-0">
                <p className="font-medium text-text-primary text-sm sm:text-base">{item.name}</p>
                <p className="text-xs sm:text-sm text-text-secondary">Cantidad: {item.quantity} | Talla: {item.selectedSize}</p>
              </div>
              <p className="text-text-primary text-sm sm:text-base font-medium sm:font-normal">${(item.price * item.quantity).toFixed(2)}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid md:grid-cols-2 gap-6 md:gap-8">
        <section className="bg-brand-primary p-4 sm:p-6 rounded-lg shadow-card">
          <h2 className="text-lg sm:text-xl font-semibold text-brand-secondary mb-4">
            {isPickup ? "Retiro en local" : "Dirección de Envío"}
          </h2>
          <div className="text-text-secondary">
            {isPickup ? (
                <div>
                    <p className="font-medium text-sm sm:text-base">Retiro en local</p>
                    <p className="text-xs sm:text-sm">Por favor, espera la confirmación para retirar tu pedido.</p>
                </div>
            ) : (
                <AddressDisplay address={order.shippingAddress} />
            )}
          </div>
        </section>

        <section className="bg-brand-primary p-4 sm:p-6 rounded-lg shadow-card">
          <h2 className="text-lg sm:text-xl font-semibold text-brand-secondary mb-4">Resumen de Costos</h2>
          <div className="space-y-2 text-sm sm:text-base">
            <div className="flex justify-between">
              <span className="text-text-secondary">Subtotal:</span>
              <span className="text-text-primary">${(order.total - (isPickup ? 0 : 5.00)).toFixed(2)}</span> 
            </div>
            {!isPickup && (
              <div className="flex justify-between">
                <span className="text-text-secondary">Envío:</span>
                <span className="text-text-primary">$5.00</span>
              </div>
            )}
            <hr className="my-2 border-brand-gray-light" />
            <div className="flex justify-between text-base sm:text-lg font-bold">
              <span className="text-text-primary">Total:</span>
              <span className="text-brand-secondary">${order.total.toFixed(2)}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default OrderDetailPage;