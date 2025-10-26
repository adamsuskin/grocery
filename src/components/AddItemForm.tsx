import { useState, FormEvent } from 'react';
import { useGroceryMutations } from '../hooks/useGroceryItems';
import { CATEGORIES, type Category } from '../types';

export function AddItemForm() {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [category, setCategory] = useState<Category>('Other');
  const { addItem } = useGroceryMutations();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    const qty = parseInt(quantity, 10);

    if (!trimmedName || qty <= 0 || isNaN(qty)) {
      return;
    }

    await addItem(trimmedName, qty, category);

    // Reset form
    setName('');
    setQuantity('1');
    setCategory('Other');
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
      <div className="form-group">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as Category)}
          className="input select-category"
          required
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" className="btn btn-primary">
        Add Item
      </button>
    </form>
  );
}
