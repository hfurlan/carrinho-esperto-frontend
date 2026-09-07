import { createContext, useContext } from 'react';

/**
 * Four session states:
 *   - loading:       restoring a persisted session on first paint
 *   - anonymous:     no session — show the login page
 *   - authenticated: a valid access token is in hand
 *   - expired:       had a session, refresh failed — prompt re-login without
 *                    losing the current route
 */
export type AuthStatus = 'loading' | 'anonymous' | 'authenticated' | 'expired';

export interface AuthUser {
  subject: string;
  username: string | null;
  /** Cognito groups from the access token's `cognito:groups` claim. */
  groups: string[];
  /** Convenience: member of the `admin` group. The backend still enforces every admin route. */
  isAdmin: boolean;
}

/** A registration awaiting the e-mailed confirmation code (real Cognito path). */
export interface PendingConfirmation {
  email: string;
}

export interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  /**
   * Anonymous trial session (M006.1). Non-null when the visitor is trying the
   * product without an account. Always null while `status === 'authenticated'`.
   */
  anonSession: { token: string } | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  /** Start (or reuse) an anonymous trial session. Resolves once it is usable. */
  startAnonymousSession: () => Promise<void>;
  /** Discard the anonymous trial session (also done automatically on login). */
  endAnonymousSession: () => void;
  /**
   * Register and sign in (M006.2). On a pool that auto-confirms (local
   * MiniStack) this authenticates directly; on a real Cognito that needs email
   * confirmation it resolves with {@link pendingConfirmation} set instead.
   */
  register: (email: string, password: string) => Promise<void>;
  /** Set while a just-registered account still needs its confirmation code. */
  pendingConfirmation: PendingConfirmation | null;
  /** Confirm the pending registration with its code, then sign in. */
  confirmRegistration: (code: string) => Promise<void>;
  /** Re-send the confirmation code for the pending registration. */
  resendConfirmationCode: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used within <AuthProvider>');
  }
  return value;
}
