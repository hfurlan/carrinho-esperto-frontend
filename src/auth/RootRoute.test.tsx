import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { App } from '../App.tsx';
import { fakeTrialAuth, fakeAuth } from '../test/utils.tsx';
import { AuthContext, type AuthContextValue } from './authContext.ts';

function renderAt(route: string, auth: AuthContextValue) {
  return render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter initialEntries={[route]}>
        <App />
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

const NO_SESSION = fakeAuth({ status: 'anonymous', user: null, anonSession: null });

describe('consumer routing (M006.1)', () => {
  it('shows the public landing page at / when there is no session', () => {
    renderAt('/', NO_SESSION);
    expect(screen.getByRole('button', { name: 'Experimente com sua nota fiscal' })).toBeInTheDocument();
  });

  it('lets an anonymous trial session reach the import page without logging in', () => {
    renderAt('/importar', fakeTrialAuth());
    expect(screen.getByRole('heading', { name: 'Adicionar nota fiscal' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ler QR Code com a câmera' })).toBeInTheDocument();
  });

  it('bounces a sessionless visitor from a deep route back to the landing page', () => {
    renderAt('/importar', NO_SESSION);
    expect(screen.queryByRole('heading', { name: 'Adicionar nota fiscal' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Experimente com sua nota fiscal' })).toBeInTheDocument();
  });
});
