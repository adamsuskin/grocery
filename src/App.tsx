import { useState } from 'react';
import { AddItemForm } from './components/AddItemForm';
import { GroceryList } from './components/GroceryList';
import type { FilterState } from './types';
import './App.css';

function App() {
  const [filters, setFilters] = useState<FilterState>({
    searchText: '',
    showGotten: true,
  });

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🛒 Grocery List</h1>
        <p className="subtitle">Collaborative shopping list</p>
      </header>

      <main className="main">
        <section className="add-section">
          <h2>Add Item</h2>
          <AddItemForm />
        </section>

        <section className="list-section">
          <h2>Shopping List</h2>
          <GroceryList filters={filters} onFilterChange={handleFilterChange} />
        </section>
      </main>
    </div>
  );
}

export default App;
