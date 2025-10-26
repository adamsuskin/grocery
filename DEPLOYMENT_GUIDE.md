# Deployment Guide - Grocery List App

This guide provides comprehensive instructions for deploying the Grocery List application to production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Server Requirements](#server-requirements)
3. [Domain and DNS Setup](#domain-and-dns-setup)
4. [Initial Server Setup](#initial-server-setup)
5. [Installing Dependencies](#installing-dependencies)
6. [Environment Configuration](#environment-configuration)
7. [SSL Certificate Setup](#ssl-certificate-setup)
8. [Database Setup](#database-setup)
9. [Application Deployment](#application-deployment)
10. [Starting Services](#starting-services)
11. [Verifying Deployment](#verifying-deployment)
12. [Common Issues and Troubleshooting](#common-issues-and-troubleshooting)
13. [Updating the Application](#updating-the-application)
14. [Backup and Restore](#backup-and-restore)
15. [Rollback Procedures](#rollback-procedures)
16. [Security Checklist](#security-checklist)
17. [Performance Optimization](#performance-optimization)
18. [Monitoring Setup](#monitoring-setup)

---

## Prerequisites

Before deploying, ensure you have:

### Required Items

- **Server**: VPS or dedicated server (Ubuntu 22.04 LTS recommended)
- **Domain Name**: Registered domain for your application
- **Git Access**: SSH key configured for repository access
- **Email Service**: SMTP server for notifications (optional but recommended)

### Minimum Server Specifications

- **RAM**: 2GB minimum, 4GB recommended
- **CPU**: 2 cores minimum
- **Storage**: 20GB SSD minimum, 40GB recommended
- **Bandwidth**: Unmetered or generous allocation
- **OS**: Ubuntu 22.04 LTS (other Linux distributions work but this guide assumes Ubuntu)

### Required Knowledge

- Basic Linux command line
- SSH access and key management
- DNS management
- Basic Docker concepts (optional, for Docker deployment)

---

## Server Requirements

### Supported Operating Systems

- **Primary**: Ubuntu 22.04 LTS
- **Also Supported**: Ubuntu 20.04, Debian 11/12, CentOS 8+, RHEL 8+

### Required Software

The following will be installed during setup:
- Node.js 20.x
- pnpm (package manager)
- PostgreSQL 16
- Nginx (web server/reverse proxy)
- Certbot (SSL certificates)
- Docker & Docker Compose (alternative deployment method)
- Git

---

## Domain and DNS Setup

### Step 1: Configure DNS Records

Add the following DNS records in your domain registrar's DNS management panel:

```
Type    Name              Value                          TTL
A       @                 YOUR_SERVER_IP                 3600
A       www               YOUR_SERVER_IP                 3600
CNAME   api               YOUR_DOMAIN.com                3600
```

**Example for domain `groceryapp.com` with server IP `203.0.113.50`:**

```
Type    Name              Value                          TTL
A       @                 203.0.113.50                   3600
A       www               203.0.113.50                   3600
CNAME   api               groceryapp.com                 3600
```

### Step 2: Verify DNS Propagation

Wait for DNS propagation (usually 5-30 minutes, can take up to 48 hours):

```bash
# Check A record
dig +short yourdomain.com

# Check CNAME record
dig +short api.yourdomain.com

# Or use nslookup
nslookup yourdomain.com
nslookup api.yourdomain.com
```

---

## Initial Server Setup

### Step 1: Connect to Your Server

```bash
ssh root@YOUR_SERVER_IP
# Or if you have a non-root user:
ssh username@YOUR_SERVER_IP
```

### Step 2: Update System Packages

```bash
sudo apt update && sudo apt upgrade -y
```

### Step 3: Create Application User

Create a dedicated user for running the application (security best practice):

```bash
# Create user
sudo adduser grocery --disabled-password --gecos ""

# Add to sudo group (optional, for maintenance)
sudo usermod -aG sudo grocery

# Set up SSH key for the new user
sudo mkdir -p /home/grocery/.ssh
sudo cp ~/.ssh/authorized_keys /home/grocery/.ssh/
sudo chown -R grocery:grocery /home/grocery/.ssh
sudo chmod 700 /home/grocery/.ssh
sudo chmod 600 /home/grocery/.ssh/authorized_keys
```

### Step 4: Configure Firewall

```bash
# Enable UFW firewall
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Verify firewall status
sudo ufw status
```

### Step 5: Set Timezone

```bash
# Set to your timezone
sudo timedatectl set-timezone America/New_York

# Verify
timedatectl
```

---

## Installing Dependencies

### Step 1: Install Node.js 20.x

```bash
# Install Node.js 20.x from NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version
```

### Step 2: Install pnpm

```bash
# Install pnpm globally
sudo npm install -g pnpm

# Verify installation
pnpm --version
```

### Step 3: Install PostgreSQL 16

```bash
# Add PostgreSQL repository
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -

# Update and install PostgreSQL 16
sudo apt update
sudo apt install -y postgresql-16 postgresql-contrib-16

# Verify installation
sudo systemctl status postgresql

# PostgreSQL should start automatically
```

### Step 4: Install Nginx

```bash
# Install Nginx
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Verify
sudo systemctl status nginx
```

### Step 5: Install Certbot (Let's Encrypt)

```bash
# Install Certbot and Nginx plugin
sudo apt install -y certbot python3-certbot-nginx

# Verify installation
certbot --version
```

### Step 6: Install Git

```bash
# Install Git
sudo apt install -y git

# Configure Git (optional)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### Step 7: Install Docker (Optional - for Docker deployment)

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker grocery

# Install Docker Compose
sudo apt install -y docker-compose-plugin

# Verify installations
docker --version
docker compose version
```

---

## Environment Configuration

### Step 1: Clone Repository

```bash
# Switch to application user
su - grocery

# Clone repository
cd /home/grocery
git clone https://github.com/yourusername/grocery.git
cd grocery
```

### Step 2: Create Production Environment File

```bash
# Copy example environment file
cp .env.example .env.production

# Edit environment file
nano .env.production
```

### Step 3: Configure Environment Variables

Edit `/home/grocery/grocery/.env.production` with the following:

```bash
# ============================================================================
# CLIENT ENVIRONMENT VARIABLES (Vite)
# ============================================================================

# Backend API URL - Your production API domain
VITE_API_URL=https://api.yourdomain.com

# Zero Server URL - Your production zero-cache URL
VITE_ZERO_SERVER=https://api.yourdomain.com

# Authentication Feature Flag - Enable in production
VITE_AUTH_ENABLED=true

# ============================================================================
# SERVER ENVIRONMENT VARIABLES
# ============================================================================

# Database Configuration (PostgreSQL)
DATABASE_URL=postgresql://grocery:STRONG_DB_PASSWORD@localhost:5432/grocery_db

# Alternative: Individual database connection parameters
DB_HOST=localhost
DB_PORT=5432
DB_NAME=grocery_db
DB_USER=grocery
DB_PASSWORD=STRONG_DB_PASSWORD

# Database Connection Pool Settings
DB_MAX_CONNECTIONS=20
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=2000

# JWT Configuration - IMPORTANT: Generate secure secrets!
# Generate with: openssl rand -base64 32
JWT_ACCESS_SECRET=GENERATE_STRONG_SECRET_HERE
JWT_REFRESH_SECRET=GENERATE_DIFFERENT_STRONG_SECRET_HERE
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Server Configuration
PORT=3001
NODE_ENV=production

# CORS Configuration - Your production frontend URLs
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com

# Security Configuration
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# ============================================================================
# ZERO CACHE CONFIGURATION
# ============================================================================

# Zero-cache database connection
ZERO_UPSTREAM_DB=postgresql://grocery:STRONG_DB_PASSWORD@localhost:5432/grocery_db

# Zero replica file location - persistent storage
ZERO_REPLICA_FILE=/home/grocery/grocery/data/zero-replica.db

# Zero authentication secret - IMPORTANT: Generate secure secret!
ZERO_AUTH_SECRET=GENERATE_STRONG_ZERO_SECRET_HERE

# Zero logging level
ZERO_LOG_LEVEL=info
```

### Step 4: Generate Secure Secrets

Generate strong secrets for JWT and Zero:

```bash
# Generate JWT Access Secret
echo "JWT_ACCESS_SECRET=$(openssl rand -base64 32)"

# Generate JWT Refresh Secret
echo "JWT_REFRESH_SECRET=$(openssl rand -base64 32)"

# Generate Zero Auth Secret
echo "ZERO_AUTH_SECRET=$(openssl rand -base64 32)"
```

Copy these values into your `.env.production` file.

### Step 5: Secure Environment File

```bash
# Restrict access to environment file
chmod 600 .env.production
```

---

## SSL Certificate Setup

### Step 1: Obtain SSL Certificate with Let's Encrypt

```bash
# Stop nginx temporarily
sudo systemctl stop nginx

# Obtain certificate for your domains
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com

# Follow prompts:
# - Enter email address
# - Agree to terms of service
# - Choose whether to share email with EFF

# Start nginx
sudo systemctl start nginx
```

### Step 2: Verify Certificate Installation

```bash
# Certificates are stored in:
sudo ls -la /etc/letsencrypt/live/yourdomain.com/

# Should show:
# - cert.pem (certificate)
# - chain.pem (certificate chain)
# - fullchain.pem (certificate + chain)
# - privkey.pem (private key)
```

### Step 3: Configure Automatic Renewal

```bash
# Test automatic renewal
sudo certbot renew --dry-run

# Certbot automatically installs a cron job or systemd timer
# Verify it's active:
sudo systemctl status certbot.timer
```

### Step 4: Set Up Renewal Hook (Reload Nginx after renewal)

```bash
# Create renewal hook directory if it doesn't exist
sudo mkdir -p /etc/letsencrypt/renewal-hooks/post

# Create reload script
sudo tee /etc/letsencrypt/renewal-hooks/post/reload-nginx.sh > /dev/null <<'EOF'
#!/bin/bash
systemctl reload nginx
EOF

# Make it executable
sudo chmod +x /etc/letsencrypt/renewal-hooks/post/reload-nginx.sh
```

---

## Database Setup

### Step 1: Configure PostgreSQL

```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL console, run:
```

```sql
-- Create database user
CREATE USER grocery WITH PASSWORD 'STRONG_DB_PASSWORD';

-- Create database
CREATE DATABASE grocery_db OWNER grocery;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE grocery_db TO grocery;

-- Enable logical replication (required for Zero)
ALTER SYSTEM SET wal_level = logical;

-- Exit PostgreSQL
\q
```

```bash
# Restart PostgreSQL to apply settings
sudo systemctl restart postgresql
```

### Step 2: Configure PostgreSQL for Remote Connections (if needed)

If your services run on different servers:

```bash
# Edit PostgreSQL configuration
sudo nano /etc/postgresql/16/main/postgresql.conf

# Find and modify:
listen_addresses = 'localhost'  # Keep as localhost for security
# Or if Zero runs on different server:
# listen_addresses = 'localhost,INTERNAL_IP'

# Edit client authentication
sudo nano /etc/postgresql/16/main/pg_hba.conf

# Add line for application access (if on same server):
local   grocery_db   grocery   md5
host    grocery_db   grocery   127.0.0.1/32   md5
host    grocery_db   grocery   ::1/128        md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Step 3: Initialize Database Schema

```bash
# Navigate to project directory
cd /home/grocery/grocery

# Run schema initialization
PGPASSWORD='STRONG_DB_PASSWORD' psql -h localhost -U grocery -d grocery_db -f server/db/schema.sql

# Verify tables were created
PGPASSWORD='STRONG_DB_PASSWORD' psql -h localhost -U grocery -d grocery_db -c "\dt"
```

### Step 4: Run Database Migrations

```bash
# Install dependencies first
pnpm install

# Run migrations
cd server/migrations
./migrate.sh up

# Or run specific migrations:
# PGPASSWORD='STRONG_DB_PASSWORD' psql -h localhost -U grocery -d grocery_db -f 001_add_authentication.sql
```

### Step 5: Verify Database Setup

```bash
# Connect to database
PGPASSWORD='STRONG_DB_PASSWORD' psql -h localhost -U grocery -d grocery_db

# Check tables
\dt

# Check table details
\d users
\d lists
\d grocery_items

# Exit
\q
```

---

## Application Deployment

You can deploy using either Docker (recommended) or manual Node.js setup.

### Option A: Docker Deployment (Recommended)

#### Step 1: Prepare Docker Environment

```bash
cd /home/grocery/grocery

# Copy production environment to .env
cp .env.production .env

# Create data directory for Zero
mkdir -p data

# Create backups directory
mkdir -p backups
```

#### Step 2: Build and Start Services

```bash
# Build and start all services
docker compose -f docker-compose.prod.yml up -d --build

# Check service status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f
```

#### Step 3: Verify Services

```bash
# Check frontend
curl -I http://localhost:3000

# Check auth server
curl http://localhost:3001/health

# Check zero-cache
curl http://localhost:4848/health
```

### Option B: Manual Node.js Deployment

#### Step 1: Install Application Dependencies

```bash
cd /home/grocery/grocery

# Install dependencies
pnpm install --frozen-lockfile
```

#### Step 2: Build Application

```bash
# Build server (TypeScript to JavaScript)
pnpm run server:build

# Build frontend (React/Vite)
pnpm run build
```

#### Step 3: Create systemd Service Files

**Auth Server Service:**

```bash
sudo tee /etc/systemd/system/grocery-auth.service > /dev/null <<'EOF'
[Unit]
Description=Grocery List Auth Server
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=grocery
WorkingDirectory=/home/grocery/grocery
EnvironmentFile=/home/grocery/grocery/.env.production
ExecStart=/usr/bin/node dist/server/index.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=grocery-auth

# Security hardening
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/home/grocery/grocery/data

[Install]
WantedBy=multi-user.target
EOF
```

**Zero-cache Service:**

```bash
sudo tee /etc/systemd/system/grocery-zero.service > /dev/null <<'EOF'
[Unit]
Description=Grocery List Zero Cache
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=grocery
WorkingDirectory=/home/grocery/grocery
EnvironmentFile=/home/grocery/grocery/.env.production
ExecStart=/usr/local/bin/npx zero-cache
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=grocery-zero

# Security hardening
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/home/grocery/grocery/data

[Install]
WantedBy=multi-user.target
EOF
```

#### Step 4: Start Services

```bash
# Reload systemd daemon
sudo systemctl daemon-reload

# Enable services to start on boot
sudo systemctl enable grocery-auth
sudo systemctl enable grocery-zero

# Start services
sudo systemctl start grocery-auth
sudo systemctl start grocery-zero

# Check status
sudo systemctl status grocery-auth
sudo systemctl status grocery-zero

# View logs
sudo journalctl -u grocery-auth -f
sudo journalctl -u grocery-zero -f
```

---

## Starting Services

### Configure Nginx as Reverse Proxy

Create Nginx configuration:

```bash
sudo tee /etc/nginx/sites-available/grocery > /dev/null <<'EOF'
# Upstream servers
upstream auth_backend {
    server localhost:3001;
    keepalive 32;
}

upstream zero_backend {
    server localhost:4848;
    keepalive 32;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com api.yourdomain.com;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://$server_name$request_uri;
    }
}

# Main application (HTTPS)
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;

    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Root directory for static files
    root /home/grocery/grocery/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;

    # Static files with caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Service Worker (no caching)
    location = /sw.js {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        expires 0;
    }

    # Web App Manifest
    location = /manifest.webmanifest {
        add_header Cache-Control "public, max-age=604800";
    }

    # SPA routing - all routes serve index.html
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
}

# API Server (HTTPS)
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;

    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # API endpoints
    location / {
        proxy_pass http://auth_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Zero-cache WebSocket endpoint
    location /zero {
        proxy_pass http://zero_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;

        # WebSocket timeouts
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
    }
}
EOF
```

**Replace `yourdomain.com` with your actual domain throughout the file.**

Enable the site:

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/grocery /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## Verifying Deployment

### Step 1: Check Service Health

```bash
# Check Nginx
sudo systemctl status nginx

# Check Auth Server
curl https://api.yourdomain.com/health
# Should return: {"status":"ok"}

# Check Zero-cache (if Docker)
docker compose -f docker-compose.prod.yml ps

# Check Zero-cache (if systemd)
sudo systemctl status grocery-zero
```

### Step 2: Test Frontend

```bash
# Check homepage loads
curl -I https://yourdomain.com
# Should return: HTTP/2 200

# Check in browser
# Open: https://yourdomain.com
```

### Step 3: Test User Registration

```bash
# Test user registration API
curl -X POST https://api.yourdomain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "name": "Test User"
  }'

# Should return success with user data
```

### Step 4: Test Database Connection

```bash
# Check database
PGPASSWORD='STRONG_DB_PASSWORD' psql -h localhost -U grocery -d grocery_db -c "SELECT COUNT(*) FROM users;"

# Should show user count
```

### Step 5: Check Logs

```bash
# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Application logs (Docker)
docker compose -f docker-compose.prod.yml logs -f auth-server

# Application logs (systemd)
sudo journalctl -u grocery-auth -f
sudo journalctl -u grocery-zero -f
```

---

## Common Issues and Troubleshooting

### Issue 1: 502 Bad Gateway

**Symptoms:** Nginx shows 502 error when accessing the site.

**Causes:**
- Backend services not running
- Incorrect port configuration
- Firewall blocking internal connections

**Solutions:**

```bash
# Check if services are running
sudo systemctl status grocery-auth
sudo systemctl status grocery-zero

# Or for Docker:
docker compose -f docker-compose.prod.yml ps

# Check if ports are listening
sudo netstat -tlnp | grep -E '3001|4848'

# Check logs
sudo journalctl -u grocery-auth -n 50
docker compose -f docker-compose.prod.yml logs auth-server

# Restart services
sudo systemctl restart grocery-auth grocery-zero
# Or:
docker compose -f docker-compose.prod.yml restart
```

### Issue 2: Database Connection Errors

**Symptoms:** Services fail to start, database connection errors in logs.

**Solutions:**

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check database exists
sudo -u postgres psql -l | grep grocery_db

# Test connection
PGPASSWORD='STRONG_DB_PASSWORD' psql -h localhost -U grocery -d grocery_db -c "SELECT 1;"

# Check pg_hba.conf
sudo nano /etc/postgresql/16/main/pg_hba.conf

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Issue 3: SSL Certificate Errors

**Symptoms:** Browser shows SSL warnings, certificate errors.

**Solutions:**

```bash
# Check certificate validity
sudo certbot certificates

# Renew certificate
sudo certbot renew --force-renewal

# Check Nginx SSL configuration
sudo nginx -t

# Verify certificate files exist
sudo ls -la /etc/letsencrypt/live/yourdomain.com/
```

### Issue 4: CORS Errors

**Symptoms:** Frontend can't communicate with API, CORS errors in browser console.

**Solutions:**

```bash
# Check CORS_ORIGIN in .env.production
cat .env.production | grep CORS_ORIGIN

# Should match your frontend domain
# Update if needed:
nano .env.production

# Restart services
sudo systemctl restart grocery-auth
```

### Issue 5: Out of Memory

**Symptoms:** Services crash, OOM killer in logs.

**Solutions:**

```bash
# Check memory usage
free -h

# Check swap
swapon --show

# Add swap if needed
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Reduce resource limits in docker-compose.prod.yml
```

### Issue 6: Zero-cache Not Syncing

**Symptoms:** Changes don't sync in real-time across devices.

**Solutions:**

```bash
# Check Zero service
sudo systemctl status grocery-zero

# Check Zero logs
sudo journalctl -u grocery-zero -n 100

# Verify ZERO_UPSTREAM_DB
cat .env.production | grep ZERO_UPSTREAM_DB

# Check replication setup
sudo -u postgres psql -d grocery_db -c "SELECT * FROM pg_replication_slots;"

# Restart Zero
sudo systemctl restart grocery-zero
```

### Issue 7: Build Failures

**Symptoms:** `pnpm run build` fails.

**Solutions:**

```bash
# Clear cache and rebuild
rm -rf node_modules dist
pnpm install --frozen-lockfile
pnpm run build

# Check Node.js version
node --version  # Should be v20.x

# Check for TypeScript errors
pnpm run type-check
```

---

## Updating the Application

### Standard Update Procedure

```bash
# 1. Connect to server
ssh grocery@YOUR_SERVER_IP

# 2. Navigate to application directory
cd /home/grocery/grocery

# 3. Create backup (see Backup section)
./scripts/backup.sh

# 4. Pull latest changes
git fetch origin
git pull origin main

# 5. Install new dependencies
pnpm install --frozen-lockfile

# 6. Run database migrations (if any)
cd server/migrations
./migrate.sh up
cd ../..

# 7. Build application
pnpm run build

# 8. Restart services (Docker)
docker compose -f docker-compose.prod.yml up -d --build

# OR restart services (systemd)
sudo systemctl restart grocery-auth grocery-zero

# 9. Verify deployment
curl https://api.yourdomain.com/health

# 10. Check logs
docker compose -f docker-compose.prod.yml logs -f
# Or:
sudo journalctl -u grocery-auth -f
```

### Zero-Downtime Update (Advanced)

For zero-downtime updates, use a blue-green deployment strategy:

```bash
# This requires load balancing setup
# Not covered in basic guide - see DEPLOYMENT_ARCHITECTURE.md
```

---

## Backup and Restore

### Automated Backup Script

Create a backup script:

```bash
sudo tee /home/grocery/grocery/scripts/backup.sh > /dev/null <<'EOF'
#!/bin/bash

# Configuration
BACKUP_DIR="/home/grocery/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="grocery_db"
DB_USER="grocery"
DB_PASSWORD="STRONG_DB_PASSWORD"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Database backup
echo "Backing up database..."
PGPASSWORD="$DB_PASSWORD" pg_dump -h localhost -U "$DB_USER" -F c -f "$BACKUP_DIR/db_backup_$DATE.dump" "$DB_NAME"

# Application files backup (optional)
echo "Backing up application files..."
tar -czf "$BACKUP_DIR/app_backup_$DATE.tar.gz" \
  -C /home/grocery/grocery \
  --exclude='node_modules' \
  --exclude='dist' \
  --exclude='.git' \
  --exclude='data' \
  .

# Zero data backup
echo "Backing up Zero data..."
cp /home/grocery/grocery/data/zero-replica.db "$BACKUP_DIR/zero_replica_$DATE.db"

# Cleanup old backups (keep last 7 days)
echo "Cleaning up old backups..."
find "$BACKUP_DIR" -name "*.dump" -mtime +7 -delete
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete
find "$BACKUP_DIR" -name "*.db" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR"
EOF

chmod +x /home/grocery/grocery/scripts/backup.sh
```

### Manual Backup

```bash
# Database backup
PGPASSWORD='STRONG_DB_PASSWORD' pg_dump -h localhost -U grocery -F c -f ~/backup_$(date +%Y%m%d).dump grocery_db

# Environment backup
cp .env.production ~/env_backup_$(date +%Y%m%d)

# Zero data backup
cp data/zero-replica.db ~/zero_backup_$(date +%Y%m%d).db
```

### Automated Backup with Cron

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /home/grocery/grocery/scripts/backup.sh >> /home/grocery/backups/backup.log 2>&1
```

### Restore from Backup

```bash
# 1. Stop services
docker compose -f docker-compose.prod.yml down
# Or:
sudo systemctl stop grocery-auth grocery-zero

# 2. Restore database
PGPASSWORD='STRONG_DB_PASSWORD' pg_restore -h localhost -U grocery -d grocery_db -c /path/to/backup.dump

# 3. Restore Zero data
cp /path/to/zero_replica_backup.db /home/grocery/grocery/data/zero-replica.db

# 4. Start services
docker compose -f docker-compose.prod.yml up -d
# Or:
sudo systemctl start grocery-auth grocery-zero

# 5. Verify
curl https://api.yourdomain.com/health
```

### Remote Backup to S3 (Optional)

```bash
# Install AWS CLI
sudo apt install awscli

# Configure AWS credentials
aws configure

# Modify backup script to upload to S3
# Add to backup.sh:
# aws s3 sync "$BACKUP_DIR" s3://your-bucket/grocery-backups/
```

---

## Rollback Procedures

### Rollback to Previous Version

```bash
# 1. Check current version
cd /home/grocery/grocery
git log -1

# 2. Stop services
docker compose -f docker-compose.prod.yml down
# Or:
sudo systemctl stop grocery-auth grocery-zero

# 3. Rollback code
git log --oneline -10  # Find commit hash
git checkout <COMMIT_HASH>

# 4. Rollback database (if migrations were run)
cd server/migrations
./migrate.sh down  # Rollback last migration
cd ../..

# 5. Rebuild
pnpm install --frozen-lockfile
pnpm run build

# 6. Restart services
docker compose -f docker-compose.prod.yml up -d --build
# Or:
sudo systemctl start grocery-auth grocery-zero

# 7. Verify
curl https://api.yourdomain.com/health
```

### Emergency Rollback

If something goes wrong:

```bash
# 1. Restore from backup
PGPASSWORD='STRONG_DB_PASSWORD' pg_restore -h localhost -U grocery -d grocery_db -c /home/grocery/backups/db_backup_LATEST.dump

# 2. Checkout last known good version
cd /home/grocery/grocery
git checkout <LAST_GOOD_COMMIT>

# 3. Rebuild and restart
pnpm install --frozen-lockfile
pnpm run build
docker compose -f docker-compose.prod.yml up -d --build
```

---

## Security Checklist

### Pre-Deployment Security

- [ ] Strong passwords for database user
- [ ] Strong JWT secrets (32+ characters, random)
- [ ] Strong Zero auth secret
- [ ] `.env.production` file has restrictive permissions (600)
- [ ] Firewall configured (only 22, 80, 443 open)
- [ ] SSH key authentication enabled
- [ ] Root SSH login disabled
- [ ] Database only accepts local connections
- [ ] CORS configured with specific domains (no wildcards)
- [ ] SSL certificates installed and valid

### Post-Deployment Security

```bash
# Disable root SSH login
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
# Set: PasswordAuthentication no
sudo systemctl restart sshd

# Enable automatic security updates
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades

# Set up fail2ban
sudo apt install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Configure PostgreSQL authentication
sudo nano /etc/postgresql/16/main/pg_hba.conf
# Use md5 or scram-sha-256 instead of trust

# Regular security updates
sudo apt update && sudo apt upgrade -y
```

### Security Headers

Verify security headers are set:

```bash
curl -I https://yourdomain.com | grep -E 'Strict-Transport-Security|X-Frame-Options|X-Content-Type-Options'
```

Should show:
- `Strict-Transport-Security`
- `X-Frame-Options`
- `X-Content-Type-Options`
- `X-XSS-Protection`

### Regular Security Audits

```bash
# Check for vulnerable dependencies
pnpm audit

# Fix vulnerabilities
pnpm audit fix

# Update dependencies
pnpm update

# Check SSL configuration
curl https://www.ssllabs.com/ssltest/analyze.html?d=yourdomain.com
```

---

## Performance Optimization

### Database Optimization

```sql
-- Connect to database
PGPASSWORD='STRONG_DB_PASSWORD' psql -h localhost -U grocery -d grocery_db

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM grocery_items WHERE list_id = 'some-uuid';

-- Vacuum database regularly
VACUUM ANALYZE;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;
```

### Nginx Caching

Add to Nginx configuration:

```nginx
# Add to http block in /etc/nginx/nginx.conf
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=100m inactive=60m;

# Add to location /api/ block
proxy_cache api_cache;
proxy_cache_valid 200 5m;
proxy_cache_bypass $http_cache_control;
add_header X-Cache-Status $upstream_cache_status;
```

### PostgreSQL Performance Tuning

```bash
# Edit PostgreSQL configuration
sudo nano /etc/postgresql/16/main/postgresql.conf

# Add/modify these settings based on your server:
shared_buffers = 256MB                 # 25% of RAM
effective_cache_size = 1GB             # 50-75% of RAM
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 4MB

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Application Performance

```bash
# Enable production mode
# In .env.production:
NODE_ENV=production

# Use PM2 for process management (alternative to systemd)
sudo npm install -g pm2
pm2 start dist/server/index.js --name grocery-auth
pm2 startup
pm2 save
```

### Monitor Performance

```bash
# Server resources
htop

# Database connections
PGPASSWORD='STRONG_DB_PASSWORD' psql -h localhost -U grocery -d grocery_db -c "SELECT count(*) FROM pg_stat_activity;"

# Nginx connections
sudo watch -n 1 'ps aux | grep nginx | wc -l'
```

---

## Monitoring Setup

### System Monitoring with Prometheus and Grafana (Optional)

```bash
# Install Prometheus
sudo apt install prometheus

# Install Grafana
sudo apt install grafana

# Configure and start
sudo systemctl enable prometheus grafana-server
sudo systemctl start prometheus grafana-server
```

### Application Logging

```bash
# View application logs
sudo journalctl -u grocery-auth -f
sudo journalctl -u grocery-zero -f

# Or for Docker:
docker compose -f docker-compose.prod.yml logs -f

# Log rotation is automatic with journald/Docker
```

### Uptime Monitoring

Use external monitoring services:
- UptimeRobot (free tier)
- Pingdom
- StatusCake
- Custom health check script

Example health check script:

```bash
#!/bin/bash
# /home/grocery/scripts/health-check.sh

URL="https://api.yourdomain.com/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$URL")

if [ "$RESPONSE" != "200" ]; then
    echo "Health check failed: $RESPONSE"
    # Send alert (email, SMS, Slack, etc.)
    # Example: mail -s "App Down" admin@example.com <<< "Health check failed"
fi
```

### Error Tracking

Integrate error tracking service:
- Sentry
- Rollbar
- Bugsnag

### Database Monitoring

```bash
# Create monitoring script
sudo tee /home/grocery/scripts/db-monitor.sh > /dev/null <<'EOF'
#!/bin/bash
PGPASSWORD='STRONG_DB_PASSWORD' psql -h localhost -U grocery -d grocery_db <<SQL
SELECT
  datname,
  numbackends as connections,
  xact_commit as commits,
  xact_rollback as rollbacks,
  blks_read as disk_blocks_read,
  blks_hit as buffer_blocks_hit
FROM pg_stat_database
WHERE datname = 'grocery_db';
SQL
EOF

chmod +x /home/grocery/scripts/db-monitor.sh

# Run periodically
crontab -e
# Add: */5 * * * * /home/grocery/scripts/db-monitor.sh >> /home/grocery/logs/db-monitor.log
```

---

## Additional Resources

### Useful Commands

```bash
# Check all services status
systemctl status grocery-auth grocery-zero postgresql nginx

# View all logs
sudo journalctl -u grocery-auth -u grocery-zero -f

# Restart everything
sudo systemctl restart grocery-auth grocery-zero postgresql nginx

# Check disk space
df -h

# Check memory
free -h

# Check process list
ps aux | grep -E 'node|postgres|nginx'

# Network connections
sudo netstat -tlnp
```

### Important Files Locations

```
/home/grocery/grocery/              - Application directory
/home/grocery/grocery/.env.production - Environment configuration
/home/grocery/grocery/data/         - Zero replica data
/home/grocery/backups/              - Backup storage
/etc/nginx/sites-available/grocery  - Nginx configuration
/etc/systemd/system/grocery-*.service - Service definitions
/etc/letsencrypt/live/yourdomain.com/ - SSL certificates
/var/log/nginx/                     - Nginx logs
```

### Support and Documentation

- Application Repository: https://github.com/yourusername/grocery
- Zero Documentation: https://zero.rocicorp.dev/
- PostgreSQL Documentation: https://www.postgresql.org/docs/
- Nginx Documentation: https://nginx.org/en/docs/
- Let's Encrypt Documentation: https://letsencrypt.org/docs/

---

## Conclusion

Your Grocery List application should now be successfully deployed and running in production. Remember to:

1. Monitor logs regularly
2. Keep systems updated
3. Perform regular backups
4. Review security configurations
5. Monitor performance metrics

For issues or questions, refer to the troubleshooting section or check the application repository.
