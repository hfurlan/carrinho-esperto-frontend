import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client.ts';
import { importFiscalDocument } from '../api/fiscalDocuments.ts';
import { resolveDocument } from '../api/resolution.ts';
import { Button, Card, PageHeader, TextInput } from '../components/ui.tsx';

function friendlyImportError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 422) return 'Por enquanto só há suporte para notas fiscais de São Paulo (SP).';
    if (err.status === 400) return 'Não foi possível ler este endereço de QR Code. Confira se copiou o link completo.';
    if (err.status === 502) return 'Não foi possível consultar a nota na SEFAZ-SP agora. Tente novamente em instantes.';
    if (err.kind === 'network') return 'Sem conexão. Verifique sua internet e tente novamente.';
    return err.message;
  }
  return 'Não foi possível importar a nota. Tente novamente.';
}

function looksLikeUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export function ImportReceiptPage() {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = url.trim();
  const invalidFormat = trimmed.length > 0 && !looksLikeUrl(trimmed);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!trimmed || invalidFormat) return;
    setError(null);
    setSubmitting(true);
    try {
      const doc = await importFiscalDocument(trimmed);
      // Resolve the items so the receipt opens already showing what we identified.
      await resolveDocument(doc.id).catch(() => undefined);
      navigate(`/compras/${doc.id}`);
    } catch (err) {
      setError(friendlyImportError(err));
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        title="Importar nota fiscal"
        subtitle="Cole o endereço do QR Code da sua NFC-e (nota fiscal de consumidor)."
      />

      <Card className="p-5">
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <div>
            <label htmlFor="qr-url" className="block text-sm font-medium text-slate-700">
              Endereço do QR Code
            </label>
            <TextInput
              id="qr-url"
              inputMode="url"
              autoComplete="off"
              placeholder="https://www.nfce.fazenda.sp.gov.br/NFCeConsultaPublica/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="mt-1"
              aria-invalid={invalidFormat}
            />
            {invalidFormat ? (
              <p className="mt-1.5 text-xs text-red-600">Isto não parece um endereço da web válido.</p>
            ) : (
              <p className="mt-1.5 text-xs text-slate-500">
                No app da nota fiscal ou no cupom, abra o QR Code e copie o link. Ele começa com{' '}
                <code className="text-slate-600">https://</code>.
              </p>
            )}
          </div>

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <Button type="submit" disabled={!trimmed || invalidFormat || submitting} className="w-full">
            {submitting ? 'Importando…' : 'Importar'}
          </Button>

          {submitting && (
            <p className="text-center text-xs text-slate-500">Consultando a SEFAZ-SP e lendo a nota…</p>
          )}
        </form>
      </Card>

      <p className="mt-4 text-xs text-slate-400">
        Nós guardamos apenas os dados fiscais da nota (estabelecimento, itens, valores). Dados do
        consumidor não são armazenados.
      </p>
    </div>
  );
}
