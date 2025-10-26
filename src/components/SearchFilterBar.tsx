import { useState, useEffect, ChangeEvent, memo, useCallback, useRef } from 'react';
import { FilterBarProps, CATEGORIES, type Category, type CategoryFilterMode, type CategoryType, type SavedFilter } from '../types';
import { useCustomCategories } from '../zero-store';
import { logCategoryFilterApplied } from '../utils/categoryAnalytics';
import { getCategoryAnalytics } from '../utils/categoryAnalytics';
import {
  getSavedFilters,
  saveFilterPreset,
  deleteFilterPreset,
  applySavedFilter,
  saveListFilters,
} from '../utils/filterPreferences';
import './SearchFilterBar.css';

interface SearchFilterBarProps extends FilterBarProps {
  listId: string | null;
}

export const SearchFilterBar = memo(function SearchFilterBar({
  filters,
  onChange,
  totalCount,
  filteredCount,
  listId,
}: SearchFilterBarProps) {
  // Get custom categories for the current list
  const customCategories = useCustomCategories(listId);
  const [searchInput, setSearchInput] = useState(filters.searchText);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showPresetMenu, setShowPresetMenu] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const presetMenuRef = useRef<HTMLDivElement>(null);

  // Load saved filters on mount
  useEffect(() => {
    setSavedFilters(getSavedFilters());
  }, []);

  // Get analytics for frequently used categories
  const analytics = listId ? getCategoryAnalytics(listId) : null;
  const frequentCategories = analytics?.mostUsedCategories.slice(0, 5) || [];

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

  // Save filter preferences when they change
  useEffect(() => {
    if (listId) {
      saveListFilters(listId, filters);
    }
  }, [filters, listId]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCategoryDropdown(false);
      }
      if (presetMenuRef.current && !presetMenuRef.current.contains(event.target as Node)) {
        setShowPresetMenu(false);
        setShowSavePreset(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  const handleShowGottenChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange({ showGotten: e.target.checked });
  };

  const handleCategoryToggle = (category: Category) => {
    const isActive = filters.categories.includes(category);
    const newCategories = isActive
      ? filters.categories.filter((c) => c !== category)
      : [...filters.categories, category];
    onChange({ categories: newCategories });

    // Track category filter usage in analytics (only for custom categories and when activating)
    if (listId && !CATEGORIES.includes(category as any) && !isActive) {
      logCategoryFilterApplied(listId, category, { isActive: true });
    }
  };

  const handleCategoryModeChange = (mode: CategoryFilterMode) => {
    onChange({ categoryMode: mode });
  };

  const handleCategoryTypeChange = (type: CategoryType) => {
    const allCats = [...CATEGORIES, ...customCategories] as Category[];

    let newCategories: Category[] = [];
    switch (type) {
      case 'all':
        newCategories = allCats;
        break;
      case 'predefined':
        newCategories = [...CATEGORIES];
        break;
      case 'custom':
        newCategories = customCategories as Category[];
        break;
    }

    onChange({ categoryType: type, categories: newCategories });
  };

  const handleSelectAllCategories = () => {
    const allCats = [...CATEGORIES, ...customCategories] as Category[];
    onChange({ categories: allCats });
  };

  const handleDeselectAllCategories = () => {
    onChange({ categories: [] });
  };

  const handleSavePreset = useCallback(() => {
    if (!presetName.trim()) return;

    saveFilterPreset(presetName.trim(), filters);
    setSavedFilters(getSavedFilters());
    setPresetName('');
    setShowSavePreset(false);
  }, [presetName, filters]);

  const handleApplyPreset = useCallback((presetId: string) => {
    const filter = applySavedFilter(presetId);
    if (filter) {
      onChange({
        searchText: filter.searchText,
        showGotten: filter.showGotten,
        categories: filter.categories,
        categoryMode: filter.categoryMode,
        categoryType: filter.categoryType,
      });
      setSavedFilters(getSavedFilters());
    }
    setShowPresetMenu(false);
  }, [onChange]);

  const handleDeletePreset = useCallback((presetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteFilterPreset(presetId);
    setSavedFilters(getSavedFilters());
  }, []);

  const handleClearFilters = () => {
    const allCats = [...CATEGORIES, ...customCategories] as Category[];
    onChange({
      searchText: '',
      showGotten: true,
      categories: allCats,
      categoryMode: 'include',
      categoryType: 'all',
    });
  };

  // Calculate total available categories (predefined + custom)
  const totalAvailableCategories = CATEGORIES.length + customCategories.length;

  const hasActiveFilters =
    filters.searchText !== '' ||
    !filters.showGotten ||
    filters.categories.length !== totalAvailableCategories ||
    filters.categoryMode !== 'include' ||
    filters.categoryType !== 'all';

  const showResultsCounter = hasActiveFilters && filteredCount !== totalCount;

  // Get active filter chips
  const getActiveFilterChips = () => {
    const chips: Array<{ label: string; onRemove: () => void }> = [];

    if (filters.searchText) {
      chips.push({
        label: `Search: "${filters.searchText}"`,
        onRemove: () => onChange({ searchText: '' }),
      });
    }

    if (!filters.showGotten) {
      chips.push({
        label: 'Hide gotten items',
        onRemove: () => onChange({ showGotten: true }),
      });
    }

    if (filters.categoryType !== 'all') {
      chips.push({
        label: filters.categoryType === 'predefined' ? 'Predefined categories only' : 'Custom categories only',
        onRemove: () => handleCategoryTypeChange('all'),
      });
    }

    if (filters.categoryMode === 'exclude') {
      chips.push({
        label: 'Excluding selected categories',
        onRemove: () => handleCategoryModeChange('include'),
      });
    }

    if (filters.categories.length < totalAvailableCategories && filters.categories.length > 0) {
      const label = filters.categoryMode === 'include'
        ? `${filters.categories.length} categories selected`
        : `${filters.categories.length} categories excluded`;

      chips.push({
        label,
        onRemove: handleSelectAllCategories,
      });
    }

    return chips;
  };

  const activeChips = getActiveFilterChips();

  return (
    <div className="search-filter-bar" role="search" aria-label="Search and filter grocery items">
      <div className="search-input-wrapper">
        <span className="search-icon" aria-hidden="true">🔍</span>
        <label htmlFor="search-items-input" className="sr-only">
          Search items
        </label>
        <input
          id="search-items-input"
          type="search"
          value={searchInput}
          onChange={handleSearchChange}
          placeholder="Search items..."
          className="input search-input"
          aria-label="Search items by name"
          aria-describedby="search-description"
        />
        <span id="search-description" className="sr-only">
          Type to search through your grocery items. Results update as you type.
        </span>
      </div>

      <div className="filter-options">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={filters.showGotten}
            onChange={handleShowGottenChange}
            className="checkbox"
            aria-label="Show items already marked as gotten"
          />
          <span>Show gotten items</span>
        </label>
      </div>

      {/* Advanced Category Filters */}
      <div className="category-filter-section">
        <div className="category-filter-header">
          <span className="category-filters-label">Categories:</span>
          <div className="category-filter-controls">
            <div className="category-dropdown-wrapper" ref={dropdownRef}>
              <button
                className="btn-category-filter"
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                aria-expanded={showCategoryDropdown}
                aria-haspopup="true"
              >
                {filters.categories.length === totalAvailableCategories
                  ? 'All Categories'
                  : filters.categories.length === 0
                  ? 'No Categories'
                  : `${filters.categories.length} Selected`}
                <span className="dropdown-arrow" aria-hidden="true">▼</span>
              </button>

              {showCategoryDropdown && (
                <div className="category-dropdown">
                  <div className="category-dropdown-header">
                    <h3>Filter by Categories</h3>
                    <button
                      className="btn-close-dropdown"
                      onClick={() => setShowCategoryDropdown(false)}
                      aria-label="Close category dropdown"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Filter Mode Toggle */}
                  <div className="filter-mode-toggle" role="group" aria-label="Category filter mode">
                    <button
                      className={`mode-btn ${filters.categoryMode === 'include' ? 'active' : ''}`}
                      onClick={() => handleCategoryModeChange('include')}
                      aria-pressed={filters.categoryMode === 'include'}
                    >
                      Include
                    </button>
                    <button
                      className={`mode-btn ${filters.categoryMode === 'exclude' ? 'active' : ''}`}
                      onClick={() => handleCategoryModeChange('exclude')}
                      aria-pressed={filters.categoryMode === 'exclude'}
                    >
                      Exclude
                    </button>
                  </div>

                  {/* Category Type Filter */}
                  <div className="category-type-filter" role="group" aria-label="Category type filter">
                    <button
                      className={`type-btn ${filters.categoryType === 'all' ? 'active' : ''}`}
                      onClick={() => handleCategoryTypeChange('all')}
                      aria-pressed={filters.categoryType === 'all'}
                    >
                      All
                    </button>
                    <button
                      className={`type-btn ${filters.categoryType === 'predefined' ? 'active' : ''}`}
                      onClick={() => handleCategoryTypeChange('predefined')}
                      aria-pressed={filters.categoryType === 'predefined'}
                    >
                      Predefined
                    </button>
                    {customCategories.length > 0 && (
                      <button
                        className={`type-btn ${filters.categoryType === 'custom' ? 'active' : ''}`}
                        onClick={() => handleCategoryTypeChange('custom')}
                        aria-pressed={filters.categoryType === 'custom'}
                      >
                        Custom
                      </button>
                    )}
                  </div>

                  {/* Bulk Actions */}
                  <div className="category-bulk-actions">
                    <button className="btn-bulk" onClick={handleSelectAllCategories}>
                      Select All
                    </button>
                    <button className="btn-bulk" onClick={handleDeselectAllCategories}>
                      Deselect All
                    </button>
                  </div>

                  {/* Frequently Used Categories */}
                  {frequentCategories.length > 0 && (
                    <div className="category-section">
                      <h4>Frequently Used</h4>
                      <div className="category-list">
                        {frequentCategories.map((cat) => (
                          <label key={cat.categoryName} className="category-checkbox">
                            <input
                              type="checkbox"
                              checked={filters.categories.includes(cat.categoryName as Category)}
                              onChange={() => handleCategoryToggle(cat.categoryName as Category)}
                            />
                            <span>{cat.categoryName}</span>
                            <span className="usage-count">({cat.usageCount})</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Predefined Categories */}
                  <div className="category-section">
                    <h4>Predefined Categories</h4>
                    <div className="category-list">
                      {CATEGORIES.map((category) => (
                        <label key={category} className="category-checkbox">
                          <input
                            type="checkbox"
                            checked={filters.categories.includes(category)}
                            onChange={() => handleCategoryToggle(category)}
                          />
                          <span>{category}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Custom Categories */}
                  {customCategories.length > 0 && (
                    <div className="category-section">
                      <h4>Custom Categories</h4>
                      <div className="category-list">
                        {customCategories.map((category) => (
                          <label key={category} className="category-checkbox">
                            <input
                              type="checkbox"
                              checked={filters.categories.includes(category as Category)}
                              onChange={() => handleCategoryToggle(category as Category)}
                            />
                            <span className="custom-indicator" aria-label="Custom category">✨</span>
                            <span>{category}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Filter Presets */}
            <div className="preset-menu-wrapper" ref={presetMenuRef}>
              <button
                className="btn-preset"
                onClick={() => setShowPresetMenu(!showPresetMenu)}
                title="Manage filter presets"
                aria-expanded={showPresetMenu}
                aria-haspopup="true"
              >
                ⭐ Presets
              </button>

              {showPresetMenu && (
                <div className="preset-dropdown">
                  <div className="preset-dropdown-header">
                    <h3>Filter Presets</h3>
                    <button
                      className="btn-close-dropdown"
                      onClick={() => setShowPresetMenu(false)}
                      aria-label="Close preset menu"
                    >
                      ✕
                    </button>
                  </div>

                  {!showSavePreset && (
                    <button
                      className="btn-save-preset"
                      onClick={() => setShowSavePreset(true)}
                    >
                      + Save Current Filters
                    </button>
                  )}

                  {showSavePreset && (
                    <div className="save-preset-form">
                      <input
                        type="text"
                        value={presetName}
                        onChange={(e) => setPresetName(e.target.value)}
                        placeholder="Preset name..."
                        className="input preset-name-input"
                        autoFocus
                      />
                      <div className="save-preset-actions">
                        <button className="btn-save" onClick={handleSavePreset}>
                          Save
                        </button>
                        <button
                          className="btn-cancel"
                          onClick={() => {
                            setShowSavePreset(false);
                            setPresetName('');
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {savedFilters.length > 0 ? (
                    <div className="preset-list">
                      {savedFilters.map((filter) => (
                        <div key={filter.id} className="preset-item">
                          <button
                            className="preset-apply-btn"
                            onClick={() => handleApplyPreset(filter.id)}
                          >
                            <span className="preset-name">{filter.name}</span>
                            <span className="preset-meta">
                              Used {filter.useCount} times
                            </span>
                          </button>
                          <button
                            className="preset-delete-btn"
                            onClick={(e) => handleDeletePreset(filter.id, e)}
                            title="Delete preset"
                            aria-label={`Delete ${filter.name} preset`}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="preset-empty">
                      <p>No saved presets yet</p>
                      <p>Save your frequently used filters for quick access</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {hasActiveFilters && (
              <button className="btn-clear-filters" onClick={handleClearFilters}>
                Clear All Filters
              </button>
            )}
          </div>
        </div>

        {/* Active Filter Chips */}
        {activeChips.length > 0 && (
          <div className="active-filter-chips" role="list" aria-label="Active filters">
            {activeChips.map((chip, index) => (
              <div key={index} className="filter-chip" role="listitem">
                <span>{chip.label}</span>
                <button
                  className="chip-remove"
                  onClick={chip.onRemove}
                  aria-label={`Remove ${chip.label} filter`}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showResultsCounter && (
        <div className="results-counter" role="status" aria-live="polite">
          Showing {filteredCount} of {totalCount} items
        </div>
      )}
    </div>
  );
});
