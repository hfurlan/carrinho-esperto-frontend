import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as fiscalApi from '../api/fiscalDocuments.ts';
import * as resolutionApi from '../api/resolution.ts';
import type { DocumentItemResolution, FiscalDocumentResponse } from '../api/types.ts';
import { fakeTrialAuth, renderApp } from '../test/utils.tsx';
import { ReceiptDetailPage } from './ReceiptDetailPage.tsx';

vi.mock('../api/fiscalDocuments.ts', () => ({ getFiscalDocument: vi.fn() }));
vi.mock('../api/resolution.ts', () => ({ getDocumentResolutions: vi.fn(), resolveDocument: vi.fn() }));
vi.mock('../api/insight.ts', () => ({ getBasketInsight: vi.fn().mockRejectedValue(new Error('n/a')) }));

const getDoc = fiscalApi.getFiscalDocument as ReturnType<typeof vi.fn>;
const getResolutions = resolutionApi.getDocumentResolutions as ReturnType<typeof vi.fn>;

const DOC: FiscalDocumentResponse = {
  id: 'doc-1',
  accessKey: '3'.repeat(44),
  documentNumber: 117216,
  series: 8,
  issuedAt: '2026-09-06T14:57:04-03:00',
  issuer: { cnpj: '00371046000117', legalName: 'SM SUPERMERCADOS LTDA', tradeName: 'Mercado', address: null },
  totalAmount: '10.98',
  totalItemsAmount: '10.98',
  totalDiscount: null,
  createdAt: '2026-09-06T15:00:00-03:00',
  items: [
    {
      id: 'item-1',
      lineNumber: 1,
      rawDescription: 'LEITE UHT 1L ITALAC',
      gtin: '7891234567895',
      gtinTaxable: null,
      supplierItemCode: '000123',
      quantity: '2',
      unit: 'UN',
      unitPrice: '5.49',
      totalPrice: '10.98',
      discount: null,
      ncm: null,
      cest: null,
    },
  ],
  payments: [{ id: 'pay-1', lineNumber: 1, method: 'Cartão de Crédito', methodDescription: null, amount: '10.98' }],
};

const RESOLUTIONS: DocumentItemResolution[] = [
  {
    fiscalItemId: 'item-1',
    status: 'RESOLVED',
    canonicalProductId: 'prod-1',
    canonicalProductName: 'Leite UHT Integral Italac 1L',
    method: 'GTIN_EXACT',
    updatedAt: '2026-09-06T15:01:00-03:00',
  },
];

beforeEach(() => vi.clearAllMocks());

describe('ReceiptDetailPage', () => {
  it('shows the fiscal description verbatim and the canonical product separately', async () => {
    getDoc.mockResolvedValue(DOC);
    getResolutions.mockResolvedValue(RESOLUTIONS);

    renderApp(<ReceiptDetailPage />, { route: '/compras/doc-1', path: '/compras/:id' });

    // Fiscal truth — never rewritten.
    expect(await screen.findByText('LEITE UHT 1L ITALAC')).toBeInTheDocument();
    // Canonical interpretation — shown, distinct from the fiscal text.
    expect(screen.getByText(/Leite UHT Integral Italac 1L/)).toBeInTheDocument();
    expect(screen.getByText('Cartão de Crédito')).toBeInTheDocument();
  });

  it('shows a not-found state for a receipt that is not the user\'s', async () => {
    const { ApiError } = await import('../api/client.ts');
    getDoc.mockRejectedValue(new ApiError('not-found', 404, 'x'));
    getResolutions.mockRejectedValue(new ApiError('not-found', 404, 'x'));

    renderApp(<ReceiptDetailPage />, { route: '/compras/ghost', path: '/compras/:id' });

    expect(await screen.findByText('Não achamos esta nota')).toBeInTheDocument();
  });

  it('invites an anonymous trial to create an account, but not an authenticated user', async () => {
    getDoc.mockResolvedValue(DOC);
    getResolutions.mockResolvedValue([]);

    const { unmount } = renderApp(<ReceiptDetailPage />, {
      route: '/compras/doc-1',
      path: '/compras/:id',
      auth: fakeTrialAuth(),
    });
    expect(await screen.findByText('Guardar esta compra?')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Criar minha conta' })).toHaveAttribute('href', '/cadastro');
    unmount();

    renderApp(<ReceiptDetailPage />, { route: '/compras/doc-1', path: '/compras/:id' });
    await screen.findByText('LEITE UHT 1L ITALAC');
    expect(screen.queryByText('Guardar esta compra?')).not.toBeInTheDocument();
  });
});
