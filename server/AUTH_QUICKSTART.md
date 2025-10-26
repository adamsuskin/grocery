# Authentication API Quick Start Guide

Get the authentication server up and running in 5 minutes!

## Prerequisites

- Node.js 20+
- pnpm installed
- Docker (for PostgreSQL)

## Quick Setup

### 1. Start PostgreSQL Database

```bash
pnpm db:up
```

Wait a few seconds for PostgreSQL to initialize.

### 2. Initialize Database Schema

```bash
# Option 1: Using npm script
PGPASSWORD=grocery psql -h localhost -U grocery -d grocery_db -f server/db/schema.sql

# Option 2: Manual
psql -h localhost -U grocery -d grocery_db
# Then paste contents of server/db/schema.sql
```

### 3. Verify Environment Variables

Check that `.env` file exists with these values:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=grocery_db
DB_USER=grocery
DB_PASSWORD=grocery

# JWT - CHANGE THESE IN PRODUCTION!
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Server
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

### 4. Start the Auth Server

```bash
pnpm server:dev
```

You should see:
```
=============================================
  Grocery List API Server
=============================================
  Environment: development
  Port: 3001
  URL: http://localhost:3001
  Health: http://localhost:3001/health
  API Docs: http://localhost:3001/api
=============================================

Server is ready to accept connections
```

### 5. Test the Server

```bash
# Health check
curl http://localhost:3001/health

# Should return:
# {
#   "success": true,
#   "message": "Server is running",
#   "timestamp": "2025-10-26T..."
# }
```

## Test Authentication Flow

### 1. Register a User

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123",
    "name": "Test User"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "...",
      "email": "test@example.com",
      "name": "Test User",
      "created_at": "..."
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123"
  }'
```

**Save the accessToken from the response!**

### 3. Get Current User (Protected Endpoint)

```bash
# Replace YOUR_ACCESS_TOKEN with the token from login/register
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "test@example.com",
      "name": "Test User",
      "created_at": "..."
    }
  }
}
```

### 4. Refresh Token

```bash
# Replace YOUR_REFRESH_TOKEN with the refreshToken from login/register
curl -X POST http://localhost:3001/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

## Start Everything Together

To run the full stack (database + zero-cache + auth server + frontend):

```bash
pnpm dev:all
```

This starts:
- PostgreSQL (port 5432)
- Zero-cache server (port 4848)
- Auth API server (port 3001)
- Frontend dev server (port 3000)

## Common Issues

### Database Connection Error

**Problem:** `Database connection failed`

**Solution:**
```bash
# Check if PostgreSQL is running
docker ps

# If not, start it
pnpm db:up

# Verify connection
psql -h localhost -U grocery -d grocery_db -c "SELECT 1"
```

### Port Already in Use

**Problem:** `Port 3001 already in use`

**Solution:**
```bash
# Find and kill the process
lsof -ti:3001 | xargs kill -9

# Or change PORT in .env
```

### Schema Not Initialized

**Problem:** `relation "users" does not exist`

**Solution:**
```bash
# Run the schema file
PGPASSWORD=grocery psql -h localhost -U grocery -d grocery_db -f server/db/schema.sql
```

## Next Steps

1. **Read the full documentation:** `/home/adam/grocery/server/README.md`
2. **Test all endpoints:** Use Postman or the provided cURL commands
3. **Integrate with frontend:** Use the auth API from your React app
4. **Security:** Change JWT secrets before deploying to production
5. **Production:** Follow the deployment checklist in README.md

## API Endpoints Summary

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get tokens
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout (client-side)
- `GET /api/auth/me` - Get current user (protected)
- `PATCH /api/auth/profile` - Update profile (protected)
- `POST /api/auth/change-password` - Change password (protected)
- `GET /api/auth/health` - Health check

## Development Commands

```bash
# Start database
pnpm db:up

# Stop database
pnpm db:down

# Initialize database
PGPASSWORD=grocery psql -h localhost -U grocery -d grocery_db -f server/db/schema.sql

# Start auth server (development)
pnpm server:dev

# Build auth server (production)
pnpm server:build

# Start auth server (production)
pnpm server:start

# Start everything
pnpm dev:all
```

## Environment Variables

All environment variables are in `.env` file. Never commit real secrets to git!

**Required:**
- `DB_*` - Database connection
- `JWT_SECRET` - Access token secret
- `JWT_REFRESH_SECRET` - Refresh token secret
- `PORT` - Server port
- `CORS_ORIGIN` - Allowed origins

**Optional:**
- `JWT_EXPIRES_IN` - Access token expiry (default: 15m)
- `JWT_REFRESH_EXPIRES_IN` - Refresh token expiry (default: 7d)
- `NODE_ENV` - Environment mode (default: development)

## Success! 🎉

Your authentication API is now running! Test it with the cURL commands above or integrate it with your frontend application.

For detailed documentation, see `/home/adam/grocery/server/README.md`
