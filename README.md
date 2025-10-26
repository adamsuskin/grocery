# 🛒 Grocery List App

A collaborative grocery list application built with React, TypeScript, and Vite. Features real-time synchronization, multi-user list sharing, and comprehensive collaboration tools.

## 🎉 What's New in Phase 15: List Sharing & Collaboration

Phase 15 introduces a complete multi-user collaboration system that transforms the Grocery List app into a powerful shared shopping tool:

- **📋 Multi-List Management**: Create unlimited lists for different purposes (weekly shopping, party planning, etc.)
- **👥 Smart Sharing**: Share lists with family, roommates, or friends via email or shareable invite links
- **🔐 Permission Control**: Three-tier system (owner/editor/viewer) for fine-grained access control
- **🤝 Real-Time Collaboration**: See changes from all members instantly with <500ms sync latency
- **📊 Rich Analytics**: View detailed statistics, activity history, and member contributions
- **🎨 Customization**: Personalize lists with colors, icons, pinning, and archiving
- **💾 Export & Backup**: Export lists to JSON, CSV, or plain text formats

**Technical Highlights:**
- 15+ new API endpoints with comprehensive validation
- 9 database migrations with rollback support
- 3,500+ lines of production-ready code
- 88+ test scenarios covering all features
- Mobile-responsive UI optimized for touch devices
- Real-time permission enforcement at API and UI levels

## Features

### Core Grocery List Features
- ✅ **Add Items**: Add grocery items with name, quantity, category, and optional notes
- 🏷️ **Categories**: Organize items into categories (Produce, Dairy, Meat, Bakery, Pantry, Frozen, Beverages, Other)
- 📝 **Notes**: Add optional notes to items (brand preferences, location in store, etc.)
- ✅ **Mark as Gotten**: Toggle items as gotten/not gotten
- ✅ **Delete Items**: Remove items from the list
- ✅ **View List**: See all items with customizable sorting
- 🔍 **Search**: Search for items by name with real-time filtering
- 🎛️ **Filter**: Toggle visibility of gotten items and filter by categories
- 📊 **Results Counter**: See the number of items matching your filters
- 🔄 **Sort**: Sort items by name, quantity, or date (ascending/descending)
- ⚡ **Bulk Operations**: Mark all items as gotten or delete all gotten items at once

### List Sharing & Collaboration (Phase 15 NEW!)
- 📋 **Multiple Lists**: Create and manage unlimited grocery lists
- 👥 **Share with Users**: Share lists with other users via email
- 🔐 **Permission Levels**: Three roles (owner, editor, viewer) for fine-grained access control
- 🔗 **Invite Links**: Generate shareable links with optional expiration dates
- 🤝 **Real-time Collaboration**: See changes from all list members instantly
- 👤 **Member Management**: Add, remove, and update member permissions
- 🔄 **Transfer Ownership**: Transfer list ownership to another member
- 📑 **Duplicate Lists**: Clone lists with all items for reuse
- 🚪 **Leave Lists**: Leave shared lists you no longer need
- 📊 **List Statistics**: View detailed analytics and activity history
- 📋 **Activity Trail**: Complete audit log of all list actions
- 🎨 **List Customization**: Customize lists with colors and icons
- 📌 **Pin Lists**: Pin favorite lists to the top
- 📦 **Archive Lists**: Archive old lists without deleting them
- 💾 **Export Lists**: Export to JSON, CSV, or plain text formats
- 🖨️ **Print Lists**: Print-friendly list formatting

### Authentication & Security
- 🔐 **JWT Authentication**: Secure token-based authentication
- 👤 **User Accounts**: Register and login with email/password
- 🔄 **Auto Token Refresh**: Seamless session management
- 🛡️ **Rate Limiting**: Brute-force protection on auth endpoints
- 🔒 **Password Security**: bcrypt hashing with 12 rounds
- 👥 **Multi-User Support**: Each user has isolated data

### Technical Features
- 🔄 **Real-time Sync**: Changes sync automatically via Zero across all devices and users
- 💾 **Persistent**: Data stored in PostgreSQL with local caching
- 📱 **Responsive**: Mobile-first design that works on all screen sizes
- 🔌 **Offline Support**: Works offline and syncs when reconnected
- ⚡ **Performance**: Optimized queries with database indexes
- 🔍 **Type Safety**: Fully typed with TypeScript

## Tech Stack

- **TypeScript**: Type-safe JavaScript
- **React 18**: UI framework with hooks
- **Vite**: Fast build tool and dev server
- **pnpm**: Efficient package manager
- **Zero**: Real-time sync and collaboration framework
- **PostgreSQL**: Database backend for Zero
- **zero-cache**: Local caching server for offline support

## Project Structure

```
grocery/
├── src/
│   ├── components/
│   │   ├── AddItemForm.tsx           # Form to add new items
│   │   ├── GroceryItem.tsx           # Single item display
│   │   ├── GroceryList.tsx           # List of all items
│   │   ├── ListManagement.tsx        # List management modal
│   │   ├── ListSelector.tsx          # Dropdown for switching lists
│   │   ├── ListStats.tsx             # Statistics display
│   │   ├── PermissionBadge.tsx       # Permission level indicator
│   │   ├── SearchFilterBar.tsx       # Search and filter controls
│   │   ├── SortControls.tsx          # Sorting controls
│   │   ├── BulkOperations.tsx        # Bulk action buttons
│   │   ├── LoginForm.tsx             # User login form
│   │   ├── RegisterForm.tsx          # User registration form
│   │   ├── UserProfile.tsx           # User profile menu
│   │   └── ListSkeleton.tsx          # Loading skeletons
│   ├── hooks/
│   │   ├── useGroceryItems.ts        # Custom hooks for items
│   │   ├── useAuth.ts                # Authentication hook
│   │   └── useLists.ts               # List management hook
│   ├── utils/
│   │   ├── listExport.ts             # Export functions (JSON, CSV, Text)
│   │   ├── api.ts                    # API client with interceptors
│   │   └── tokenRefresh.ts           # Token refresh logic
│   ├── types.ts                       # TypeScript type definitions
│   ├── zero-store.ts                  # Zero-based data store
│   ├── zero-schema.ts                 # Zero schema definition
│   ├── App.tsx                        # Main app component
│   ├── App.css                        # App styles
│   ├── main.tsx                       # App entry point
│   └── index.css                      # Global styles
├── server/
│   ├── auth/
│   │   ├── routes.ts                  # Authentication routes
│   │   ├── controller.ts              # Auth logic
│   │   ├── middleware.ts              # Auth middleware
│   │   └── utils.ts                   # JWT utilities
│   ├── lists/
│   │   ├── routes.ts                  # List management routes
│   │   ├── controller.ts              # List operations
│   │   └── middleware.ts              # List permission checks
│   ├── invites/
│   │   ├── routes.ts                  # Invite link routes
│   │   └── controller.ts              # Invite operations
│   ├── activities/
│   │   ├── routes.ts                  # Activity routes
│   │   └── controller.ts              # Activity retrieval
│   ├── middleware/
│   │   ├── listPermissions.ts         # Permission enforcement
│   │   ├── rateLimiter.ts             # Rate limiting
│   │   ├── errorHandler.ts            # Error handling
│   │   └── validateRequest.ts         # Request validation
│   ├── migrations/
│   │   ├── 001_add_authentication.sql
│   │   ├── 002_add_lists.sql
│   │   ├── 003_add_list_sharing.sql
│   │   ├── 004_migrate_to_lists.sql
│   │   ├── 005_add_list_activities.sql
│   │   ├── 006_add_list_customization.sql
│   │   ├── 007_add_invite_links.sql
│   │   ├── 008_add_list_archive.sql
│   │   ├── 009_add_list_pins.sql
│   │   └── rollback/                  # Rollback scripts
│   ├── db/
│   │   ├── schema.sql                 # Complete database schema
│   │   └── pool.ts                    # Database connection pool
│   ├── config/
│   │   ├── env.ts                     # Environment configuration
│   │   ├── db.ts                      # Database configuration
│   │   └── rateLimitConfig.ts         # Rate limit settings
│   ├── types/
│   │   └── index.ts                   # Shared TypeScript types
│   └── index.ts                       # Express server entry point
├── docs/
│   ├── LIST_SHARING_TESTS.md          # List sharing test scenarios
│   ├── PERMISSION_TESTS.md            # Permission test scenarios
│   ├── REALTIME_TESTS.md              # Real-time sync tests
│   └── SECURITY.md                    # Security best practices
├── specs/
│   └── requirements.md                # Detailed requirements
├── .env.example                       # Environment template
├── docker-compose.yml                 # PostgreSQL setup
├── package.json
├── tsconfig.json
├── vite.config.ts
└── index.html
```

## Real-Time Sync with Zero

This application uses [Zero](https://zero.rocicorp.dev/) for real-time collaborative synchronization across multiple devices and users. Zero provides:

- **Real-time Sync**: Changes propagate instantly across all connected clients
- **Offline Support**: Works offline and automatically syncs when reconnected
- **Conflict Resolution**: Handles concurrent edits gracefully
- **Type Safety**: Fully typed queries with TypeScript
- **Local-First**: Fast, responsive UI with local caching via zero-cache

Zero replaces the localStorage-based sync with a robust, production-ready synchronization system backed by PostgreSQL.

## Offline Conflict Resolution

The app includes a comprehensive offline-first system with intelligent conflict resolution:

### Key Features

- **Offline Queue**: Changes are queued locally when offline and synced automatically when reconnected
- **Automatic Conflict Resolution**: Most conflicts are resolved automatically using intelligent strategies
- **Manual Resolution UI**: Complex conflicts can be resolved manually with clear diff views
- **Persistent Queue**: Offline changes survive browser restarts and device reboots
- **Retry with Exponential Backoff**: Failed syncs are retried automatically with smart delays
- **Sync Status Indicator**: Always-visible indicator shows connection and queue status

### Resolution Strategies

1. **Last-Write-Wins**: Most recent change wins (fastest, for non-critical fields)
2. **Prefer-Gotten**: Prefers version where item is marked as "gotten" (prevents frustrating reverts)
3. **Field-Level-Merge**: Intelligently merges different field changes
4. **Manual Resolution**: User chooses when automatic resolution isn't possible

### How It Works

```
User makes change → Online? → Direct sync
                     ↓ Offline
                  Queue locally
                     ↓
                Network reconnects
                     ↓
                  Process queue
                     ↓
              Detect conflicts
                     ↓
            ┌─── Auto-resolve? ───┐
            ↓ Yes               ↓ No
        Apply merge      Show conflict UI
            ↓                   ↓
        Sync complete ← User resolves
```

### User Experience

- **Offline Indicator**: Shows when offline with pending change count
- **Syncing Progress**: Visual feedback during synchronization
- **Conflict Notifications**: Clear alerts when manual resolution needed
- **No Data Loss**: All changes are preserved, even during conflicts

### Documentation

- **User Guide**: [OFFLINE_CONFLICT_RESOLUTION_GUIDE.md](/OFFLINE_CONFLICT_RESOLUTION_GUIDE.md)
  - What conflicts are and why they happen
  - How automatic resolution works
  - How to manually resolve conflicts
  - Tips for avoiding conflicts

- **Technical Documentation**:
  - [Architecture](docs/OFFLINE_ARCHITECTURE.md) - System design and data flow
  - [API Reference](docs/CONFLICT_API_REFERENCE.md) - Complete API documentation
  - [Best Practices](docs/OFFLINE_BEST_PRACTICES.md) - Development guidelines

### Quick Example

```typescript
import { useOfflineQueue } from './utils/offlineQueue';

function MyComponent() {
  const { pendingCount, failedCount, retryFailed } = useOfflineQueue();

  return (
    <div>
      {pendingCount > 0 && <span>{pendingCount} changes queued</span>}
      {failedCount > 0 && (
        <button onClick={retryFailed}>Retry Failed ({failedCount})</button>
      )}
    </div>
  );
}
```

**Performance:**
- Queue processing: 100-500ms per item
- Conflict detection: <10ms per item
- Storage overhead: ~1-5KB per queued mutation
- Supports 50+ concurrent users, 500+ items per list

## Development Setup

### Prerequisites

- Node.js 20+
- pnpm (install with `npm install -g pnpm`)
- Docker and Docker Compose (for PostgreSQL)

### Environment Configuration

The application uses environment variables for configuration. You need to set up `.env` files for both the client and server.

#### 1. Create Root Environment File

Copy the example file and configure it:

```bash
cp .env.example .env
```

Edit `.env` and configure the following variables:

**Client Variables (accessible in browser):**
- `VITE_API_URL` - Backend API URL (default: `http://localhost:3001`)
- `VITE_ZERO_SERVER` - Zero server URL (default: `http://localhost:4848`)
- `VITE_AUTH_ENABLED` - Enable authentication features (default: `false`)

**Server Variables (server-side only):**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for signing JWT access tokens
- `JWT_REFRESH_SECRET` - Secret for signing JWT refresh tokens
- `JWT_EXPIRES_IN` - Access token expiration (default: `15m`)
- `JWT_REFRESH_EXPIRES_IN` - Refresh token expiration (default: `7d`)
- `PORT` - Server port (default: `3001`)
- `NODE_ENV` - Environment mode (`development` or `production`)
- `CORS_ORIGIN` - Allowed CORS origins (default: `http://localhost:3000`)

**Zero Cache Variables:**
- `ZERO_UPSTREAM_DB` - PostgreSQL connection for zero-cache
- `ZERO_REPLICA_FILE` - Path to zero-cache's local replica
- `ZERO_AUTH_SECRET` - Secret for zero-cache authentication

#### 2. Generate Secure Secrets (Important!)

For development, you can use the default values, but for production you MUST generate secure secrets:

```bash
# Generate JWT_SECRET
openssl rand -base64 32

# Generate JWT_REFRESH_SECRET (use a different value)
openssl rand -base64 32

# Generate ZERO_AUTH_SECRET
openssl rand -base64 32
```

Copy these generated values into your `.env` file.

#### 3. Environment File Security

- `.env` files contain sensitive secrets - NEVER commit them to git
- The `.env.example` files are templates and are safe to commit
- Use `.env.local` for local overrides (git-ignored)
- In production, use your hosting platform's secret management system

### Setup Steps

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Configure environment variables (see Environment Configuration above):
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. Start PostgreSQL database:
   ```bash
   docker compose up -d
   ```
   This starts a PostgreSQL container for Zero's backend storage.

4. Start zero-cache server:
   ```bash
   pnpm zero:dev
   ```
   The zero-cache server handles real-time sync between clients and the database.

5. In a separate terminal, start the development server:
   ```bash
   pnpm dev
   ```

6. Open your browser to `http://localhost:3000`

**Quick Start (All-in-One):**
```bash
pnpm dev:full
```
This command starts PostgreSQL, zero-cache, and the Vite dev server all at once.

**With Authentication Server:**
```bash
pnpm dev:all
```
This starts PostgreSQL, zero-cache, the authentication API server, and the Vite dev server.

### Available Scripts

- `pnpm dev` - Start Vite development server only
- `pnpm dev:full` - Start PostgreSQL, zero-cache, and Vite dev server
- `pnpm dev:all` - Start all services including authentication API
- `pnpm zero:dev` - Start zero-cache server only
- `pnpm server:dev` - Start authentication API server in development mode
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm type-check` - Run TypeScript type checking

### Production Deployment

When deploying to production, follow these security best practices:

#### Environment Variables

1. **Generate Strong Secrets:**
   ```bash
   # Generate all required secrets
   openssl rand -base64 32  # For JWT_SECRET
   openssl rand -base64 32  # For JWT_REFRESH_SECRET
   openssl rand -base64 32  # For ZERO_AUTH_SECRET
   ```

2. **Set Production Environment Variables:**
   - `NODE_ENV=production` - Enables production optimizations
   - `DATABASE_URL` - Use secure PostgreSQL connection with SSL
   - `CORS_ORIGIN` - Set to your actual frontend domain(s)
   - `VITE_API_URL` - Set to your production API URL
   - `VITE_ZERO_SERVER` - Set to your production zero-cache URL
   - `VITE_AUTH_ENABLED=true` - Enable authentication in production

3. **Security Checklist:**
   - Use HTTPS for all connections (frontend, API, database)
   - Enable SSL/TLS for database connections: `?sslmode=require`
   - Store secrets in a secure secret manager (not in code or .env files)
   - Use environment-specific secrets (never reuse dev secrets in prod)
   - Implement rate limiting on authentication endpoints
   - Enable CORS only for specific, trusted domains
   - Regularly rotate JWT secrets (every 90 days recommended)
   - Monitor failed login attempts and implement account lockouts
   - Use strong password requirements (handled by bcrypt with 10+ rounds)
   - Keep dependencies updated for security patches

#### Database Configuration

For production, use a managed PostgreSQL service and configure SSL:

```bash
# Example production DATABASE_URL with SSL
DATABASE_URL=postgresql://user:password@db.example.com:5432/grocery_db?sslmode=require
```

#### Hosting Recommendations

- **Frontend (Vite):** Vercel, Netlify, Cloudflare Pages
- **Backend API:** Railway, Render, Fly.io, AWS ECS
- **Database:** Supabase, Neon, Railway, AWS RDS
- **Zero Cache:** Deploy alongside backend API or as separate service

## Authentication

The Grocery List app includes a robust authentication system to support multi-user functionality with secure user accounts. Authentication is optional and can be toggled with the `VITE_AUTH_ENABLED` environment variable.

### Authentication Overview

The authentication system provides:

- **JWT-Based Authentication**: Secure token-based authentication using JSON Web Tokens
- **Access & Refresh Tokens**: Short-lived access tokens (15 minutes) and long-lived refresh tokens (7 days)
- **Password Security**: Passwords hashed with bcrypt (12 rounds) before storage
- **Rate Limiting**: Brute-force protection on authentication endpoints
- **Email Validation**: Ensures valid email format during registration
- **Password Requirements**: Enforces strong password policies
- **Profile Management**: Users can update their name, email, and password
- **Protected Routes**: Middleware to protect authenticated endpoints
- **Token Refresh**: Automatic token refresh mechanism for seamless UX
- **Multi-User Support**: Each user has their own isolated grocery list

### Setting Up Authentication

#### 1. Database Setup

First, ensure PostgreSQL is running and initialize the authentication schema:

```bash
# Start PostgreSQL database
pnpm db:up

# Initialize database schema (creates users and refresh_tokens tables)
pnpm db:init
```

The schema includes:
- `users` table: Stores user accounts (email, password_hash, name)
- `refresh_tokens` table: Optional token storage for revocation (future use)
- `grocery_items.user_id`: Links items to specific users
- `lists` table: Stores grocery lists with owner information
- `list_members` table: Manages list sharing with permission levels (owner, editor, viewer)

**Note**: The `pnpm db:init` command runs all migrations including list sharing setup. If you need to run migrations manually, see the [Database Migrations](#database-migrations) section.

#### 2. Configure Environment Variables

Copy the example environment file and configure authentication settings:

```bash
cp .env.example .env
```

Edit `.env` to configure the authentication system (see "Environment Variables for Auth" section below).

#### 3. Enable Authentication

Set `VITE_AUTH_ENABLED=true` in your `.env` file to enable authentication features in the UI.

### Environment Variables for Auth

Configure these variables in your `.env` file:

#### Client Variables (Browser-Accessible)

```bash
# Enable authentication features in the UI
VITE_AUTH_ENABLED=true

# Backend API URL where auth server is running
VITE_API_URL=http://localhost:3001
```

#### Server Variables (Server-Side Only)

```bash
# Database connection string
DATABASE_URL=postgresql://grocery:grocery@localhost:5432/grocery_db

# JWT Access Token Secret (REQUIRED - Generate with: openssl rand -base64 32)
JWT_ACCESS_SECRET=your-super-secret-jwt-key-change-this-in-production

# JWT Refresh Token Secret (REQUIRED - Must be different from access secret)
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production

# Token expiration times
JWT_ACCESS_EXPIRY=15m    # Access token validity (15 minutes recommended)
JWT_REFRESH_EXPIRY=7d    # Refresh token validity (7 days recommended)

# Server configuration
PORT=3001                              # Auth API server port
NODE_ENV=development                   # Environment mode
CORS_ORIGIN=http://localhost:3000      # Allowed frontend origin

# Security settings
BCRYPT_ROUNDS=10                       # Bcrypt hashing rounds (10-12 recommended)
RATE_LIMIT_WINDOW_MS=900000            # Rate limit window (15 minutes)
RATE_LIMIT_MAX_REQUESTS=100            # Max requests per window
```

**IMPORTANT - Secret Generation:**

For production, you MUST generate strong, unique secrets:

```bash
# Generate JWT_ACCESS_SECRET
openssl rand -base64 32

# Generate JWT_REFRESH_SECRET (use a different value!)
openssl rand -base64 32

# Generate ZERO_AUTH_SECRET
openssl rand -base64 32
```

Never use default values in production! Store secrets securely using your hosting platform's secret management system.

### Running the Auth Server

The authentication API server runs separately from the Vite development server.

#### Option 1: Run All Services Together (Recommended)

```bash
pnpm dev:all
```

This starts:
- PostgreSQL database
- zero-cache server (real-time sync)
- Authentication API server (port 3001)
- Vite development server (port 3000)

#### Option 2: Run Services Individually

```bash
# Terminal 1: Start PostgreSQL
pnpm db:up

# Terminal 2: Start zero-cache
pnpm zero:dev

# Terminal 3: Start authentication API server
pnpm server:dev

# Terminal 4: Start Vite frontend
pnpm dev
```

#### Verify Auth Server is Running

Check the health endpoint:

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2025-10-26T...",
  "database": {
    "connected": true
  }
}
```

#### View API Documentation

Visit `http://localhost:3001/api` to see all available authentication endpoints.

### User Registration Process

#### How Registration Works

1. User submits email, password, and name
2. Server validates input (email format, password strength, name length)
3. Server checks if email is already registered
4. Password is hashed using bcrypt (12 rounds)
5. User account is created in database
6. JWT access and refresh tokens are generated
7. User data and tokens are returned to client

#### Registration Endpoint

**POST** `/api/auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "name": "John Doe"
}
```

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "user@example.com",
      "name": "John Doe",
      "created_at": "2025-10-26T..."
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Error Responses:**

- `400 Bad Request`: Invalid input (email format, password strength, name length)
- `409 Conflict`: Email already registered
- `429 Too Many Requests`: Rate limit exceeded (5 attempts per 15 minutes)
- `500 Internal Server Error`: Server error

#### Example Registration with cURL

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123",
    "name": "John Doe"
  }'
```

### Login Process

#### How Login Works

1. User submits email and password
2. Server validates input format
3. Server looks up user by email (case-insensitive)
4. Server compares password with stored hash using bcrypt
5. If valid, updates user's last login timestamp
6. Generates new JWT access and refresh tokens
7. Returns user data and tokens

#### Login Endpoint

**POST** `/api/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "user@example.com",
      "name": "John Doe",
      "created_at": "2025-10-26T..."
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Error Responses:**

- `400 Bad Request`: Missing email or password
- `401 Unauthorized`: Invalid email or password
- `429 Too Many Requests`: Rate limit exceeded (5 attempts per 15 minutes)
- `500 Internal Server Error`: Server error

**Security Note:** The server returns the same error message for invalid email and invalid password to prevent email enumeration attacks.

#### Example Login with cURL

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123"
  }'
```

#### Token Refresh

Access tokens expire after 15 minutes. Use the refresh token to obtain a new access token without requiring the user to log in again.

**POST** `/api/auth/refresh`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "new-access-token...",
    "refreshToken": "new-refresh-token..."
  }
}
```

#### Making Authenticated Requests

Include the access token in the Authorization header:

```bash
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer your-access-token-here"
```

#### Other Authentication Endpoints

**Get Current User:**
```
GET /api/auth/me
Headers: Authorization: Bearer <accessToken>
```

**Update Profile:**
```
PATCH /api/auth/profile
Headers: Authorization: Bearer <accessToken>
Body: { "name": "New Name", "email": "newemail@example.com" }
```

**Change Password:**
```
POST /api/auth/change-password
Headers: Authorization: Bearer <accessToken>
Body: { "currentPassword": "old", "newPassword": "New123" }
```

**Logout:**
```
POST /api/auth/logout
(Client-side: Delete tokens from storage)
```

### Security Considerations

The authentication system implements multiple layers of security:

#### 1. Password Security

- **Bcrypt Hashing**: Passwords hashed with 12 rounds (recommended: 10-12)
- **Never Stored Plain Text**: Only password hashes are stored
- **Strong Password Requirements**: Minimum 8 characters, mixed case, numbers
- **Password Change**: Requires current password verification

#### 2. Token Security

- **Short-Lived Access Tokens**: 15-minute expiration reduces attack window
- **Long-Lived Refresh Tokens**: 7-day expiration balances security and UX
- **Secure JWT Algorithm**: Uses HS256 (HMAC SHA-256)
- **Token Verification**: All protected routes verify token signature and expiration
- **Separate Secrets**: Different secrets for access and refresh tokens

#### 3. Rate Limiting

- **Authentication Endpoints**: 5 requests per 15 minutes (register, login)
- **General Endpoints**: 20 requests per 15 minutes (profile updates)
- **IP-Based**: Tracks requests per IP address
- **Prevents Brute Force**: Blocks rapid authentication attempts

#### 4. Input Validation

- **Email Format Validation**: Regex-based email validation
- **SQL Injection Prevention**: Parameterized queries with pg library
- **XSS Prevention**: Input sanitization with express-validator
- **CSRF Protection**: Token-based authentication (no cookies)

#### 5. Database Security

- **Connection Pooling**: Efficient database connection management
- **SSL/TLS**: Use `?sslmode=require` for production database connections
- **Prepared Statements**: All queries use parameterized values
- **Foreign Key Constraints**: CASCADE deletion for data integrity

#### 6. HTTP Security Headers

- **X-Content-Type-Options**: nosniff (prevents MIME sniffing)
- **X-Frame-Options**: DENY (prevents clickjacking)
- **X-XSS-Protection**: Enabled
- **Strict-Transport-Security**: Enforces HTTPS in production
- **CORS Configuration**: Restricts origins to trusted domains

#### 7. Environment Security

- **Secret Management**: Never commit secrets to git
- **Environment Variables**: Sensitive config stored in .env files
- **Production Secrets**: Generate strong, unique secrets with openssl
- **Secret Rotation**: Rotate JWT secrets every 90 days (recommended)

#### 8. Error Handling

- **Generic Error Messages**: Don't reveal whether email exists
- **No Stack Traces**: Production mode hides detailed errors
- **Logging**: Server-side logging for security events
- **Graceful Failures**: Fallback to generic errors

### Troubleshooting Auth Issues

#### Issue: "Cannot connect to database"

**Symptoms:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solutions:**
1. Ensure PostgreSQL is running:
   ```bash
   pnpm db:up
   docker ps  # Verify postgres container is running
   ```

2. Check DATABASE_URL in .env matches docker-compose.yml credentials

3. Verify PostgreSQL is listening on port 5432:
   ```bash
   docker compose logs postgres
   ```

#### Issue: "JWT secret not configured"

**Symptoms:**
```
Warning: Using default JWT secret - change in production!
```

**Solutions:**
1. Generate secure secrets:
   ```bash
   openssl rand -base64 32
   ```

2. Update .env file with generated secrets:
   ```bash
   JWT_ACCESS_SECRET=<generated-secret-1>
   JWT_REFRESH_SECRET=<generated-secret-2>
   ```

3. Restart the auth server:
   ```bash
   pnpm server:dev
   ```

#### Issue: "Token expired" or "Invalid token"

**Symptoms:**
```json
{
  "success": false,
  "error": "Invalid token",
  "message": "Access token expired"
}
```

**Solutions:**
1. Use the refresh token to get a new access token:
   ```bash
   curl -X POST http://localhost:3001/api/auth/refresh \
     -H "Content-Type: application/json" \
     -d '{"refreshToken": "your-refresh-token"}'
   ```

2. If refresh token is also expired, user must log in again

3. Check token expiration settings in .env:
   ```bash
   JWT_ACCESS_EXPIRY=15m   # Adjust as needed
   JWT_REFRESH_EXPIRY=7d   # Adjust as needed
   ```

#### Issue: "Too many requests" (Rate Limited)

**Symptoms:**
```json
{
  "success": false,
  "error": "Too many requests",
  "message": "Too many authentication attempts. Please try again later."
}
```

**Solutions:**
1. Wait 15 minutes before retrying

2. For development, increase rate limits in .env:
   ```bash
   RATE_LIMIT_MAX_REQUESTS=100  # Increase for development
   ```

3. For testing, disable rate limits temporarily in server/auth/routes.ts

#### Issue: "Password does not meet requirements"

**Symptoms:**
```json
{
  "success": false,
  "error": "Validation error",
  "message": "Password must contain at least one uppercase letter"
}
```

**Solutions:**
Ensure password meets all requirements:
- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)

Example valid password: `SecurePass123`

#### Issue: "CORS error" or "Blocked by CORS policy"

**Symptoms:**
```
Access to XMLHttpRequest at 'http://localhost:3001/api/auth/login'
from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Solutions:**
1. Verify CORS_ORIGIN in .env matches your frontend URL:
   ```bash
   CORS_ORIGIN=http://localhost:3000
   ```

2. For multiple origins, use comma-separated values:
   ```bash
   CORS_ORIGIN=http://localhost:3000,http://localhost:5173
   ```

3. Restart the auth server after changing CORS_ORIGIN

#### Issue: Database schema not initialized

**Symptoms:**
```
ERROR: relation "users" does not exist
```

**Solutions:**
1. Initialize the database schema:
   ```bash
   pnpm db:init
   ```

2. If above fails, manually run the schema file:
   ```bash
   psql -h localhost -U grocery -d grocery_db -f server/db/schema.sql
   # Password: grocery (from docker-compose.yml)
   ```

3. Verify tables were created:
   ```bash
   psql -h localhost -U grocery -d grocery_db -c "\dt"
   ```

#### Issue: Port already in use

**Symptoms:**
```
Error: listen EADDRINUSE: address already in use :::3001
```

**Solutions:**
1. Find and kill the process using port 3001:
   ```bash
   # Linux/Mac
   lsof -ti:3001 | xargs kill -9

   # Or change the port in .env
   PORT=3002
   ```

2. Verify no other server is running:
   ```bash
   ps aux | grep node
   ```

#### Issue: Authentication works but items not saving

**Symptoms:**
- User can log in successfully
- Items don't appear or aren't associated with user

**Solutions:**
1. Verify grocery_items table has user_id column:
   ```bash
   psql -h localhost -U grocery -d grocery_db \
     -c "\d grocery_items"
   ```

2. If user_id column is missing, run the schema migration:
   ```bash
   pnpm db:init
   ```

3. Check frontend is sending access token with grocery item requests

#### Getting Help

If you encounter issues not covered here:

1. Check server logs for detailed error messages:
   ```bash
   # Server logs appear in the terminal running pnpm server:dev
   ```

2. Check database logs:
   ```bash
   docker compose logs postgres
   ```

3. Verify environment variables are loaded:
   ```bash
   # In server/config/env.ts, enable DEBUG mode
   DEBUG_DB=true
   ```

4. Test API endpoints directly with cURL to isolate frontend vs backend issues

5. Check the /health endpoint to verify all services are running:
   ```bash
   curl http://localhost:3001/health
   ```

### Troubleshooting List Sharing Issues

#### Issue: "Cannot add member - user not found"

**Symptoms:**
```json
{
  "success": false,
  "error": "User not found",
  "message": "No user exists with email: user@example.com"
}
```

**Solutions:**
1. Verify the email address is correct (check for typos)
2. Ensure the user has registered an account with that exact email
3. Email matching is case-insensitive, but the account must exist
4. Have the user register first, then try adding them again

#### Issue: "Permission denied" when trying to share list

**Symptoms:**
```json
{
  "success": false,
  "error": "Forbidden",
  "message": "You do not have permission to perform this action"
}
```

**Solutions:**
1. Check your permission level - only owners can share lists:
   ```bash
   # View your permission for a list
   curl -X GET http://localhost:3001/api/lists/<list-id> \
     -H "Authorization: Bearer <your-token>"
   ```

2. If you need to share the list, ask the owner to either:
   - Share it with the new user for you
   - Transfer ownership to you

#### Issue: "Cannot remove last owner from list"

**Symptoms:**
```
ERROR: Cannot remove the last owner from a list. Transfer ownership first or delete the list.
```

**Solutions:**
1. Add another user as owner before removing yourself:
   ```bash
   # First: Promote another member to owner
   curl -X PUT http://localhost:3001/api/lists/<list-id>/members/<member-id> \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <your-token>" \
     -d '{"permission": "owner"}'

   # Then: Remove yourself or change your permission
   ```

2. Or delete the list entirely if you no longer need it:
   ```bash
   curl -X DELETE http://localhost:3001/api/lists/<list-id> \
     -H "Authorization: Bearer <your-token>"
   ```

#### Issue: List members not seeing real-time updates

**Symptoms:**
- User A adds an item, but User B doesn't see it
- Changes only appear after page refresh
- "Sync status" shows disconnected

**Solutions:**
1. Check Zero cache server is running:
   ```bash
   # Should see zero-cache process
   ps aux | grep zero-cache
   ```

2. Verify WebSocket connection in browser console:
   ```javascript
   // Should see WebSocket connection
   // Look for: "WebSocket connected" or similar
   ```

3. Check firewall settings allow WebSocket connections (port 4848)

4. Restart zero-cache server:
   ```bash
   pnpm zero:dev
   ```

5. Clear browser cache and reconnect

#### Issue: "List not found" after being shared

**Symptoms:**
- Owner shares list with you
- List doesn't appear in your list selector
- API returns 404 for the list

**Solutions:**
1. Refresh the page to load new lists
2. Check you're logged in with the correct account
3. Verify the owner used your correct email address
4. Check the list wasn't deleted by the owner

5. Manually query your lists to see if it appears:
   ```bash
   curl -X GET http://localhost:3001/api/lists \
     -H "Authorization: Bearer <your-token>"
   ```

#### Issue: "Cannot edit items" despite being an editor

**Symptoms:**
- You have editor permission
- Cannot add/edit/delete items
- Buttons are disabled or missing

**Solutions:**
1. Verify your permission level:
   - Go to "Manage List" > "General" tab
   - Check "Your Role" shows "editor" or "owner"

2. Check if the list was deleted:
   ```bash
   curl -X GET http://localhost:3001/api/lists/<list-id> \
     -H "Authorization: Bearer <your-token>"
   ```

3. Ask the owner to check your permission:
   - Owner should see you in the Members tab
   - Permission should be set to "editor"

4. Try logging out and back in to refresh permissions

#### Issue: Database migration errors with list sharing

**Symptoms:**
```
ERROR: relation "lists" does not exist
ERROR: relation "list_members" does not exist
```

**Solutions:**
1. Run the list sharing migration:
   ```bash
   psql -h localhost -U grocery -d grocery_db \
     -f server/migrations/003_add_list_sharing.sql
   ```

2. If migration fails, check existing data:
   ```bash
   # Check if tables exist
   psql -h localhost -U grocery -d grocery_db -c "\dt"
   ```

3. For a fresh start (WARNING: deletes all data):
   ```bash
   pnpm db:reset
   pnpm db:init
   ```

4. Verify migration completed:
   ```bash
   psql -h localhost -U grocery -d grocery_db -c "
     SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public'
     AND table_name IN ('lists', 'list_members');
   "
   ```

#### Issue: "List has too many members" performance degradation

**Symptoms:**
- Slow loading with many list members
- UI becomes sluggish
- High database query times

**Solutions:**
1. Limit list membership to active users only
2. Remove inactive members to improve performance
3. Consider splitting into multiple lists for different groups
4. Check database indexes are created:
   ```bash
   psql -h localhost -U grocery -d grocery_db -c "
     SELECT indexname, tablename
     FROM pg_indexes
     WHERE tablename IN ('lists', 'list_members');
   "
   ```

#### Issue: Permission changes not taking effect

**Symptoms:**
- Owner changes member permission
- Member still has old permissions
- Changes don't sync

**Solutions:**
1. Have the affected user log out and back in
2. Clear browser cache and local storage:
   ```javascript
   // In browser console
   localStorage.clear();
   sessionStorage.clear();
   location.reload();
   ```

3. Verify the change in database:
   ```bash
   psql -h localhost -U grocery -d grocery_db -c "
     SELECT user_id, permission_level
     FROM list_members
     WHERE list_id = '<list-id>';
   "
   ```

4. Check for caching issues with Zero:
   ```bash
   # Restart zero-cache to clear cache
   pnpm zero:dev
   ```

#### Getting Help with List Sharing

If you encounter issues not covered here:

1. **Check Server Logs**:
   ```bash
   # API server logs
   # (in terminal running pnpm server:dev)

   # Zero cache logs
   # (in terminal running pnpm zero:dev)
   ```

2. **Check Database State**:
   ```bash
   # View all lists
   psql -h localhost -U grocery -d grocery_db -c "SELECT * FROM lists;"

   # View all list members
   psql -h localhost -U grocery -d grocery_db -c "SELECT * FROM list_members;"
   ```

3. **Test API Endpoints Directly**:
   ```bash
   # Health check
   curl http://localhost:3001/health

   # Lists health check
   curl http://localhost:3001/api/lists/health
   ```

4. **Enable Debug Mode**:
   ```bash
   # In .env file
   DEBUG=true
   LOG_LEVEL=debug
   ```

5. **Check Browser Console**: Look for JavaScript errors or network failures

## List Sharing & Collaboration

The Grocery List app includes powerful list sharing and collaboration features that allow multiple users to work together on grocery lists with fine-grained permission controls.

### Overview

List sharing enables you to:
- Create multiple grocery lists for different purposes (weekly shopping, party supplies, etc.)
- Share lists with other users via email
- Control what each member can do with permission levels
- Collaborate in real-time with instant synchronization
- Manage list members and their access levels
- Track who added items and when

### Creating Lists

#### Create a New List

1. Click the "New List" button in the list selector dropdown
2. Enter a name for your list (e.g., "Weekly Shopping", "Party Supplies")
3. Click "Create" to create the list
4. You become the owner of the list automatically

**Via API:**

```bash
curl -X POST http://localhost:3001/api/lists \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-access-token>" \
  -d '{
    "name": "Weekly Shopping"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "list": {
      "id": "uuid-here",
      "name": "Weekly Shopping",
      "ownerId": "user-uuid",
      "createdAt": 1729900000000,
      "updatedAt": 1729900000000,
      "memberCount": 1,
      "currentUserPermission": "owner"
    }
  }
}
```

#### Switch Between Lists

1. Click the list selector dropdown at the top of the page
2. Select a list from your lists (owned lists and shared lists)
3. The view updates to show items from the selected list

### Sharing Lists with Others

Only **list owners** can share lists and invite new members.

#### How to Share a List

1. Open the list you want to share
2. Click the "Manage List" button (gear icon)
3. Go to the "Members" tab
4. Enter the email address of the person you want to invite
5. Select a permission level (Editor or Viewer)
6. Click "Send Invitation"

The user must have an account with that email address to be added to the list.

**Via API:**

```bash
curl -X POST http://localhost:3001/api/lists/<list-id>/members \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-access-token>" \
  -d '{
    "userId": "user-uuid-to-add",
    "permission": "editor"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "member": {
      "id": "member-uuid",
      "listId": "list-uuid",
      "userId": "user-uuid",
      "userEmail": "user@example.com",
      "userName": "John Doe",
      "permission": "editor",
      "addedAt": 1729900000000,
      "addedBy": "owner-uuid"
    }
  }
}
```

### Permission Levels Explained

The app supports three permission levels for list access:

#### Owner

- **Full Control**: Complete access to all list features
- **What Owners Can Do**:
  - Add, edit, and delete items
  - Share the list with other users
  - Manage list members (add, remove, change permissions)
  - Rename the list
  - Delete the list (permanently removes for all members)
- **Who Gets This**: The user who created the list
- **Special Notes**:
  - Each list must have at least one owner
  - Ownership can be transferred or shared with other users
  - Only owners can see the "Danger Zone" tab

#### Editor

- **Can Modify Items**: Full access to manage grocery items
- **What Editors Can Do**:
  - Add new items to the list
  - Edit existing items (name, quantity, category, notes)
  - Mark items as gotten/not gotten
  - Delete items from the list
  - View all list members
  - Use bulk operations (mark all gotten, delete all gotten)
- **What Editors Cannot Do**:
  - Share the list with others
  - Remove list members
  - Change permissions
  - Rename or delete the list
- **Use Case**: Family members, roommates, or close collaborators who actively shop together

#### Viewer

- **Read-Only Access**: Can view items but cannot make changes
- **What Viewers Can Do**:
  - View all items in the list
  - See item details (name, quantity, category, notes, gotten status)
  - View list members
  - Search and filter items
  - Export or print the list
- **What Viewers Cannot Do**:
  - Add, edit, or delete items
  - Mark items as gotten
  - Share the list
  - Modify list settings
- **Use Case**: People who need to see the list but shouldn't modify it (e.g., a shopper following instructions)

### Managing List Members

#### View Current Members

1. Click "Manage List" on the list you want to view
2. Go to the "Members" tab
3. See all members with their:
   - Name and email
   - Permission level
   - Join date
   - Who invited them

**Via API:**

```bash
curl -X GET http://localhost:3001/api/lists/<list-id> \
  -H "Authorization: Bearer <your-access-token>"
```

#### Change Member Permission

**Owners only** can change member permissions.

1. Go to "Manage List" > "Members" tab
2. Find the member you want to update
3. Use the permission dropdown next to their name
4. Select the new permission level (Editor or Viewer)
5. The change takes effect immediately

**Via API:**

```bash
curl -X PUT http://localhost:3001/api/lists/<list-id>/members/<member-id> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-access-token>" \
  -d '{
    "permission": "viewer"
  }'
```

#### Remove a Member

**Owners only** can remove members from a list.

1. Go to "Manage List" > "Members" tab
2. Find the member you want to remove
3. Click the remove button (×) next to their name
4. Confirm the removal
5. The user immediately loses access to the list

**Important**: You cannot remove yourself if you are the only owner. Transfer ownership first or delete the list.

**Via API:**

```bash
curl -X DELETE http://localhost:3001/api/lists/<list-id>/members/<member-id> \
  -H "Authorization: Bearer <your-access-token>"
```

### Real-Time Collaboration Features

When multiple users are working on the same list, the app provides seamless real-time collaboration:

#### Instant Synchronization

- **Item Changes**: When anyone adds, edits, or deletes an item, all other users see the change instantly
- **Status Updates**: When someone marks an item as gotten, everyone sees the update in real-time
- **Member Changes**: When the owner adds or removes members, the list updates for everyone
- **No Refresh Needed**: All changes happen automatically without page refresh

#### Conflict Resolution

The app uses Zero's built-in conflict resolution:
- **Last Write Wins**: If two users edit the same item simultaneously, the last change is applied
- **Automatic Merge**: Zero handles concurrent edits gracefully
- **No Data Loss**: All changes are preserved and synced

#### Offline Support

- **Work Offline**: Add, edit, or delete items without internet connection
- **Local Queue**: Changes are stored locally until connection is restored
- **Auto-Sync**: When back online, all changes sync automatically
- **Conflict Handling**: Zero resolves any conflicts that occurred while offline

### Renaming and Managing Lists

#### Rename a List

**Owners and Editors** can rename lists.

1. Click "Manage List" on the list
2. Go to the "General" tab
3. Edit the list name in the text field
4. Click "Rename"
5. All members see the updated name immediately

**Via API:**

```bash
curl -X PUT http://localhost:3001/api/lists/<list-id> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-access-token>" \
  -d '{
    "name": "Updated List Name"
  }'
```

#### Delete a List

**Owners only** can delete lists.

**Warning**: Deleting a list is permanent and cannot be undone. All items and member access will be removed.

1. Click "Manage List" on the list
2. Go to the "Danger Zone" tab (owners only)
3. Click "Delete List"
4. Confirm by typing the list name exactly as shown
5. Click "Yes, Delete Permanently"

**Via API:**

```bash
curl -X DELETE http://localhost:3001/api/lists/<list-id> \
  -H "Authorization: Bearer <your-access-token>"
```

### List Sharing Best Practices

#### Security

- Only share lists with people you trust
- Use Viewer permission for untrusted users who only need to see the list
- Regularly review list members and remove inactive users
- Don't share your account credentials with others - use list sharing instead

#### Organization

- Create separate lists for different purposes (weekly shopping, special events, etc.)
- Use descriptive list names (e.g., "Thanksgiving Dinner" instead of "List 1")
- Archive or delete old lists to keep your list organized
- Assign appropriate permissions based on user roles

#### Collaboration

- Use Editor permission for active collaborators who help with shopping
- Use Viewer permission for people who just need to reference the list
- Communicate with list members outside the app for complex planning
- Review and consolidate duplicate items added by multiple users

### API Endpoints for Lists

All list endpoints require authentication. Include your access token in the Authorization header:
```
Authorization: Bearer <your-access-token>
```

#### List Management Endpoints

**Create a List**
```http
POST /api/lists
Content-Type: application/json
Authorization: Bearer <token>

Body: {
  "name": "Weekly Shopping",
  "color": "#4caf50",    // Optional: Hex color code
  "icon": "🛒"           // Optional: Emoji or icon
}

Response: {
  "success": true,
  "data": {
    "list": {
      "id": "uuid",
      "name": "Weekly Shopping",
      "ownerId": "user-uuid",
      "color": "#4caf50",
      "icon": "🛒",
      "createdAt": 1729900000000,
      "updatedAt": 1729900000000,
      "memberCount": 1,
      "currentUserPermission": "owner",
      "isArchived": false,
      "isPinned": false
    }
  }
}
```

**Get All Lists**
```http
GET /api/lists
Authorization: Bearer <token>

Response: {
  "success": true,
  "data": {
    "lists": [
      {
        "id": "uuid",
        "name": "Weekly Shopping",
        "ownerId": "user-uuid",
        "memberCount": 3,
        "currentUserPermission": "owner",
        "isArchived": false,
        "isPinned": true,
        ...
      }
    ]
  }
}
```

**Get Specific List with Members**
```http
GET /api/lists/:id
Authorization: Bearer <token>

Response: {
  "success": true,
  "data": {
    "list": {
      "id": "uuid",
      "name": "Weekly Shopping",
      "members": [
        {
          "id": "member-uuid",
          "userId": "user-uuid",
          "userEmail": "user@example.com",
          "userName": "John Doe",
          "permission": "editor",
          "addedAt": 1729900000000,
          "addedBy": "owner-uuid"
        }
      ],
      ...
    }
  }
}
```

**Update List**
```http
PUT /api/lists/:id
Content-Type: application/json
Authorization: Bearer <token>

Body: {
  "name": "Monthly Shopping",
  "color": "#ff5722",
  "icon": "🛍️"
}

Response: {
  "success": true,
  "data": { "list": { ... } }
}
```

**Delete List** (Owner only)
```http
DELETE /api/lists/:id
Authorization: Bearer <token>

Response: {
  "success": true,
  "message": "List deleted successfully"
}
```

#### Member Management Endpoints

**Add Member to List** (Owner only)
```http
POST /api/lists/:id/members
Content-Type: application/json
Authorization: Bearer <token>

Body: {
  "userId": "user-uuid",
  "permission": "editor"  // "owner", "editor", or "viewer"
}

Response: {
  "success": true,
  "data": {
    "member": {
      "id": "member-uuid",
      "listId": "list-uuid",
      "userId": "user-uuid",
      "userEmail": "user@example.com",
      "userName": "John Doe",
      "permission": "editor",
      "addedAt": 1729900000000,
      "addedBy": "owner-uuid"
    }
  }
}
```

**Update Member Permission** (Owner only)
```http
PUT /api/lists/:id/members/:userId
Content-Type: application/json
Authorization: Bearer <token>

Body: {
  "permission": "viewer"
}

Response: {
  "success": true,
  "data": { "member": { ... } }
}
```

**Remove Member** (Owner only)
```http
DELETE /api/lists/:id/members/:userId
Authorization: Bearer <token>

Response: {
  "success": true,
  "message": "Member removed successfully"
}
```

#### Invite Link Endpoints

**Generate Invite Link** (Owner only)
```http
POST /api/lists/:id/invite
Content-Type: application/json
Authorization: Bearer <token>

Body: {
  "expiresInDays": 7  // Optional: 1-365 days, default 7
}

Response: {
  "success": true,
  "data": {
    "inviteToken": "32-char-token",
    "expiresAt": "2025-11-02T12:00:00Z",
    "inviteUrl": "http://yourapp.com/invite/32-char-token"
  }
}
```

**Get Invite Details** (Public)
```http
GET /api/invites/:token

Response: {
  "success": true,
  "data": {
    "listId": "uuid",
    "listName": "Weekly Shopping",
    "ownerName": "Alice Johnson",
    "memberCount": 5,
    "expiresAt": "2025-11-02T12:00:00Z"
  }
}
```

**Accept Invite**
```http
POST /api/invites/:token/accept
Authorization: Bearer <token>

Response: {
  "success": true,
  "message": "You have joined the list",
  "data": {
    "listId": "uuid",
    "listName": "Weekly Shopping"
  }
}
```

**Revoke Invite Link** (Owner only)
```http
DELETE /api/lists/:id/invite
Authorization: Bearer <token>

Response: {
  "success": true,
  "message": "Invite link revoked successfully"
}
```

#### Advanced List Operations

**Leave a List**
```http
POST /api/lists/:id/leave
Authorization: Bearer <token>

Response: {
  "success": true,
  "message": "You have left the list"
}
```

**Transfer Ownership** (Owner only)
```http
POST /api/lists/:id/transfer
Content-Type: application/json
Authorization: Bearer <token>

Body: {
  "newOwnerId": "user-uuid",
  "confirmation": true
}

Response: {
  "success": true,
  "message": "Ownership transferred successfully",
  "data": { "list": { ... } }
}
```

**Duplicate List**
```http
POST /api/lists/:id/duplicate
Content-Type: application/json
Authorization: Bearer <token>

Body: {
  "name": "Copy of Weekly Shopping"  // Optional
}

Response: {
  "success": true,
  "data": {
    "list": {
      "id": "new-uuid",
      "name": "Copy of Weekly Shopping",
      ...
    }
  }
}
```

**Archive List** (Owner only)
```http
POST /api/lists/:id/archive
Authorization: Bearer <token>

Response: {
  "success": true,
  "message": "List archived successfully",
  "data": { "list": { ... } }
}
```

**Unarchive List** (Owner only)
```http
POST /api/lists/:id/unarchive
Authorization: Bearer <token>

Response: {
  "success": true,
  "message": "List unarchived successfully",
  "data": { "list": { ... } }
}
```

**Pin List**
```http
POST /api/lists/:id/pin
Authorization: Bearer <token>

Response: {
  "success": true,
  "message": "List pinned successfully"
}
```

**Unpin List**
```http
DELETE /api/lists/:id/unpin
Authorization: Bearer <token>

Response: {
  "success": true,
  "message": "List unpinned successfully"
}
```

#### Statistics & Activity Endpoints

**Get List Statistics**
```http
GET /api/lists/:id/stats
Authorization: Bearer <token>

Response: {
  "success": true,
  "data": {
    "stats": {
      "totalItems": 25,
      "gottenItems": 10,
      "pendingItems": 15,
      "completionRate": 40,
      "categoryBreakdown": {
        "Produce": 8,
        "Dairy": 5,
        ...
      },
      "recentActivity": {
        "lastItemAdded": "2025-10-26T10:30:00Z",
        "lastItemCompleted": "2025-10-26T11:00:00Z",
        "activeMembers": 3
      }
    }
  }
}
```

**Get List Activities**
```http
GET /api/lists/:id/activities?limit=50&offset=0
Authorization: Bearer <token>

Response: {
  "success": true,
  "data": {
    "activities": [
      {
        "id": "activity-uuid",
        "listId": "list-uuid",
        "userId": "user-uuid",
        "userName": "John Doe",
        "userEmail": "john@example.com",
        "actionType": "item_added",
        "targetType": "item",
        "targetId": "item-uuid",
        "targetName": "Apples",
        "details": { "quantity": 5 },
        "createdAt": "2025-10-26T10:30:00Z"
      }
    ],
    "total": 150,
    "limit": 50,
    "offset": 0
  }
}
```

**Activity Types:**
- `list_created` - List was created
- `list_renamed` - List name was changed
- `list_deleted` - List was deleted
- `member_added` - Member was added to list
- `member_removed` - Member was removed from list
- `permission_changed` - Member permission was updated
- `item_added` - Item was added to list
- `item_updated` - Item was modified
- `item_deleted` - Item was removed
- `item_completed` - Item was marked as gotten
- `item_uncompleted` - Item was marked as not gotten
- `ownership_transferred` - List ownership was transferred
- `list_duplicated` - List was cloned

#### Error Responses

All endpoints may return the following error responses:

**400 Bad Request**
```json
{
  "success": false,
  "error": "Validation error",
  "message": "Invalid request data",
  "details": [...]
}
```

**401 Unauthorized**
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

**403 Forbidden**
```json
{
  "success": false,
  "error": "Forbidden",
  "message": "You do not have permission to perform this action"
}
```

**404 Not Found**
```json
{
  "success": false,
  "error": "Not found",
  "message": "List not found or you don't have access"
}
```

**500 Internal Server Error**
```json
{
  "success": false,
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

See the [Authentication](#authentication) section for details on obtaining access tokens.

## Usage

### Adding Items

1. Enter the item name in the text field
2. Enter the quantity (default is 1)
3. Select a category from the dropdown (default is "Other")
4. Optionally, add notes in the textarea (e.g., "Organic", "Brand: XYZ", "Aisle 3")
5. Click "Add Item"

Each item is automatically assigned a color-coded badge based on its category, making it easy to visually organize your shopping list.

**Notes Field:**
- The notes field is optional and can be left blank
- Use it to add extra context like:
  - Brand preferences ("Brand: Organic Valley")
  - Location in store ("Aisle 5, bottom shelf")
  - Special instructions ("Get the ripe ones")
  - Alternatives ("Or get pears if apples not available")
- Notes are displayed in a collapsible section on each item (see "Viewing Notes" below)

### Viewing Notes

If an item has notes, you'll see a notes icon (📋) next to the category badge:
- Click the notes icon to expand and view the notes
- The icon changes to 📝 when notes are visible
- Click again to collapse the notes
- Notes are displayed in a highlighted section below the item details
- The notes section slides in smoothly with an animation

### Marking Items as Gotten

Click the checkbox next to an item to toggle its "gotten" status. Gotten items will have a strikethrough style.

### Deleting Items

Click the trash icon (🗑️) next to an item to delete it.

### Bulk Operations

The app includes powerful bulk operations to help you manage multiple items at once:

**Mark All as Gotten:**
- Click the "✓ Mark All Gotten" button to mark all items as gotten at once
- The button shows how many items will be affected (e.g., "Mark All Gotten (5)")
- A confirmation dialog will appear before proceeding
- Disabled when all items are already marked as gotten
- Great for quickly marking everything after a shopping trip!

**Delete All Gotten Items:**
- Click the "🗑️ Delete All Gotten" button to remove all gotten items from the list
- The button shows how many items will be deleted (e.g., "Delete All Gotten (3)")
- A warning confirmation dialog will appear before proceeding
- This action cannot be undone, so use with caution
- Disabled when there are no gotten items to delete
- Perfect for cleaning up your list after shopping!

Both bulk operations:
- Work with the entire list (not just filtered items)
- Include confirmation dialogs to prevent accidental actions
- Are disabled when not applicable (buttons are grayed out)
- Show real-time counts of affected items
- Sync changes immediately across all devices

### Search, Filter, and Sort

The app includes powerful search, filter, and sort capabilities to help you organize and find items:

**Search by Name:**
- Type in the search box at the top of the list to filter items by name
- Search is case-insensitive and matches partial names
- Results update in real-time as you type (debounced for performance)
- Clear the search box to show all items again

**Show/Hide Gotten Items:**
- Use the "Show gotten items" toggle to filter out items you've already gotten
- Checked: Shows all items (both gotten and not gotten)
- Unchecked: Only shows items that haven't been gotten yet

**Filter by Category:**
- Click on category chips to filter which categories are shown
- Active categories (shown) are fully colored and opaque
- Inactive categories (hidden) are grayed out and semi-transparent
- Click again to toggle categories on/off
- All categories are shown by default
- Combine category filters with search and gotten status for powerful filtering

**Sort Options:**
- **Sort by Name**: Sort items alphabetically (A-Z or Z-A)
- **Sort by Quantity**: Sort items by quantity (lowest to highest or highest to lowest)
- **Sort by Date**: Sort items by creation date (newest first or oldest first)
- Click the arrow button (↑/↓) to toggle between ascending and descending order
- Sorting is applied after filtering, so you can combine search/filter with any sort option

**Filter and Sort Combinations:**
- Search, category filters, gotten filter, and sort work together seamlessly
- For example: search for "apple", show only Produce category, hide gotten items, and sort by quantity to see how many apples you still need to buy
- The results counter shows how many items match your current filters (e.g., "Showing 3 of 10 items")

**Results Counter:**
- Displays at the top of the list when filters are active
- Shows the number of visible items vs. total items
- Updates automatically as you add, remove, or modify items
- Helps you quickly see how many items match your search and filter criteria

### Exporting Lists

You can export your grocery lists to various formats for backup, sharing, or printing.

**Export Options:**

1. **JSON Format** - Machine-readable format for backup or data portability
   - Click "Manage List" > "Export" > "Export as JSON"
   - Contains all list data including items, metadata, and statistics
   - Perfect for backing up your lists or migrating data

2. **CSV Format** - Spreadsheet-compatible format
   - Click "Manage List" > "Export" > "Export as CSV"
   - Opens in Excel, Google Sheets, or any spreadsheet software
   - Columns: Name, Quantity, Category, Notes, Gotten Status
   - Ideal for data analysis or integration with other tools

3. **Plain Text** - Simple text format
   - Click "Manage List" > "Export" > "Export as Text"
   - Clean, readable format for sharing or printing
   - Organized by category with checkboxes
   - Great for quick reference or sending via email

4. **Print** - Print-optimized layout
   - Click "Manage List" > "Export" > "Print List"
   - Opens browser print dialog
   - Formatted for paper with clean layout
   - Perfect for taking to the store

**Export Features:**
- All exports include list name, creation date, and member count
- CSV and JSON exports preserve all item metadata
- Exports work offline (uses cached data)
- All list members with viewer permission or higher can export

### Real-Time Collaboration

Open the app in multiple browser tabs or on different devices and watch changes sync in real-time! All users see updates instantly thanks to Zero's real-time synchronization.

**Collaboration Features:**
- Changes appear within 50-500ms across all devices
- No page refresh needed - updates happen automatically
- Works with multiple lists simultaneously
- Offline changes sync when connection is restored
- Permission changes take effect immediately
- Activity trail shows who made each change

## Database Migrations

The application uses PostgreSQL with a comprehensive schema that supports authentication, list sharing, and real-time collaboration.

### Available Migrations

The following migrations are included in the `server/migrations/` directory:

1. **001_add_authentication.sql** - Creates users and refresh_tokens tables
2. **002_add_lists.sql** - Creates lists table for organizing grocery items
3. **003_add_list_sharing.sql** - Adds list_members table and sharing functionality
4. **004_migrate_to_lists.sql** - Migrates existing items to list-based structure
5. **005_add_list_activities.sql** - Creates activity/audit trail system
6. **006_add_list_customization.sql** - Adds color, icon, and archive fields
7. **007_add_invite_links.sql** - Creates invite link system with expiration
8. **008_add_list_archive.sql** - Adds archive functionality (if not in 006)
9. **009_add_list_pins.sql** - Adds user-specific list pinning

All migrations include:
- Forward migration (applies changes)
- Rollback scripts (reverts changes)
- Data integrity constraints
- Performance indexes
- Helper functions and triggers

### Running Migrations

#### Automatic (Recommended)

The easiest way to set up the database is to use the initialization script:

```bash
# Initialize database with all migrations
pnpm db:init
```

This runs all migrations in order and sets up the complete schema.

#### Manual Migration

To run migrations manually:

```bash
# Run a specific migration
psql -h localhost -U grocery -d grocery_db -f server/migrations/001_add_authentication.sql

# Run all migrations in order
psql -h localhost -U grocery -d grocery_db -f server/migrations/001_add_authentication.sql
psql -h localhost -U grocery -d grocery_db -f server/migrations/002_add_lists.sql
psql -h localhost -U grocery -d grocery_db -f server/migrations/003_add_list_sharing.sql
psql -h localhost -U grocery -d grocery_db -f server/migrations/004_migrate_to_lists.sql
```

**Password**: `grocery` (from docker-compose.yml)

### Verifying Migrations

Check that all tables were created successfully:

```bash
# List all tables
psql -h localhost -U grocery -d grocery_db -c "\dt"

# Expected tables:
# - users
# - refresh_tokens
# - lists
# - list_members
# - grocery_items
```

Check that indexes were created:

```bash
# List all indexes
psql -h localhost -U grocery -d grocery_db -c "\di"
```

### Rolling Back Migrations

Rollback scripts are available in `server/migrations/rollback/`:

```bash
# Rollback list sharing (WARNING: removes lists and list_members tables)
psql -h localhost -U grocery -d grocery_db \
  -f server/migrations/rollback/003_remove_list_sharing.sql

# Rollback authentication (WARNING: removes users and auth tables)
psql -h localhost -U grocery -d grocery_db \
  -f server/migrations/rollback/001_add_authentication_rollback.sql
```

**Warning**: Rollbacks will delete data. Use with caution!

### Database Reset

To completely reset the database (deletes all data):

```bash
# Stop database
docker compose down -v

# Start database fresh
docker compose up -d

# Wait for PostgreSQL to start
sleep 5

# Re-run migrations
pnpm db:init
```

### Database Schema Overview

The complete database schema includes:

**Users & Authentication:**
- `users` - User accounts with authentication credentials
- `refresh_tokens` - JWT refresh tokens for secure token rotation

**List Management:**
- `lists` - Grocery lists with owner, customization (color, icon), archive status
- `list_members` - Junction table for sharing with permission levels (owner/editor/viewer)
- `grocery_items` - Individual items linked to lists and users
- `list_activities` - Audit trail of all list actions (items, members, changes)
- `invite_links` - Shareable invite links with expiration dates
- `list_pins` - User-specific list pinning for favorites

**Helper Functions:**
- `user_has_list_access(user_id, list_id)` - Check if user can access list
- `get_user_list_permission(user_id, list_id)` - Get user's permission level
- `update_list_access_time(user_id, list_id)` - Track last access time
- `ensure_list_owner_membership()` - Auto-add owner to list_members
- `prevent_last_owner_removal()` - Prevent removing sole owner
- `log_list_activity()` - Automatically log activities on list/item changes

**Views:**
- `user_lists_with_details` - Lists with member counts, permissions, and customization
- `list_members_with_details` - Members with full user information
- `list_activity_summary` - Aggregated activity statistics per list

**Indexes:**
- Performance-optimized indexes on all foreign keys and frequently queried columns
- Composite indexes for permission checking and activity retrieval
- Unique constraints on email addresses and invite tokens

For the complete schema definition, see `server/db/schema.sql`.

## Implementation Notes

The app uses Zero for real-time collaborative synchronization, providing:

- ✅ Local-first architecture with zero-cache
- ✅ Real-time sync across devices and users
- ✅ Offline-first with automatic sync when reconnected
- ✅ Type-safe queries with TypeScript
- ✅ Conflict-free collaborative editing
- ✅ PostgreSQL backend for persistence

## Data Schema

```typescript
// Core Item Type
interface GroceryItem {
  id: string;          // UUID
  name: string;        // Item name
  quantity: number;    // Quantity to buy
  gotten: boolean;     // Whether item is gotten
  category: Category;  // Item category
  notes: string;       // Optional notes/description
  userId: string;      // User who created the item
  listId: string;      // List this item belongs to
  createdAt: number;   // Timestamp
}

// List Types
interface GroceryList {
  id: string;          // UUID
  name: string;        // List name
  ownerId: string;     // User who created the list
  color: string;       // Hex color code (e.g., "#4caf50")
  icon: string;        // Emoji or icon (e.g., "🛒")
  isArchived: boolean; // Whether list is archived
  createdAt: number;   // Timestamp
  updatedAt: number;   // Last modified timestamp
}

interface ListWithMembers extends GroceryList {
  members: ListMember[];           // Array of list members
  memberCount: number;             // Total member count
  currentUserPermission: ListPermission;  // Current user's permission
  isPinned: boolean;               // Whether user has pinned this list
}

// Member & Permission Types
interface ListMember {
  id: string;              // UUID
  listId: string;          // List UUID
  userId: string;          // User UUID
  userEmail: string;       // User's email
  userName: string;        // User's display name
  permission: ListPermission;  // Access level
  addedAt: number;         // When added to list
  addedBy: string;         // User who invited them
}

type ListPermission = 'owner' | 'editor' | 'viewer';

// Invite Link Types
interface InviteLink {
  id: string;              // UUID
  listId: string;          // List UUID
  token: string;           // 32-character unique token
  createdBy: string;       // User who created invite
  expiresAt: Date;         // Expiration timestamp
  createdAt: Date;         // Creation timestamp
}

interface InviteDetails {
  listId: string;          // List UUID
  listName: string;        // List name
  ownerName: string;       // Owner's display name
  memberCount: number;     // Current member count
  expiresAt: Date;         // Expiration timestamp
}

// Activity & Statistics Types
interface ListActivity {
  id: string;              // UUID
  listId: string;          // List UUID
  userId: string;          // User who performed action
  userName: string;        // User's display name
  userEmail: string;       // User's email
  actionType: ActivityType;    // Type of action
  targetType: string;      // Type of target (list, item, member)
  targetId: string;        // Target UUID
  targetName: string;      // Target display name
  details: object;         // Additional action details
  createdAt: Date;         // Action timestamp
}

type ActivityType =
  | 'list_created'
  | 'list_renamed'
  | 'list_deleted'
  | 'member_added'
  | 'member_removed'
  | 'permission_changed'
  | 'item_added'
  | 'item_updated'
  | 'item_deleted'
  | 'item_completed'
  | 'item_uncompleted'
  | 'ownership_transferred'
  | 'list_duplicated';

interface ListStatistics {
  totalItems: number;               // Total items in list
  gottenItems: number;              // Items marked as gotten
  pendingItems: number;             // Items not yet gotten
  completionRate: number;           // Percentage completed (0-100)
  categoryBreakdown: Record<Category, number>;  // Items per category
  recentActivity: {
    lastItemAdded: Date | null;     // Last item added timestamp
    lastItemCompleted: Date | null; // Last item completed timestamp
    activeMembers: number;          // Members active in last 7 days
  };
}

// Category Type
type Category =
  | 'Produce'
  | 'Dairy'
  | 'Meat'
  | 'Bakery'
  | 'Pantry'
  | 'Frozen'
  | 'Beverages'
  | 'Other';

// User Type
interface User {
  id: string;              // UUID
  email: string;           // User email (unique)
  name: string;            // Display name
  createdAt: Date;         // Registration timestamp
  lastLoginAt: Date | null; // Last login timestamp
}
```

## Browser Compatibility

- Chrome/Edge: ✅
- Firefox: ✅
- Safari: ✅
- Opera: ✅

Requires modern browser with WebSocket support for real-time sync.

## License

MIT

## Contributing

Feel free to submit issues and pull requests!