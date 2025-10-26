/**
 * Filter Preferences Manager
 *
 * Manages user filter preferences with localStorage persistence and cross-device sync
 * Tracks saved filter presets and remembers last used filters per list
 */

import { FilterState, SavedFilter, Category } from '../types';
import { nanoid } from 'nanoid';

const FILTER_PREFERENCES_KEY = 'grocery_filter_preferences';
const SAVED_FILTERS_KEY = 'grocery_saved_filters';
const MAX_SAVED_FILTERS = 20;

/**
 * Per-list filter preferences
 */
interface ListFilterPreference {
  listId: string;
  filters: FilterState;
  lastUsed: number;
}

/**
 * All filter preferences
 */
interface FilterPreferences {
  lastUsedFilters: Record<string, ListFilterPreference>;
  defaultFilters: FilterState;
}

/**
 * Get default filter state
 */
export function getDefaultFilters(allCategories: Category[]): FilterState {
  return {
    searchText: '',
    showGotten: true,
    categories: allCategories,
    categoryMode: 'include',
    categoryType: 'all',
  };
}

/**
 * Load filter preferences from localStorage
 */
function loadPreferences(): FilterPreferences {
  try {
    const stored = localStorage.getItem(FILTER_PREFERENCES_KEY);
    if (!stored) {
      return {
        lastUsedFilters: {},
        defaultFilters: getDefaultFilters([]),
      };
    }
    return JSON.parse(stored);
  } catch (error) {
    console.error('[FilterPreferences] Error loading preferences:', error);
    return {
      lastUsedFilters: {},
      defaultFilters: getDefaultFilters([]),
    };
  }
}

/**
 * Save filter preferences to localStorage
 */
function savePreferences(preferences: FilterPreferences): void {
  try {
    localStorage.setItem(FILTER_PREFERENCES_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.error('[FilterPreferences] Error saving preferences:', error);
  }
}

/**
 * Get filter preferences for a specific list
 * Falls back to default filters if no preference exists
 */
export function getListFilters(listId: string, allCategories: Category[]): FilterState {
  const preferences = loadPreferences();
  const listPreference = preferences.lastUsedFilters[listId];

  if (listPreference) {
    return listPreference.filters;
  }

  return getDefaultFilters(allCategories);
}

/**
 * Save filter preferences for a specific list
 */
export function saveListFilters(listId: string, filters: FilterState): void {
  const preferences = loadPreferences();

  preferences.lastUsedFilters[listId] = {
    listId,
    filters,
    lastUsed: Date.now(),
  };

  savePreferences(preferences);
}

/**
 * Clear filter preferences for a specific list
 */
export function clearListFilters(listId: string): void {
  const preferences = loadPreferences();
  delete preferences.lastUsedFilters[listId];
  savePreferences(preferences);
}

/**
 * Get all saved filter presets
 */
export function getSavedFilters(): SavedFilter[] {
  try {
    const stored = localStorage.getItem(SAVED_FILTERS_KEY);
    if (!stored) return [];

    const filters = JSON.parse(stored) as SavedFilter[];

    // Sort by most recently used
    return filters.sort((a, b) => b.lastUsed - a.lastUsed);
  } catch (error) {
    console.error('[FilterPreferences] Error loading saved filters:', error);
    return [];
  }
}

/**
 * Save filters as a new preset
 */
export function saveFilterPreset(name: string, filters: FilterState): SavedFilter {
  const savedFilters = getSavedFilters();

  const newFilter: SavedFilter = {
    id: nanoid(),
    name,
    searchText: filters.searchText,
    showGotten: filters.showGotten,
    categories: filters.categories,
    categoryMode: filters.categoryMode,
    categoryType: filters.categoryType,
    createdAt: Date.now(),
    lastUsed: Date.now(),
    useCount: 0,
  };

  // Add to the beginning
  savedFilters.unshift(newFilter);

  // Limit to MAX_SAVED_FILTERS
  const limitedFilters = savedFilters.slice(0, MAX_SAVED_FILTERS);

  try {
    localStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify(limitedFilters));
  } catch (error) {
    console.error('[FilterPreferences] Error saving filter preset:', error);
  }

  return newFilter;
}

/**
 * Update an existing saved filter
 */
export function updateFilterPreset(id: string, updates: Partial<Omit<SavedFilter, 'id' | 'createdAt'>>): void {
  const savedFilters = getSavedFilters();
  const index = savedFilters.findIndex(f => f.id === id);

  if (index === -1) return;

  savedFilters[index] = {
    ...savedFilters[index],
    ...updates,
  };

  try {
    localStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify(savedFilters));
  } catch (error) {
    console.error('[FilterPreferences] Error updating filter preset:', error);
  }
}

/**
 * Delete a saved filter preset
 */
export function deleteFilterPreset(id: string): void {
  const savedFilters = getSavedFilters();
  const filtered = savedFilters.filter(f => f.id !== id);

  try {
    localStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('[FilterPreferences] Error deleting filter preset:', error);
  }
}

/**
 * Apply a saved filter preset and update usage tracking
 */
export function applySavedFilter(id: string): SavedFilter | null {
  const savedFilters = getSavedFilters();
  const filter = savedFilters.find(f => f.id === id);

  if (!filter) return null;

  // Update usage tracking
  updateFilterPreset(id, {
    lastUsed: Date.now(),
    useCount: filter.useCount + 1,
  });

  return filter;
}

/**
 * Get frequently used saved filters (top 5 by use count)
 */
export function getFrequentFilters(): SavedFilter[] {
  const savedFilters = getSavedFilters();
  return savedFilters
    .sort((a, b) => b.useCount - a.useCount)
    .slice(0, 5);
}

/**
 * Get recently used saved filters (top 5 by last used)
 */
export function getRecentFilters(): SavedFilter[] {
  const savedFilters = getSavedFilters();
  return savedFilters
    .sort((a, b) => b.lastUsed - a.lastUsed)
    .slice(0, 5);
}

/**
 * Clear all saved filter presets
 */
export function clearAllFilterPresets(): void {
  try {
    localStorage.removeItem(SAVED_FILTERS_KEY);
  } catch (error) {
    console.error('[FilterPreferences] Error clearing filter presets:', error);
  }
}

/**
 * Export all filter preferences as JSON
 */
export function exportFilterPreferences(): string {
  const preferences = loadPreferences();
  const savedFilters = getSavedFilters();

  return JSON.stringify({
    exportDate: new Date().toISOString(),
    preferences,
    savedFilters,
  }, null, 2);
}

/**
 * Import filter preferences from JSON
 */
export function importFilterPreferences(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);

    if (data.preferences) {
      localStorage.setItem(FILTER_PREFERENCES_KEY, JSON.stringify(data.preferences));
    }

    if (data.savedFilters) {
      localStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify(data.savedFilters));
    }

    return true;
  } catch (error) {
    console.error('[FilterPreferences] Error importing filter preferences:', error);
    return false;
  }
}
