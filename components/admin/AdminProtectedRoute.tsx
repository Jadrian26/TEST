
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface AdminProtectedRouteProps {
  children?: React.ReactNode; // To allow wrapping <AdminLayout /> or just using <Outlet />
}

const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const { currentUser, loadingAuth } = useAuth();
  const location = useLocation();

  if (loadingAuth) {
    // You might want to show a global loader here or a simple text
    return <div className="text-center py-20">Cargando autenticación...</div>;
  }

  if (!currentUser || (!currentUser.isAdmin && !currentUser.isSales)) {
    // console.log("AdminProtectedRoute: User not admin/sales or not logged in. Redirecting.", currentUser);
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default AdminProtectedRoute;