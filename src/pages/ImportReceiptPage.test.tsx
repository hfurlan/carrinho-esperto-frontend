import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/client.ts';
import * as fiscalApi from '../api/fiscalDocuments.ts';
import { renderApp } from '../test/utils.tsx';
import { ImportReceiptPage } from './ImportReceiptPage.tsx';

vi.mock('../api/fiscalDocuments.ts', () => ({ importFiscalDocument: vi.fn() }));
vi.mock('../api/resolution.ts', () => ({ resolveDocument: vi.fn().mockResolvedValue([]) }));

const importDoc = fiscalApi.importFiscalDocument as ReturnType<typeof vi.fn>;

beforeEach(() => vi.clearAllMocks());

describe('ImportReceiptPage', () => {
  it('keeps the submit button disabled until a URL is entered', () => {
    renderApp(<ImportReceiptPage />);
    expect(screen.getByRole('button', { name: 'Importar' })).toBeDisabled();
  });

  it('rejects an obviously invalid URL before calling the API', async () => {
    const user = userEvent.setup();
    renderApp(<ImportReceiptPage />);
    await user.type(screen.getByLabelText('Endereço do QR Code'), 'not a url');
    expect(screen.getByText('Isto não parece um endereço da web válido.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Importar' })).toBeDisabled();
    expect(importDoc).not.toHaveBeenCalled();
  });

  it('imports a valid URL', async () => {
    importDoc.mockResolvedValue({ id: 'doc-9', items: [], payments: [] });
    const user = userEvent.setup();
    renderApp(<ImportReceiptPage />);
    await user.type(
      screen.getByLabelText('Endereço do QR Code'),
      'https://www.nfce.fazenda.sp.gov.br/NFCeConsultaPublica/Paginas/ConsultaQRCode.aspx?p=x',
    );
    await user.click(screen.getByRole('button', { name: 'Importar' }));
    await waitFor(() => expect(importDoc).toHaveBeenCalledOnce());
  });

  it('shows a friendly message when the state is not supported', async () => {
    importDoc.mockRejectedValue(new ApiError('unknown', 422, 'x'));
    const user = userEvent.setup();
    renderApp(<ImportReceiptPage />);
    await user.type(screen.getByLabelText('Endereço do QR Code'), 'https://example.com/x');
    await user.click(screen.getByRole('button', { name: 'Importar' }));
    expect(
      await screen.findByText('Por enquanto só há suporte para notas fiscais de São Paulo (SP).'),
    ).toBeInTheDocument();
  });
});
