import { request } from './client.ts';
import type {
  AdminDashboard,
  AdminFiscalDocumentRow,
  AdminFiscalItemRow,
  AdminResolutionRow,
  CatalogProduct,
  DocumentItemResolution,
  FiscalDocumentResponse,
  StoreProductCodeRow,
} from './types.ts';

/** All routes require ROLE_ADMIN — the backend returns 403 otherwise. */

export function getAdminDashboard(signal?: AbortSignal): Promise<AdminDashboard> {
  return request<AdminDashboard>('/api/admin/dashboard', { signal });
}

export function listAdminFiscalDocuments(signal?: AbortSignal): Promise<AdminFiscalDocumentRow[]> {
  return request<AdminFiscalDocumentRow[]>('/api/admin/fiscal-documents', { signal });
}

export function getAdminFiscalDocument(id: string, signal?: AbortSignal): Promise<FiscalDocumentResponse> {
  return request<FiscalDocumentResponse>(`/api/admin/fiscal-documents/${id}`, { signal });
}

export function listAdminFiscalItems(signal?: AbortSignal): Promise<AdminFiscalItemRow[]> {
  return request<AdminFiscalItemRow[]>('/api/admin/fiscal-items', { signal });
}

export function listAdminResolutions(signal?: AbortSignal): Promise<AdminResolutionRow[]> {
  return request<AdminResolutionRow[]>('/api/admin/resolutions', { signal });
}

export function listAdminCatalogProducts(name?: string, signal?: AbortSignal): Promise<CatalogProduct[]> {
  const query = name && name.trim() ? `?name=${encodeURIComponent(name.trim())}` : '';
  return request<CatalogProduct[]>(`/api/admin/catalog/products${query}`, { signal });
}

// ── Store vocabulary — (store, cProd) -> product (M007) ────────────────────

export function listStoreProductCodes(
  filters: { storeId?: string; code?: string } = {},
  signal?: AbortSignal,
): Promise<StoreProductCodeRow[]> {
  const params = new URLSearchParams();
  if (filters.storeId?.trim()) params.set('storeId', filters.storeId.trim());
  if (filters.code?.trim()) params.set('code', filters.code.trim());
  const query = params.toString();
  return request<StoreProductCodeRow[]>(`/api/admin/store-product-codes${query ? `?${query}` : ''}`, { signal });
}

export function createStoreProductCode(body: {
  storeId: string;
  code: string;
  canonicalProductId: string;
}): Promise<StoreProductCodeRow> {
  return request<StoreProductCodeRow>('/api/admin/store-product-codes', { method: 'POST', body });
}

export function updateStoreProductCode(id: string, canonicalProductId: string): Promise<StoreProductCodeRow> {
  return request<StoreProductCodeRow>(`/api/admin/store-product-codes/${id}`, {
    method: 'PUT',
    body: { canonicalProductId },
  });
}

export function deleteStoreProductCode(id: string): Promise<void> {
  return request<void>(`/api/admin/store-product-codes/${id}`, { method: 'DELETE' });
}

/** Re-run resolution for every item of a document (M007) — reflects new store mappings. */
export function reRunAdminResolution(documentId: string): Promise<DocumentItemResolution[]> {
  return request<DocumentItemResolution[]>(`/api/admin/fiscal-documents/${documentId}/resolutions`, {
    method: 'POST',
  });
}
