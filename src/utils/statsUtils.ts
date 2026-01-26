/**
 * Stats utility functions for player/game statistics
 */

/**
 * Calculate Kill/Death ratio as a formatted string
 */
export function calculateKDR(kills: number, deaths: number): string {
  if (deaths === 0) return kills > 0 ? `${kills.toFixed(1)}` : '0.0';
  return (kills / deaths).toFixed(2);
}

/**
 * Get a Tailwind color class based on K/D ratio performance
 */
export function getKDRColor(kills: number, deaths: number): string {
  const kdr = deaths === 0 ? (kills > 0 ? kills : 0) : kills / deaths;
  if (kdr >= 2.0) return 'text-emerald-400';
  if (kdr >= 1.5) return 'text-cyan-400';
  if (kdr >= 1.0) return 'text-blue-400';
  if (kdr >= 0.5) return 'text-orange-400';
  return 'text-red-400';
}

/**
 * Get a Tailwind color class based on team label
 * Supports BF1942, FH2, and BFV team names
 */
export function getTeamColor(teamLabel: string | null | undefined): string {
  if (!teamLabel) return 'text-slate-300';
  const label = teamLabel.toLowerCase();

  // Axis/Red teams
  if (label.includes('axis') || label.includes('red') || label.includes('team 2')) return 'text-red-400';
  // Allied/Blue teams
  if (label.includes('allies') || label.includes('blue') || label.includes('team 1')) return 'text-blue-400';
  // Vietnam-specific
  if (label.includes('north') || label.includes('nva')) return 'text-red-400';
  if (label.includes('south') || label.includes('usa')) return 'text-blue-400';

  return 'text-purple-400';
}

/**
 * Get a color for map names based on hash (for visual variety)
 */
export function getMapAccentColor(mapName: string): string {
  let hash = 0;
  for (let i = 0; i < mapName.length; i++) {
    hash = mapName.charCodeAt(i) + ((hash << 5) - hash);
  }

  const colors = [
    'text-cyan-400',
    'text-emerald-400',
    'text-violet-400',
    'text-orange-400',
    'text-pink-400',
    'text-amber-400',
    'text-lime-400',
    'text-rose-400',
  ];

  return colors[Math.abs(hash) % colors.length];
}

/**
 * Get CSS classes for rank-based styling (for badges/indicators)
 * Returns Tailwind classes for rank 1 (gold), 2 (silver), 3 (bronze), and others
 */
export function getRankClass(rank: number): string {
  const base = 'inline-flex items-center justify-center w-5 h-5 rounded text-xs font-medium';
  switch (rank) {
    case 1: return `${base} bg-yellow-500/20 text-yellow-400`;
    case 2: return `${base} bg-slate-400/20 text-slate-300`;
    case 3: return `${base} bg-orange-500/20 text-orange-400`;
    default: return `${base} text-slate-500`;
  }
}
