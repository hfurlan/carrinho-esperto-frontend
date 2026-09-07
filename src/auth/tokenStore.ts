/*
 * Persists the Cognito tokens for the current browser only. localStorage is used
 * so a page reload keeps the session; it holds an access token and a refresh
 * token, never anything from the backend or any provider secret.
 */

import type { CognitoTokens } from './cognito.ts';

const KEY = 'carrinho-esperto.auth';

export function loadTokens(): CognitoTokens | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CognitoTokens>;
    if (typeof parsed.accessToken !== 'string' || typeof parsed.expiresAt !== 'number') {
      return null;
    }
    return {
      accessToken: parsed.accessToken,
      expiresAt: parsed.expiresAt,
      refreshToken: typeof parsed.refreshToken === 'string' ? parsed.refreshToken : undefined,
    };
  } catch {
    return null;
  }
}

export function saveTokens(tokens: CognitoTokens): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(tokens));
  } catch {
    /* private mode / quota — the in-memory copy still works for this tab */
  }
}

export function clearTokens(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
