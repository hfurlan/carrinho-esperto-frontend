import { request } from './client.ts';
import type { AnonymousSessionResponse } from './types.ts';

/**
 * POST /api/anonymous-sessions — start an anonymous trial session (M006.1). The
 * only unauthenticated write in the API. Returns a one-time token the browser
 * then sends as the `X-Anon-Session` header.
 */
export function createAnonymousSession(): Promise<AnonymousSessionResponse> {
  return request<AnonymousSessionResponse>('/api/anonymous-sessions', { method: 'POST' });
}
