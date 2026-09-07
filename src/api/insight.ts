import { request } from './client.ts';
import type { BasketInsightResponse } from './types.ts';

/**
 * GET /api/fiscal-documents/{id}/insight — the receipt grouped into categories
 * with a health seal (M006.1). Works for an authenticated user and an anonymous
 * trial session alike; scoped to the caller.
 */
export function getBasketInsight(
  documentId: string,
  signal?: AbortSignal,
): Promise<BasketInsightResponse> {
  return request<BasketInsightResponse>(`/api/fiscal-documents/${documentId}/insight`, { signal });
}
