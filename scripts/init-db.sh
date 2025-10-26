#!/bin/bash

# Database initialization script for Grocery app
# This script waits for PostgreSQL to be ready, creates the database if needed,
# and applies the schema from src/schema.sql

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

echo ""
success "=== Database initialization completed successfully! ==="
echo ""
echo "Connection string: postgresql://$DB_USER:****@$DB_HOST:$DB_PORT/$DB_NAME"
