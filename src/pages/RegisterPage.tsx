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

export function RegisterPage() {
  const { status, register, pendingConfirmation, confirmRegistration, resendConfirmationCode } = useAuth();
  const location = useLocation();
  const from = (location.state as LocationState | null)?.from ?? '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (status === 'authenticated') {
    return <Navigate to={from} replace />;
  }

  const configured = isCognitoConfigured();

  const onCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setNote(null);
    setSubmitting(true);
    try {
      await register(email.trim(), password);
    } catch (err) {
      setError(
        err instanceof CognitoError
          ? err.message
          : 'Não deu para criar a conta agora. Tente de novo em instantes.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const onConfirm = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setNote(null);
    setSubmitting(true);
    try {
      await confirmRegistration(code.trim());
    } catch (err) {
      setError(err instanceof CognitoError ? err.message : 'Não deu para confirmar. Tente de novo.');
    } finally {
      setSubmitting(false);
    }
  };

  const onResend = async () => {
    setError(null);
    try {
      await resendConfirmationCode();
      setNote('Enviamos um novo código para o seu e-mail.');
    } catch (err) {
      setError(err instanceof CognitoError ? err.message : 'Não deu para reenviar agora.');
    }
  };

  if (pendingConfirmation) {
    return (
      <AuthShell
        title="Confirme seu e-mail"
        lede={
          <>
            Enviamos um código para <strong className="text-ink">{pendingConfirmation.email}</strong>. Digite-o
            para terminar o cadastro.
          </>
        }
        foot={
          <button type="button" onClick={onResend} className="font-semibold text-accent hover:underline">
            Reenviar o código
          </button>
        }
      >
        {note && (
          <p className="mb-4 rounded-lg border border-accent/30 bg-accent-soft px-3 py-2 text-sm text-accent">
            {note}
          </p>
        )}
        <form className="space-y-4" onSubmit={onConfirm} noValidate>
          <Field label="Código de confirmação" htmlFor="code" error={error}>
            <TextInput
              id="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </Field>
          <Button type="submit" disabled={!code || submitting} className="w-full">
            {submitting ? 'Confirmando…' : 'Confirmar e entrar'}
          </Button>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Crie sua conta e comece a acompanhar suas compras."
      lede="É de graça. Serve para guardar suas notas e ver como você gasta ao longo do tempo."
      foot={
        <>
          Já tenho uma conta.{' '}
          <Link to="/login" className="font-semibold text-accent hover:underline">
            Entrar
          </Link>
        </>
      }
    >
      {!configured && (
        <p className="mb-4 rounded-lg border border-rose/40 bg-rose-soft px-3 py-2 text-sm text-rose">
          Defina <code>VITE_COGNITO_CLIENT_ID</code> no <code>.env</code> do frontend.
        </p>
      )}
      <form className="space-y-4" onSubmit={onCreate} noValidate>
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
        <Field
          label="Senha"
          htmlFor="password"
          hint="Pelo menos 8 caracteres, com letra e número."
          error={error}
        >
          <TextInput
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>
        <Button type="submit" disabled={!configured || !email || !password || submitting} className="w-full">
          {submitting ? 'Criando…' : 'Criar minha conta'}
        </Button>
      </form>
    </AuthShell>
  );
}
