# Server Backend Setup - File Summary

Complete Node.js/Express backend server setup for the authentication system has been created.

## Created Files

### 1. `/home/adam/grocery/server/config/env.ts`
**Purpose**: Centralized environment variable configuration with validation

**Features**:
- Loads environment variables from `.env` file using dotenv
- Exports typed configuration objects for all server settings
- Validates critical environment variables (especially for production)
- Provides sensible defaults for development

**Exports**:
- `serverConfig` - Server settings (port, environment, CORS)
- `dbConfig` - Database connection settings
- `jwtConfig` - JWT token configuration
- `securityConfig` - Security settings (bcrypt rounds, rate limiting)
- `zeroConfig` - Zero/Replicache configuration
- `validateEnv()` - Environment validation function
- `appConfig` - Combined configuration object

### 2. `/home/adam/grocery/server/config/db.ts`
**Purpose**: PostgreSQL connection pool with comprehensive error handling and monitoring

**Features**:
- Connection pooling with configurable settings
- Connection health monitoring
- Graceful shutdown handling
- Helper functions for queries and transactions
- Event handlers for connection lifecycle
- SSL support for production
- Debug logging (optional)

**Exports**:
- `pool` - PostgreSQL connection pool instance
- `testConnection()` - Test database connectivity
- `query<T>()` - Execute queries with automatic connection management
- `queryOne<T>()` - Execute query and return single row
- `transaction<T>()` - Transaction wrapper with automatic rollback
- `isHealthy()` - Check database health
- `getPoolStats()` - Get connection pool statistics
- `closePool()` - Gracefully close all connections

### 3. `/home/adam/grocery/server/middleware/errorHandler.ts`
**Purpose**: Centralized error handling with custom error classes

**Features**:
- Custom error classes for different HTTP status codes
- Consistent error response format
- Stack trace in development, hidden in production
- Handles JWT and validation errors
- Async error wrapper for route handlers
- Unhandled promise rejection and uncaught exception handlers

**Exports**:
- `AppError` - Base error class (500)
- `ValidationError` - Validation errors (400)
- `AuthenticationError` - Auth required errors (401)
- `AuthorizationError` - Permission errors (403)
- `NotFoundError` - Resource not found errors (404)
- `ConflictError` - Resource conflict errors (409)
- `DatabaseError` - Database operation errors (500)
- `errorHandler` - Main error middleware
- `notFoundHandler` - 404 handler
- `asyncHandler` - Async route wrapper
- `initializeErrorHandlers()` - Setup global handlers

### 4. `/home/adam/grocery/server/middleware/validateRequest.ts`
**Purpose**: Reusable request validation middleware

**Features**:
- Required field validation
- Email format validation
- Password strength validation (8+ chars, uppercase, lowercase, number)
- Username validation (3-20 chars, alphanumeric + underscore)
- UUID validation
- Pre-built validation chains for common operations
- Custom field validators
- Request body size validation
- String sanitization

**Exports**:
- `validateRequired()` - Validate required fields
- `validateEmail()` - Email validation middleware
- `validatePassword()` - Password validation middleware
- `validateUsername()` - Username validation middleware
- `validateRegistration()` - Complete registration validation chain
- `validateLogin()` - Login validation chain
- `validateChangePassword()` - Change password validation chain
- `validateProfileUpdate()` - Profile update validation chain
- `validateIdParam()` - UUID parameter validation
- `validateBodySize()` - Request size validation
- Utility functions: `isValidEmail()`, `isValidPassword()`, `isValidUsername()`, `isValidUUID()`, `sanitizeString()`

### 5. `/home/adam/grocery/server/index.ts` (Updated)
**Purpose**: Main server entry point with full Express setup

**Features**:
- Environment validation on startup
- CORS configuration with credentials support
- Rate limiting (configurable, skips health check)
- Security headers (X-Frame-Options, X-XSS-Protection, etc.)
- Request logging in development
- Health check endpoint with database and memory stats
- API documentation endpoint
- Graceful shutdown handling
- Trust proxy for correct client IPs
- 404 and error handlers

**Improvements**:
- Uses new config modules
- Better organized middleware
- Enhanced health check with pool stats
- Improved error handling
- Production-ready security settings

### 6. `/home/adam/grocery/.env.example` (Updated)
**Purpose**: Complete environment variable template

**New Variables Added**:
- `JWT_ACCESS_SECRET` - Access token secret
- `JWT_REFRESH_SECRET` - Refresh token secret
- `JWT_ACCESS_EXPIRY` - Access token expiration
- `JWT_REFRESH_EXPIRY` - Refresh token expiration
- `DB_MAX_CONNECTIONS` - Connection pool size
- `DB_IDLE_TIMEOUT` - Idle connection timeout
- `DB_CONNECTION_TIMEOUT` - Connection attempt timeout
- `BCRYPT_ROUNDS` - Password hashing rounds
- `RATE_LIMIT_WINDOW_MS` - Rate limit time window
- `RATE_LIMIT_MAX_REQUESTS` - Max requests per window
- `DEBUG_DB` - Enable database query logging

### 7. `/home/adam/grocery/server/auth/utils.ts` (Updated)
**Purpose**: Authentication utility functions

**Updates**:
- Now imports configuration from `config/env.ts`
- Uses `jwtConfig` for JWT secrets and expiration
- Uses `securityConfig` for bcrypt rounds
- No more hardcoded configuration values

## File Structure

```
/home/adam/grocery/
├── .env.example                      # Updated with all new variables
├── server/
│   ├── index.ts                      # Updated main entry point
│   ├── config/
│   │   ├── env.ts                    # NEW: Environment configuration
│   │   └── db.ts                     # NEW: Database configuration
│   ├── middleware/
│   │   ├── errorHandler.ts           # NEW: Error handling
│   │   └── validateRequest.ts        # NEW: Request validation
│   ├── auth/
│   │   ├── routes.ts                 # Existing
│   │   ├── controller.ts             # Existing
│   │   ├── middleware.ts             # Existing
│   │   └── utils.ts                  # Updated to use new config
│   ├── db/
│   │   ├── schema.sql                # Existing
│   │   └── pool.ts                   # Legacy (can be removed, replaced by config/db.ts)
│   └── types/
│       └── index.ts                  # Existing
└── SERVER_SETUP.md                   # NEW: Complete setup guide
```

## Dependencies

All required dependencies are already in `package.json`:

### Production
- express: ^5.1.0
- pg: ^8.16.3
- cors: ^2.8.5
- jsonwebtoken: ^9.0.2
- bcrypt: ^6.0.0
- express-rate-limit: ^8.1.0
- express-validator: ^7.3.0
- dotenv: ^16.4.5
- nanoid: ^5.0.7

### Development
- typescript: ^5.5.3
- ts-node: ^10.9.2
- nodemon: ^3.1.10
- @types/* packages for TypeScript support

## Quick Start

### 1. Setup Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env

# For production, generate secure secrets:
openssl rand -base64 32  # JWT_ACCESS_SECRET
openssl rand -base64 32  # JWT_REFRESH_SECRET
openssl rand -base64 32  # ZERO_AUTH_SECRET
```

### 2. Start Database

```bash
# Using Docker (recommended for development)
pnpm db:up

# Initialize schema
pnpm db:init
```

### 3. Run Server

```bash
# Development (with auto-reload)
pnpm server:dev

# Production build
pnpm server:build
pnpm server:start

# Start everything (database + zero + server + frontend)
pnpm dev:all
```

### 4. Verify Server

```bash
# Health check
curl http://localhost:3001/health

# API documentation
curl http://localhost:3001/api

# Test registration
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234",
    "username": "testuser"
  }'
```

## Key Features

### Security
- JWT-based authentication with access and refresh tokens
- Bcrypt password hashing with configurable rounds
- Rate limiting to prevent abuse
- CORS protection with configurable origins
- Security headers (XSS, frame options, content type)
- Environment validation for production
- SQL injection protection via parameterized queries

### Error Handling
- Centralized error handling middleware
- Custom error classes for different scenarios
- Consistent error response format
- Stack traces in development only
- Graceful error recovery

### Database
- Connection pooling for performance
- Automatic connection health monitoring
- Transaction support with automatic rollback
- Query logging for debugging
- Graceful shutdown handling

### Validation
- Email format validation
- Password strength validation (8+ chars, mixed case, numbers)
- Username validation (3-20 chars, alphanumeric)
- Required field validation
- UUID format validation
- Request size validation

### Development Experience
- Hot reload with nodemon
- TypeScript support with strict mode
- Detailed logging in development
- Health check endpoint with stats
- API documentation endpoint
- Debug mode for database queries

## Configuration Reference

### Server Settings
- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment mode (development/production/test)
- `CORS_ORIGIN` - Allowed CORS origins

### Database Settings
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` - Connection details
- `DB_MAX_CONNECTIONS` - Max pool size (default: 20)
- `DB_IDLE_TIMEOUT` - Idle connection timeout (default: 30000ms)
- `DB_CONNECTION_TIMEOUT` - Connection attempt timeout (default: 2000ms)

### JWT Settings
- `JWT_ACCESS_SECRET` - Secret for access tokens
- `JWT_REFRESH_SECRET` - Secret for refresh tokens
- `JWT_ACCESS_EXPIRY` - Access token lifetime (default: 15m)
- `JWT_REFRESH_EXPIRY` - Refresh token lifetime (default: 7d)

### Security Settings
- `BCRYPT_ROUNDS` - Password hashing rounds (default: 10)
- `RATE_LIMIT_WINDOW_MS` - Rate limit window (default: 900000 = 15 min)
- `RATE_LIMIT_MAX_REQUESTS` - Max requests per window (default: 100)

### Debug Settings
- `DEBUG_DB` - Enable detailed database logging (default: false)

## API Endpoints

### Public Endpoints
- `GET /health` - Server health check
- `GET /api` - API documentation
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token

### Protected Endpoints (Require Authentication)
- `GET /api/auth/me` - Get current user
- `PATCH /api/auth/profile` - Update user profile
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/logout` - Logout user

## Troubleshooting

### Database Connection Failed
1. Check PostgreSQL is running: `docker ps` or `pg_isready`
2. Verify credentials in `.env`
3. Ensure database exists: `psql -l`
4. Test connection: `psql -h localhost -U grocery -d grocery_db`

### Port Already in Use
1. Change PORT in `.env`
2. Kill process: `lsof -ti:3001 | xargs kill`

### TypeScript Errors
1. Clear build: `rm -rf dist/`
2. Reinstall: `rm -rf node_modules && pnpm install`
3. Check TypeScript version: `pnpm list typescript`

### Environment Variable Issues
1. Check `.env` file exists
2. Verify all required variables are set
3. No spaces around `=` in `.env`
4. Restart server after .env changes

## Next Steps

1. Review [SERVER_SETUP.md](/home/adam/grocery/SERVER_SETUP.md) for complete documentation
2. Review [AUTH_README.md](/home/adam/grocery/AUTH_README.md) for API documentation
3. Test all endpoints using the examples provided
4. Integrate with frontend authentication
5. Deploy to production (follow production checklist in SERVER_SETUP.md)

## Production Deployment Checklist

- [ ] Generate secure secrets (use `openssl rand -base64 32`)
- [ ] Set `NODE_ENV=production`
- [ ] Use strong database password
- [ ] Configure CORS_ORIGIN to production domain
- [ ] Enable SSL for database connection
- [ ] Secure environment variables (use secrets manager)
- [ ] Enable HTTPS for all connections
- [ ] Configure monitoring and logging
- [ ] Set up database backups
- [ ] Test rate limiting settings
- [ ] Review and adjust token expiration times
- [ ] Configure proper firewall rules
