import { useState, memo } from 'react';
import type { GroceryItem as GroceryItemType, PermissionLevel } from '../types';
import { useGroceryMutations } from '../hooks/useGroceryItems';
import { useCustomCategories } from '../hooks/useCustomCategories';
import { CATEGORIES } from '../types';
import { CategoryContextMenu, type CategoryAction } from './CategoryContextMenu';
import { useLongPress } from '../hooks/useLongPress';

interface GroceryItemProps {
  item: GroceryItemType;
  canEdit: boolean;
  userPermission?: PermissionLevel;
}

/**
 * Calculate contrast color (white or black) based on background color
 * for optimal readability
 */
function getContrastColor(hexColor: string): string {
  // Remove # if present
  const hex = hexColor.replace('#', '');

  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return black for light backgrounds, white for dark backgrounds
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

export const GroceryItem = memo(function GroceryItem({ item, canEdit, userPermission = 'viewer' }: GroceryItemProps) {
  const { markItemGotten, deleteItem, updateItem } = useGroceryMutations();
  const [showNotes, setShowNotes] = useState(false);
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [priceInput, setPriceInput] = useState(item.price?.toFixed(2) || '');
  const [contextMenu, setContextMenu] = useState<{
    position: { x: number; y: number };
  } | null>(null);

  // Get custom categories for this list
  const customCategories = useCustomCategories(item.listId);

  // Check if this is a predefined category or custom category
  const isPredefinedCategory = CATEGORIES.includes(item.category as any);

  // Find custom category data if it exists
  const categoryObj = customCategories.find(c => c.name === item.category);
  const categoryColor = categoryObj?.color;
  const categoryIcon = categoryObj?.icon;

  const handleToggleGotten = () => {
    if (!canEdit) return;
    markItemGotten(item.id, !item.gotten);
  };

  const handleDelete = () => {
    if (!canEdit) return;
    if (confirm(`Delete "${item.name}"?`)) {
      deleteItem(item.id);
    }
  };

  const handlePriceClick = () => {
    if (!canEdit) return;
    setIsEditingPrice(true);
    setPriceInput(item.price?.toFixed(2) || '');
  };

  const handlePriceBlur = async () => {
    setIsEditingPrice(false);
    const newPrice = parseFloat(priceInput);

    // Only update if the price has changed
    if (!isNaN(newPrice) && newPrice !== item.price) {
      await updateItem(item.id, { price: newPrice });
    } else if (priceInput === '' && item.price !== null) {
      // Clear price if input is empty (set to undefined to remove the field)
      await updateItem(item.id, { price: undefined });
    }
  };

  const handlePriceKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      setIsEditingPrice(false);
      setPriceInput(item.price?.toFixed(2) || '');
    }
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const calculateTotal = (): string | null => {
    if (item.price === null || item.price === undefined) return null;
    const total = item.price * item.quantity;
    return formatPrice(total);
  };

  const handleCategoryContextMenu = (e: React.MouseEvent) => {
    // Only show context menu if there's a custom category
    if (!categoryObj) return;

    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      position: { x: e.clientX, y: e.clientY },
    });
  };

  const handleContextMenuAction = (action: CategoryAction) => {
    // For now, these actions would need to be handled by a parent component
    // or we'd need to add callbacks to the props
    console.log(`Category action: ${action} for category ${categoryObj?.name}`);

    // You could add callbacks here or emit events
    // For example: onCategoryAction?.(action, categoryObj);
  };

  // Long-press handlers for mobile
  const categoryLongPressHandlers = useLongPress({
    onLongPress: (e) => {
      if (!categoryObj) return;

      const touch = 'touches' in e ? e.touches[0] : e as React.MouseEvent;
      const clientX = 'clientX' in touch ? touch.clientX : (e as any).clientX;
      const clientY = 'clientY' in touch ? touch.clientY : (e as any).clientY;

      setContextMenu({
        position: { x: clientX, y: clientY },
      });
    },
    delay: 500,
  });

  return (
    <div className={`grocery-item ${item.gotten ? 'gotten' : ''} ${!canEdit ? 'read-only' : ''}`}>
      <div className="item-content">
        <input
          type="checkbox"
          checked={item.gotten}
          onChange={handleToggleGotten}
          className="checkbox"
          disabled={!canEdit}
          title={!canEdit ? 'View-only access' : ''}
        />
        <div className="item-details">
          <span className="item-name">{item.name}</span>
          <span
            className={`category-badge ${isPredefinedCategory ? `category-${item.category.toLowerCase()}` : 'category-custom'}`}
            style={
              categoryColor
                ? {
                    backgroundColor: categoryColor,
                    borderColor: categoryColor,
                    color: getContrastColor(categoryColor),
                  }
                : undefined
            }
            onContextMenu={handleCategoryContextMenu}
            {...(categoryObj ? categoryLongPressHandlers : {})}
            title={categoryObj ? 'Right-click or long-press for category actions' : undefined}
          >
            {categoryIcon && <span className="category-icon">{categoryIcon}</span>}
            {item.category}
          </span>
          {item.notes && (
            <button
              onClick={() => setShowNotes(!showNotes)}
              className="notes-toggle"
              aria-label="Toggle notes"
            >
              {showNotes ? '📝' : '📋'}
            </button>
          )}
          {!canEdit && (
            <span className="read-only-badge" title="View-only access">
              👁️
            </span>
          )}
        </div>
        <div className="item-quantity-price">
          <span className="item-quantity" aria-label={`Quantity: ${item.quantity}`}>
            {item.quantityDecimal ? (
              // Show more precise decimal quantity if available
              item.unit ? `${item.quantityDecimal} ${item.unit}` : `×${item.quantityDecimal}`
            ) : (
              // Show integer quantity
              item.unit ? `${item.quantity} ${item.unit}` : `×${item.quantity}`
            )}
          </span>
          {item.price !== null && item.price !== undefined ? (
            <div className="price-info">
              {isEditingPrice ? (
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  onBlur={handlePriceBlur}
                  onKeyDown={handlePriceKeyDown}
                  className="price-input"
                  autoFocus
                  aria-label="Edit price per unit"
                />
              ) : (
                <>
                  <span
                    className={`item-price ${canEdit ? 'editable' : ''}`}
                    onClick={handlePriceClick}
                    role="button"
                    tabIndex={canEdit ? 0 : -1}
                    aria-label={`Price per unit: ${formatPrice(item.price)}${canEdit ? ', click to edit' : ''}`}
                    title={canEdit ? 'Click to edit price' : undefined}
                  >
                    @ {formatPrice(item.price)}
                  </span>
                  {item.quantity > 1 && (
                    <span
                      className="item-total"
                      aria-label={`Total price: ${calculateTotal()}`}
                    >
                      = {calculateTotal()}
                    </span>
                  )}
                </>
              )}
            </div>
          ) : canEdit ? (
            <button
              onClick={handlePriceClick}
              className="add-price-btn"
              aria-label="Add price"
              title="Add price"
            >
              + Price
            </button>
          ) : null}
        </div>
      </div>
      {item.notes && showNotes && (
        <div className={`notes-content ${showNotes ? 'notes-expanded' : ''}`}>
          {item.notes}
        </div>
      )}
      <button
        onClick={handleDelete}
        className="btn btn-delete"
        aria-label="Delete item"
        disabled={!canEdit}
        title={!canEdit ? 'View-only access' : 'Delete item'}
      >
        🗑️
      </button>

      {contextMenu && categoryObj && (
        <CategoryContextMenu
          category={categoryObj}
          position={contextMenu.position}
          onClose={() => setContextMenu(null)}
          onAction={handleContextMenuAction}
          userPermission={userPermission}
        />
      )}
    </div>
  );
});
