# Server Setup Guide

Complete guide for setting up and running the Node.js/Express backend server for the Grocery List authentication system.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Configuration](#environment-configuration)
- [Running the Server](#running-the-server)
- [API Endpoints](#api-endpoints)
- [Development](#development)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)

## Architecture Overview

The server is built with the following stack:

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js 5.x
- **Database**: PostgreSQL with pg driver
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt
- **Validation**: Custom middleware + express-validator
- **Rate Limiting**: express-rate-limit
- **Real-time Sync**: Zero/Replicache integration

### Directory Structure

```
server/
├── index.ts                    # Main server entry point
├── config/
│   ├── env.ts                 # Environment variable configuration
│   └── db.ts                  # Database connection pool setup
├── middleware/
│   ├── errorHandler.ts        # Centralized error handling
│   └── validateRequest.ts     # Request validation middleware
├── auth/
│   ├── routes.ts              # Authentication routes
│   ├── controller.ts          # Authentication business logic
│   ├── middleware.ts          # Auth middleware (JWT verification)
│   └── utils.ts               # Auth utility functions
├── db/
│   ├── schema.sql             # Database schema
│   └── pool.ts                # Legacy pool (now in config/db.ts)
└── types/
    └── index.ts               # TypeScript type definitions
```

## Prerequisites

Before setting up the server, ensure you have:

- **Node.js**: v18.x or higher
- **pnpm**: v8.x or higher (or npm/yarn)
- **PostgreSQL**: v14.x or higher
- **Docker** (optional, for running PostgreSQL in container)

## Installation

### 1. Install Dependencies

All dependencies are already configured in `package.json`. To install:

```bash
pnpm install
```

### Dependencies Installed:

**Production Dependencies:**
- `express`: ^5.1.0 - Web framework
- `pg`: ^8.16.3 - PostgreSQL client
- `cors`: ^2.8.5 - CORS middleware
- `jsonwebtoken`: ^9.0.2 - JWT implementation
- `bcrypt`: ^6.0.0 - Password hashing
- `express-rate-limit`: ^8.1.0 - Rate limiting
- `express-validator`: ^7.3.0 - Request validation
- `dotenv`: ^16.4.5 - Environment variables
- `nanoid`: ^5.0.7 - ID generation

**Development Dependencies:**
- `typescript`: ^5.5.3 - TypeScript compiler
- `ts-node`: ^10.9.2 - TypeScript execution
- `nodemon`: ^3.1.10 - Auto-reload during development
- `@types/express`: ^5.0.4 - TypeScript types
- `@types/pg`: ^8.15.5 - PostgreSQL types
- `@types/jsonwebtoken`: ^9.0.10 - JWT types
- `@types/bcrypt`: ^6.0.0 - bcrypt types
- `@types/cors`: ^2.8.19 - CORS types

### 2. Database Setup

#### Using Docker (Recommended for Development):

```bash
# Start PostgreSQL container
pnpm db:up

# Initialize database schema
pnpm db:init
```

#### Manual PostgreSQL Setup:

```sql
-- Create database
CREATE DATABASE grocery_db;

-- Create user
CREATE USER grocery WITH PASSWORD 'grocery';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE grocery_db TO grocery;

-- Run schema
psql -h localhost -U grocery -d grocery_db -f server/db/schema.sql
```

## Environment Configuration

### 1. Create .env File

Copy the example environment file:

```bash
cp .env.example .env
```

### 2. Configure Environment Variables

Edit `.env` with your configuration:

```bash
# ============================================================================
# SERVER CONFIGURATION
# ============================================================================

# Server Port (default: 3001)
PORT=3001

# Environment (development, production, test)
NODE_ENV=development

# CORS Origin (frontend URL)
CORS_ORIGIN=http://localhost:3000

# ============================================================================
# DATABASE CONFIGURATION
# ============================================================================

# Database Connection
DB_HOST=localhost
DB_PORT=5432
DB_NAME=grocery_db
DB_USER=grocery
DB_PASSWORD=grocery

# Connection Pool Settings
DB_MAX_CONNECTIONS=20
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=2000

# ============================================================================
# JWT CONFIGURATION
# ============================================================================

# IMPORTANT: Generate secure secrets for production!
# Generate with: openssl rand -base64 32

# Access Token Secret
JWT_ACCESS_SECRET=your-secret-access-token-key-change-in-production

# Refresh Token Secret (should be different from access secret)
JWT_REFRESH_SECRET=your-secret-refresh-token-key-change-in-production

# Token Expiration Times
JWT_ACCESS_EXPIRY=15m      # 15 minutes
JWT_REFRESH_EXPIRY=7d      # 7 days

# ============================================================================
# SECURITY CONFIGURATION
# ============================================================================

# Bcrypt Hashing Rounds (10-12 recommended)
BCRYPT_ROUNDS=10

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000      # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100      # 100 requests per window

# ============================================================================
# ZERO CACHE CONFIGURATION
# ============================================================================

VITE_ZERO_SERVER=http://localhost:4848
ZERO_UPSTREAM_DB=postgresql://grocery:grocery@localhost:5432/grocery_db
ZERO_REPLICA_FILE=/tmp/zero-replica.db
ZERO_AUTH_SECRET=dev-secret-key-change-in-production

# ============================================================================
# DEBUG CONFIGURATION (Optional)
# ============================================================================

# Enable detailed database query logging
DEBUG_DB=false
```

### 3. Generate Secure Secrets (Production)

For production, generate secure random secrets:

```bash
# Generate JWT Access Secret
openssl rand -base64 32

# Generate JWT Refresh Secret
openssl rand -base64 32

# Generate Zero Auth Secret
openssl rand -base64 32
```

## Running the Server

### Development Mode

Run the server with auto-reload on file changes:

```bash
# Start server only
pnpm server:dev

# Start database + server
pnpm db:up && pnpm server:dev

# Start everything (database + zero + server + frontend)
pnpm dev:all
```

The server will start on `http://localhost:3001` (or the port specified in `.env`).

### Production Mode

Build and run the production server:

```bash
# Build TypeScript to JavaScript
pnpm server:build

# Start production server
pnpm server:start
```

## API Endpoints

### Health Check

```bash
GET /health
```

Returns server health status and database connection info.

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2025-10-26T12:00:00.000Z",
  "uptime": 123.456,
  "environment": "development",
  "database": {
    "connected": true,
    "pool": {
      "total": 1,
      "idle": 1,
      "waiting": 0
    }
  },
  "memory": {
    "used": 45,
    "total": 128,
    "unit": "MB"
  }
}
```

### API Documentation

```bash
GET /api
```

Returns list of available endpoints.

### Authentication Endpoints

All authentication endpoints are prefixed with `/api/auth`:

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user (requires auth)
- `PATCH /api/auth/profile` - Update user profile (requires auth)
- `POST /api/auth/change-password` - Change password (requires auth)
- `GET /api/auth/health` - Auth service health check

See [AUTH_README.md](./AUTH_README.md) for detailed API documentation.

## Development

### TypeScript Configuration

The server uses `tsconfig.server.json` for TypeScript compilation:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist/server",
    "rootDir": "./server",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["server/**/*"],
  "exclude": ["node_modules", "dist", "src"]
}
```

### Code Structure

#### 1. Configuration Layer (`config/`)

- **env.ts**: Centralizes all environment variable access with validation
- **db.ts**: PostgreSQL connection pool with monitoring and health checks

#### 2. Middleware Layer (`middleware/`)

- **errorHandler.ts**: Centralized error handling with custom error classes
- **validateRequest.ts**: Reusable validation functions for requests

#### 3. Authentication Layer (`auth/`)

- **routes.ts**: Route definitions
- **controller.ts**: Business logic
- **middleware.ts**: JWT verification and auth checks
- **utils.ts**: Helper functions (token generation, password hashing)

### Adding New Routes

1. Create route file in appropriate directory
2. Add route to `server/index.ts`
3. Use middleware for validation and authentication

Example:

```typescript
import express from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { validateRequired } from '../middleware/validateRequest';
import { authenticateToken } from '../auth/middleware';

const router = express.Router();

router.post(
  '/endpoint',
  authenticateToken,           // Require authentication
  validateRequired(['field']), // Validate request
  asyncHandler(async (req, res) => {
    // Your logic here
    res.json({ success: true });
  })
);

export default router;
```

### Error Handling

Use custom error classes from `middleware/errorHandler.ts`:

```typescript
import {
  ValidationError,
  AuthenticationError,
  NotFoundError,
  ConflictError
} from '../middleware/errorHandler';

// Throw errors - they'll be caught by global error handler
throw new ValidationError('Invalid input', { field: 'email' });
throw new AuthenticationError('Invalid credentials');
throw new NotFoundError('User not found');
throw new ConflictError('Email already exists');
```

### Database Queries

Use helper functions from `config/db.ts`:

```typescript
import { query, queryOne, transaction } from '../config/db';

// Simple query
const users = await query<User>('SELECT * FROM users WHERE active = $1', [true]);

// Single row query
const user = await queryOne<User>('SELECT * FROM users WHERE id = $1', [userId]);

// Transaction
await transaction(async (client) => {
  await client.query('INSERT INTO users ...');
  await client.query('INSERT INTO profiles ...');
});
```

## Production Deployment

### 1. Environment Setup

1. Set `NODE_ENV=production`
2. Generate secure secrets for all `*_SECRET` variables
3. Use strong database password
4. Configure CORS_ORIGIN to your production domain
5. Enable SSL for database connection

### 2. Build Application

```bash
pnpm server:build
```

### 3. Security Checklist

- [ ] All secrets changed from default values
- [ ] Database uses SSL connection
- [ ] CORS restricted to production domain
- [ ] Rate limiting configured appropriately
- [ ] Environment variables secured (not in version control)
- [ ] Database credentials rotated regularly
- [ ] HTTPS enabled for all connections
- [ ] Security headers configured (already done in code)

### 4. Monitoring

Monitor these endpoints:

- `/health` - Overall server health
- Database connection pool stats
- Error logs
- Rate limit violations

### 5. Performance Optimization

- Enable database connection pooling (already configured)
- Use CDN for static assets
- Enable gzip compression
- Configure proper indexes on database tables
- Use read replicas for heavy read operations

## Troubleshooting

### Database Connection Issues

**Error**: "Database connection failed"

**Solutions**:
1. Check PostgreSQL is running: `docker ps` or `pg_isready`
2. Verify database credentials in `.env`
3. Check database exists: `psql -l`
4. Test connection: `psql -h localhost -U grocery -d grocery_db`

### Port Already in Use

**Error**: "Port 3001 already in use"

**Solutions**:
1. Change PORT in `.env`
2. Kill process using port: `lsof -ti:3001 | xargs kill`
3. Use different port temporarily

### TypeScript Compilation Errors

**Error**: TypeScript compilation fails

**Solutions**:
1. Clear build cache: `rm -rf dist/`
2. Reinstall dependencies: `rm -rf node_modules && pnpm install`
3. Check TypeScript version: `pnpm list typescript`
4. Verify tsconfig.server.json is correct

### JWT Token Issues

**Error**: "Invalid token" or "Token expired"

**Solutions**:
1. Check JWT secrets match in `.env`
2. Verify token expiration times are reasonable
3. Ensure frontend sends token in Authorization header
4. Clear browser storage and login again

### CORS Errors

**Error**: "CORS policy: No 'Access-Control-Allow-Origin' header"

**Solutions**:
1. Check CORS_ORIGIN matches frontend URL
2. Ensure credentials: true in frontend requests
3. Verify frontend URL includes protocol (http/https)
4. Check for trailing slashes in URLs

### Rate Limiting Issues

**Error**: "Too many requests"

**Solutions**:
1. Increase RATE_LIMIT_MAX_REQUESTS in `.env`
2. Adjust RATE_LIMIT_WINDOW_MS
3. Implement user-specific rate limits
4. Add IP whitelist for development

## Additional Resources

- [Authentication Guide](./AUTHENTICATION_GUIDE.md) - Complete auth implementation guide
- [API Documentation](./AUTH_README.md) - Detailed API endpoint documentation
- [Database Schema](./server/db/schema.sql) - Database structure
- [Implementation Plan](./IMPLEMENTATION_PLAN.md) - Development roadmap

## Support

For issues or questions:

1. Check this documentation
2. Review error logs in console
3. Check `/health` endpoint for system status
4. Review environment configuration
5. Verify database connection and schema

## License

This project is part of the Grocery List application.
