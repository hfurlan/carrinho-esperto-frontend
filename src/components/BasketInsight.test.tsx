import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as insightApi from '../api/insight.ts';
import type { BasketInsightResponse } from '../api/types.ts';
import { renderApp } from '../test/utils.tsx';
import { BasketInsight } from './BasketInsight.tsx';

vi.mock('../api/insight.ts', () => ({ getBasketInsight: vi.fn() }));
const getInsight = insightApi.getBasketInsight as ReturnType<typeof vi.fn>;

const INSIGHT: BasketInsightResponse = {
  documentId: 'doc-1',
  seal: 'MUITOS_SUPERFLUOS',
  sealLabel: 'Muitos supérfluos',
  superfluousShare: '0.42',
  basicShare: '0.10',
  unclassifiedShare: '0.08',
  messages: ['42% do valor da nota foi em doces, salgadinhos e bebidas de baixo valor nutricional.'],
  categories: [
    { category: 'DOCE_SUPERFLUO', label: 'Doces e supérfluos', itemCount: 5, totalValue: '42.00', valueShare: '0.42', superfluous: true },
    { category: 'BASICO_IN_NATURA', label: 'Básicos in natura', itemCount: 2, totalValue: '10.00', valueShare: '0.10', superfluous: false },
    { category: 'NAO_CLASSIFICADO', label: 'Não classificado', itemCount: 1, totalValue: '0.00', valueShare: '0.00', superfluous: false },
  ],
};

beforeEach(() => vi.clearAllMocks());

describe('BasketInsight', () => {
  it('shows the seal, the explanation and the category breakdown', async () => {
    getInsight.mockResolvedValue(INSIGHT);
    renderApp(<BasketInsight documentId="doc-1" />);

    expect(await screen.findByText('Muitos supérfluos')).toBeInTheDocument();
    expect(screen.getByText(/42% do valor da nota/)).toBeInTheDocument();
    expect(screen.getByText('Doces e supérfluos')).toBeInTheDocument();
    expect(screen.getByText('Básicos in natura')).toBeInTheDocument();
    // Zero-share buckets are hidden.
    expect(screen.queryByText('Não classificado')).not.toBeInTheDocument();
    expect(screen.getByText('42%')).toBeInTheDocument();
  });

  it('renders nothing intrusive if the insight cannot be loaded', async () => {
    const { ApiError } = await import('../api/client.ts');
    getInsight.mockRejectedValue(new ApiError('server', 500, 'x'));
    const { container } = renderApp(<BasketInsight documentId="doc-1" />);

    // No seal, no crash — the receipt around it is unaffected.
    await new Promise((r) => setTimeout(r, 0));
    expect(container.textContent).not.toContain('Muitos supérfluos');
  });
});
