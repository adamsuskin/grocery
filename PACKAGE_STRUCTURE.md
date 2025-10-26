# Package Structure Guide

## Project Architecture

This project uses a **monorepo structure** where both client and server dependencies are managed from a single root `package.json`. This approach simplifies dependency management and ensures version consistency across the entire application.

## Directory Structure

```
grocery/
├── package.json                 # Root package.json (manages all dependencies)
├── server/
│   ├── package.json            # Optional standalone package.json (for reference)
│   ├── index.ts                # Express server entry point
│   ├── auth/                   # Authentication routes and controllers
│   ├── middleware/             # Express middleware (auth, error handling)
│   ├── config/                 # Configuration (database, JWT)
│   ├── db/                     # Database schema and migrations
│   └── types/                  # TypeScript type definitions
├── src/                        # React client application
│   ├── components/             # React components
│   ├── contexts/               # React contexts (AuthContext)
│   ├── hooks/                  # Custom React hooks
│   └── utils/                  # Utility functions
└── tsconfig.server.json        # TypeScript config for server
```

## Package Management Approach

### Monorepo (Current Setup - Recommended)

**Location**: `/home/adam/grocery/package.json`

**Advantages**:
- Single `pnpm install` for all dependencies
- Consistent versions across client and server
- Simplified CI/CD pipeline
- Easier dependency updates
- Reduced disk space (no duplicate dependencies)

**Usage**:
```bash
# Install all dependencies
pnpm install

# Run both client and server
pnpm dev:all
```

### Separate Packages (Alternative)

**Location**: `/home/adam/grocery/server/package.json`

**Advantages**:
- Clearer separation of concerns
- Independent deployment possible
- Smaller production bundles (server only needs server deps)

**Usage** (if using separate packages):
```bash
# Install root dependencies (client)
pnpm install

# Install server dependencies
cd server
pnpm install
cd ..

# Run both
pnpm dev:all
```

## Dependency Categories

### Production Dependencies (dependencies)

These are required to run the application in production:

| Package | Used By | Purpose |
|---------|---------|---------|
| `@rocicorp/zero` | Client | Real-time data sync |
| `axios` | Client | HTTP requests to auth API |
| `bcrypt` | Server | Password hashing |
| `cors` | Server | Cross-origin requests |
| `dotenv` | Server | Environment configuration |
| `express` | Server | Web framework |
| `express-rate-limit` | Server | Rate limiting |
| `express-validator` | Server | Input validation |
| `jsonwebtoken` | Server | JWT token handling |
| `kysely` | Server | SQL query builder |
| `nanoid` | Client/Server | Unique ID generation |
| `pg` | Server | PostgreSQL client |
| `react` | Client | UI framework |
| `react-dom` | Client | React DOM rendering |

### Development Dependencies (devDependencies)

These are only needed during development:

| Package | Purpose |
|---------|---------|
| `@types/*` | TypeScript type definitions |
| `@vitejs/plugin-react` | Vite React plugin |
| `concurrently` | Run multiple scripts |
| `nodemon` | Auto-restart server |
| `ts-node` | Run TypeScript directly |
| `typescript` | TypeScript compiler |
| `vite` | Build tool and dev server |

## TypeScript Configuration

### Client (tsconfig.json)
- **Target**: ES2020
- **Module**: ESNext
- **Module Resolution**: bundler (Vite)
- **Output**: Handled by Vite

### Server (tsconfig.server.json)
- **Target**: ES2020
- **Module**: CommonJS
- **Module Resolution**: node
- **Output**: `./dist/server/`

## Scripts Reference

### Full Stack
```bash
pnpm dev:all          # Everything (DB + Zero + Server + Client)
pnpm dev:full         # DB + Zero + Client (no auth server)
```

### Client Only
```bash
pnpm dev              # Start Vite dev server
pnpm build            # Build for production
pnpm preview          # Preview production build
pnpm type-check       # Check types without building
```

### Server Only
```bash
pnpm server:dev       # Start server in dev mode with auto-reload
pnpm server:build     # Build server to dist/
pnpm server:start     # Start production server from dist/
```

### Database
```bash
pnpm db:up            # Start PostgreSQL (Docker)
pnpm db:down          # Stop PostgreSQL
pnpm db:init          # Initialize schema
```

### Zero Cache
```bash
pnpm zero:dev         # Start Zero cache server
```

## Installation Workflow

### Fresh Installation
```bash
# Clone repository
git clone <repository-url>
cd grocery

# Install dependencies
pnpm install

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Start database
pnpm db:up

# Initialize schema
pnpm db:init

# Start everything
pnpm dev:all
```

### Clean Reinstall
```bash
# Remove existing installations
rm -rf node_modules pnpm-lock.yaml

# Reinstall
pnpm install
```

### Update Dependencies
```bash
# Check for updates
pnpm outdated

# Update all to latest
pnpm update

# Update specific package
pnpm update axios
```

## Production Deployment

### Server Deployment
```bash
# Build server
pnpm server:build

# Set production environment
export NODE_ENV=production

# Start server
pnpm server:start
```

### Client Deployment
```bash
# Build client
pnpm build

# Serve from dist/
# (Use nginx, Apache, or static hosting service)
```

## Common Issues

### Issue: Server/package.json conflicts
**Symptom**: Dependencies not found when running server scripts
**Solution**: The root `package.json` is the source of truth. The `server/package.json` is optional and for reference only.

### Issue: Module resolution errors
**Symptom**: `Cannot find module` errors
**Solution**:
1. Ensure you're in the root directory
2. Run `pnpm install`
3. Check import paths use correct relative paths

### Issue: TypeScript errors in server
**Symptom**: Type errors when running server
**Solution**: Run type check: `pnpm type-check`

## Best Practices

1. **Always install from root**: Run `pnpm install` from `/home/adam/grocery/`
2. **Don't modify server/package.json**: It's for reference only
3. **Use workspace protocol**: If splitting packages, use `workspace:*` for internal dependencies
4. **Lock file**: Commit `pnpm-lock.yaml` to ensure consistent installations
5. **Environment variables**: Never commit `.env`, always use `.env.example` as template

## Migration to Separate Packages (Optional)

If you later want to truly separate client and server packages:

1. Create separate workspaces in root `package.json`:
```json
{
  "name": "grocery-monorepo",
  "private": true,
  "workspaces": [
    "client",
    "server"
  ]
}
```

2. Move client code to `client/` directory
3. Update `server/package.json` to be fully independent
4. Use workspace protocol: `"@grocery/server": "workspace:*"`

This is not currently necessary and would add complexity.
