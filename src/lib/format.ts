/**
 * Brazilian formatting helpers. The product UI is pt-BR: currency in R$,
 * numbers and dates in Brazilian conventions. (Code, API and docs stay English.)
 */

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const DATE = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
const DATE_TIME = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});
const MONTH_LABEL = new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric' });

type Numeric = number | string | null | undefined;

function toNumber(value: Numeric): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

/** `1234.5` → `R$ 1.234,50`; nullish → `—`. */
export function formatBRL(value: Numeric): string {
  const n = toNumber(value);
  return n === null ? '—' : BRL.format(n);
}

/** A quantity with up to `maxFractionDigits` decimals, pt-BR grouping. */
export function formatQuantity(value: Numeric, maxFractionDigits = 4): string {
  const n = toNumber(value);
  if (n === null) return '—';
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: maxFractionDigits }).format(n);
}

export function formatInteger(value: Numeric): string {
  const n = toNumber(value);
  return n === null ? '—' : new Intl.NumberFormat('pt-BR').format(Math.round(n));
}

/** ISO instant → `dd/mm/aaaa`. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : DATE.format(d);
}

/** ISO instant → `dd/mm/aaaa hh:mm`. */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : DATE_TIME.format(d);
}

/** `"2026-09"` → `set. de 2026`. */
export function formatMonth(month: string): string {
  const [y, m] = month.split('-').map(Number);
  if (!y || !m) return month;
  return MONTH_LABEL.format(new Date(y, m - 1, 1));
}

/** 14-digit CNPJ → `00.000.000/0000-00`. */
export function formatCnpj(digits: string | null | undefined): string {
  if (!digits) return '—';
  const d = digits.replace(/\D/g, '');
  if (d.length !== 14) return digits;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

/** 44-digit NFC-e access key in 4-digit groups. */
export function formatAccessKey(key: string | null | undefined): string {
  if (!key) return '—';
  return key.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
}
