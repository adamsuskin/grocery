import { useState, FormEvent } from 'react';
import { useGroceryMutations } from '../hooks/useGroceryItems';

export function AddItemForm() {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const { addItem } = useGroceryMutations();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    const qty = parseInt(quantity, 10);

    if (!trimmedName || qty <= 0 || isNaN(qty)) {
      return;
    }

    await addItem(trimmedName, qty);

    // Reset form
    setName('');
    setQuantity('1');
  };

  return (
    <form onSubmit={handleSubmit} className="add-item-form">
      <div className="form-group">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Item name"
          className="input"
          required
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
        />
      </div>
      <button type="submit" className="btn btn-primary">
        Add Item
      </button>
    </form>
  );
}
