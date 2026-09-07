import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/authContext.ts';

const NAV = [
  { to: '/', label: 'Início', icon: '🏠', end: true },
  { to: '/compras', label: 'Compras', icon: '🧾', end: false },
  { to: '/importar', label: 'Importar', icon: '＋', end: false },
];

function topNavClass({ isActive }: { isActive: boolean }): string {
  return [
    'rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors',
    isActive ? 'bg-accent-soft text-accent' : 'text-muted hover:bg-line/50 hover:text-ink',
  ].join(' ');
}

function tabClass({ isActive }: { isActive: boolean }): string {
  return [
    'flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-semibold transition-colors',
    isActive ? 'text-accent' : 'text-muted',
  ].join(' ');
}

/** Consumer shell — warm chrome, simple nav. Serves both an authenticated user
 *  and an anonymous trial session (M006.1). */
export function AppLayout() {
  const { user, logout, anonSession } = useAuth();
  const isTrial = !user && !!anonSession;

  return (
    <div className="min-h-screen bg-paper pb-[calc(4rem+env(safe-area-inset-bottom))] sm:pb-0">
      <header className="sticky top-0 z-10 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <NavLink to="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-base text-white">
              🛒
            </span>
            <span className="font-display text-sm font-extrabold tracking-tight text-ink">Carrinho Esperto</span>
          </NavLink>

          {isTrial ? (
            <Link
              to="/cadastro"
              className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-strong"
            >
              Criar conta
            </Link>
          ) : (
            <div className="flex items-center gap-3">
              {user?.isAdmin && (
                <NavLink
                  to="/admin"
                  className="hidden rounded-lg border border-line px-2.5 py-1 text-xs font-semibold text-muted hover:bg-line/40 sm:inline-block"
                >
                  Admin
                </NavLink>
              )}
              <span className="hidden max-w-[12rem] truncate text-xs text-muted sm:inline">
                {user?.username ?? user?.subject}
              </span>
              <button
                type="button"
                onClick={logout}
                className="rounded-lg border border-line px-2.5 py-1 text-xs font-semibold text-muted hover:bg-line/40"
              >
                Sair
              </button>
            </div>
          )}
        </div>

        <nav className="mx-auto hidden max-w-3xl gap-1 px-3 pb-2 sm:flex">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={topNavClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      {isTrial && (
        <div className="mx-auto max-w-3xl px-4 pt-3">
          <p className="rounded-lg bg-warn-soft px-3 py-2 text-xs text-warn">
            <span className="font-semibold">Modo teste.</span> Suas notas não ficam salvas neste aparelho —{' '}
            <Link to="/cadastro" className="font-semibold underline">
              crie sua conta
            </Link>{' '}
            para guardar.
          </p>
        </div>
      )}

      <main className="mx-auto max-w-3xl px-4 py-6">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-line bg-card pb-[env(safe-area-inset-bottom)] sm:hidden">
        {NAV.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={tabClass}>
            <span className="text-base" aria-hidden>
              {item.icon}
            </span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
