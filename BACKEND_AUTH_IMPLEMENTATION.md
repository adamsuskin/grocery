# Backend Authentication API Implementation - Complete Guide

## Executive Summary

A complete, production-ready Node.js/Express authentication API has been implemented with TypeScript, JWT tokens, bcrypt password hashing, PostgreSQL database integration, rate limiting, and comprehensive security features.

**Server runs on:** `http://localhost:3001`

## What Was Built

### Complete Authentication System
- User registration with validation
- Secure login with JWT tokens
- Token refresh mechanism (access + refresh tokens)
- User profile management
- Password change functionality
- JWT-based authentication middleware
- Rate limiting (brute force protection)
- Input validation (express-validator)
- Comprehensive error handling
- CORS support
- Security headers
- PostgreSQL integration
- TypeScript type safety

### 8 API Endpoints Implemented

#### Public Endpoints
1. `POST /api/auth/register` - Register new user
2. `POST /api/auth/login` - Login and get JWT tokens
3. `POST /api/auth/refresh` - Refresh access token
4. `POST /api/auth/logout` - Logout (client-side token cleanup)

#### Protected Endpoints (require JWT)
5. `GET /api/auth/me` - Get current user info
6. `PATCH /api/auth/profile` - Update user profile
7. `POST /api/auth/change-password` - Change password
8. `GET /api/auth/health` - Health check

## Files Created

### Configuration & Setup
```
/home/adam/grocery/
├── tsconfig.server.json          # TypeScript config for server
├── nodemon.json                  # Development auto-reload config
├── .env                          # Environment variables (updated)
└── .env.example                  # Environment template (updated)
```

### Server Implementation
```
/home/adam/grocery/server/
├── index.ts                      # Main Express server entry point
├── config/
│   ├── env.ts                    # Environment configuration
│   └── db.ts                     # Database connection pool
├── auth/
│   ├── routes.ts                 # Route definitions + validation
│   ├── controller.ts             # Request handlers (8 endpoints)
│   ├── middleware.ts             # JWT verification middleware
│   └── utils.ts                  # JWT & password utilities
├── middleware/
│   ├── errorHandler.ts           # Global error handling
│   └── validateRequest.ts        # Request validation helpers
├── db/
│   ├── schema.sql                # PostgreSQL schema (users table)
│   └── pool.ts                   # Connection pool (legacy)
└── types/
    ├── index.ts                  # TypeScript type definitions
    └── api-client-example.ts     # Frontend integration example
```

### Documentation
```
/home/adam/grocery/server/
├── README.md                     # Complete API documentation
└── AUTH_QUICKSTART.md            # 5-minute quick start guide
```

### Package.json Updates
```json
{
  "scripts": {
    "db:init": "psql -h localhost -U grocery -d grocery_db -f server/db/schema.sql",
    "server:dev": "nodemon --exec ts-node --esm server/index.ts",
    "server:build": "tsc -p tsconfig.server.json",
    "server:start": "node dist/server/index.js",
    "dev:all": "concurrently \"pnpm db:up\" \"pnpm zero:dev\" \"pnpm server:dev\" \"pnpm dev\""
  }
}
```

### Dependencies Installed
```json
{
  "dependencies": {
    "express": "^5.1.0",
    "cors": "^2.8.5",
    "bcrypt": "^6.0.0",
    "jsonwebtoken": "^9.0.2",
    "pg": "^8.16.3",
    "express-rate-limit": "^8.1.0",
    "express-validator": "^7.3.0",
    "dotenv": "^16.4.5"
  },
  "devDependencies": {
    "@types/express": "^5.0.4",
    "@types/cors": "^2.8.19",
    "@types/bcrypt": "^6.0.0",
    "@types/jsonwebtoken": "^9.0.10",
    "@types/pg": "^8.15.5",
    "ts-node": "^10.9.2",
    "nodemon": "^3.1.10"
  }
}
```

## Quick Start (5 Minutes)

### 1. Start PostgreSQL
```bash
pnpm db:up
```

### 2. Initialize Database
```bash
PGPASSWORD=grocery psql -h localhost -U grocery -d grocery_db -f server/db/schema.sql
```

### 3. Start Auth Server
```bash
pnpm server:dev
```

Expected output:
```
=============================================
  Server Started Successfully
=============================================
  Environment: development
  Port: 3001
  URL: http://localhost:3001
  Health: http://localhost:3001/health
  API Docs: http://localhost:3001/api
  CORS Origin: http://localhost:3000
=============================================

Server is ready to accept connections
```

### 4. Test It
```bash
# Health check
curl http://localhost:3001/health

# Register a user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123",
    "name": "Test User"
  }'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123"
  }'
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
- `idx_users_email` - Fast email lookups
- `idx_users_created_at` - Sorting by registration date

**Triggers:**
- Auto-update `updated_at` on modifications

### Integration with Grocery Items
```sql
-- Links grocery items to users
ALTER TABLE grocery_items
  ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE CASCADE;

CREATE INDEX idx_grocery_items_user_id ON grocery_items(user_id);
```

This enables user-specific grocery lists!

## API Documentation

### 1. Register New User

**Endpoint:** `POST /api/auth/register`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "name": "John Doe"
}
```

**Password Requirements:**
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "created_at": "2025-10-26T00:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Rate Limit:** 5 requests per 15 minutes per IP

---

### 2. Login User

**Endpoint:** `POST /api/auth/login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "created_at": "2025-10-26T00:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Rate Limit:** 5 requests per 15 minutes per IP

---

### 3. Refresh Access Token

**Endpoint:** `POST /api/auth/refresh`

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Rate Limit:** 20 requests per 15 minutes per IP

---

### 4. Get Current User (Protected)

**Endpoint:** `GET /api/auth/me`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "created_at": "2025-10-26T00:00:00.000Z"
    }
  }
}
```

---

### 5. Update Profile (Protected)

**Endpoint:** `PATCH /api/auth/profile`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request (both fields optional):**
```json
{
  "name": "Jane Doe",
  "email": "newemail@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "newemail@example.com",
      "name": "Jane Doe",
      "created_at": "2025-10-26T00:00:00.000Z"
    }
  }
}
```

---

### 6. Change Password (Protected)

**Endpoint:** `POST /api/auth/change-password`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "currentPassword": "OldPass123",
  "newPassword": "NewSecurePass456"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

## Security Features

### 1. Password Security
- **Bcrypt hashing** with 12 salt rounds (very secure)
- **Password strength validation** (8+ chars, mixed case, numbers)
- **Secure comparison** (prevents timing attacks)
- Passwords **never stored in plain text**

### 2. JWT Security
- **Short-lived access tokens** (15 minutes)
- **Long-lived refresh tokens** (7 days)
- **Separate secrets** for access and refresh tokens
- **HS256 algorithm** for signing
- **Token verification** on all protected routes

### 3. Rate Limiting
- **Login/Register:** 5 attempts per 15 minutes per IP
- **General operations:** 20 requests per 15 minutes per IP
- **Brute force protection**
- **DDoS mitigation**

### 4. Input Validation
- **express-validator** for all inputs
- **Email format validation**
- **Password strength requirements**
- **SQL injection prevention** (parameterized queries)
- **XSS prevention** (input sanitization)

### 5. Security Headers
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security` (production only)

### 6. CORS Configuration
- **Configured allowed origins** (not wildcard)
- **Credentials support** for cookies
- **Method restrictions**
- **Header restrictions**

### 7. Error Handling
- **No sensitive information** in error messages
- **Generic error messages** for security (don't reveal if user exists)
- **Stack traces** only in development
- **Graceful degradation**

## Environment Variables

### Required Configuration

Edit `/home/adam/grocery/.env`:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=grocery_db
DB_USER=grocery
DB_PASSWORD=grocery

# JWT Configuration - CHANGE THESE IN PRODUCTION!
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Server Configuration
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

### Generate Secure Secrets (Production)

```bash
# Generate JWT secrets
openssl rand -base64 32

# Use output for JWT_SECRET and JWT_REFRESH_SECRET
```

## Frontend Integration

### Install Axios (if needed)
```bash
pnpm add axios
```

### Example: Login Function
```typescript
import axios from 'axios';

const API_URL = 'http://localhost:3001/api/auth';

async function login(email: string, password: string) {
  const response = await axios.post(`${API_URL}/login`, {
    email,
    password
  });

  const { user, accessToken, refreshToken } = response.data.data;

  // Store tokens
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);

  return user;
}
```

### Example: Authenticated Request
```typescript
async function getCurrentUser() {
  const token = localStorage.getItem('accessToken');

  const response = await axios.get(`${API_URL}/me`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return response.data.data.user;
}
```

### Complete Example Client

See `/home/adam/grocery/server/types/api-client-example.ts` for:
- Complete AuthClient class
- Automatic token refresh
- React Context example
- React Hooks example
- Protected Routes example
- Full TypeScript types

## Development Commands

```bash
# Start database
pnpm db:up

# Stop database
pnpm db:down

# Initialize database schema
PGPASSWORD=grocery psql -h localhost -U grocery -d grocery_db -f server/db/schema.sql

# Start auth server (development - auto-reload)
pnpm server:dev

# Build auth server (production)
pnpm server:build

# Start auth server (production)
pnpm server:start

# Start EVERYTHING (database + zero + auth + frontend)
pnpm dev:all
```

## Testing

### Health Check
```bash
curl http://localhost:3001/health
```

### Complete Auth Flow
```bash
# 1. Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123","name":"Test User"}'

# Save the accessToken from response

# 2. Get current user
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# 3. Update profile
curl -X PATCH http://localhost:3001/api/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Name"}'

# 4. Change password
curl -X POST http://localhost:3001/api/auth/change-password \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"currentPassword":"TestPass123","newPassword":"NewPass456"}'
```

## Troubleshooting

### Database Connection Failed
```bash
# Check if PostgreSQL is running
docker ps

# Start if needed
pnpm db:up

# Test connection
psql -h localhost -U grocery -d grocery_db -c "SELECT 1"
```

### Port 3001 Already in Use
```bash
# Find and kill process
lsof -ti:3001 | xargs kill -9

# Or change PORT in .env
```

### Schema Not Initialized
```bash
# Run schema file
PGPASSWORD=grocery psql -h localhost -U grocery -d grocery_db -f server/db/schema.sql
```

### Token Verification Failed
- Check Authorization header format: `Bearer <token>`
- Verify JWT_SECRET in .env matches server
- Token may be expired (use refresh endpoint)

## Production Deployment Checklist

### Critical (Must Do)
- [ ] Change `JWT_SECRET` to strong random value
- [ ] Change `JWT_REFRESH_SECRET` to strong random value
- [ ] Set `NODE_ENV=production`
- [ ] Use HTTPS (not HTTP)
- [ ] Update `CORS_ORIGIN` to production domain
- [ ] Use environment variables for all secrets
- [ ] Never commit .env file to git

### Important (Recommended)
- [ ] Set up database backups
- [ ] Enable PostgreSQL SSL
- [ ] Configure reverse proxy (nginx)
- [ ] Set up error tracking (Sentry)
- [ ] Configure logging service
- [ ] Set up monitoring/alerts
- [ ] Review and adjust rate limits
- [ ] Configure firewall rules
- [ ] Use connection pooling

### Nice to Have
- [ ] Implement email verification
- [ ] Add password reset
- [ ] Implement token rotation
- [ ] Add 2FA support
- [ ] Set up security scanning
- [ ] Enable audit logging
- [ ] Implement token blacklisting
- [ ] Add account lockout

## Architecture

```
Client Request
     ↓
Express Server (port 3001)
     ↓
Middleware Chain:
  - CORS
  - Rate Limiter
  - Body Parser
  - Security Headers
  - Request Logger (dev)
     ↓
Routes (/api/auth/*)
  - express-validator
     ↓
Auth Middleware (protected routes)
  - JWT Verification
     ↓
Controller
  - Business Logic
  - Password Hashing
  - JWT Generation
  - Database Queries
     ↓
PostgreSQL Database
```

## Error Response Format

All errors return consistent format:
```json
{
  "success": false,
  "error": "Error Type",
  "message": "Human-readable message",
  "details": {}  // Optional, development only
}
```

**Status Codes:**
- `200` - Success
- `201` - Created (registration)
- `400` - Bad Request (validation)
- `401` - Unauthorized
- `404` - Not Found
- `409` - Conflict (duplicate email)
- `429` - Too Many Requests
- `500` - Internal Server Error

## Documentation

- **Quick Start:** `/home/adam/grocery/server/AUTH_QUICKSTART.md`
- **Complete API Reference:** `/home/adam/grocery/server/README.md`
- **Frontend Integration:** `/home/adam/grocery/server/types/api-client-example.ts`
- **This Guide:** `/home/adam/grocery/BACKEND_AUTH_IMPLEMENTATION.md`

## Summary

You now have a complete, production-ready authentication backend with:

✅ **8 API Endpoints** - Register, Login, Refresh, Logout, Profile, Password Change
✅ **JWT Authentication** - Access + Refresh tokens
✅ **Security** - bcrypt, rate limiting, validation, headers
✅ **Database** - PostgreSQL with proper schema
✅ **TypeScript** - Full type safety
✅ **Documentation** - Complete API docs
✅ **Examples** - Frontend integration code
✅ **Production Ready** - Error handling, logging, graceful shutdown

**Start the server:** `pnpm server:dev`
**Test endpoint:** `curl http://localhost:3001/health`

The authentication API is ready to use! 🚀
