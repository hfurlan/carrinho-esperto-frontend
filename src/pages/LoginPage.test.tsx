import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { fakeAuth, renderApp } from '../test/utils.tsx';
import type { AuthContextValue } from '../auth/authContext.ts';
import { LoginPage } from './LoginPage.tsx';

vi.mock('../auth/config.ts', () => ({
  isCognitoConfigured: () => true,
  cognitoConfig: () => ({ endpoint: 'http://localhost:4566', region: 'us-east-1', clientId: 'test-client' }),
}));

const anon = (overrides: Partial<AuthContextValue> = {}) =>
  fakeAuth({ status: 'anonymous', user: null, ...overrides });

describe('LoginPage', () => {
  it('is a consumer login screen with a way to register', () => {
    renderApp(<LoginPage />, { auth: anon() });

    expect(screen.getByRole('heading', { name: /entre para continuar acompanhando suas compras/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Criar minha conta' })).toHaveAttribute('href', '/cadastro');
    expect(screen.queryByText(/admin/i)).not.toBeInTheDocument();
  });

  it('submits credentials to login()', async () => {
    const login = vi.fn().mockResolvedValue(undefined);
    renderApp(<LoginPage />, { auth: anon({ login }) });

    await userEvent.type(screen.getByLabelText('E-mail'), 'dev@exemplo.com');
    await userEvent.type(screen.getByLabelText('Senha'), 'Devpass123');
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => expect(login).toHaveBeenCalledWith('dev@exemplo.com', 'Devpass123'));
  });
});
