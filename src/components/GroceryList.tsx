import { useGroceryItems } from '../hooks/useGroceryItems';
import { useGroceryMutations } from '../zero-store';
import { GroceryItem } from './GroceryItem';
import { SearchFilterBar } from './SearchFilterBar';
import { SortControls } from './SortControls';
import { BulkOperations } from './BulkOperations';
import type { FilterState, FilterChangeHandler, SortState, SortChangeHandler } from '../types';

interface GroceryListProps {
  listId: string | null;
  canEdit: boolean;
  filters: FilterState;
  onFilterChange: FilterChangeHandler;
  sort: SortState;
  onSortChange: SortChangeHandler;
}

export function GroceryList({ listId, canEdit, filters, onFilterChange, sort, onSortChange }: GroceryListProps) {
  // Get mutations for bulk operations
  const { markAllGotten, deleteAllGotten } = useGroceryMutations();

  // Get filtered and sorted items (scoped to listId)
  const filteredItems = useGroceryItems(listId || undefined, filters, sort);

  // Get total count (unfiltered, default sort, scoped to listId)
  const allItems = useGroceryItems(listId || undefined);
  const totalCount = allItems.length;
  const filteredCount = filteredItems.length;
  const gottenCount = allItems.filter(item => item.gotten).length;

  // Bulk operation handlers
  const handleMarkAllGotten = async () => {
    if (!canEdit) return;
    await markAllGotten(allItems);
  };

  const handleDeleteAllGotten = async () => {
    if (!canEdit) return;
    await deleteAllGotten(allItems);
  };

  // Determine if filters are active
  const hasActiveFilters = filters.searchText !== '' || !filters.showGotten;

  // Empty state logic - no list selected
  if (!listId) {
    return (
      <div className="empty-state">
        <p>No list selected.</p>
        <p>Please select a list to view items.</p>
      </div>
    );
  }

  // Empty state logic - no items in list
  if (totalCount === 0) {
    return (
      <div className="empty-state">
        <p>No items in this list yet.</p>
        {canEdit ? (
          <p>Add your first item above!</p>
        ) : (
          <p>This list is empty. You have view-only access.</p>
        )}
      </div>
    );
  }

  return (
    <>
      {!canEdit && (
        <div className="permission-notice list-read-only">
          You have view-only access to this list
        </div>
      )}

      <SearchFilterBar
        filters={filters}
        onChange={onFilterChange}
        totalCount={totalCount}
        filteredCount={filteredCount}
        listId={listId}
      />

      <SortControls sort={sort} onChange={onSortChange} />

      <BulkOperations
        itemCount={totalCount}
        gottenCount={gottenCount}
        onMarkAllGotten={handleMarkAllGotten}
        onDeleteAllGotten={handleDeleteAllGotten}
        disabled={!canEdit}
      />

      {filteredCount === 0 ? (
        <div className="empty-state">
          <p>No items match your {hasActiveFilters ? 'filters' : 'search'}.</p>
          <p>Try adjusting your search or filter settings.</p>
        </div>
      ) : (
        <div className="grocery-list">
          {filteredItems.map((item) => (
            <GroceryItem key={item.id} item={item} canEdit={canEdit} />
          ))}
        </div>
      )}
    </>
  );
}
