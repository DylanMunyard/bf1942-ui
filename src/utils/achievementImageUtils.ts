/**
 * Utility functions for loading achievement images
 * Handles both regular achievements and tiered achievements with the same achievementId
 */

interface Achievement {
  achievementId: string;
  tier?: string;
}

// Pre-import all team victory images to ensure they're processed by Vite
import teamVictoryBronze from '../assets/achievements/team_victory_bronze.webp';
import teamVictorySilver from '../assets/achievements/team_victory_silver.webp';
import teamVictoryGold from '../assets/achievements/team_victory_gold.webp';
import teamVictoryLegendary from '../assets/achievements/team_victory_legendary.webp';
import teamVictorySwitchedBronze from '../assets/achievements/team_victory_switched_bronze.webp';
import teamVictorySwitchedSilver from '../assets/achievements/team_victory_switched_silver.webp';
import teamVictorySwitchedGold from '../assets/achievements/team_victory_switched_gold.webp';
import teamVictorySwitchedLegendary from '../assets/achievements/team_victory_switched_legendary.webp';

// Mapping of tier-specific images
const TEAM_VICTORY_IMAGES: Record<string, string> = {
  'team_victory_bronze': teamVictoryBronze,
  'team_victory_silver': teamVictorySilver,
  'team_victory_gold': teamVictoryGold,
  'team_victory_legendary': teamVictoryLegendary,
  'team_victory_legend': teamVictoryLegendary, // Map 'legend' to 'legendary'
  'team_victory_switched_bronze': teamVictorySwitchedBronze,
  'team_victory_switched_silver': teamVictorySwitchedSilver,
  'team_victory_switched_gold': teamVictorySwitchedGold,
  'team_victory_switched_legendary': teamVictorySwitchedLegendary,
  'team_victory_switched_legend': teamVictorySwitchedLegendary, // Map 'legend' to 'legendary'
};

// List of achievement IDs that use tiered images (same achievementId, different tier images)
const TIERED_ACHIEVEMENT_IDS = new Set([
  'team_victory',
  'team_victory_switched'
]);

/**
 * Get the image URL for an achievement
 * For tiered achievements (team_victory, team_victory_switched), it will try to load the tier-specific image
 * For regular achievements, it loads the standard image
 * 
 * @param achievementId The achievement ID
 * @param tier The tier of the achievement (for tiered achievements)
 * @returns The image URL
 */
export function getAchievementImage(achievementId: string, tier?: string): string {
  try {
    // For tiered achievements, try to load the tier-specific image first
    if (tier && TIERED_ACHIEVEMENT_IDS.has(achievementId)) {
      const imageKey = `${achievementId}_${tier.toLowerCase()}`;
      
      // Check if we have a pre-imported image for this combination
      if (TEAM_VICTORY_IMAGES[imageKey]) {
        return TEAM_VICTORY_IMAGES[imageKey];
      }
      
      // If not found, log warning and fall through to default behavior
      console.warn(`Tier-specific image not found for ${imageKey}, falling back to default`);
    }
    
    // Default behavior: load image based on achievementId
    return new URL(`../assets/achievements/${achievementId}.webp`, import.meta.url).href;
  } catch {
    // Ultimate fallback to a known working image
    return new URL('../assets/achievements/kill_streak_10.webp', import.meta.url).href;
  }
}

/**
 * Get the image URL for an achievement object
 * Convenience function that extracts achievementId and tier from an achievement object
 * 
 * @param achievement The achievement object
 * @returns The image URL
 */
export function getAchievementImageFromObject(achievement: Achievement): string {
  return getAchievementImage(achievement.achievementId, achievement.tier);
}

/**
 * Check if an achievement uses tiered images
 * @param achievementId The achievement ID to check
 * @returns True if the achievement uses tiered images
 */
export function isTieredAchievement(achievementId: string): boolean {
  return TIERED_ACHIEVEMENT_IDS.has(achievementId);
}
