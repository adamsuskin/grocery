#!/bin/bash
#
# Migration Helper Script
# Convenience wrapper around the TypeScript migration tool
#
# Usage:
#   ./migrate.sh up              Run all pending migrations
#   ./migrate.sh down            Rollback last migration
#   ./migrate.sh status          Show migration status
#   ./migrate.sh verify          Verify database and show stats
#   ./migrate.sh backup          Create database backup
#

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$(dirname "$SCRIPT_DIR")"

# Change to server directory
cd "$SERVER_DIR"

# Load environment variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Database connection settings
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-grocery}"
DB_NAME="${DB_NAME:-grocery_db}"

# Functions
print_header() {
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
  echo -e "${RED}✗ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
  echo -e "${BLUE}ℹ $1${NC}"
}

# Check if PostgreSQL is running
check_postgres() {
  print_info "Checking PostgreSQL connection..."

  if pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > /dev/null 2>&1; then
    print_success "PostgreSQL is running"
    return 0
  else
    print_error "PostgreSQL is not accessible"
    print_info "Try: docker compose up -d postgres"
    return 1
  fi
}

# Create database backup
backup_database() {
  print_header "Creating Database Backup"

  if ! check_postgres; then
    return 1
  fi

  BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"

  print_info "Backing up database to $BACKUP_FILE..."

  if PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" > "$BACKUP_FILE"; then
    print_success "Backup created: $BACKUP_FILE"
    print_info "Backup size: $(du -h "$BACKUP_FILE" | cut -f1)"
    return 0
  else
    print_error "Backup failed"
    return 1
  fi
}

# Verify database state
verify_database() {
  print_header "Verifying Database State"

  if ! check_postgres; then
    return 1
  fi

  echo ""
  print_info "Tables:"
  PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "\dt" 2>/dev/null || true

  echo ""
  print_info "Checking for users table..."
  USERS_EXISTS=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users');" 2>/dev/null || echo "f")

  if [ "$USERS_EXISTS" = "t" ]; then
    print_success "Users table exists"
    USER_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT COUNT(*) FROM users;" 2>/dev/null)
    print_info "User count: $USER_COUNT"
  else
    print_warning "Users table does not exist (migration not run yet)"
  fi

  echo ""
  print_info "Checking for grocery_items table..."
  ITEMS_EXISTS=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'grocery_items');" 2>/dev/null || echo "f")

  if [ "$ITEMS_EXISTS" = "t" ]; then
    print_success "Grocery items table exists"
    ITEM_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT COUNT(*) FROM grocery_items;" 2>/dev/null)
    print_info "Item count: $ITEM_COUNT"

    # Check if user_id column exists
    USER_ID_EXISTS=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'grocery_items' AND column_name = 'user_id');" 2>/dev/null || echo "f")

    if [ "$USER_ID_EXISTS" = "t" ]; then
      print_success "user_id column exists on grocery_items"
    else
      print_warning "user_id column missing (migration not run yet)"
    fi
  else
    print_warning "Grocery items table does not exist"
  fi

  echo ""
}

# Run migration
run_migration() {
  local COMMAND=$1

  print_header "Running Migration: $COMMAND"

  if ! check_postgres; then
    return 1
  fi

  echo ""
  npm run migrate "$COMMAND"
}

# Main script
main() {
  local COMMAND=${1:-status}

  case "$COMMAND" in
    up)
      print_warning "This will apply database migrations"
      echo ""
      read -p "Continue? (y/N) " -n 1 -r
      echo ""
      if [[ $REPLY =~ ^[Yy]$ ]]; then
        run_migration up
      else
        print_info "Migration cancelled"
      fi
      ;;

    down)
      print_warning "This will ROLLBACK the last migration and may DELETE DATA!"
      echo ""
      read -p "Are you sure? (y/N) " -n 1 -r
      echo ""
      if [[ $REPLY =~ ^[Yy]$ ]]; then
        run_migration down
      else
        print_info "Rollback cancelled"
      fi
      ;;

    status)
      run_migration status
      ;;

    verify)
      verify_database
      ;;

    backup)
      backup_database
      ;;

    *)
      print_header "Migration Helper Script"
      echo ""
      echo "Usage: $0 [command]"
      echo ""
      echo "Commands:"
      echo "  up        Run all pending migrations"
      echo "  down      Rollback last migration (WARNING: may delete data)"
      echo "  status    Show migration status"
      echo "  verify    Verify database state and show statistics"
      echo "  backup    Create database backup"
      echo ""
      echo "Examples:"
      echo "  $0 status           # Check what needs to be migrated"
      echo "  $0 backup           # Create backup before migrating"
      echo "  $0 up               # Run migrations"
      echo "  $0 verify           # Verify everything worked"
      echo ""
      exit 1
      ;;
  esac
}

# Run main function
main "$@"
