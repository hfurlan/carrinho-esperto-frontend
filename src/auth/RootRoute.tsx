import { Navigate, useLocation } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout.tsx';
import { LandingPage } from '../pages/LandingPage.tsx';
import { useAuth } from './authContext.ts';

/**
 * Layout element for the consumer area (M006.1). It replaces the old
 * "must be authenticated" gate with "authenticated OR anonymous trial":
 *
 *  - signed in, or an anonymous trial in progress → render the {@link AppLayout}
 *    shell (its {@code <Outlet/>} shows the matched child route);
 *  - nobody yet, at {@code /} → the public {@link LandingPage} (no shell);
 *  - nobody yet, deeper in → bounce to {@code /} so the first thing a visitor
 *    sees is the value proposition, never a login wall.
 *
 * {@code /admin/**} keeps its own stricter guards (RequireAuth + RequireAdmin).
 */
export function RootRoute() {
  const { status, anonSession } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center" role="status" aria-label="Carregando">
        <span className="text-sm text-slate-500">Carregando…</span>
      </div>
    );
  }

  if (status === 'authenticated' || anonSession) {
    return <AppLayout />;
  }

  return location.pathname === '/' ? <LandingPage /> : <Navigate to="/" replace />;
}
