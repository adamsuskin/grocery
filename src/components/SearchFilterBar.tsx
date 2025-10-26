import { useState, useEffect, ChangeEvent } from 'react';
import { FilterBarProps } from '../types';

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

  const hasActiveFilters = filters.searchText !== '' || !filters.showGotten;
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

      {showResultsCounter && (
        <div className="results-counter">
          Showing {filteredCount} of {totalCount} items
        </div>
      )}
    </div>
  );
}
