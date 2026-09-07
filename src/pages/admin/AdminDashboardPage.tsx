import { getAdminDashboard } from '../../api/admin.ts';
import { AdminPageHeader } from '../../components/admin.tsx';
import { ErrorState, LoadingState } from '../../components/StateViews.tsx';
import { Card } from '../../components/ui.tsx';
import { formatInteger } from '../../lib/format.ts';
import { useAsync } from '../../lib/useAsync.ts';

export function AdminDashboardPage() {
  const { data, error, loading, reload } = useAsync((signal) => getAdminDashboard(signal), []);

  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState error={error} onRetry={reload} />;

  const cells: [string, number][] = [
    ['Notas fiscais', data.fiscalDocuments],
    ['Itens fiscais', data.fiscalItems],
    ['Itens identificados', data.resolvedItems],
    ['Itens não identificados', data.unresolvedItems],
    ['Produtos no catálogo', data.catalogProducts],
    ['Usuários', data.users],
  ];

  return (
    <>
      <AdminPageHeader title="Visão geral" hint="Contagens de todo o sistema." />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {cells.map(([label, value]) => (
          <Card key={label} className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{formatInteger(value)}</p>
          </Card>
        ))}
      </div>
    </>
  );
}
