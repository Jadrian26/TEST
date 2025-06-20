
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import ProductDetailPage from './pages/ProductDetailPage';
import AccountPage from './pages/AccountPage'; 
import CartPage from './pages/CartPage';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CheckoutPage from './pages/CheckoutPage'; 
import OrderConfirmationPage from './pages/OrderConfirmationPage'; 
import OrderDetailPage from './pages/OrderDetailPage'; 
import NotificationBanner from './components/NotificationBanner'; 

// Admin Imports
import AdminProtectedRoute from './components/admin/AdminProtectedRoute';
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminManageSchoolsPage from './pages/admin/AdminManageSchoolsPage';
import AdminSchoolProductsPage from './pages/admin/AdminSchoolProductsPage'; 
import AdminManageUsersPage from './pages/admin/AdminManageUsersPage';
import AdminViewOrdersPage from './pages/admin/AdminViewOrdersPage';
import AdminMediaManagementPage from './pages/admin/AdminMediaManagementPage'; 
import AdminPdfConfigPage from './pages/admin/AdminPdfConfigPage'; // New PDF Config Page

const App: React.FC = () => {
  return (
    <>
      {/* NotificationBanner was here, moved into main */}
      <HashRouter>
        <div className="flex flex-col min-h-screen bg-brand-gray-light text-text-primary font-sans">
          <Navbar />
          <main className="flex-grow container mx-auto px-4 py-8">
            <NotificationBanner /> {/* Moved NotificationBanner here */}
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/catalog" element={<CatalogPage />} />
              <Route path="/catalog/school/:schoolId" element={<CatalogPage />} />
              <Route path="/product/:productId" element={<ProductDetailPage />} />
              <Route path="/account" element={<AccountPage />} /> 
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/order-confirmation" element={<OrderConfirmationPage />} />
              <Route path="/account/orders/:orderId" element={<OrderDetailPage />} />

              {/* Placeholder routes for footer links */}
              <Route path="/about" element={<div className="p-6 bg-brand-primary rounded-lg shadow-card"><h1>Sobre Nosotros</h1><p>Página próximamente...</p></div>} />
              <Route path="/contact" element={<div className="p-6 bg-brand-primary rounded-lg shadow-card"><h1>Contáctanos</h1><p>Página próximamente...</p></div>} />
              <Route path="/shipping-returns" element={<div className="p-6 bg-brand-primary rounded-lg shadow-card"><h1>Envíos y Devoluciones</h1><p>Página próximamente...</p></div>} />
              <Route path="/privacy" element={<div className="p-6 bg-brand-primary rounded-lg shadow-card"><h1>Política de Privacidad</h1><p>Página próximamente...</p></div>} />
              <Route path="/terms" element={<div className="p-6 bg-brand-primary rounded-lg shadow-card"><h1>Términos de Servicio</h1><p>Página próximamente...</p></div>} />
              <Route path="/size-guide" element={<div className="p-6 bg-brand-primary rounded-lg shadow-card"><h1>Guía de Tallas</h1><p>Página próximamente...</p></div>} />
              <Route path="/process" element={<div className="p-6 bg-brand-primary rounded-lg shadow-card"><h1>Nuestro Proceso</h1><p>Página próximamente...</p></div>} />
              <Route path="/careers" element={<div className="p-6 bg-brand-primary rounded-lg shadow-card"><h1>Carreras</h1><p>Página próximamente...</p></div>} />
              
              {/* Admin Routes */}
              <Route path="/admin" element={<AdminProtectedRoute><AdminLayout /></AdminProtectedRoute>}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboardPage />} />
                <Route path="colegios" element={<AdminManageSchoolsPage />} />
                <Route path="colegios/:schoolId/productos" element={<AdminSchoolProductsPage />} />
                <Route path="medios" element={<AdminMediaManagementPage />} /> 
                <Route path="usuarios" element={<AdminManageUsersPage />} />
                <Route path="pedidos" element={<AdminViewOrdersPage />} />
                <Route path="pdf-config" element={<AdminPdfConfigPage />} /> {/* New Route */}
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </HashRouter>
    </>
  );
};

export default App;