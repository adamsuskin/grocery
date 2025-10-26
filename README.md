# 🛒 Grocery List App

A collaborative grocery list application built with React, TypeScript, and Vite. Features real-time synchronization across devices and users using Zero.

## Features

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
- 🔄 **Real-time Sync**: Changes sync automatically across all devices and users
- 💾 **Persistent**: Data stored in PostgreSQL with local caching
- 📱 **Responsive**: Works on desktop and mobile
- 🔌 **Offline Support**: Works offline and syncs when reconnected

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
│   │   ├── AddItemForm.tsx      # Form to add new items
│   │   ├── GroceryItem.tsx      # Single item display
│   │   └── GroceryList.tsx      # List of all items
│   ├── hooks/
│   │   └── useGroceryItems.ts   # Custom hooks for items
│   ├── types.ts                  # TypeScript type definitions
│   ├── store.ts                  # Data store with sync
│   ├── App.tsx                   # Main app component
│   ├── App.css                   # App styles
│   ├── main.tsx                  # App entry point
│   └── index.css                 # Global styles
├── specs/
│   └── requirements.md           # Detailed requirements
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

### Real-Time Collaboration

Open the app in multiple browser tabs or on different devices and watch changes sync in real-time! All users see updates instantly thanks to Zero's real-time synchronization.

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
interface GroceryItem {
  id: string;          // UUID
  name: string;        // Item name
  quantity: number;    // Quantity to buy
  gotten: boolean;     // Whether item is gotten
  category: Category;  // Item category
  notes: string;       // Optional notes/description
  createdAt: number;   // Timestamp
}

type Category =
  | 'Produce'
  | 'Dairy'
  | 'Meat'
  | 'Bakery'
  | 'Pantry'
  | 'Frozen'
  | 'Beverages'
  | 'Other';
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