# Dependency Installation Guide

## Overview
This project uses a monorepo structure where both client and server dependencies are managed in the root `package.json`. All necessary authentication dependencies have been included.

## Installation Instructions

### Quick Start
```bash
# Install all dependencies
pnpm install

# Or if using npm
npm install

# Or if using yarn
yarn install
```

### Verify Installation
After installation, verify that all authentication-related packages are installed:
```bash
pnpm list axios bcrypt cors dotenv express express-validator jsonwebtoken pg
```

## Dependency Breakdown

### Client Dependencies (Frontend)

#### 1. **axios** (^1.7.7)
- **Purpose**: HTTP client for making API requests to the authentication server
- **Usage**: Login, register, token refresh, and authenticated API calls
- **Alternative**: Native `fetch` API (built into browsers, no installation needed)

#### 2. **react** (^18.3.1) & **react-dom** (^18.3.1)
- **Purpose**: Core React libraries for building the UI
- **Already installed**: ✓

#### 3. **@rocicorp/zero** (^0.1.0)
- **Purpose**: Zero sync framework for real-time data synchronization
- **Already installed**: ✓

### Server Dependencies (Backend)

#### 1. **express** (^5.1.0)
- **Purpose**: Web framework for building the REST API
- **Usage**: Routing, middleware, request handling
- **Already installed**: ✓

#### 2. **bcrypt** (^6.0.0)
- **Purpose**: Password hashing and verification
- **Usage**: Securely hash passwords before storing, verify passwords during login
- **Already installed**: ✓

#### 3. **jsonwebtoken** (^9.0.2)
- **Purpose**: JWT token generation and verification
- **Usage**: Create access/refresh tokens, verify token authenticity
- **Already installed**: ✓

#### 4. **pg** (^8.16.3)
- **Purpose**: PostgreSQL database client
- **Usage**: Database connections and queries
- **Already installed**: ✓

#### 5. **cors** (^2.8.5)
- **Purpose**: Enable Cross-Origin Resource Sharing
- **Usage**: Allow frontend (different port) to communicate with backend
- **Already installed**: ✓

#### 6. **dotenv** (^16.4.5)
- **Purpose**: Load environment variables from .env file
- **Usage**: Manage configuration (JWT secrets, database credentials)
- **Status**: ✓ NEWLY ADDED

#### 7. **express-validator** (^7.3.0)
- **Purpose**: Input validation and sanitization middleware
- **Usage**: Validate email format, password strength, sanitize inputs
- **Already installed**: ✓

#### 8. **express-rate-limit** (^8.1.0)
- **Purpose**: Rate limiting middleware
- **Usage**: Prevent brute force attacks on login/register endpoints
- **Already installed**: ✓

### Development Dependencies

#### 1. **@types/express** (^5.0.4)
- **Purpose**: TypeScript type definitions for Express
- **Already installed**: ✓

#### 2. **@types/bcrypt** (^6.0.0)
- **Purpose**: TypeScript type definitions for bcrypt
- **Already installed**: ✓

#### 3. **@types/jsonwebtoken** (^9.0.10)
- **Purpose**: TypeScript type definitions for jsonwebtoken
- **Already installed**: ✓

#### 4. **@types/pg** (^8.15.5)
- **Purpose**: TypeScript type definitions for pg
- **Already installed**: ✓

#### 5. **@types/cors** (^2.8.19)
- **Purpose**: TypeScript type definitions for cors
- **Already installed**: ✓

#### 6. **typescript** (^5.5.3)
- **Purpose**: TypeScript compiler
- **Already installed**: ✓

#### 7. **ts-node** (^10.9.2)
- **Purpose**: Execute TypeScript files directly without pre-compilation
- **Usage**: Run server in development mode
- **Already installed**: ✓

#### 8. **nodemon** (^3.1.10)
- **Purpose**: Auto-restart server on file changes
- **Usage**: Development workflow
- **Already installed**: ✓

#### 9. **concurrently** (^8.2.2)
- **Purpose**: Run multiple npm scripts concurrently
- **Usage**: Start database, Zero cache, server, and client together
- **Already installed**: ✓

## Available Scripts

### Development
```bash
# Start the full stack (recommended for development)
pnpm dev:all

# This runs:
# - Database (Docker)
# - Zero cache server
# - Express authentication server
# - Vite development server (React app)
```

### Individual Services
```bash
# Start only the database
pnpm db:up

# Stop the database
pnpm db:down

# Initialize the database schema
pnpm db:init

# Start the authentication server
pnpm server:dev

# Start the client (React app)
pnpm dev

# Start Zero cache server
pnpm zero:dev
```

### Production
```bash
# Build the server
pnpm server:build

# Start the production server
pnpm server:start

# Build the client
pnpm build

# Preview production build
pnpm preview
```

### Type Checking
```bash
# Check TypeScript types without compilation
pnpm type-check
```

## Environment Setup

### 1. Create .env file
```bash
cp .env.example .env
```

### 2. Configure environment variables
Edit `.env` with your configuration:
```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=grocery
DB_PASSWORD=grocery
DB_NAME=grocery_db

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
```

### 3. Start the database
```bash
pnpm db:up
```

### 4. Initialize the database schema
```bash
pnpm db:init
```

### 5. Start the full application
```bash
pnpm dev:all
```

## Troubleshooting

### Issue: bcrypt installation fails
**Solution**: bcrypt requires node-gyp. Install build tools:
```bash
# On Ubuntu/Debian
sudo apt-get install build-essential

# On macOS
xcode-select --install

# On Windows
npm install --global windows-build-tools
```

### Issue: PostgreSQL connection fails
**Solution**:
1. Ensure Docker is running: `docker ps`
2. Check database is up: `pnpm db:up`
3. Verify connection details in `.env`

### Issue: Port already in use
**Solution**: Change ports in `.env` or kill the process:
```bash
# Find process on port 3001
lsof -ti:3001

# Kill process
kill -9 <PID>
```

### Issue: TypeScript compilation errors
**Solution**:
1. Clean install: `rm -rf node_modules pnpm-lock.yaml && pnpm install`
2. Check TypeScript version: `pnpm list typescript`

## Next Steps

After installing dependencies:

1. **Set up environment variables**: Copy `.env.example` to `.env` and configure
2. **Initialize database**: Run `pnpm db:up && pnpm db:init`
3. **Start development**: Run `pnpm dev:all`
4. **Test authentication**: Use the example integration in `INTEGRATION_EXAMPLE.md`

## Additional Resources

- **Authentication Guide**: See `AUTHENTICATION_GUIDE.md`
- **Integration Examples**: See `INTEGRATION_EXAMPLE.md`
- **API Documentation**: See `AUTH_README.md`
- **Implementation Plan**: See `IMPLEMENTATION_PLAN.md`
