import { useAuth } from '../auth/authContext.ts';

/**
 * Placeholder landing page for an authenticated user. Replace with the app's
 * real home screen; this only proves the auth + API wiring end to end.
 */
export function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Carrinho Esperto</h1>
        <button
          type="button"
          onClick={logout}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Sair
        </button>
      </div>

      <div className="mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">
          Autenticado como <strong>{user?.username ?? user?.subject}</strong>.
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Este é o ponto de partida do frontend. Substitua esta página pelo
          conteúdo real da aplicação.
        </p>
      </div>
    </div>
  );
}
