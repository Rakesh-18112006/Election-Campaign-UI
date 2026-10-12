import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  // MAIN_ADMIN has no dashboard — send to parties
  const defaultHome = user.role === 'MAIN_ADMIN' ? '/parties' : '/dashboard';

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={defaultHome} replace />;
  }

  // Prevent MAIN_ADMIN from landing on /dashboard (root redirect)
  if (user.role === 'MAIN_ADMIN' && location.pathname === '/dashboard') {
    return <Navigate to="/parties" replace />;
  }

  return <>{children}</>;
}
