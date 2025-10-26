import { useState, useEffect } from 'react';
import type { RecipeCollection } from '../types';
import './RecipeCollections.css';

/**
 * RecipeCollections Props
 */
export interface RecipeCollectionsProps {
  /** User ID to fetch collections for */
  userId: string;
  /** Callback when user wants to view a collection */
  onViewCollection?: (collectionId: string) => void;
  /** Callback when collection is created */
  onCreateCollection?: (name: string, description?: string) => Promise<void>;
  /** Callback when collection is updated */
  onUpdateCollection?: (collectionId: string, name: string, description?: string) => Promise<void>;
  /** Callback when collection is deleted */
  onDeleteCollection?: (collectionId: string) => Promise<void>;
  /** Callback to fetch collections */
  onFetchCollections: () => Promise<RecipeCollection[]>;
}

/**
 * RecipeCollections Component
 *
 * Displays and manages user's recipe collections:
 * - View all collections with recipe counts
 * - Create new collections
 * - Edit collection name and description
 * - Delete collections
 * - Visual cards for each collection
 *
 * @example
 * ```tsx
 * <RecipeCollections
 *   userId="user-123"
 *   onViewCollection={handleViewCollection}
 *   onCreateCollection={handleCreateCollection}
 *   onUpdateCollection={handleUpdateCollection}
 *   onDeleteCollection={handleDeleteCollection}
 *   onFetchCollections={fetchCollections}
 * />
 * ```
 */
export function RecipeCollections({
  userId,
  onViewCollection,
  onCreateCollection,
  onUpdateCollection,
  onDeleteCollection,
  onFetchCollections,
}: RecipeCollectionsProps) {
  const [collections, setCollections] = useState<RecipeCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Create collection state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDescription, setNewCollectionDescription] = useState('');
  const [creating, setCreating] = useState(false);

  // Edit collection state
  const [editingCollectionId, setEditingCollectionId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [updating, setUpdating] = useState(false);

  // Delete confirmation state
  const [deletingCollectionId, setDeletingCollectionId] = useState<string | null>(null);

  /**
   * Load collections on mount
   */
  useEffect(() => {
    loadCollections();
  }, [userId]);

  /**
   * Fetch collections from API
   */
  const loadCollections = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await onFetchCollections();
      setCollections(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load collections';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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
    setTimeout(() => setSuccess(null), 3000);
  };

  /**
   * Handle create collection
   */
  const handleCreateCollection = async () => {
    if (!newCollectionName.trim() || !onCreateCollection) return;

    clearMessages();
    setCreating(true);

    try {
      await onCreateCollection(newCollectionName.trim(), newCollectionDescription.trim() || undefined);

      // Reload collections
      await loadCollections();

      // Reset form
      setNewCollectionName('');
      setNewCollectionDescription('');
      setShowCreateForm(false);

      showSuccess('Collection created successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create collection';
      setError(errorMessage);
    } finally {
      setCreating(false);
    }
  };

  /**
   * Start editing a collection
   */
  const startEditCollection = (collection: RecipeCollection) => {
    setEditingCollectionId(collection.id);
    setEditName(collection.name);
    setEditDescription(collection.description || '');
  };

  /**
   * Cancel editing
   */
  const cancelEdit = () => {
    setEditingCollectionId(null);
    setEditName('');
    setEditDescription('');
  };

  /**
   * Save edited collection
   */
  const handleSaveEdit = async (collectionId: string) => {
    if (!editName.trim() || !onUpdateCollection) return;

    clearMessages();
    setUpdating(true);

    try {
      await onUpdateCollection(collectionId, editName.trim(), editDescription.trim() || undefined);

      // Reload collections
      await loadCollections();

      // Reset edit state
      setEditingCollectionId(null);
      setEditName('');
      setEditDescription('');

      showSuccess('Collection updated successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update collection';
      setError(errorMessage);
    } finally {
      setUpdating(false);
    }
  };

  /**
   * Handle delete collection with confirmation
   */
  const handleDeleteCollection = async (collectionId: string) => {
    if (!onDeleteCollection) return;

    clearMessages();
    setDeletingCollectionId(collectionId);

    try {
      await onDeleteCollection(collectionId);

      // Reload collections
      await loadCollections();

      showSuccess('Collection deleted successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete collection';
      setError(errorMessage);
    } finally {
      setDeletingCollectionId(null);
    }
  };

  /**
   * Confirm delete with user
   */
  const confirmDelete = (collection: RecipeCollection) => {
    const recipeCount = collection.recipeCount || 0;
    const message = recipeCount > 0
      ? `Delete "${collection.name}"? This will remove ${recipeCount} recipe${recipeCount !== 1 ? 's' : ''} from this collection.`
      : `Delete "${collection.name}"?`;

    if (confirm(message)) {
      handleDeleteCollection(collection.id);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="recipe-collections-container">
        <div className="recipe-collections-loading">
          <div className="spinner-large"></div>
          <p>Loading collections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="recipe-collections-container">
      {/* Header */}
      <div className="recipe-collections-header">
        <div>
          <h2>My Recipe Collections</h2>
          <p className="collections-subtitle">
            Organize your recipes into collections for easy access
          </p>
        </div>
        <button
          className="btn btn-primary btn-create-collection"
          onClick={() => setShowCreateForm(true)}
          disabled={showCreateForm}
        >
          <span className="btn-icon">+</span>
          <span>New Collection</span>
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="collection-message collection-message-error" role="alert">
          <span className="message-icon">⚠</span>
          <span className="message-text">{error}</span>
        </div>
      )}

      {success && (
        <div className="collection-message collection-message-success" role="status">
          <span className="message-icon">✓</span>
          <span className="message-text">{success}</span>
        </div>
      )}

      {/* Create Collection Form */}
      {showCreateForm && (
        <div className="create-collection-form">
          <div className="form-header">
            <h3>Create New Collection</h3>
            <button
              className="btn-close-form"
              onClick={() => {
                setShowCreateForm(false);
                setNewCollectionName('');
                setNewCollectionDescription('');
              }}
              aria-label="Close form"
            >
              ✕
            </button>
          </div>

          <div className="form-fields">
            <div className="form-group">
              <label htmlFor="collection-name">Collection Name *</label>
              <input
                id="collection-name"
                type="text"
                className="form-input"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder="e.g., Holiday Favorites, Quick Dinners"
                maxLength={100}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="collection-description">Description (optional)</label>
              <textarea
                id="collection-description"
                className="form-textarea"
                value={newCollectionDescription}
                onChange={(e) => setNewCollectionDescription(e.target.value)}
                placeholder="Describe your collection..."
                maxLength={500}
                rows={3}
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              className="btn btn-secondary"
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
              className="btn btn-primary"
              onClick={handleCreateCollection}
              disabled={!newCollectionName.trim() || creating}
            >
              {creating ? (
                <>
                  <span className="spinner"></span>
                  <span>Creating...</span>
                </>
              ) : (
                'Create Collection'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Collections Grid */}
      {collections.length === 0 ? (
        <div className="collections-empty-state">
          <div className="empty-state-icon">📚</div>
          <h3>No Collections Yet</h3>
          <p>Create your first collection to organize your recipes</p>
          {!showCreateForm && (
            <button
              className="btn btn-primary"
              onClick={() => setShowCreateForm(true)}
            >
              Create Collection
            </button>
          )}
        </div>
      ) : (
        <div className="collections-grid">
          {collections.map((collection) => {
            const isEditing = editingCollectionId === collection.id;
            const isDeleting = deletingCollectionId === collection.id;
            const recipeCount = collection.recipeCount || 0;

            return (
              <div
                key={collection.id}
                className={`collection-card ${isEditing ? 'editing' : ''}`}
              >
                {isEditing ? (
                  /* Edit Mode */
                  <div className="collection-edit-form">
                    <div className="form-group">
                      <label htmlFor={`edit-name-${collection.id}`}>Name *</label>
                      <input
                        id={`edit-name-${collection.id}`}
                        type="text"
                        className="form-input"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        maxLength={100}
                        autoFocus
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor={`edit-description-${collection.id}`}>Description</label>
                      <textarea
                        id={`edit-description-${collection.id}`}
                        className="form-textarea"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        maxLength={500}
                        rows={2}
                      />
                    </div>

                    <div className="edit-actions">
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={cancelEdit}
                        disabled={updating}
                      >
                        Cancel
                      </button>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleSaveEdit(collection.id)}
                        disabled={!editName.trim() || updating}
                      >
                        {updating ? (
                          <>
                            <span className="spinner-small"></span>
                            <span>Saving...</span>
                          </>
                        ) : (
                          'Save'
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* View Mode */
                  <>
                    <div
                      className="collection-content"
                      onClick={() => onViewCollection?.(collection.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onViewCollection?.(collection.id);
                        }
                      }}
                    >
                      <div className="collection-icon">📚</div>
                      <div className="collection-info">
                        <h3 className="collection-name">{collection.name}</h3>
                        {collection.description && (
                          <p className="collection-description">{collection.description}</p>
                        )}
                        <div className="collection-meta">
                          <span className="recipe-count">
                            {recipeCount} {recipeCount === 1 ? 'recipe' : 'recipes'}
                          </span>
                          <span className="collection-visibility">
                            {collection.isPublic ? '🌐 Public' : '🔒 Private'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="collection-actions">
                      <button
                        className="btn-action btn-edit"
                        onClick={() => startEditCollection(collection)}
                        title="Edit collection"
                        aria-label="Edit collection"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-action btn-delete"
                        onClick={() => confirmDelete(collection)}
                        disabled={isDeleting}
                        title="Delete collection"
                        aria-label="Delete collection"
                      >
                        {isDeleting ? (
                          <span className="spinner-small"></span>
                        ) : (
                          '🗑️'
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
