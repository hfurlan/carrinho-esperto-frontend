import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppLayout } from './AppLayout.tsx';
import { fakeAuth, renderApp } from '../test/utils.tsx';

describe('AppLayout', () => {
  it('shows the primary consumer navigation', () => {
    renderApp(<AppLayout />);
    expect(screen.getAllByRole('link', { name: /compras/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /importar/i }).length).toBeGreaterThan(0);
  });

  it('hides the admin entry for non-admin users', () => {
    renderApp(<AppLayout />, { auth: fakeAuth() });
    expect(screen.queryByRole('link', { name: 'Admin' })).not.toBeInTheDocument();
  });

  it('shows the admin entry for admins', () => {
    renderApp(<AppLayout />, {
      auth: fakeAuth({ user: { subject: 's', username: 'a', groups: ['admin'], isAdmin: true } }),
    });
    expect(screen.getByRole('link', { name: 'Admin' })).toHaveAttribute('href', '/admin');
  });
});
