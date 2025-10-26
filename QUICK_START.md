# Quick Start - Authentication Setup

## Installation (Run These Commands)

```bash
# Navigate to project directory
cd /home/adam/grocery

# Install the 2 new dependencies (axios, dotenv)
pnpm install

# Verify installation
pnpm list axios dotenv
```

## Expected Output
```
grocery-list@0.1.0 /home/adam/grocery
├── axios@1.7.7
└── dotenv@16.4.5
```

## What Was Updated

### Root package.json
**Added 2 new dependencies:**
- ✅ `axios@^1.7.7` - HTTP client for authentication API calls
- ✅ `dotenv@^16.4.5` - Environment variable management

**Already had 13 auth dependencies:**
- express, bcrypt, jsonwebtoken, pg, cors, express-validator, express-rate-limit
- @types/express, @types/bcrypt, @types/jsonwebtoken, @types/pg, @types/cors
- nodemon, ts-node

### New Files Created
1. **`/home/adam/grocery/server/package.json`**
   - Standalone package.json for server (reference only)
   - Contains all server-side dependencies
   - Optional - root package.json is used by default

2. **`/home/adam/grocery/DEPENDENCY_INSTALLATION.md`**
   - Complete installation guide
   - Dependency breakdown
   - Troubleshooting tips

3. **`/home/adam/grocery/PACKAGE_STRUCTURE.md`**
   - Project architecture documentation
   - Monorepo explanation
   - Scripts reference

4. **`/home/adam/grocery/DEPENDENCY_SUMMARY.md`**
   - Comprehensive summary
   - Checklist of all dependencies
   - Usage examples

## Start Development

```bash
# Make sure you have .env configured
cp .env.example .env
# Edit .env with your settings

# Start everything (DB + Zero + Auth Server + React)
pnpm dev:all
```

This will start:
- PostgreSQL database (port 5432)
- Zero cache server
- Authentication server (port 3001)
- React client (port 5173)

## Verify Everything Works

### 1. Check Server is Running
```bash
curl http://localhost:3001/auth/health
```

Expected: `{"status":"ok"}`

### 2. Check Client is Running
Open browser: http://localhost:5173

### 3. Test Authentication
Try registering a new user or logging in through the UI.

## Project Structure

```
/home/adam/grocery/
│
├── package.json                    ← Updated (added axios, dotenv)
├── server/
│   ├── package.json                ← New (reference only)
│   └── [auth implementation]
│
└── Documentation:
    ├── QUICK_START.md              ← This file
    ├── DEPENDENCY_SUMMARY.md       ← Complete summary
    ├── DEPENDENCY_INSTALLATION.md  ← Installation guide
    └── PACKAGE_STRUCTURE.md        ← Architecture docs
```

## All Dependencies Checklist

### Client (Frontend)
- [x] axios (NEW)
- [x] react
- [x] react-dom
- [x] @rocicorp/zero

### Server (Backend)
- [x] express
- [x] bcrypt
- [x] jsonwebtoken
- [x] pg
- [x] cors
- [x] dotenv (NEW)
- [x] express-validator
- [x] express-rate-limit

### TypeScript Types
- [x] @types/express
- [x] @types/bcrypt
- [x] @types/jsonwebtoken
- [x] @types/pg
- [x] @types/cors

### Development Tools
- [x] typescript
- [x] ts-node
- [x] nodemon
- [x] concurrently
- [x] vite

## Common Commands

```bash
# Install dependencies
pnpm install

# Development
pnpm dev:all              # Full stack
pnpm dev                  # Client only
pnpm server:dev           # Server only

# Database
pnpm db:up                # Start
pnpm db:down              # Stop
pnpm db:init              # Initialize

# Build
pnpm build                # Build client
pnpm server:build         # Build server

# Type checking
pnpm type-check           # Check types
```

## Environment Variables Required

Your `.env` should contain:

```env
# Server
PORT=3001
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=grocery
DB_PASSWORD=grocery
DB_NAME=grocery_db

# JWT
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# CORS
CORS_ORIGIN=http://localhost:5173
```

## Troubleshooting

### Dependencies not installed?
```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Server won't start?
```bash
# Check database is running
docker ps

# Start database
pnpm db:up

# Check .env exists
cat .env
```

### Port already in use?
```bash
# Find and kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Or change port in .env
```

## Next Steps

1. ✅ Run `pnpm install`
2. ✅ Configure `.env`
3. ✅ Start database: `pnpm db:up`
4. ✅ Initialize schema: `pnpm db:init`
5. ✅ Start app: `pnpm dev:all`
6. ✅ Test authentication in browser

## Documentation

For more details, see:
- **Full guide**: `DEPENDENCY_INSTALLATION.md`
- **Summary**: `DEPENDENCY_SUMMARY.md`
- **Architecture**: `PACKAGE_STRUCTURE.md`
- **Auth guide**: `AUTHENTICATION_GUIDE.md`
- **Integration**: `INTEGRATION_EXAMPLE.md`

## Success!

You're ready to develop with authentication! All dependencies are configured.

**Need help?** Check the troubleshooting section in `DEPENDENCY_INSTALLATION.md`
