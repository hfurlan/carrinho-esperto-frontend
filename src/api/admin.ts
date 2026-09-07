import { request } from './client.ts';
import type {
  AdminDashboard,
  AdminFiscalDocumentRow,
  AdminFiscalItemRow,
  AdminResolutionRow,
  CatalogProduct,
  FiscalDocumentResponse,
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
