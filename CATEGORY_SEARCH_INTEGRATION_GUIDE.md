# CustomCategoryManager Search Integration Guide

## Quick Start

This guide shows exactly what to add to `/home/adam/grocery/src/components/CustomCategoryManager.tsx` to integrate the search functionality.

## Step 1: Update Imports

**Find this line** (around line 1):
```typescript
import { useState, useEffect, FormEvent, useCallback } from 'react';
```

**Replace with**:
```typescript
import { useState, useEffect, FormEvent, useCallback, useRef } from 'react';
```

**Find this line** (around line 2):
```typescript
import { useCustomCategories, useCustomCategoryMutations } from '../hooks/useCustomCategories';
```

**Add after it**:
```typescript
import { useCustomCategorySearch, useSearchHighlight } from '../hooks/useCustomCategorySearch';
```

## Step 2: Add HighlightedText Component

**Find this line** (around line 22):
```typescript
export function CustomCategoryManager({ listId, onClose, permissionLevel, onViewStatistics }: CustomCategoryManagerProps) {
```

**Add BEFORE it**:
```typescript
// Helper component for highlighting search matches
function HighlightedText({ text, query }: { text: string; query: string }) {
  const { parts } = useSearchHighlight(text, query);

  return (
    <>
      {parts.map((part, index) => (
        part.isHighlighted ? (
          <mark key={index} className="search-highlight">{part.text}</mark>
        ) : (
          <span key={index}>{part.text}</span>
        )
      ))}
    </>
  );
}

```

## Step 3: Add Search State

**Find this section** (around line 66-67):
```typescript
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
```

**Add after it**:
```typescript

  // Search functionality
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const {
    searchResults,
    filters,
    setQuery,
    setDateRange,
    setMinUsageCount,
    setCreatedBy,
    clearFilters,
    hasActiveFilters,
    totalResults,
    totalCategories
  } = useCustomCategorySearch(categories);
```

## Step 4: Update Keyboard Handler

**Find this code** (around line 79-88):
```typescript
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !deletingId && !showBulkDeleteConfirm && !showMergeDialog && !showCopyModal) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, deletingId, showBulkDeleteConfirm, showMergeDialog, showCopyModal]);
```

**Replace with**:
```typescript
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd+F to focus search
      if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
        event.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      // Escape to clear or close
      if (event.key === 'Escape') {
        if (hasActiveFilters) {
          clearFilters();
        } else if (!deletingId && !showBulkDeleteConfirm && !showMergeDialog && !showCopyModal) {
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, deletingId, showBulkDeleteConfirm, showMergeDialog, showCopyModal, hasActiveFilters, clearFilters]);
```

## Step 5: Add Search Bar Section

**Find the section that starts with** (around line 574):
```typescript
          )}

          <section className="category-section">
            <h3>Predefined Categories</h3>
```

**Add BEFORE the "Predefined Categories" section**:
```typescript
          )}

          <section className="category-section">
            <h3>Search Categories</h3>
            <div className="search-bar-container">
              <div className="search-input-wrapper">
                <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  ref={searchInputRef}
                  type="text"
                  className="search-input"
                  placeholder="Search by name, color, or icon... (Ctrl/Cmd+F)"
                  value={filters.query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Search categories"
                />
                {filters.query && (
                  <button
                    className="search-clear-btn"
                    onClick={() => setQuery('')}
                    aria-label="Clear search"
                    title="Clear search"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>

              {(categories.length > 0 || CATEGORIES.length > 0) && (
                <div className="search-stats">
                  {hasActiveFilters ? (
                    <>
                      <span className="search-count">
                        Showing {totalResults} of {totalCategories + CATEGORIES.length} categories
                      </span>
                      <button
                        className="btn btn-small btn-text"
                        onClick={clearFilters}
                        aria-label="Clear all filters"
                      >
                        Clear filters
                      </button>
                    </>
                  ) : (
                    <span className="search-count-muted">
                      {totalCategories + CATEGORIES.length} total categories ({CATEGORIES.length} predefined, {totalCategories} custom)
                    </span>
                  )}
                </div>
              )}

              {categories.length > 5 && (
                <button
                  className="btn btn-small btn-secondary toggle-advanced-filters"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  aria-expanded={showAdvancedFilters}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="4" y1="21" x2="4" y2="14" />
                    <line x1="4" y1="10" x2="4" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12" y2="3" />
                    <line x1="20" y1="21" x2="20" y2="16" />
                    <line x1="20" y1="12" x2="20" y2="3" />
                    <line x1="1" y1="14" x2="7" y2="14" />
                    <line x1="9" y1="8" x2="15" y2="8" />
                    <line x1="17" y1="16" x2="23" y2="16" />
                  </svg>
                  {showAdvancedFilters ? 'Hide' : 'Show'} Advanced Filters
                </button>
              )}

              {showAdvancedFilters && (
                <div className="advanced-filters">
                  <div className="filter-row">
                    <div className="form-group">
                      <label htmlFor="filter-created-after">Created After</label>
                      <input
                        id="filter-created-after"
                        type="date"
                        className="input input-small"
                        onChange={(e) => {
                          const date = e.target.value ? new Date(e.target.value) : undefined;
                          setDateRange(date, filters.createdBefore);
                        }}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="filter-created-before">Created Before</label>
                      <input
                        id="filter-created-before"
                        type="date"
                        className="input input-small"
                        onChange={(e) => {
                          const date = e.target.value ? new Date(e.target.value) : undefined;
                          setDateRange(filters.createdAfter, date);
                        }}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="filter-min-usage">Min Usage Count</label>
                      <input
                        id="filter-min-usage"
                        type="number"
                        min="0"
                        className="input input-small"
                        placeholder="0"
                        onChange={(e) => {
                          const value = e.target.value ? parseInt(e.target.value) : undefined;
                          setMinUsageCount(value);
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="category-section">
            <h3>Predefined Categories</h3>
```

## Step 6: Update Predefined Categories Display

**Find this code** (around line 580-584):
```typescript
              {CATEGORIES.map((category) => (
                <div key={category} className="category-item predefined-category">
                  <div className="category-info">
                    <span className="category-name">{category}</span>
                    <span className="category-badge">Built-in</span>
```

**Replace the category name line**:
```typescript
                    <span className="category-name"><HighlightedText text={category} query={filters.query} /></span>
```

## Step 7: Update Custom Categories List

**Find this code** (around line 663-666):
```typescript
            ) : (
              <div className="custom-categories">
                {categories.map((category) => {
                  const isEditing = editingId === category.id;
```

**Replace with**:
```typescript
            ) : searchResults.length === 0 && hasActiveFilters ? (
              <div className="empty-categories">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <p>No categories match your search</p>
                <p className="empty-hint">Try adjusting your search terms or filters</p>
                <button className="btn btn-secondary" onClick={clearFilters} style={{ marginTop: '12px' }}>
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="custom-categories">
                {searchResults.map((category) => {
                  const isEditing = editingId === category.id;
```

## Step 8: Add Highlighting to Custom Category Names

**Find this code** (around line 742):
```typescript
                            <span className="category-name">{category.name}</span>
```

**Replace with**:
```typescript
                            <span className="category-name">
                              <HighlightedText text={category.name} query={filters.query} />
                            </span>
```

## Verification

After making these changes:

1. **Check TypeScript compilation**:
   ```bash
   npx tsc --noEmit
   ```

2. **Start the dev server**:
   ```bash
   npm run dev
   ```

3. **Test the search**:
   - Open CustomCategoryManager
   - Try searching for categories
   - Press Ctrl/Cmd+F to focus search
   - Try advanced filters
   - Check highlighting works

## Troubleshooting

### Import errors
- Make sure `useCustomCategorySearch.ts` exists in `src/hooks/`
- Check file exports are correct

### TypeScript errors
- Ensure `useRef` is imported from React
- Check all function parameters match expected types

### Search not filtering
- Verify `searchResults` is being used instead of `categories`
- Check the search hook is properly initialized

### Styling issues
- Ensure `CustomCategoryManager.css` has all the new styles
- Check class names match exactly

## What Each Change Does

1. **Imports**: Adds React hooks and search functionality
2. **HighlightedText**: Component to show highlighted matches
3. **Search State**: Manages search query and filters
4. **Keyboard Handler**: Adds Ctrl/Cmd+F and smarter Escape
5. **Search Bar**: Full search UI with stats and filters
6. **Predefined Categories**: Adds highlighting
7. **Custom Categories**: Uses filtered results
8. **Category Names**: Adds highlighting to custom categories

---

All files needed:
- ✅ `/home/adam/grocery/src/hooks/useCustomCategorySearch.ts` (already created)
- ✅ `/home/adam/grocery/src/components/CustomCategoryManager.css` (already updated)
- ⚠️ `/home/adam/grocery/src/components/CustomCategoryManager.tsx` (needs manual integration above)
