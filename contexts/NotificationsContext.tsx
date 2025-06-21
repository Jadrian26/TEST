
import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect, useRef } from 'react';

export type NotificationType = 'success' | 'error' | 'info';

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  duration?: number;
}

interface NotificationsContextType {
  notification: Notification | null;
  showNotification: (message: string, type: NotificationType, duration?: number) => void;
  hideNotification: () => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const NotificationsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notification, setNotification] = useState<Notification | null>(null);
  const timeoutIdRef = useRef<number | null>(null); // Changed to useRef

  const hideNotification = useCallback(() => {
    if (timeoutIdRef.current !== null) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
    setNotification(null);
  }, []); // setNotification is stable

  const showNotification = useCallback((message: string, type: NotificationType, duration?: number) => {
    // Clear any existing timeout for the previous notification
    if (timeoutIdRef.current !== null) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null; 
    }
    
    const newNotification: Notification = {
      id: `notif-${Date.now()}`,
      message,
      type,
      duration
    };
    setNotification(newNotification);

    const autoHideDuration = duration ?? (type === 'error' ? undefined : 3000);

    if (autoHideDuration) {
      // Set a new timeout for the current notification
      timeoutIdRef.current = window.setTimeout(() => {
        setNotification(currentNotif => {
          if (currentNotif?.id === newNotification.id) {
            timeoutIdRef.current = null; // Clear ref as this timeout is done
            return null;
          }
          return currentNotif;
        });
      }, autoHideDuration);
    }
  }, [hideNotification]); // hideNotification is stable

  // Clear timeout on unmount
  useEffect(() => {
    // Capture the current value of the ref for cleanup
    const currentTimeoutId = timeoutIdRef.current;
    return () => {
      if (currentTimeoutId !== null) {
        clearTimeout(currentTimeoutId);
      }
    };
  }, []); // Empty dependency array: runs on mount and cleans up on unmount

  return (
    <NotificationsContext.Provider value={{ notification, showNotification, hideNotification }}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = (): NotificationsContextType => {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};
