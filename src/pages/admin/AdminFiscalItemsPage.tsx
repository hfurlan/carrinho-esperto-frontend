import { Link } from 'react-router-dom';
import { listAdminFiscalItems } from '../../api/admin.ts';
import { AdminPageHeader, AdminTable, Td, Th } from '../../components/admin.tsx';
import { ResolutionBadge } from '../../components/ResolutionBadge.tsx';
import { ErrorState, LoadingState } from '../../components/StateViews.tsx';
import { formatBRL, formatQuantity } from '../../lib/format.ts';
import { useAsync } from '../../lib/useAsync.ts';

export function AdminFiscalItemsPage() {
  const { data, error, loading, reload } = useAsync((signal) => listAdminFiscalItems(signal), []);

  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState error={error} onRetry={reload} />;

  return (
    <>
      <AdminPageHeader title="Itens fiscais" hint={`${data.length} item(ns) — 200 mais recentes.`} />
      <AdminTable
        head={
          <>
            <Th>Descrição fiscal</Th>
            <Th>cProd</Th>
            <Th>GTIN</Th>
            <Th className="text-right">Qtd.</Th>
            <Th>Un.</Th>
            <Th className="text-right">Vl. unit.</Th>
            <Th className="text-right">Total</Th>
            <Th>Resolução</Th>
            <Th>Nota</Th>
          </>
        }
      >
        {data.map((item) => (
          <tr key={item.id} className="hover:bg-slate-50">
            <Td className="max-w-xs font-medium text-slate-900">{item.rawDescription}</Td>
            <Td className="font-mono text-xs">{item.supplierItemCode ?? '—'}</Td>
            <Td className="font-mono text-xs">{item.gtin ?? '—'}</Td>
            <Td className="text-right">{formatQuantity(item.quantity)}</Td>
            <Td>{item.unit}</Td>
            <Td className="text-right">{formatBRL(item.unitPrice)}</Td>
            <Td className="text-right font-medium text-slate-900">{formatBRL(item.totalPrice)}</Td>
            <Td>
              <ResolutionBadge status={item.resolutionStatus} />
            </Td>
            <Td>
              <Link
                to={`/admin/notas-fiscais/${item.fiscalDocumentId}`}
                className="text-emerald-700 hover:underline"
              >
                abrir
              </Link>
            </Td>
          </tr>
        ))}
      </AdminTable>
    </>
  );
}
