import { useGroceryItems } from '../hooks/useGroceryItems';
import { useGroceryMutations } from '../zero-store';
import { GroceryItem } from './GroceryItem';
import { SearchFilterBar } from './SearchFilterBar';
import { SortControls } from './SortControls';
import { BulkOperations } from './BulkOperations';
import type { FilterState, FilterChangeHandler, SortState, SortChangeHandler } from '../types';

interface GroceryListProps {
  filters: FilterState;
  onFilterChange: FilterChangeHandler;
  sort: SortState;
  onSortChange: SortChangeHandler;
}

export function GroceryList({ filters, onFilterChange, sort, onSortChange }: GroceryListProps) {
  // Get mutations for bulk operations
  const { markAllGotten, deleteAllGotten } = useGroceryMutations();

  // Get filtered and sorted items
  const filteredItems = useGroceryItems(filters, sort);

  // Get total count (unfiltered, default sort)
  const allItems = useGroceryItems();
  const totalCount = allItems.length;
  const filteredCount = filteredItems.length;
  const gottenCount = allItems.filter(item => item.gotten).length;

  // Bulk operation handlers
  const handleMarkAllGotten = async () => {
    await markAllGotten(allItems);
  };

  const handleDeleteAllGotten = async () => {
    await deleteAllGotten(allItems);
  };

  // Determine if filters are active
  const hasActiveFilters = filters.searchText !== '' || !filters.showGotten;

  // Empty state logic
  if (totalCount === 0) {
    return (
      <div className="empty-state">
        <p>No items in your grocery list yet.</p>
        <p>Add your first item above!</p>
      </div>
    );
  }

  return (
    <>
      <SearchFilterBar
        filters={filters}
        onChange={onFilterChange}
        totalCount={totalCount}
        filteredCount={filteredCount}
      />

      <SortControls sort={sort} onChange={onSortChange} />

      <BulkOperations
        itemCount={totalCount}
        gottenCount={gottenCount}
        onMarkAllGotten={handleMarkAllGotten}
        onDeleteAllGotten={handleDeleteAllGotten}
      />

      {filteredCount === 0 ? (
        <div className="empty-state">
          <p>No items match your {hasActiveFilters ? 'filters' : 'search'}.</p>
          <p>Try adjusting your search or filter settings.</p>
        </div>
      ) : (
        <div className="grocery-list">
          {filteredItems.map((item) => (
            <GroceryItem key={item.id} item={item} />
          ))}
        </div>
      )}
    </>
  );
}
