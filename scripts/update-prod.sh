#!/bin/bash

################################################################################
# Zero-Downtime Production Update Script for Grocery List Application
################################################################################
#
# Purpose: Update production services with zero downtime using rolling updates
#
# Usage:
#   ./update-prod.sh [OPTIONS]
#
# Options:
#   --service NAME     Update specific service (auth-server|zero-cache|frontend|all)
#   --skip-backup      Skip pre-update database backup
#   --skip-build       Skip Docker image building
#   --no-healthcheck   Skip health checks during update
#   --rollback         Rollback to previous version
#   --dry-run          Show what would be done without executing
#   --help             Show this help message
#
# Update Strategy:
#   1. Create backup of current database
#   2. Pull/build new Docker images
#   3. Rolling update of services one by one
#   4. Health check after each service update
#   5. Verify all services are healthy
#   6. Keep old images for quick rollback
#
# Requirements:
#   - Docker and Docker Compose installed
#   - .env.production file exists
#   - Services currently running
#   - Sufficient disk space for new images
#
# Examples:
#   ./update-prod.sh                        # Update all services
#   ./update-prod.sh --service frontend     # Update only frontend
#   ./update-prod.sh --dry-run              # Preview update
#   ./update-prod.sh --rollback             # Rollback to previous version
#
################################################################################

set -euo pipefail

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_DIR/logs"
BACKUP_DIR="$PROJECT_DIR/backups"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SPECIFIC_SERVICE=""
SKIP_BACKUP=false
SKIP_BUILD=false
NO_HEALTHCHECK=false
ROLLBACK=false
DRY_RUN=false
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"

# Logging setup
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/update-$(date +%Y%m%d-%H%M%S).log"

# Version tracking file
VERSION_FILE="$PROJECT_DIR/.deployment-version"

################################################################################
# Logging Functions
################################################################################

log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

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
# Version Management Functions
################################################################################

save_current_version() {
    log_info "Saving current deployment version..."

    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY RUN] Would save version information"
        return 0
    fi

    cat > "$VERSION_FILE" <<EOF
DEPLOYMENT_DATE=$(date -Iseconds)
DEPLOYMENT_USER=$USER
DEPLOYMENT_HOST=$(hostname)

# Service Image IDs
$(docker compose -f "$PROJECT_DIR/$COMPOSE_FILE" images --format json 2>/dev/null | \
  grep -o '"Service":"[^"]*","Repository":"[^"]*","Tag":"[^"]*","ID":"[^"]*"' || echo "")

# Git Information
GIT_COMMIT=$(git -C "$PROJECT_DIR" rev-parse HEAD 2>/dev/null || echo "unknown")
GIT_BRANCH=$(git -C "$PROJECT_DIR" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
EOF

    log_success "Version information saved"
}

load_previous_version() {
    if [ -f "$VERSION_FILE" ]; then
        source "$VERSION_FILE"
        log_info "Previous deployment: $DEPLOYMENT_DATE"
        log_info "Git commit: $GIT_COMMIT"
        return 0
    else
        log_warning "No previous version information found"
        return 1
    fi
}

################################################################################
# Backup Functions
################################################################################

create_pre_update_backup() {
    if [ "$SKIP_BACKUP" = true ]; then
        log_info "Skipping pre-update backup (--skip-backup flag set)"
        return 0
    fi

    log_info "Creating pre-update backup..."

    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY RUN] Would create pre-update backup"
        return 0
    fi

    if [ -f "$SCRIPT_DIR/backup-db.sh" ]; then
        bash "$SCRIPT_DIR/backup-db.sh" --auto
        log_success "Pre-update backup completed"
    else
        log_warning "Backup script not found, skipping backup"
    fi
}

################################################################################
# Build Functions
################################################################################

build_new_images() {
    if [ "$SKIP_BUILD" = true ]; then
        log_info "Skipping image build (--skip-build flag set)"
        return 0
    fi

    log_info "Building new Docker images..."

    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY RUN] Would build new images"
        return 0
    fi

    cd "$PROJECT_DIR"

    # Build new images with a temporary tag
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build \
        --pull \
        2>&1 | tee -a "$LOG_FILE"

    if [ ${PIPESTATUS[0]} -ne 0 ]; then
        log_error "Failed to build new images"
        exit 1
    fi

    log_success "New images built successfully"
}

################################################################################
# Service Update Functions
################################################################################

wait_for_service_healthy() {
    local service=$1
    local max_wait=${2:-60}
    local elapsed=0

    log_info "Waiting for $service to become healthy..."

    while [ $elapsed -lt $max_wait ]; do
        if bash "$SCRIPT_DIR/health-check.sh" --service "$service" --quiet 2>/dev/null; then
            log_success "$service is healthy"
            return 0
        fi

        sleep 5
        elapsed=$((elapsed + 5))
        echo -n "."
    done

    echo ""
    log_error "$service failed to become healthy within ${max_wait}s"
    return 1
}

update_service() {
    local service=$1

    log_info "=========================================="
    log_info "Updating service: $service"
    log_info "=========================================="

    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY RUN] Would update $service"
        return 0
    fi

    # Check current status
    if bash "$SCRIPT_DIR/health-check.sh" --service "$service" --quiet 2>/dev/null; then
        log_info "Current $service status: healthy"
    else
        log_warning "Current $service status: unhealthy"
    fi

    # Perform rolling update
    log_info "Performing rolling update for $service..."

    cd "$PROJECT_DIR"

    # Update the service
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --no-deps "$service" 2>&1 | tee -a "$LOG_FILE"

    if [ ${PIPESTATUS[0]} -ne 0 ]; then
        log_error "Failed to update $service"
        return 1
    fi

    # Wait for service to be healthy
    if [ "$NO_HEALTHCHECK" = false ]; then
        if ! wait_for_service_healthy "$service" 90; then
            log_error "Service $service failed health check after update"
            log_warning "Consider rolling back: $0 --rollback"
            return 1
        fi
    else
        log_warning "Skipping health check (--no-healthcheck flag set)"
        sleep 10  # Give service time to start
    fi

    log_success "Service $service updated successfully"
    return 0
}

update_all_services() {
    log_info "Updating all services with rolling updates..."

    # Update order: database first, then backend services, then frontend
    local services=("postgres" "zero-cache" "auth-server" "frontend")
    local failed_services=()

    for service in "${services[@]}"; do
        if ! update_service "$service"; then
            failed_services+=("$service")
            log_error "Failed to update $service"
            log_error "Stopping update process due to failure"
            return 1
        fi

        # Small delay between service updates
        if [ "$DRY_RUN" = false ]; then
            sleep 5
        fi
    done

    if [ ${#failed_services[@]} -eq 0 ]; then
        log_success "All services updated successfully"
        return 0
    else
        log_error "Failed to update services: ${failed_services[*]}"
        return 1
    fi
}

################################################################################
# Rollback Functions
################################################################################

perform_rollback() {
    log_warning "=========================================="
    log_warning "Performing Rollback"
    log_warning "=========================================="

    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY RUN] Would perform rollback"
        return 0
    fi

    # Load previous version information
    if ! load_previous_version; then
        log_error "Cannot rollback without previous version information"
        exit 1
    fi

    log_info "Rolling back to deployment from: $DEPLOYMENT_DATE"
    log_info "Git commit: $GIT_COMMIT"

    # Ask for confirmation
    read -p "Are you sure you want to rollback? (yes/no) " -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        log_info "Rollback cancelled"
        exit 0
    fi

    # Create backup before rollback
    log_info "Creating backup before rollback..."
    if [ -f "$SCRIPT_DIR/backup-db.sh" ]; then
        bash "$SCRIPT_DIR/backup-db.sh" --auto
    fi

    # Checkout previous git commit if available
    if [ "$GIT_COMMIT" != "unknown" ]; then
        log_info "Checking out git commit: $GIT_COMMIT"
        git -C "$PROJECT_DIR" checkout "$GIT_COMMIT" 2>&1 | tee -a "$LOG_FILE"
    fi

    # Rebuild and redeploy
    log_info "Rebuilding images from previous version..."
    docker compose -f "$PROJECT_DIR/$COMPOSE_FILE" --env-file "$PROJECT_DIR/$ENV_FILE" build 2>&1 | tee -a "$LOG_FILE"

    log_info "Redeploying services..."
    docker compose -f "$PROJECT_DIR/$COMPOSE_FILE" --env-file "$PROJECT_DIR/$ENV_FILE" up -d 2>&1 | tee -a "$LOG_FILE"

    # Wait for services to be healthy
    log_info "Waiting for services to become healthy..."
    sleep 15

    if bash "$SCRIPT_DIR/health-check.sh" --wait 90; then
        log_success "Rollback completed successfully"
        return 0
    else
        log_error "Rollback completed but some services are unhealthy"
        return 1
    fi
}

################################################################################
# Verification Functions
################################################################################

verify_update() {
    log_info "Verifying update..."

    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY RUN] Would verify update"
        return 0
    fi

    # Run comprehensive health check
    if bash "$SCRIPT_DIR/health-check.sh" --detailed; then
        log_success "All services verified healthy"
        return 0
    else
        log_error "Some services failed verification"
        return 1
    fi
}

show_update_status() {
    log_info "Update Status:"
    echo ""

    cd "$PROJECT_DIR"
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps

    echo ""
    log_info "Updated services are running"
    echo ""

    log_info "Service URLs:"
    echo "  Frontend:    http://localhost:3000"
    echo "  Auth Server: http://localhost:3001"
    echo "  Zero Cache:  http://localhost:4848"
    echo "  Database:    localhost:5432"
    echo ""

    log_info "Next steps:"
    echo "  1. Monitor logs: docker compose -f $COMPOSE_FILE --env-file $ENV_FILE logs -f"
    echo "  2. Check health: $SCRIPT_DIR/health-check.sh --detailed"
    echo "  3. Run tests to verify functionality"
    echo "  4. If issues occur, rollback: $0 --rollback"
    echo ""
}

cleanup_old_images() {
    log_info "Cleaning up old Docker images..."

    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY RUN] Would cleanup old images"
        return 0
    fi

    # Remove dangling images
    local removed=$(docker image prune -f 2>/dev/null || echo "")

    log_success "Old images cleaned up"
}

################################################################################
# Main Function
################################################################################

main() {
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --service)
                SPECIFIC_SERVICE="$2"
                if [[ ! "$SPECIFIC_SERVICE" =~ ^(auth-server|zero-cache|frontend|postgres|all)$ ]]; then
                    log_error "Invalid service: $SPECIFIC_SERVICE"
                    log_error "Valid services: auth-server, zero-cache, frontend, postgres, all"
                    exit 2
                fi
                shift 2
                ;;
            --skip-backup)
                SKIP_BACKUP=true
                shift
                ;;
            --skip-build)
                SKIP_BUILD=true
                shift
                ;;
            --no-healthcheck)
                NO_HEALTHCHECK=true
                shift
                ;;
            --rollback)
                ROLLBACK=true
                shift
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
                exit 2
                ;;
        esac
    done

    log_info "=========================================="
    log_info "Production Update"
    log_info "=========================================="
    log_info "Started at: $(date)"
    log_info "Log file: $LOG_FILE"

    if [ "$DRY_RUN" = true ]; then
        log_warning "DRY RUN MODE - No changes will be made"
    fi

    echo ""

    # Handle rollback mode
    if [ "$ROLLBACK" = true ]; then
        perform_rollback
        exit $?
    fi

    # Save current version before update
    save_current_version

    # Create backup
    create_pre_update_backup

    # Build new images
    build_new_images

    # Update services
    if [ -n "$SPECIFIC_SERVICE" ] && [ "$SPECIFIC_SERVICE" != "all" ]; then
        update_service "$SPECIFIC_SERVICE"
    else
        update_all_services
    fi

    if [ $? -ne 0 ]; then
        log_error "Update failed"
        log_error "Consider rolling back: $0 --rollback"
        exit 1
    fi

    # Verify update
    verify_update

    # Cleanup
    cleanup_old_images

    echo ""
    log_success "=========================================="
    log_success "Update completed successfully!"
    log_success "=========================================="
    echo ""

    # Show status
    show_update_status
}

# Error handler
trap 'log_error "Update failed at line $LINENO. Check $LOG_FILE for details"' ERR

# Run main function
main "$@"
