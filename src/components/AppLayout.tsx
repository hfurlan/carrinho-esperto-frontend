import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/authContext.ts';

const NAV = [
  { to: '/', label: 'Início', icon: '🏠', end: true },
  { to: '/compras', label: 'Compras', icon: '🧾', end: false },
  { to: '/importar', label: 'Importar', icon: '＋', end: false },
];

function navClass({ isActive }: { isActive: boolean }): string {
  return [
    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    isActive ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800',
  ].join(' ');
}

function tabClass({ isActive }: { isActive: boolean }): string {
  return [
    'flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium',
    isActive ? 'text-emerald-700' : 'text-slate-400',
  ].join(' ');
}

/** Authenticated consumer shell: header + primary nav + responsive content. */
export function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-stone-50 pb-16 sm:pb-0">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <NavLink to="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-base text-white">
              🛒
            </span>
            <span className="text-sm font-bold tracking-tight text-slate-900">Carrinho Esperto</span>
          </NavLink>

          <div className="flex items-center gap-3">
            {user?.isAdmin && (
              <NavLink
                to="/admin"
                className="hidden rounded-md border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 sm:inline-block"
              >
                Admin
              </NavLink>
            )}
            <span className="hidden max-w-[12rem] truncate text-xs text-slate-500 sm:inline">
              {user?.username ?? user?.subject}
            </span>
            <button
              type="button"
              onClick={logout}
              className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Sair
            </button>
          </div>
        </div>

        <nav className="mx-auto hidden max-w-5xl gap-1 px-3 pb-2 sm:flex">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={navClass}>
              <span aria-hidden>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-slate-200 bg-white sm:hidden">
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
