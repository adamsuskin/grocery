#!/bin/bash

################################################################################
# Production Deployment Script for Grocery List Application
################################################################################
#
# Purpose: Deploy the Grocery List application to production environment
#
# Usage:
#   ./deploy-prod.sh [OPTIONS]
#
# Options:
#   --dry-run          Show what would be done without executing
#   --skip-build       Skip Docker image building (use existing images)
#   --skip-migrations  Skip database migrations
#   --no-healthcheck   Skip health checks after deployment
#   --help             Show this help message
#
# Requirements:
#   - Docker and Docker Compose installed
#   - .env.production file exists with all required variables
#   - Proper network access to Docker registry (if pulling images)
#
# Example:
#   ./deploy-prod.sh                    # Full deployment
#   ./deploy-prod.sh --dry-run          # Preview deployment steps
#   ./deploy-prod.sh --skip-build       # Deploy without rebuilding images
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
DRY_RUN=false
SKIP_BUILD=false
SKIP_MIGRATIONS=false
NO_HEALTHCHECK=false
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"

# Logging setup
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/deploy-$(date +%Y%m%d-%H%M%S).log"

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
# Validation Functions
################################################################################

check_dependencies() {
    log_info "Checking dependencies..."

    local missing_deps=()

    if ! command -v docker &> /dev/null; then
        missing_deps+=("docker")
    fi

    if ! command -v docker compose &> /dev/null; then
        missing_deps+=("docker-compose")
    fi

    if [ ${#missing_deps[@]} -ne 0 ]; then
        log_error "Missing required dependencies: ${missing_deps[*]}"
        log_error "Please install missing dependencies and try again"
        exit 1
    fi

    log_success "All dependencies present"
}

check_env_file() {
    log_info "Checking environment configuration..."

    if [ ! -f "$PROJECT_DIR/$ENV_FILE" ]; then
        log_error "Environment file not found: $ENV_FILE"
        log_error "Please create $ENV_FILE with required variables"
        log_error "You can use generate-secrets.sh to create secure secrets"
        exit 1
    fi

    # Source the env file for validation
    set -a
    source "$PROJECT_DIR/$ENV_FILE"
    set +a

    # Check required environment variables
    local required_vars=(
        "DB_PASSWORD"
        "JWT_ACCESS_SECRET"
        "JWT_REFRESH_SECRET"
        "ZERO_AUTH_SECRET"
        "CORS_ORIGIN"
    )

    local missing_vars=()
    for var in "${required_vars[@]}"; do
        if [ -z "${!var:-}" ]; then
            missing_vars+=("$var")
        fi
    done

    if [ ${#missing_vars[@]} -ne 0 ]; then
        log_error "Missing required environment variables: ${missing_vars[*]}"
        log_error "Please update $ENV_FILE with all required variables"
        exit 1
    fi

    log_success "Environment configuration valid"
}

check_compose_file() {
    log_info "Checking Docker Compose configuration..."

    if [ ! -f "$PROJECT_DIR/$COMPOSE_FILE" ]; then
        log_error "Docker Compose file not found: $COMPOSE_FILE"
        exit 1
    fi

    log_success "Docker Compose configuration found"
}

################################################################################
# Backup Functions
################################################################################

create_backup() {
    log_info "Creating pre-deployment backup..."

    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY RUN] Would create backup"
        return 0
    fi

    # Check if database is running
    if docker ps --format '{{.Names}}' | grep -q "grocery-postgres-prod"; then
        if [ -f "$SCRIPT_DIR/backup-db.sh" ]; then
            log_info "Running database backup..."
            bash "$SCRIPT_DIR/backup-db.sh" --auto
            log_success "Pre-deployment backup completed"
        else
            log_warning "Backup script not found, skipping backup"
        fi
    else
        log_info "Database not running, skipping backup"
    fi
}

################################################################################
# Build Functions
################################################################################

build_images() {
    if [ "$SKIP_BUILD" = true ]; then
        log_info "Skipping image build (--skip-build flag set)"
        return 0
    fi

    log_info "Building Docker images..."

    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY RUN] Would build images using $COMPOSE_FILE"
        return 0
    fi

    cd "$PROJECT_DIR"

    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build \
        --no-cache \
        --pull \
        2>&1 | tee -a "$LOG_FILE"

    if [ ${PIPESTATUS[0]} -ne 0 ]; then
        log_error "Failed to build Docker images"
        exit 1
    fi

    log_success "Docker images built successfully"
}

################################################################################
# Database Functions
################################################################################

run_migrations() {
    if [ "$SKIP_MIGRATIONS" = true ]; then
        log_info "Skipping database migrations (--skip-migrations flag set)"
        return 0
    fi

    log_info "Running database migrations..."

    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY RUN] Would run database migrations"
        return 0
    fi

    # Start only the database service if not running
    docker compose -f "$PROJECT_DIR/$COMPOSE_FILE" --env-file "$PROJECT_DIR/$ENV_FILE" up -d postgres

    # Wait for database to be ready
    log_info "Waiting for database to be ready..."
    local max_attempts=30
    local attempt=0

    while [ $attempt -lt $max_attempts ]; do
        if docker compose -f "$PROJECT_DIR/$COMPOSE_FILE" --env-file "$PROJECT_DIR/$ENV_FILE" exec -T postgres pg_isready -U "${DB_USER:-grocery}" &> /dev/null; then
            log_success "Database is ready"
            break
        fi
        attempt=$((attempt + 1))
        echo -n "."
        sleep 2
    done

    if [ $attempt -eq $max_attempts ]; then
        log_error "Database failed to become ready within timeout"
        exit 1
    fi

    # Check if schema file exists
    if [ -f "$PROJECT_DIR/server/db/schema.sql" ]; then
        log_info "Applying database schema..."
        docker compose -f "$PROJECT_DIR/$COMPOSE_FILE" --env-file "$PROJECT_DIR/$ENV_FILE" exec -T postgres \
            psql -U "${DB_USER:-grocery}" -d "${DB_NAME:-grocery_db}" -f /docker-entrypoint-initdb.d/01-schema.sql \
            2>&1 | tee -a "$LOG_FILE" || log_warning "Schema may already be applied"
    fi

    log_success "Database migrations completed"
}

################################################################################
# Deployment Functions
################################################################################

deploy_services() {
    log_info "Deploying services..."

    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY RUN] Would deploy services using $COMPOSE_FILE"
        return 0
    fi

    cd "$PROJECT_DIR"

    # Deploy all services
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d \
        2>&1 | tee -a "$LOG_FILE"

    if [ ${PIPESTATUS[0]} -ne 0 ]; then
        log_error "Failed to deploy services"
        exit 1
    fi

    log_success "Services deployed successfully"
}

################################################################################
# Health Check Functions
################################################################################

check_health() {
    if [ "$NO_HEALTHCHECK" = true ]; then
        log_info "Skipping health checks (--no-healthcheck flag set)"
        return 0
    fi

    log_info "Performing health checks..."

    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY RUN] Would perform health checks"
        return 0
    fi

    if [ -f "$SCRIPT_DIR/health-check.sh" ]; then
        sleep 10  # Give services time to start
        bash "$SCRIPT_DIR/health-check.sh"
    else
        log_warning "Health check script not found, performing basic check..."

        # Basic container status check
        log_info "Checking container status..."
        docker compose -f "$PROJECT_DIR/$COMPOSE_FILE" --env-file "$PROJECT_DIR/$ENV_FILE" ps

        # Check if all services are running
        local running_count=$(docker compose -f "$PROJECT_DIR/$COMPOSE_FILE" --env-file "$PROJECT_DIR/$ENV_FILE" ps --status running | wc -l)
        local total_count=$(docker compose -f "$PROJECT_DIR/$COMPOSE_FILE" --env-file "$PROJECT_DIR/$ENV_FILE" ps | wc -l)

        if [ "$running_count" -eq "$total_count" ]; then
            log_success "All services are running"
        else
            log_warning "Some services may not be running properly"
        fi
    fi
}

################################################################################
# Status Functions
################################################################################

show_status() {
    log_info "Deployment Status:"
    echo ""

    cd "$PROJECT_DIR"
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps

    echo ""
    log_info "Service URLs:"
    echo "  Frontend:    http://localhost:3000"
    echo "  Auth Server: http://localhost:3001"
    echo "  Zero Cache:  http://localhost:4848"
    echo "  Database:    localhost:5432"
    echo ""

    log_info "Log files:"
    echo "  Deployment: $LOG_FILE"
    echo "  Application logs: Use 'docker compose -f $COMPOSE_FILE logs -f [service]'"
    echo ""

    log_info "Next steps:"
    echo "  1. Monitor logs: docker compose -f $COMPOSE_FILE --env-file $ENV_FILE logs -f"
    echo "  2. Check health: $SCRIPT_DIR/health-check.sh"
    echo "  3. View status: docker compose -f $COMPOSE_FILE --env-file $ENV_FILE ps"
    echo "  4. Stop services: docker compose -f $COMPOSE_FILE --env-file $ENV_FILE down"
    echo ""
}

################################################################################
# Main Function
################################################################################

main() {
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --skip-build)
                SKIP_BUILD=true
                shift
                ;;
            --skip-migrations)
                SKIP_MIGRATIONS=true
                shift
                ;;
            --no-healthcheck)
                NO_HEALTHCHECK=true
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
    log_info "Grocery List - Production Deployment"
    log_info "=========================================="
    log_info "Started at: $(date)"
    log_info "Log file: $LOG_FILE"

    if [ "$DRY_RUN" = true ]; then
        log_warning "DRY RUN MODE - No changes will be made"
    fi

    echo ""

    # Pre-deployment checks
    check_dependencies
    check_env_file
    check_compose_file

    # Create backup before deployment
    create_backup

    # Build and deploy
    build_images
    run_migrations
    deploy_services

    # Post-deployment validation
    check_health

    echo ""
    log_success "=========================================="
    log_success "Deployment completed successfully!"
    log_success "=========================================="
    echo ""

    # Show status and next steps
    show_status
}

# Error handler
trap 'log_error "Deployment failed at line $LINENO. Check $LOG_FILE for details"' ERR

# Run main function
main "$@"
