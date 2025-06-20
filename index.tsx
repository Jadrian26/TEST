import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { CartProvider } from './contexts/CartContext';
import { AuthProvider } from './contexts/AuthContext';
import { EditableContentProvider } from './contexts/EditableContentContext';
import { MediaProvider } from './contexts/MediaContext';
import { NotificationsProvider } from './contexts/NotificationsContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <NotificationsProvider>
        <EditableContentProvider>
          <MediaProvider>
            <CartProvider>
              <App />
            </CartProvider>
          </MediaProvider>
        </EditableContentProvider>
      </NotificationsProvider>
    </AuthProvider>
  </React.StrictMode>
);