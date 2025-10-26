import { useState, FormEvent } from 'react';
import { useGroceryMutations } from '../hooks/useGroceryItems';
import { CATEGORIES, type Category } from '../types';

interface AddItemFormProps {
  listId: string | null;
  canEdit: boolean;
}

export function AddItemForm({ listId, canEdit }: AddItemFormProps) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [category, setCategory] = useState<Category>('Other');
  const [notes, setNotes] = useState('');
  const [price, setPrice] = useState('');
  const { addItem } = useGroceryMutations();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!canEdit || !listId) {
      return;
    }

    const trimmedName = name.trim();
    const qty = parseInt(quantity, 10);
    const priceValue = price.trim() ? parseFloat(price) : undefined;

    // Validation
    if (!trimmedName || qty <= 0 || isNaN(qty)) {
      return;
    }

    // Validate price if provided (must be >= 0)
    if (priceValue !== undefined && (isNaN(priceValue) || priceValue < 0)) {
      return;
    }

    await addItem(trimmedName, qty, category, notes, listId, priceValue);

    // Reset form
    setName('');
    setQuantity('1');
    setCategory('Other');
    setNotes('');
    setPrice('');
  };

  const handlePriceBlur = () => {
    // Format price to 2 decimal places on blur if a valid number is entered
    const priceValue = parseFloat(price);
    if (!isNaN(priceValue) && priceValue >= 0) {
      setPrice(priceValue.toFixed(2));
    }
  };

  const isDisabled = !canEdit || !listId;

  return (
    <form onSubmit={handleSubmit} className="add-item-form">
      {!canEdit && listId && (
        <div className="permission-notice">
          You have view-only access to this list
        </div>
      )}
      {!listId && (
        <div className="permission-notice">
          Please select a list to add items
        </div>
      )}
      <div className="form-group">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Item name"
          className="input"
          required
          disabled={isDisabled}
        />
      </div>
      <div className="form-group">
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          min="1"
          className="input input-number"
          required
          disabled={isDisabled}
        />
      </div>
      <div className="form-group price-input-group">
        <div className="price-input-wrapper" title="Price is optional and helps track spending">
          <span className="currency-symbol">$</span>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            onBlur={handlePriceBlur}
            min="0"
            step="0.01"
            placeholder="0.00"
            className="input input-price"
            disabled={isDisabled}
          />
        </div>
      </div>
      <div className="form-group">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as Category)}
          className="input select-category"
          required
          disabled={isDisabled}
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes (optional)"
          className="input"
          rows={3}
          disabled={isDisabled}
        />
      </div>
      <button type="submit" className="btn btn-primary" disabled={isDisabled}>
        Add Item
      </button>
    </form>
  );
}
