# Custom Categories Archive Feature Implementation

This document provides the complete implementation for archiving custom categories instead of deleting them.

## 1. Migration File

**File**: `/home/adam/grocery/server/db/migrations/004_add_custom_categories_archive.sql`

Already created - adds `is_archived` and `archived_at` columns to `custom_categories` table.

## 2. Schema Update

**File**: `/home/adam/grocery/src/zero-schema.ts`

Already updated:
- Added `is_archived: { type: 'boolean' as const }`
- Added `archived_at: { type: 'number' as const }`
- Bumped version to 11

## 3. Types Update

**File**: `/home/adam/grocery/src/types.ts`

Already updated:
- Added `isArchived: boolean` to `CustomCategory` interface
- Added `archivedAt?: number` to `CustomCategory` interface
- Added corresponding fields to `CustomCategoryTable` interface

## 4. Hook Updates

**File**: `/home/adam/grocery/src/hooks/useCustomCategories.ts`

Already updated:
- `useCustomCategories()` now accepts `includeArchived` parameter (defaults to false)
- Added `archiveCategory()` mutation
- Added `restoreCategory()` mutation
- Updated `deleteCustomCategory()` to only work on archived categories with no items

## 5. Component Updates

**File**: `/home/adam/grocery/src/components/CustomCategoryManager.tsx`

### 5.1 Add State for Archive Feature

After line 23 (after `const canEdit = ...`), add:

```typescript
// State for showing archived categories
const [showArchived, setShowArchived] = useState(false);
```

### 5.2 Update Hook Calls

Replace line 25:
```typescript
const categories = useCustomCategories(listId);
```

With:
```typescript
const categories = useCustomCategories(listId, showArchived);
```

Update the mutations destructuring (around line 26-35) to include:
```typescript
const {
  addCustomCategory,
  updateCustomCategory,
  deleteCustomCategory,
  archiveCategory,      // ADD THIS
  restoreCategory,      // ADD THIS
  deleteMultipleCategories,
  updateMultipleCategories,
  mergeCategories,
  exportCategories,
  updateCategoryOrder,
} = useCustomCategoryMutations();
```

### 5.3 Add Archive State Variables

After line 48 (`const [isDeleting, setIsDeleting] = useState(false);`), add:

```typescript
const [archivingId, setArchivingId] = useState<string | null>(null);
const [isArchiving, setIsArchiving] = useState(false);
```

### 5.4 Add Archive Handler Functions

Add these handler functions (after the delete handlers, around line 300):

```typescript
// Handle starting archive confirmation
const handleStartArchive = (categoryId: string) => {
  setArchivingId(categoryId);
  setError(null);
};

// Handle confirming archive
const handleConfirmArchive = async () => {
  if (!archivingId) return;

  const categoryToArchive = categories.find(c => c.id === archivingId);

  setIsArchiving(true);
  setError(null);

  try {
    await archiveCategory(archivingId);

    // Track category archival in analytics
    if (categoryToArchive) {
      logCategoryDeleted(listId, categoryToArchive.name); // Reuse delete analytics for now
    }

    setSuccessMessage('Category archived successfully');
    setArchivingId(null);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to archive category. Please try again.');
    setArchivingId(null);
  } finally {
    setIsArchiving(false);
  }
};

// Handle canceling archive
const handleCancelArchive = () => {
  setArchivingId(null);
};

// Handle restoring archived category
const handleRestore = async (categoryId: string) => {
  setError(null);

  try {
    await restoreCategory(categoryId);
    setSuccessMessage('Category restored successfully');
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to restore category. Please try again.');
  }
};
```

### 5.5 Update Escape Key Handler

Update the `useEffect` for keyboard handling (around line 67-77) to include archivingId:

```typescript
useEffect(() => {
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && !deletingId && !archivingId && !showBulkDeleteConfirm && !showMergeDialog && !showCopyModal) {
      onClose();
    }
  };

  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, [onClose, deletingId, archivingId, showBulkDeleteConfirm, showMergeDialog, showCopyModal]);
```

### 5.6 Add Show Archived Toggle in UI

In the "Your Custom Categories" section header (around line 640), add a toggle:

```typescript
<section className="category-section">
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <h3>Your Custom Categories</h3>
    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
      <input
        type="checkbox"
        checked={showArchived}
        onChange={(e) => setShowArchived(e.target.checked)}
      />
      <span>Show Archived</span>
    </label>
  </div>
```

### 5.7 Update Category Rendering

In the category list rendering (around line 660-750), update the action buttons section:

Replace the delete button with:

```typescript
{canEdit && (
  <div className="category-actions">
    <button
      className="btn btn-icon"
      onClick={() => handleStartEdit(category.id)}
      title="Edit category"
      aria-label={`Edit ${category.name}`}
    >
      {/* Edit icon SVG */}
    </button>

    {category.isArchived ? (
      // Show Restore button for archived categories
      <button
        className="btn btn-icon btn-success"
        onClick={() => handleRestore(category.id)}
        title="Restore category"
        aria-label={`Restore ${category.name}`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
          <path d="M21 3v5h-5" />
          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
        </svg>
      </button>
    ) : (
      // Show Archive button for active categories
      <button
        className="btn btn-icon btn-warning"
        onClick={() => handleStartArchive(category.id)}
        title="Archive category"
        aria-label={`Archive ${category.name}`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="21 8 21 21 3 21 3 8" />
          <rect x="1" y="3" width="22" height="5" />
          <line x1="10" y1="12" x2="14" y2="12" />
        </svg>
      </button>
    )}

    {category.isArchived && (
      // Show Delete button only for archived categories
      <button
        className="btn btn-icon btn-danger"
        onClick={() => handleStartDelete(category.id)}
        title="Permanently delete category"
        aria-label={`Delete ${category.name}`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <line x1="10" y1="11" x2="10" y2="17" />
          <line x1="14" y1="11" x2="14" y2="17" />
        </svg>
      </button>
    )}
  </div>
)}
```

### 5.8 Style Archived Categories

Update the category item rendering to add a class for archived categories:

```typescript
<div
  key={category.id}
  className={`category-item custom-category ${isSelected ? 'selected' : ''} ${category.isArchived ? 'archived' : ''}`}
  onClick={() => !category.isArchived && setSelectedCategoryIndex(index)}
  tabIndex={category.isArchived ? -1 : 0}
  role="button"
  aria-selected={isSelected}
  style={category.isArchived ? { opacity: 0.6, fontStyle: 'italic' } : {}}
>
```

### 5.9 Add Archive Confirmation Dialog

Add after the delete confirmation dialog (around line 820):

```typescript
{/* Archive Confirmation Dialog */}
{archivingCategory && (
  <div className="confirmation-overlay" onClick={handleCancelArchive}>
    <div className="confirmation-dialog" onClick={(e) => e.stopPropagation()}>
      <h3>Archive Category?</h3>
      <div className="confirmation-content">
        <p className="confirmation-message">
          Are you sure you want to archive <strong>"{archivingCategory.name}"</strong>?
        </p>
        <p className="confirmation-info">
          Archived categories are hidden from the UI but can be restored later.
          Items using this category will keep their references.
        </p>
      </div>
      <div className="confirmation-actions">
        <button
          className="btn btn-secondary"
          onClick={handleCancelArchive}
          disabled={isArchiving}
        >
          Cancel
        </button>
        <button
          className="btn btn-warning"
          onClick={handleConfirmArchive}
          disabled={isArchiving}
        >
          {isArchiving ? 'Archiving...' : 'Archive Category'}
        </button>
      </div>
    </div>
  </div>
)}
```

### 5.10 Get Archiving Category

Add after getting deletingCategory (around line 310):

```typescript
const archivingCategory = archivingId ? categories.find(c => c.id === archivingId) : null;
```

### 5.11 Update Delete Dialog Message

Update the delete confirmation dialog message to reflect that it's for archived categories:

```typescript
<p className="confirmation-message">
  Are you sure you want to permanently delete <strong>"{deletingCategory.name}"</strong>?
</p>
<p className="confirmation-warning">
  This will permanently remove the archived category from the database.
  This action cannot be undone.
</p>
```

## 6. CSS Updates

Add to `/home/adam/grocery/src/components/CustomCategoryManager.css`:

```css
/* Archived category styling */
.category-item.archived {
  opacity: 0.6;
  font-style: italic;
  background-color: #f5f5f5;
}

.category-item.archived:hover {
  background-color: #ececec;
}

/* Success button for restore */
.btn-success {
  color: #4caf50;
  border-color: #4caf50;
}

.btn-success:hover {
  background-color: #4caf50;
  color: white;
}

/* Warning button for archive */
.btn-warning {
  color: #ff9800;
  border-color: #ff9800;
}

.btn-warning:hover {
  background-color: #ff9800;
  color: white;
}

/* Info text in confirmation dialog */
.confirmation-info {
  margin-top: 12px;
  font-size: 0.9em;
  color: #666;
  font-style: italic;
}
```

## Summary of Benefits

1. **Data Preservation**: Categories are never truly deleted, preserving historical data
2. **Undo Capability**: Users can restore accidentally archived categories
3. **Reference Integrity**: Items keep their category references even when categories are archived
4. **Clean UI**: Archived categories are hidden by default, keeping the interface uncluttered
5. **Safety**: Permanent deletion requires two steps (archive, then delete) and checks for item usage

## Testing Checklist

- [ ] Archive a category without items
- [ ] Archive a category with items
- [ ] Restore an archived category
- [ ] Try to delete an active category (should fail)
- [ ] Delete an archived category with no items
- [ ] Try to delete an archived category with items (should fail)
- [ ] Toggle "Show Archived" checkbox
- [ ] Verify archived categories appear grayed out and italic
- [ ] Verify archived categories don't appear in dropdowns/filters by default
