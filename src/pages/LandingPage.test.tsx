import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { fakeTrialAuth, renderApp } from '../test/utils.tsx';
import { LandingPage } from './LandingPage.tsx';

describe('LandingPage', () => {
  it('leads with the trial CTA, not sign in', () => {
    renderApp(<LandingPage />, { auth: fakeTrialAuth({ anonSession: null }) });

    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toHaveTextContent('Experimente com sua nota');
    // "Entrar" is present but secondary (a link, not the primary action).
    expect(screen.getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/login');
    expect(screen.queryByRole('button', { name: /entrar|criar conta/i })).not.toBeInTheDocument();
  });

  it('starts an anonymous session and goes to import', async () => {
    const startAnonymousSession = vi.fn().mockResolvedValue(undefined);
    renderApp(<LandingPage />, {
      route: '/',
      path: '/',
      auth: fakeTrialAuth({ anonSession: null, startAnonymousSession }),
    });

    await userEvent.click(screen.getByRole('button', { name: 'Experimente com sua nota' }));

    await waitFor(() => expect(startAnonymousSession).toHaveBeenCalledOnce());
  });
});
