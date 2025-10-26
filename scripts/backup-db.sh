#!/bin/bash

################################################################################
# Database Backup Script for Grocery List Application
################################################################################
#
# Purpose: Create backups of the PostgreSQL database
#
# Usage:
#   ./backup-db.sh [OPTIONS]
#
# Options:
#   --output DIR       Specify custom backup directory (default: ../backups)
#   --format FORMAT    Backup format: custom|plain|directory (default: custom)
#   --compress LEVEL   Compression level 0-9 (default: 6, custom format only)
#   --auto             Automatic mode (no prompts, suitable for cron)
#   --keep-days N      Delete backups older than N days (default: 30)
#   --dry-run          Show what would be done without executing
#   --help             Show this help message
#
# Backup Formats:
#   custom     - Compressed custom format (recommended, use with pg_restore)
#   plain      - Plain SQL text file (use with psql)
#   directory  - Directory format with parallel backup capability
#
# Requirements:
#   - Docker and Docker Compose installed
#   - PostgreSQL container running or .env.production file exists
#   - Sufficient disk space for backup
#
# Examples:
#   ./backup-db.sh                           # Interactive backup
#   ./backup-db.sh --auto                    # Automatic backup (cron)
#   ./backup-db.sh --format plain            # Plain SQL backup
#   ./backup-db.sh --keep-days 7             # Keep only 7 days of backups
#   ./backup-db.sh --output /mnt/backups     # Custom backup location
#
# Scheduled Backups (crontab):
#   # Daily at 2 AM
#   0 2 * * * /path/to/backup-db.sh --auto --keep-days 7
#
################################################################################

set -euo pipefail

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DEFAULT_BACKUP_DIR="$PROJECT_DIR/backups"
LOG_DIR="$PROJECT_DIR/logs"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="$DEFAULT_BACKUP_DIR"
BACKUP_FORMAT="custom"
COMPRESS_LEVEL=6
AUTO_MODE=false
KEEP_DAYS=30
DRY_RUN=false
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Database configuration (will be loaded from env)
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="grocery_db"
DB_USER="grocery"
DB_PASSWORD=""
CONTAINER_NAME="grocery-postgres-prod"

################################################################################
# Logging Functions
################################################################################

log_info() {
    echo -e "${BLUE}[INFO]${NC} $*"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $*"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $*"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $*"
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
        DB_PORT="${DB_PORT:-5432}"

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
        log_error "Please start the database: docker compose -f $COMPOSE_FILE up -d postgres"
        exit 1
    fi
}

################################################################################
# Backup Functions
################################################################################

create_backup_dir() {
    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY RUN] Would create backup directory: $BACKUP_DIR"
        return 0
    fi

    if [ ! -d "$BACKUP_DIR" ]; then
        log_info "Creating backup directory: $BACKUP_DIR"
        mkdir -p "$BACKUP_DIR"
        log_success "Backup directory created"
    fi
}

get_backup_filename() {
    local extension=""

    case $BACKUP_FORMAT in
        custom)
            extension="dump"
            ;;
        plain)
            extension="sql"
            ;;
        directory)
            extension="dir"
            ;;
    esac

    echo "${DB_NAME}_backup_${TIMESTAMP}.${extension}"
}

get_database_size() {
    local size=$(docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -t -c \
        "SELECT pg_size_pretty(pg_database_size('$DB_NAME'));" 2>/dev/null | xargs)

    if [ -n "$size" ]; then
        echo "$size"
    else
        echo "Unknown"
    fi
}

perform_backup() {
    local backup_file="$1"
    local backup_path="$BACKUP_DIR/$backup_file"

    log_info "Starting database backup..."
    log_info "Database: $DB_NAME"
    log_info "Format: $BACKUP_FORMAT"
    log_info "Backup file: $backup_file"

    # Get database size
    local db_size=$(get_database_size)
    log_info "Database size: $db_size"

    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY RUN] Would create backup at: $backup_path"
        return 0
    fi

    # Prepare pg_dump command based on format
    local dump_cmd="pg_dump -U $DB_USER -d $DB_NAME"

    case $BACKUP_FORMAT in
        custom)
            dump_cmd="$dump_cmd -Fc -Z $COMPRESS_LEVEL"
            ;;
        plain)
            dump_cmd="$dump_cmd -Fp --no-owner --no-acl"
            ;;
        directory)
            mkdir -p "$backup_path"
            dump_cmd="$dump_cmd -Fd -j 4"
            ;;
    esac

    # Execute backup inside container
    log_info "Creating backup (this may take a while)..."

    if [ "$BACKUP_FORMAT" = "directory" ]; then
        # Directory format requires special handling
        docker exec "$CONTAINER_NAME" bash -c "$dump_cmd -f /backups/$backup_file"
    else
        docker exec "$CONTAINER_NAME" bash -c "$dump_cmd" > "$backup_path"
    fi

    if [ $? -eq 0 ]; then
        log_success "Backup created successfully"

        # Get backup file size
        if [ "$BACKUP_FORMAT" = "directory" ]; then
            local backup_size=$(du -sh "$backup_path" | cut -f1)
        else
            local backup_size=$(du -h "$backup_path" | cut -f1)
        fi

        log_info "Backup size: $backup_size"
        log_info "Backup location: $backup_path"

        # Create metadata file
        cat > "$backup_path.info" <<EOF
Backup Metadata
===============
Database: $DB_NAME
User: $DB_USER
Timestamp: $TIMESTAMP
Date: $(date)
Format: $BACKUP_FORMAT
Database Size: $db_size
Backup Size: $backup_size
Compression: $COMPRESS_LEVEL
EOF

        log_success "Backup metadata saved"
    else
        log_error "Backup failed"
        exit 1
    fi
}

verify_backup() {
    local backup_file="$1"
    local backup_path="$BACKUP_DIR/$backup_file"

    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY RUN] Would verify backup"
        return 0
    fi

    log_info "Verifying backup integrity..."

    case $BACKUP_FORMAT in
        custom)
            # Verify custom format backup
            if docker exec "$CONTAINER_NAME" bash -c "pg_restore -l /backups/$backup_file" &>/dev/null; then
                log_success "Backup verification passed"
            else
                log_warning "Backup verification failed or format doesn't support verification"
            fi
            ;;
        plain)
            # Check if file is valid SQL
            if grep -q "PostgreSQL database dump" "$backup_path" 2>/dev/null; then
                log_success "Backup appears to be valid SQL"
            else
                log_warning "Could not verify SQL backup format"
            fi
            ;;
        directory)
            # Check if toc.dat exists
            if [ -f "$backup_path/toc.dat" ]; then
                log_success "Directory backup structure is valid"
            else
                log_warning "Directory backup structure may be invalid"
            fi
            ;;
    esac
}

################################################################################
# Cleanup Functions
################################################################################

cleanup_old_backups() {
    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY RUN] Would clean up backups older than $KEEP_DAYS days"
        local old_files=$(find "$BACKUP_DIR" -name "${DB_NAME}_backup_*" -type f -mtime +$KEEP_DAYS 2>/dev/null)
        if [ -n "$old_files" ]; then
            echo "$old_files" | while read -r file; do
                log_info "[DRY RUN] Would delete: $file"
            done
        fi
        return 0
    fi

    log_info "Cleaning up backups older than $KEEP_DAYS days..."

    local deleted_count=0
    find "$BACKUP_DIR" -name "${DB_NAME}_backup_*" -type f -mtime +$KEEP_DAYS -o \
         -name "${DB_NAME}_backup_*" -type d -mtime +$KEEP_DAYS 2>/dev/null | while read -r item; do
        log_info "Deleting old backup: $(basename "$item")"
        rm -rf "$item"
        deleted_count=$((deleted_count + 1))
    done

    # Also delete corresponding .info files
    find "$BACKUP_DIR" -name "${DB_NAME}_backup_*.info" -type f -mtime +$KEEP_DAYS 2>/dev/null | while read -r info_file; do
        rm -f "$info_file"
    done

    if [ $deleted_count -eq 0 ]; then
        log_info "No old backups to clean up"
    else
        log_success "Cleaned up old backups"
    fi
}

list_backups() {
    log_info "Existing backups in $BACKUP_DIR:"
    echo ""

    if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A "$BACKUP_DIR" 2>/dev/null)" ]; then
        log_info "No backups found"
        return 0
    fi

    find "$BACKUP_DIR" -name "${DB_NAME}_backup_*" \( -type f -o -type d \) ! -name "*.info" -printf "%T@ %p\n" 2>/dev/null | \
        sort -rn | cut -d' ' -f2- | while read -r backup; do
        local name=$(basename "$backup")
        local size=""

        if [ -d "$backup" ]; then
            size=$(du -sh "$backup" 2>/dev/null | cut -f1)
            echo "  $name (directory, $size)"
        else
            size=$(du -h "$backup" 2>/dev/null | cut -f1)
            echo "  $name ($size)"
        fi

        # Show info if available
        if [ -f "$backup.info" ]; then
            local date=$(grep "Date:" "$backup.info" | cut -d: -f2- | xargs)
            echo "    Created: $date"
        fi
    done

    echo ""
}

################################################################################
# Main Function
################################################################################

main() {
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --output)
                BACKUP_DIR="$2"
                shift 2
                ;;
            --format)
                BACKUP_FORMAT="$2"
                if [[ ! "$BACKUP_FORMAT" =~ ^(custom|plain|directory)$ ]]; then
                    log_error "Invalid format: $BACKUP_FORMAT"
                    log_error "Valid formats: custom, plain, directory"
                    exit 1
                fi
                shift 2
                ;;
            --compress)
                COMPRESS_LEVEL="$2"
                if [[ ! "$COMPRESS_LEVEL" =~ ^[0-9]$ ]]; then
                    log_error "Invalid compression level: $COMPRESS_LEVEL"
                    log_error "Valid levels: 0-9"
                    exit 1
                fi
                shift 2
                ;;
            --auto)
                AUTO_MODE=true
                shift
                ;;
            --keep-days)
                KEEP_DAYS="$2"
                shift 2
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                echo ""
                show_help
                exit 1
                ;;
        esac
    done

    log_info "=========================================="
    log_info "Database Backup"
    log_info "=========================================="

    if [ "$DRY_RUN" = true ]; then
        log_warning "DRY RUN MODE - No changes will be made"
    fi

    echo ""

    # Load configuration
    load_env

    # Check if container is running
    check_container

    # List existing backups
    list_backups

    # Confirm in interactive mode
    if [ "$AUTO_MODE" = false ]; then
        echo ""
        read -p "Do you want to create a new backup? (y/N) " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Backup cancelled"
            exit 0
        fi
    fi

    # Create backup directory
    create_backup_dir

    # Get backup filename
    BACKUP_FILE=$(get_backup_filename)

    # Perform backup
    perform_backup "$BACKUP_FILE"

    # Verify backup
    verify_backup "$BACKUP_FILE"

    # Cleanup old backups
    if [ $KEEP_DAYS -gt 0 ]; then
        cleanup_old_backups
    fi

    echo ""
    log_success "=========================================="
    log_success "Backup completed successfully!"
    log_success "=========================================="
    echo ""

    log_info "Backup information:"
    log_info "  File: $BACKUP_DIR/$BACKUP_FILE"
    log_info "  Format: $BACKUP_FORMAT"
    echo ""

    log_info "To restore this backup:"
    log_info "  $SCRIPT_DIR/restore-db.sh $BACKUP_DIR/$BACKUP_FILE"
    echo ""
}

# Error handler
trap 'log_error "Backup failed at line $LINENO"' ERR

# Run main function
main "$@"
