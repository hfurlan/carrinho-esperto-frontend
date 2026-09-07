import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createAnonymousSession } from '../api/anonymousSession.ts';
import { configureClient } from '../api/client.ts';
import { getCurrentUser } from '../api/me.ts';
import type { CurrentUserResponse } from '../api/types.ts';
import { AuthContext, type AuthStatus, type AuthUser } from './authContext.ts';
import { refreshTokens, signIn, type CognitoTokens } from './cognito.ts';
import { readGroups } from './jwt.ts';
import {
  clearAnonToken,
  clearTokens,
  loadAnonToken,
  loadTokens,
  saveAnonToken,
  saveTokens,
} from './tokenStore.ts';

function buildUser(me: CurrentUserResponse, accessToken: string | undefined): AuthUser {
  const groups = readGroups(accessToken);
  return { subject: me.subject, username: me.username, groups, isAdmin: groups.includes('admin') };
}

/**
 * Owns the session lifecycle and bridges it to the HTTP client. The client never
 * imports React state directly — it receives `getToken` / `getAnonToken` /
 * `refresh` / `onSessionExpired` / `onAnonInvalid` callbacks through
 * `configureClient`, so a 401 anywhere in the app funnels back here.
 *
 * Two kinds of session (M006.1): a Cognito session (persistent, owner-scoped)
 * and an anonymous trial session (browser-scoped, no account). A Cognito session
 * always wins — the anonymous token is dropped the moment one exists.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [anonSession, setAnonSession] = useState<{ token: string } | null>(null);

  // Source of truth for the token during a tab's lifetime; localStorage is the
  // durable mirror. A ref (not state) so the client's synchronous getToken()
  // always sees the latest value without a re-render race.
  const tokensRef = useRef<CognitoTokens | null>(null);
  const anonTokenRef = useRef<string | null>(null);
  const refreshInFlight = useRef<Promise<string | null> | null>(null);
  const anonStartInFlight = useRef<Promise<void> | null>(null);

  const applyTokens = useCallback((next: CognitoTokens | null) => {
    tokensRef.current = next;
    if (next) saveTokens(next);
    else clearTokens();
  }, []);

  const endAnonymousSession = useCallback(() => {
    anonTokenRef.current = null;
    clearAnonToken();
    setAnonSession(null);
  }, []);

  const startAnonymousSession = useCallback(async () => {
    if (anonTokenRef.current) return;
    if (anonStartInFlight.current) return anonStartInFlight.current;
    const attempt = (async () => {
      try {
        const { token } = await createAnonymousSession();
        anonTokenRef.current = token;
        saveAnonToken(token);
        setAnonSession({ token });
      } finally {
        anonStartInFlight.current = null;
      }
    })();
    anonStartInFlight.current = attempt;
    return attempt;
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
    endAnonymousSession();
    setUser(null);
    setStatus('anonymous');
  }, [applyTokens, endAnonymousSession]);

  // Wire the client exactly once. The callbacks read refs / stable fns.
  useEffect(() => {
    configureClient({
      getToken: () => tokensRef.current?.accessToken ?? null,
      getAnonToken: () => anonTokenRef.current,
      refresh: doRefresh,
      onSessionExpired: () => {
        applyTokens(null);
        setUser(null);
        setStatus('expired');
      },
      onAnonInvalid: () => {
        endAnonymousSession();
      },
    });
  }, [applyTokens, doRefresh, endAnonymousSession]);

  // Restore a persisted session on first mount.
  useEffect(() => {
    let cancelled = false;
    const stored = loadTokens();

    if (!stored) {
      // No Cognito session — an anonymous trial may still be in progress.
      const anon = loadAnonToken();
      if (anon) {
        anonTokenRef.current = anon;
        setAnonSession({ token: anon });
      }
      setStatus('anonymous');
      return;
    }

    // A Cognito session always wins; drop any stale anonymous token.
    clearAnonToken();
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
        setUser(buildUser(me, tokensRef.current?.accessToken));
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
      endAnonymousSession();
      const me = await getCurrentUser();
      setUser(buildUser(me, tokens.accessToken));
      setStatus('authenticated');
    },
    [applyTokens, endAnonymousSession],
  );

  const value = useMemo(
    () => ({ status, user, anonSession, login, logout, startAnonymousSession, endAnonymousSession }),
    [status, user, anonSession, login, logout, startAnonymousSession, endAnonymousSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
