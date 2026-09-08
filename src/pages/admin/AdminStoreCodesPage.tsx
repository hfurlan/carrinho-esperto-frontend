import { useCallback, useState } from 'react';
import { ApiError } from '../../api/client.ts';
import {
  createStoreProductCode,
  deleteStoreProductCode,
  listAdminCatalogProducts,
  listStoreProductCodes,
  updateStoreProductCode,
} from '../../api/admin.ts';
import type { CatalogProduct } from '../../api/types.ts';
import { AdminPageHeader, AdminTable, Td, Th } from '../../components/admin.tsx';
import { ErrorState, LoadingState } from '../../components/StateViews.tsx';
import { formatDateTime } from '../../lib/format.ts';
import { useAsync } from '../../lib/useAsync.ts';

const input =
  'rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none';
const btn =
  'rounded-md bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-40';
const btnGhost =
  'rounded-md border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50';

/** Search the catalog by name and pick one product. */
function ProductPicker({
  onPick,
  label = 'Produto canônico',
}: {
  onPick: (p: CatalogProduct) => void;
  label?: string;
}) {
  const [term, setTerm] = useState('');
  const [results, setResults] = useState<CatalogProduct[] | null>(null);
  const [searching, setSearching] = useState(false);

  const search = async () => {
    setSearching(true);
    try {
      setResults(await listAdminCatalogProducts(term));
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="min-w-[16rem]">
      <div className="flex gap-1.5">
        <input
          className={input}
          placeholder={label}
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), void search())}
          aria-label={label}
        />
        <button type="button" className={btnGhost} onClick={() => void search()} disabled={searching}>
          {searching ? '…' : 'Buscar'}
        </button>
      </div>
      {results && (
        <ul className="mt-1 max-h-40 overflow-y-auto rounded-md border border-slate-200 bg-white text-sm">
          {results.length === 0 && <li className="px-2 py-1.5 text-slate-400">Nenhum produto.</li>}
          {results.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className="block w-full px-2 py-1.5 text-left hover:bg-slate-50"
                onClick={() => {
                  onPick(p);
                  setResults(null);
                  setTerm('');
                }}
              >
                {p.canonicalName}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function AdminStoreCodesPage() {
  const [filters, setFilters] = useState<{ storeId?: string; code?: string }>({});
  const [storeIdField, setStoreIdField] = useState('');
  const [codeField, setCodeField] = useState('');

  const { data, error, loading, reload } = useAsync(
    (signal) => listStoreProductCodes(filters, signal),
    [filters],
  );

  const [newStoreId, setNewStoreId] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newProduct, setNewProduct] = useState<CatalogProduct | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const run = useCallback(
    async (fn: () => Promise<unknown>) => {
      setActionError(null);
      try {
        await fn();
        reload();
      } catch (err) {
        setActionError(err instanceof ApiError ? err.message : 'Não foi possível concluir a operação.');
      }
    },
    [reload],
  );

  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState error={error} onRetry={reload} />;

  const canAdd = newStoreId.replace(/\D/g, '').length === 14 && newCode.trim() !== '' && newProduct !== null;

  return (
    <>
      <AdminPageHeader
        title="Vocabulário da loja"
        hint="Mapeamentos (loja, cProd) → produto canônico. Determinístico, abaixo do GTIN. Platform-owned."
      />

      <form
        className="mb-4 flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setFilters({ storeId: storeIdField, code: codeField });
        }}
      >
        <input
          className={input}
          placeholder="CNPJ da loja"
          value={storeIdField}
          onChange={(e) => setStoreIdField(e.target.value)}
          aria-label="Filtrar por CNPJ da loja"
        />
        <input
          className={input}
          placeholder="cProd (prefixo)"
          value={codeField}
          onChange={(e) => setCodeField(e.target.value)}
          aria-label="Filtrar por cProd"
        />
        <button type="submit" className={btnGhost}>
          Filtrar
        </button>
        {(filters.storeId || filters.code) && (
          <button
            type="button"
            className={btnGhost}
            onClick={() => {
              setFilters({});
              setStoreIdField('');
              setCodeField('');
            }}
          >
            Limpar
          </button>
        )}
      </form>

      <div className="mb-5 rounded-lg border border-slate-200 bg-white p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Novo mapeamento</p>
        <div className="flex flex-wrap items-start gap-2">
          <input
            className={input}
            placeholder="CNPJ da loja (14 dígitos)"
            value={newStoreId}
            onChange={(e) => setNewStoreId(e.target.value)}
            aria-label="CNPJ da loja"
          />
          <input
            className={input}
            placeholder="cProd"
            value={newCode}
            onChange={(e) => setNewCode(e.target.value)}
            aria-label="cProd"
          />
          <ProductPicker onPick={setNewProduct} />
          <div className="flex flex-col gap-1">
            {newProduct && <span className="text-xs text-slate-600">→ {newProduct.canonicalName}</span>}
            <button
              type="button"
              className={btn}
              disabled={!canAdd}
              onClick={() =>
                void run(async () => {
                  await createStoreProductCode({
                    storeId: newStoreId,
                    code: newCode.trim(),
                    canonicalProductId: newProduct!.id,
                  });
                  setNewStoreId('');
                  setNewCode('');
                  setNewProduct(null);
                })
              }
            >
              Adicionar
            </button>
          </div>
        </div>
      </div>

      {actionError && (
        <p className="mb-3 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          {actionError}
        </p>
      )}

      <AdminTable
        head={
          <>
            <Th>Loja (CNPJ)</Th>
            <Th>cProd</Th>
            <Th>Produto canônico</Th>
            <Th>Atualizado</Th>
            <Th />
          </>
        }
      >
        {data.length === 0 && (
          <tr>
            <Td className="text-slate-400" >Nenhum mapeamento.</Td>
          </tr>
        )}
        {data.map((row) => (
          <tr key={row.id} className="hover:bg-slate-50">
            <Td className="font-mono text-xs">{row.storeId}</Td>
            <Td className="font-mono text-xs">{row.code}</Td>
            <Td>
              {editingId === row.id ? (
                <ProductPicker
                  label="Novo produto"
                  onPick={(p) =>
                    void run(async () => {
                      await updateStoreProductCode(row.id, p.id);
                      setEditingId(null);
                    })
                  }
                />
              ) : (
                row.canonicalProductName
              )}
            </Td>
            <Td className="whitespace-nowrap text-xs">{formatDateTime(row.updatedAt)}</Td>
            <Td className="whitespace-nowrap">
              <button
                type="button"
                className={btnGhost}
                onClick={() => setEditingId(editingId === row.id ? null : row.id)}
              >
                {editingId === row.id ? 'Cancelar' : 'Trocar produto'}
              </button>{' '}
              <button
                type="button"
                className={btnGhost}
                onClick={() => {
                  if (window.confirm(`Remover o mapeamento ${row.storeId} / ${row.code}?`)) {
                    void run(() => deleteStoreProductCode(row.id));
                  }
                }}
              >
                Remover
              </button>
            </Td>
          </tr>
        ))}
      </AdminTable>
    </>
  );
}
