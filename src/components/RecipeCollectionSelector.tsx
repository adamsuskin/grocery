import { useState, useEffect, FormEvent } from 'react';
import type { RecipeCollection } from '../types';
import './RecipeCollectionSelector.css';

/**
 * RecipeCollectionSelector Props
 */
export interface RecipeCollectionSelectorProps {
  /** Recipe ID to add to collections */
  recipeId: string;
  /** Recipe name for display */
  recipeName: string;
  /** User's collections */
  collections: RecipeCollection[];
  /** IDs of collections this recipe is already in */
  currentCollectionIds: string[];
  /** Callback when modal is closed */
  onClose: () => void;
  /** Callback to add recipe to collection */
  onAddToCollection: (collectionId: string) => Promise<void>;
  /** Callback to remove recipe from collection */
  onRemoveFromCollection: (collectionId: string) => Promise<void>;
  /** Callback to create new collection and add recipe */
  onCreateCollection?: (name: string, description?: string) => Promise<string>;
  /** Callback to refresh collections list */
  onRefreshCollections?: () => Promise<void>;
}

/**
 * RecipeCollectionSelector Component
 *
 * Modal for adding a recipe to one or more collections:
 * - Lists all user collections with checkboxes
 * - Shows which collections recipe is already in
 * - Allows creating new collection inline
 * - Multi-select support
 * - Real-time updates
 *
 * @example
 * ```tsx
 * <RecipeCollectionSelector
 *   recipeId="recipe-123"
 *   recipeName="Chocolate Chip Cookies"
 *   collections={userCollections}
 *   currentCollectionIds={["col-1", "col-2"]}
 *   onClose={() => setShowModal(false)}
 *   onAddToCollection={handleAddToCollection}
 *   onRemoveFromCollection={handleRemoveFromCollection}
 *   onCreateCollection={handleCreateCollection}
 *   onRefreshCollections={handleRefreshCollections}
 * />
 * ```
 */
export function RecipeCollectionSelector({
  recipeId: _recipeId,
  recipeName,
  collections,
  currentCollectionIds,
  onClose,
  onAddToCollection,
  onRemoveFromCollection,
  onCreateCollection,
  onRefreshCollections,
}: RecipeCollectionSelectorProps) {
  // Track which collections are selected
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<Set<string>>(
    new Set(currentCollectionIds)
  );

  // Track loading state for each collection
  const [loadingCollectionIds, setLoadingCollectionIds] = useState<Set<string>>(new Set());

  // Create new collection state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDescription, setNewCollectionDescription] = useState('');
  const [creating, setCreating] = useState(false);

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  /**
   * Clear messages after timeout
   */
  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  /**
   * Show success message temporarily
   */
  const showSuccess = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 2000);
  };

  /**
   * Handle checkbox toggle for a collection
   */
  const handleToggleCollection = async (collectionId: string, isCurrentlySelected: boolean) => {
    clearMessages();

    // Add to loading state
    setLoadingCollectionIds(prev => new Set(prev).add(collectionId));

    try {
      if (isCurrentlySelected) {
        // Remove from collection
        await onRemoveFromCollection(collectionId);
        setSelectedCollectionIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(collectionId);
          return newSet;
        });
        showSuccess('Removed from collection');
      } else {
        // Add to collection
        await onAddToCollection(collectionId);
        setSelectedCollectionIds(prev => new Set(prev).add(collectionId));
        showSuccess('Added to collection');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update collection';
      setError(errorMessage);
    } finally {
      // Remove from loading state
      setLoadingCollectionIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(collectionId);
        return newSet;
      });
    }
  };

  /**
   * Handle creating a new collection
   */
  const handleCreateCollection = async (e?: FormEvent) => {
    e?.preventDefault();

    if (!newCollectionName.trim() || !onCreateCollection) return;

    clearMessages();
    setCreating(true);

    try {
      // Create collection and get its ID
      const newCollectionId = await onCreateCollection(
        newCollectionName.trim(),
        newCollectionDescription.trim() || undefined
      );

      // Refresh collections list
      if (onRefreshCollections) {
        await onRefreshCollections();
      }

      // Add recipe to new collection
      await onAddToCollection(newCollectionId);
      setSelectedCollectionIds(prev => new Set(prev).add(newCollectionId));

      // Reset form
      setNewCollectionName('');
      setNewCollectionDescription('');
      setShowCreateForm(false);

      showSuccess('Collection created and recipe added!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create collection';
      setError(errorMessage);
    } finally {
      setCreating(false);
    }
  };

  /**
   * Handle clicking outside modal to close
   */
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  /**
   * Handle Escape key to close modal
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="collection-selector-overlay" onClick={handleOverlayClick}>
      <div className="collection-selector-modal" role="dialog" aria-labelledby="collection-selector-title">
        {/* Header */}
        <div className="collection-selector-header">
          <div>
            <h2 id="collection-selector-title">Add to Collection</h2>
            <p className="recipe-name-subtitle">{recipeName}</p>
          </div>
          <button
            className="collection-selector-close"
            onClick={onClose}
            aria-label="Close modal"
            type="button"
          >
            ✕
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="selector-message selector-message-error" role="alert">
            <span className="message-icon">⚠</span>
            <span className="message-text">{error}</span>
          </div>
        )}

        {success && (
          <div className="selector-message selector-message-success" role="status">
            <span className="message-icon">✓</span>
            <span className="message-text">{success}</span>
          </div>
        )}

        {/* Collections List */}
        <div className="collection-selector-content">
          <div className="collections-list-header">
            <h3>Your Collections ({collections.length})</h3>
            {onCreateCollection && !showCreateForm && (
              <button
                className="btn-new-collection"
                onClick={() => setShowCreateForm(true)}
                type="button"
              >
                + New Collection
              </button>
            )}
          </div>

          {/* Create Collection Form */}
          {showCreateForm && onCreateCollection && (
            <form className="inline-create-form" onSubmit={handleCreateCollection}>
              <div className="inline-form-fields">
                <div className="inline-form-group">
                  <input
                    type="text"
                    className="inline-input"
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    placeholder="Collection name"
                    maxLength={100}
                    autoFocus
                    required
                  />
                </div>
                <div className="inline-form-group">
                  <textarea
                    className="inline-textarea"
                    value={newCollectionDescription}
                    onChange={(e) => setNewCollectionDescription(e.target.value)}
                    placeholder="Description (optional)"
                    maxLength={500}
                    rows={2}
                  />
                </div>
              </div>
              <div className="inline-form-actions">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewCollectionName('');
                    setNewCollectionDescription('');
                  }}
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={!newCollectionName.trim() || creating}
                >
                  {creating ? (
                    <>
                      <span className="spinner-small"></span>
                      <span>Creating...</span>
                    </>
                  ) : (
                    'Create & Add'
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Collections List */}
          {collections.length === 0 ? (
            <div className="collections-empty">
              <p>No collections yet. Create one to get started!</p>
              {!showCreateForm && onCreateCollection && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowCreateForm(true)}
                >
                  Create Collection
                </button>
              )}
            </div>
          ) : (
            <div className="collections-list">
              {collections.map((collection) => {
                const isSelected = selectedCollectionIds.has(collection.id);
                const isLoading = loadingCollectionIds.has(collection.id);
                const recipeCount = collection.recipeCount || 0;

                return (
                  <label
                    key={collection.id}
                    className={`collection-item ${isSelected ? 'selected' : ''} ${
                      isLoading ? 'loading' : ''
                    }`}
                  >
                    <div className="collection-checkbox-wrapper">
                      <input
                        type="checkbox"
                        className="collection-checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleCollection(collection.id, isSelected)}
                        disabled={isLoading}
                        aria-label={`${isSelected ? 'Remove from' : 'Add to'} ${collection.name}`}
                      />
                      <span className="custom-checkbox">
                        {isLoading ? (
                          <span className="spinner-tiny"></span>
                        ) : (
                          isSelected && <span className="checkmark">✓</span>
                        )}
                      </span>
                    </div>

                    <div className="collection-item-info">
                      <div className="collection-item-name">{collection.name}</div>
                      {collection.description && (
                        <div className="collection-item-description">{collection.description}</div>
                      )}
                      <div className="collection-item-meta">
                        <span className="recipe-count">
                          {recipeCount} {recipeCount === 1 ? 'recipe' : 'recipes'}
                        </span>
                        {collection.isPublic && (
                          <span className="visibility-badge">🌐 Public</span>
                        )}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="collection-selector-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
