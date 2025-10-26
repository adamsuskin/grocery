/**
 * Intelligent Category Recommendation System
 *
 * This module analyzes user shopping patterns and provides intelligent recommendations
 * for category management, including creating new categories, merging similar ones,
 * and archiving unused categories.
 *
 * ## Features
 * - Analyze 'Other' category usage patterns
 * - Suggest new categories based on common items
 * - Identify similar categories that could be merged
 * - Detect unused categories for archiving
 * - Learn from user acceptance/rejection of suggestions
 * - All analysis done locally for privacy
 *
 * ## Usage
 *
 * ```typescript
 * import { getCategoryRecommendations } from './categoryRecommendations';
 *
 * const recommendations = getCategoryRecommendations(items, categories);
 * recommendations.forEach(rec => {
 *   console.log(rec.title, rec.confidence);
 * });
 * ```
 */

import type { GroceryItem, CustomCategory } from '../types';
import { CATEGORIES } from '../types';

// Storage keys
const DISMISSED_RECOMMENDATIONS_KEY = 'grocery_dismissed_recommendations';
const RECOMMENDATION_PREFERENCES_KEY = 'grocery_recommendation_preferences';
const RECOMMENDATION_FEEDBACK_KEY = 'grocery_recommendation_feedback';

// Recommendation confidence thresholds
const HIGH_CONFIDENCE = 0.8;
const MEDIUM_CONFIDENCE = 0.6;
const LOW_CONFIDENCE = 0.4;

// Analysis parameters
const MIN_ITEMS_IN_OTHER = 5; // Minimum items in 'Other' before suggesting new category
const MIN_USAGE_FOR_MERGE = 3; // Minimum usage count to consider for merge suggestions
const UNUSED_CATEGORY_DAYS = 90; // Days without usage to consider archiving
const SIMILARITY_THRESHOLD = 0.7; // Levenshtein similarity threshold for merging

/**
 * Recommendation types
 */
export type RecommendationType = 'create' | 'merge' | 'archive' | 'learn';

/**
 * Category recommendation interface
 */
export interface CategoryRecommendation {
  id: string;
  type: RecommendationType;
  title: string;
  description: string;
  suggestedAction: string;
  confidence: number; // 0-1
  data: {
    // For 'create' type
    suggestedName?: string;
    suggestedColor?: string;
    suggestedIcon?: string;
    affectedItems?: string[]; // Item names that would be recategorized

    // For 'merge' type
    sourceCategories?: string[]; // Category IDs to merge
    targetCategory?: string; // Target category ID
    categoryNames?: string[]; // Names for display
    itemCount?: number;

    // For 'archive' type
    categoryId?: string;
    categoryName?: string;
    lastUsed?: number;
    daysSinceLastUse?: number;

    // For 'learn' type
    pattern?: string;
    examples?: string[];
  };
  createdAt: number;
}

/**
 * User feedback on recommendations
 */
interface RecommendationFeedback {
  recommendationId: string;
  type: RecommendationType;
  accepted: boolean;
  timestamp: number;
  metadata?: Record<string, any>;
}

/**
 * User preferences for recommendations
 */
export interface RecommendationPreferences {
  enabled: boolean;
  showCreateSuggestions: boolean;
  showMergeSuggestions: boolean;
  showArchiveSuggestions: boolean;
  minConfidence: number;
}

/**
 * Get user preferences for recommendations
 */
export function getRecommendationPreferences(): RecommendationPreferences {
  try {
    const stored = localStorage.getItem(RECOMMENDATION_PREFERENCES_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('[Recommendations] Error loading preferences:', error);
  }

  // Default preferences
  return {
    enabled: true,
    showCreateSuggestions: true,
    showMergeSuggestions: true,
    showArchiveSuggestions: true,
    minConfidence: MEDIUM_CONFIDENCE,
  };
}

/**
 * Save user preferences for recommendations
 */
export function saveRecommendationPreferences(prefs: RecommendationPreferences): void {
  try {
    localStorage.setItem(RECOMMENDATION_PREFERENCES_KEY, JSON.stringify(prefs));
  } catch (error) {
    console.error('[Recommendations] Error saving preferences:', error);
  }
}

/**
 * Get dismissed recommendations
 */
function getDismissedRecommendations(): Set<string> {
  try {
    const stored = localStorage.getItem(DISMISSED_RECOMMENDATIONS_KEY);
    if (stored) {
      return new Set(JSON.parse(stored));
    }
  } catch (error) {
    console.error('[Recommendations] Error loading dismissed:', error);
  }
  return new Set();
}

/**
 * Save dismissed recommendations
 */
function saveDismissedRecommendations(dismissed: Set<string>): void {
  try {
    localStorage.setItem(DISMISSED_RECOMMENDATIONS_KEY, JSON.stringify(Array.from(dismissed)));
  } catch (error) {
    console.error('[Recommendations] Error saving dismissed:', error);
  }
}

/**
 * Mark a recommendation as dismissed
 */
export function dismissRecommendation(recommendationId: string): void {
  const dismissed = getDismissedRecommendations();
  dismissed.add(recommendationId);
  saveDismissedRecommendations(dismissed);
}

/**
 * Clear dismissed recommendations (e.g., after 30 days)
 */
export function clearDismissedRecommendations(): void {
  try {
    localStorage.removeItem(DISMISSED_RECOMMENDATIONS_KEY);
  } catch (error) {
    console.error('[Recommendations] Error clearing dismissed:', error);
  }
}

/**
 * Get all feedback
 */
function getAllFeedback(): RecommendationFeedback[] {
  try {
    const stored = localStorage.getItem(RECOMMENDATION_FEEDBACK_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('[Recommendations] Error loading feedback:', error);
  }
  return [];
}

/**
 * Save feedback
 */
function saveFeedback(feedback: RecommendationFeedback[]): void {
  try {
    // Keep only last 1000 feedback items
    const trimmed = feedback.slice(-1000);
    localStorage.setItem(RECOMMENDATION_FEEDBACK_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.error('[Recommendations] Error saving feedback:', error);
  }
}

/**
 * Record user feedback on a recommendation
 */
export function recordRecommendationFeedback(
  recommendationId: string,
  type: RecommendationType,
  accepted: boolean,
  metadata?: Record<string, any>
): void {
  const feedback = getAllFeedback();
  feedback.push({
    recommendationId,
    type,
    accepted,
    timestamp: Date.now(),
    metadata,
  });
  saveFeedback(feedback);
}

/**
 * Calculate Levenshtein distance between two strings
 * Used for finding similar category names
 */
function levenshteinDistance(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  const matrix: number[][] = [];

  for (let i = 0; i <= s2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= s1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[s2.length][s1.length];
}

/**
 * Calculate similarity between two strings (0-1)
 */
function stringSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) {
    return 1.0;
  }

  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

/**
 * Analyze items in 'Other' category to suggest new categories
 */
function analyzeOtherCategory(
  items: GroceryItem[],
  existingCategories: CustomCategory[]
): CategoryRecommendation[] {
  const recommendations: CategoryRecommendation[] = [];

  // Get all items in 'Other' category
  const otherItems = items.filter(item => item.category === 'Other');

  if (otherItems.length < MIN_ITEMS_IN_OTHER) {
    return recommendations;
  }

  // Group items by common words/patterns
  const wordFrequency = new Map<string, string[]>();

  otherItems.forEach(item => {
    const words = item.name.toLowerCase()
      .split(/[\s,.-]+/)
      .filter(word => word.length > 3); // Ignore short words

    words.forEach(word => {
      if (!wordFrequency.has(word)) {
        wordFrequency.set(word, []);
      }
      wordFrequency.get(word)!.push(item.name);
    });
  });

  // Find patterns with multiple items
  const significantPatterns = Array.from(wordFrequency.entries())
    .filter(([_, itemNames]) => itemNames.length >= 3)
    .sort((a, b) => b[1].length - a[1].length);

  // Create recommendations for top patterns
  significantPatterns.slice(0, 3).forEach(([pattern, itemNames]) => {
    // Check if this pattern is already covered by existing categories
    const alreadyExists = existingCategories.some(cat =>
      cat.name.toLowerCase().includes(pattern) ||
      pattern.includes(cat.name.toLowerCase())
    );

    if (alreadyExists) {
      return;
    }

    // Generate a category name from the pattern
    const suggestedName = pattern.charAt(0).toUpperCase() + pattern.slice(1);

    // Calculate confidence based on frequency and pattern strength
    const frequency = itemNames.length / otherItems.length;
    const confidence = Math.min(0.95, 0.6 + (frequency * 0.4));

    const recId = `create_${pattern}_${Date.now()}`;

    recommendations.push({
      id: recId,
      type: 'create',
      title: `Create "${suggestedName}" category`,
      description: `You often add items containing "${pattern}" to 'Other'. Consider creating a custom category for these items.`,
      suggestedAction: `Create category and move ${itemNames.length} items`,
      confidence,
      data: {
        suggestedName,
        affectedItems: itemNames.slice(0, 5), // Show first 5 examples
        suggestedColor: '#4CAF50',
        suggestedIcon: '📦',
      },
      createdAt: Date.now(),
    });
  });

  return recommendations;
}

/**
 * Identify similar categories that could be merged
 */
function analyzeSimilarCategories(
  items: GroceryItem[],
  categories: CustomCategory[]
): CategoryRecommendation[] {
  const recommendations: CategoryRecommendation[] = [];

  if (categories.length < 2) {
    return recommendations;
  }

  // Count items per category
  const categoryUsage = new Map<string, number>();
  items.forEach(item => {
    const count = categoryUsage.get(item.category) || 0;
    categoryUsage.set(item.category, count + 1);
  });

  // Find similar category pairs
  const checked = new Set<string>();

  for (let i = 0; i < categories.length; i++) {
    for (let j = i + 1; j < categories.length; j++) {
      const cat1 = categories[i];
      const cat2 = categories[j];

      const pairKey = [cat1.id, cat2.id].sort().join('_');
      if (checked.has(pairKey)) continue;
      checked.add(pairKey);

      // Calculate similarity
      const similarity = stringSimilarity(cat1.name, cat2.name);

      if (similarity >= SIMILARITY_THRESHOLD) {
        const usage1 = categoryUsage.get(cat1.name) || 0;
        const usage2 = categoryUsage.get(cat2.name) || 0;

        // Only suggest merge if both have some usage
        if (usage1 >= MIN_USAGE_FOR_MERGE && usage2 >= MIN_USAGE_FOR_MERGE) {
          // Target should be the more frequently used category
          const [source, target] = usage1 > usage2
            ? [cat2, cat1]
            : [cat1, cat2];

          const totalItems = usage1 + usage2;
          const confidence = Math.min(0.9, similarity);

          const recId = `merge_${cat1.id}_${cat2.id}_${Date.now()}`;

          recommendations.push({
            id: recId,
            type: 'merge',
            title: `Merge similar categories`,
            description: `"${source.name}" and "${target.name}" are very similar (${Math.round(similarity * 100)}% match). Consider merging them to simplify your categories.`,
            suggestedAction: `Merge "${source.name}" into "${target.name}" (${totalItems} items)`,
            confidence,
            data: {
              sourceCategories: [source.id],
              targetCategory: target.id,
              categoryNames: [source.name, target.name],
              itemCount: totalItems,
            },
            createdAt: Date.now(),
          });
        }
      }
    }
  }

  return recommendations;
}

/**
 * Identify unused categories that could be archived
 */
function analyzeUnusedCategories(
  items: GroceryItem[],
  categories: CustomCategory[]
): CategoryRecommendation[] {
  const recommendations: CategoryRecommendation[] = [];
  const now = Date.now();
  const cutoffDate = now - (UNUSED_CATEGORY_DAYS * 24 * 60 * 60 * 1000);

  // Find last usage of each category
  const lastUsage = new Map<string, number>();

  items.forEach(item => {
    const current = lastUsage.get(item.category);
    if (!current || item.updatedAt > current) {
      lastUsage.set(item.category, item.updatedAt);
    }
  });

  // Check each category for inactivity
  categories.forEach(category => {
    const lastUsed = lastUsage.get(category.name);

    // If never used or not used in UNUSED_CATEGORY_DAYS
    if (!lastUsed || lastUsed < cutoffDate) {
      const daysSinceLastUse = lastUsed
        ? Math.floor((now - lastUsed) / (24 * 60 * 60 * 1000))
        : Math.floor((now - category.createdAt) / (24 * 60 * 60 * 1000));

      // Higher confidence for longer periods of inactivity
      const confidence = Math.min(0.9, 0.5 + (daysSinceLastUse / UNUSED_CATEGORY_DAYS) * 0.4);

      const recId = `archive_${category.id}_${Date.now()}`;

      recommendations.push({
        id: recId,
        type: 'archive',
        title: `Archive unused category`,
        description: lastUsed
          ? `"${category.name}" hasn't been used in ${daysSinceLastUse} days. Consider archiving it to declutter your categories.`
          : `"${category.name}" has never been used. Consider archiving it.`,
        suggestedAction: `Archive "${category.name}"`,
        confidence,
        data: {
          categoryId: category.id,
          categoryName: category.name,
          lastUsed: lastUsed || category.createdAt,
          daysSinceLastUse,
        },
        createdAt: Date.now(),
      });
    }
  });

  return recommendations;
}

/**
 * Analyze user patterns to suggest learning opportunities
 */
function analyzeLearningOpportunities(
  items: GroceryItem[],
  categories: CustomCategory[]
): CategoryRecommendation[] {
  const recommendations: CategoryRecommendation[] = [];
  const feedback = getAllFeedback();

  // Analyze acceptance rate by type
  const typeStats = new Map<RecommendationType, { accepted: number; total: number }>();

  feedback.forEach(fb => {
    const stats = typeStats.get(fb.type) || { accepted: 0, total: 0 };
    stats.total++;
    if (fb.accepted) stats.accepted++;
    typeStats.set(fb.type, stats);
  });

  // Look for patterns in user behavior
  const otherItems = items.filter(item => item.category === 'Other');
  const customCategoryUsage = items.filter(item =>
    categories.some(cat => cat.name === item.category)
  ).length;

  const totalItems = items.length;
  const otherPercentage = otherItems.length / totalItems;

  // Suggest if user relies heavily on 'Other' but has dismissed create suggestions
  if (otherPercentage > 0.3 && otherItems.length > 10) {
    const createFeedback = typeStats.get('create');
    if (createFeedback && createFeedback.total > 3 && createFeedback.accepted / createFeedback.total < 0.3) {
      const recId = `learn_other_usage_${Date.now()}`;

      recommendations.push({
        id: recId,
        type: 'learn',
        title: 'Optimize your category usage',
        description: `${Math.round(otherPercentage * 100)}% of your items are in 'Other'. Custom categories can help organize your shopping list better.`,
        suggestedAction: 'Review category organization tips',
        confidence: 0.7,
        data: {
          pattern: 'heavy_other_usage',
          examples: otherItems.slice(0, 5).map(item => item.name),
        },
        createdAt: Date.now(),
      });
    }
  }

  return recommendations;
}

/**
 * Get all category recommendations based on current patterns
 */
export function getCategoryRecommendations(
  items: GroceryItem[],
  categories: CustomCategory[]
): CategoryRecommendation[] {
  const prefs = getRecommendationPreferences();

  // Return empty if recommendations are disabled
  if (!prefs.enabled) {
    return [];
  }

  const allRecommendations: CategoryRecommendation[] = [];

  // Analyze for create suggestions
  if (prefs.showCreateSuggestions) {
    allRecommendations.push(...analyzeOtherCategory(items, categories));
  }

  // Analyze for merge suggestions
  if (prefs.showMergeSuggestions) {
    allRecommendations.push(...analyzeSimilarCategories(items, categories));
  }

  // Analyze for archive suggestions
  if (prefs.showArchiveSuggestions) {
    allRecommendations.push(...analyzeUnusedCategories(items, categories));
  }

  // Analyze for learning opportunities
  allRecommendations.push(...analyzeLearningOpportunities(items, categories));

  // Filter out dismissed recommendations
  const dismissed = getDismissedRecommendations();
  const activeRecommendations = allRecommendations.filter(rec =>
    !dismissed.has(rec.id) && rec.confidence >= prefs.minConfidence
  );

  // Sort by confidence (highest first)
  activeRecommendations.sort((a, b) => b.confidence - a.confidence);

  // Return top 5 recommendations
  return activeRecommendations.slice(0, 5);
}

/**
 * Get confidence level label
 */
export function getConfidenceLabel(confidence: number): string {
  if (confidence >= HIGH_CONFIDENCE) return 'High';
  if (confidence >= MEDIUM_CONFIDENCE) return 'Medium';
  return 'Low';
}

/**
 * Get confidence level color
 */
export function getConfidenceColor(confidence: number): string {
  if (confidence >= HIGH_CONFIDENCE) return '#4CAF50';
  if (confidence >= MEDIUM_CONFIDENCE) return '#FF9800';
  return '#9E9E9E';
}

/**
 * Export recommendation statistics
 */
export function exportRecommendationStats(): string {
  const feedback = getAllFeedback();
  const prefs = getRecommendationPreferences();
  const dismissed = getDismissedRecommendations();

  const stats = {
    exportDate: new Date().toISOString(),
    preferences: prefs,
    totalFeedback: feedback.length,
    totalDismissed: dismissed.size,
    acceptanceRate: {
      overall: feedback.length > 0
        ? feedback.filter(f => f.accepted).length / feedback.length
        : 0,
      byType: {} as Record<string, number>,
    },
    feedback,
  };

  // Calculate acceptance rate by type
  const typeGroups = new Map<string, RecommendationFeedback[]>();
  feedback.forEach(fb => {
    if (!typeGroups.has(fb.type)) {
      typeGroups.set(fb.type, []);
    }
    typeGroups.get(fb.type)!.push(fb);
  });

  typeGroups.forEach((items, type) => {
    const accepted = items.filter(f => f.accepted).length;
    stats.acceptanceRate.byType[type] = accepted / items.length;
  });

  return JSON.stringify(stats, null, 2);
}

/**
 * Clear all recommendation data
 */
export function clearRecommendationData(): void {
  clearDismissedRecommendations();
  try {
    localStorage.removeItem(RECOMMENDATION_FEEDBACK_KEY);
    localStorage.removeItem(RECOMMENDATION_PREFERENCES_KEY);
    console.log('[Recommendations] All data cleared');
  } catch (error) {
    console.error('[Recommendations] Error clearing data:', error);
  }
}
