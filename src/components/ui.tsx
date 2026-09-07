import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';

/*
 * Consumer design system — "cupom & caderno" (M006.2). Warm paper, ink numbers,
 * one grocery-green accent, hairlines instead of a box around everything. The
 * admin app does not use these.
 */

function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

const BUTTON_VARIANT: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-white hover:bg-accent-strong',
  secondary: 'border border-line bg-card text-ink hover:bg-paper',
  ghost: 'text-accent hover:bg-accent-soft',
  danger: 'border border-rose/40 bg-card text-rose hover:bg-rose-soft',
};

export function Button({
  variant = 'primary',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[15px] font-semibold',
        'transition-colors disabled:cursor-not-allowed disabled:opacity-45',
        BUTTON_VARIANT[variant],
        className,
      )}
      {...props}
    />
  );
}

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cx(
        'w-full rounded-lg border border-line bg-card px-3 py-3 text-[15px] text-ink',
        'placeholder:text-muted/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25',
        'disabled:bg-paper disabled:text-muted',
        className,
      )}
      {...props}
    />
  );
}

/** Label + control + hint/error, the standard vertical form unit. */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-[13px] font-medium text-ink">
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-xs text-rose">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

/** A quiet panel. Not every group needs one — prefer hairline rows. */
export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx('rounded-xl border border-line bg-card', className)}>{children}</div>;
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink text-balance">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}

/** A big ink figure with a plain-language label — the "what did I spend" moment. */
export function Figure({
  label,
  value,
  foot,
}: {
  label: ReactNode;
  value: ReactNode;
  foot?: ReactNode;
}) {
  return (
    <div>
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-0.5 font-display text-[2.75rem] font-extrabold leading-none tracking-tight text-ink tabular-nums">
        {value}
      </p>
      {foot && <p className="mt-2 text-xs text-muted">{foot}</p>}
    </div>
  );
}

type SealTone = 'good' | 'watch' | 'bad' | 'none';

const SEAL_TONE: Record<SealTone, string> = {
  good: 'border-accent/55 text-accent',
  watch: 'border-warn/55 text-warn',
  bad: 'border-rose/55 text-rose',
  none: 'border-line text-muted',
};

/** The basket "selo" — a little stamp, the memorable mark on the receipt. */
export function Seal({ tone = 'none', children }: { tone?: SealTone; children: ReactNode }) {
  return (
    <span
      className={cx(
        'inline-flex -rotate-1 items-center rounded-md border-2 px-2.5 py-1',
        'font-display text-xs font-bold uppercase tracking-wide',
        SEAL_TONE[tone],
      )}
    >
      {children}
    </span>
  );
}

type BadgeTone = 'emerald' | 'slate' | 'amber' | 'blue' | 'red';

const BADGE_TONE: Record<BadgeTone, string> = {
  emerald: 'bg-accent-soft text-accent',
  slate: 'bg-line/60 text-muted',
  amber: 'bg-warn-soft text-warn',
  blue: 'bg-accent-soft text-accent-strong',
  red: 'bg-rose-soft text-rose',
};

export function Badge({ tone = 'slate', children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold',
        BADGE_TONE[tone],
      )}
    >
      {children}
    </span>
  );
}
