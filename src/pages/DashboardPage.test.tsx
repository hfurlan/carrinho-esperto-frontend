import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as dashboardApi from '../api/dashboard.ts';
import * as fiscalApi from '../api/fiscalDocuments.ts';
import type { DashboardSpending, DashboardSummary, FiscalDocumentSummaryResponse } from '../api/types.ts';
import { renderApp } from '../test/utils.tsx';
import { DashboardPage } from './DashboardPage.tsx';

vi.mock('../api/dashboard.ts', () => ({
  getDashboardSummary: vi.fn(),
  getDashboardSpending: vi.fn(),
}));
vi.mock('../api/fiscalDocuments.ts', () => ({
  listFiscalDocuments: vi.fn(),
}));
vi.mock('../api/insight.ts', () => ({
  getBasketInsight: vi.fn().mockResolvedValue({
    documentId: 'doc-1',
    seal: 'ATENCAO',
    sealLabel: 'Atenção',
    superfluousShare: '0.2',
    basicShare: '0.3',
    unclassifiedShare: '0.1',
    messages: [],
    categories: [],
  }),
}));

const summary = dashboardApi.getDashboardSummary as ReturnType<typeof vi.fn>;
const spending = dashboardApi.getDashboardSpending as ReturnType<typeof vi.fn>;
const list = fiscalApi.listFiscalDocuments as ReturnType<typeof vi.fn>;

const EMPTY_SPENDING: DashboardSpending = { byMonth: [], byIssuer: [] };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('DashboardPage', () => {
  it('leads with a headline figure and lists recent purchases', async () => {
    summary.mockResolvedValue({
      totalSpent: '328.11',
      receiptCount: 3,
      itemCount: 22,
      resolvedItemCount: 5,
      unresolvedItemCount: 17,
    } satisfies DashboardSummary);
    spending.mockResolvedValue({
      byMonth: [{ month: '2026-09', total: '328.11', receiptCount: 3 }],
      byIssuer: [{ issuerCnpj: '00371046000117', issuerName: 'Mercado Exemplo', total: '328.11', receiptCount: 3 }],
    } satisfies DashboardSpending);
    list.mockResolvedValue([
      {
        id: 'doc-1',
        accessKey: '3'.repeat(44),
        documentNumber: 1,
        series: 1,
        issuedAt: '2026-09-06T14:57:04-03:00',
        issuerCnpj: '00371046000117',
        issuerTradeName: 'Mercado Exemplo',
        totalAmount: '328.11',
        itemCount: 22,
        createdAt: '2026-09-06T15:00:00-03:00',
      },
    ] satisfies FiscalDocumentSummaryResponse[]);

    renderApp(<DashboardPage />);

    expect(await screen.findByText(/Você gastou em setembro/)).toBeInTheDocument();
    expect(screen.getAllByText('R$ 328,11').length).toBeGreaterThan(0);
    expect(screen.getByText(/3 notas · 22 itens no total/)).toBeInTheDocument();
    expect(screen.getByText('Compras recentes')).toBeInTheDocument();
    expect(screen.getAllByText('Mercado Exemplo').length).toBeGreaterThan(0);
  });

  it('shows a warm empty state for a user with no receipts', async () => {
    summary.mockResolvedValue({
      totalSpent: '0',
      receiptCount: 0,
      itemCount: 0,
      resolvedItemCount: 0,
      unresolvedItemCount: 0,
    } satisfies DashboardSummary);
    spending.mockResolvedValue(EMPTY_SPENDING);
    list.mockResolvedValue([]);

    renderApp(<DashboardPage />);

    expect(await screen.findByText('Sua primeira compra começa aqui')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /importar minha primeira nota/i })).toHaveAttribute(
      'href',
      '/importar',
    );
  });

  it('shows an error state with a retry action when the API fails', async () => {
    summary.mockRejectedValue(new Error('boom'));
    spending.mockResolvedValue(EMPTY_SPENDING);
    list.mockResolvedValue([]);

    renderApp(<DashboardPage />);

    expect(await screen.findByText('Deu um problema aqui')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: /tentar de novo/i })).toBeInTheDocument());
  });
});
