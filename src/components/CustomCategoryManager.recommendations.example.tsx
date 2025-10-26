/**
 * Example Integration of Category Recommendations
 *
 * This file shows how to integrate the CategoryRecommendations component
 * into the CustomCategoryManager. Add this code to your CustomCategoryManager
 * to enable intelligent category recommendations.
 *
 * ## Integration Steps:
 *
 * 1. Update the interface to accept items:
 *    ```typescript
 *    interface CustomCategoryManagerProps {
 *      listId: string;
 *      onClose: () => void;
 *      permissionLevel?: PermissionLevel | null;
 *      items?: GroceryItem[]; // Add this
 *    }
 *    ```
 *
 * 2. Import the CategoryRecommendations component:
 *    ```typescript
 *    import { CategoryRecommendations } from './CategoryRecommendations';
 *    import type { GroceryItem } from '../types';
 *    ```
 *
 * 3. Add recommendation handlers in your component:
 *    - handleCreateFromRecommendation
 *    - handleMergeFromRecommendation
 *    - handleArchiveFromRecommendation
 *
 * 4. Add the CategoryRecommendations component in the body section
 *    (see example below)
 */

import { useState } from 'react';
import { useCustomCategories, useCustomCategoryMutations } from '../hooks/useCustomCategories';
import { CategoryRecommendations } from './CategoryRecommendations';
import type { GroceryItem, CustomCategory } from '../types';

// Example handlers to add to your CustomCategoryManager component:

export function useRecommendationHandlers(
  listId: string,
  addCustomCategory: any,
  mergeCategories: any,
  archiveCategory: any,
  categories: CustomCategory[],
  setSuccessMessage: (msg: string) => void,
  setError: (msg: string) => void
) {
  /**
   * Handle creating a category from a recommendation
   */
  const handleCreateFromRecommendation = async (
    name: string,
    color?: string,
    icon?: string,
    itemsToMove?: string[]
  ) => {
    try {
      await addCustomCategory(
        {
          name,
          listId,
          color,
          icon,
        },
        categories
      );

      setSuccessMessage(`Category "${name}" created successfully!`);

      // TODO: If itemsToMove is provided, update those items to use the new category
      // This would require access to item mutation functions
      if (itemsToMove && itemsToMove.length > 0) {
        console.log(`Note: ${itemsToMove.length} items should be moved to "${name}"`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create category');
      throw err;
    }
  };

  /**
   * Handle merging categories from a recommendation
   */
  const handleMergeFromRecommendation = async (
    sourceIds: string[],
    targetId: string
  ) => {
    try {
      await mergeCategories(sourceIds, targetId);

      const sourceCount = sourceIds.length;
      setSuccessMessage(`Successfully merged ${sourceCount} categor${sourceCount === 1 ? 'y' : 'ies'}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to merge categories');
      throw err;
    }
  };

  /**
   * Handle archiving a category from a recommendation
   */
  const handleArchiveFromRecommendation = async (categoryId: string) => {
    try {
      await archiveCategory(categoryId);

      const category = categories.find(c => c.id === categoryId);
      setSuccessMessage(`Category "${category?.name}" archived successfully`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive category');
      throw err;
    }
  };

  return {
    handleCreateFromRecommendation,
    handleMergeFromRecommendation,
    handleArchiveFromRecommendation,
  };
}

// Example JSX to add to your CustomCategoryManager body:
export function RecommendationsSection({
  items,
  categories,
  onCreateCategory,
  onMergeCategories,
  onArchiveCategory
}: {
  items: GroceryItem[];
  categories: CustomCategory[];
  onCreateCategory: (name: string, color?: string, icon?: string, itemsToMove?: string[]) => Promise<void>;
  onMergeCategories: (sourceIds: string[], targetId: string) => Promise<void>;
  onArchiveCategory: (categoryId: string) => Promise<void>;
}) {
  return (
    <section className="category-section">
      <CategoryRecommendations
        items={items}
        categories={categories}
        onCreateCategory={onCreateCategory}
        onMergeCategories={onMergeCategories}
        onArchiveCategory={onArchiveCategory}
      />
    </section>
  );
}

/**
 * Complete example of CustomCategoryManager with recommendations
 *
 * Add this to your existing CustomCategoryManager.tsx:
 */
export function ExampleWithRecommendations() {
  return (
    <>
      {/* ... existing header code ... */}

      <div className="category-manager-body">
        {/* Add recommendations section FIRST, above other sections */}
        <section className="category-section">
          <CategoryRecommendations
            items={[/* pass items from props */]}
            categories={[/* pass categories from useCustomCategories */]}
            onCreateCategory={async (name, color, icon, itemsToMove) => {
              // Implementation here
            }}
            onMergeCategories={async (sourceIds, targetId) => {
              // Implementation here
            }}
            onArchiveCategory={async (categoryId) => {
              // Implementation here
            }}
          />
        </section>

        {/* ... rest of your existing sections ... */}
        <section className="category-section">
          <h3>Add New Category</h3>
          {/* ... existing add form ... */}
        </section>

        {/* ... other existing sections ... */}
      </div>

      {/* ... existing dialogs and footer ... */}
    </>
  );
}

/**
 * User Preferences Component
 *
 * Optional: Add a settings section to allow users to customize recommendations
 */
export function RecommendationSettings() {
  const [prefs, setPrefs] = useState({
    enabled: true,
    showCreateSuggestions: true,
    showMergeSuggestions: true,
    showArchiveSuggestions: true,
    minConfidence: 0.6,
  });

  return (
    <section className="category-section">
      <h3>Recommendation Settings</h3>
      <div className="settings-form">
        <label className="setting-checkbox">
          <input
            type="checkbox"
            checked={prefs.enabled}
            onChange={(e) => setPrefs({ ...prefs, enabled: e.target.checked })}
          />
          <span>Enable smart recommendations</span>
        </label>

        {prefs.enabled && (
          <>
            <label className="setting-checkbox">
              <input
                type="checkbox"
                checked={prefs.showCreateSuggestions}
                onChange={(e) => setPrefs({ ...prefs, showCreateSuggestions: e.target.checked })}
              />
              <span>Show "create category" suggestions</span>
            </label>

            <label className="setting-checkbox">
              <input
                type="checkbox"
                checked={prefs.showMergeSuggestions}
                onChange={(e) => setPrefs({ ...prefs, showMergeSuggestions: e.target.checked })}
              />
              <span>Show "merge categories" suggestions</span>
            </label>

            <label className="setting-checkbox">
              <input
                type="checkbox"
                checked={prefs.showArchiveSuggestions}
                onChange={(e) => setPrefs({ ...prefs, showArchiveSuggestions: e.target.checked })}
              />
              <span>Show "archive unused" suggestions</span>
            </label>

            <div className="setting-slider">
              <label>Minimum confidence level: {Math.round(prefs.minConfidence * 100)}%</label>
              <input
                type="range"
                min="0"
                max="100"
                value={prefs.minConfidence * 100}
                onChange={(e) => setPrefs({ ...prefs, minConfidence: parseInt(e.target.value) / 100 })}
              />
            </div>
          </>
        )}

        <button className="btn btn-primary" onClick={() => {
          // Save preferences using saveRecommendationPreferences from utils
          console.log('Save preferences:', prefs);
        }}>
          Save Preferences
        </button>
      </div>
    </section>
  );
}
