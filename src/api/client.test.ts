import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, configureClient, request } from './client.ts';

describe('request', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    configureClient({
      getToken: () => null,
      getAnonToken: () => null,
      refresh: async () => null,
      onSessionExpired: () => {},
      onAnonInvalid: () => {},
    });
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

  it('sends the anonymous session header when there is no bearer token', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    configureClient({ getToken: () => null, getAnonToken: () => 'anon-xyz' });

    await request('/api/fiscal-documents');

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers['X-Anon-Session']).toBe('anon-xyz');
    expect(headers.Authorization).toBeUndefined();
  });

  it('prefers the bearer token over the anonymous session header', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    configureClient({ getToken: () => 'a-token', getAnonToken: () => 'anon-xyz' });

    await request('/api/me');

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer a-token');
    expect(headers['X-Anon-Session']).toBeUndefined();
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
