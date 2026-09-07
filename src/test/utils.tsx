import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthContext, type AuthContextValue } from '../auth/authContext.ts';

export function fakeAuth(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    status: 'authenticated',
    user: { subject: 'sub-1', username: 'dev@carrinho-esperto.local', groups: [], isAdmin: false },
    login: async () => {},
    logout: () => {},
    ...overrides,
  };
}

interface Options {
  route?: string;
  path?: string;
  auth?: AuthContextValue;
}

/** Renders `ui` inside a router + a stubbed auth context. */
export function renderApp(ui: ReactElement, { route = '/', path = '/', auth = fakeAuth() }: Options = {}) {
  return render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path={path} element={ui} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}
