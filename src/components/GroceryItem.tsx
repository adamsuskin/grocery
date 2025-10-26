import { useState, memo } from 'react';
import type { GroceryItem as GroceryItemType } from '../types';
import { useGroceryMutations } from '../hooks/useGroceryItems';

interface GroceryItemProps {
  item: GroceryItemType;
  canEdit: boolean;
}

export const GroceryItem = memo(function GroceryItem({ item, canEdit }: GroceryItemProps) {
  const { markItemGotten, deleteItem, updateItem } = useGroceryMutations();
  const [showNotes, setShowNotes] = useState(false);
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [priceInput, setPriceInput] = useState(item.price?.toFixed(2) || '');

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
          <span className={`category-badge category-${item.category.toLowerCase()}`}>
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
            ×{item.quantity}
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
    </div>
  );
});
