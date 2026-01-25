/**
 * Admin API for triggering background jobs on-demand.
 * Used after round deletion to refresh aggregates, and for backfills/maintenance.
 */

const BASE = '/stats/admin/jobs';

async function request(
  path: string,
  opts: { method?: string; body?: string } = {}
): Promise<{ message?: string; error?: string }> {
  const { authService } = await import('./authService');
  const ok = await authService.ensureValidToken();
  if (!ok) throw new Error('Authentication required but token is invalid');

  const token = localStorage.getItem('authToken');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method: opts.method ?? 'POST',
    headers,
    body: opts.body,
  });

  if (res.status === 401) {
    const refreshed = await authService.refreshToken();
    if (refreshed) {
      const t = localStorage.getItem('authToken');
      if (t) headers['Authorization'] = `Bearer ${t}`;
      const retry = await fetch(`${BASE}${path}`, { method: opts.method ?? 'POST', headers, body: opts.body });
      if (!retry.ok) {
        const err = await retry.json().catch(() => ({}));
        throw new Error((err as { error?: string; message?: string }).error || (err as { message?: string }).message || `HTTP ${retry.status}`);
      }
      const ct = retry.headers.get('content-type');
      if (!ct?.includes('application/json') || retry.status === 204) return {} as { message?: string };
      return retry.json();
    }
    await authService.logout();
    throw new Error('Session expired. Please login again.');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string; message?: string }).error || (err as { message?: string }).message || `HTTP ${res.status}`);
  }

  const ct = res.headers.get('content-type');
  if (!ct?.includes('application/json') || res.status === 204) return {} as { message?: string };
  return res.json();
}

/** Runs to completion. Refreshes ServerHourlyPatterns, HourlyPlayerPredictions, MapGlobalAverages. Run after round delete. */
export function triggerDailyAggregateRefresh(): Promise<{ message?: string; error?: string }> {
  return request('/daily-aggregate-refresh');
}

/** Runs to completion. Removes stale this_week best scores, prunes ServerOnlineCounts. */
export function triggerWeeklyCleanup(): Promise<{ message?: string; error?: string }> {
  return request('/weekly-cleanup');
}

/** Fire-and-forget. Tier 1–4. Returns 202 Accepted. */
export function triggerAggregateBackfillTier(tier: number): Promise<{ message?: string; error?: string }> {
  return request(`/aggregate-backfill/${tier}`);
}

/** Fire-and-forget. All tiers. Returns 202 Accepted. */
export function triggerAggregateBackfill(): Promise<{ message?: string; error?: string }> {
  return request('/aggregate-backfill');
}

/** Fire-and-forget. Full ServerMapStats from Rounds; daily only does ~2 months. */
export function triggerServerMapStatsBackfill(): Promise<{ message?: string; error?: string }> {
  return request('/server-map-stats-backfill');
}

/** Fire-and-forget. Full MapHourlyPatterns from Rounds; daily only ~60 days. */
export function triggerMapHourlyPatternsBackfill(): Promise<{ message?: string; error?: string }> {
  return request('/map-hourly-patterns-backfill');
}

/** Fire-and-forget. Daily refresh + weekly cleanup in sequence. */
export function triggerRunAll(): Promise<{ message?: string; error?: string }> {
  return request('/run-all');
}
