import type { MonthlySpending } from '../api/types.ts';
import { formatBRL, formatMonth } from '../lib/format.ts';

/**
 * Monthly-spending bars — pure CSS, readable with one or many months. Not a
 * charting library (analytics infra stays out of scope).
 */
export function SpendingBars({ months }: { months: MonthlySpending[] }) {
  const values = months.map((m) => Number(m.total) || 0);
  const max = Math.max(1, ...values);

  return (
    <div className="flex items-end gap-3 overflow-x-auto pb-1" role="img" aria-label="Gastos por mês">
      {months.map((m) => {
        const value = Number(m.total) || 0;
        const heightPct = Math.max(5, Math.round((value / max) * 100));
        return (
          <div key={m.month} className="flex min-w-14 flex-1 flex-col items-center gap-1">
            <span className="text-[11px] font-semibold text-muted tabular-nums">{formatBRL(value)}</span>
            <div className="flex h-28 w-full items-end">
              <div
                className="w-full rounded-t-md bg-accent/85 transition-[height]"
                style={{ height: `${heightPct}%` }}
              />
            </div>
            <span className="text-[11px] text-muted">{formatMonth(m.month)}</span>
          </div>
        );
      })}
    </div>
  );
}
