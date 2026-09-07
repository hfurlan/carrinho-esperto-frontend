/*
 * QR decoding adapter (M006.1). The rest of the app depends on this tiny
 * interface, never on the decoding library directly, so:
 *   - the camera and photo flows share one contract;
 *   - tests inject deterministic decoded values instead of driving a real
 *     decoder or camera.
 *
 * The concrete implementation uses `qr-scanner`, imported lazily so merely
 * importing this module (e.g. in JSDOM) does not pull the library or its worker.
 */

export class QrDecodeError extends Error {
  constructor(message = 'Não encontramos um QR Code nesta imagem.') {
    super(message);
    this.name = 'QrDecodeError';
  }
}

export interface QrDecoder {
  /** Decode the QR Code in an image file. Rejects with {@link QrDecodeError} if none is found. */
  decodeImageFile(file: File): Promise<string>;
}

/** Default decoder: `qr-scanner` reading a still image (also uses the native BarcodeDetector when available). */
export const defaultQrDecoder: QrDecoder = {
  async decodeImageFile(file: File): Promise<string> {
    const { default: QrScanner } = await import('qr-scanner');
    try {
      const result = await QrScanner.scanImage(file, {
        returnDetailedScanResult: true,
        alsoTryWithoutScanRegion: true,
      });
      const text = result.data.trim();
      if (!text) throw new QrDecodeError();
      return text;
    } catch (err) {
      if (err instanceof QrDecodeError) throw err;
      throw new QrDecodeError();
    }
  },
};
