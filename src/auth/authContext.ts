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

export interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used within <AuthProvider>');
  }
  return value;
}
