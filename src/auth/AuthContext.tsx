import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { claimAnonymousSession, createAnonymousSession } from '../api/anonymousSession.ts';
import { configureClient } from '../api/client.ts';
import { getCurrentUser } from '../api/me.ts';
import type { CurrentUserResponse } from '../api/types.ts';
import { AuthContext, type AuthStatus, type AuthUser, type PendingConfirmation } from './authContext.ts';
import {
  CognitoError,
  confirmSignUp as cognitoConfirmSignUp,
  refreshTokens,
  resendConfirmationCode as cognitoResendCode,
  signIn,
  signUp,
  type CognitoTokens,
} from './cognito.ts';
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
  return {
    subject: me.subject ?? '',
    username: me.username,
    groups,
    isAdmin: groups.includes('admin'),
  };
}

/**
 * Owns the session lifecycle and bridges it to the HTTP client (via
 * `configureClient`). Two kinds of session (M006.1): a Cognito session
 * (persistent) and an anonymous trial (browser‑scoped). A Cognito session always
 * wins. On any successful sign‑in / registration the current trial's receipts
 * are claimed into the account (M006.2) before the trial token is dropped.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [anonSession, setAnonSession] = useState<{ token: string } | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation | null>(null);

  const tokensRef = useRef<CognitoTokens | null>(null);
  const anonTokenRef = useRef<string | null>(null);
  const refreshInFlight = useRef<Promise<string | null> | null>(null);
  const anonStartInFlight = useRef<Promise<void> | null>(null);
  const pendingCredsRef = useRef<{ email: string; password: string } | null>(null);

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
    pendingCredsRef.current = null;
    setPendingConfirmation(null);
    setUser(null);
    setStatus('anonymous');
  }, [applyTokens, endAnonymousSession]);

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

  useEffect(() => {
    let cancelled = false;
    const stored = loadTokens();

    if (!stored) {
      const anon = loadAnonToken();
      if (anon) {
        anonTokenRef.current = anon;
        setAnonSession({ token: anon });
      }
      setStatus('anonymous');
      return;
    }

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

  /** Finish any successful token grant: claim the trial, load the identity. */
  const finishAuth = useCallback(
    async (tokens: CognitoTokens) => {
      applyTokens(tokens);
      const trialToken = anonTokenRef.current;
      if (trialToken) {
        await claimAnonymousSession(trialToken).catch(() => undefined);
      }
      endAnonymousSession();
      pendingCredsRef.current = null;
      setPendingConfirmation(null);
      const me = await getCurrentUser();
      setUser(buildUser(me, tokens.accessToken));
      setStatus('authenticated');
    },
    [applyTokens, endAnonymousSession],
  );

  const login = useCallback(
    async (username: string, password: string) => {
      await finishAuth(await signIn(username, password));
    },
    [finishAuth],
  );

  const register = useCallback(
    async (email: string, password: string) => {
      await signUp(email, password);
      try {
        await finishAuth(await signIn(email, password));
      } catch (err) {
        if (err instanceof CognitoError && err.code === 'UserNotConfirmedException') {
          pendingCredsRef.current = { email, password };
          setPendingConfirmation({ email });
          return;
        }
        throw err;
      }
    },
    [finishAuth],
  );

  const confirmRegistration = useCallback(
    async (code: string) => {
      const creds = pendingCredsRef.current;
      if (!creds) throw new Error('Nenhum cadastro aguardando confirmação.');
      await cognitoConfirmSignUp(creds.email, code);
      await finishAuth(await signIn(creds.email, creds.password));
    },
    [finishAuth],
  );

  const resendConfirmationCode = useCallback(async () => {
    const creds = pendingCredsRef.current;
    if (creds) await cognitoResendCode(creds.email);
  }, []);

  const value = useMemo(
    () => ({
      status,
      user,
      anonSession,
      login,
      logout,
      startAnonymousSession,
      endAnonymousSession,
      register,
      pendingConfirmation,
      confirmRegistration,
      resendConfirmationCode,
    }),
    [
      status,
      user,
      anonSession,
      login,
      logout,
      startAnonymousSession,
      endAnonymousSession,
      register,
      pendingConfirmation,
      confirmRegistration,
      resendConfirmationCode,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
