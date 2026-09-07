import { request } from './client.ts';
import type { DashboardSpending, DashboardSummary } from './types.ts';

/** GET /api/dashboard/summary — the caller's headline numbers. */
export function getDashboardSummary(signal?: AbortSignal): Promise<DashboardSummary> {
  return request<DashboardSummary>('/api/dashboard/summary', { signal });
}

/** GET /api/dashboard/spending — the caller's spending by month and by supermarket. */
export function getDashboardSpending(signal?: AbortSignal): Promise<DashboardSpending> {
  return request<DashboardSpending>('/api/dashboard/spending', { signal });
}
