import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/client.ts';
import * as fiscalApi from '../api/fiscalDocuments.ts';
import { QrDecodeError, type QrDecoder } from '../lib/qr/qrDecoder.ts';
import type { CameraScanStart } from '../lib/qr/QrCameraScanner.tsx';
import { renderApp } from '../test/utils.tsx';
import { ImportReceiptPage } from './ImportReceiptPage.tsx';

vi.mock('../api/fiscalDocuments.ts', () => ({ importFiscalDocument: vi.fn() }));
vi.mock('../api/resolution.ts', () => ({ resolveDocument: vi.fn().mockResolvedValue([]) }));

const importDoc = fiscalApi.importFiscalDocument as ReturnType<typeof vi.fn>;

const SP_URL =
  'https://www.nfce.fazenda.sp.gov.br/NFCeConsultaPublica/Paginas/ConsultaQRCode.aspx?p=' + '3'.repeat(44) + '|2';
// What the page actually sends: the href with literal `|` -> `%7C`, so Java's
// stricter URI parser on the backend accepts it.
const SP_HREF = new URL(SP_URL).href.replace(/\|/g, '%7C');

function decoderReturning(value: string | Error): QrDecoder {
  return {
    decodeImageFile: vi.fn().mockImplementation(() =>
      value instanceof Error ? Promise.reject(value) : Promise.resolve(value),
    ),
  };
}

function fileInput(): HTMLInputElement {
  const el = document.querySelector('input[type="file"]');
  if (!el) throw new Error('file input not found');
  return el as HTMLInputElement;
}

beforeEach(() => vi.clearAllMocks());

describe('ImportReceiptPage', () => {
  it('leads with QR capture and keeps manual URL as a fallback', () => {
    renderApp(<ImportReceiptPage />);
    expect(screen.getByRole('button', { name: 'Ler QR Code com a câmera' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enviar uma foto com o QR Code' })).toBeInTheDocument();
    expect(screen.getByLabelText('URL da NFC-e')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Importar' })).toBeDisabled();
  });

  it('rejects an obviously invalid manual URL before calling the API', async () => {
    const user = userEvent.setup();
    renderApp(<ImportReceiptPage />);
    await user.type(screen.getByLabelText('URL da NFC-e'), 'not a url');
    expect(screen.getByText('Isto não parece um endereço da web válido.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Importar' })).toBeDisabled();
    expect(importDoc).not.toHaveBeenCalled();
  });

  it('imports a valid manual URL', async () => {
    importDoc.mockResolvedValue({ id: 'doc-9', items: [], payments: [] });
    const user = userEvent.setup();
    renderApp(<ImportReceiptPage />);
    await user.type(screen.getByLabelText('URL da NFC-e'), SP_URL);
    await user.click(screen.getByRole('button', { name: 'Importar' }));
    await waitFor(() => expect(importDoc).toHaveBeenCalledWith(SP_HREF));
  });

  it('shows a friendly message when the state is not supported', async () => {
    importDoc.mockRejectedValue(new ApiError('unknown', 422, 'x'));
    const user = userEvent.setup();
    renderApp(<ImportReceiptPage />);
    await user.type(screen.getByLabelText('URL da NFC-e'), 'https://example.com/x');
    await user.click(screen.getByRole('button', { name: 'Importar' }));
    expect(
      await screen.findByText('Por enquanto só lemos notas fiscais de São Paulo (SP).'),
    ).toBeInTheDocument();
  });

  it('decodes an uploaded photo and imports the NFC-e it points to', async () => {
    importDoc.mockResolvedValue({ id: 'doc-1', items: [], payments: [] });
    renderApp(<ImportReceiptPage decoder={decoderReturning(SP_URL)} />);

    await userEvent.upload(fileInput(), new File(['x'], 'nota.png', { type: 'image/png' }));

    await waitFor(() => expect(importDoc).toHaveBeenCalledWith(SP_HREF));
  });

  it('does not import when the QR is not a web address at all', async () => {
    renderApp(<ImportReceiptPage decoder={decoderReturning('apenas um texto qualquer')} />);

    await userEvent.upload(fileInput(), new File(['x'], 'nota.png', { type: 'image/png' }));

    expect(await screen.findByText(/Isso não parece o QR Code de uma nota fiscal/)).toBeInTheDocument();
    expect(importDoc).not.toHaveBeenCalled();
  });

  it('still sends any decoded URL to the backend and shows its verdict', async () => {
    importDoc.mockRejectedValue(new ApiError('unknown', 422, 'x'));
    renderApp(<ImportReceiptPage decoder={decoderReturning('https://example.com/whatever')} />);

    await userEvent.upload(fileInput(), new File(['x'], 'nota.png', { type: 'image/png' }));

    // The client no longer second-guesses the URL — the backend is the authority.
    await waitFor(() => expect(importDoc).toHaveBeenCalledWith('https://example.com/whatever'));
    expect(
      await screen.findByText('Por enquanto só lemos notas fiscais de São Paulo (SP).'),
    ).toBeInTheDocument();
  });

  it('rejects a photo with no readable QR code', async () => {
    renderApp(<ImportReceiptPage decoder={decoderReturning(new QrDecodeError())} />);

    await userEvent.upload(fileInput(), new File(['x'], 'blurry.png', { type: 'image/png' }));

    expect(await screen.findByText('Não encontramos um QR Code nesta imagem.')).toBeInTheDocument();
    expect(importDoc).not.toHaveBeenCalled();
  });

  it('imports straight from a camera scan', async () => {
    importDoc.mockResolvedValue({ id: 'doc-2', items: [], payments: [] });
    const scannerStart: CameraScanStart = vi.fn(async (_video, onDecode) => {
      onDecode(SP_URL);
      return { stop: vi.fn() };
    });

    renderApp(<ImportReceiptPage scannerStart={scannerStart} />);
    await userEvent.click(screen.getByRole('button', { name: 'Ler QR Code com a câmera' }));

    await waitFor(() => expect(importDoc).toHaveBeenCalledWith(SP_HREF));
  });

  it('lets the user retry the import without rescanning', async () => {
    importDoc.mockRejectedValueOnce(new ApiError('server', 502, 'x'));
    renderApp(<ImportReceiptPage decoder={decoderReturning(SP_URL)} />);

    await userEvent.upload(fileInput(), new File(['x'], 'nota.png', { type: 'image/png' }));
    const retry = await screen.findByRole('button', { name: 'Tentar importar de novo' });

    importDoc.mockResolvedValueOnce({ id: 'doc-3', items: [], payments: [] });
    await userEvent.click(retry);

    await waitFor(() => expect(importDoc).toHaveBeenCalledTimes(2));
    expect(importDoc).toHaveBeenLastCalledWith(SP_HREF);
  });
});
