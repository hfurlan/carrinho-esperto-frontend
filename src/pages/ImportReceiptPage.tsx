import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client.ts';
import { importFiscalDocument } from '../api/fiscalDocuments.ts';
import { resolveDocument } from '../api/resolution.ts';
import { Button, Card, PageHeader, TextInput } from '../components/ui.tsx';
import { classifyDecodedQr } from '../lib/nfceUrl.ts';
import { QrCameraScanner, type CameraScanStart } from '../lib/qr/QrCameraScanner.tsx';
import { defaultQrDecoder, QrDecodeError, type QrDecoder } from '../lib/qr/qrDecoder.ts';

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

const NOT_A_RECEIPT_QR = 'Não reconhecemos um QR Code de nota fiscal nesta leitura. Tente novamente.';

type Phase = 'idle' | 'decoding-photo' | 'importing';

export function ImportReceiptPage({
  decoder = defaultQrDecoder,
  scannerStart,
}: {
  /** Injected for tests. */
  decoder?: QrDecoder;
  /** Injected for tests — passed through to the camera scanner. */
  scannerStart?: CameraScanStart;
} = {}) {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [scanning, setScanning] = useState(false);
  const [url, setUrl] = useState('');
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<string | null>(null);

  const trimmed = url.trim();
  const invalidFormat = trimmed.length > 0 && !looksLikeUrl(trimmed);
  const busy = phase !== 'idle';

  const runImport = async (targetUrl: string) => {
    setError(null);
    setPhase('importing');
    try {
      const doc = await importFiscalDocument(targetUrl);
      await resolveDocument(doc.id).catch(() => undefined);
      navigate(`/compras/${doc.id}`);
    } catch (err) {
      setError(friendlyImportError(err));
      setPhase('idle');
    }
  };

  const handleDecoded = (text: string) => {
    setScanning(false);
    const decoded = classifyDecodedQr(text);
    if (!decoded.url) {
      // Not a web address at all — nothing to import.
      setError(NOT_A_RECEIPT_QR);
      return;
    }
    // Any URL goes to the backend, which is the authority on what it can import
    // (and returns a clean "só SP" / "endereço inválido" message otherwise).
    setCapturedUrl(decoded.url);
    void runImport(decoded.url);
  };

  const onPhotoChosen = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ''; // allow re-picking the same file
    if (!file) return;
    setError(null);
    setPhase('decoding-photo');
    try {
      const text = await decoder.decodeImageFile(file);
      handleDecoded(text);
    } catch (err) {
      setError(err instanceof QrDecodeError ? err.message : 'Não foi possível ler a imagem.');
    } finally {
      setPhase((p) => (p === 'decoding-photo' ? 'idle' : p));
    }
  };

  const onManualSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!trimmed || invalidFormat || busy) return;
    const decoded = classifyDecodedQr(trimmed);
    if (!decoded.url) {
      setError(NOT_A_RECEIPT_QR);
      return;
    }
    // Same normalisation (literal `|` -> `%7C`) as the camera/photo path.
    setCapturedUrl(decoded.url);
    void runImport(decoded.url);
  };

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        title="Adicionar nota fiscal"
        subtitle="Leia o QR Code do cupom com a câmera ou envie uma foto. Não precisa digitar nada."
      />

      <Card className="p-5">
        {scanning ? (
          <QrCameraScanner onResult={handleDecoded} onClose={() => setScanning(false)} start={scannerStart} />
        ) : (
          <div className="space-y-3">
            <Button
              type="button"
              className="w-full py-3 text-base"
              onClick={() => {
                setError(null);
                setScanning(true);
              }}
              disabled={busy}
              aria-label="Ler QR Code com a câmera"
            >
              📷 Ler QR Code
            </Button>

            <Button
              type="button"
              variant="secondary"
              className="w-full py-3 text-base"
              onClick={() => fileInputRef.current?.click()}
              disabled={busy}
              aria-label="Enviar uma foto com o QR Code"
            >
              🖼 Enviar foto
            </Button>
            {/* No `capture` attribute: on mobile this lets the user either take a
                photo or pick an existing one from the gallery (spec §8). */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onPhotoChosen}
              aria-hidden
              tabIndex={-1}
            />
          </div>
        )}

        {(phase === 'decoding-photo' || phase === 'importing') && (
          <p className="mt-3 text-center text-sm text-slate-500" role="status" aria-live="polite">
            {phase === 'decoding-photo' ? 'Procurando o QR Code na imagem…' : 'Consultando a SEFAZ-SP e lendo a nota…'}
          </p>
        )}

        {error && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <p>{error}</p>
            {capturedUrl && !busy && (
              <button
                type="button"
                className="mt-1 font-semibold underline"
                onClick={() => void runImport(capturedUrl)}
              >
                Tentar importar novamente
              </button>
            )}
          </div>
        )}

        <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
          <span className="h-px flex-1 bg-slate-200" />
          ou cole a URL da NFC-e
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        <form onSubmit={onManualSubmit} noValidate className="space-y-3">
          <div>
            <label htmlFor="qr-url" className="sr-only">
              URL da NFC-e
            </label>
            <TextInput
              id="qr-url"
              inputMode="url"
              autoComplete="off"
              placeholder="https://www.nfce.fazenda.sp.gov.br/NFCeConsultaPublica/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              aria-invalid={invalidFormat}
              aria-label="URL da NFC-e"
            />
            {invalidFormat && (
              <p className="mt-1.5 text-xs text-red-600">Isto não parece um endereço da web válido.</p>
            )}
          </div>
          <Button type="submit" variant="secondary" disabled={!trimmed || invalidFormat || busy} className="w-full">
            Importar
          </Button>
        </form>
      </Card>

      <p className="mt-4 text-xs text-slate-400">
        A foto não é enviada nem armazenada — o QR Code é lido no seu próprio dispositivo. Guardamos apenas os
        dados fiscais da nota (estabelecimento, itens, valores). Dados do consumidor não são armazenados.
      </p>
    </div>
  );
}
