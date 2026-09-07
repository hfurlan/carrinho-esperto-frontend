import type { MonthlySpending } from '../api/types.ts';
import { formatBRL, formatMonth } from '../lib/format.ts';

/**
 * A minimal monthly-spending bar chart — pure CSS, responsive, and readable
 * with one or many months. Not a charting library (M006 keeps analytics
 * infrastructure out of scope).
 */
export function SpendingBars({ months }: { months: MonthlySpending[] }) {
  const values = months.map((m) => Number(m.total) || 0);
  const max = Math.max(1, ...values);

  return (
    <div className="flex items-end gap-3 overflow-x-auto pb-2" role="img" aria-label="Gastos por mês">
      {months.map((m) => {
        const value = Number(m.total) || 0;
        const heightPct = Math.max(4, Math.round((value / max) * 100));
        return (
          <div key={m.month} className="flex min-w-14 flex-1 flex-col items-center gap-1">
            <span className="text-[11px] font-medium text-slate-600">{formatBRL(value)}</span>
            <div className="flex h-32 w-full items-end">
              <div
                className="w-full rounded-t-md bg-emerald-500/90 transition-[height]"
                style={{ height: `${heightPct}%` }}
              />
            </div>
            <span className="text-[11px] text-slate-400">{formatMonth(m.month)}</span>
          </div>
        );
      })}
    </div>
  );
}
