import { Link } from 'react-router-dom';
import { getDashboardSpending, getDashboardSummary } from '../api/dashboard.ts';
import { listFiscalDocuments } from '../api/fiscalDocuments.ts';
import type { DashboardSpending, DashboardSummary, FiscalDocumentSummaryResponse } from '../api/types.ts';
import { useAuth } from '../auth/authContext.ts';
import { BasketInsight } from '../components/BasketInsight.tsx';
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews.tsx';
import { SpendingBars } from '../components/SpendingBars.tsx';
import { StatCard } from '../components/StatCard.tsx';
import { Button, Card, PageHeader } from '../components/ui.tsx';
import { formatBRL, formatDate, formatInteger } from '../lib/format.ts';
import { useAsync } from '../lib/useAsync.ts';

interface DashboardData {
  summary: DashboardSummary;
  spending: DashboardSpending;
  recent: FiscalDocumentSummaryResponse[];
}

/** Anonymous trial: make it explicit that these numbers are not being kept. */
function TrialDashboardNotice() {
  return (
    <Card className="mb-6 border-amber-200 bg-amber-50 p-4">
      <p className="text-sm text-amber-900">
        Estes números são da sua <strong>sessão de teste</strong> e não ficam salvos. Crie uma conta para
        montar seu histórico e ver relatórios ao longo do tempo.
      </p>
      <Link to="/login" className="mt-2 inline-block text-sm font-semibold text-emerald-700 hover:underline">
        Criar conta
      </Link>
    </Card>
  );
}

export function DashboardPage() {
  const { status, anonSession } = useAuth();
  const isTrial = status !== 'authenticated' && !!anonSession;
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
      <>
        {isTrial && <TrialDashboardNotice />}
        <PageHeader title="Início" />
        <EmptyState
          icon="🛒"
          title="Comece importando uma nota fiscal"
          description={
            <>
              O Carrinho Esperto organiza suas compras de supermercado a partir das notas fiscais eletrônicas
              (NFC-e). Importe a primeira nota para acompanhar seus gastos.
            </>
          }
          action={
            <Link to="/importar">
              <Button>Importar nota fiscal</Button>
            </Link>
          }
        />
      </>
    );
  }

  return (
    <>
      {isTrial && <TrialDashboardNotice />}
      <PageHeader
        title="Início"
        subtitle="Um resumo dos seus gastos de supermercado."
        action={
          <Link to="/importar">
            <Button>Importar nota</Button>
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total gasto" value={formatBRL(summary.totalSpent)} />
        <StatCard label="Notas" value={formatInteger(summary.receiptCount)} />
        <StatCard label="Itens" value={formatInteger(summary.itemCount)} />
        <StatCard
          label="Identificados"
          value={formatInteger(summary.resolvedItemCount)}
          hint={`${formatInteger(summary.unresolvedItemCount)} ainda não identificados`}
        />
      </div>

      {recent.length > 0 && (
        <div className="mt-6">
          <BasketInsight documentId={recent[0].id} />
        </div>
      )}

      {spending.byMonth.length > 0 && (
        <Card className="mt-6 p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-800">Gastos por mês</h2>
          <SpendingBars months={spending.byMonth} />
        </Card>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-3 text-sm font-semibold text-slate-800">Por supermercado</h2>
          {spending.byIssuer.length === 0 ? (
            <p className="text-sm text-slate-400">Sem dados ainda.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {spending.byIssuer.slice(0, 6).map((issuer) => (
                <li key={issuer.issuerCnpj} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="truncate pr-3 text-slate-700">{issuer.issuerName}</span>
                  <span className="shrink-0 font-semibold text-slate-900">{formatBRL(issuer.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">Compras recentes</h2>
            <Link to="/compras" className="text-xs font-medium text-emerald-700 hover:underline">
              Ver todas
            </Link>
          </div>
          <ul className="divide-y divide-slate-100">
            {recent.slice(0, 5).map((doc) => (
              <li key={doc.id}>
                <Link
                  to={`/compras/${doc.id}`}
                  className="flex items-center justify-between gap-3 py-2.5 text-sm hover:text-emerald-700"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-slate-800">
                      {doc.issuerTradeName ?? doc.issuerCnpj}
                    </span>
                    <span className="text-xs text-slate-400">
                      {formatDate(doc.issuedAt)} · {doc.itemCount} {doc.itemCount === 1 ? 'item' : 'itens'}
                    </span>
                  </span>
                  <span className="shrink-0 font-semibold text-slate-900">{formatBRL(doc.totalAmount)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
