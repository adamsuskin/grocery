# Backend Server Setup - Complete

The Node.js/Express backend server for the authentication system has been successfully set up with a comprehensive, production-ready architecture.

## Files Created

### Configuration Layer

#### 1. `/home/adam/grocery/server/config/env.ts`
Centralizes all environment variable management with validation.

**Key Features:**
- Loads environment variables from `.env` file
- Provides typed configuration objects
- Validates critical settings (especially for production)
- Organized by concern (server, database, JWT, security, zero)

**Usage Example:**
```typescript
import { serverConfig, dbConfig, jwtConfig } from './config/env';

console.log(`Server running on port ${serverConfig.port}`);
console.log(`Database: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
console.log(`JWT expiry: ${jwtConfig.accessTokenExpiry}`);
```

#### 2. `/home/adam/grocery/server/config/db.ts`
PostgreSQL connection pool with comprehensive features.

**Key Features:**
- Connection pooling for performance
- Health monitoring and statistics
- Transaction support with automatic rollback
- Helper functions for common operations
- Graceful shutdown handling
- Debug logging support

**Usage Example:**
```typescript
import { query, queryOne, transaction } from './config/db';

// Simple query
const users = await query<User>('SELECT * FROM users');

// Single row
const user = await queryOne<User>('SELECT * FROM users WHERE id = $1', [userId]);

// Transaction
await transaction(async (client) => {
  await client.query('INSERT INTO users ...');
  await client.query('INSERT INTO profiles ...');
});
```

### Middleware Layer

#### 3. `/home/adam/grocery/server/middleware/errorHandler.ts`
Centralized error handling with custom error classes.

**Custom Error Classes:**
- `AppError` - Base error class (500)
- `ValidationError` - Validation errors (400)
- `AuthenticationError` - Auth required (401)
- `AuthorizationError` - Permission denied (403)
- `NotFoundError` - Resource not found (404)
- `ConflictError` - Resource conflict (409)
- `DatabaseError` - Database errors (500)

**Usage Example:**
```typescript
import { ValidationError, NotFoundError } from '../middleware/errorHandler';

// In route handler
if (!email) {
  throw new ValidationError('Email is required');
}

if (!user) {
  throw new NotFoundError('User not found');
}
```

#### 4. `/home/adam/grocery/server/middleware/validateRequest.ts`
Comprehensive request validation middleware.

**Validation Features:**
- Email format validation
- Password strength (8+ chars, mixed case, numbers)
- Username validation (3-20 chars, alphanumeric)
- Required fields
- UUID format
- Request body size

**Usage Example:**
```typescript
import { validateRegistration, validateLogin } from '../middleware/validateRequest';

router.post('/register', validateRegistration(), controller.register);
router.post('/login', validateLogin(), controller.login);
```

### Updated Files

#### 5. `/home/adam/grocery/server/index.ts`
Main server entry point with full Express setup.

**Key Improvements:**
- Uses new config modules
- Environment validation on startup
- Rate limiting with configuration
- Enhanced health check endpoint
- Better error handling
- Request logging in development
- Graceful shutdown

**Features:**
- CORS with credentials support
- Security headers
- Rate limiting (100 req/15min by default)
- Database health monitoring
- Memory usage tracking
- API documentation endpoint

#### 6. `/home/adam/grocery/server/auth/utils.ts`
Authentication utilities updated to use new config.

**Changes:**
- Imports from `config/env.ts`
- Uses `jwtConfig` for secrets and expiration
- Uses `securityConfig` for bcrypt rounds
- No more hardcoded values

#### 7. `/home/adam/grocery/.env.example`
Complete environment variable template.

**New Variables:**
- `JWT_ACCESS_SECRET` - Access token secret
- `JWT_REFRESH_SECRET` - Refresh token secret
- `JWT_ACCESS_EXPIRY` - Access token lifetime (15m)
- `JWT_REFRESH_EXPIRY` - Refresh token lifetime (7d)
- `DB_MAX_CONNECTIONS` - Pool size (20)
- `DB_IDLE_TIMEOUT` - Idle timeout (30000ms)
- `DB_CONNECTION_TIMEOUT` - Connection timeout (2000ms)
- `BCRYPT_ROUNDS` - Hashing rounds (10)
- `RATE_LIMIT_WINDOW_MS` - Rate limit window (900000ms)
- `RATE_LIMIT_MAX_REQUESTS` - Max requests (100)
- `DEBUG_DB` - Database debug logging (false)

## Complete File Structure

```
/home/adam/grocery/
├── .env.example                          # Complete env template
├── package.json                          # All dependencies installed
├── tsconfig.server.json                  # Server TypeScript config
├── docker-compose.yml                    # PostgreSQL container
│
├── server/
│   ├── index.ts                          # Main entry point (updated)
│   │
│   ├── config/                           # NEW: Configuration layer
│   │   ├── env.ts                        # Environment variables
│   │   └── db.ts                         # Database connection
│   │
│   ├── middleware/                       # NEW: Middleware layer
│   │   ├── errorHandler.ts              # Error handling
│   │   └── validateRequest.ts           # Request validation
│   │
│   ├── auth/                             # Authentication layer
│   │   ├── routes.ts                     # Route definitions
│   │   ├── controller.ts                 # Business logic
│   │   ├── middleware.ts                 # Auth middleware
│   │   └── utils.ts                      # Utilities (updated)
│   │
│   ├── db/                               # Database
│   │   ├── schema.sql                    # Database schema
│   │   └── pool.ts                       # Legacy (can remove)
│   │
│   └── types/                            # TypeScript types
│       └── index.ts                      # Type definitions
│
└── docs/                                 # Documentation
    ├── SERVER_SETUP.md                   # Complete setup guide
    ├── SERVER_FILES_SUMMARY.md           # File summary
    ├── BACKEND_COMPLETE.md               # This file
    ├── AUTH_README.md                    # API documentation
    └── AUTHENTICATION_GUIDE.md           # Auth implementation guide
```

## Dependencies

All dependencies are already installed in `package.json`:

### Production Dependencies
```json
{
  "express": "^5.1.0",
  "pg": "^8.16.3",
  "cors": "^2.8.5",
  "jsonwebtoken": "^9.0.2",
  "bcrypt": "^6.0.0",
  "express-rate-limit": "^8.1.0",
  "express-validator": "^7.3.0",
  "dotenv": "^16.4.5",
  "nanoid": "^5.0.7"
}
```

### Development Dependencies
```json
{
  "typescript": "^5.5.3",
  "ts-node": "^10.9.2",
  "nodemon": "^3.1.10",
  "@types/express": "^5.0.4",
  "@types/pg": "^8.15.5",
  "@types/jsonwebtoken": "^9.0.10",
  "@types/bcrypt": "^6.0.0",
  "@types/cors": "^2.8.19"
}
```

## Quick Start Guide

### 1. Environment Setup

```bash
# Copy the environment template
cp .env.example .env

# Edit with your configuration
nano .env
```

**Minimum Required Changes:**
```bash
# For development, these defaults work fine:
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=grocery_db
DB_USER=grocery
DB_PASSWORD=grocery

# Keep the JWT secrets as-is for development
# For production, generate new secrets:
# openssl rand -base64 32
```

### 2. Database Setup

```bash
# Start PostgreSQL (Docker)
pnpm db:up

# Initialize database schema
pnpm db:init

# Verify database is running
docker ps
```

### 3. Start Server

```bash
# Development mode (auto-reload)
pnpm server:dev

# Or start everything
pnpm dev:all  # Starts database + zero + server + frontend
```

### 4. Verify Server is Running

```bash
# Check health
curl http://localhost:3001/health

# Response should be:
{
  "success": true,
  "status": "healthy",
  "timestamp": "2025-10-26T...",
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

### 5. Test Authentication

```bash
# Register a new user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234",
    "username": "testuser"
  }'

# Response:
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "...",
      "email": "test@example.com",
      "name": "testuser",
      "created_at": "2025-10-26T..."
    },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc..."
    }
  }
}

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234"
  }'

# Get current user (with token)
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## API Endpoints

### Public Endpoints

```bash
GET  /health                      # Server health check
GET  /api                         # API documentation
POST /api/auth/register           # Register new user
POST /api/auth/login              # Login user
POST /api/auth/refresh            # Refresh access token
GET  /api/auth/health             # Auth service health
```

### Protected Endpoints (Require JWT)

```bash
GET   /api/auth/me                # Get current user
PATCH /api/auth/profile           # Update profile
POST  /api/auth/change-password   # Change password
POST  /api/auth/logout            # Logout (clear tokens)
```

## Key Features Implemented

### 1. Security
- JWT authentication with access & refresh tokens
- Bcrypt password hashing (configurable rounds)
- Rate limiting (100 requests per 15 minutes)
- CORS protection with credentials support
- Security headers (XSS, Frame, Content-Type)
- SQL injection protection (parameterized queries)
- Environment validation for production

### 2. Error Handling
- Centralized error middleware
- Custom error classes for different scenarios
- Consistent error response format
- Stack traces only in development
- JWT error handling (expired, invalid)
- Database error handling

### 3. Validation
- Email format validation
- Password strength (8+ chars, uppercase, lowercase, number)
- Username validation (3-20 chars, alphanumeric + underscore)
- Required field validation
- UUID format validation
- Request body size limits

### 4. Database
- Connection pooling (max 20 connections)
- Health monitoring with statistics
- Transaction support with auto-rollback
- Query helper functions
- Graceful shutdown
- Debug logging option

### 5. Monitoring
- Health check endpoint with detailed stats
- Database connection monitoring
- Memory usage tracking
- Connection pool statistics
- Request logging (development)
- Error logging

### 6. Development Experience
- Hot reload with nodemon
- TypeScript with strict mode
- Detailed development logging
- API documentation endpoint
- Environment validation
- Clear error messages

## Configuration Reference

### Environment Variables

**Server Configuration:**
```bash
PORT=3001                          # Server port
NODE_ENV=development               # Environment mode
CORS_ORIGIN=http://localhost:3000  # Allowed CORS origin
```

**Database Configuration:**
```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=grocery_db
DB_USER=grocery
DB_PASSWORD=grocery
DB_MAX_CONNECTIONS=20              # Connection pool size
DB_IDLE_TIMEOUT=30000              # 30 seconds
DB_CONNECTION_TIMEOUT=2000         # 2 seconds
```

**JWT Configuration:**
```bash
JWT_ACCESS_SECRET=your-secret-access-token-key
JWT_REFRESH_SECRET=your-secret-refresh-token-key
JWT_ACCESS_EXPIRY=15m              # 15 minutes
JWT_REFRESH_EXPIRY=7d              # 7 days
```

**Security Configuration:**
```bash
BCRYPT_ROUNDS=10                   # Password hashing rounds
RATE_LIMIT_WINDOW_MS=900000        # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100        # 100 requests per window
```

**Debug Configuration:**
```bash
DEBUG_DB=false                     # Enable DB query logging
```

### Token Expiration

**Access Tokens (JWT_ACCESS_EXPIRY):**
- Default: 15 minutes
- Recommended: 15m - 1h
- Used for API requests

**Refresh Tokens (JWT_REFRESH_EXPIRY):**
- Default: 7 days
- Recommended: 7d - 30d
- Used to get new access tokens

### Rate Limiting

**Default Settings:**
- Window: 15 minutes (900000ms)
- Max requests: 100 per window
- Per IP address
- Health check endpoint excluded

**Customize in .env:**
```bash
RATE_LIMIT_WINDOW_MS=900000        # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100        # 100 requests
```

## Production Deployment

### 1. Security Checklist

- [ ] Generate secure secrets: `openssl rand -base64 32`
- [ ] Set `NODE_ENV=production`
- [ ] Change all `*_SECRET` variables
- [ ] Use strong database password
- [ ] Configure `CORS_ORIGIN` to production domain
- [ ] Enable database SSL connection
- [ ] Secure environment variables (use secrets manager)
- [ ] Enable HTTPS for all connections
- [ ] Review rate limiting settings
- [ ] Configure proper firewall rules

### 2. Generate Production Secrets

```bash
# Generate JWT Access Secret
openssl rand -base64 32

# Generate JWT Refresh Secret
openssl rand -base64 32

# Generate Zero Auth Secret
openssl rand -base64 32
```

### 3. Build for Production

```bash
# Build TypeScript
pnpm server:build

# Start production server
NODE_ENV=production pnpm server:start
```

### 4. Environment Variables for Production

```bash
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://your-domain.com

# Use strong, random secrets
JWT_ACCESS_SECRET=<generated-secret>
JWT_REFRESH_SECRET=<generated-secret>
ZERO_AUTH_SECRET=<generated-secret>

# Use secure database credentials
DB_PASSWORD=<strong-password>

# Adjust token expiration as needed
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Adjust rate limiting for production traffic
RATE_LIMIT_MAX_REQUESTS=1000
```

### 5. Monitoring

Monitor these aspects in production:

- `/health` endpoint status
- Database connection pool stats
- Error rates and logs
- Rate limit violations
- Memory usage
- Response times

## Troubleshooting

### Common Issues

**1. Database Connection Failed**
```bash
# Check PostgreSQL is running
docker ps

# Or for system PostgreSQL
pg_isready

# Verify credentials
psql -h localhost -U grocery -d grocery_db

# Check logs
docker logs <postgres-container-id>
```

**2. Port Already in Use**
```bash
# Find process using port
lsof -i :3001

# Kill the process
kill -9 <PID>

# Or change PORT in .env
PORT=3002
```

**3. JWT Token Errors**
```bash
# Verify secrets match in .env
# Ensure no extra spaces or quotes
# Restart server after changing .env

# Test token generation
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234"}'
```

**4. CORS Errors**
```bash
# Verify CORS_ORIGIN matches frontend URL exactly
CORS_ORIGIN=http://localhost:3000

# Include protocol (http/https)
# No trailing slash
# Match port number
```

**5. TypeScript Compilation Errors**
```bash
# Clear build cache
rm -rf dist/

# Reinstall dependencies
rm -rf node_modules
pnpm install

# Build again
pnpm server:build
```

## NPM Scripts Reference

```bash
# Development
pnpm server:dev         # Start server with auto-reload
pnpm dev:all            # Start database + zero + server + frontend

# Build
pnpm server:build       # Build TypeScript to JavaScript
pnpm type-check         # Type check without building

# Production
pnpm server:start       # Start production server (after build)

# Database
pnpm db:up              # Start PostgreSQL container
pnpm db:down            # Stop PostgreSQL container
pnpm db:init            # Initialize database schema
```

## Next Steps

1. **Review Documentation**
   - Read [SERVER_SETUP.md](/home/adam/grocery/SERVER_SETUP.md) for detailed setup instructions
   - Review [AUTH_README.md](/home/adam/grocery/AUTH_README.md) for API documentation
   - Check [AUTHENTICATION_GUIDE.md](/home/adam/grocery/AUTHENTICATION_GUIDE.md) for integration guide

2. **Test the API**
   - Use the curl examples above
   - Test all authentication endpoints
   - Verify error handling
   - Check rate limiting

3. **Integrate with Frontend**
   - Update frontend API client
   - Implement token storage
   - Add auth state management
   - Handle token refresh

4. **Deploy to Production**
   - Follow production checklist
   - Set up monitoring
   - Configure backups
   - Test thoroughly

## Support & Documentation

- **Setup Guide**: [SERVER_SETUP.md](/home/adam/grocery/SERVER_SETUP.md)
- **API Docs**: [AUTH_README.md](/home/adam/grocery/AUTH_README.md)
- **Auth Guide**: [AUTHENTICATION_GUIDE.md](/home/adam/grocery/AUTHENTICATION_GUIDE.md)
- **File Summary**: [SERVER_FILES_SUMMARY.md](/home/adam/grocery/SERVER_FILES_SUMMARY.md)

## Summary

The backend server is now complete with:

- Comprehensive configuration management
- Production-ready security features
- Robust error handling
- Complete input validation
- Database connection pooling
- Health monitoring
- Rate limiting
- JWT authentication
- TypeScript support
- Development tooling
- Complete documentation

All files are in place, dependencies are installed, and the server is ready to run!
