import type { ReactNode } from 'react';

/** Shared bits for the admin (denser, table-first) screens. */

export function AdminPageHeader({ title, hint }: { title: string; hint?: ReactNode }) {
  return (
    <div className="mb-4">
      <h1 className="text-xl font-bold text-slate-900">{title}</h1>
      {hint && <p className="mt-0.5 text-sm text-slate-500">{hint}</p>}
    </div>
  );
}

export function AdminTable({ head, children }: { head: ReactNode; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>{head}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  );
}

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return <th className={`px-3 py-2 ${className ?? ''}`}>{children}</th>;
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={`px-3 py-2 align-top text-slate-700 ${className ?? ''}`}>{children}</td>;
}

/** Short id for dense tables: first 8 chars, monospace. */
export function shortId(id: string | null | undefined): string {
  return id ? id.slice(0, 8) : '—';
}
