import { Link } from 'react-router-dom';
import { listAdminFiscalDocuments } from '../../api/admin.ts';
import { AdminPageHeader, AdminTable, shortId, Td, Th } from '../../components/admin.tsx';
import { ErrorState, LoadingState } from '../../components/StateViews.tsx';
import { formatBRL, formatDateTime } from '../../lib/format.ts';
import { useAsync } from '../../lib/useAsync.ts';

export function AdminFiscalDocumentsPage() {
  const { data, error, loading, reload } = useAsync((signal) => listAdminFiscalDocuments(signal), []);

  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState error={error} onRetry={reload} />;

  return (
    <>
      <AdminPageHeader title="Notas fiscais" hint={`${data.length} documento(s) — 200 mais recentes.`} />
      <AdminTable
        head={
          <>
            <Th>Emissão</Th>
            <Th>Estabelecimento</Th>
            <Th>CNPJ</Th>
            <Th className="text-right">Total</Th>
            <Th className="text-right">Itens</Th>
            <Th>Dono</Th>
            <Th />
          </>
        }
      >
        {data.map((doc) => (
          <tr key={doc.id} className="hover:bg-slate-50">
            <Td className="whitespace-nowrap">{formatDateTime(doc.issuedAt)}</Td>
            <Td className="max-w-xs truncate">{doc.issuerName}</Td>
            <Td className="font-mono text-xs">{doc.issuerCnpj}</Td>
            <Td className="text-right font-medium text-slate-900">{formatBRL(doc.totalAmount)}</Td>
            <Td className="text-right">{doc.itemCount}</Td>
            <Td className="font-mono text-xs">{shortId(doc.ownerUserId)}</Td>
            <Td>
              <Link to={`/admin/notas-fiscais/${doc.id}`} className="text-emerald-700 hover:underline">
                abrir
              </Link>
            </Td>
          </tr>
        ))}
      </AdminTable>
    </>
  );
}
