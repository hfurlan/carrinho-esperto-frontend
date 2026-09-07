import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/authContext.ts';
import { isCognitoConfigured } from '../auth/config.ts';
import { CognitoError } from '../auth/cognito.ts';

interface LocationState {
  from?: string;
}

export function LoginPage() {
  const { status, login } = useAuth();
  const location = useLocation();
  const from = (location.state as LocationState | null)?.from ?? '/';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (status === 'authenticated') {
    return <Navigate to={from} replace />;
  }

  const configured = isCognitoConfigured();

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(username.trim(), password);
    } catch (err) {
      setError(
        err instanceof CognitoError
          ? err.message
          : 'Não foi possível entrar. Verifique suas credenciais e tente novamente.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Entrar no Carrinho Esperto</h1>
        </div>

        {status === 'expired' && (
          <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Sua sessão expirou. Entre novamente para continuar.
          </p>
        )}

        {!configured && (
          <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
            Defina <code>VITE_COGNITO_CLIENT_ID</code> no arquivo <code>.env</code> do frontend.
          </p>
        )}

        <form className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm" onSubmit={onSubmit} noValidate>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-slate-700">
              E-mail ou usuário
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Senha
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500"
            />
          </div>

          {error && <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}

          <button
            type="submit"
            disabled={!configured || !username || !password || submitting}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
