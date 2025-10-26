import { useState, useEffect, useRef, ChangeEvent, memo } from 'react';
import type { RecipeFilterState, RecipeDifficulty, CuisineType } from '../types';
import './RecipeFilterBar.css';

interface RecipeFilterBarProps {
  filters: RecipeFilterState;
  onChange: (filters: Partial<RecipeFilterState>) => void;
  totalCount: number;
  filteredCount: number;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

const DIFFICULTIES: RecipeDifficulty[] = ['easy', 'medium', 'hard'];
const CUISINE_TYPES: CuisineType[] = [
  'Italian',
  'Mexican',
  'Asian',
  'American',
  'Mediterranean',
  'Indian',
  'French',
  'Thai',
  'Other',
];

export const RecipeFilterBar = memo(function RecipeFilterBar({
  filters,
  onChange,
  totalCount,
  filteredCount,
  onClearFilters,
  hasActiveFilters,
}: RecipeFilterBarProps) {
  const [searchInput, setSearchInput] = useState(filters.searchText);
  const [showFilters, setShowFilters] = useState(false);
  const filtersRef = useRef<HTMLDivElement>(null);

  // Debounce search input
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onChange({ searchText: searchInput });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchInput, onChange]);

  // Sync with external filter changes
  useEffect(() => {
    setSearchInput(filters.searchText);
  }, [filters.searchText]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filtersRef.current && !filtersRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  const handleDifficultyToggle = (difficulty: RecipeDifficulty) => {
    const current = filters.difficulty || [];
    const newDifficulties = current.includes(difficulty)
      ? current.filter(d => d !== difficulty)
      : [...current, difficulty];

    onChange({
      difficulty: newDifficulties.length > 0 ? newDifficulties : undefined,
    });
  };

  const handleCuisineToggle = (cuisine: CuisineType) => {
    const current = filters.cuisineType || [];
    const newCuisines = current.includes(cuisine)
      ? current.filter(c => c !== cuisine)
      : [...current, cuisine];

    onChange({
      cuisineType: newCuisines.length > 0 ? newCuisines : undefined,
    });
  };

  const handlePrepTimeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    onChange({ prepTimeMax: value > 0 ? value : undefined });
  };

  const handleCookTimeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    onChange({ cookTimeMax: value > 0 ? value : undefined });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.searchText) count++;
    if (filters.difficulty && filters.difficulty.length > 0) count++;
    if (filters.cuisineType && filters.cuisineType.length > 0) count++;
    if (filters.prepTimeMax !== undefined) count++;
    if (filters.cookTimeMax !== undefined) count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <div className="recipe-filter-bar">
      <div className="filter-search-row">
        <div className="search-input-wrapper">
          <span className="search-icon" aria-hidden="true">
            &#128269;
          </span>
          <input
            type="search"
            value={searchInput}
            onChange={handleSearchChange}
            placeholder="Search recipes by name or ingredients..."
            className="search-input"
            aria-label="Search recipes"
          />
        </div>

        <button
          className={`btn-show-filters ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
          aria-expanded={showFilters}
        >
          <span className="filter-icon">&#9776;</span>
          Filters
          {activeFilterCount > 0 && (
            <span className="filter-badge">{activeFilterCount}</span>
          )}
        </button>

        {hasActiveFilters && (
          <button className="btn-clear-all-filters" onClick={onClearFilters}>
            Clear All
          </button>
        )}
      </div>

      {showFilters && (
        <div className="filter-dropdown" ref={filtersRef}>
          <div className="filter-section">
            <h4 className="filter-section-title">Difficulty</h4>
            <div className="filter-checkboxes">
              {DIFFICULTIES.map(difficulty => (
                <label key={difficulty} className="filter-checkbox-label">
                  <input
                    type="checkbox"
                    checked={filters.difficulty?.includes(difficulty) || false}
                    onChange={() => handleDifficultyToggle(difficulty)}
                  />
                  <span className="checkbox-text capitalize">{difficulty}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <h4 className="filter-section-title">Cuisine Type</h4>
            <div className="filter-checkboxes">
              {CUISINE_TYPES.map(cuisine => (
                <label key={cuisine} className="filter-checkbox-label">
                  <input
                    type="checkbox"
                    checked={filters.cuisineType?.includes(cuisine) || false}
                    onChange={() => handleCuisineToggle(cuisine)}
                  />
                  <span className="checkbox-text">{cuisine}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <h4 className="filter-section-title">Time</h4>
            <div className="filter-sliders">
              <div className="filter-slider">
                <label htmlFor="prep-time-slider" className="slider-label">
                  Prep Time: {filters.prepTimeMax ? `${filters.prepTimeMax} min` : 'Any'}
                </label>
                <input
                  id="prep-time-slider"
                  type="range"
                  min="0"
                  max="180"
                  step="15"
                  value={filters.prepTimeMax || 180}
                  onChange={handlePrepTimeChange}
                  className="slider"
                />
                <div className="slider-marks">
                  <span>0</span>
                  <span>3h</span>
                </div>
              </div>

              <div className="filter-slider">
                <label htmlFor="cook-time-slider" className="slider-label">
                  Cook Time: {filters.cookTimeMax ? `${filters.cookTimeMax} min` : 'Any'}
                </label>
                <input
                  id="cook-time-slider"
                  type="range"
                  min="0"
                  max="240"
                  step="15"
                  value={filters.cookTimeMax || 240}
                  onChange={handleCookTimeChange}
                  className="slider"
                />
                <div className="slider-marks">
                  <span>0</span>
                  <span>4h</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {hasActiveFilters && filteredCount !== totalCount && (
        <div className="filter-results" role="status" aria-live="polite">
          Showing {filteredCount} of {totalCount} recipes
        </div>
      )}
    </div>
  );
});
