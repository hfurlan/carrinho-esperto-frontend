import { getBasketInsight } from '../api/insight.ts';
import type { BasketInsightResponse, BasketSeal } from '../api/types.ts';
import { useAsync } from '../lib/useAsync.ts';
import { formatBRL } from '../lib/format.ts';
import { Card, Seal } from './ui.tsx';

const SEAL_TONE: Record<BasketSeal, 'good' | 'watch' | 'bad' | 'none'> = {
  EQUILIBRADO: 'good',
  ATENCAO: 'watch',
  MUITOS_SUPERFLUOS: 'bad',
  SEM_DADOS: 'none',
};

/** One muted hue per category. The seal carries the meaning; these just group. */
const CATEGORY_COLOR: Record<string, string> = {
  BASICO_IN_NATURA: 'var(--color-accent)',
  ALIMENTO_PROCESSADO: '#7fb98f',
  BEBIDA_BAIXO_VALOR: 'var(--color-warn)',
  DOCE_SUPERFLUO: 'var(--color-rose)',
  LIMPEZA: '#6a9cbf',
  HIGIENE: '#9585c0',
  NAO_CLASSIFICADO: 'var(--color-line)',
};

function pct(share: string): number {
  return Math.round((Number(share) || 0) * 100);
}

export function BasketInsight({ documentId }: { documentId: string }) {
  const { data, loading } = useAsync<BasketInsightResponse>(
    (signal) => getBasketInsight(documentId, signal),
    [documentId],
  );

  if (loading) {
    return (
      <Card className="p-5">
        <p className="text-sm text-muted">Olhando a sua compra…</p>
      </Card>
    );
  }
  if (!data) return null; // a bonus panel — never block the receipt on it

  const { seal, sealLabel, categories, messages } = data;
  const visible = categories.filter((c) => pct(c.valueShare) > 0);

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h2 className="font-display text-base font-extrabold tracking-tight text-ink">
          O que tem na sua compra?
        </h2>
        <Seal tone={SEAL_TONE[seal]}>{sealLabel}</Seal>
      </div>

      {messages.length > 0 && (
        <div className="mt-2 space-y-1">
          {messages.map((m) => (
            <p key={m} className="text-sm text-muted">
              {m}
            </p>
          ))}
        </div>
      )}

      {visible.length > 0 && (
        <>
          <div
            className="mt-4 flex h-2.5 w-full overflow-hidden rounded-full bg-line"
            role="img"
            aria-label="Como o valor da nota se divide por categoria"
          >
            {visible.map((c) => (
              <div
                key={c.category}
                style={{ width: `${pct(c.valueShare)}%`, background: CATEGORY_COLOR[c.category] ?? 'var(--color-line)' }}
              />
            ))}
          </div>

          <ul className="mt-3 border-t border-line">
            {visible.map((c) => (
              <li key={c.category} className="flex items-center justify-between gap-3 border-b border-line py-2.5 text-sm">
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded"
                    style={{ background: CATEGORY_COLOR[c.category] ?? 'var(--color-line)' }}
                    aria-hidden
                  />
                  <span className="truncate text-ink">{c.label}</span>
                </span>
                <span className="shrink-0 text-muted tabular-nums">
                  {formatBRL(c.totalValue)}{' '}
                  <span className="font-display font-bold text-ink">{pct(c.valueShare)}%</span>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="mt-3 text-xs text-muted">
        Agrupamos pela descrição da nota — pode não acertar todos os itens.
      </p>
    </Card>
  );
}
