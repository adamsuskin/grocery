import { useState, memo } from 'react';
import type { Recipe, RecipeDifficulty, PermissionLevel } from '../types';
import './RecipeCard.css';

export interface RecipeCardProps {
  recipe: Recipe;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onAddToList?: (recipeId: string) => void;
  onAddToCollection?: (recipeId: string) => void;
  onServingsChange?: (recipeId: string, servings: number) => void;
  canEdit?: boolean;
  compact?: boolean; // Compact view for lists
  currentUserId?: string;
  userPermission?: PermissionLevel;
}

/**
 * Get color for difficulty badge
 */
function getDifficultyColor(difficulty?: RecipeDifficulty): string {
  switch (difficulty) {
    case 'easy':
      return 'var(--difficulty-easy)';
    case 'medium':
      return 'var(--difficulty-medium)';
    case 'hard':
      return 'var(--difficulty-hard)';
    default:
      return 'var(--text-muted)';
  }
}

/**
 * Format time in human-readable format
 */
function formatTime(minutes?: number): string {
  if (!minutes) return 'N/A';

  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (mins === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${mins}m`;
}

/**
 * Get total time (prep + cook)
 */
function getTotalTime(recipe: Recipe): string {
  const total = (recipe.prepTime || 0) + (recipe.cookTime || 0);
  return formatTime(total);
}

/**
 * Format timestamp as relative or absolute date
 */
function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString();
  }
}

/**
 * Parse instructions into numbered steps
 */
function parseInstructions(instructions: string): string[] {
  // Split by newlines or numbered patterns
  const lines = instructions.split(/\n+/);

  // Filter out empty lines and trim
  return lines
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => {
      // Remove leading numbers if present (e.g., "1. Step" -> "Step")
      return line.replace(/^\d+\.\s*/, '');
    });
}

/**
 * RecipeCard Component
 *
 * Displays a recipe with all details including ingredients, instructions,
 * metadata, and action buttons. Supports both full and compact views.
 */
export const RecipeCard = memo(function RecipeCard({
  recipe,
  onEdit,
  onDelete,
  onDuplicate,
  onAddToList,
  onAddToCollection,
  onServingsChange,
  canEdit = false,
  compact = false,
  currentUserId,
  userPermission = 'viewer',
}: RecipeCardProps) {
  const [servings, setServings] = useState(recipe.servings);
  const [showIngredients, setShowIngredients] = useState(!compact);
  const [showInstructions, setShowInstructions] = useState(!compact);

  const isOwner = currentUserId === recipe.userId;
  const canModify = canEdit || isOwner || userPermission === 'owner' || userPermission === 'editor';

  const instructions = parseInstructions(recipe.instructions);
  const totalTime = getTotalTime(recipe);

  /**
   * Handle servings increment
   */
  const handleServingsIncrease = () => {
    const newServings = servings + 1;
    setServings(newServings);
    if (onServingsChange) {
      onServingsChange(recipe.id, newServings);
    }
  };

  /**
   * Handle servings decrement
   */
  const handleServingsDecrease = () => {
    if (servings > 1) {
      const newServings = servings - 1;
      setServings(newServings);
      if (onServingsChange) {
        onServingsChange(recipe.id, newServings);
      }
    }
  };

  /**
   * Handle delete with confirmation
   */
  const handleDelete = () => {
    if (confirm(`Delete recipe "${recipe.name}"?`)) {
      onDelete?.();
    }
  };

  /**
   * Handle duplicate
   */
  const handleDuplicate = () => {
    onDuplicate?.();
  };

  /**
   * Handle add to list
   */
  const handleAddToList = () => {
    onAddToList?.(recipe.id);
  };

  /**
   * Handle add to collection
   */
  const handleAddToCollection = () => {
    onAddToCollection?.(recipe.id);
  };

  /**
   * Handle edit
   */
  const handleEdit = () => {
    onEdit?.();
  };

  // Compact view
  if (compact) {
    return (
      <div className="recipe-card recipe-card-compact">
        {recipe.imageUrl && (
          <div className="recipe-image-compact">
            <img src={recipe.imageUrl} alt={recipe.name} loading="lazy" />
          </div>
        )}

        <div className="recipe-card-content">
          <div className="recipe-header-compact">
            <h3 className="recipe-name">{recipe.name}</h3>
            {recipe.difficulty && (
              <span
                className={`difficulty-badge difficulty-${recipe.difficulty}`}
                style={{ backgroundColor: getDifficultyColor(recipe.difficulty) }}
              >
                {recipe.difficulty}
              </span>
            )}
          </div>

          {recipe.description && (
            <p className="recipe-description-compact">{recipe.description}</p>
          )}

          <div className="recipe-metadata-compact">
            <span className="metadata-item">
              <span className="metadata-icon">⏱️</span>
              {totalTime}
            </span>
            <span className="metadata-item">
              <span className="metadata-icon">🍽️</span>
              {servings} servings
            </span>
            {recipe.cuisineType && (
              <span className="cuisine-badge">{recipe.cuisineType}</span>
            )}
          </div>

          <div className="recipe-actions-compact">
            {canModify && onEdit && (
              <button className="btn-action btn-edit" onClick={handleEdit} title="Edit recipe">
                ✏️
              </button>
            )}
            {onDuplicate && (
              <button className="btn-action btn-duplicate" onClick={handleDuplicate} title="Duplicate recipe">
                📋
              </button>
            )}
            {onAddToList && (
              <button className="btn-action btn-add-to-list" onClick={handleAddToList} title="Add to list">
                🛒
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Full view
  return (
    <div className="recipe-card">
      {/* Recipe Header */}
      <div className="recipe-header">
        <div className="recipe-header-top">
          <h2 className="recipe-name">{recipe.name}</h2>
          <div className="recipe-badges">
            {recipe.isPublic ? (
              <span className="visibility-badge public" title="Public recipe">
                🌐 Public
              </span>
            ) : (
              <span className="visibility-badge private" title="Private recipe">
                🔒 Private
              </span>
            )}
            {recipe.difficulty && (
              <span
                className={`difficulty-badge difficulty-${recipe.difficulty}`}
                style={{ backgroundColor: getDifficultyColor(recipe.difficulty) }}
              >
                {recipe.difficulty}
              </span>
            )}
            {recipe.cuisineType && (
              <span className="cuisine-badge">{recipe.cuisineType}</span>
            )}
          </div>
        </div>

        {recipe.description && (
          <p className="recipe-description">{recipe.description}</p>
        )}
      </div>

      {/* Recipe Image */}
      {recipe.imageUrl && (
        <div className="recipe-image">
          <img src={recipe.imageUrl} alt={recipe.name} loading="lazy" />
        </div>
      )}

      {/* Recipe Metadata Grid */}
      <div className="recipe-metadata-grid">
        {recipe.prepTime && (
          <div className="metadata-card">
            <span className="metadata-icon">🔪</span>
            <div className="metadata-info">
              <span className="metadata-label">Prep Time</span>
              <span className="metadata-value">{formatTime(recipe.prepTime)}</span>
            </div>
          </div>
        )}

        {recipe.cookTime && (
          <div className="metadata-card">
            <span className="metadata-icon">🔥</span>
            <div className="metadata-info">
              <span className="metadata-label">Cook Time</span>
              <span className="metadata-value">{formatTime(recipe.cookTime)}</span>
            </div>
          </div>
        )}

        {(recipe.prepTime || recipe.cookTime) && (
          <div className="metadata-card">
            <span className="metadata-icon">⏱️</span>
            <div className="metadata-info">
              <span className="metadata-label">Total Time</span>
              <span className="metadata-value">{totalTime}</span>
            </div>
          </div>
        )}

        <div className="metadata-card servings-card">
          <span className="metadata-icon">🍽️</span>
          <div className="metadata-info">
            <span className="metadata-label">Servings</span>
            <div className="servings-controls">
              <button
                className="servings-btn"
                onClick={handleServingsDecrease}
                disabled={servings <= 1}
                aria-label="Decrease servings"
              >
                −
              </button>
              <span className="metadata-value servings-value">{servings}</span>
              <button
                className="servings-btn"
                onClick={handleServingsIncrease}
                aria-label="Increase servings"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Ingredients Section */}
      <div className="recipe-section">
        <button
          className="section-header"
          onClick={() => setShowIngredients(!showIngredients)}
          aria-expanded={showIngredients}
        >
          <h3 className="section-title">
            <span className="section-icon">🥕</span>
            Ingredients
            {recipe.ingredients && (
              <span className="section-count">({recipe.ingredients.length})</span>
            )}
          </h3>
          <span className={`collapse-icon ${showIngredients ? 'expanded' : ''}`}>
            ▼
          </span>
        </button>

        {showIngredients && (
          <div className="section-content">
            {recipe.ingredients && recipe.ingredients.length > 0 ? (
              <ul className="ingredients-list">
                {recipe.ingredients.map((ingredient) => {
                  // Adjust quantities based on servings
                  const adjustedQuantity =
                    (ingredient.quantity * servings) / recipe.servings;

                  return (
                    <li key={ingredient.id} className="ingredient-item">
                      <input
                        type="checkbox"
                        className="ingredient-checkbox"
                        aria-label={`Check off ${ingredient.name}`}
                      />
                      <span className="ingredient-text">
                        <span className="ingredient-quantity">
                          {adjustedQuantity.toFixed(adjustedQuantity % 1 === 0 ? 0 : 1)}{' '}
                          {ingredient.unit}
                        </span>
                        <span className="ingredient-name">{ingredient.name}</span>
                        {ingredient.notes && (
                          <span className="ingredient-notes">({ingredient.notes})</span>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="empty-state">No ingredients listed</p>
            )}
          </div>
        )}
      </div>

      {/* Instructions Section */}
      <div className="recipe-section">
        <button
          className="section-header"
          onClick={() => setShowInstructions(!showInstructions)}
          aria-expanded={showInstructions}
        >
          <h3 className="section-title">
            <span className="section-icon">📝</span>
            Instructions
            <span className="section-count">({instructions.length} steps)</span>
          </h3>
          <span className={`collapse-icon ${showInstructions ? 'expanded' : ''}`}>
            ▼
          </span>
        </button>

        {showInstructions && (
          <div className="section-content">
            <ol className="instructions-list">
              {instructions.map((instruction, index) => (
                <li key={index} className="instruction-item">
                  <span className="instruction-number">{index + 1}</span>
                  <span className="instruction-text">{instruction}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      {/* Recipe Footer (User and Timestamps) */}
      <div className="recipe-footer">
        <div className="recipe-author">
          <div className="author-avatar">
            {recipe.userId.charAt(0).toUpperCase()}
          </div>
          <div className="author-info">
            <span className="author-label">Created by</span>
            <span className="author-name">
              {isOwner ? 'You' : 'User'}
            </span>
          </div>
        </div>

        <div className="recipe-timestamps">
          <span className="timestamp-item" title={new Date(recipe.createdAt).toLocaleString()}>
            Created {formatTimestamp(recipe.createdAt)}
          </span>
          {recipe.updatedAt !== recipe.createdAt && (
            <span className="timestamp-item" title={new Date(recipe.updatedAt).toLocaleString()}>
              Updated {formatTimestamp(recipe.updatedAt)}
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="recipe-actions">
        {canModify && onEdit && (
          <button className="btn btn-action btn-edit" onClick={handleEdit}>
            <span className="btn-icon">✏️</span>
            <span className="btn-text">Edit</span>
          </button>
        )}

        {canModify && onDelete && (
          <button className="btn btn-action btn-delete" onClick={handleDelete}>
            <span className="btn-icon">🗑️</span>
            <span className="btn-text">Delete</span>
          </button>
        )}

        {onDuplicate && (
          <button className="btn btn-action btn-duplicate" onClick={handleDuplicate}>
            <span className="btn-icon">📋</span>
            <span className="btn-text">Duplicate</span>
          </button>
        )}

        {onAddToList && (
          <button className="btn btn-action btn-add-to-list" onClick={handleAddToList}>
            <span className="btn-icon">🛒</span>
            <span className="btn-text">Add to List</span>
          </button>
        )}

        {onAddToCollection && (
          <button className="btn btn-action btn-add-to-collection" onClick={handleAddToCollection}>
            <span className="btn-icon">📚</span>
            <span className="btn-text">Add to Collection</span>
          </button>
        )}
      </div>
    </div>
  );
});
