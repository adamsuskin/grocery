-- Grocery Items Table
CREATE TABLE IF NOT EXISTS grocery_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  gotten INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

-- Index for sorting by creation time
CREATE INDEX IF NOT EXISTS idx_grocery_items_created_at ON grocery_items(created_at DESC);
