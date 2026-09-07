/*
 * The single HTTP entry point for the whole app. Every call to the backend goes
 * through `request()`:
 *   - prepend VITE_API_BASE_URL;
 *   - attach the bearer token when present;
 *   - serialise/parse JSON;
 *   - normalise every non-2xx response into a typed ApiError;
 *   - notify the auth layer on 401 so it can try a refresh / expire the session.
 *
 * The auth layer wires itself in with `configureClient()` — this keeps the
 * client free of any import cycle with the React context.
 */

const DEFAULT_BASE_URL = 'http://localhost:8080';

export type ApiErrorKind =
  | 'unauthorized' // 401
  | 'forbidden' // 403
  | 'not-found' // 404
  | 'conflict' // 409
  | 'validation' // 400
  | 'server' // 500 and other 5xx
  | 'network' // fetch threw — backend unreachable
  | 'unknown';

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number;
  readonly body: unknown;

  constructor(kind: ApiErrorKind, status: number, message: string, body?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
    this.body = body;
  }
}

interface ClientHooks {
  getToken: () => string | null;
  /** Anonymous trial session token (M006.1), sent when there is no bearer token. */
  getAnonToken: () => string | null;
  /** Attempt a token refresh. Resolves to a fresh token or null if it failed. */
  refresh: () => Promise<string | null>;
  /** Called when a request is definitively unauthenticated (refresh failed). */
  onSessionExpired: () => void;
  /** Called when the anonymous trial session is rejected by the backend (401). */
  onAnonInvalid: () => void;
}

let hooks: ClientHooks = {
  getToken: () => null,
  getAnonToken: () => null,
  refresh: async () => null,
  onSessionExpired: () => {},
  onAnonInvalid: () => {},
};

export function configureClient(next: Partial<ClientHooks>): void {
  hooks = { ...hooks, ...next };
}

export function apiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL;
  // Undefined → dev fallback. Explicitly set (including an empty string) → use it
  // verbatim; empty means "same origin", so requests go to a relative `/api/...`
  // path (e.g. served through the Vite HTTPS dev proxy).
  if (configured === undefined) return DEFAULT_BASE_URL;
  return configured.replace(/\/+$/, '');
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  /** Plain object → JSON body. FormData → sent as-is (multipart upload). */
  body?: unknown;
  signal?: AbortSignal;
  /**
   * Send this as `X-Anon-Session` **in addition to** the bearer token — used by
   * the account claim (M006.2), the one call that needs both credentials.
   */
  anonSessionToken?: string;
  /** Internal: set once we have already retried after a refresh. */
  _retried?: boolean;
}

function kindForStatus(status: number): ApiErrorKind {
  switch (status) {
    case 400:
      return 'validation';
    case 401:
      return 'unauthorized';
    case 403:
      return 'forbidden';
    case 404:
      return 'not-found';
    case 409:
      return 'conflict';
    default:
      return status >= 500 ? 'server' : 'unknown';
  }
}

function messageForKind(kind: ApiErrorKind, fallback: string): string {
  switch (kind) {
    case 'unauthorized':
      return 'Sua sessão expirou. Entre novamente.';
    case 'forbidden':
      return 'Você não tem acesso a este recurso.';
    case 'not-found':
      return 'Recurso não encontrado.';
    case 'conflict':
      return fallback || 'Conflito ao processar a requisição.';
    case 'validation':
      return fallback || 'Requisição inválida.';
    case 'server':
      return 'Erro interno no servidor. Tente novamente mais tarde.';
    case 'network':
      return 'Não foi possível conectar ao servidor.';
    default:
      return fallback || 'Erro inesperado.';
  }
}

async function parseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? '';
  if (response.status === 204 || !contentType) return null;
  if (contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }
  try {
    return await response.text();
  } catch {
    return null;
  }
}

function extractServerMessage(body: unknown): string {
  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>;
    for (const key of ['message', 'detail', 'error']) {
      const value = record[key];
      if (typeof value === 'string' && value.trim()) return value;
    }
  }
  if (typeof body === 'string' && body.trim()) return body;
  return '';
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, signal } = options;
  const isForm = body instanceof FormData;

  const headers: Record<string, string> = {};
  const token = hooks.getToken();
  const passiveAnon = token || options.anonSessionToken ? null : hooks.getAnonToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.anonSessionToken) headers['X-Anon-Session'] = options.anonSessionToken;
  else if (passiveAnon) headers['X-Anon-Session'] = passiveAnon;
  if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json';

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl()}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError('network', 0, messageForKind('network', ''));
  }

  if (response.ok) {
    return (await parseBody(response)) as T;
  }

  // 401 → for a Cognito session, try one refresh then retry; for an anonymous
  // trial session, the token is simply no longer valid.
  if (response.status === 401 && !options._retried) {
    if (token) {
      const refreshed = await hooks.refresh();
      if (refreshed) {
        return request<T>(path, { ...options, _retried: true });
      }
      hooks.onSessionExpired();
    } else if (passiveAnon) {
      hooks.onAnonInvalid();
    }
  }

  const parsed = await parseBody(response);
  const kind = kindForStatus(response.status);
  const serverMessage = extractServerMessage(parsed);
  throw new ApiError(kind, response.status, messageForKind(kind, serverMessage), parsed);
}
