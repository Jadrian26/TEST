import React from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import { DeliveryMethod } from '../types';

const OrderConfirmationPage: React.FC = () => {
  const location = useLocation();
  const orderId = location.state?.orderId;
  const deliveryMethod = location.state?.deliveryMethod as DeliveryMethod | undefined;

  if (!orderId) {
    // Redirigir a inicio o carrito si no hay orderId (ej. navegación directa)
    return <Navigate to="/cart" replace />;
  }

  return (
    <div className="text-center py-16 bg-brand-primary p-8 rounded-lg shadow-card max-w-2xl mx-auto">
      <svg className="mx-auto h-20 w-20 text-success mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-success mb-3">¡Gracias por tu pedido!</h1>
      <p className="text-base sm:text-lg text-text-primary mb-2">Tu pedido ha sido realizado con éxito.</p>
      <p className="text-sm sm:text-base text-text-secondary mb-8">
        Tu número de pedido es: <strong className="text-brand-secondary">{orderId.replace('#','')}</strong>.
        Recibirás una confirmación por correo electrónico en breve.
      </p>
      <div className="space-y-3 sm:space-y-0 sm:flex sm:justify-center sm:space-x-4">
        <Link
          to={`/account/orders/${orderId.replace('#','')}`}
          state={{ deliveryMethod: deliveryMethod }} // Pass deliveryMethod to OrderDetailPage
          className="btn-primary block sm:inline-block text-base sm:text-lg" 
        >
          Ver Detalles del Pedido
        </Link>
        <Link
          to="/catalog"
          className="btn-outline block sm:inline-block text-base sm:text-lg"
        >
          Continuar Comprando
        </Link>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;