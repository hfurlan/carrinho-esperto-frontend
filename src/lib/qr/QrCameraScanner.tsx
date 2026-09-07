import { useEffect, useRef, useState } from 'react';
import { Button } from '../../components/ui.tsx';

/*
 * Live camera QR scanning (M006.1). The camera plumbing is a single injected
 * function so tests can drive it deterministically without touching
 * getUserMedia. The default implementation uses `qr-scanner`, which handles the
 * getUserMedia lifecycle, `facingMode: environment`, autoplay/`playsinline`
 * quirks and iOS edge cases, and decodes via the native BarcodeDetector when the
 * browser has it. Imported lazily so JSDOM never loads it.
 */

export interface CameraScanControls {
  stop: () => void;
}

export type CameraScanStart = (
  video: HTMLVideoElement,
  onDecode: (text: string) => void,
) => Promise<CameraScanControls>;

const startWithQrScanner: CameraScanStart = async (video, onDecode) => {
  const { default: QrScanner } = await import('qr-scanner');
  const scanner = new QrScanner(video, (result) => onDecode(result.data), {
    preferredCamera: 'environment',
    highlightScanRegion: true,
    highlightCodeOutline: true,
    maxScansPerSecond: 5,
    returnDetailedScanResult: true,
  });
  try {
    await scanner.start();
  } catch (err) {
    scanner.destroy();
    throw err;
  }
  return { stop: () => scanner.destroy() };
};

type ScannerState = 'requesting' | 'scanning' | 'error';
type CameraErrorKind = 'denied' | 'no-camera' | 'other';

function classifyCameraError(err: unknown): CameraErrorKind {
  const name = (err as { name?: string } | null)?.name ?? '';
  const message = String((err as { message?: string } | null)?.message ?? err ?? '').toLowerCase();
  if (name === 'NotAllowedError' || name === 'SecurityError' || message.includes('permission')) {
    return 'denied';
  }
  if (
    name === 'NotFoundError' ||
    name === 'OverconstrainedError' ||
    name === 'DevicesNotFoundError' ||
    message.includes('camera not found') ||
    message.includes('no camera')
  ) {
    return 'no-camera';
  }
  return 'other';
}

const ERROR_COPY: Record<CameraErrorKind, string> = {
  denied: 'Acesso à câmera negado. Você pode liberar a câmera nas configurações do navegador.',
  'no-camera': 'Nenhuma câmera disponível neste dispositivo.',
  other: 'Não foi possível iniciar a câmera.',
};

export function QrCameraScanner({
  onResult,
  onClose,
  start = startWithQrScanner,
}: {
  onResult: (text: string) => void;
  onClose: () => void;
  start?: CameraScanStart;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const doneRef = useRef(false);
  const [state, setState] = useState<ScannerState>('requesting');
  const [errorKind, setErrorKind] = useState<CameraErrorKind>('other');

  useEffect(() => {
    let cancelled = false;
    let controls: CameraScanControls | null = null;

    (async () => {
      try {
        controls = await start(videoRef.current as HTMLVideoElement, (text) => {
          if (doneRef.current) return;
          doneRef.current = true;
          controls?.stop();
          onResult(text);
        });
        if (cancelled) {
          controls.stop();
          return;
        }
        setState('scanning');
      } catch (err) {
        if (cancelled) return;
        setErrorKind(classifyCameraError(err));
        setState('error');
      }
    })();

    return () => {
      cancelled = true;
      controls?.stop();
    };
  }, [start, onResult]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="rounded-xl border border-slate-200 bg-slate-900 p-3 text-white"
      role="group"
      aria-label="Leitor de QR Code pela câmera"
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold">Ler QR Code</span>
        <Button variant="ghost" className="text-white hover:bg-white/10" onClick={onClose} aria-label="Fechar leitor">
          Fechar
        </Button>
      </div>

      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-black">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          autoPlay
          playsInline
          muted
          aria-label="Pré-visualização da câmera"
        />
      </div>

      <p className="mt-2 text-center text-xs text-slate-300" role="status" aria-live="polite">
        {state === 'requesting' && 'Permita o acesso à câmera para ler o QR Code.'}
        {state === 'scanning' && 'Aponte a câmera para o QR Code da nota fiscal.'}
        {state === 'error' && (
          <>
            {ERROR_COPY[errorKind]}
            <br />
            Use “Enviar foto” ou cole a URL da NFC-e abaixo.
          </>
        )}
      </p>
    </div>
  );
}
