import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import { AddItemForm } from './components/AddItemForm';
import { GroceryList } from './components/GroceryList';
import { UserProfile } from './components/UserProfile';
import type { FilterState, SortState } from './types';
import { CATEGORIES } from './types';
import './App.css';

type AuthView = 'login' | 'register';

function App() {
  const { isAuthenticated, loading } = useAuth();
  const [authView, setAuthView] = useState<AuthView>('login');

  const [filters, setFilters] = useState<FilterState>({
    searchText: '',
    showGotten: true,
    categories: [...CATEGORIES], // Show all categories by default
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

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="app">
        <div className="auth-loading">
          <div className="loading-spinner-large"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Show authentication forms if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="app">
        <header className="header">
          <h1>🛒 Grocery List</h1>
          <p className="subtitle">Collaborative shopping list</p>
        </header>

        <main className="main auth-main">
          {authView === 'login' ? (
            <LoginForm onSwitchToRegister={() => setAuthView('register')} />
          ) : (
            <RegisterForm onSwitchToLogin={() => setAuthView('login')} />
          )}
        </main>
      </div>
    );
  }

  // Show grocery list when authenticated
  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="header-title">
            <h1>🛒 Grocery List</h1>
            <p className="subtitle">Collaborative shopping list</p>
          </div>
          <UserProfile />
        </div>
      </header>

      <main className="main">
        <section className="add-section">
          <h2>Add Item</h2>
          <AddItemForm />
        </section>

        <section className="list-section">
          <h2>Shopping List</h2>
          <GroceryList
            filters={filters}
            onFilterChange={handleFilterChange}
            sort={sort}
            onSortChange={handleSortChange}
          />
        </section>
      </main>
    </div>
  );
}

export default App;
