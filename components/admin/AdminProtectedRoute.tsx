
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface AdminProtectedRouteProps {
  children?: React.ReactNode; // To allow wrapping <AdminLayout /> or just using <Outlet />
}

const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const { currentUser, registeredUsers } = useAuth();

  if (registeredUsers.length === 0 && !currentUser) {
    // Still loading initial user data
  }

  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'sales')) {
    // console.log("AdminProtectedRoute: User not admin/sales or not logged in. Redirecting.", currentUser);
    return <Navigate to="/" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default AdminProtectedRoute;