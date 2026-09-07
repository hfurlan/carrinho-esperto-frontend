import { request } from './client.ts';
import type { DocumentItemResolution } from './types.ts';

/** GET /api/fiscal-documents/{id}/resolutions — resolution state of every item. */
export function getDocumentResolutions(
  documentId: string,
  signal?: AbortSignal,
): Promise<DocumentItemResolution[]> {
  return request<DocumentItemResolution[]>(`/api/fiscal-documents/${documentId}/resolutions`, { signal });
}

/** POST /api/fiscal-documents/{id}/resolutions — (re-)resolve every item of the receipt. Idempotent. */
export function resolveDocument(documentId: string): Promise<DocumentItemResolution[]> {
  return request<DocumentItemResolution[]>(`/api/fiscal-documents/${documentId}/resolutions`, {
    method: 'POST',
  });
}
