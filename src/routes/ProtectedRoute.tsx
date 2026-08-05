import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import { Spinner } from '../components/ui';
import { userHasAnyRole, userHasRole } from '../utils/helpers';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size={32} />
      </div>
    );
  }

  if (!user) {
    let redirectPath = '/login';
    if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/superadmin')) {
      redirectPath = '/login/admin';
    } else if (location.pathname.startsWith('/moderator')) {
      redirectPath = '/login/moderator';
    }
    return <Navigate to={redirectPath} state={{ from: location.pathname }} replace />;
  }

  if (user && user.is_temp_password && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  if (allowedRoles) {
    const adminRoles: string[] = ['admin', 'moderator', 'super_admin'];
    const requiresAdmin = allowedRoles.some(r => adminRoles.includes(r));

    // If route requires admin/moderator/super_admin, enforce role checks
    if (requiresAdmin) {
      if (!userHasAnyRole(user, allowedRoles)) {
        return <Navigate to="/" replace />;
      }
    }
    // Routes that only included 'seller' should be accessible to any authenticated user
  }

  return <>{children}</>;
};

export default ProtectedRoute;
