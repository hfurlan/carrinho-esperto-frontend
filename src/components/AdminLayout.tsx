import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/authContext.ts';

const NAV = [
  { to: '/admin', label: 'Visão geral', end: true },
  { to: '/admin/notas-fiscais', label: 'Notas fiscais', end: false },
  { to: '/admin/itens', label: 'Itens fiscais', end: false },
  { to: '/admin/resolucoes', label: 'Resoluções', end: false },
  { to: '/admin/vocabulario', label: 'Vocabulário', end: false },
  { to: '/admin/catalogo', label: 'Catálogo', end: false },
];

function navClass({ isActive }: { isActive: boolean }): string {
  return [
    'whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
    isActive ? 'bg-slate-900 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white',
  ].join(' ');
}

/**
 * Admin shell — deliberately a different, denser, darker chrome so it never
 * gets mistaken for the consumer app. Route access is also checked in
 * {@code RequireAdmin}; the backend enforces every {@code /api/admin} call.
 */
export function AdminLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-slate-950 text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="rounded bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-950">
              Admin
            </span>
            <span className="text-sm font-semibold">Carrinho Esperto</span>
          </div>
          <nav className="flex flex-1 flex-wrap gap-1">
            {NAV.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={navClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <NavLink to="/" className="hover:text-white">
              ← App
            </NavLink>
            <span className="hidden max-w-[12rem] truncate sm:inline">{user?.username ?? user?.subject}</span>
            <button type="button" onClick={logout} className="rounded border border-slate-700 px-2 py-1 hover:bg-slate-800">
              Sair
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
