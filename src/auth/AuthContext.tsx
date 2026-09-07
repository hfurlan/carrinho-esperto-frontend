import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { configureClient } from '../api/client.ts';
import { getCurrentUser } from '../api/me.ts';
import { AuthContext, type AuthStatus, type AuthUser } from './authContext.ts';
import { refreshTokens, signIn, type CognitoTokens } from './cognito.ts';
import { clearTokens, loadTokens, saveTokens } from './tokenStore.ts';

/**
 * Owns the session lifecycle and bridges it to the HTTP client. The client never
 * imports React state directly — it receives `getToken` / `refresh` /
 * `onSessionExpired` callbacks through `configureClient`, so a 401 anywhere in
 * the app funnels back here.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);

  // Source of truth for the token during a tab's lifetime; localStorage is the
  // durable mirror. A ref (not state) so the client's synchronous getToken()
  // always sees the latest value without a re-render race.
  const tokensRef = useRef<CognitoTokens | null>(null);
  const refreshInFlight = useRef<Promise<string | null> | null>(null);

  const applyTokens = useCallback((next: CognitoTokens | null) => {
    tokensRef.current = next;
    if (next) saveTokens(next);
    else clearTokens();
  }, []);

  const doRefresh = useCallback(async (): Promise<string | null> => {
    if (refreshInFlight.current) return refreshInFlight.current;
    const current = tokensRef.current;
    if (!current?.refreshToken) return null;

    const attempt = (async () => {
      try {
        const next = await refreshTokens(current.refreshToken as string);
        applyTokens(next);
        return next.accessToken;
      } catch {
        applyTokens(null);
        return null;
      } finally {
        refreshInFlight.current = null;
      }
    })();
    refreshInFlight.current = attempt;
    return attempt;
  }, [applyTokens]);

  const logout = useCallback(() => {
    applyTokens(null);
    setUser(null);
    setStatus('anonymous');
  }, [applyTokens]);

  // Wire the client exactly once. The callbacks read refs / stable fns.
  useEffect(() => {
    configureClient({
      getToken: () => tokensRef.current?.accessToken ?? null,
      refresh: doRefresh,
      onSessionExpired: () => {
        applyTokens(null);
        setUser(null);
        setStatus('expired');
      },
    });
  }, [applyTokens, doRefresh]);

  // Restore a persisted session on first mount.
  useEffect(() => {
    let cancelled = false;
    const stored = loadTokens();
    if (!stored) {
      setStatus('anonymous');
      return;
    }
    tokensRef.current = stored;

    (async () => {
      if (stored.expiresAt <= Date.now()) {
        const refreshed = await doRefresh();
        if (!refreshed) {
          if (!cancelled) setStatus('anonymous');
          return;
        }
      }
      try {
        const me = await getCurrentUser();
        if (cancelled) return;
        setUser(me);
        setStatus('authenticated');
      } catch {
        if (cancelled) return;
        applyTokens(null);
        setStatus('anonymous');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [applyTokens, doRefresh]);

  const login = useCallback(
    async (username: string, password: string) => {
      const tokens = await signIn(username, password);
      applyTokens(tokens);
      const me = await getCurrentUser();
      setUser(me);
      setStatus('authenticated');
    },
    [applyTokens],
  );

  const value = useMemo(() => ({ status, user, login, logout }), [status, user, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
