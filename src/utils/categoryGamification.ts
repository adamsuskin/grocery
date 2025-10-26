/**
 * Category Gamification System
 *
 * Provides a comprehensive gamification layer to encourage custom category usage.
 * Tracks achievements, statistics, challenges, and levels to make category management fun.
 *
 * Features:
 * - Achievement/badge system
 * - Statistics and milestones
 * - Friendly challenges and tips
 * - Level progression system
 * - Social gamification for shared lists
 * - Optional "Fun Mode" toggle
 */

import { CustomCategory, GroceryItem } from '../types';
import { getCategoryAnalytics } from './categoryAnalytics';

// Storage keys
const GAMIFICATION_STORAGE_KEY = 'grocery_gamification_data';
const GAMIFICATION_SETTINGS_KEY = 'grocery_gamification_settings';
const ACHIEVEMENT_NOTIFICATION_KEY = 'grocery_gamification_notifications';

// Achievement types
export type AchievementId =
  | 'category_creator'
  | 'color_coordinator'
  | 'icon_master'
  | 'organization_expert'
  | 'minimalist'
  | 'perfectionist'
  | 'speed_organizer'
  | 'diverse_categorizer'
  | 'category_veteran'
  | 'detail_oriented';

export interface Achievement {
  id: AchievementId;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt?: number;
  progress?: number; // 0-100
  maxProgress?: number;
}

// User level system
export type UserLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'master';

export interface LevelInfo {
  level: UserLevel;
  title: string;
  minCategories: number;
  icon: string;
  color: string;
}

// Challenge types
export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'tip' | 'goal' | 'milestone';
  icon: string;
  completed: boolean;
  dismissible: boolean;
  priority: number; // Higher = shown first
}

// Statistics
export interface GamificationStats {
  totalCategoriesCreated: number;
  totalCategoriesWithColors: number;
  totalCategoriesWithIcons: number;
  categoriesWithBoth: number;
  mostUsedCategory: { name: string; count: number } | null;
  itemsInCustomCategories: number;
  itemsInOther: number;
  totalItems: number;
  categorizationScore: number; // 0-100
  organizationScore: number; // 0-100
  streak: number; // Days of category usage
  lastActivity: number;
}

// Leaderboard entry for shared lists
export interface LeaderboardEntry {
  userId: string;
  userName: string;
  userEmail: string;
  categoriesCreated: number;
  totalUsage: number; // How many items use their categories
  score: number; // Calculated score
}

// Main gamification data structure
export interface GamificationData {
  achievements: Achievement[];
  stats: GamificationStats;
  level: UserLevel;
  challenges: Challenge[];
  lastUpdated: number;
  totalPoints: number;
}

// Settings
export interface GamificationSettings {
  funModeEnabled: boolean;
  showNotifications: boolean;
  showChallenges: boolean;
  showLeaderboard: boolean;
}

// Achievement definitions
const ACHIEVEMENT_DEFINITIONS: Record<AchievementId, Omit<Achievement, 'unlockedAt' | 'progress'>> = {
  category_creator: {
    id: 'category_creator',
    name: 'Category Creator',
    description: 'Created your first custom category',
    icon: '🎯',
    rarity: 'common',
  },
  color_coordinator: {
    id: 'color_coordinator',
    name: 'Color Coordinator',
    description: 'Added colors to all your categories',
    icon: '🎨',
    rarity: 'rare',
  },
  icon_master: {
    id: 'icon_master',
    name: 'Icon Master',
    description: 'Added icons to all your categories',
    icon: '✨',
    rarity: 'rare',
  },
  organization_expert: {
    id: 'organization_expert',
    name: 'Organization Expert',
    description: 'Created 10+ custom categories',
    icon: '📚',
    rarity: 'epic',
  },
  minimalist: {
    id: 'minimalist',
    name: 'Minimalist',
    description: 'Kept categories under 5 with high usage',
    icon: '🎋',
    rarity: 'rare',
  },
  perfectionist: {
    id: 'perfectionist',
    name: 'Perfectionist',
    description: 'All items properly categorized (none in "Other")',
    icon: '💎',
    rarity: 'legendary',
  },
  speed_organizer: {
    id: 'speed_organizer',
    name: 'Speed Organizer',
    description: 'Created 5 categories in one day',
    icon: '⚡',
    rarity: 'epic',
  },
  diverse_categorizer: {
    id: 'diverse_categorizer',
    name: 'Diverse Categorizer',
    description: 'Created categories spanning multiple types',
    icon: '🌈',
    rarity: 'rare',
  },
  category_veteran: {
    id: 'category_veteran',
    name: 'Category Veteran',
    description: 'Used custom categories for 30 days straight',
    icon: '🏆',
    rarity: 'legendary',
  },
  detail_oriented: {
    id: 'detail_oriented',
    name: 'Detail Oriented',
    description: 'All categories have both icons and colors',
    icon: '🔍',
    rarity: 'epic',
  },
};

// Level definitions
const LEVEL_DEFINITIONS: Record<UserLevel, LevelInfo> = {
  beginner: {
    level: 'beginner',
    title: 'Category Beginner',
    minCategories: 0,
    icon: '🌱',
    color: '#4CAF50',
  },
  intermediate: {
    level: 'intermediate',
    title: 'Category Organizer',
    minCategories: 3,
    icon: '🌿',
    color: '#8BC34A',
  },
  advanced: {
    level: 'advanced',
    title: 'Category Specialist',
    minCategories: 7,
    icon: '🌳',
    color: '#FFC107',
  },
  expert: {
    level: 'expert',
    title: 'Category Expert',
    minCategories: 12,
    icon: '⭐',
    color: '#FF9800',
  },
  master: {
    level: 'master',
    title: 'Category Master',
    minCategories: 20,
    icon: '👑',
    color: '#9C27B0',
  },
};

// Default settings
const DEFAULT_SETTINGS: GamificationSettings = {
  funModeEnabled: true,
  showNotifications: true,
  showChallenges: true,
  showLeaderboard: true,
};

/**
 * Get gamification settings
 */
export function getGamificationSettings(): GamificationSettings {
  try {
    const stored = localStorage.getItem(GAMIFICATION_SETTINGS_KEY);
    if (!stored) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch (error) {
    console.error('[Gamification] Error loading settings:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Update gamification settings
 */
export function updateGamificationSettings(settings: Partial<GamificationSettings>): void {
  try {
    const current = getGamificationSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(GAMIFICATION_SETTINGS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('[Gamification] Error updating settings:', error);
  }
}

/**
 * Check if fun mode is enabled
 */
export function isFunModeEnabled(): boolean {
  return getGamificationSettings().funModeEnabled;
}

/**
 * Get gamification data for a list
 */
export function getGamificationData(listId: string): GamificationData {
  try {
    const stored = localStorage.getItem(`${GAMIFICATION_STORAGE_KEY}_${listId}`);
    if (!stored) {
      return initializeGamificationData(listId);
    }
    return JSON.parse(stored);
  } catch (error) {
    console.error('[Gamification] Error loading data:', error);
    return initializeGamificationData(listId);
  }
}

/**
 * Initialize gamification data for a new list
 */
function initializeGamificationData(listId: string): GamificationData {
  return {
    achievements: Object.values(ACHIEVEMENT_DEFINITIONS).map(def => ({
      ...def,
      progress: 0,
    })),
    stats: {
      totalCategoriesCreated: 0,
      totalCategoriesWithColors: 0,
      totalCategoriesWithIcons: 0,
      categoriesWithBoth: 0,
      mostUsedCategory: null,
      itemsInCustomCategories: 0,
      itemsInOther: 0,
      totalItems: 0,
      categorizationScore: 0,
      organizationScore: 0,
      streak: 0,
      lastActivity: Date.now(),
    },
    level: 'beginner',
    challenges: generateChallenges([], [], 'beginner'),
    lastUpdated: Date.now(),
    totalPoints: 0,
  };
}

/**
 * Save gamification data
 */
function saveGamificationData(listId: string, data: GamificationData): void {
  try {
    localStorage.setItem(`${GAMIFICATION_STORAGE_KEY}_${listId}`, JSON.stringify(data));
  } catch (error) {
    console.error('[Gamification] Error saving data:', error);
  }
}

/**
 * Calculate statistics from categories and items
 */
export function calculateStats(
  categories: CustomCategory[],
  items: GroceryItem[]
): GamificationStats {
  const activeCategories = categories.filter(c => !c.isArchived);

  const totalCategoriesCreated = activeCategories.length;
  const totalCategoriesWithColors = activeCategories.filter(c => c.color).length;
  const totalCategoriesWithIcons = activeCategories.filter(c => c.icon).length;
  const categoriesWithBoth = activeCategories.filter(c => c.color && c.icon).length;

  // Count items by category
  const categoryUsage = new Map<string, number>();
  items.forEach(item => {
    categoryUsage.set(item.category, (categoryUsage.get(item.category) || 0) + 1);
  });

  // Find most used custom category
  let mostUsedCategory: { name: string; count: number } | null = null;
  activeCategories.forEach(cat => {
    const count = categoryUsage.get(cat.name) || 0;
    if (!mostUsedCategory || count > mostUsedCategory.count) {
      mostUsedCategory = { name: cat.name, count };
    }
  });

  const itemsInOther = categoryUsage.get('Other') || 0;
  const totalItems = items.length;
  const itemsInCustomCategories = Array.from(categoryUsage.entries())
    .filter(([cat]) => activeCategories.some(c => c.name === cat))
    .reduce((sum, [, count]) => sum + count, 0);

  // Calculate scores (0-100)
  const categorizationScore = totalItems > 0
    ? Math.round(((totalItems - itemsInOther) / totalItems) * 100)
    : 100;

  let organizationScore = 0;
  if (totalCategoriesCreated > 0) {
    const colorScore = (totalCategoriesWithColors / totalCategoriesCreated) * 30;
    const iconScore = (totalCategoriesWithIcons / totalCategoriesCreated) * 30;
    const usageScore = totalItems > 0 ? (itemsInCustomCategories / totalItems) * 40 : 0;
    organizationScore = Math.round(colorScore + iconScore + usageScore);
  }

  return {
    totalCategoriesCreated,
    totalCategoriesWithColors,
    totalCategoriesWithIcons,
    categoriesWithBoth,
    mostUsedCategory,
    itemsInCustomCategories,
    itemsInOther,
    totalItems,
    categorizationScore,
    organizationScore,
    streak: 0, // Would need historical tracking
    lastActivity: Date.now(),
  };
}

/**
 * Check and unlock achievements based on current stats
 */
export function checkAchievements(
  listId: string,
  categories: CustomCategory[],
  items: GroceryItem[]
): { newUnlocked: Achievement[]; data: GamificationData } {
  const data = getGamificationData(listId);
  const stats = calculateStats(categories, items);
  data.stats = stats;

  const newUnlocked: Achievement[] = [];
  const activeCategories = categories.filter(c => !c.isArchived);

  // Check each achievement
  data.achievements.forEach(achievement => {
    if (achievement.unlockedAt) return; // Already unlocked

    let shouldUnlock = false;
    let progress = 0;

    switch (achievement.id) {
      case 'category_creator':
        shouldUnlock = stats.totalCategoriesCreated >= 1;
        progress = Math.min(100, stats.totalCategoriesCreated * 100);
        break;

      case 'color_coordinator':
        if (stats.totalCategoriesCreated > 0) {
          progress = Math.round((stats.totalCategoriesWithColors / stats.totalCategoriesCreated) * 100);
          shouldUnlock = stats.totalCategoriesWithColors === stats.totalCategoriesCreated && stats.totalCategoriesCreated >= 3;
        }
        break;

      case 'icon_master':
        if (stats.totalCategoriesCreated > 0) {
          progress = Math.round((stats.totalCategoriesWithIcons / stats.totalCategoriesCreated) * 100);
          shouldUnlock = stats.totalCategoriesWithIcons === stats.totalCategoriesCreated && stats.totalCategoriesCreated >= 3;
        }
        break;

      case 'organization_expert':
        progress = Math.min(100, (stats.totalCategoriesCreated / 10) * 100);
        shouldUnlock = stats.totalCategoriesCreated >= 10;
        break;

      case 'minimalist':
        if (stats.totalCategoriesCreated <= 5 && stats.totalCategoriesCreated >= 3) {
          progress = stats.itemsInCustomCategories >= 20 ? 100 : (stats.itemsInCustomCategories / 20) * 100;
          shouldUnlock = stats.itemsInCustomCategories >= 20;
        }
        break;

      case 'perfectionist':
        progress = stats.categorizationScore;
        shouldUnlock = stats.itemsInOther === 0 && stats.totalItems >= 10;
        break;

      case 'speed_organizer':
        // Would need time-based tracking
        progress = Math.min(100, (stats.totalCategoriesCreated / 5) * 100);
        break;

      case 'diverse_categorizer':
        progress = Math.min(100, (stats.totalCategoriesCreated / 7) * 100);
        shouldUnlock = stats.totalCategoriesCreated >= 7;
        break;

      case 'category_veteran':
        // Would need streak tracking
        progress = Math.min(100, (stats.streak / 30) * 100);
        shouldUnlock = stats.streak >= 30;
        break;

      case 'detail_oriented':
        if (stats.totalCategoriesCreated > 0) {
          progress = Math.round((stats.categoriesWithBoth / stats.totalCategoriesCreated) * 100);
          shouldUnlock = stats.categoriesWithBoth === stats.totalCategoriesCreated && stats.totalCategoriesCreated >= 5;
        }
        break;
    }

    achievement.progress = Math.round(progress);

    if (shouldUnlock && !achievement.unlockedAt) {
      achievement.unlockedAt = Date.now();
      newUnlocked.push(achievement);
      data.totalPoints += getAchievementPoints(achievement.rarity);
    }
  });

  // Update level
  data.level = calculateLevel(stats.totalCategoriesCreated);

  // Update challenges
  data.challenges = generateChallenges(categories, items, data.level);

  data.lastUpdated = Date.now();
  saveGamificationData(listId, data);

  // Queue notifications for new achievements
  if (newUnlocked.length > 0 && getGamificationSettings().showNotifications) {
    queueAchievementNotifications(newUnlocked);
  }

  return { newUnlocked, data };
}

/**
 * Get points for achievement rarity
 */
function getAchievementPoints(rarity: Achievement['rarity']): number {
  switch (rarity) {
    case 'common': return 10;
    case 'rare': return 25;
    case 'epic': return 50;
    case 'legendary': return 100;
  }
}

/**
 * Calculate user level based on categories created
 */
export function calculateLevel(categoriesCreated: number): UserLevel {
  if (categoriesCreated >= 20) return 'master';
  if (categoriesCreated >= 12) return 'expert';
  if (categoriesCreated >= 7) return 'advanced';
  if (categoriesCreated >= 3) return 'intermediate';
  return 'beginner';
}

/**
 * Get level information
 */
export function getLevelInfo(level: UserLevel): LevelInfo {
  return LEVEL_DEFINITIONS[level];
}

/**
 * Get next level information
 */
export function getNextLevelInfo(currentLevel: UserLevel): LevelInfo | null {
  const levels: UserLevel[] = ['beginner', 'intermediate', 'advanced', 'expert', 'master'];
  const currentIndex = levels.indexOf(currentLevel);
  if (currentIndex < levels.length - 1) {
    return LEVEL_DEFINITIONS[levels[currentIndex + 1]];
  }
  return null;
}

/**
 * Generate contextual challenges based on current state
 */
export function generateChallenges(
  categories: CustomCategory[],
  items: GroceryItem[],
  level: UserLevel
): Challenge[] {
  const challenges: Challenge[] = [];
  const stats = calculateStats(categories, items);
  const activeCategories = categories.filter(c => !c.isArchived);

  // Beginner challenges
  if (stats.totalCategoriesCreated === 0) {
    challenges.push({
      id: 'create_first_category',
      title: 'Create Your First Category',
      description: 'Try creating a custom category for your favorite food type! It will help you organize your grocery list.',
      type: 'tip',
      icon: '🎯',
      completed: false,
      dismissible: true,
      priority: 100,
    });
  }

  // Color challenges
  if (stats.totalCategoriesCreated > 0 && stats.totalCategoriesWithColors < stats.totalCategoriesCreated) {
    challenges.push({
      id: 'add_colors',
      title: 'Color Code Your Categories',
      description: `Add colors to ${stats.totalCategoriesCreated - stats.totalCategoriesWithColors} more categories to make shopping easier!`,
      type: 'goal',
      icon: '🎨',
      completed: false,
      dismissible: true,
      priority: 80,
    });
  }

  // Icon challenges
  if (stats.totalCategoriesCreated > 0 && stats.totalCategoriesWithIcons < stats.totalCategoriesCreated) {
    challenges.push({
      id: 'add_icons',
      title: 'Add Icons for Visual Appeal',
      description: `${stats.totalCategoriesCreated - stats.totalCategoriesWithIcons} categories need icons. Make them stand out!`,
      type: 'goal',
      icon: '✨',
      completed: false,
      dismissible: true,
      priority: 70,
    });
  }

  // Categorization challenge
  if (stats.itemsInOther > 0) {
    challenges.push({
      id: 'reduce_other',
      title: 'Reach 100% Categorization',
      description: `Move ${stats.itemsInOther} items from "Other" to proper categories. You're ${stats.categorizationScore}% there!`,
      type: 'goal',
      icon: '💎',
      completed: false,
      dismissible: true,
      priority: 90,
    });
  }

  // Growth challenges based on level
  if (level === 'beginner' && stats.totalCategoriesCreated < 3) {
    challenges.push({
      id: 'grow_to_intermediate',
      title: 'Level Up to Organizer',
      description: `Create ${3 - stats.totalCategoriesCreated} more categories to reach Intermediate level!`,
      type: 'milestone',
      icon: '🌿',
      completed: false,
      dismissible: false,
      priority: 60,
    });
  }

  // Expert tips
  if (stats.totalCategoriesCreated >= 5 && stats.organizationScore < 70) {
    challenges.push({
      id: 'improve_organization',
      title: 'Boost Your Organization Score',
      description: 'Add colors and icons to all categories, and use them more frequently to improve your score!',
      type: 'tip',
      icon: '📊',
      completed: false,
      dismissible: true,
      priority: 50,
    });
  }

  return challenges.sort((a, b) => b.priority - a.priority);
}

/**
 * Dismiss a challenge
 */
export function dismissChallenge(listId: string, challengeId: string): void {
  const data = getGamificationData(listId);
  data.challenges = data.challenges.filter(c => c.id !== challengeId);
  saveGamificationData(listId, data);
}

/**
 * Queue achievement notifications
 */
function queueAchievementNotifications(achievements: Achievement[]): void {
  try {
    const queue = getNotificationQueue();
    achievements.forEach(achievement => {
      queue.push({
        achievementId: achievement.id,
        timestamp: Date.now(),
        shown: false,
      });
    });
    localStorage.setItem(ACHIEVEMENT_NOTIFICATION_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('[Gamification] Error queuing notifications:', error);
  }
}

/**
 * Get notification queue
 */
function getNotificationQueue(): Array<{ achievementId: AchievementId; timestamp: number; shown: boolean }> {
  try {
    const stored = localStorage.getItem(ACHIEVEMENT_NOTIFICATION_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    return [];
  }
}

/**
 * Get pending achievement notifications
 */
export function getPendingNotifications(): Achievement[] {
  const queue = getNotificationQueue();
  const pending = queue.filter(n => !n.shown);
  return pending.map(n => ({
    ...ACHIEVEMENT_DEFINITIONS[n.achievementId],
    unlockedAt: n.timestamp,
  }));
}

/**
 * Mark notification as shown
 */
export function markNotificationShown(achievementId: AchievementId): void {
  try {
    const queue = getNotificationQueue();
    const notification = queue.find(n => n.achievementId === achievementId);
    if (notification) {
      notification.shown = true;
      localStorage.setItem(ACHIEVEMENT_NOTIFICATION_KEY, JSON.stringify(queue));
    }
  } catch (error) {
    console.error('[Gamification] Error marking notification:', error);
  }
}

/**
 * Calculate leaderboard for a shared list
 */
export function calculateLeaderboard(
  listId: string,
  categories: CustomCategory[],
  items: GroceryItem[],
  members: Array<{ userId: string; userName: string; userEmail: string }>
): LeaderboardEntry[] {
  const entries: LeaderboardEntry[] = [];

  members.forEach(member => {
    const userCategories = categories.filter(c => c.createdBy === member.userId && !c.isArchived);
    const categoriesCreated = userCategories.length;

    // Count items using this user's categories
    const categoryNames = userCategories.map(c => c.name);
    const totalUsage = items.filter(item => categoryNames.includes(item.category)).length;

    // Calculate score (categories * 10 + usage * 1)
    const score = categoriesCreated * 10 + totalUsage;

    entries.push({
      userId: member.userId,
      userName: member.userName,
      userEmail: member.userEmail,
      categoriesCreated,
      totalUsage,
      score,
    });
  });

  return entries.sort((a, b) => b.score - a.score);
}

/**
 * Get achievement color by rarity
 */
export function getAchievementColor(rarity: Achievement['rarity']): string {
  switch (rarity) {
    case 'common': return '#808080';
    case 'rare': return '#4A90E2';
    case 'epic': return '#9B59B6';
    case 'legendary': return '#F39C12';
  }
}

/**
 * Export gamification data for debugging
 */
export function exportGamificationData(listId: string): string {
  const data = getGamificationData(listId);
  return JSON.stringify(data, null, 2);
}

/**
 * Reset gamification data for a list
 */
export function resetGamificationData(listId: string): void {
  try {
    localStorage.removeItem(`${GAMIFICATION_STORAGE_KEY}_${listId}`);
    console.log('[Gamification] Data reset for list:', listId);
  } catch (error) {
    console.error('[Gamification] Error resetting data:', error);
  }
}
