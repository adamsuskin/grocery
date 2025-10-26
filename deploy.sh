#!/bin/bash

# Grocery App Deployment Helper Script
# This script provides common deployment operations

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILES="-f docker-compose.prod.yml"
WITH_SSL=""

# Functions
print_usage() {
    echo "Usage: $0 [command] [options]"
    echo ""
    echo "Commands:"
    echo "  start           Start all services"
    echo "  stop            Stop all services"
    echo "  restart         Restart all services"
    echo "  logs            View logs (use -f to follow)"
    echo "  status          Show service status"
    echo "  build           Build/rebuild images"
    echo "  update          Pull latest code and rebuild"
    echo "  backup-db       Backup PostgreSQL database"
    echo "  restore-db      Restore PostgreSQL database"
    echo "  ssl-cert        Obtain SSL certificate"
    echo "  ssl-renew       Renew SSL certificate"
    echo "  health          Check health of all services"
    echo "  clean           Remove stopped containers and volumes"
    echo ""
    echo "Options:"
    echo "  --ssl           Use SSL configuration"
    echo "  -f, --follow    Follow logs (for logs command)"
    echo "  --help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start --ssl                 # Start with SSL"
    echo "  $0 logs -f                     # Follow all logs"
    echo "  $0 backup-db                   # Backup database"
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
    echo -e "${NC}ℹ $1${NC}"
}

check_env_file() {
    if [ ! -f .env.prod ]; then
        print_warning ".env.prod file not found. Using .env if available."
        if [ -f .env ]; then
            cp .env .env.prod
            print_success "Copied .env to .env.prod"
        fi
    fi
}

get_compose_command() {
    echo "docker-compose $COMPOSE_FILES $WITH_SSL"
}

# Command handlers
cmd_start() {
    print_info "Starting services..."
    check_env_file
    $(get_compose_command) up -d
    print_success "Services started"
    cmd_status
}

cmd_stop() {
    print_info "Stopping services..."
    $(get_compose_command) down
    print_success "Services stopped"
}

cmd_restart() {
    print_info "Restarting services..."
    $(get_compose_command) restart
    print_success "Services restarted"
}

cmd_logs() {
    if [ "$FOLLOW_LOGS" = "true" ]; then
        $(get_compose_command) logs -f
    else
        $(get_compose_command) logs --tail=100
    fi
}

cmd_status() {
    print_info "Service status:"
    $(get_compose_command) ps
}

cmd_build() {
    print_info "Building images..."
    $(get_compose_command) build --pull
    print_success "Images built"
}

cmd_update() {
    print_info "Pulling latest code..."
    git pull

    print_info "Rebuilding images..."
    $(get_compose_command) build --pull

    print_info "Restarting services..."
    $(get_compose_command) up -d --force-recreate

    print_success "Update complete"
    cmd_status
}

cmd_backup_db() {
    BACKUP_DIR="./backups"
    BACKUP_FILE="$BACKUP_DIR/db_backup_$(date +%Y%m%d_%H%M%S).sql"

    mkdir -p "$BACKUP_DIR"

    print_info "Backing up database to $BACKUP_FILE..."

    docker-compose $COMPOSE_FILES exec -T postgres pg_dump -U grocery grocery_db > "$BACKUP_FILE"

    if [ -f "$BACKUP_FILE" ]; then
        gzip "$BACKUP_FILE"
        print_success "Database backed up to ${BACKUP_FILE}.gz"
    else
        print_error "Backup failed"
        exit 1
    fi
}

cmd_restore_db() {
    BACKUP_DIR="./backups"

    print_info "Available backups:"
    ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null || {
        print_error "No backups found in $BACKUP_DIR"
        exit 1
    }

    read -p "Enter backup filename: " BACKUP_FILE

    if [ ! -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
        print_error "Backup file not found"
        exit 1
    fi

    print_warning "This will overwrite the current database!"
    read -p "Are you sure? (yes/no): " CONFIRM

    if [ "$CONFIRM" != "yes" ]; then
        print_info "Restore cancelled"
        exit 0
    fi

    print_info "Restoring database from $BACKUP_FILE..."

    gunzip -c "$BACKUP_DIR/$BACKUP_FILE" | docker-compose $COMPOSE_FILES exec -T postgres psql -U grocery grocery_db

    print_success "Database restored"
}

cmd_ssl_cert() {
    if [ -z "$WITH_SSL" ]; then
        print_error "SSL configuration not enabled. Use --ssl option"
        exit 1
    fi

    check_env_file
    source .env.prod

    if [ -z "$DOMAIN" ] || [ -z "$CERTBOT_EMAIL" ]; then
        print_error "DOMAIN and CERTBOT_EMAIL must be set in .env.prod"
        exit 1
    fi

    print_info "Obtaining SSL certificate for $DOMAIN..."

    $(get_compose_command) run --rm certbot \
        certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        --email "$CERTBOT_EMAIL" \
        --agree-tos \
        --no-eff-email \
        -d "$DOMAIN"

    print_success "Certificate obtained. Restarting nginx..."
    $(get_compose_command) restart nginx
    print_success "Done"
}

cmd_ssl_renew() {
    if [ -z "$WITH_SSL" ]; then
        print_error "SSL configuration not enabled. Use --ssl option"
        exit 1
    fi

    print_info "Renewing SSL certificates..."
    $(get_compose_command) exec certbot certbot renew

    print_info "Reloading nginx..."
    $(get_compose_command) exec nginx nginx -s reload

    print_success "Certificate renewal complete"
}

cmd_health() {
    print_info "Checking service health..."

    SERVICES=$($(get_compose_command) ps --services)

    for SERVICE in $SERVICES; do
        HEALTH=$(docker inspect --format='{{.State.Health.Status}}' "grocery-${SERVICE}-prod" 2>/dev/null || echo "no-healthcheck")

        if [ "$HEALTH" = "healthy" ]; then
            print_success "$SERVICE: healthy"
        elif [ "$HEALTH" = "no-healthcheck" ]; then
            print_info "$SERVICE: no healthcheck configured"
        else
            print_error "$SERVICE: $HEALTH"
        fi
    done
}

cmd_clean() {
    print_warning "This will remove stopped containers and unused volumes"
    read -p "Are you sure? (yes/no): " CONFIRM

    if [ "$CONFIRM" != "yes" ]; then
        print_info "Clean cancelled"
        exit 0
    fi

    print_info "Cleaning up..."
    docker system prune -f
    print_success "Cleanup complete"
}

# Parse arguments
COMMAND=""
FOLLOW_LOGS=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --ssl)
            WITH_SSL="-f docker-compose.ssl.yml"
            shift
            ;;
        -f|--follow)
            FOLLOW_LOGS=true
            shift
            ;;
        --help)
            print_usage
            exit 0
            ;;
        *)
            if [ -z "$COMMAND" ]; then
                COMMAND=$1
            fi
            shift
            ;;
    esac
done

# Execute command
case $COMMAND in
    start)
        cmd_start
        ;;
    stop)
        cmd_stop
        ;;
    restart)
        cmd_restart
        ;;
    logs)
        cmd_logs
        ;;
    status)
        cmd_status
        ;;
    build)
        cmd_build
        ;;
    update)
        cmd_update
        ;;
    backup-db)
        cmd_backup_db
        ;;
    restore-db)
        cmd_restore_db
        ;;
    ssl-cert)
        cmd_ssl_cert
        ;;
    ssl-renew)
        cmd_ssl_renew
        ;;
    health)
        cmd_health
        ;;
    clean)
        cmd_clean
        ;;
    *)
        print_error "Unknown command: $COMMAND"
        echo ""
        print_usage
        exit 1
        ;;
esac
