import { request } from './client.ts';
import type { CurrentUserResponse } from './types.ts';

/** GET /api/me — identity derived from the validated JWT (never from the client). */
export function getCurrentUser(signal?: AbortSignal): Promise<CurrentUserResponse> {
  return request<CurrentUserResponse>('/api/me', { signal });
}
