#!/bin/bash

################################################################################
# Database Restore Script for Grocery List Application
################################################################################
#
# Purpose: Restore PostgreSQL database from backup
#
# Usage:
#   ./restore-db.sh [OPTIONS] <backup_file>
#
# Options:
#   --clean            Drop existing database objects before restore
#   --create           Create the database before restore
#   --data-only        Restore only data, not schema
#   --schema-only      Restore only schema, not data
#   --jobs N           Use N parallel jobs for directory format (default: 4)
#   --dry-run          Show what would be done without executing
#   --force            Skip confirmation prompt
#   --help             Show this help message
#
# Arguments:
#   backup_file        Path to backup file or directory to restore
#
# Requirements:
#   - Docker and Docker Compose installed
#   - PostgreSQL container running
#   - Valid backup file created by backup-db.sh
#
# Examples:
#   ./restore-db.sh backups/grocery_db_backup_20240101-120000.dump
#   ./restore-db.sh --clean backups/grocery_db_backup_20240101-120000.dump
#   ./restore-db.sh --data-only backups/grocery_db_backup_20240101-120000.sql
#   ./restore-db.sh --force --clean backups/latest.dump
#   ./restore-db.sh --jobs 8 backups/grocery_db_backup_20240101-120000.dir
#
# WARNINGS:
#   - This will OVERWRITE existing database data!
#   - Always create a backup before restoring
#   - Use --clean option carefully as it drops existing objects
#
################################################################################

set -euo pipefail

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_DIR/logs"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CLEAN_MODE=false
CREATE_DB=false
DATA_ONLY=false
SCHEMA_ONLY=false
PARALLEL_JOBS=4
DRY_RUN=false
FORCE=false
BACKUP_FILE=""
ENV_FILE=".env.production"
CONTAINER_NAME="grocery-postgres-prod"

# Database configuration (will be loaded from env)
DB_NAME="grocery_db"
DB_USER="grocery"
DB_PASSWORD=""

# Logging setup
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/restore-$(date +%Y%m%d-%H%M%S).log"

################################################################################
# Logging Functions
################################################################################

log_info() {
    echo -e "${BLUE}[INFO]${NC} $*" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $*" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $*" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $*" | tee -a "$LOG_FILE"
}

################################################################################
# Help Function
################################################################################

show_help() {
    sed -n '/^# Purpose:/,/^################################################################################$/p' "$0" | \
        sed 's/^# //g' | sed 's/^#//g' | head -n -1
}

################################################################################
# Configuration Functions
################################################################################

load_env() {
    log_info "Loading environment configuration..."

    if [ -f "$PROJECT_DIR/$ENV_FILE" ]; then
        set -a
        source "$PROJECT_DIR/$ENV_FILE"
        set +a

        DB_NAME="${DB_NAME:-grocery_db}"
        DB_USER="${DB_USER:-grocery}"
        DB_PASSWORD="${DB_PASSWORD:-}"

        log_success "Environment configuration loaded"
    else
        log_warning "Environment file not found: $ENV_FILE"
        log_warning "Using default configuration"
    fi
}

check_container() {
    log_info "Checking database container..."

    if docker ps --format '{{.Names}}' | grep -q "$CONTAINER_NAME"; then
        log_success "Database container is running"
        return 0
    else
        log_error "Database container '$CONTAINER_NAME' is not running"
        log_error "Please start the database: docker compose -f docker-compose.prod.yml up -d postgres"
        exit 1
    fi
}

################################################################################
# Validation Functions
################################################################################

validate_backup_file() {
    log_info "Validating backup file..."

    if [ -z "$BACKUP_FILE" ]; then
        log_error "No backup file specified"
        show_help
        exit 1
    fi

    # Handle relative paths
    if [[ "$BACKUP_FILE" != /* ]]; then
        BACKUP_FILE="$PROJECT_DIR/$BACKUP_FILE"
    fi

    if [ ! -e "$BACKUP_FILE" ]; then
        log_error "Backup file not found: $BACKUP_FILE"
        exit 1
    fi

    log_success "Backup file found: $BACKUP_FILE"
}

detect_backup_format() {
    local format="unknown"

    if [ -d "$BACKUP_FILE" ]; then
        if [ -f "$BACKUP_FILE/toc.dat" ]; then
            format="directory"
        else
            format="unknown"
        fi
    else
        local extension="${BACKUP_FILE##*.}"
        case $extension in
            dump)
                format="custom"
                ;;
            sql)
                format="plain"
                ;;
            *)
                # Try to detect by content
                if file "$BACKUP_FILE" | grep -q "PostgreSQL custom database dump"; then
                    format="custom"
                elif grep -q "PostgreSQL database dump" "$BACKUP_FILE" 2>/dev/null; then
                    format="plain"
                else
                    format="unknown"
                fi
                ;;
        esac
    fi

    if [ "$format" = "unknown" ]; then
        log_error "Unable to detect backup format"
        log_error "Supported formats: custom (.dump), plain (.sql), directory (.dir)"
        exit 1
    fi

    log_info "Detected backup format: $format"
    echo "$format"
}

################################################################################
# Backup Functions
################################################################################

create_pre_restore_backup() {
    log_warning "Creating pre-restore backup of current database..."

    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY RUN] Would create pre-restore backup"
        return 0
    fi

    if [ -f "$SCRIPT_DIR/backup-db.sh" ]; then
        bash "$SCRIPT_DIR/backup-db.sh" --auto --format custom 2>&1 | tee -a "$LOG_FILE"
        log_success "Pre-restore backup completed"
    else
        log_warning "Backup script not found, skipping pre-restore backup"
        log_warning "Proceeding without backup - data loss risk!"

        if [ "$FORCE" = false ]; then
            read -p "Continue without backup? (y/N) " -n 1 -r
            echo ""
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                log_info "Restore cancelled"
                exit 0
            fi
        fi
    fi
}

################################################################################
# Restore Functions
################################################################################

restore_custom_format() {
    local backup_file="$1"
    log_info "Restoring from custom format backup..."

    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY RUN] Would restore from: $backup_file"
        return 0
    fi

    # Copy backup to container if not already there
    local container_backup="/backups/$(basename "$backup_file")"
    if ! docker exec "$CONTAINER_NAME" test -f "$container_backup" 2>/dev/null; then
        log_info "Copying backup to container..."
        docker cp "$backup_file" "$CONTAINER_NAME:$container_backup"
    fi

    # Build pg_restore command
    local restore_cmd="pg_restore -U $DB_USER -d $DB_NAME"

    if [ "$CLEAN_MODE" = true ]; then
        restore_cmd="$restore_cmd --clean --if-exists"
    fi

    if [ "$DATA_ONLY" = true ]; then
        restore_cmd="$restore_cmd --data-only"
    elif [ "$SCHEMA_ONLY" = true ]; then
        restore_cmd="$restore_cmd --schema-only"
    fi

    restore_cmd="$restore_cmd --no-owner --no-acl -v"

    # Execute restore
    log_info "Executing restore (this may take a while)..."
    docker exec "$CONTAINER_NAME" bash -c "$restore_cmd $container_backup" 2>&1 | tee -a "$LOG_FILE"

    if [ ${PIPESTATUS[0]} -eq 0 ]; then
        log_success "Restore completed successfully"
    else
        log_error "Restore failed or completed with warnings"
        log_error "Check $LOG_FILE for details"
        exit 1
    fi
}

restore_plain_format() {
    local backup_file="$1"
    log_info "Restoring from plain SQL backup..."

    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY RUN] Would restore from: $backup_file"
        return 0
    fi

    # Copy backup to container if not already there
    local container_backup="/backups/$(basename "$backup_file")"
    if ! docker exec "$CONTAINER_NAME" test -f "$container_backup" 2>/dev/null; then
        log_info "Copying backup to container..."
        docker cp "$backup_file" "$CONTAINER_NAME:$container_backup"
    fi

    # Execute restore
    log_info "Executing restore (this may take a while)..."
    docker exec "$CONTAINER_NAME" bash -c "psql -U $DB_USER -d $DB_NAME -f $container_backup" 2>&1 | tee -a "$LOG_FILE"

    if [ ${PIPESTATUS[0]} -eq 0 ]; then
        log_success "Restore completed successfully"
    else
        log_error "Restore failed or completed with warnings"
        log_error "Check $LOG_FILE for details"
        exit 1
    fi
}

restore_directory_format() {
    local backup_dir="$1"
    log_info "Restoring from directory format backup..."

    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY RUN] Would restore from: $backup_dir"
        return 0
    fi

    # Copy backup directory to container if not already there
    local container_backup="/backups/$(basename "$backup_dir")"
    if ! docker exec "$CONTAINER_NAME" test -d "$container_backup" 2>/dev/null; then
        log_info "Copying backup directory to container..."
        docker cp "$backup_dir" "$CONTAINER_NAME:/backups/"
    fi

    # Build pg_restore command
    local restore_cmd="pg_restore -U $DB_USER -d $DB_NAME -j $PARALLEL_JOBS"

    if [ "$CLEAN_MODE" = true ]; then
        restore_cmd="$restore_cmd --clean --if-exists"
    fi

    if [ "$DATA_ONLY" = true ]; then
        restore_cmd="$restore_cmd --data-only"
    elif [ "$SCHEMA_ONLY" = true ]; then
        restore_cmd="$restore_cmd --schema-only"
    fi

    restore_cmd="$restore_cmd --no-owner --no-acl -v"

    # Execute restore
    log_info "Executing restore with $PARALLEL_JOBS parallel jobs (this may take a while)..."
    docker exec "$CONTAINER_NAME" bash -c "$restore_cmd $container_backup" 2>&1 | tee -a "$LOG_FILE"

    if [ ${PIPESTATUS[0]} -eq 0 ]; then
        log_success "Restore completed successfully"
    else
        log_error "Restore failed or completed with warnings"
        log_error "Check $LOG_FILE for details"
        exit 1
    fi
}

perform_restore() {
    local format=$(detect_backup_format)

    case $format in
        custom)
            restore_custom_format "$BACKUP_FILE"
            ;;
        plain)
            restore_plain_format "$BACKUP_FILE"
            ;;
        directory)
            restore_directory_format "$BACKUP_FILE"
            ;;
        *)
            log_error "Unsupported backup format: $format"
            exit 1
            ;;
    esac
}

################################################################################
# Post-Restore Functions
################################################################################

verify_restore() {
    log_info "Verifying restore..."

    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY RUN] Would verify restore"
        return 0
    fi

    # Check database connection
    if docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" &>/dev/null; then
        log_success "Database connection verified"
    else
        log_error "Unable to connect to database after restore"
        exit 1
    fi

    # Get table count
    local table_count=$(docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -t -c \
        "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | xargs)

    log_info "Tables in database: $table_count"

    # Get total record count
    local record_count=$(docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -t -c \
        "SELECT SUM(n_live_tup) FROM pg_stat_user_tables;" 2>/dev/null | xargs)

    log_info "Approximate record count: ${record_count:-0}"

    log_success "Restore verification completed"
}

analyze_database() {
    log_info "Analyzing database for optimal performance..."

    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY RUN] Would analyze database"
        return 0
    fi

    docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c "ANALYZE;" 2>&1 | tee -a "$LOG_FILE"

    log_success "Database analysis completed"
}

################################################################################
# Confirmation Functions
################################################################################

show_warning_and_confirm() {
    echo ""
    log_warning "=========================================="
    log_warning "        DATABASE RESTORE WARNING"
    log_warning "=========================================="
    log_warning "This operation will OVERWRITE the current database!"
    log_warning ""
    log_warning "Database: $DB_NAME"
    log_warning "Backup: $BACKUP_FILE"

    if [ "$CLEAN_MODE" = true ]; then
        log_warning "Clean mode: ENABLED (will drop existing objects)"
    fi

    if [ "$DATA_ONLY" = true ]; then
        log_warning "Data only: ENABLED (schema will NOT be restored)"
    elif [ "$SCHEMA_ONLY" = true ]; then
        log_warning "Schema only: ENABLED (data will NOT be restored)"
    fi

    log_warning "=========================================="
    echo ""

    if [ "$FORCE" = false ]; then
        read -p "Are you ABSOLUTELY SURE you want to continue? (yes/no) " -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
            log_info "Restore cancelled by user"
            exit 0
        fi
    else
        log_warning "Force mode enabled - skipping confirmation"
    fi
}

################################################################################
# Main Function
################################################################################

main() {
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --clean)
                CLEAN_MODE=true
                shift
                ;;
            --create)
                CREATE_DB=true
                shift
                ;;
            --data-only)
                DATA_ONLY=true
                shift
                ;;
            --schema-only)
                SCHEMA_ONLY=true
                shift
                ;;
            --jobs)
                PARALLEL_JOBS="$2"
                shift 2
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --force)
                FORCE=true
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            -*)
                log_error "Unknown option: $1"
                echo ""
                show_help
                exit 1
                ;;
            *)
                BACKUP_FILE="$1"
                shift
                ;;
        esac
    done

    # Check for conflicting options
    if [ "$DATA_ONLY" = true ] && [ "$SCHEMA_ONLY" = true ]; then
        log_error "Cannot use both --data-only and --schema-only"
        exit 1
    fi

    log_info "=========================================="
    log_info "Database Restore"
    log_info "=========================================="
    log_info "Log file: $LOG_FILE"

    if [ "$DRY_RUN" = true ]; then
        log_warning "DRY RUN MODE - No changes will be made"
    fi

    echo ""

    # Load configuration
    load_env

    # Check if container is running
    check_container

    # Validate backup file
    validate_backup_file

    # Show warning and get confirmation
    show_warning_and_confirm

    # Create pre-restore backup
    create_pre_restore_backup

    # Perform restore
    perform_restore

    # Verify restore
    verify_restore

    # Analyze database
    analyze_database

    echo ""
    log_success "=========================================="
    log_success "Restore completed successfully!"
    log_success "=========================================="
    echo ""

    log_info "Next steps:"
    log_info "  1. Verify application functionality"
    log_info "  2. Check logs: $LOG_FILE"
    log_info "  3. Monitor application: docker compose -f docker-compose.prod.yml logs -f"
    echo ""
}

# Error handler
trap 'log_error "Restore failed at line $LINENO. Check $LOG_FILE for details"' ERR

# Run main function
main "$@"
