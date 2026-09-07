import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client.ts';
import { importFiscalDocument } from '../api/fiscalDocuments.ts';
import { resolveDocument } from '../api/resolution.ts';
import { Button, TextInput } from '../components/ui.tsx';
import { classifyDecodedQr } from '../lib/nfceUrl.ts';
import { QrCameraScanner, type CameraScanStart } from '../lib/qr/QrCameraScanner.tsx';
import { defaultQrDecoder, QrDecodeError, type QrDecoder } from '../lib/qr/qrDecoder.ts';

function friendlyImportError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 422) return 'Por enquanto só lemos notas fiscais de São Paulo (SP).';
    if (err.status === 400) return 'Não conseguimos ler esse link de QR Code. Confira se copiou ele inteiro.';
    if (err.status === 502) return 'A SEFAZ-SP não respondeu agora. Tente de novo em instantes.';
    if (err.kind === 'network') return 'Sem conexão. Confira sua internet e tente de novo.';
    return err.message;
  }
  return 'Não deu para importar a nota agora. Tente de novo.';
}

function looksLikeUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

const NOT_A_RECEIPT_QR = 'Isso não parece o QR Code de uma nota fiscal. Tente ler de novo.';

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
      setError(NOT_A_RECEIPT_QR);
      return;
    }
    setCapturedUrl(decoded.url);
    void runImport(decoded.url);
  };

  const onPhotoChosen = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setError(null);
    setPhase('decoding-photo');
    try {
      const text = await decoder.decodeImageFile(file);
      handleDecoded(text);
    } catch (err) {
      setError(err instanceof QrDecodeError ? err.message : 'Não deu para ler essa imagem.');
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
    setCapturedUrl(decoded.url);
    void runImport(decoded.url);
  };

  return (
    <div className="mx-auto max-w-md">
      <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink text-balance">
        Adicionar uma nota
      </h1>
      <p className="mt-1 text-sm text-muted">Aponte a câmera para o QR Code do cupom. Não precisa digitar nada.</p>

      <div className="mt-6 space-y-3">
        {scanning ? (
          <QrCameraScanner onResult={handleDecoded} onClose={() => setScanning(false)} start={scannerStart} />
        ) : (
          <>
            <Button
              type="button"
              className="w-full py-3.5 text-base"
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
              className="w-full py-3.5 text-base"
              onClick={() => fileInputRef.current?.click()}
              disabled={busy}
              aria-label="Enviar uma foto com o QR Code"
            >
              🖼 Enviar foto do QR Code
            </Button>
            {/* No `capture`: on mobile this offers "tirar foto" or a foto da galeria. */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onPhotoChosen}
              aria-hidden
              tabIndex={-1}
            />
          </>
        )}

        {(phase === 'decoding-photo' || phase === 'importing') && (
          <p className="text-center text-sm text-muted" role="status" aria-live="polite">
            {phase === 'decoding-photo' ? 'Procurando o QR Code na imagem…' : 'Lendo a nota na SEFAZ-SP…'}
          </p>
        )}

        {error && (
          <div className="rounded-lg border border-rose/40 bg-rose-soft px-3 py-2.5 text-sm text-rose">
            <p>{error}</p>
            {capturedUrl && !busy && (
              <button
                type="button"
                className="mt-1 font-semibold underline"
                onClick={() => void runImport(capturedUrl)}
              >
                Tentar importar de novo
              </button>
            )}
          </div>
        )}
      </div>

      <div className="my-6 flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-line" />
        ou
        <span className="h-px flex-1 bg-line" />
      </div>

      <form onSubmit={onManualSubmit} noValidate className="space-y-3">
        <div>
          <label htmlFor="qr-url" className="mb-1.5 block text-[13px] font-medium text-ink">
            Digitar ou colar o link da nota
          </label>
          <TextInput
            id="qr-url"
            inputMode="url"
            autoComplete="off"
            placeholder="https://www.nfce.fazenda.sp.gov.br/…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            aria-invalid={invalidFormat}
            aria-label="URL da NFC-e"
          />
          {invalidFormat && (
            <p className="mt-1.5 text-xs text-rose">Isto não parece um endereço da web válido.</p>
          )}
        </div>
        <Button
          type="submit"
          variant="secondary"
          disabled={!trimmed || invalidFormat || busy}
          className="w-full"
        >
          Importar
        </Button>
      </form>

      <p className="mt-6 text-xs text-muted">
        A foto não sai do seu aparelho — o QR Code é lido aqui mesmo. Guardamos só os dados da nota
        (estabelecimento, itens, valores). Nome e CPF do consumidor não são armazenados.
      </p>
    </div>
  );
}
