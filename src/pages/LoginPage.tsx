import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/authContext.ts';
import { isCognitoConfigured } from '../auth/config.ts';
import { CognitoError } from '../auth/cognito.ts';
import { AuthShell } from '../components/AuthShell.tsx';
import { Button, Field, TextInput } from '../components/ui.tsx';

interface LocationState {
  from?: string;
}

export function LoginPage() {
  const { status, login } = useAuth();
  const location = useLocation();
  const from = (location.state as LocationState | null)?.from ?? '/';

  const [email, setEmail] = useState('');
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
      await login(email.trim(), password);
    } catch (err) {
      setError(
        err instanceof CognitoError
          ? err.message
          : 'Não deu para entrar agora. Confira o e-mail e a senha e tente de novo.',
      );
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Entre para continuar acompanhando suas compras."
      lede="Suas notas e o resumo mês a mês ficam guardados na sua conta."
      foot={
        <>
          Ainda não tenho uma conta.{' '}
          <Link to="/cadastro" className="font-semibold text-accent hover:underline">
            Criar minha conta
          </Link>
        </>
      }
    >
      {status === 'expired' && (
        <p className="mb-4 rounded-lg border border-warn/40 bg-warn-soft px-3 py-2 text-sm text-warn">
          Sua sessão expirou. Entre de novo para continuar.
        </p>
      )}
      {!configured && (
        <p className="mb-4 rounded-lg border border-rose/40 bg-rose-soft px-3 py-2 text-sm text-rose">
          Defina <code>VITE_COGNITO_CLIENT_ID</code> no <code>.env</code> do frontend.
        </p>
      )}

      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <Field label="E-mail" htmlFor="email">
          <TextInput
            id="email"
            type="email"
            inputMode="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Field>
        <Field label="Senha" htmlFor="password" error={error}>
          <TextInput
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>

        <Button type="submit" disabled={!configured || !email || !password || submitting} className="w-full">
          {submitting ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>
    </AuthShell>
  );
}
