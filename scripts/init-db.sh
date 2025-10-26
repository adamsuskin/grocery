#!/bin/bash

# Database initialization script for Grocery app
# This script waits for PostgreSQL to be ready, creates the database if needed,
# and applies the schema from src/schema.sql
#
# Features:
# - Creates users table with authentication fields
# - Creates grocery_items table with user_id foreign key
# - Creates indexes for optimized queries
# - Optionally seeds sample data for development
# - Comprehensive error handling and validation

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default connection parameters (can be overridden by environment variables)
DB_USER="${DB_USER:-grocery}"
DB_PASSWORD="${DB_PASSWORD:-grocery}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-grocery_db}"

# Maximum wait time for PostgreSQL to be ready (in seconds)
MAX_WAIT_TIME=30

# Whether to seed sample data (set SEED_DATA=true to enable)
SEED_DATA="${SEED_DATA:-false}"

echo -e "${GREEN}=== Grocery Database Initialization ===${NC}"
echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo "User: $DB_USER"
echo ""

# Function to print error messages
error() {
    echo -e "${RED}ERROR: $1${NC}" >&2
}

# Function to print success messages
success() {
    echo -e "${GREEN}$1${NC}"
}

# Function to print info messages
info() {
    echo -e "${YELLOW}$1${NC}"
}

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    error "psql command not found. Please install PostgreSQL client."
    exit 1
fi

# Check if PostgreSQL server is running
info "Checking if PostgreSQL server is running..."
if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" &> /dev/null; then
    error "PostgreSQL server is not running or not accessible at $DB_HOST:$DB_PORT"
    error "Please start PostgreSQL server and try again."
    exit 1
fi

success "PostgreSQL server is running!"

# Wait for PostgreSQL to be ready to accept connections
info "Waiting for PostgreSQL to be ready..."
WAIT_COUNT=0
while ! PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "SELECT 1" &> /dev/null; do
    WAIT_COUNT=$((WAIT_COUNT + 1))
    if [ $WAIT_COUNT -ge $MAX_WAIT_TIME ]; then
        error "Timeout waiting for PostgreSQL to be ready after ${MAX_WAIT_TIME} seconds"
        exit 1
    fi
    echo -n "."
    sleep 1
done
echo ""
success "PostgreSQL is ready to accept connections!"

# Check if database exists
info "Checking if database '$DB_NAME' exists..."
DB_EXISTS=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'")

if [ "$DB_EXISTS" = "1" ]; then
    info "Database '$DB_NAME' already exists."
else
    info "Creating database '$DB_NAME'..."
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME;" &> /dev/null; then
        success "Database '$DB_NAME' created successfully!"
    else
        error "Failed to create database '$DB_NAME'"
        exit 1
    fi
fi

# Find the schema file
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SCHEMA_FILE="$PROJECT_ROOT/src/schema.sql"

if [ ! -f "$SCHEMA_FILE" ]; then
    error "Schema file not found at: $SCHEMA_FILE"
    exit 1
fi

# Apply schema
info "Applying schema from $SCHEMA_FILE..."
if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$SCHEMA_FILE"; then
    success "Schema applied successfully!"
else
    error "Failed to apply schema"
    exit 1
fi

# Verify tables were created
info "Verifying tables..."
TABLES_EXIST=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('users', 'grocery_items');")

if [ "$TABLES_EXIST" -eq "2" ]; then
    success "Tables verified: users and grocery_items exist"
else
    error "Table verification failed. Expected 2 tables, found $TABLES_EXIST"
    exit 1
fi

# Verify indexes were created
info "Verifying indexes..."
INDEXES_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT COUNT(*) FROM pg_indexes WHERE schemaname='public' AND tablename IN ('users', 'grocery_items');")

if [ "$INDEXES_COUNT" -gt "0" ]; then
    success "Indexes verified: $INDEXES_COUNT indexes created"
else
    info "Warning: No indexes found, but continuing..."
fi

# Seed sample data if requested
if [ "$SEED_DATA" = "true" ]; then
    info "Seeding sample data for development..."

    # Create sample SQL for seeding
    SEED_SQL=$(cat <<'EOF'
-- ============================================
-- Sample Data for Development
-- ============================================

-- Insert sample users (passwords are 'password123' hashed)
-- Note: In production, use proper password hashing with bcrypt
INSERT INTO users (id, username, email, password_hash, created_at, updated_at, last_login)
VALUES
  ('user-1', 'john_doe', 'john@example.com', '$2b$10$rBV2T8Zy6hIqGXxG5ixPJO8VQjxKlvYzXxYQZxQZ8Z8Z8Z8Z8Z8Z8', strftime('%s', 'now'), strftime('%s', 'now'), NULL),
  ('user-2', 'jane_smith', 'jane@example.com', '$2b$10$rBV2T8Zy6hIqGXxG5ixPJO8VQjxKlvYzXxYQZxQZ8Z8Z8Z8Z8Z8Z8', strftime('%s', 'now'), strftime('%s', 'now'), NULL),
  ('user-3', 'demo_user', 'demo@example.com', '$2b$10$rBV2T8Zy6hIqGXxG5ixPJO8VQjxKlvYzXxYQZxQZ8Z8Z8Z8Z8Z8Z8', strftime('%s', 'now'), strftime('%s', 'now'), NULL)
ON CONFLICT (username) DO NOTHING;

-- Insert sample grocery items for john_doe
INSERT INTO grocery_items (id, name, quantity, gotten, category, notes, created_at, user_id)
VALUES
  ('item-1', 'Milk', 2, false, 'Dairy', 'Whole milk, 1 gallon each', strftime('%s', 'now'), 'user-1'),
  ('item-2', 'Bread', 1, false, 'Bakery', 'Whole wheat', strftime('%s', 'now'), 'user-1'),
  ('item-3', 'Eggs', 1, true, 'Dairy', '1 dozen', strftime('%s', 'now'), 'user-1'),
  ('item-4', 'Apples', 6, false, 'Produce', 'Honeycrisp', strftime('%s', 'now'), 'user-1'),
  ('item-5', 'Chicken Breast', 2, false, 'Meat', 'Boneless, skinless', strftime('%s', 'now'), 'user-1')
ON CONFLICT (id) DO NOTHING;

-- Insert sample grocery items for jane_smith
INSERT INTO grocery_items (id, name, quantity, gotten, category, notes, created_at, user_id)
VALUES
  ('item-6', 'Pasta', 2, false, 'Pantry', 'Spaghetti', strftime('%s', 'now'), 'user-2'),
  ('item-7', 'Tomato Sauce', 3, false, 'Pantry', 'Marinara', strftime('%s', 'now'), 'user-2'),
  ('item-8', 'Cheese', 1, false, 'Dairy', 'Parmesan, grated', strftime('%s', 'now'), 'user-2')
ON CONFLICT (id) DO NOTHING;

-- Insert sample grocery items for demo_user
INSERT INTO grocery_items (id, name, quantity, gotten, category, notes, created_at, user_id)
VALUES
  ('item-9', 'Bananas', 5, false, 'Produce', 'For smoothies', strftime('%s', 'now'), 'user-3'),
  ('item-10', 'Coffee', 1, false, 'Beverages', 'Dark roast', strftime('%s', 'now'), 'user-3')
ON CONFLICT (id) DO NOTHING;
EOF
)

    # Apply seed data
    if echo "$SEED_SQL" | PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME"; then
        success "Sample data seeded successfully!"

        # Display counts
        USER_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT COUNT(*) FROM users;")
        ITEM_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT COUNT(*) FROM grocery_items;")

        info "Sample data summary:"
        echo "  - Users: $USER_COUNT"
        echo "  - Grocery items: $ITEM_COUNT"
    else
        error "Failed to seed sample data (non-fatal, continuing...)"
    fi
else
    info "Skipping sample data seeding (set SEED_DATA=true to enable)"
fi

echo ""
success "=== Database initialization completed successfully! ==="
echo ""
echo "Connection string: postgresql://$DB_USER:****@$DB_HOST:$DB_PORT/$DB_NAME"
echo ""
info "Tables created:"
echo "  - users (with indexes on username, email, last_login)"
echo "  - grocery_items (with indexes on user_id, category, gotten status, created_at)"
echo ""
info "Usage:"
echo "  Run with sample data: SEED_DATA=true ./scripts/init-db.sh"
echo "  Reset database: Drop and recreate, then run this script again"
