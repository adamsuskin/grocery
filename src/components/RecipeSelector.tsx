import { useState, useMemo } from 'react';
import type { Recipe, MealType } from '../types';
import { formatDuration } from '../utils/dateUtils';

interface RecipeSelectorProps {
  recipes: Recipe[];
  date: Date;
  mealType: MealType;
  onSelect: (recipe: Recipe, servings: number) => void;
  onClose: () => void;
}

export function RecipeSelector({
  recipes,
  date,
  mealType,
  onSelect,
  onClose,
}: RecipeSelectorProps) {
  const [searchText, setSearchText] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [servings, setServings] = useState(4);
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [filterCuisine, setFilterCuisine] = useState<string>('all');

  // Filter recipes based on search and filters
  const filteredRecipes = useMemo(() => {
    return recipes.filter((recipe) => {
      const matchesSearch =
        searchText === '' ||
        recipe.name.toLowerCase().includes(searchText.toLowerCase()) ||
        recipe.description?.toLowerCase().includes(searchText.toLowerCase());

      const matchesDifficulty =
        filterDifficulty === 'all' || recipe.difficulty === filterDifficulty;

      const matchesCuisine =
        filterCuisine === 'all' || recipe.cuisineType === filterCuisine;

      return matchesSearch && matchesDifficulty && matchesCuisine;
    });
  }, [recipes, searchText, filterDifficulty, filterCuisine]);

  // Get unique cuisines from recipes
  const cuisines = useMemo(() => {
    const uniqueCuisines = new Set(recipes.map((r) => r.cuisineType).filter(Boolean));
    return Array.from(uniqueCuisines).sort();
  }, [recipes]);

  const handleSelect = () => {
    if (selectedRecipe) {
      onSelect(selectedRecipe, servings);
    }
  };

  const formatDate = (d: Date) => {
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="recipe-selector-overlay" onClick={onClose}>
      <div className="recipe-selector-modal" onClick={(e) => e.stopPropagation()}>
        <div className="recipe-selector-header">
          <div>
            <h2>Select Recipe</h2>
            <p className="recipe-selector-subtitle">
              {formatDate(date)} - {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
            </p>
          </div>
          <button className="btn-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="recipe-selector-search">
          <input
            type="text"
            placeholder="Search recipes..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="recipe-search-input"
          />
        </div>

        <div className="recipe-selector-filters">
          <select
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
            className="recipe-filter-select"
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          <select
            value={filterCuisine}
            onChange={(e) => setFilterCuisine(e.target.value)}
            className="recipe-filter-select"
          >
            <option value="all">All Cuisines</option>
            {cuisines.map((cuisine) => (
              <option key={cuisine} value={cuisine}>
                {cuisine}
              </option>
            ))}
          </select>
        </div>

        <div className="recipe-selector-content">
          <div className="recipe-selector-list">
            {filteredRecipes.length === 0 ? (
              <div className="recipe-selector-empty">
                <p>No recipes found</p>
                <p className="recipe-selector-empty-hint">
                  Try adjusting your search or filters
                </p>
              </div>
            ) : (
              filteredRecipes.map((recipe) => {
                const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);
                const isSelected = selectedRecipe?.id === recipe.id;

                return (
                  <div
                    key={recipe.id}
                    className={`recipe-selector-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedRecipe(recipe);
                      setServings(recipe.servings);
                    }}
                  >
                    <div className="recipe-selector-item-header">
                      <h3 className="recipe-selector-item-title">{recipe.name}</h3>
                      {recipe.difficulty && (
                        <span className={`recipe-difficulty-badge ${recipe.difficulty}`}>
                          {recipe.difficulty}
                        </span>
                      )}
                    </div>

                    {recipe.description && (
                      <p className="recipe-selector-item-description">
                        {recipe.description}
                      </p>
                    )}

                    <div className="recipe-selector-item-meta">
                      {recipe.cuisineType && (
                        <span className="recipe-meta-item">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path
                              d="M12 2L2 7L12 12L22 7L12 2Z"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M2 17L12 22L22 17"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M2 12L12 17L22 12"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinejoin="round"
                            />
                          </svg>
                          {recipe.cuisineType}
                        </span>
                      )}

                      <span className="recipe-meta-item">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
                        </svg>
                        {recipe.servings} servings
                      </span>

                      {totalTime > 0 && (
                        <span className="recipe-meta-item">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                            <path
                              d="M12 6V12L16 14"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                          </svg>
                          {formatDuration(totalTime)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {selectedRecipe && (
            <div className="recipe-selector-details">
              <h3>Selected Recipe</h3>
              <h4>{selectedRecipe.name}</h4>

              <div className="recipe-selector-servings">
                <label htmlFor="servings">Number of Servings:</label>
                <div className="servings-input-group">
                  <button
                    type="button"
                    onClick={() => setServings(Math.max(1, servings - 1))}
                    className="servings-btn"
                  >
                    -
                  </button>
                  <input
                    id="servings"
                    type="number"
                    min="1"
                    max="20"
                    value={servings}
                    onChange={(e) => setServings(Math.max(1, parseInt(e.target.value) || 1))}
                    className="servings-input"
                  />
                  <button
                    type="button"
                    onClick={() => setServings(Math.min(20, servings + 1))}
                    className="servings-btn"
                  >
                    +
                  </button>
                </div>
              </div>

              {selectedRecipe.description && (
                <div className="recipe-selector-description">
                  <p>{selectedRecipe.description}</p>
                </div>
              )}

              <button onClick={handleSelect} className="btn-primary btn-add-recipe">
                Add to Meal Plan
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
