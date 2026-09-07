import { getBasketInsight } from '../api/insight.ts';
import type { BasketInsightResponse, BasketSeal } from '../api/types.ts';
import { useAsync } from '../lib/useAsync.ts';
import { formatBRL } from '../lib/format.ts';
import { Badge, Card } from './ui.tsx';

const SEAL_TONE: Record<BasketSeal, 'emerald' | 'amber' | 'red' | 'slate'> = {
  EQUILIBRADO: 'emerald',
  ATENCAO: 'amber',
  MUITOS_SUPERFLUOS: 'red',
  SEM_DADOS: 'slate',
};

/** Bar/segment colour per category. Kept muted so the seal stays the focal point. */
const CATEGORY_COLOR: Record<string, string> = {
  BASICO_IN_NATURA: 'bg-emerald-500',
  ALIMENTO_PROCESSADO: 'bg-teal-400',
  BEBIDA_BAIXO_VALOR: 'bg-amber-400',
  DOCE_SUPERFLUO: 'bg-rose-400',
  LIMPEZA: 'bg-sky-400',
  HIGIENE: 'bg-violet-400',
  NAO_CLASSIFICADO: 'bg-slate-300',
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
        <p className="text-sm text-slate-400">Analisando a compra…</p>
      </Card>
    );
  }
  if (!data) return null; // insight is a bonus panel — never block the receipt on it

  const { seal, sealLabel, categories, messages } = data;
  const visible = categories.filter((c) => pct(c.valueShare) > 0);

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-800">Como foi esta compra</h2>
        <Badge tone={SEAL_TONE[seal]}>{sealLabel}</Badge>
      </div>

      {messages.length > 0 && (
        <div className="mt-2 space-y-1">
          {messages.map((m) => (
            <p key={m} className="text-sm text-slate-600">
              {m}
            </p>
          ))}
        </div>
      )}

      {visible.length > 0 && (
        <>
          <div
            className="mt-4 flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100"
            role="img"
            aria-label="Distribuição do valor da nota por categoria"
          >
            {visible.map((c) => (
              <div
                key={c.category}
                className={CATEGORY_COLOR[c.category] ?? 'bg-slate-300'}
                style={{ width: `${pct(c.valueShare)}%` }}
              />
            ))}
          </div>

          <ul className="mt-4 divide-y divide-slate-100">
            {visible.map((c) => (
              <li key={c.category} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${CATEGORY_COLOR[c.category] ?? 'bg-slate-300'}`}
                    aria-hidden
                  />
                  <span className="truncate text-slate-700">{c.label}</span>
                  <span className="shrink-0 text-xs text-slate-400">
                    {c.itemCount} {c.itemCount === 1 ? 'item' : 'itens'}
                  </span>
                </span>
                <span className="shrink-0 text-slate-600">
                  {formatBRL(c.totalValue)} · <span className="font-semibold text-slate-900">{pct(c.valueShare)}%</span>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="mt-3 text-xs text-slate-400">
        Classificação automática pela descrição da nota — pode não acertar todos os itens.
      </p>
    </Card>
  );
}
