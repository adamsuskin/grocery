/**
 * Custom Category Search Hook
 *
 * Provides comprehensive search functionality for custom categories including:
 * - Fuzzy matching for typos
 * - Search by name, color, and icon
 * - Advanced filtering by date, usage count, and creator
 * - Relevance-based sorting
 */

import { useMemo, useState, useCallback } from 'react';
import type { CustomCategory } from '../types';

export interface SearchFilters {
  query: string;
  createdAfter?: Date;
  createdBefore?: Date;
  minUsageCount?: number;
  createdBy?: string;
}

export interface CategoryWithUsage extends CustomCategory {
  usageCount?: number;
}

interface SearchResult extends CategoryWithUsage {
  relevanceScore: number;
  matchedFields: string[];
}

/**
 * Calculate Levenshtein distance for fuzzy matching
 * Returns number of edits needed to transform one string into another
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[len1][len2];
}

/**
 * Calculate fuzzy match score (0-1, higher is better)
 * Uses Levenshtein distance normalized by string length
 */
function fuzzyMatchScore(query: string, target: string): number {
  const queryLower = query.toLowerCase();
  const targetLower = target.toLowerCase();

  // Exact match
  if (queryLower === targetLower) return 1.0;

  // Contains match (very high score)
  if (targetLower.includes(queryLower)) {
    return 0.9 - (targetLower.indexOf(queryLower) * 0.1);
  }

  // Starts with match (high score)
  if (targetLower.startsWith(queryLower)) {
    return 0.85;
  }

  // Fuzzy match using Levenshtein distance
  const distance = levenshteinDistance(queryLower, targetLower);
  const maxLength = Math.max(queryLower.length, targetLower.length);

  // If distance is too large, not a match
  if (distance > maxLength * 0.5) return 0;

  return Math.max(0, 1 - (distance / maxLength)) * 0.7;
}

/**
 * Check if a color matches the search query
 * Supports hex codes with or without #
 */
function colorMatches(color: string | undefined, query: string): boolean {
  if (!color || !query) return false;

  const colorLower = color.toLowerCase();
  const queryLower = query.toLowerCase();

  // Remove # from both for comparison
  const colorNormalized = colorLower.replace('#', '');
  const queryNormalized = queryLower.replace('#', '');

  return colorNormalized.includes(queryNormalized);
}

/**
 * Check if icon matches the search query
 */
function iconMatches(icon: string | undefined, query: string): boolean {
  if (!icon || !query) return false;
  return icon.includes(query);
}

/**
 * Apply advanced filters to categories
 */
function applyFilters(
  category: CategoryWithUsage,
  filters: SearchFilters
): boolean {
  // Date filters
  if (filters.createdAfter) {
    const createdDate = new Date(category.createdAt);
    if (createdDate < filters.createdAfter) return false;
  }

  if (filters.createdBefore) {
    const createdDate = new Date(category.createdAt);
    if (createdDate > filters.createdBefore) return false;
  }

  // Usage count filter
  if (filters.minUsageCount !== undefined) {
    const usageCount = category.usageCount || 0;
    if (usageCount < filters.minUsageCount) return false;
  }

  // Creator filter
  if (filters.createdBy && category.createdBy !== filters.createdBy) {
    return false;
  }

  return true;
}

/**
 * Search and score a single category
 */
function searchCategory(
  category: CategoryWithUsage,
  query: string
): SearchResult | null {
  if (!query.trim()) {
    return {
      ...category,
      relevanceScore: 1,
      matchedFields: []
    };
  }

  const matchedFields: string[] = [];
  let relevanceScore = 0;

  // Name matching (highest weight)
  const nameScore = fuzzyMatchScore(query, category.name);
  if (nameScore > 0) {
    matchedFields.push('name');
    relevanceScore += nameScore * 3;
  }

  // Color matching (medium weight)
  if (colorMatches(category.color, query)) {
    matchedFields.push('color');
    relevanceScore += 1.5;
  }

  // Icon matching (medium weight)
  if (iconMatches(category.icon, query)) {
    matchedFields.push('icon');
    relevanceScore += 1.5;
  }

  // Require at least one match
  if (matchedFields.length === 0) return null;

  return {
    ...category,
    relevanceScore,
    matchedFields
  };
}

/**
 * Sort search results by relevance
 */
function sortByRelevance(results: SearchResult[]): SearchResult[] {
  return [...results].sort((a, b) => {
    // First by relevance score
    if (b.relevanceScore !== a.relevanceScore) {
      return b.relevanceScore - a.relevanceScore;
    }

    // Then by usage count (if available)
    const aUsage = a.usageCount || 0;
    const bUsage = b.usageCount || 0;
    if (bUsage !== aUsage) {
      return bUsage - aUsage;
    }

    // Finally by name alphabetically
    return a.name.localeCompare(b.name);
  });
}

/**
 * Hook for searching custom categories
 */
export function useCustomCategorySearch(
  categories: CategoryWithUsage[]
) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: ''
  });

  const searchResults = useMemo(() => {
    // Apply search and filtering
    const scored = categories
      .filter(cat => applyFilters(cat, filters))
      .map(cat => searchCategory(cat, filters.query))
      .filter((result): result is SearchResult => result !== null);

    // Sort by relevance
    return sortByRelevance(scored);
  }, [categories, filters]);

  const setQuery = useCallback((query: string) => {
    setFilters(prev => ({ ...prev, query }));
  }, []);

  const setDateRange = useCallback((start?: Date, end?: Date) => {
    setFilters(prev => ({
      ...prev,
      createdAfter: start,
      createdBefore: end
    }));
  }, []);

  const setMinUsageCount = useCallback((count?: number) => {
    setFilters(prev => ({ ...prev, minUsageCount: count }));
  }, []);

  const setCreatedBy = useCallback((userId?: string) => {
    setFilters(prev => ({ ...prev, createdBy: userId }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ query: '' });
  }, []);

  const hasActiveFilters = useMemo(() => {
    return filters.query !== '' ||
           filters.createdAfter !== undefined ||
           filters.createdBefore !== undefined ||
           filters.minUsageCount !== undefined ||
           filters.createdBy !== undefined;
  }, [filters]);

  return {
    searchResults,
    filters,
    setQuery,
    setDateRange,
    setMinUsageCount,
    setCreatedBy,
    clearFilters,
    hasActiveFilters,
    totalResults: searchResults.length,
    totalCategories: categories.length
  };
}

/**
 * Hook for highlighting search matches in text
 */
export function useSearchHighlight(text: string, query: string): {
  highlighted: boolean;
  parts: Array<{ text: string; isHighlighted: boolean }>;
} {
  return useMemo(() => {
    if (!query.trim()) {
      return {
        highlighted: false,
        parts: [{ text, isHighlighted: false }]
      };
    }

    const queryLower = query.toLowerCase();
    const textLower = text.toLowerCase();
    const index = textLower.indexOf(queryLower);

    if (index === -1) {
      return {
        highlighted: false,
        parts: [{ text, isHighlighted: false }]
      };
    }

    const before = text.substring(0, index);
    const match = text.substring(index, index + query.length);
    const after = text.substring(index + query.length);

    const parts = [];
    if (before) parts.push({ text: before, isHighlighted: false });
    parts.push({ text: match, isHighlighted: true });
    if (after) parts.push({ text: after, isHighlighted: false });

    return {
      highlighted: true,
      parts
    };
  }, [text, query]);
}
