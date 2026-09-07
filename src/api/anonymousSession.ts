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

/**
 * POST /api/anonymous-sessions/claim — move the trial session's receipts into
 * the now-authenticated account (M006.2). Sends the bearer token AND the trial
 * token together. Best-effort: the UI calls it right after a successful auth.
 */
export function claimAnonymousSession(anonSessionToken: string): Promise<{ movedReceipts: number }> {
  return request('/api/anonymous-sessions/claim', { method: 'POST', anonSessionToken });
}
