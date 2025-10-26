import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRecipes, usePublicRecipes, useRecipeMutations } from '../zero-store';
import { RecipeFilterBar } from './RecipeFilterBar';
import { RecipeSortControls } from './RecipeSortControls';
import type { Recipe, RecipeFilterState, RecipeSortState, RecipeDifficulty } from '../types';
import './RecipeList.css';

export interface RecipeListProps {
  userId: string;
  showPublic?: boolean;
  onRecipeClick?: (recipe: Recipe) => void;
  onCreateRecipe?: () => void;
}

type ViewMode = 'grid' | 'list';

const INITIAL_FILTERS: RecipeFilterState = {
  searchText: '',
  difficulty: undefined,
  cuisineType: undefined,
  prepTimeMax: undefined,
  cookTimeMax: undefined,
  isPublic: undefined,
};

const INITIAL_SORT: RecipeSortState = {
  field: 'createdAt',
  direction: 'desc',
};

export function RecipeList({
  userId,
  showPublic = false,
  onRecipeClick,
  onCreateRecipe,
}: RecipeListProps) {
  const [filters, setFilters] = useState<RecipeFilterState>(INITIAL_FILTERS);
  const [sort, setSort] = useState<RecipeSortState>(INITIAL_SORT);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedRecipes, setSelectedRecipes] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [showMyRecipes, setShowMyRecipes] = useState(!showPublic);

  const { deleteRecipe } = useRecipeMutations();

  // Get recipes based on showMyRecipes toggle
  const myRecipes = useRecipes(userId);
  const publicRecipes = usePublicRecipes();

  const allRecipes = useMemo(() => {
    return showMyRecipes ? myRecipes : publicRecipes;
  }, [showMyRecipes, myRecipes, publicRecipes]);

  // Simulate loading state
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [showMyRecipes]);

  // Apply filters and sorting
  const filteredAndSortedRecipes = useMemo(() => {
    let recipes = [...allRecipes];

    // Apply search filter
    if (filters.searchText.trim()) {
      const searchLower = filters.searchText.toLowerCase();
      recipes = recipes.filter(recipe => {
        const nameMatch = recipe.name.toLowerCase().includes(searchLower);
        const descriptionMatch = recipe.description?.toLowerCase().includes(searchLower);
        const ingredientsMatch = recipe.ingredients?.some(ing =>
          ing.name.toLowerCase().includes(searchLower)
        );
        return nameMatch || descriptionMatch || ingredientsMatch;
      });
    }

    // Apply difficulty filter
    if (filters.difficulty && filters.difficulty.length > 0) {
      recipes = recipes.filter(recipe =>
        recipe.difficulty && filters.difficulty!.includes(recipe.difficulty)
      );
    }

    // Apply cuisine type filter
    if (filters.cuisineType && filters.cuisineType.length > 0) {
      recipes = recipes.filter(recipe =>
        recipe.cuisineType && filters.cuisineType!.includes(recipe.cuisineType)
      );
    }

    // Apply prep time filter
    if (filters.prepTimeMax !== undefined) {
      recipes = recipes.filter(recipe =>
        recipe.prepTime !== undefined && recipe.prepTime <= filters.prepTimeMax!
      );
    }

    // Apply cook time filter
    if (filters.cookTimeMax !== undefined) {
      recipes = recipes.filter(recipe =>
        recipe.cookTime !== undefined && recipe.cookTime <= filters.cookTimeMax!
      );
    }

    // Apply sorting
    recipes.sort((a, b) => {
      let comparison = 0;

      switch (sort.field) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'createdAt':
          comparison = a.createdAt - b.createdAt;
          break;
        case 'prepTime':
          comparison = (a.prepTime || 0) - (b.prepTime || 0);
          break;
        case 'cookTime':
          comparison = (a.cookTime || 0) - (b.cookTime || 0);
          break;
      }

      return sort.direction === 'asc' ? comparison : -comparison;
    });

    return recipes;
  }, [allRecipes, filters, sort]);

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: Partial<RecipeFilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Handle sort changes
  const handleSortChange = useCallback((newSort: RecipeSortState) => {
    setSort(newSort);
  }, []);

  // Handle recipe selection for bulk actions
  const handleRecipeSelect = useCallback((recipeId: string) => {
    setSelectedRecipes(prev => {
      const next = new Set(prev);
      if (next.has(recipeId)) {
        next.delete(recipeId);
      } else {
        next.add(recipeId);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedRecipes.size === filteredAndSortedRecipes.length) {
      setSelectedRecipes(new Set());
    } else {
      setSelectedRecipes(new Set(filteredAndSortedRecipes.map(r => r.id)));
    }
  }, [selectedRecipes.size, filteredAndSortedRecipes]);

  // Handle bulk delete
  const handleBulkDelete = useCallback(async () => {
    if (selectedRecipes.size === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedRecipes.size} recipe(s)?`
    );

    if (!confirmed) return;

    try {
      await Promise.all(
        Array.from(selectedRecipes).map(id => deleteRecipe(id))
      );
      setSelectedRecipes(new Set());
    } catch (error) {
      console.error('Error deleting recipes:', error);
      alert('Failed to delete some recipes. Please try again.');
    }
  }, [selectedRecipes, deleteRecipe]);

  // Handle recipe click
  const handleRecipeClickInternal = useCallback((recipe: Recipe) => {
    if (onRecipeClick) {
      onRecipeClick(recipe);
    }
  }, [onRecipeClick]);

  // Clear filters
  const handleClearFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
  }, []);

  // Calculate active filters
  const hasActiveFilters = useMemo(() => {
    return (
      filters.searchText !== '' ||
      (filters.difficulty && filters.difficulty.length > 0) ||
      (filters.cuisineType && filters.cuisineType.length > 0) ||
      filters.prepTimeMax !== undefined ||
      filters.cookTimeMax !== undefined
    );
  }, [filters]);

  return (
    <div className="recipe-list-container">
      {/* Header with view toggle and my/public toggle */}
      <div className="recipe-list-header">
        <div className="recipe-list-title">
          <h2>
            {showMyRecipes ? 'My Recipes' : 'Public Recipes'}
            <span className="recipe-count">({filteredAndSortedRecipes.length})</span>
          </h2>
        </div>

        <div className="recipe-list-controls">
          {/* My Recipes / Public Recipes Toggle */}
          <div className="recipe-visibility-toggle">
            <button
              className={`toggle-btn ${showMyRecipes ? 'active' : ''}`}
              onClick={() => setShowMyRecipes(true)}
              aria-pressed={showMyRecipes}
            >
              My Recipes
            </button>
            <button
              className={`toggle-btn ${!showMyRecipes ? 'active' : ''}`}
              onClick={() => setShowMyRecipes(false)}
              aria-pressed={!showMyRecipes}
            >
              Public Recipes
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="view-mode-toggle">
            <button
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
              title="Grid view"
            >
              <span className="icon-grid">&#9783;</span>
            </button>
            <button
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              aria-label="List view"
              title="List view"
            >
              <span className="icon-list">&#9776;</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Sort Controls */}
      <RecipeFilterBar
        filters={filters}
        onChange={handleFilterChange}
        totalCount={allRecipes.length}
        filteredCount={filteredAndSortedRecipes.length}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      <RecipeSortControls sort={sort} onChange={handleSortChange} />

      {/* Bulk Actions */}
      {selectedRecipes.size > 0 && showMyRecipes && (
        <div className="bulk-actions-bar">
          <div className="bulk-actions-info">
            <button className="btn-select-all" onClick={handleSelectAll}>
              {selectedRecipes.size === filteredAndSortedRecipes.length
                ? 'Deselect All'
                : 'Select All'}
            </button>
            <span className="selected-count">
              {selectedRecipes.size} recipe(s) selected
            </span>
          </div>
          <div className="bulk-actions-buttons">
            <button className="btn-bulk-delete" onClick={handleBulkDelete}>
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Recipe Grid/List */}
      {isLoading ? (
        <div className={`recipe-${viewMode} recipe-loading`}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="recipe-card skeleton">
              <div className="skeleton-image"></div>
              <div className="skeleton-content">
                <div className="skeleton-title"></div>
                <div className="skeleton-text"></div>
                <div className="skeleton-text short"></div>
                <div className="skeleton-footer"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredAndSortedRecipes.length === 0 ? (
        <div className="empty-state">
          {hasActiveFilters ? (
            <>
              <div className="empty-icon">&#128269;</div>
              <h3>No recipes match your filters</h3>
              <p>Try adjusting your search or filter criteria</p>
              <button className="btn-clear-empty" onClick={handleClearFilters}>
                Clear All Filters
              </button>
            </>
          ) : (
            <>
              <div className="empty-icon">&#127859;</div>
              <h3>
                {showMyRecipes ? 'No recipes yet' : 'No public recipes available'}
              </h3>
              <p>
                {showMyRecipes
                  ? 'Start by creating your first recipe'
                  : 'Check back later for shared recipes from other users'}
              </p>
              {showMyRecipes && onCreateRecipe && (
                <button className="btn-create-empty" onClick={onCreateRecipe}>
                  Create Your First Recipe
                </button>
              )}
            </>
          )}
        </div>
      ) : (
        <div className={`recipe-${viewMode}`}>
          {filteredAndSortedRecipes.map(recipe => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              viewMode={viewMode}
              isSelected={selectedRecipes.has(recipe.id)}
              onSelect={showMyRecipes ? handleRecipeSelect : undefined}
              onClick={handleRecipeClickInternal}
              showActions={showMyRecipes}
            />
          ))}
        </div>
      )}

      {/* Floating Action Button */}
      {showMyRecipes && onCreateRecipe && (
        <button className="fab" onClick={onCreateRecipe} aria-label="Create new recipe">
          <span className="fab-icon">+</span>
        </button>
      )}
    </div>
  );
}

// Recipe Card Component
interface RecipeCardProps {
  recipe: Recipe;
  viewMode: ViewMode;
  isSelected: boolean;
  onSelect?: (id: string) => void;
  onClick: (recipe: Recipe) => void;
  showActions: boolean;
}

function RecipeCard({
  recipe,
  viewMode,
  isSelected,
  onSelect,
  onClick,
  showActions,
}: RecipeCardProps) {
  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking checkbox or action buttons
    if ((e.target as HTMLElement).closest('.recipe-card-checkbox, .recipe-card-actions')) {
      return;
    }
    onClick(recipe);
  };

  const handleCheckboxChange = () => {
    if (onSelect) {
      onSelect(recipe.id);
    }
  };

  const getDifficultyColor = (difficulty?: RecipeDifficulty) => {
    switch (difficulty) {
      case 'easy':
        return 'difficulty-easy';
      case 'medium':
        return 'difficulty-medium';
      case 'hard':
        return 'difficulty-hard';
      default:
        return '';
    }
  };

  return (
    <div
      className={`recipe-card ${viewMode === 'list' ? 'list-view' : ''} ${
        isSelected ? 'selected' : ''
      }`}
      onClick={handleCardClick}
    >
      {showActions && onSelect && (
        <div className="recipe-card-checkbox">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleCheckboxChange}
            aria-label={`Select ${recipe.name}`}
          />
        </div>
      )}

      <div className="recipe-card-image">
        {recipe.imageUrl ? (
          <img src={recipe.imageUrl} alt={recipe.name} />
        ) : (
          <div className="recipe-card-placeholder">
            <span className="placeholder-icon">&#127859;</span>
          </div>
        )}
        {recipe.difficulty && (
          <span className={`difficulty-badge ${getDifficultyColor(recipe.difficulty)}`}>
            {recipe.difficulty}
          </span>
        )}
      </div>

      <div className="recipe-card-content">
        <h3 className="recipe-card-title">{recipe.name}</h3>

        {recipe.description && (
          <p className="recipe-card-description">{recipe.description}</p>
        )}

        <div className="recipe-card-meta">
          {recipe.cuisineType && (
            <span className="recipe-meta-item">
              <span className="meta-icon">&#127758;</span>
              {recipe.cuisineType}
            </span>
          )}
          {totalTime > 0 && (
            <span className="recipe-meta-item">
              <span className="meta-icon">&#128337;</span>
              {totalTime} min
            </span>
          )}
          {recipe.servings && (
            <span className="recipe-meta-item">
              <span className="meta-icon">&#129333;</span>
              {recipe.servings} servings
            </span>
          )}
        </div>

        {recipe.isPublic && (
          <div className="recipe-card-badge">
            <span className="public-badge">Public</span>
          </div>
        )}
      </div>
    </div>
  );
}
