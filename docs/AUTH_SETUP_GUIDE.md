# Authentication System Setup Guide

A comprehensive guide to implementing and deploying the JWT-based authentication system for the Grocery List application.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation Steps](#installation-steps)
3. [Configuration Steps](#configuration-steps)
4. [Database Setup](#database-setup)
5. [Environment Variables](#environment-variables)
6. [Running the Servers](#running-the-servers)
7. [Testing Authentication](#testing-authentication)
8. [Troubleshooting](#troubleshooting)
9. [Security Checklist for Production](#security-checklist-for-production)

---

## Prerequisites

### Required Software

1. **Node.js** (version 18.0.0 or higher)
   ```bash
   node --version  # Should show v18.0.0 or higher
   ```

2. **pnpm** (Package Manager)
   ```bash
   npm install -g pnpm
   pnpm --version
   ```

3. **Docker and Docker Compose** (for PostgreSQL)
   ```bash
   docker --version
   docker compose version
   ```

4. **PostgreSQL Client Tools** (for manual database operations)
   ```bash
   psql --version
   ```

5. **curl or Postman** (for API testing)

### System Requirements

- **Operating System**: Linux, macOS, or Windows with WSL2
- **Memory**: Minimum 4GB RAM (8GB recommended)
- **Disk Space**: At least 2GB free space
- **Network**: Internet connection for downloading dependencies

---

## Installation Steps

### Step 1: Clone and Navigate to Project

```bash
# If not already in project directory
cd /path/to/grocery

# Verify you're in the right directory
ls -la package.json
```

### Step 2: Install Dependencies

```bash
# Install all project dependencies
pnpm install

# Verify installation
pnpm list | grep -E "(axios|bcrypt|jsonwebtoken|express|pg)"
```

**Expected output:**
```
├── axios@1.7.7
├── bcrypt@6.0.0
├── express@5.1.0
├── express-rate-limit@8.1.0
├── express-validator@7.3.0
├── jsonwebtoken@9.0.2
├── pg@8.16.3
└── ...
```

### Step 3: Verify File Structure

Ensure all authentication files are present:

```bash
# Check server files
ls -la server/auth/
# Should show: controller.ts, middleware.ts, routes.ts, utils.ts

ls -la server/config/
# Should show: db.ts, env.ts, rateLimitConfig.ts

ls -la server/db/
# Should show: pool.ts, schema.sql

# Check client files
ls -la src/contexts/
# Should show: AuthContext.tsx

ls -la src/components/
# Should show: LoginForm.tsx, RegisterForm.tsx, AuthPage.tsx

ls -la src/utils/
# Should show: auth.ts, api.ts, tokenRefresh.ts
```

---

## Configuration Steps

### Step 1: Create Environment File

```bash
# Copy the example environment file
cp .env.example .env
```

### Step 2: Edit Environment Variables

Open `.env` in your text editor and configure it (see [Environment Variables](#environment-variables) section for details).

### Step 3: Generate Secure Keys

Generate secure JWT secrets for production:

```bash
# Generate JWT access token secret
openssl rand -base64 32

# Generate JWT refresh token secret
openssl rand -base64 32

# Generate Zero auth secret
openssl rand -base64 32
```

Copy these values to your `.env` file.

### Step 4: Verify Configuration

```bash
# Check that .env file exists and has correct values
cat .env | grep -E "(JWT_|DB_|PORT)"
```

---

## Database Setup

### Option 1: Docker Compose (Recommended for Development)

#### Start PostgreSQL with Docker

```bash
# Start PostgreSQL container
pnpm db:up

# Or manually:
docker compose up -d postgres

# Verify container is running
docker ps | grep postgres
```

**Expected output:**
```
CONTAINER ID   IMAGE         PORTS                    STATUS
abc123def456   postgres:16   0.0.0.0:5432->5432/tcp   Up 10 seconds
```

#### Initialize Database Schema

```bash
# Wait for PostgreSQL to be ready (takes ~10 seconds)
sleep 10

# Apply database schema
pnpm db:init

# Or manually:
PGPASSWORD=grocery psql -h localhost -U grocery -d grocery_db -f server/db/schema.sql
```

#### Verify Database Setup

```bash
# Connect to database
PGPASSWORD=grocery psql -h localhost -U grocery -d grocery_db

# List tables (should show: users, refresh_tokens, grocery_items)
\dt

# Check users table structure
\d users

# Exit psql
\q
```

### Option 2: Manual PostgreSQL Setup

If you have PostgreSQL installed locally or on a server:

#### Create Database and User

```bash
# Connect as postgres superuser
sudo -u postgres psql

# Run these SQL commands:
```

```sql
-- Create database user
CREATE USER grocery WITH PASSWORD 'your_secure_password';

-- Create database
CREATE DATABASE grocery_db OWNER grocery;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE grocery_db TO grocery;

-- Exit
\q
```

#### Apply Schema

```bash
# Apply schema
psql -h localhost -U grocery -d grocery_db -f server/db/schema.sql

# Verify tables
psql -h localhost -U grocery -d grocery_db -c "\dt"
```

### Schema Overview

The database includes three main tables:

**1. users**
```sql
- id (UUID, primary key)
- email (VARCHAR, unique)
- password_hash (VARCHAR)
- name (VARCHAR)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

**2. refresh_tokens**
```sql
- id (UUID, primary key)
- user_id (UUID, foreign key)
- token_hash (VARCHAR)
- expires_at (TIMESTAMP)
- created_at (TIMESTAMP)
- revoked (BOOLEAN)
```

**3. grocery_items**
```sql
- id (UUID, primary key)
- user_id (UUID, foreign key)
- name (VARCHAR)
- quantity (INTEGER)
- category (VARCHAR)
- notes (TEXT)
- gotten (BOOLEAN)
- created_at (TIMESTAMP)
```

---

## Environment Variables

### Client Variables (Browser Accessible)

These are prefixed with `VITE_` and exposed to the browser. **Never put secrets here!**

```env
# Backend API URL
VITE_API_URL=http://localhost:3001

# Zero server URL for real-time sync
VITE_ZERO_SERVER=http://localhost:4848

# Enable/disable authentication features
VITE_AUTH_ENABLED=true
```

**Development vs Production:**

| Variable | Development | Production |
|----------|-------------|------------|
| VITE_API_URL | http://localhost:3001 | https://api.yourdomain.com |
| VITE_ZERO_SERVER | http://localhost:4848 | https://zero.yourdomain.com |
| VITE_AUTH_ENABLED | true | true |

### Server Variables (Server-Side Only)

These are **never** exposed to the browser.

#### Database Configuration

```env
# Full connection string (recommended)
DATABASE_URL=postgresql://grocery:grocery@localhost:5432/grocery_db

# Or individual parameters
DB_HOST=localhost
DB_PORT=5432
DB_NAME=grocery_db
DB_USER=grocery
DB_PASSWORD=grocery
```

#### JWT Configuration

```env
# Access token secret (15-60 minutes lifespan)
JWT_ACCESS_SECRET=your-super-secret-jwt-key-change-in-production

# Refresh token secret (7-30 days lifespan)
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production

# Token expiration times
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
```

**Expiry Time Format:**
- `15m` = 15 minutes
- `1h` = 1 hour
- `7d` = 7 days
- `30d` = 30 days

#### Server Configuration

```env
# Server port
PORT=3001

# Environment mode
NODE_ENV=development

# CORS allowed origins (comma-separated)
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
```

#### Security Configuration

```env
# Bcrypt hashing rounds (10-12 recommended)
BCRYPT_ROUNDS=10

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000    # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100     # Max requests per window
```

#### Zero Cache Configuration

```env
# PostgreSQL connection for Zero
ZERO_UPSTREAM_DB=postgresql://grocery:grocery@localhost:5432/grocery_db

# Local replica file location
ZERO_REPLICA_FILE=/tmp/zero-replica.db

# Zero authentication secret
ZERO_AUTH_SECRET=dev-secret-key
```

### Environment File Examples

#### `.env` (Development)

```env
# Client
VITE_API_URL=http://localhost:3001
VITE_ZERO_SERVER=http://localhost:4848
VITE_AUTH_ENABLED=true

# Server
PORT=3001
NODE_ENV=development
DATABASE_URL=postgresql://grocery:grocery@localhost:5432/grocery_db

# JWT
JWT_ACCESS_SECRET=dev-access-secret-change-in-production
JWT_REFRESH_SECRET=dev-refresh-secret-change-in-production
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Security
BCRYPT_ROUNDS=10
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CORS_ORIGIN=http://localhost:3000,http://localhost:5173

# Zero
ZERO_UPSTREAM_DB=postgresql://grocery:grocery@localhost:5432/grocery_db
ZERO_REPLICA_FILE=/tmp/zero-replica.db
ZERO_AUTH_SECRET=dev-secret-key
```

#### `.env.production` (Production)

```env
# Client
VITE_API_URL=https://api.yourdomain.com
VITE_ZERO_SERVER=https://zero.yourdomain.com
VITE_AUTH_ENABLED=true

# Server
PORT=3001
NODE_ENV=production
DATABASE_URL=postgresql://user:password@db-host:5432/prod_db

# JWT (use secure generated values!)
JWT_ACCESS_SECRET=<generated-with-openssl-rand-base64-32>
JWT_REFRESH_SECRET=<generated-with-openssl-rand-base64-32>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=50
CORS_ORIGIN=https://yourdomain.com

# Zero
ZERO_UPSTREAM_DB=postgresql://user:password@db-host:5432/prod_db
ZERO_REPLICA_FILE=/var/lib/zero/replica.db
ZERO_AUTH_SECRET=<generated-with-openssl-rand-base64-32>
```

---

## Running the Servers

### Development Mode

#### Option 1: Run Everything (Recommended)

```bash
# Start all services: PostgreSQL, Zero, Auth Server, and Frontend
pnpm dev:all
```

This starts:
- PostgreSQL (port 5432)
- Zero cache server (port 4848)
- Authentication API server (port 3001)
- React frontend (port 5173)

#### Option 2: Run Services Individually

**Terminal 1: PostgreSQL**
```bash
pnpm db:up
```

**Terminal 2: Zero Cache Server**
```bash
pnpm zero:dev
```

**Terminal 3: Authentication Server**
```bash
pnpm server:dev
```

**Terminal 4: Frontend**
```bash
pnpm dev
```

### Production Mode with Docker

#### Build and Start All Services

```bash
# Build production images
docker compose -f docker-compose.prod.yml build

# Start all services
docker compose -f docker-compose.prod.yml up -d

# View logs
docker compose -f docker-compose.prod.yml logs -f
```

#### Verify Services

```bash
# Check all containers are running
docker compose -f docker-compose.prod.yml ps

# Check health
curl http://localhost:3001/health
curl http://localhost:4848/health
```

### Service Ports

| Service | Development Port | Production Port | Description |
|---------|------------------|-----------------|-------------|
| Frontend | 5173 | 80/443 | React app (Vite) |
| Auth API | 3001 | 3001 | Express server |
| Zero Cache | 4848 | 4848 | Real-time sync |
| PostgreSQL | 5432 | 5432 | Database |

### Monitoring Services

#### Check Server Status

```bash
# Auth server health
curl http://localhost:3001/health

# Expected response:
{
  "success": true,
  "status": "healthy",
  "timestamp": "2025-10-26T10:30:00.000Z",
  "uptime": 123.45,
  "environment": "development",
  "database": {
    "connected": true,
    "pool": {
      "total": 20,
      "idle": 18,
      "waiting": 0
    }
  }
}
```

#### Check Logs

```bash
# Auth server logs (if running with pnpm)
# Output is visible in terminal

# Docker logs
docker compose logs -f auth-server
docker compose logs -f postgres
docker compose logs -f zero-cache
```

---

## Testing Authentication

### Manual Testing with curl

#### 1. Register a New User

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234",
    "name": "Test User"
  }'
```

**Expected Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "email": "test@example.com",
      "name": "Test User",
      "createdAt": "2025-10-26T10:30:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### 2. Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234"
  }'
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "email": "test@example.com",
      "name": "Test User",
      "createdAt": "2025-10-26T10:30:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### 3. Get Current User (Protected Route)

```bash
# Save access token from login response
ACCESS_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "email": "test@example.com",
      "name": "Test User",
      "createdAt": "2025-10-26T10:30:00.000Z"
    }
  }
}
```

#### 4. Refresh Token

```bash
# Save refresh token from login response
REFRESH_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X POST http://localhost:3001/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{
    \"refreshToken\": \"$REFRESH_TOKEN\"
  }"
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### 5. Update Profile

```bash
curl -X PATCH http://localhost:3001/api/auth/profile \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name"
  }'
```

#### 6. Change Password

```bash
curl -X POST http://localhost:3001/api/auth/change-password \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "Test1234",
    "newPassword": "NewTest1234"
  }'
```

#### 7. Logout

```bash
curl -X POST http://localhost:3001/api/auth/logout \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### Testing with the UI

#### 1. Open the Application

```bash
# If running development server
open http://localhost:5173

# Or in browser, navigate to:
http://localhost:5173
```

#### 2. Register a New Account

1. Click "Sign Up" or navigate to registration page
2. Fill in:
   - **Email**: test@example.com
   - **Password**: Test1234 (min 8 chars, 1 uppercase, 1 lowercase, 1 number)
   - **Name**: Test User
3. Click "Register"
4. Should redirect to grocery list with "Welcome, Test User!"

#### 3. Logout and Login

1. Click "Logout" button
2. Should redirect to login page
3. Enter credentials:
   - **Email**: test@example.com
   - **Password**: Test1234
4. Click "Login"
5. Should redirect back to grocery list

#### 4. Test Protected Routes

1. Try accessing `/` when logged out → Should redirect to `/auth/login`
2. Login → Should redirect back to `/`
3. Refresh page → Should stay logged in (token refresh)

#### 5. Test Token Refresh

1. Login to the application
2. Wait 15+ minutes (or modify `JWT_ACCESS_EXPIRY` to `1m` for faster testing)
3. Perform an action (add item, mark as gotten)
4. Token should automatically refresh without requiring re-login

### Automated Testing

#### Run Test Suite

```bash
# Run authentication tests
cd /home/adam/grocery
pnpm test tests/auth/

# Or with specific test files
pnpm test tests/auth/login.test.ts
pnpm test tests/auth/register.test.ts
pnpm test tests/auth/integration.test.ts
```

#### Test Coverage

The test suite includes:
- Registration validation
- Login authentication
- Token refresh flow
- Protected route access
- Error handling
- Rate limiting
- Password validation
- Email validation

---

## Troubleshooting

### Common Issues and Solutions

#### 1. Database Connection Errors

**Error:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solutions:**

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# If not running, start it
pnpm db:up

# Check database logs
docker compose logs postgres

# Verify connection manually
PGPASSWORD=grocery psql -h localhost -U grocery -d grocery_db

# Check environment variables
echo $DATABASE_URL
cat .env | grep DATABASE_URL
```

#### 2. Port Already in Use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::3001
```

**Solutions:**

```bash
# Find process using port 3001
lsof -i :3001

# Kill the process
lsof -ti:3001 | xargs kill -9

# Or use a different port in .env
PORT=3002
```

#### 3. JWT Secret Not Set

**Error:**
```
Error: JWT_ACCESS_SECRET is not defined
```

**Solutions:**

```bash
# Check .env file exists
ls -la .env

# If not, copy from example
cp .env.example .env

# Generate secure secrets
openssl rand -base64 32

# Add to .env
echo "JWT_ACCESS_SECRET=$(openssl rand -base64 32)" >> .env
echo "JWT_REFRESH_SECRET=$(openssl rand -base64 32)" >> .env

# Restart server
pnpm server:dev
```

#### 4. CORS Errors

**Error:**
```
Access to fetch at 'http://localhost:3001' from origin 'http://localhost:5173'
has been blocked by CORS policy
```

**Solutions:**

```bash
# Check CORS_ORIGIN in .env
cat .env | grep CORS_ORIGIN

# Should include frontend URL
CORS_ORIGIN=http://localhost:5173

# Multiple origins (comma-separated)
CORS_ORIGIN=http://localhost:3000,http://localhost:5173

# Restart server after changing
pnpm server:dev
```

#### 5. Token Refresh Loop

**Error:** Browser console shows repeated token refresh requests

**Cause:** Token expiry time is not being returned or is incorrect

**Solutions:**

```bash
# Check JWT expiry settings in .env
cat .env | grep JWT_.*_EXPIRY

# Ensure they're valid
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Check server logs for token generation
# Should show expiry timestamp in response
```

#### 6. Password Validation Failing

**Error:**
```
Password must contain at least one uppercase letter
Password must contain at least one number
```

**Requirements:**
- Minimum 8 characters
- At least 1 uppercase letter (A-Z)
- At least 1 lowercase letter (a-z)
- At least 1 number (0-9)

**Valid examples:**
- `Password1`
- `Test1234`
- `MySecret99`

#### 7. Rate Limiting Issues

**Error:**
```
Too many authentication attempts. Please try again later.
```

**Solutions:**

```bash
# Wait 15 minutes, or adjust rate limits in .env
RATE_LIMIT_WINDOW_MS=900000    # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100    # Increase this

# Or disable rate limiting temporarily (development only!)
# Comment out rate limiter in server/index.ts

# Restart server
pnpm server:dev
```

#### 8. Zero Cache Connection Issues

**Error:** Items not syncing, Zero connection failed

**Solutions:**

```bash
# Check if Zero is running
curl http://localhost:4848/health

# If not running, start it
pnpm zero:dev

# Check VITE_ZERO_SERVER in .env
cat .env | grep VITE_ZERO_SERVER
# Should be: http://localhost:4848

# Check Zero logs
docker compose logs zero-cache

# Verify database connection for Zero
cat .env | grep ZERO_UPSTREAM_DB
```

#### 9. Build Errors

**Error:** TypeScript compilation errors

**Solutions:**

```bash
# Check TypeScript version
pnpm list typescript

# Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Run type check
pnpm type-check

# Check for syntax errors in recent changes
# Fix any type errors reported
```

#### 10. Environment Variables Not Loading

**Error:** Variables showing as undefined

**Solutions:**

```bash
# Verify .env file exists
ls -la .env

# Check file has correct format (no spaces around =)
cat .env

# For client variables, ensure they start with VITE_
# For server variables, they should NOT start with VITE_

# Restart development servers after .env changes
# Stop all processes and run again:
pnpm dev:all
```

### Debugging Tips

#### Enable Debug Logging

```env
# Add to .env
DEBUG_DB=true
NODE_ENV=development
```

#### Check Server Health

```bash
# Server health endpoint
curl http://localhost:3001/health | jq

# Auth service health
curl http://localhost:3001/api/auth/health | jq

# Database query
PGPASSWORD=grocery psql -h localhost -U grocery -d grocery_db -c "SELECT COUNT(*) FROM users;"
```

#### View Database Records

```sql
-- Connect to database
PGPASSWORD=grocery psql -h localhost -U grocery -d grocery_db

-- List all users
SELECT id, email, name, created_at FROM users;

-- List refresh tokens
SELECT user_id, expires_at, revoked FROM refresh_tokens;

-- Check grocery items by user
SELECT u.email, COUNT(g.id) as item_count
FROM users u
LEFT JOIN grocery_items g ON u.id = g.user_id
GROUP BY u.email;
```

---

## Security Checklist for Production

### Before Deploying to Production

#### 1. Environment Variables

- [ ] Generate new, secure JWT secrets using `openssl rand -base64 32`
- [ ] Use different secrets for access and refresh tokens
- [ ] Set `NODE_ENV=production`
- [ ] Update `CORS_ORIGIN` to production domain(s)
- [ ] Use secure database credentials (not default values)
- [ ] Remove or secure `.env` file (never commit to git)
- [ ] Use environment variables from hosting provider (not `.env` file)

#### 2. Database Security

- [ ] Use SSL/TLS for database connections
- [ ] Change default PostgreSQL credentials
- [ ] Restrict database access to specific IP addresses
- [ ] Enable database connection pooling with limits
- [ ] Regular database backups
- [ ] Monitor database performance and logs
- [ ] Use read replicas for scaling (if needed)

#### 3. JWT Configuration

- [ ] Set shorter access token expiry (15-30 minutes)
- [ ] Set reasonable refresh token expiry (7-30 days)
- [ ] Implement token rotation (refresh token changes on use)
- [ ] Store refresh tokens securely (database, not just localStorage)
- [ ] Implement token revocation on logout
- [ ] Consider httpOnly cookies instead of localStorage

#### 4. Rate Limiting

- [ ] Enable rate limiting on all auth endpoints
- [ ] Stricter limits for login/register (5 attempts per 15 min)
- [ ] Monitor and block suspicious IPs
- [ ] Consider IP-based + user-based rate limiting
- [ ] Set up alerts for rate limit violations

#### 5. Password Security

- [ ] Increase bcrypt rounds to 12 (from 10)
- [ ] Enforce strong password requirements
- [ ] Implement password strength meter in UI
- [ ] Consider password breach detection (Have I Been Pwned API)
- [ ] Implement password reset flow with email verification
- [ ] Force password change on first login

#### 6. HTTPS/TLS

- [ ] Use HTTPS for all connections (force redirect from HTTP)
- [ ] Obtain SSL certificate (Let's Encrypt, Cloudflare, etc.)
- [ ] Enable HSTS (Strict-Transport-Security header)
- [ ] Use secure cookies (Secure and SameSite flags)
- [ ] Implement Certificate Pinning (mobile apps)

#### 7. API Security

- [ ] Validate all input data
- [ ] Sanitize user inputs to prevent injection attacks
- [ ] Implement request size limits
- [ ] Add request timeout limits
- [ ] Use security headers (helmet.js)
- [ ] Implement API versioning
- [ ] Add request logging for audit trail

#### 8. Error Handling

- [ ] Don't expose stack traces in production
- [ ] Use generic error messages for auth failures
- [ ] Log errors securely (don't log passwords/tokens)
- [ ] Implement error monitoring (Sentry, Rollbar, etc.)
- [ ] Set up alerts for critical errors

#### 9. Session Management

- [ ] Implement concurrent session limits
- [ ] Add device/session management UI
- [ ] Log login attempts and locations
- [ ] Implement "logout all devices" feature
- [ ] Add session expiry warnings in UI

#### 10. Monitoring and Logging

- [ ] Set up application monitoring (PM2, New Relic, etc.)
- [ ] Log all authentication events
- [ ] Monitor failed login attempts
- [ ] Set up alerts for security events
- [ ] Regular security audit logs review
- [ ] Monitor database query performance

#### 11. Deployment

- [ ] Use a process manager (PM2, systemd)
- [ ] Implement health checks
- [ ] Set up automatic restarts on failure
- [ ] Use a reverse proxy (nginx, Caddy)
- [ ] Implement load balancing (if needed)
- [ ] Set up CDN for static assets
- [ ] Enable gzip compression

#### 12. Docker Security (if using Docker)

- [ ] Use official base images
- [ ] Run containers as non-root user
- [ ] Use multi-stage builds
- [ ] Scan images for vulnerabilities
- [ ] Keep Docker and images updated
- [ ] Limit container resources
- [ ] Use Docker secrets for sensitive data

### Production Deployment Configuration

#### nginx Configuration (Reverse Proxy)

```nginx
# /etc/nginx/sites-available/grocery-app

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server for API
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=10r/m;
    limit_req zone=auth_limit burst=5 nodelay;

    # Proxy to auth server
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# HTTPS server for frontend
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Root directory for built frontend
    root /var/www/grocery-app/dist;
    index index.html;

    # SPA routing - serve index.html for all routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### PM2 Configuration (Process Manager)

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'grocery-auth-server',
      script: './dist/server/index.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: './logs/auth-error.log',
      out_file: './logs/auth-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      max_memory_restart: '500M',
      autorestart: true,
      watch: false
    }
  ]
};
```

#### Docker Production Setup

```bash
# Build production images
docker compose -f docker-compose.prod.yml build

# Start with resource limits
docker compose -f docker-compose.prod.yml up -d

# Monitor logs
docker compose -f docker-compose.prod.yml logs -f

# Set up automatic updates
docker run -d \
  --name watchtower \
  -v /var/run/docker.sock:/var/run/docker.sock \
  containrrr/watchtower \
  --interval 86400
```

### Security Testing

Before going live, run these security checks:

```bash
# 1. Check for known vulnerabilities
pnpm audit

# Fix vulnerabilities
pnpm audit fix

# 2. Test SSL configuration
curl -I https://api.yourdomain.com

# 3. Check security headers
curl -I https://yourdomain.com

# 4. Test rate limiting
for i in {1..10}; do
  curl -X POST https://api.yourdomain.com/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
  echo "Request $i"
done

# 5. Test CORS
curl -H "Origin: https://malicious-site.com" \
  -H "Access-Control-Request-Method: POST" \
  -X OPTIONS https://api.yourdomain.com/api/auth/login

# 6. SQL injection test (should be blocked)
curl -X POST https://api.yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com'\'' OR 1=1--","password":"test"}'
```

### Compliance and Best Practices

- [ ] **GDPR Compliance** (if applicable)
  - User data export functionality
  - Right to be forgotten (account deletion)
  - Clear privacy policy
  - Cookie consent

- [ ] **Data Protection**
  - Encrypt sensitive data at rest
  - Use encrypted backups
  - Implement data retention policies
  - Regular security audits

- [ ] **Incident Response**
  - Document security incident response plan
  - Set up security contact/email
  - Regular backup testing
  - Disaster recovery plan

---

## Additional Resources

### Documentation Files

- **`/docs/AUTHENTICATION.md`** - Authentication implementation guide
- **`/docs/API-AUTH.md`** - Complete API endpoint documentation
- **`README.md`** - Main project documentation
- **`QUICK_START.md`** - Quick setup guide
- **`SERVER_SETUP.md`** - Server configuration details

### API Endpoints Reference

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user
- `PATCH /api/auth/profile` - Update user profile
- `POST /api/auth/change-password` - Change password
- `GET /api/auth/health` - Auth service health check
- `GET /health` - Server health check

### Support and Help

- Check existing documentation in `/docs` folder
- Review example code in `/src/examples`
- Check server logs for errors
- Review database schema in `/server/db/schema.sql`

---

## Conclusion

You now have a fully functional JWT-based authentication system! This guide covered:

1. Installing all dependencies
2. Configuring environment variables
3. Setting up the database
4. Running development and production servers
5. Testing authentication flows
6. Troubleshooting common issues
7. Securing the application for production

### Next Steps

1. Complete the security checklist
2. Set up monitoring and logging
3. Implement additional features (password reset, email verification, 2FA)
4. Deploy to production
5. Monitor and maintain the application

### Quick Command Reference

```bash
# Development
pnpm install              # Install dependencies
pnpm dev:all              # Start all services
pnpm db:up                # Start database
pnpm server:dev           # Start auth server
pnpm dev                  # Start frontend

# Production
docker compose -f docker-compose.prod.yml up -d  # Start production

# Testing
curl http://localhost:3001/health                # Health check
pnpm test tests/auth/                           # Run tests

# Database
pnpm db:init              # Initialize schema
PGPASSWORD=grocery psql -h localhost -U grocery -d grocery_db  # Connect
```

Good luck with your authentication implementation!
