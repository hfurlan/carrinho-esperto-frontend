import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiError } from '../api/client.ts';
import { getFiscalDocument } from '../api/fiscalDocuments.ts';
import { getDocumentResolutions, resolveDocument } from '../api/resolution.ts';
import type { DocumentItemResolution, FiscalDocumentResponse, FiscalItemResponse } from '../api/types.ts';
import { useAuth } from '../auth/authContext.ts';
import { BasketInsight } from '../components/BasketInsight.tsx';
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews.tsx';
import { Button, Card } from '../components/ui.tsx';
import { formatAccessKey, formatBRL, formatCnpj, formatDateTime, formatQuantity } from '../lib/format.ts';
import { useAsync } from '../lib/useAsync.ts';

interface ReceiptData {
  document: FiscalDocumentResponse;
  resolutions: DocumentItemResolution[];
}

export function ReceiptDetailPage() {
  const { id = '' } = useParams();
  const { anonSession, status } = useAuth();
  const isTrial = status !== 'authenticated' && !!anonSession;

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
      /* keep the last known state */
    } finally {
      setResolving(false);
    }
  }, [id]);

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
        title="Não achamos esta nota"
        description={
          isTrial
            ? 'Ela não existe ou não é desta sessão de teste.'
            : 'Ela não existe ou não é da sua conta.'
        }
        action={
          <Link to="/compras">
            <Button variant="secondary">Voltar para minhas compras</Button>
          </Link>
        }
      />
    );
  }
  if (error || !data) return <ErrorState error={error} onRetry={reload} />;

  const { document } = data;
  const byItem = new Map(resolutions.map((r) => [r.fiscalItemId, r]));
  const identified = resolutions.filter((r) => r.status === 'RESOLVED').length;
  const issuerName = document.issuer.tradeName ?? document.issuer.legalName ?? formatCnpj(document.issuer.cnpj);

  return (
    <div className="space-y-8">
      <div>
        <Link to="/compras" className="text-sm font-medium text-accent hover:underline">
          ← Minhas compras
        </Link>
        <h1 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-ink text-balance">
          {issuerName}
        </h1>
        <p className="mt-1 text-sm text-muted">{formatDateTime(document.issuedAt)}</p>
      </div>

      <section className="flex flex-wrap items-end gap-x-8 gap-y-3">
        <div>
          <p className="text-sm text-muted">Você pagou</p>
          <p className="font-display text-4xl font-extrabold leading-none tracking-tight text-ink tabular-nums">
            {formatBRL(document.totalAmount)}
          </p>
        </div>
        <p className="text-sm text-muted tabular-nums">
          Mercadorias {formatBRL(document.totalItemsAmount)}
          {document.totalDiscount && document.totalDiscount !== '0' && (
            <> · Descontos {formatBRL(document.totalDiscount)}</>
          )}
        </p>
      </section>

      <BasketInsight documentId={document.id} />

      {isTrial && (
        <Card className="border-accent/30 bg-accent-soft p-5">
          <h2 className="font-display text-base font-extrabold tracking-tight text-ink">Guardar esta compra?</h2>
          <p className="mt-1 text-sm text-muted">
            Crie sua conta e a gente guarda esta nota e as próximas — com o histórico e o resumo mês a mês.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/cadastro">
              <Button>Criar minha conta</Button>
            </Link>
            <Link to="/importar">
              <Button variant="ghost">Continuar no modo teste</Button>
            </Link>
          </div>
        </Card>
      )}

      <section>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-ink">
            {document.items.length} {document.items.length === 1 ? 'item' : 'itens'}
            {resolutions.length > 0 && (
              <span className="font-normal text-muted"> · {identified} identificados</span>
            )}
          </h2>
          <button
            type="button"
            onClick={handleResolve}
            disabled={resolving}
            className="text-xs font-semibold text-accent hover:underline disabled:opacity-50"
          >
            {resolving ? 'Verificando…' : 'Verificar de novo'}
          </button>
        </div>
        <ul className="border-t border-line">
          {document.items.map((item) => (
            <ReceiptItemRow key={item.id} item={item} resolution={byItem.get(item.id)} />
          ))}
        </ul>
      </section>

      {document.payments.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-ink">Pagamento</h2>
          <ul className="border-t border-line">
            {document.payments.map((payment) => (
              <li
                key={payment.id}
                className="flex items-center justify-between border-b border-line py-2.5 text-sm"
              >
                <span className="text-ink">{payment.methodDescription ?? payment.method}</span>
                <span className="font-display font-bold text-ink tabular-nums">{formatBRL(payment.amount)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <details className="text-sm text-muted">
        <summary className="cursor-pointer select-none font-medium text-ink">Dados fiscais da nota</summary>
        <dl className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted">Estabelecimento (CNPJ)</dt>
            <dd className="text-ink tabular-nums">{formatCnpj(document.issuer.cnpj)}</dd>
          </div>
          {(document.documentNumber != null || document.series != null) && (
            <div>
              <dt className="text-xs text-muted">Nota / série</dt>
              <dd className="text-ink tabular-nums">
                {document.documentNumber ?? '—'} / {document.series ?? '—'}
              </dd>
            </div>
          )}
          {document.issuer.address && (
            <div className="sm:col-span-2">
              <dt className="text-xs text-muted">Endereço</dt>
              <dd className="text-ink">{document.issuer.address}</dd>
            </div>
          )}
          <div className="sm:col-span-2">
            <dt className="text-xs text-muted">Chave de acesso</dt>
            <dd className="break-all font-mono text-xs text-muted">{formatAccessKey(document.accessKey)}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-muted">
          Guardamos só os dados fiscais da nota. Nome e CPF do consumidor não são armazenados.
        </p>
      </details>
    </div>
  );
}

function ReceiptItemRow({
  item,
  resolution,
}: {
  item: FiscalItemResponse;
  resolution: DocumentItemResolution | undefined;
}) {
  const resolved = resolution?.status === 'RESOLVED' && resolution.canonicalProductName;

  return (
    <li className="border-b border-line py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {/* Fiscal truth — the receipt text, never replaced. */}
          <p className="text-[15px] font-semibold text-ink">{item.rawDescription}</p>
          <p className="mt-0.5 text-xs text-muted tabular-nums">
            {formatQuantity(item.quantity)} {item.unit.toLowerCase()} × {formatBRL(item.unitPrice)}
          </p>
          {resolved && (
            <p className="mt-1 text-xs text-accent">✓ {resolution?.canonicalProductName}</p>
          )}
        </div>
        <span className="shrink-0 font-display text-[15px] font-bold text-ink tabular-nums">
          {formatBRL(item.totalPrice)}
        </span>
      </div>
    </li>
  );
}
