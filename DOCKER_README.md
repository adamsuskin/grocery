# Docker Setup Guide for Grocery List Application

This guide explains how to run the complete grocery list application stack with authentication using Docker Compose.

## Architecture Overview

The application consists of four main services:

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Compose Stack                     │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │   Frontend   │  │ Auth Server  │  │   Zero-cache    │  │
│  │   (React)    │  │  (Express)   │  │  (Real-time)    │  │
│  │  Port: 3000  │  │  Port: 3001  │  │  Port: 4848     │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬────────┘  │
│         │                 │                    │           │
│         └─────────────────┼────────────────────┘           │
│                           │                                │
│                  ┌────────┴────────┐                       │
│                  │   PostgreSQL    │                       │
│                  │   Port: 5432    │                       │
│                  └─────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

## Services

### 1. PostgreSQL Database (`postgres`)
- **Image**: postgres:16
- **Port**: 5432
- **Purpose**: Stores user data, grocery items, and authentication tokens
- **Features**:
  - Logical replication enabled for Zero-cache sync
  - Auto-initializes schema on first run
  - Health checks for service dependencies
  - Persistent volume for data storage

### 2. Authentication Server (`auth-server`)
- **Build**: Dockerfile.server
- **Port**: 3001
- **Purpose**: Handles user authentication, JWT tokens, and API endpoints
- **Features**:
  - JWT-based authentication
  - Token refresh mechanism
  - Rate limiting
  - CORS configuration
  - Hot-reload in development mode
  - Health check endpoint at `/health`

### 3. Zero-cache Server (`zero-cache`)
- **Image**: rocicorp/zero-cache:latest
- **Port**: 4848
- **Purpose**: Real-time synchronization for offline-first functionality
- **Features**:
  - Syncs with PostgreSQL using logical replication
  - Local replica storage
  - Automatic conflict resolution
  - Health check endpoint

### 4. Frontend (`frontend`)
- **Build**: Dockerfile.frontend
- **Port**: 3000
- **Purpose**: React application with Vite
- **Features**:
  - Hot-reload in development mode
  - Proxy to auth-server for API calls
  - Connects to Zero-cache for real-time sync
  - Production build with nginx

## Quick Start

### Development Mode (Recommended)

Start all services:
```bash
docker compose up -d
```

View logs:
```bash
docker compose logs -f
```

Stop all services:
```bash
docker compose down
```

### Individual Service Management

Start only database:
```bash
docker compose up -d postgres
```

Start database and auth server:
```bash
docker compose up -d postgres auth-server
```

Start everything except frontend (if running frontend locally):
```bash
docker compose up -d postgres auth-server zero-cache
```

## Service URLs

Once running, access services at:

- **Frontend**: http://localhost:3000
- **Auth API**: http://localhost:3001
- **Auth Health Check**: http://localhost:3001/health
- **Auth API Docs**: http://localhost:3001/api
- **Zero-cache**: http://localhost:4848
- **PostgreSQL**: localhost:5432

## Environment Variables

### Development (Default)

The docker-compose.yml includes development defaults. For production, create a `.env` file:

```bash
# Server Configuration
NODE_ENV=production
PORT=3001

# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_NAME=grocery_db
DB_USER=grocery
DB_PASSWORD=<strong-password>

# JWT Configuration (CHANGE THESE!)
JWT_ACCESS_SECRET=<generate-with-openssl-rand-base64-32>
JWT_REFRESH_SECRET=<generate-with-openssl-rand-base64-32>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGIN=https://your-domain.com

# Zero Configuration
ZERO_AUTH_SECRET=<generate-with-openssl-rand-base64-32>
```

Generate secure secrets:
```bash
openssl rand -base64 32
```

## Database Initialization

The database schema is automatically initialized on first run via the mounted schema file.

To manually initialize or reset the database:

```bash
# Connect to the database container
docker compose exec postgres psql -U grocery -d grocery_db

# Or run schema file manually
docker compose exec -T postgres psql -U grocery -d grocery_db < server/db/schema.sql
```

## Health Checks

All services include health checks. Check service health:

```bash
# View service status
docker compose ps

# Check auth server health
curl http://localhost:3001/health

# Check zero-cache health
curl http://localhost:4848/health

# Check database health
docker compose exec postgres pg_isready -U grocery -d grocery_db
```

## Volume Management

### Persistent Data

The following volumes store persistent data:

- `postgres-data`: PostgreSQL database files
- `zero-data`: Zero-cache replica database
- `server-node-modules`: Node modules (performance optimization)
- `frontend-node-modules`: Node modules (performance optimization)

### Backup Database

```bash
# Create backup
docker compose exec postgres pg_dump -U grocery grocery_db > backup.sql

# Restore backup
docker compose exec -T postgres psql -U grocery -d grocery_db < backup.sql
```

### Clean All Data

**WARNING**: This will delete all data!

```bash
docker compose down -v
```

## Development Workflow

### Hot-Reload Development

The docker-compose setup supports hot-reload for both frontend and backend:

1. **Frontend**: Mount src directory with live reload
2. **Auth Server**: Mount server directory with nodemon

To develop locally while using Docker for infrastructure only:

```bash
# Start infrastructure services only
docker compose up -d postgres zero-cache

# Run frontend locally
pnpm run dev

# Run auth server locally (in another terminal)
pnpm run server:dev
```

### Debugging

View logs for specific service:
```bash
docker compose logs -f auth-server
docker compose logs -f postgres
docker compose logs -f zero-cache
```

Access container shell:
```bash
docker compose exec auth-server sh
docker compose exec postgres bash
```

### Restart Services

Restart specific service:
```bash
docker compose restart auth-server
```

Rebuild and restart:
```bash
docker compose up -d --build auth-server
```

## Production Deployment

### Build Production Images

```bash
# Build all services
docker compose -f docker-compose.prod.yml build

# Build specific service
docker compose -f docker-compose.prod.yml build auth-server
```

### Security Checklist

Before deploying to production:

- [ ] Change all default passwords
- [ ] Generate strong JWT secrets
- [ ] Set NODE_ENV=production
- [ ] Configure proper CORS origins
- [ ] Enable HTTPS (use reverse proxy like nginx/Traefik)
- [ ] Set up database backups
- [ ] Configure log aggregation
- [ ] Enable container resource limits
- [ ] Use secrets management (Docker secrets, AWS Secrets Manager, etc.)
- [ ] Review and harden PostgreSQL configuration
- [ ] Enable security scanning (Snyk, Trivy, etc.)

### Resource Limits

Add resource limits for production (add to docker-compose.yml):

```yaml
services:
  auth-server:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
```

## Troubleshooting

### Service Won't Start

Check logs:
```bash
docker compose logs <service-name>
```

Check if port is already in use:
```bash
# Linux/Mac
lsof -i :3001
netstat -tuln | grep 3001

# Windows
netstat -ano | findstr :3001
```

### Database Connection Issues

```bash
# Test database connection
docker compose exec postgres psql -U grocery -d grocery_db -c "SELECT 1"

# Check database logs
docker compose logs postgres

# Restart database
docker compose restart postgres
```

### Can't Connect to Auth Server

```bash
# Check if service is running
docker compose ps auth-server

# Check health
curl http://localhost:3001/health

# View detailed logs
docker compose logs -f auth-server

# Restart service
docker compose restart auth-server
```

### Zero-cache Sync Issues

```bash
# Check zero-cache logs
docker compose logs -f zero-cache

# Verify PostgreSQL replication slots
docker compose exec postgres psql -U grocery -d grocery_db -c "SELECT * FROM pg_replication_slots;"

# Restart zero-cache
docker compose restart zero-cache
```

### Clean Start

If you encounter persistent issues, try a clean start:

```bash
# Stop all services
docker compose down

# Remove volumes (WARNING: deletes data)
docker compose down -v

# Remove images
docker compose down --rmi all

# Rebuild and start fresh
docker compose up -d --build
```

## Network Configuration

The stack uses a custom bridge network `grocery-network` for inter-service communication.

Services communicate using their service names:
- Frontend → Auth Server: `http://auth-server:3001`
- Auth Server → PostgreSQL: `postgres:5432`
- Zero-cache → PostgreSQL: `postgres:5432`

External access is through exposed ports:
- Frontend: localhost:3000
- Auth Server: localhost:3001
- Zero-cache: localhost:4848
- PostgreSQL: localhost:5432

## Performance Tips

1. **Use volumes for node_modules**: Already configured in docker-compose.yml
2. **Layer caching**: Order Dockerfile commands from least to most frequently changed
3. **Multi-stage builds**: Production images use multi-stage builds for smaller size
4. **Resource allocation**: Adjust Docker Desktop/Engine memory limits if needed
5. **Prune unused resources**: Regularly run `docker system prune -a`

## Additional Commands

### View resource usage
```bash
docker stats
```

### Remove unused resources
```bash
docker system prune -a --volumes
```

### Export/Import images
```bash
# Export
docker save -o auth-server.tar grocery-auth-server

# Import
docker load -i auth-server.tar
```

### Inspect containers
```bash
docker compose exec auth-server env
docker compose exec auth-server ps aux
docker compose exec auth-server ls -la /app
```

## Support

For issues or questions:
1. Check the logs: `docker compose logs -f`
2. Review environment variables
3. Verify database connection
4. Check service health endpoints
5. Ensure ports aren't already in use

## Next Steps

After starting the services:

1. Access the frontend at http://localhost:3000
2. Register a new user account
3. Test authentication flow
4. Verify real-time sync with Zero-cache
5. Create and manage grocery items

For API documentation, visit http://localhost:3001/api
