/**
 * Example App.tsx showing how to use ProtectedRoute component
 *
 * This file demonstrates the integration of authentication with the grocery app.
 * To use this example, replace your App.tsx content with this.
 */

import { useState } from 'react';
import { AddItemForm } from './components/AddItemForm';
import { GroceryList } from './components/GroceryList';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';
import type { FilterState, SortState } from './types';
import { CATEGORIES } from './types';
import './App.css';

function App() {
  const { user, logout } = useAuth();
  const [filters, setFilters] = useState<FilterState>({
    searchText: '',
    showGotten: true,
    categories: [...CATEGORIES],
  });

  const [sort, setSort] = useState<SortState>({
    field: 'date',
    direction: 'desc',
  });

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleSortChange = (newSort: SortState) => {
    setSort(newSort);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <ProtectedRoute>
      <div className="app">
        <header className="header">
          <div className="header-content">
            <div>
              <h1>Grocery List</h1>
              <p className="subtitle">Collaborative shopping list</p>
            </div>
            {user && (
              <div className="user-info">
                <span>Welcome, {user.name || user.email}!</span>
                <button onClick={handleLogout} className="logout-button">
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="main">
          <section className="add-section">
            <h2>Add Item</h2>
            <AddItemForm listId="example-list-id" canEdit={true} />
          </section>

          <section className="list-section">
            <h2>Shopping List</h2>
            <GroceryList
              listId="example-list-id"
              canEdit={true}
              filters={filters}
              onFilterChange={handleFilterChange}
              sort={sort}
              onSortChange={handleSortChange}
            />
          </section>
        </main>
      </div>
    </ProtectedRoute>
  );
}

export default App;
