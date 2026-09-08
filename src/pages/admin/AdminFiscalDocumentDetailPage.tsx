import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiError } from '../../api/client.ts';
import { getAdminFiscalDocument, reRunAdminResolution } from '../../api/admin.ts';
import type { DocumentItemResolution } from '../../api/types.ts';
import { AdminPageHeader, AdminTable, Td, Th } from '../../components/admin.tsx';
import { ErrorState, LoadingState } from '../../components/StateViews.tsx';
import { Card } from '../../components/ui.tsx';
import { formatAccessKey, formatBRL, formatCnpj, formatDateTime, formatQuantity } from '../../lib/format.ts';
import { useAsync } from '../../lib/useAsync.ts';

export function AdminFiscalDocumentDetailPage() {
  const { id = '' } = useParams();
  const { data, error, loading, reload } = useAsync((signal) => getAdminFiscalDocument(id, signal), [id]);

  const [resolutions, setResolutions] = useState<Map<string, DocumentItemResolution> | null>(null);
  const [reprocessing, setReprocessing] = useState(false);
  const [reprocessError, setReprocessError] = useState<string | null>(null);

  const reprocess = async () => {
    setReprocessing(true);
    setReprocessError(null);
    try {
      const rows = await reRunAdminResolution(id);
      setResolutions(new Map(rows.map((r) => [r.fiscalItemId, r])));
    } catch (err) {
      setReprocessError(err instanceof ApiError ? err.message : 'Não foi possível reprocessar.');
    } finally {
      setReprocessing(false);
    }
  };

  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState error={error} onRetry={reload} />;

  return (
    <>
      <Link to="/admin/notas-fiscais" className="mb-3 inline-block text-sm text-emerald-700 hover:underline">
        ← Notas fiscais
      </Link>
      <AdminPageHeader title={data.issuer.tradeName ?? data.issuer.legalName ?? data.issuer.cnpj} />

      <Card className="mb-6 p-4">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
          <Field label="Emissão" value={formatDateTime(data.issuedAt)} />
          <Field label="Importada em" value={formatDateTime(data.createdAt)} />
          <Field label="Número / Série" value={`${data.documentNumber ?? '—'} / ${data.series ?? '—'}`} />
          <Field label="CNPJ" value={formatCnpj(data.issuer.cnpj)} />
          <Field label="Total" value={formatBRL(data.totalAmount)} />
          <Field label="Mercadorias" value={formatBRL(data.totalItemsAmount)} />
          <Field label="Descontos" value={formatBRL(data.totalDiscount)} />
          <div className="col-span-2 sm:col-span-4">
            <dt className="text-xs uppercase tracking-wide text-slate-400">Chave de acesso</dt>
            <dd className="mt-0.5 break-all font-mono text-xs text-slate-600">{formatAccessKey(data.accessKey)}</dd>
          </div>
          {data.issuer.address && (
            <div className="col-span-2 sm:col-span-4">
              <dt className="text-xs uppercase tracking-wide text-slate-400">Endereço</dt>
              <dd className="mt-0.5 text-slate-600">{data.issuer.address}</dd>
            </div>
          )}
        </dl>
      </Card>

      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-800">Itens ({data.items.length})</h2>
        <button
          type="button"
          onClick={() => void reprocess()}
          disabled={reprocessing}
          className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
        >
          {reprocessing ? 'Reprocessando…' : 'Reprocessar identificação'}
        </button>
      </div>
      {reprocessError && (
        <p className="mb-2 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          {reprocessError}
        </p>
      )}
      <AdminTable
        head={
          <>
            <Th>#</Th>
            <Th>Descrição fiscal</Th>
            <Th>cProd</Th>
            <Th>GTIN</Th>
            <Th className="text-right">Qtd.</Th>
            <Th>Un.</Th>
            <Th className="text-right">Total</Th>
            <Th>Resolução</Th>
            <Th>Método</Th>
            <Th>Produto canônico</Th>
          </>
        }
      >
        {data.items.map((item) => {
          const r = resolutions?.get(item.id);
          return (
            <tr key={item.id}>
              <Td>{item.lineNumber}</Td>
              <Td className="font-medium text-slate-900">{item.rawDescription}</Td>
              <Td className="font-mono text-xs">{item.supplierItemCode ?? '—'}</Td>
              <Td className="font-mono text-xs">{item.gtin ?? '—'}</Td>
              <Td className="text-right">{formatQuantity(item.quantity)}</Td>
              <Td>{item.unit}</Td>
              <Td className="text-right font-medium text-slate-900">{formatBRL(item.totalPrice)}</Td>
              <Td>{resolutions ? (r?.status ?? 'UNRESOLVED') : '—'}</Td>
              <Td className="font-mono text-xs">{r?.method ?? '—'}</Td>
              <Td>{r?.canonicalProductName ?? '—'}</Td>
            </tr>
          );
        })}
      </AdminTable>

      {data.payments.length > 0 && (
        <>
          <h2 className="mt-6 mb-2 text-sm font-semibold text-slate-800">Pagamentos</h2>
          <AdminTable head={<><Th>Método</Th><Th className="text-right">Valor</Th></>}>
            {data.payments.map((p) => (
              <tr key={p.id}>
                <Td>
                  {p.method}
                  {p.methodDescription ? ` — ${p.methodDescription}` : ''}
                </Td>
                <Td className="text-right font-medium text-slate-900">{formatBRL(p.amount)}</Td>
              </tr>
            ))}
          </AdminTable>
        </>
      )}
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 font-medium text-slate-700">{value}</dd>
    </div>
  );
}
