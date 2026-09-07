import { listAdminResolutions } from '../../api/admin.ts';
import { AdminPageHeader, AdminTable, Td, Th } from '../../components/admin.tsx';
import { ResolutionBadge } from '../../components/ResolutionBadge.tsx';
import { ErrorState, LoadingState } from '../../components/StateViews.tsx';
import { formatDateTime } from '../../lib/format.ts';
import { useAsync } from '../../lib/useAsync.ts';

export function AdminResolutionsPage() {
  const { data, error, loading, reload } = useAsync((signal) => listAdminResolutions(signal), []);

  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState error={error} onRetry={reload} />;

  return (
    <>
      <AdminPageHeader title="Resoluções" hint={`${data.length} resolução(ões) — 200 mais recentes.`} />
      <AdminTable
        head={
          <>
            <Th>Descrição fiscal</Th>
            <Th>Status</Th>
            <Th>Método</Th>
            <Th>Produto canônico</Th>
            <Th className="text-right">Evidências</Th>
            <Th>Atualizada</Th>
          </>
        }
      >
        {data.map((row) => (
          <tr key={row.id} className="hover:bg-slate-50">
            <Td className="max-w-xs font-medium text-slate-900">{row.fiscalRawDescription}</Td>
            <Td>
              <ResolutionBadge status={row.status} />
            </Td>
            <Td className="font-mono text-xs">{row.method ?? '—'}</Td>
            <Td>{row.canonicalProductName ?? '—'}</Td>
            <Td className="text-right">{row.evidenceCount}</Td>
            <Td className="whitespace-nowrap">{formatDateTime(row.updatedAt)}</Td>
          </tr>
        ))}
      </AdminTable>
    </>
  );
}
