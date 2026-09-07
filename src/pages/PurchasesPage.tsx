import { Link } from 'react-router-dom';
import { listFiscalDocuments } from '../api/fiscalDocuments.ts';
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews.tsx';
import { Button, PageHeader } from '../components/ui.tsx';
import { formatBRL, formatDate } from '../lib/format.ts';
import { useAsync } from '../lib/useAsync.ts';

export function PurchasesPage() {
  const { data, error, loading, reload } = useAsync((signal) => listFiscalDocuments(signal), []);

  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState error={error} onRetry={reload} />;

  if (data.length === 0) {
    return (
      <EmptyState
        title="Ainda não tem compras aqui"
        description="Assim que você importar uma nota fiscal, ela aparece nesta lista."
        action={
          <Link to="/importar">
            <Button>Importar nota fiscal</Button>
          </Link>
        }
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Minhas compras"
        subtitle={`${data.length} ${data.length === 1 ? 'nota importada' : 'notas importadas'}`}
        action={
          <Link to="/importar">
            <Button>Importar nota</Button>
          </Link>
        }
      />

      <ul className="border-t border-line">
        {data.map((doc) => (
          <li key={doc.id}>
            <Link
              to={`/compras/${doc.id}`}
              className="flex items-center justify-between gap-4 border-b border-line py-3.5 hover:text-accent"
            >
              <span className="min-w-0">
                <span className="block truncate text-[15px] font-semibold text-ink">
                  {doc.issuerTradeName ?? doc.issuerCnpj}
                </span>
                <span className="mt-0.5 block text-xs text-muted">
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
    </>
  );
}
