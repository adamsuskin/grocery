#!/bin/bash

# Grocery List Application - Docker Quick Start Script
# This script helps you quickly start the application with Docker

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Print header
echo ""
echo "════════════════════════════════════════════════"
echo "  Grocery List Application - Docker Setup"
echo "════════════════════════════════════════════════"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

print_success "Docker and Docker Compose are installed"

# Check if .env file exists
if [ ! -f .env ]; then
    print_warning ".env file not found"
    print_info "Using default development environment variables"
    print_info "For production, copy .env.docker to .env and configure"
fi

# Parse command line arguments
MODE=${1:-dev}

case $MODE in
    dev|development)
        print_info "Starting in DEVELOPMENT mode..."
        COMPOSE_FILE="docker-compose.yml"
        ;;
    prod|production)
        print_info "Starting in PRODUCTION mode..."
        COMPOSE_FILE="docker-compose.prod.yml"

        if [ ! -f .env ]; then
            print_error "Production mode requires .env file"
            print_info "Copy .env.docker to .env and configure it first"
            exit 1
        fi
        ;;
    stop)
        print_info "Stopping all services..."
        docker compose down
        print_success "All services stopped"
        exit 0
        ;;
    clean)
        print_warning "This will remove all data and volumes!"
        read -p "Are you sure? (yes/no): " -r
        echo
        if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
            docker compose down -v
            print_success "All services stopped and data removed"
        else
            print_info "Operation cancelled"
        fi
        exit 0
        ;;
    restart)
        print_info "Restarting all services..."
        docker compose restart
        print_success "All services restarted"
        exit 0
        ;;
    logs)
        print_info "Showing logs (Ctrl+C to exit)..."
        docker compose logs -f
        exit 0
        ;;
    status)
        print_info "Service status:"
        docker compose ps
        exit 0
        ;;
    *)
        echo "Usage: $0 [dev|prod|stop|clean|restart|logs|status]"
        echo ""
        echo "Commands:"
        echo "  dev        Start in development mode (default)"
        echo "  prod       Start in production mode"
        echo "  stop       Stop all services"
        echo "  clean      Stop services and remove all data"
        echo "  restart    Restart all services"
        echo "  logs       Show logs from all services"
        echo "  status     Show status of all services"
        exit 1
        ;;
esac

# Pull latest images
print_info "Pulling latest Docker images..."
docker compose -f $COMPOSE_FILE pull

# Build custom images
print_info "Building custom images..."
docker compose -f $COMPOSE_FILE build

# Start services
print_info "Starting services..."
docker compose -f $COMPOSE_FILE up -d

# Wait for services to be healthy
print_info "Waiting for services to be ready..."
sleep 5

# Check service health
print_info "Checking service health..."

# Check PostgreSQL
if docker compose -f $COMPOSE_FILE ps postgres | grep -q "Up"; then
    print_success "PostgreSQL is running"
else
    print_error "PostgreSQL failed to start"
    docker compose -f $COMPOSE_FILE logs postgres
    exit 1
fi

# Check Auth Server
if docker compose -f $COMPOSE_FILE ps auth-server | grep -q "Up"; then
    print_success "Auth Server is running"

    # Wait for health check
    for i in {1..30}; do
        if curl -sf http://localhost:3001/health > /dev/null 2>&1; then
            print_success "Auth Server health check passed"
            break
        fi
        if [ $i -eq 30 ]; then
            print_warning "Auth Server health check timeout (might still be starting)"
        fi
        sleep 1
    done
else
    print_warning "Auth Server is not running (might be building or starting)"
fi

# Check Zero-cache
if docker compose -f $COMPOSE_FILE ps zero-cache | grep -q "Up"; then
    print_success "Zero-cache is running"
else
    print_warning "Zero-cache is not running (might be starting)"
fi

# Success message
echo ""
echo "════════════════════════════════════════════════"
echo "  Services Started Successfully!"
echo "════════════════════════════════════════════════"
echo ""
print_info "Access your application at:"
echo ""
echo "  Frontend:       http://localhost:3000"
echo "  Auth API:       http://localhost:3001"
echo "  API Health:     http://localhost:3001/health"
echo "  API Docs:       http://localhost:3001/api"
echo "  Zero-cache:     http://localhost:4848"
echo "  PostgreSQL:     localhost:5432"
echo ""
print_info "Useful commands:"
echo ""
echo "  View logs:      docker compose logs -f"
echo "  Stop services:  docker compose down"
echo "  Service status: docker compose ps"
echo "  Restart:        docker compose restart"
echo ""
print_info "To stop services, run:"
echo "  ./docker-start.sh stop"
echo ""
