#!/bin/bash

################################################################################
# Health Check Script for Grocery List Application
################################################################################
#
# Purpose: Check health status of all services in the production environment
#
# Usage:
#   ./health-check.sh [OPTIONS]
#
# Options:
#   --service NAME     Check only specific service (postgres|auth-server|zero-cache|frontend)
#   --detailed         Show detailed health information
#   --json             Output results in JSON format
#   --wait SECONDS     Wait for services to become healthy (default: 0, max: 300)
#   --quiet            Suppress output, only return exit code
#   --continuous       Run continuous monitoring (Ctrl+C to stop)
#   --interval SECONDS Interval for continuous mode (default: 30)
#   --help             Show this help message
#
# Exit Codes:
#   0 - All services healthy
#   1 - One or more services unhealthy
#   2 - Script error or invalid arguments
#
# Requirements:
#   - Docker and Docker Compose installed
#   - Services running via docker-compose.prod.yml
#   - curl installed for HTTP health checks
#
# Examples:
#   ./health-check.sh                          # Check all services
#   ./health-check.sh --detailed               # Detailed health report
#   ./health-check.sh --service postgres       # Check only PostgreSQL
#   ./health-check.sh --wait 60                # Wait up to 60s for health
#   ./health-check.sh --continuous             # Monitor continuously
#   ./health-check.sh --json                   # JSON output
#
################################################################################

set -euo pipefail

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"
SPECIFIC_SERVICE=""
DETAILED=false
JSON_OUTPUT=false
WAIT_SECONDS=0
QUIET=false
CONTINUOUS=false
INTERVAL=30

# Service health status
declare -A SERVICE_STATUS
declare -A SERVICE_DETAILS

################################################################################
# Logging Functions
################################################################################

log_info() {
    if [ "$QUIET" = false ] && [ "$JSON_OUTPUT" = false ]; then
        echo -e "${BLUE}[INFO]${NC} $*"
    fi
}

log_success() {
    if [ "$QUIET" = false ] && [ "$JSON_OUTPUT" = false ]; then
        echo -e "${GREEN}[SUCCESS]${NC} $*"
    fi
}

log_warning() {
    if [ "$QUIET" = false ] && [ "$JSON_OUTPUT" = false ]; then
        echo -e "${YELLOW}[WARNING]${NC} $*"
    fi
}

log_error() {
    if [ "$QUIET" = false ] && [ "$JSON_OUTPUT" = false ]; then
        echo -e "${RED}[ERROR]${NC} $*"
    fi
}

################################################################################
# Help Function
################################################################################

show_help() {
    sed -n '/^# Purpose:/,/^################################################################################$/p' "$0" | \
        sed 's/^# //g' | sed 's/^#//g' | head -n -1
}

################################################################################
# Utility Functions
################################################################################

check_dependencies() {
    local missing_deps=()

    if ! command -v docker &> /dev/null; then
        missing_deps+=("docker")
    fi

    if ! command -v curl &> /dev/null; then
        missing_deps+=("curl")
    fi

    if [ ${#missing_deps[@]} -ne 0 ]; then
        log_error "Missing required dependencies: ${missing_deps[*]}"
        exit 2
    fi
}

get_container_name() {
    local service=$1
    case $service in
        postgres)
            echo "grocery-postgres-prod"
            ;;
        auth-server)
            echo "grocery-auth-server-prod"
            ;;
        zero-cache)
            echo "grocery-zero-cache-prod"
            ;;
        frontend)
            echo "grocery-frontend-prod"
            ;;
        *)
            echo ""
            ;;
    esac
}

################################################################################
# Health Check Functions
################################################################################

check_container_running() {
    local container=$1
    if docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
        return 0
    else
        return 1
    fi
}

check_postgres_health() {
    local container=$(get_container_name "postgres")
    local status="unhealthy"
    local details=""

    if ! check_container_running "$container"; then
        SERVICE_STATUS["postgres"]="not_running"
        SERVICE_DETAILS["postgres"]="Container not running"
        return 1
    fi

    # Check if PostgreSQL is accepting connections
    if docker exec "$container" pg_isready -U grocery -d grocery_db &>/dev/null; then
        status="healthy"

        if [ "$DETAILED" = true ]; then
            # Get database size
            local db_size=$(docker exec "$container" psql -U grocery -d grocery_db -t -c \
                "SELECT pg_size_pretty(pg_database_size('grocery_db'));" 2>/dev/null | xargs || echo "Unknown")

            # Get connection count
            local conn_count=$(docker exec "$container" psql -U grocery -d grocery_db -t -c \
                "SELECT count(*) FROM pg_stat_activity;" 2>/dev/null | xargs || echo "Unknown")

            # Get uptime
            local uptime=$(docker exec "$container" psql -U grocery -d grocery_db -t -c \
                "SELECT date_trunc('second', now() - pg_postmaster_start_time());" 2>/dev/null | xargs || echo "Unknown")

            details="Size: $db_size, Connections: $conn_count, Uptime: $uptime"
        fi
    else
        details="PostgreSQL not accepting connections"
    fi

    SERVICE_STATUS["postgres"]="$status"
    SERVICE_DETAILS["postgres"]="$details"

    [ "$status" = "healthy" ] && return 0 || return 1
}

check_auth_server_health() {
    local container=$(get_container_name "auth-server")
    local status="unhealthy"
    local details=""

    if ! check_container_running "$container"; then
        SERVICE_STATUS["auth-server"]="not_running"
        SERVICE_DETAILS["auth-server"]="Container not running"
        return 1
    fi

    # Check HTTP health endpoint
    local response=$(curl -sf http://localhost:3001/health 2>/dev/null || echo "")

    if [ -n "$response" ]; then
        status="healthy"

        if [ "$DETAILED" = true ]; then
            # Extract details from response if JSON
            local db_status=$(echo "$response" | grep -o '"database":"[^"]*"' | cut -d'"' -f4 || echo "unknown")
            details="Database: $db_status"
        fi
    else
        details="Health endpoint not responding"
    fi

    SERVICE_STATUS["auth-server"]="$status"
    SERVICE_DETAILS["auth-server"]="$details"

    [ "$status" = "healthy" ] && return 0 || return 1
}

check_zero_cache_health() {
    local container=$(get_container_name "zero-cache")
    local status="unhealthy"
    local details=""

    if ! check_container_running "$container"; then
        SERVICE_STATUS["zero-cache"]="not_running"
        SERVICE_DETAILS["zero-cache"]="Container not running"
        return 1
    fi

    # Check HTTP health endpoint
    if curl -sf http://localhost:4848/health &>/dev/null; then
        status="healthy"

        if [ "$DETAILED" = true ]; then
            # Get replica file size if available
            local replica_size=$(docker exec "$container" du -h /data/zero-replica.db 2>/dev/null | cut -f1 || echo "Unknown")
            details="Replica size: $replica_size"
        fi
    else
        details="Health endpoint not responding"
    fi

    SERVICE_STATUS["zero-cache"]="$status"
    SERVICE_DETAILS["zero-cache"]="$details"

    [ "$status" = "healthy" ] && return 0 || return 1
}

check_frontend_health() {
    local container=$(get_container_name "frontend")
    local status="unhealthy"
    local details=""

    if ! check_container_running "$container"; then
        SERVICE_STATUS["frontend"]="not_running"
        SERVICE_DETAILS["frontend"]="Container not running"
        return 1
    fi

    # Check HTTP endpoint
    if curl -sf http://localhost:3000/health &>/dev/null || curl -sf http://localhost:3000/ &>/dev/null; then
        status="healthy"

        if [ "$DETAILED" = true ]; then
            # Get nginx status if available
            details="Serving requests"
        fi
    else
        details="HTTP endpoint not responding"
    fi

    SERVICE_STATUS["frontend"]="$status"
    SERVICE_DETAILS["frontend"]="$details"

    [ "$status" = "healthy" ] && return 0 || return 1
}

check_service_health() {
    local service=$1

    case $service in
        postgres)
            check_postgres_health
            ;;
        auth-server)
            check_auth_server_health
            ;;
        zero-cache)
            check_zero_cache_health
            ;;
        frontend)
            check_frontend_health
            ;;
        *)
            log_error "Unknown service: $service"
            return 1
            ;;
    esac
}

check_all_services() {
    local services=("postgres" "auth-server" "zero-cache" "frontend")

    if [ -n "$SPECIFIC_SERVICE" ]; then
        services=("$SPECIFIC_SERVICE")
    fi

    local all_healthy=true

    for service in "${services[@]}"; do
        check_service_health "$service" || all_healthy=false
    done

    [ "$all_healthy" = true ] && return 0 || return 1
}

################################################################################
# Output Functions
################################################################################

print_status_icon() {
    local status=$1

    case $status in
        healthy)
            echo -e "${GREEN}✓${NC}"
            ;;
        unhealthy)
            echo -e "${RED}✗${NC}"
            ;;
        not_running)
            echo -e "${YELLOW}○${NC}"
            ;;
        *)
            echo -e "${YELLOW}?${NC}"
            ;;
    esac
}

print_results() {
    if [ "$JSON_OUTPUT" = true ]; then
        print_json_results
        return
    fi

    echo ""
    log_info "=========================================="
    log_info "Service Health Check Results"
    log_info "=========================================="
    echo ""

    printf "%-20s %-15s %s\n" "SERVICE" "STATUS" "DETAILS"
    printf "%-20s %-15s %s\n" "-------" "------" "-------"

    local services=("postgres" "auth-server" "zero-cache" "frontend")

    if [ -n "$SPECIFIC_SERVICE" ]; then
        services=("$SPECIFIC_SERVICE")
    fi

    for service in "${services[@]}"; do
        local status="${SERVICE_STATUS[$service]:-unknown}"
        local details="${SERVICE_DETAILS[$service]:-}"
        local icon=$(print_status_icon "$status")

        printf "%-20s %s %-13s %s\n" "$service" "$icon" "$status" "$details"
    done

    echo ""

    # Overall status
    local all_healthy=true
    for service in "${services[@]}"; do
        if [ "${SERVICE_STATUS[$service]}" != "healthy" ]; then
            all_healthy=false
            break
        fi
    done

    if [ "$all_healthy" = true ]; then
        log_success "All services are healthy"
        echo ""
        return 0
    else
        log_error "Some services are not healthy"
        echo ""
        return 1
    fi
}

print_json_results() {
    local services=("postgres" "auth-server" "zero-cache" "frontend")

    if [ -n "$SPECIFIC_SERVICE" ]; then
        services=("$SPECIFIC_SERVICE")
    fi

    echo "{"
    echo "  \"timestamp\": \"$(date -Iseconds)\","
    echo "  \"services\": {"

    local first=true
    for service in "${services[@]}"; do
        if [ "$first" = false ]; then
            echo ","
        fi
        first=false

        local status="${SERVICE_STATUS[$service]:-unknown}"
        local details="${SERVICE_DETAILS[$service]:-}"

        echo -n "    \"$service\": {"
        echo -n "\"status\": \"$status\""
        if [ -n "$details" ]; then
            echo -n ", \"details\": \"$details\""
        fi
        echo -n "}"
    done

    echo ""
    echo "  }"
    echo "}"
}

################################################################################
# Wait and Continuous Functions
################################################################################

wait_for_healthy() {
    local elapsed=0
    local check_interval=5

    log_info "Waiting for services to become healthy (timeout: ${WAIT_SECONDS}s)..."

    while [ $elapsed -lt $WAIT_SECONDS ]; do
        if check_all_services; then
            log_success "All services are healthy after ${elapsed}s"
            return 0
        fi

        sleep $check_interval
        elapsed=$((elapsed + check_interval))

        if [ "$QUIET" = false ]; then
            echo -n "."
        fi
    done

    if [ "$QUIET" = false ]; then
        echo ""
    fi

    log_error "Timeout waiting for services to become healthy"
    return 1
}

continuous_monitoring() {
    log_info "Starting continuous monitoring (interval: ${INTERVAL}s)"
    log_info "Press Ctrl+C to stop"
    echo ""

    local iteration=0

    while true; do
        iteration=$((iteration + 1))

        if [ "$QUIET" = false ]; then
            echo "=========================================="
            echo "Check #$iteration at $(date)"
            echo "=========================================="
        fi

        check_all_services
        print_results

        sleep $INTERVAL
    done
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
                shift 2
                ;;
            --detailed)
                DETAILED=true
                shift
                ;;
            --json)
                JSON_OUTPUT=true
                shift
                ;;
            --wait)
                WAIT_SECONDS="$2"
                if [ $WAIT_SECONDS -gt 300 ]; then
                    log_error "Wait timeout cannot exceed 300 seconds"
                    exit 2
                fi
                shift 2
                ;;
            --quiet)
                QUIET=true
                shift
                ;;
            --continuous)
                CONTINUOUS=true
                shift
                ;;
            --interval)
                INTERVAL="$2"
                shift 2
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

    # Check dependencies
    check_dependencies

    # Validate specific service if provided
    if [ -n "$SPECIFIC_SERVICE" ]; then
        if ! [[ "$SPECIFIC_SERVICE" =~ ^(postgres|auth-server|zero-cache|frontend)$ ]]; then
            log_error "Invalid service: $SPECIFIC_SERVICE"
            log_error "Valid services: postgres, auth-server, zero-cache, frontend"
            exit 2
        fi
    fi

    # Handle continuous monitoring mode
    if [ "$CONTINUOUS" = true ]; then
        continuous_monitoring
        exit 0
    fi

    # Handle wait mode
    if [ $WAIT_SECONDS -gt 0 ]; then
        if wait_for_healthy; then
            check_all_services
            print_results
            exit 0
        else
            check_all_services
            print_results
            exit 1
        fi
    fi

    # Normal check mode
    check_all_services
    print_results
    exit $?
}

# Trap Ctrl+C for graceful exit in continuous mode
trap 'echo ""; log_info "Monitoring stopped"; exit 0' INT

# Run main function
main "$@"
