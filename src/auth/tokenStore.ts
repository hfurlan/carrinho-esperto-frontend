/*
 * Persists the Cognito tokens for the current browser only. localStorage is used
 * so a page reload keeps the session; it holds an access token and a refresh
 * token, never anything from the backend or any provider secret.
 */

import type { CognitoTokens } from './cognito.ts';

const KEY = 'carrinho-esperto.auth';
const ANON_KEY = 'carrinho-esperto.anon';

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

/*
 * Anonymous trial session token (M006.1). Same browser-only persistence as the
 * Cognito tokens: it is an opaque bearer credential for this browser's trial
 * data, nothing more. A future milestone owns account conversion; for now the
 * data simply lives against this token.
 */

export function loadAnonToken(): string | null {
  try {
    const raw = localStorage.getItem(ANON_KEY);
    return raw && raw.trim().length > 0 ? raw : null;
  } catch {
    return null;
  }
}

export function saveAnonToken(token: string): void {
  try {
    localStorage.setItem(ANON_KEY, token);
  } catch {
    /* private mode / quota — the in-memory copy still works for this tab */
  }
}

export function clearAnonToken(): void {
  try {
    localStorage.removeItem(ANON_KEY);
  } catch {
    /* ignore */
  }
}
