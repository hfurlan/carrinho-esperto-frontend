import { Navigate } from 'react-router-dom';
import { useAuth } from './authContext.ts';

/**
 * Client-side gate for the admin area — hides it from non-admins. Not a security
 * boundary: every {@code /api/admin/**} route is enforced server-side
 * ({@code hasRole("ADMIN")}), so a non-admin who forces the route sees empty
 * error states, not data.
 */
export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user?.isAdmin) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
