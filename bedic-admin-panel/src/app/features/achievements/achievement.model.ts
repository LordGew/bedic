export interface Achievement {
  _id: string;
  name: string;
  description: string;
  icon: string;
  category: 'CONTRIBUTION' | 'COMMUNITY' | 'EXPLORATION' | 'ENGAGEMENT' | 'SPECIAL';
  requirements: {
    type: 'REVIEWS_COUNT' | 'PLACES_VISITED' | 'REPORTS_FILED' | 'COMMENTS_COUNT' | 'EVENTS_ATTENDED' | 'RATINGS_GIVEN' | 'CUSTOM';
    value: number;
    description: string;
  };
  rewards: {
    xp: number;
    badge?: string;
    title?: string;
  };
  rarity: 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserAchievement {
  achievementId: string;
  unlockedAt: string;
  progress: number;
}

export interface AchievementStats {
  total: number;
  unlocked: number;
  inProgress: number;
  byCategory: { [key: string]: number };
}

export interface LevelConfig {
  level: number;
  name: string;
  minXP: number;
  maxXP: number;
  rewards: {
    xp: number;
    badge?: string;
    title?: string;
  };
}

export interface TitleConfig {
  _id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: 'level' | 'contributor' | 'explorer' | 'community' | 'referral' | 'special' | 'seasonal';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  unlockConditions: {
    minLevel?: number;
    minXP?: number;
    minUsefulReports?: number;
    minPhotosShared?: number;
    minRatingsGiven?: number;
    minQualityComments?: number;
    minSuccessfulReferrals?: number;
    minConsecutiveDays?: number;
    minBadgesUnlocked?: number;
  };
  isLimited: boolean;
  limitedUntil?: string;
  totalUnlocked: number;
  active: boolean;
}
