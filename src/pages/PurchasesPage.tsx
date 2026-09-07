import { Link } from 'react-router-dom';
import { listFiscalDocuments } from '../api/fiscalDocuments.ts';
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews.tsx';
import { Button, Card, PageHeader } from '../components/ui.tsx';
import { formatBRL, formatDate } from '../lib/format.ts';
import { useAsync } from '../lib/useAsync.ts';

export function PurchasesPage() {
  const { data, error, loading, reload } = useAsync((signal) => listFiscalDocuments(signal), []);

  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState error={error} onRetry={reload} />;

  if (data.length === 0) {
    return (
      <>
        <PageHeader title="Compras" />
        <EmptyState
          title="Nenhuma compra ainda"
          description="Assim que você importar uma nota fiscal, ela aparece aqui."
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
      <PageHeader
        title="Compras"
        subtitle={`${data.length} ${data.length === 1 ? 'nota importada' : 'notas importadas'}`}
        action={
          <Link to="/importar">
            <Button>Importar nota</Button>
          </Link>
        }
      />

      <Card className="divide-y divide-slate-100">
        {data.map((doc) => (
          <Link
            key={doc.id}
            to={`/compras/${doc.id}`}
            className="flex items-center justify-between gap-4 px-4 py-3.5 hover:bg-slate-50"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">
                {doc.issuerTradeName ?? doc.issuerCnpj}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {formatDate(doc.issuedAt)} · {doc.itemCount} {doc.itemCount === 1 ? 'item' : 'itens'}
              </p>
            </div>
            <span className="shrink-0 text-sm font-bold text-slate-900">{formatBRL(doc.totalAmount)}</span>
          </Link>
        ))}
      </Card>
    </>
  );
}
