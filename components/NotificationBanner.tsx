
import React, { useEffect, useState } from 'react';
import { useNotifications, NotificationType } from '../contexts/NotificationsContext';
import CloseIcon from './icons/CloseIcon';

// Icons for different notification types
const SuccessIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}> {/* Adjusted strokeWidth for better visual match */}
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ErrorIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.248-8.25-3.286zm0 13.036h.008v.008H12v-.008z" />
  </svg>
);

const InfoIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
  </svg>
);


const NotificationBanner: React.FC = () => {
  const { notification, hideNotification } = useNotifications();
  const [isVisibleInternal, setIsVisibleInternal] = useState(false); // Internal state for animation

  useEffect(() => {
    if (notification) {
      setIsVisibleInternal(true);
    } else {
      // Start fade out animation if there was a notification
      if (isVisibleInternal) {
        setIsVisibleInternal(false);
      }
    }
  }, [notification, isVisibleInternal]);

  if (!notification && !isVisibleInternal) {
    return null;
  }

  const getBannerStyle = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return 'bg-green-500 text-white'; // Adjusted to match image's green
      case 'error':
        return 'bg-error text-white';
      case 'info':
        return 'bg-brand-tertiary text-white';
      default:
        return 'bg-brand-gray-dark text-white';
    }
  };

  const getIcon = (type: NotificationType) => {
    // Adjusted icon size and classes to better match the image
    const iconClass = "w-5 h-5 text-white"; 
    switch (type) {
      case 'success':
        return <SuccessIcon className={iconClass} />;
      case 'error':
        return <ErrorIcon className={iconClass} />;
      case 'info':
        return <InfoIcon className={iconClass} />;
      default:
        return null;
    }
  };

  const bannerAriaLive = notification?.type === 'error' ? 'assertive' : 'polite';
  const bannerRole = notification?.type === 'error' ? 'alert' : 'status';

  return (
    <div
      className={`mb-6 rounded-lg shadow-lg flex items-center justify-between relative text-white transition-all duration-300 ease-in-out
                  ${notification ? getBannerStyle(notification.type) : 'bg-transparent'}
                  ${isVisibleInternal && notification ? 'p-3 opacity-100 max-h-40' : 'p-0 opacity-0 max-h-0 overflow-hidden'}`}
      role={bannerRole}
      aria-live={bannerAriaLive}
    >
      {notification && ( // Only render content if notification exists
        <>
          <div className="flex items-center">
            <div className="flex-shrink-0 mr-3">
              {getIcon(notification.type)}
            </div>
            <p className="text-sm font-medium">{notification.message}</p>
          </div>
          <button
            onClick={hideNotification}
            className="ml-4 p-1 rounded-full hover:bg-black/20 focus:outline-none focus:ring-1 focus:ring-white focus:ring-opacity-50"
            aria-label="Cerrar notificación"
          >
            <CloseIcon className="w-4 h-4 text-white" /> {/* Adjusted close icon size */}
          </button>
        </>
      )}
    </div>
  );
};

export default NotificationBanner;
