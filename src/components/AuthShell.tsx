import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

/**
 * Chrome shared by /login and /cadastro — the consumer identity, mobile‑first,
 * no admin navigation anywhere near it.
 */
export function AuthShell({
  title,
  lede,
  children,
  foot,
}: {
  title: string;
  lede: ReactNode;
  children: ReactNode;
  foot: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-paper px-5 pb-10 pt-12 sm:items-center sm:justify-center">
      <div className="mx-auto w-full max-w-sm">
        <Link to="/" className="inline-flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-base text-white">
            🛒
          </span>
          <span className="font-display text-sm font-extrabold tracking-tight text-ink">Carrinho Esperto</span>
        </Link>

        <h1 className="mt-7 font-display text-2xl font-extrabold leading-tight tracking-tight text-ink text-balance">
          {title}
        </h1>
        <p className="mt-2 text-sm text-muted">{lede}</p>

        <div className="mt-6">{children}</div>

        <p className="mt-6 text-sm text-muted">{foot}</p>
      </div>
    </div>
  );
}
