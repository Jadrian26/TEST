
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { CartProvider } from './contexts/CartContext';
import { AuthProvider } from './contexts/AuthContext';
import { EditableContentProvider } from './contexts/EditableContentContext';
import { MediaProvider } from './contexts/MediaContext';
import { NotificationsProvider } from './contexts/NotificationsContext'; // Added NotificationsProvider

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <EditableContentProvider>
        <MediaProvider>
          <CartProvider>
            <NotificationsProvider> {/* Added NotificationsProvider */}
              <App />
            </NotificationsProvider>
          </CartProvider>
        </MediaProvider>
      </EditableContentProvider>
    </AuthProvider>
  </React.StrictMode>
);