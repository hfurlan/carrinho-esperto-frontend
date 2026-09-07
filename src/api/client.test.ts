import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, configureClient, request } from './client.ts';

describe('request', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    configureClient({ getToken: () => null, refresh: async () => null, onSessionExpired: () => {} });
  });

  it('attaches the bearer token when one is configured', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    configureClient({ getToken: () => 'a-token' });

    await request('/api/me');

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer a-token');
  });

  it('maps a 404 to a typed ApiError', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 404 })),
    );

    await expect(request('/api/missing')).rejects.toMatchObject({
      kind: 'not-found',
      status: 404,
    } satisfies Partial<ApiError>);
  });
});
