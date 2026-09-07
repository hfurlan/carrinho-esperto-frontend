import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiError } from '../api/client.ts';
import { getFiscalDocument } from '../api/fiscalDocuments.ts';
import { getDocumentResolutions, resolveDocument } from '../api/resolution.ts';
import type { DocumentItemResolution, FiscalDocumentResponse, FiscalItemResponse } from '../api/types.ts';
import { ResolutionBadge } from '../components/ResolutionBadge.tsx';
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews.tsx';
import { Badge, Button, Card, PageHeader } from '../components/ui.tsx';
import { formatAccessKey, formatBRL, formatCnpj, formatDateTime, formatQuantity } from '../lib/format.ts';
import { useAsync } from '../lib/useAsync.ts';

interface ReceiptData {
  document: FiscalDocumentResponse;
  resolutions: DocumentItemResolution[];
}

export function ReceiptDetailPage() {
  const { id = '' } = useParams();
  const { data, error, loading, reload } = useAsync<ReceiptData>(
    async (signal) => {
      const [document, resolutions] = await Promise.all([
        getFiscalDocument(id, signal),
        getDocumentResolutions(id, signal),
      ]);
      return { document, resolutions };
    },
    [id],
  );

  const [manualResolutions, setManualResolutions] = useState<DocumentItemResolution[] | null>(null);
  const [resolving, setResolving] = useState(false);
  const resolutions = manualResolutions ?? data?.resolutions ?? [];

  const handleResolve = useCallback(async () => {
    setResolving(true);
    try {
      setManualResolutions(await resolveDocument(id));
    } catch {
      /* keep the last known state; the badges just stay as they were */
    } finally {
      setResolving(false);
    }
  }, [id]);

  // First time this receipt is opened its items have never been resolved — do it once.
  useEffect(() => {
    if (
      data &&
      manualResolutions === null &&
      data.resolutions.length > 0 &&
      data.resolutions.every((r) => r.status === null)
    ) {
      void handleResolve();
    }
  }, [data, manualResolutions, handleResolve]);

  if (loading) return <LoadingState />;
  if (error instanceof ApiError && error.kind === 'not-found') {
    return (
      <EmptyState
        title="Nota não encontrada"
        description="Esta nota não existe ou não pertence à sua conta."
        action={
          <Link to="/compras">
            <Button variant="secondary">Voltar para compras</Button>
          </Link>
        }
      />
    );
  }
  if (error || !data) return <ErrorState error={error} onRetry={reload} />;

  const { document } = data;
  const byItem = new Map(resolutions.map((r) => [r.fiscalItemId, r]));
  const issuerName = document.issuer.tradeName ?? document.issuer.legalName ?? formatCnpj(document.issuer.cnpj);

  return (
    <>
      <Link to="/compras" className="mb-4 inline-block text-sm text-emerald-700 hover:underline">
        ← Compras
      </Link>

      <PageHeader
        title={issuerName}
        subtitle={
          <>
            {formatDateTime(document.issuedAt)}
            {document.documentNumber != null && <> · Nota {document.documentNumber}</>}
            {document.series != null && <> · Série {document.series}</>}
          </>
        }
        action={
          <Button variant="secondary" onClick={handleResolve} disabled={resolving}>
            {resolving ? 'Atualizando…' : 'Atualizar identificação'}
          </Button>
        }
      />

      <Card className="p-5">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Total</dt>
            <dd className="mt-0.5 text-lg font-bold text-slate-900">{formatBRL(document.totalAmount)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Mercadorias</dt>
            <dd className="mt-0.5 font-medium text-slate-700">{formatBRL(document.totalItemsAmount)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Descontos</dt>
            <dd className="mt-0.5 font-medium text-slate-700">{formatBRL(document.totalDiscount)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">CNPJ</dt>
            <dd className="mt-0.5 font-medium text-slate-700">{formatCnpj(document.issuer.cnpj)}</dd>
          </div>
          {document.issuer.address && (
            <div className="col-span-2 sm:col-span-4">
              <dt className="text-xs uppercase tracking-wide text-slate-400">Endereço</dt>
              <dd className="mt-0.5 text-slate-600">{document.issuer.address}</dd>
            </div>
          )}
          <div className="col-span-2 sm:col-span-4">
            <dt className="text-xs uppercase tracking-wide text-slate-400">Chave de acesso</dt>
            <dd className="mt-0.5 break-all font-mono text-xs text-slate-500">
              {formatAccessKey(document.accessKey)}
            </dd>
          </div>
        </dl>
      </Card>

      <h2 className="mt-8 mb-3 text-sm font-semibold text-slate-800">
        Itens ({document.items.length})
      </h2>
      <Card className="divide-y divide-slate-100">
        {document.items.map((item) => (
          <ReceiptItemRow key={item.id} item={item} resolution={byItem.get(item.id)} />
        ))}
      </Card>

      {document.payments.length > 0 && (
        <>
          <h2 className="mt-8 mb-3 text-sm font-semibold text-slate-800">Pagamento</h2>
          <Card className="divide-y divide-slate-100">
            {document.payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="text-slate-700">{payment.methodDescription ?? payment.method}</span>
                <span className="font-semibold text-slate-900">{formatBRL(payment.amount)}</span>
              </div>
            ))}
          </Card>
        </>
      )}
    </>
  );
}

function ReceiptItemRow({
  item,
  resolution,
}: {
  item: FiscalItemResponse;
  resolution: DocumentItemResolution | undefined;
}) {
  const meta: string[] = [
    `${formatQuantity(item.quantity)} ${item.unit} × ${formatBRL(item.unitPrice)}`,
  ];
  if (item.supplierItemCode) meta.push(`Cód. ${item.supplierItemCode}`);
  if (item.gtin && item.gtin !== 'SEM GTIN') meta.push(`GTIN ${item.gtin}`);
  else if (item.gtin === 'SEM GTIN') meta.push('Sem GTIN');

  return (
    <div className="px-4 py-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {/* Fiscal truth — the receipt text, never replaced. */}
          <p className="text-sm font-medium text-slate-900">{item.rawDescription}</p>
          <p className="mt-0.5 text-xs text-slate-400">{meta.join(' · ')}</p>
        </div>
        <span className="shrink-0 text-sm font-semibold text-slate-900">{formatBRL(item.totalPrice)}</span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <ResolutionBadge status={resolution?.status} />
        {resolution?.status === 'RESOLVED' && resolution.canonicalProductName && (
          <span className="text-xs text-slate-500">
            Produto: <span className="font-medium text-slate-700">{resolution.canonicalProductName}</span>
          </span>
        )}
        {resolution?.method === 'GTIN_EXACT' && <Badge tone="blue">por código de barras</Badge>}
      </div>
    </div>
  );
}
