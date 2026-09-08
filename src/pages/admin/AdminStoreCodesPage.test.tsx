import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as adminApi from '../../api/admin.ts';
import { ApiError } from '../../api/client.ts';
import type { CatalogProduct, StoreProductCodeRow } from '../../api/types.ts';
import { renderApp } from '../../test/utils.tsx';
import { AdminStoreCodesPage } from './AdminStoreCodesPage.tsx';

vi.mock('../../api/admin.ts', () => ({
  listStoreProductCodes: vi.fn(),
  createStoreProductCode: vi.fn(),
  updateStoreProductCode: vi.fn(),
  deleteStoreProductCode: vi.fn(),
  listAdminCatalogProducts: vi.fn(),
}));

const listCodes = adminApi.listStoreProductCodes as ReturnType<typeof vi.fn>;
const createCode = adminApi.createStoreProductCode as ReturnType<typeof vi.fn>;
const deleteCode = adminApi.deleteStoreProductCode as ReturnType<typeof vi.fn>;
const listProducts = adminApi.listAdminCatalogProducts as ReturnType<typeof vi.fn>;

const ROW: StoreProductCodeRow = {
  id: 'map-1',
  storeId: '00371046000117',
  code: 'ABC123',
  canonicalProductId: 'prod-1',
  canonicalProductName: 'Arroz Camil Tipo 1 5 kg',
  createdAt: '2026-09-06T12:00:00-03:00',
  updatedAt: '2026-09-06T12:00:00-03:00',
};
const PRODUCT: CatalogProduct = {
  id: 'prod-9',
  canonicalName: 'Feijão Carioca Camil 1 kg',
  brandId: null,
  manufacturerId: null,
  categoryId: null,
  subcategoryId: null,
  productFamilyId: null,
  gtin: null,
  packageQuantity: null,
  packageUnit: null,
  packagingType: null,
  createdAt: '',
  updatedAt: '',
};

beforeEach(() => {
  vi.clearAllMocks();
  listProducts.mockResolvedValue([PRODUCT]);
});

describe('AdminStoreCodesPage', () => {
  it('lists the store product code mappings', async () => {
    listCodes.mockResolvedValue([ROW]);
    renderApp(<AdminStoreCodesPage />);

    expect(await screen.findByText('00371046000117')).toBeInTheDocument();
    expect(screen.getByText('ABC123')).toBeInTheDocument();
    expect(screen.getByText('Arroz Camil Tipo 1 5 kg')).toBeInTheDocument();
  });

  it('creates a mapping: CNPJ + cProd + a product picked from a catalog search', async () => {
    listCodes.mockResolvedValue([]);
    createCode.mockResolvedValue(ROW);
    renderApp(<AdminStoreCodesPage />);
    await screen.findByText('Novo mapeamento');

    await userEvent.type(screen.getByLabelText('CNPJ da loja'), '00.371.046/0001-17');
    await userEvent.type(screen.getByLabelText('cProd'), 'ABC123');
    await userEvent.type(screen.getByLabelText('Produto canônico'), 'feij');
    await userEvent.click(screen.getByRole('button', { name: 'Buscar' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Feijão Carioca Camil 1 kg' }));

    const add = screen.getByRole('button', { name: 'Adicionar' });
    await waitFor(() => expect(add).toBeEnabled());
    await userEvent.click(add);

    await waitFor(() =>
      expect(createCode).toHaveBeenCalledWith({
        storeId: '00.371.046/0001-17',
        code: 'ABC123',
        canonicalProductId: 'prod-9',
      }),
    );
  });

  it('shows the backend message when a mapping conflicts', async () => {
    listCodes.mockResolvedValue([]);
    createCode.mockRejectedValue(new ApiError('conflict', 409, 'Store 00371046000117 code ABC123 is already mapped.'));
    renderApp(<AdminStoreCodesPage />);
    await screen.findByText('Novo mapeamento');

    await userEvent.type(screen.getByLabelText('CNPJ da loja'), '00371046000117');
    await userEvent.type(screen.getByLabelText('cProd'), 'ABC123');
    await userEvent.type(screen.getByLabelText('Produto canônico'), 'x');
    await userEvent.click(screen.getByRole('button', { name: 'Buscar' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Feijão Carioca Camil 1 kg' }));
    await userEvent.click(screen.getByRole('button', { name: 'Adicionar' }));

    expect(await screen.findByText(/already mapped/)).toBeInTheDocument();
  });

  it('removes a mapping after confirmation', async () => {
    listCodes.mockResolvedValue([ROW]);
    deleteCode.mockResolvedValue(undefined);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderApp(<AdminStoreCodesPage />);
    await screen.findByText('ABC123');

    await userEvent.click(screen.getByRole('button', { name: 'Remover' }));
    await waitFor(() => expect(deleteCode).toHaveBeenCalledWith('map-1'));
  });
});
