/**
 * Shared constants used across components
 */

/**
 * Time range options for player statistics
 */
export const PLAYER_STATS_TIME_RANGE_OPTIONS = [
  { value: 60, label: '60 days' },
  { value: 180, label: '180 days' },
  { value: 365, label: '365 days' }
] as const;

export type PlayerStatsTimeRange = typeof PLAYER_STATS_TIME_RANGE_OPTIONS[number]['value'];
