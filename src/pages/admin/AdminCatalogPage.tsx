import { useState } from 'react';
import { listAdminCatalogProducts } from '../../api/admin.ts';
import { AdminPageHeader, AdminTable, Td, Th } from '../../components/admin.tsx';
import { ErrorState, LoadingState } from '../../components/StateViews.tsx';
import { TextInput } from '../../components/ui.tsx';
import { formatQuantity } from '../../lib/format.ts';
import { useAsync } from '../../lib/useAsync.ts';

export function AdminCatalogPage() {
  const [term, setTerm] = useState('');
  const [query, setQuery] = useState('');
  const { data, error, loading, reload } = useAsync(
    (signal) => listAdminCatalogProducts(query, signal),
    [query],
  );

  return (
    <>
      <AdminPageHeader title="Catálogo" hint="Produtos canônicos (dados compartilhados da plataforma)." />

      <form
        className="mb-4 flex max-w-md gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setQuery(term.trim());
        }}
      >
        <TextInput
          placeholder="Buscar por nome canônico…"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
        <button
          type="submit"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Buscar
        </button>
      </form>

      {loading ? (
        <LoadingState />
      ) : error || !data ? (
        <ErrorState error={error} onRetry={reload} />
      ) : data.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhum produto encontrado.</p>
      ) : (
        <AdminTable
          head={
            <>
              <Th>Nome canônico</Th>
              <Th>GTIN</Th>
              <Th>Embalagem</Th>
              <Th>Tipo</Th>
            </>
          }
        >
          {data.map((p) => (
            <tr key={p.id} className="hover:bg-slate-50">
              <Td className="font-medium text-slate-900">{p.canonicalName}</Td>
              <Td className="font-mono text-xs">{p.gtin ?? '—'}</Td>
              <Td>
                {p.packageQuantity ? `${formatQuantity(p.packageQuantity)} ${p.packageUnit ?? ''}`.trim() : '—'}
              </Td>
              <Td>{p.packagingType ?? '—'}</Td>
            </tr>
          ))}
        </AdminTable>
      )}
    </>
  );
}
