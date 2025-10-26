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
  const { addItem } = useGroceryMutations();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!canEdit || !listId) {
      return;
    }

    const trimmedName = name.trim();
    const qty = parseInt(quantity, 10);

    if (!trimmedName || qty <= 0 || isNaN(qty)) {
      return;
    }

    await addItem(trimmedName, qty, category, notes, listId);

    // Reset form
    setName('');
    setQuantity('1');
    setCategory('Other');
    setNotes('');
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
