#!/bin/bash

################################################################################
# Generate Secure Secrets Script for Grocery List Application
################################################################################
#
# Purpose: Generate cryptographically secure secrets for production environment
#
# Usage:
#   ./generate-secrets.sh [OPTIONS]
#
# Options:
#   --output FILE      Output file path (default: .env.production)
#   --force            Overwrite existing file without prompt
#   --show-secrets     Display generated secrets (security warning!)
#   --jwt-only         Generate only JWT secrets
#   --db-only          Generate only database password
#   --length N         Secret length in bytes (default: 32, min: 16, max: 64)
#   --help             Show this help message
#
# Generated Secrets:
#   - DB_PASSWORD           PostgreSQL database password
#   - JWT_ACCESS_SECRET     JWT access token signing secret
#   - JWT_REFRESH_SECRET    JWT refresh token signing secret
#   - ZERO_AUTH_SECRET      Zero-cache authentication secret
#
# Requirements:
#   - OpenSSL installed (for secure random generation)
#   - Write permissions in output directory
#
# Examples:
#   ./generate-secrets.sh                       # Generate all secrets
#   ./generate-secrets.sh --output .env.prod    # Custom output file
#   ./generate-secrets.sh --jwt-only            # Only JWT secrets
#   ./generate-secrets.sh --force               # Overwrite existing file
#   ./generate-secrets.sh --show-secrets        # Display generated secrets
#
# Security Notes:
#   - Secrets are generated using OpenSSL's cryptographically secure RNG
#   - Default secret length is 32 bytes (256 bits)
#   - Never commit .env.production to version control
#   - Store production secrets in a secure password manager
#   - Rotate secrets regularly
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
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
OUTPUT_FILE="$PROJECT_DIR/.env.production"
FORCE=false
SHOW_SECRETS=false
JWT_ONLY=false
DB_ONLY=false
SECRET_LENGTH=32
MIN_LENGTH=16
MAX_LENGTH=64

# Generated secrets storage
declare -A SECRETS

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
# Validation Functions
################################################################################

check_dependencies() {
    log_info "Checking dependencies..."

    if ! command -v openssl &> /dev/null; then
        log_error "OpenSSL is required but not installed"
        log_error "Please install OpenSSL and try again"
        exit 1
    fi

    log_success "All dependencies present"
}

check_output_file() {
    if [ -f "$OUTPUT_FILE" ] && [ "$FORCE" = false ]; then
        log_warning "Output file already exists: $OUTPUT_FILE"
        echo ""
        read -p "Do you want to overwrite it? (y/N) " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Operation cancelled"
            exit 0
        fi
    fi
}

################################################################################
# Secret Generation Functions
################################################################################

generate_secret() {
    local length=${1:-$SECRET_LENGTH}

    # Generate random bytes and encode as base64
    local secret=$(openssl rand -base64 $length | tr -d '\n' | tr '+/' '-_')

    # Remove any trailing '=' padding
    secret=${secret%%=*}

    echo "$secret"
}

generate_password() {
    local length=${1:-16}

    # Generate alphanumeric password with special characters
    local password=$(openssl rand -base64 24 | tr -d '\n' | head -c $length)

    echo "$password"
}

generate_all_secrets() {
    log_info "Generating cryptographically secure secrets..."

    if [ "$DB_ONLY" = false ]; then
        # JWT secrets
        SECRETS[JWT_ACCESS_SECRET]=$(generate_secret $SECRET_LENGTH)
        SECRETS[JWT_REFRESH_SECRET]=$(generate_secret $SECRET_LENGTH)
        SECRETS[ZERO_AUTH_SECRET]=$(generate_secret $SECRET_LENGTH)
    fi

    if [ "$JWT_ONLY" = false ]; then
        # Database password
        SECRETS[DB_PASSWORD]=$(generate_password 32)
    fi

    log_success "Secrets generated successfully"
}

################################################################################
# Environment File Functions
################################################################################

load_existing_env() {
    if [ -f "$PROJECT_DIR/.env.example" ]; then
        log_info "Using .env.example as template"
        return 0
    else
        log_warning "No .env.example found, will create basic template"
        return 1
    fi
}

create_env_file() {
    log_info "Creating environment file: $OUTPUT_FILE"

    # Start with template or create basic one
    if [ -f "$PROJECT_DIR/.env.example" ]; then
        cp "$PROJECT_DIR/.env.example" "$OUTPUT_FILE"
        log_info "Copied template from .env.example"
    else
        cat > "$OUTPUT_FILE" <<'EOF'
# Production Environment Configuration
# Generated by generate-secrets.sh
# DO NOT COMMIT THIS FILE TO VERSION CONTROL!

#==============================================================================
# Environment
#==============================================================================
NODE_ENV=production

#==============================================================================
# Server Configuration
#==============================================================================
PORT=3001

#==============================================================================
# Database Configuration
#==============================================================================
DB_HOST=postgres
DB_PORT=5432
DB_NAME=grocery_db
DB_USER=grocery
DB_PASSWORD=REPLACE_ME
DB_MAX_CONNECTIONS=20
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=2000

#==============================================================================
# JWT Configuration
#==============================================================================
JWT_ACCESS_SECRET=REPLACE_ME
JWT_REFRESH_SECRET=REPLACE_ME
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

#==============================================================================
# Security Configuration
#==============================================================================
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

#==============================================================================
# CORS Configuration
#==============================================================================
# Update this with your production domain
CORS_ORIGIN=https://your-domain.com

#==============================================================================
# Zero-cache Configuration
#==============================================================================
ZERO_UPSTREAM_DB=postgresql://grocery:REPLACE_DB_PASSWORD@postgres:5432/grocery_db
ZERO_AUTH_SECRET=REPLACE_ME
ZERO_LOG_LEVEL=info

#==============================================================================
# Frontend Build Configuration (for docker build args)
#==============================================================================
VITE_API_URL=https://your-domain.com/api
VITE_ZERO_SERVER=wss://your-domain.com/zero
VITE_AUTH_ENABLED=true

EOF
    fi

    # Replace secrets in the file
    for key in "${!SECRETS[@]}"; do
        local value="${SECRETS[$key]}"

        # Escape special characters for sed
        local escaped_value=$(echo "$value" | sed 's/[&/\]/\\&/g')

        # Replace in file
        if grep -q "^${key}=" "$OUTPUT_FILE"; then
            sed -i "s|^${key}=.*|${key}=${escaped_value}|" "$OUTPUT_FILE"
        elif grep -q "REPLACE_ME" "$OUTPUT_FILE"; then
            # Replace first occurrence of REPLACE_ME with this secret
            sed -i "0,/REPLACE_ME/s//${escaped_value}/" "$OUTPUT_FILE"
        else
            # Append if not found
            echo "${key}=${value}" >> "$OUTPUT_FILE"
        fi
    done

    # Update ZERO_UPSTREAM_DB with DB_PASSWORD if both exist
    if [ -n "${SECRETS[DB_PASSWORD]:-}" ]; then
        local db_pass="${SECRETS[DB_PASSWORD]}"
        local escaped_db_pass=$(echo "$db_pass" | sed 's/[&/\]/\\&/g')
        sed -i "s|REPLACE_DB_PASSWORD|${escaped_db_pass}|g" "$OUTPUT_FILE"
    fi

    log_success "Environment file created: $OUTPUT_FILE"
}

################################################################################
# Display Functions
################################################################################

display_secrets() {
    if [ "$SHOW_SECRETS" = false ]; then
        return 0
    fi

    log_warning "=========================================="
    log_warning "Generated Secrets (SENSITIVE!)"
    log_warning "=========================================="
    echo ""

    for key in "${!SECRETS[@]}"; do
        echo -e "${CYAN}${key}${NC}=${SECRETS[$key]}"
    done

    echo ""
    log_warning "Store these secrets securely!"
    log_warning "Do not share or commit to version control"
}

show_summary() {
    echo ""
    log_success "=========================================="
    log_success "Secret Generation Complete"
    log_success "=========================================="
    echo ""

    log_info "Generated secrets:"
    for key in "${!SECRETS[@]}"; do
        echo "  - $key (${#SECRETS[$key]} characters)"
    done

    echo ""
    log_info "Output file: $OUTPUT_FILE"
    echo ""

    log_info "Next steps:"
    echo ""
    echo "  1. Review the generated .env.production file"
    echo "  2. Update CORS_ORIGIN with your production domain"
    echo "  3. Update VITE_API_URL and VITE_ZERO_SERVER with your production URLs"
    echo "  4. Store secrets in a secure password manager"
    echo "  5. NEVER commit .env.production to version control"
    echo "  6. Deploy using: $SCRIPT_DIR/deploy-prod.sh"
    echo ""

    log_warning "Security Reminders:"
    echo "  - Keep .env.production secure and private"
    echo "  - Use different secrets for each environment"
    echo "  - Rotate secrets regularly"
    echo "  - Add .env.production to .gitignore"
    echo "  - Consider using a secrets management service for production"
    echo ""

    if [ ! -f "$PROJECT_DIR/.gitignore" ] || ! grep -q "\.env\.production" "$PROJECT_DIR/.gitignore"; then
        log_warning "WARNING: .env.production may not be in .gitignore!"
        echo ""
        read -p "Add .env.production to .gitignore now? (y/N) " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo ".env.production" >> "$PROJECT_DIR/.gitignore"
            log_success "Added .env.production to .gitignore"
        fi
    fi
}

################################################################################
# Backup Functions
################################################################################

backup_existing_file() {
    if [ -f "$OUTPUT_FILE" ]; then
        local backup_file="${OUTPUT_FILE}.backup-$(date +%Y%m%d-%H%M%S)"
        log_info "Creating backup of existing file: $backup_file"
        cp "$OUTPUT_FILE" "$backup_file"
        log_success "Backup created"
    fi
}

################################################################################
# Main Function
################################################################################

main() {
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --output)
                OUTPUT_FILE="$2"
                if [[ "$OUTPUT_FILE" != /* ]]; then
                    OUTPUT_FILE="$PROJECT_DIR/$OUTPUT_FILE"
                fi
                shift 2
                ;;
            --force)
                FORCE=true
                shift
                ;;
            --show-secrets)
                SHOW_SECRETS=true
                shift
                ;;
            --jwt-only)
                JWT_ONLY=true
                shift
                ;;
            --db-only)
                DB_ONLY=true
                shift
                ;;
            --length)
                SECRET_LENGTH="$2"
                if [ $SECRET_LENGTH -lt $MIN_LENGTH ] || [ $SECRET_LENGTH -gt $MAX_LENGTH ]; then
                    log_error "Secret length must be between $MIN_LENGTH and $MAX_LENGTH"
                    exit 1
                fi
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
                exit 1
                ;;
        esac
    done

    # Check for conflicting options
    if [ "$JWT_ONLY" = true ] && [ "$DB_ONLY" = true ]; then
        log_error "Cannot use both --jwt-only and --db-only"
        exit 1
    fi

    log_info "=========================================="
    log_info "Generate Production Secrets"
    log_info "=========================================="
    echo ""

    # Check dependencies
    check_dependencies

    # Check output file
    check_output_file

    # Backup existing file if it exists
    backup_existing_file

    # Generate secrets
    generate_all_secrets

    # Create environment file
    create_env_file

    # Display secrets if requested
    display_secrets

    # Show summary
    show_summary
}

# Run main function
main "$@"
