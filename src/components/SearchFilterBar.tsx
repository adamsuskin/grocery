import { useState, useEffect, ChangeEvent } from 'react';
import { FilterBarProps, CATEGORIES, type Category } from '../types';

export function SearchFilterBar({
  filters,
  onChange,
  totalCount,
  filteredCount,
}: FilterBarProps) {
  const [searchInput, setSearchInput] = useState(filters.searchText);

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

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  const handleShowGottenChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange({ showGotten: e.target.checked });
  };

  const handleCategoryToggle = (category: Category) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter((c) => c !== category)
      : [...filters.categories, category];
    onChange({ categories: newCategories });
  };

  const hasActiveFilters =
    filters.searchText !== '' ||
    !filters.showGotten ||
    filters.categories.length !== CATEGORIES.length;
  const showResultsCounter = hasActiveFilters && filteredCount !== totalCount;

  return (
    <div className="search-filter-bar">
      <div className="search-input-wrapper">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          value={searchInput}
          onChange={handleSearchChange}
          placeholder="Search items..."
          className="input search-input"
        />
      </div>

      <div className="filter-options">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={filters.showGotten}
            onChange={handleShowGottenChange}
            className="checkbox"
          />
          <span>Show gotten items</span>
        </label>
      </div>

      <div className="category-filters">
        <div className="category-filters-label">Categories:</div>
        <div className="category-chips">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryToggle(category)}
              className={`category-chip category-${category.toLowerCase()} ${
                filters.categories.includes(category) ? 'active' : 'inactive'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {showResultsCounter && (
        <div className="results-counter">
          Showing {filteredCount} of {totalCount} items
        </div>
      )}
    </div>
  );
}
