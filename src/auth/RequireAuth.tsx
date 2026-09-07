import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './authContext.ts';

/**
 * Route guard. While the persisted session is being restored we show a small
 * placeholder rather than flashing the login page. `expired` still routes to
 * /login (the page renders a "session expired" notice), preserving the
 * attempted path so the user lands back where they were after signing in again.
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center" role="status" aria-label="Carregando">
        <span className="text-sm text-slate-500">Carregando…</span>
      </div>
    );
  }

  if (status === 'anonymous' || status === 'expired') {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  return <>{children}</>;
}
