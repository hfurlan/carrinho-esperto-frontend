import { Link } from 'react-router-dom';
import { getDashboardSpending, getDashboardSummary } from '../api/dashboard.ts';
import { listFiscalDocuments } from '../api/fiscalDocuments.ts';
import type { DashboardSpending, DashboardSummary, FiscalDocumentSummaryResponse } from '../api/types.ts';
import { BasketInsight } from '../components/BasketInsight.tsx';
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews.tsx';
import { SpendingBars } from '../components/SpendingBars.tsx';
import { Button, Card, Figure } from '../components/ui.tsx';
import { formatBRL, formatDate, formatInteger } from '../lib/format.ts';
import { useAsync } from '../lib/useAsync.ts';

interface DashboardData {
  summary: DashboardSummary;
  spending: DashboardSpending;
  recent: FiscalDocumentSummaryResponse[];
}

function monthName(iso: string): string {
  const [y, m] = iso.split('-').map(Number);
  if (!y || !m) return iso;
  return new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date(y, m - 1, 1));
}

export function DashboardPage() {
  const { data, error, loading, reload } = useAsync<DashboardData>(
    async (signal) => {
      const [summary, spending, recent] = await Promise.all([
        getDashboardSummary(signal),
        getDashboardSpending(signal),
        listFiscalDocuments(signal),
      ]);
      return { summary, spending, recent };
    },
    [],
  );

  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState error={error} onRetry={reload} />;

  const { summary, spending, recent } = data;

  if (summary.receiptCount === 0) {
    return (
      <EmptyState
        icon="🛒"
        title="Sua primeira compra começa aqui"
        description="Importe uma nota fiscal (NFC-e) e o Carrinho Esperto organiza os itens, os gastos e o que tem na sua compra."
        action={
          <Link to="/importar">
            <Button>Importar minha primeira nota</Button>
          </Link>
        }
      />
    );
  }

  const latestMonth = spending.byMonth.at(-1);
  const heroLabel = latestMonth ? `Você gastou em ${monthName(latestMonth.month)}` : 'Total no Carrinho Esperto';
  const heroValue = formatBRL(latestMonth ? latestMonth.total : summary.totalSpent);

  return (
    <div className="space-y-8">
      <section className="flex items-start justify-between gap-4">
        <Figure
          label={heroLabel}
          value={heroValue}
          foot={`${formatInteger(summary.receiptCount)} ${summary.receiptCount === 1 ? 'nota' : 'notas'} · ${formatInteger(summary.itemCount)} itens no total`}
        />
        <Link to="/importar" className="shrink-0">
          <Button variant="secondary">Importar nota</Button>
        </Link>
      </section>

      {spending.byMonth.length > 1 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-ink">Gastos por mês</h2>
          <SpendingBars months={spending.byMonth} />
        </section>
      )}

      {recent.length > 0 && <BasketInsight documentId={recent[0].id} />}

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">Compras recentes</h2>
          <Link to="/compras" className="text-xs font-semibold text-accent hover:underline">
            Ver todas
          </Link>
        </div>
        <ul className="border-t border-line">
          {recent.slice(0, 5).map((doc) => (
            <li key={doc.id}>
              <Link
                to={`/compras/${doc.id}`}
                className="flex items-center justify-between gap-3 border-b border-line py-3 hover:text-accent"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-ink">
                    {doc.issuerTradeName ?? doc.issuerCnpj}
                  </span>
                  <span className="text-xs text-muted">
                    {formatDate(doc.issuedAt)} · {doc.itemCount} {doc.itemCount === 1 ? 'item' : 'itens'}
                  </span>
                </span>
                <span className="shrink-0 font-display text-[15px] font-bold text-ink tabular-nums">
                  {formatBRL(doc.totalAmount)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {spending.byIssuer.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-ink">Onde você mais gastou</h2>
          <ul className="border-t border-line">
            {spending.byIssuer.slice(0, 5).map((issuer) => (
              <li
                key={issuer.issuerCnpj}
                className="flex items-center justify-between gap-3 border-b border-line py-2.5 text-sm"
              >
                <span className="truncate pr-3 text-ink">{issuer.issuerName}</span>
                <span className="shrink-0 font-display font-bold text-ink tabular-nums">
                  {formatBRL(issuer.total)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Card className="p-5">
        <p className="text-sm text-muted">
          Cada nota importada entra no seu histórico e no resumo por mês. A próxima é só apontar a câmera.
        </p>
        <Link to="/importar" className="mt-3 inline-block">
          <Button>Importar outra nota</Button>
        </Link>
      </Card>
    </div>
  );
}
