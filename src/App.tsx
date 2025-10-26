import { AddItemForm } from './components/AddItemForm';
import { GroceryList } from './components/GroceryList';
import './App.css';

function App() {
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
          <GroceryList />
        </section>
      </main>
    </div>
  );
}

export default App;
