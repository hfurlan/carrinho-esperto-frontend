import type { ReactNode } from 'react';
import { ApiError } from '../api/client.ts';
import { Button } from './ui.tsx';

/** Data is on its way. */
export function LoadingState({ label = 'Carregando…' }: { label?: string }) {
  return (
    <div
      className="flex items-center justify-center gap-2 py-16 text-sm text-muted"
      role="status"
      aria-live="polite"
    >
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" aria-hidden />
      {label}
    </div>
  );
}

/** Something failed and can be retried. Never shows a raw API/stack string. */
export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const message =
    error instanceof ApiError ? error.message : 'Não deu para carregar agora. Tente de novo em instantes.';
  return (
    <div className="mx-auto max-w-md py-14 text-center">
      <p className="font-display text-lg font-bold text-ink">Deu um problema aqui</p>
      <p className="mt-1 text-sm text-muted">{message}</p>
      {onRetry && (
        <Button variant="secondary" className="mt-4" onClick={onRetry}>
          Tentar de novo
        </Button>
      )}
    </div>
  );
}

/** Nothing here yet — point at the next step. */
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
    <div className="mx-auto max-w-md py-14 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-accent-soft text-2xl" aria-hidden>
        {icon}
      </div>
      <h2 className="mt-4 font-display text-lg font-bold text-ink text-balance">{title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted">{description}</p>
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}
