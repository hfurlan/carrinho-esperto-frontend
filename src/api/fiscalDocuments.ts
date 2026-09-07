import { request } from './client.ts';
import type { FiscalDocumentResponse, FiscalDocumentSummaryResponse } from './types.ts';

/** GET /api/fiscal-documents — the caller's receipts, newest issued first. */
export function listFiscalDocuments(signal?: AbortSignal): Promise<FiscalDocumentSummaryResponse[]> {
  return request<FiscalDocumentSummaryResponse[]>('/api/fiscal-documents', { signal });
}

/** GET /api/fiscal-documents/{id} — full receipt with items and payments. */
export function getFiscalDocument(id: string, signal?: AbortSignal): Promise<FiscalDocumentResponse> {
  return request<FiscalDocumentResponse>(`/api/fiscal-documents/${id}`, { signal });
}

/** POST /api/fiscal-documents/import — import a receipt from its NFC-e QR URL. */
export function importFiscalDocument(qrCodeUrl: string): Promise<FiscalDocumentResponse> {
  return request<FiscalDocumentResponse>('/api/fiscal-documents/import', {
    method: 'POST',
    body: { qrCodeUrl },
  });
}
