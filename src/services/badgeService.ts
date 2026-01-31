import { fetchInitialData } from './playerStatsApi';
import type { BadgeDefinition, InitialData } from '@/types/playerStatsTypes';
import { useSiteNotice } from '@/composables/useSiteNotice';

// Store for badge definitions
let badgeDefinitions: BadgeDefinition[] = [];
let isInitialized = false;

/**
 * Initialize badge definitions by fetching initial data
 * This should be called on app startup
 */
export async function initializeBadgeDefinitions(): Promise<void> {
  try {
    const initialData: InitialData = await fetchInitialData();
    badgeDefinitions = initialData.badgeDefinitions;
    isInitialized = true;

    // Set site notice if present in initial data
    const { setNotice } = useSiteNotice();
    setNotice(initialData.siteNotice);
  } catch (error) {
    console.error('Failed to initialize badge definitions:', error);
    // Don't throw here to avoid breaking the app if badge descriptions fail to load
  }
}

/**
 * Get description for a specific badge/achievement
 * @param achievementId The ID of the achievement
 * @returns The description or null if not found
 */
export function getBadgeDescription(achievementId: string): string | null {
  if (!isInitialized) {
    console.warn('Badge definitions not initialized. Call initializeBadgeDefinitions() first.');
    return null;
  }

  const badge = badgeDefinitions.find(b => b.id === achievementId);
  return badge?.description || null;
}

/**
 * Get full badge definition for a specific achievement
 * @param achievementId The ID of the achievement
 * @returns The badge definition or null if not found
 */
export function getBadgeDefinition(achievementId: string): BadgeDefinition | null {
  if (!isInitialized) {
    console.warn('Badge definitions not initialized. Call initializeBadgeDefinitions() first.');
    return null;
  }

  return badgeDefinitions.find(b => b.id === achievementId) || null;
}

/**
 * Get all badge definitions
 * @returns Array of all badge definitions
 */
export function getAllBadgeDefinitions(): BadgeDefinition[] {
  if (!isInitialized) {
    console.warn('Badge definitions not initialized. Call initializeBadgeDefinitions() first.');
    return [];
  }

  return [...badgeDefinitions];
}

/**
 * Get badges by category
 * @param category The category to filter by
 * @returns Array of badge definitions in the specified category
 */
export function getBadgesByCategory(category: string): BadgeDefinition[] {
  if (!isInitialized) {
    console.warn('Badge definitions not initialized. Call initializeBadgeDefinitions() first.');
    return [];
  }

  return badgeDefinitions.filter(b => b.category === category);
}

/**
 * Get badges by tier
 * @param tier The tier to filter by
 * @returns Array of badge definitions in the specified tier
 */
export function getBadgesByTier(tier: string): BadgeDefinition[] {
  if (!isInitialized) {
    console.warn('Badge definitions not initialized. Call initializeBadgeDefinitions() first.');
    return [];
  }

  return badgeDefinitions.filter(b => b.tier.toLowerCase() === tier.toLowerCase());
}

/**
 * Check if badge definitions are initialized
 * @returns True if initialized, false otherwise
 */
export function isBadgeServiceInitialized(): boolean {
  return isInitialized;
}

/**
 * Get tier-specific requirement description for an achievement
 * @param achievementId The ID of the achievement
 * @param tier The tier to get requirements for
 * @returns The tier requirement description or null if not found
 */
export function getTierRequirement(achievementId: string, tier: string): string | null {
  const badge = getBadgeDefinition(achievementId);
  if (!badge?.requirements?.performance_tiers) {
    return null;
  }

  const normalizedTier = tier.toLowerCase() as keyof typeof badge.requirements.performance_tiers;
  return badge.requirements.performance_tiers[normalizedTier] || null;
}