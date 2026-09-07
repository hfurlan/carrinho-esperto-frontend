import type { ReactNode } from 'react';
import { ApiError } from '../api/client.ts';
import { Button, Card } from './ui.tsx';

/** Data is being retrieved. */
export function LoadingState({ label = 'Carregando…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-16 text-sm text-slate-500" role="status" aria-live="polite">
      <span className="mr-2 h-2 w-2 animate-pulse rounded-full bg-emerald-500" aria-hidden />
      {label}
    </div>
  );
}

/** Something went wrong and the user can retry. Never renders a raw API/stack string. */
export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const message =
    error instanceof ApiError
      ? error.message
      : 'Não foi possível carregar estas informações. Tente novamente em instantes.';
  return (
    <Card className="mx-auto max-w-md p-6 text-center">
      <p className="text-sm font-medium text-slate-800">Algo deu errado</p>
      <p className="mt-1 text-sm text-slate-500">{message}</p>
      {onRetry && (
        <Button variant="secondary" className="mt-4" onClick={onRetry}>
          Tentar novamente
        </Button>
      )}
    </Card>
  );
}

/** Nothing here yet — explain the next step. */
export function EmptyState({
  title,
  description,
  action,
  icon = '🧾',
}: {
  title: string;
  description: ReactNode;
  action?: ReactNode;
  icon?: string;
}) {
  return (
    <Card className="mx-auto max-w-lg px-6 py-12 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-2xl" aria-hidden>
        {icon}
      </div>
      <h2 className="mt-4 text-lg font-semibold text-slate-900">{title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">{description}</p>
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </Card>
  );
}
