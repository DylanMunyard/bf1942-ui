/**
 * Utility functions for loading achievement images
 * Handles both regular achievements and tiered achievements with the same achievementId
 */

interface Achievement {
  achievementId: string;
  tier?: string;
}

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
      const tierImagePath = `../assets/achievements/${achievementId}_${tier.toLowerCase()}.png`;
      try {
        return new URL(tierImagePath, import.meta.url).href;
      } catch {
        // If tier-specific image doesn't exist, fall back to default
        console.warn(`Tier-specific image not found for ${achievementId}_${tier}, falling back to default`);
      }
    }
    
    // Default behavior: load image based on achievementId
    return new URL(`../assets/achievements/${achievementId}.png`, import.meta.url).href;
  } catch {
    // Ultimate fallback to a known working image
    return new URL('../assets/achievements/kill_streak_10.png', import.meta.url).href;
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
