import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import type { UserRole } from '@/types';

interface RequireAuthProps {
  children: React.ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

interface RequireRoleProps {
  children: React.ReactNode;
  roles: UserRole[];
  fallback?: React.ReactNode;
}

export function RequireRole({ children, roles, fallback }: RequireRoleProps) {
  const { user } = useAuthStore();

  if (!user || !roles.includes(user.role)) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
}

interface RequireVerifiedProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RequireVerified({ children, fallback }: RequireVerifiedProps) {
  const { user } = useAuthStore();

  if (!user?.isVerified) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return null;
  }

  return <>{children}</>;
}

// Hook to check if user can perform certain actions
export function useCanPerform() {
  const { user } = useAuthStore();

  return {
    canInvest: user?.isVerified && user?.role === 'INVESTOR',
    canRequestAccess: user?.isVerified && user?.role === 'INVESTOR',
    canCreateProject: user?.role === 'DEVELOPER',
    canReviewProjects: user?.role === 'ADMIN',
    canManageUsers: user?.role === 'ADMIN',
    isVerified: user?.isVerified ?? false,
    role: user?.role,
  };
}
