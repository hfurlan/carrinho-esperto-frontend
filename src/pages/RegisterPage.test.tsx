import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { fakeAuth, renderApp } from '../test/utils.tsx';
import type { AuthContextValue } from '../auth/authContext.ts';
import { RegisterPage } from './RegisterPage.tsx';

vi.mock('../auth/config.ts', () => ({
  isCognitoConfigured: () => true,
  cognitoConfig: () => ({ endpoint: 'http://localhost:4566', region: 'us-east-1', clientId: 'test-client' }),
}));

const anon = (overrides: Partial<AuthContextValue> = {}) =>
  fakeAuth({ status: 'anonymous', user: null, ...overrides });

describe('RegisterPage', () => {
  it('is a consumer registration screen with a way back to login', () => {
    renderApp(<RegisterPage />, { auth: anon() });

    expect(
      screen.getByRole('heading', { name: /crie sua conta e comece a acompanhar suas compras/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Criar minha conta' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/login');
    // No admin chrome anywhere.
    expect(screen.queryByText(/admin/i)).not.toBeInTheDocument();
  });

  it('submits e-mail and password to register()', async () => {
    const register = vi.fn().mockResolvedValue(undefined);
    renderApp(<RegisterPage />, { auth: anon({ register }) });

    await userEvent.type(screen.getByLabelText('E-mail'), 'novo@exemplo.com');
    await userEvent.type(screen.getByLabelText('Senha'), 'Segredo123');
    await userEvent.click(screen.getByRole('button', { name: 'Criar minha conta' }));

    await waitFor(() => expect(register).toHaveBeenCalledWith('novo@exemplo.com', 'Segredo123'));
  });

  it('asks for the e-mailed code when confirmation is pending', async () => {
    const confirmRegistration = vi.fn().mockResolvedValue(undefined);
    renderApp(<RegisterPage />, {
      auth: anon({ pendingConfirmation: { email: 'novo@exemplo.com' }, confirmRegistration }),
    });

    expect(screen.getByRole('heading', { name: 'Confirme seu e-mail' })).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Código de confirmação'), '123456');
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar e entrar' }));

    await waitFor(() => expect(confirmRegistration).toHaveBeenCalledWith('123456'));
  });
});
