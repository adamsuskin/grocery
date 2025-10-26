# Production Deployment Scripts

This directory contains scripts for deploying and managing the Grocery List application in production.

## Overview

These scripts provide a complete toolkit for production deployment, including:
- Initial deployment
- Database backup and restore
- Health monitoring
- Zero-downtime updates
- Secure secret generation

## Scripts

### 1. generate-secrets.sh

Generates cryptographically secure secrets for production environment.

```bash
# Generate all secrets for .env.production
./scripts/generate-secrets.sh

# Show generated secrets (warning: displays sensitive data)
./scripts/generate-secrets.sh --show-secrets

# Generate only JWT secrets
./scripts/generate-secrets.sh --jwt-only

# Custom output file
./scripts/generate-secrets.sh --output .env.prod

# Force overwrite existing file
./scripts/generate-secrets.sh --force
```

**Generated Secrets:**
- `DB_PASSWORD` - PostgreSQL database password
- `JWT_ACCESS_SECRET` - JWT access token signing secret
- `JWT_REFRESH_SECRET` - JWT refresh token signing secret
- `ZERO_AUTH_SECRET` - Zero-cache authentication secret

**Security Notes:**
- Never commit `.env.production` to version control
- Store secrets in a secure password manager
- Rotate secrets regularly
- Use different secrets for each environment

### 2. deploy-prod.sh

Main production deployment script. Performs complete deployment with all checks.

```bash
# Full production deployment
./scripts/deploy-prod.sh

# Preview deployment steps (dry run)
./scripts/deploy-prod.sh --dry-run

# Deploy without rebuilding images
./scripts/deploy-prod.sh --skip-build

# Skip database migrations
./scripts/deploy-prod.sh --skip-migrations

# Skip health checks
./scripts/deploy-prod.sh --no-healthcheck
```

**Deployment Steps:**
1. Validates dependencies and environment configuration
2. Creates pre-deployment database backup
3. Builds Docker images
4. Runs database migrations
5. Deploys all services
6. Performs health checks
7. Shows deployment status and next steps

**Requirements:**
- Docker and Docker Compose installed
- `.env.production` file exists (use `generate-secrets.sh`)
- Sufficient disk space for images and backups

### 3. backup-db.sh

Creates backups of the PostgreSQL database with multiple format options.

```bash
# Interactive backup
./scripts/backup-db.sh

# Automatic backup (suitable for cron)
./scripts/backup-db.sh --auto

# Plain SQL format backup
./scripts/backup-db.sh --format plain

# Directory format with parallel backup
./scripts/backup-db.sh --format directory

# Custom backup location
./scripts/backup-db.sh --output /mnt/backups

# Keep only 7 days of backups
./scripts/backup-db.sh --keep-days 7

# Dry run
./scripts/backup-db.sh --dry-run
```

**Backup Formats:**
- `custom` - Compressed custom format (default, recommended)
- `plain` - Plain SQL text file
- `directory` - Directory format with parallel backup

**Scheduled Backups:**

Add to crontab for automated backups:

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM, keep 7 days
0 2 * * * /home/adam/grocery/scripts/backup-db.sh --auto --keep-days 7
```

**Backup Location:**
Default: `/home/adam/grocery/backups/`

### 4. restore-db.sh

Restores PostgreSQL database from backup files.

```bash
# Restore from backup file
./scripts/restore-db.sh backups/grocery_db_backup_20240101-120000.dump

# Clean restore (drops existing objects)
./scripts/restore-db.sh --clean backups/grocery_db_backup_20240101-120000.dump

# Restore only data (no schema)
./scripts/restore-db.sh --data-only backups/grocery_db_backup_20240101-120000.sql

# Restore only schema (no data)
./scripts/restore-db.sh --schema-only backups/grocery_db_backup_20240101-120000.dump

# Force restore without prompts
./scripts/restore-db.sh --force --clean backups/latest.dump

# Parallel restore for directory format
./scripts/restore-db.sh --jobs 8 backups/grocery_db_backup_20240101-120000.dir

# Dry run
./scripts/restore-db.sh --dry-run backups/grocery_db_backup_20240101-120000.dump
```

**Important:**
- Always creates a backup before restoring
- Requires confirmation (unless `--force` is used)
- Can be destructive - use carefully

### 5. health-check.sh

Checks health status of all production services.

```bash
# Check all services
./scripts/health-check.sh

# Check specific service
./scripts/health-check.sh --service postgres
./scripts/health-check.sh --service auth-server
./scripts/health-check.sh --service zero-cache
./scripts/health-check.sh --service frontend

# Detailed health information
./scripts/health-check.sh --detailed

# JSON output
./scripts/health-check.sh --json

# Wait for services to become healthy (max 60 seconds)
./scripts/health-check.sh --wait 60

# Continuous monitoring
./scripts/health-check.sh --continuous --interval 30

# Quiet mode (only exit code)
./scripts/health-check.sh --quiet
```

**Exit Codes:**
- `0` - All services healthy
- `1` - One or more services unhealthy
- `2` - Script error

**Monitored Services:**
- PostgreSQL database
- Authentication & API server
- Zero-cache server
- Frontend (nginx)

### 6. update-prod.sh

Updates production services with zero downtime using rolling updates.

```bash
# Update all services
./scripts/update-prod.sh

# Update specific service
./scripts/update-prod.sh --service frontend
./scripts/update-prod.sh --service auth-server

# Preview update
./scripts/update-prod.sh --dry-run

# Skip pre-update backup
./scripts/update-prod.sh --skip-backup

# Skip rebuilding images
./scripts/update-prod.sh --skip-build

# Skip health checks
./scripts/update-prod.sh --no-healthcheck

# Rollback to previous version
./scripts/update-prod.sh --rollback
```

**Update Strategy:**
1. Saves current deployment version
2. Creates pre-update database backup
3. Builds new Docker images
4. Performs rolling update of services
5. Health checks after each service
6. Verifies all services
7. Cleanup old images

**Rollback:**
If issues occur, rollback to the previous version:
```bash
./scripts/update-prod.sh --rollback
```

## Common Workflows

### Initial Deployment

```bash
# 1. Generate production secrets
./scripts/generate-secrets.sh

# 2. Edit .env.production with your production URLs
nano .env.production
# Update: CORS_ORIGIN, VITE_API_URL, VITE_ZERO_SERVER

# 3. Deploy to production
./scripts/deploy-prod.sh
```

### Regular Maintenance

```bash
# Check health status
./scripts/health-check.sh --detailed

# Create backup
./scripts/backup-db.sh --auto

# Update application
./scripts/update-prod.sh

# Monitor continuously
./scripts/health-check.sh --continuous
```

### Disaster Recovery

```bash
# 1. Stop services
docker compose -f docker-compose.prod.yml down

# 2. Restore from backup
./scripts/restore-db.sh --clean backups/grocery_db_backup_YYYYMMDD-HHMMSS.dump

# 3. Redeploy services
./scripts/deploy-prod.sh --skip-migrations

# 4. Verify health
./scripts/health-check.sh --detailed
```

### Updating Specific Service

```bash
# Update only the frontend
./scripts/update-prod.sh --service frontend

# Update only the auth server
./scripts/update-prod.sh --service auth-server
```

## Logs

All scripts create detailed logs in `/home/adam/grocery/logs/`:
- `deploy-YYYYMMDD-HHMMSS.log` - Deployment logs
- `update-YYYYMMDD-HHMMSS.log` - Update logs
- `restore-YYYYMMDD-HHMMSS.log` - Restore logs

View recent logs:
```bash
ls -lt logs/ | head
tail -f logs/deploy-*.log
```

## Monitoring

### Service Status

```bash
# View running containers
docker compose -f docker-compose.prod.yml ps

# View service logs
docker compose -f docker-compose.prod.yml logs -f

# View specific service logs
docker compose -f docker-compose.prod.yml logs -f auth-server
docker compose -f docker-compose.prod.yml logs -f frontend
```

### Health Endpoints

- Frontend: http://localhost:3000/
- Auth Server: http://localhost:3001/health
- Zero Cache: http://localhost:4848/health
- Database: `pg_isready -h localhost -U grocery -d grocery_db`

### Resource Usage

```bash
# Container resource usage
docker stats

# Database size
docker exec grocery-postgres-prod psql -U grocery -d grocery_db -c \
  "SELECT pg_size_pretty(pg_database_size('grocery_db'));"

# Disk usage
df -h
du -sh /home/adam/grocery/backups
```

## Troubleshooting

### Services Not Starting

```bash
# Check logs
docker compose -f docker-compose.prod.yml logs

# Check individual service
docker compose -f docker-compose.prod.yml logs auth-server

# Restart specific service
docker compose -f docker-compose.prod.yml restart auth-server

# Full restart
docker compose -f docker-compose.prod.yml restart
```

### Database Connection Issues

```bash
# Check database is running
docker ps | grep postgres

# Check database health
./scripts/health-check.sh --service postgres --detailed

# Check database logs
docker compose -f docker-compose.prod.yml logs postgres

# Test connection
docker exec grocery-postgres-prod psql -U grocery -d grocery_db -c "SELECT 1;"
```

### Failed Deployment

```bash
# Check deployment logs
tail -100 logs/deploy-*.log

# Rollback if needed
./scripts/update-prod.sh --rollback

# Or manually restart
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d
```

### Disk Space Issues

```bash
# Check disk usage
df -h

# Clean old backups
./scripts/backup-db.sh --auto --keep-days 3

# Remove old Docker images
docker image prune -a

# Remove unused volumes
docker volume prune
```

## Security Best Practices

1. **Secrets Management**
   - Never commit `.env.production` to git
   - Rotate secrets regularly
   - Use strong, unique secrets for each environment
   - Consider using a secrets management service (AWS Secrets Manager, HashiCorp Vault)

2. **Backups**
   - Schedule automated daily backups
   - Test restore procedures regularly
   - Store backups in multiple locations
   - Encrypt backup files for sensitive data

3. **Access Control**
   - Limit SSH access to production servers
   - Use SSH keys instead of passwords
   - Implement IP whitelisting where possible
   - Use VPN for accessing production resources

4. **Monitoring**
   - Set up continuous health monitoring
   - Configure alerts for service failures
   - Monitor resource usage (CPU, memory, disk)
   - Track application logs for errors

5. **Updates**
   - Test updates in staging environment first
   - Always create backups before updates
   - Use zero-downtime update strategy
   - Have rollback plan ready

## Environment Variables

Key environment variables in `.env.production`:

```bash
# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=grocery_db
DB_USER=grocery
DB_PASSWORD=<generated>

# JWT
JWT_ACCESS_SECRET=<generated>
JWT_REFRESH_SECRET=<generated>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS - UPDATE THIS!
CORS_ORIGIN=https://your-domain.com

# Zero-cache
ZERO_AUTH_SECRET=<generated>
ZERO_LOG_LEVEL=info

# Frontend - UPDATE THESE!
VITE_API_URL=https://your-domain.com/api
VITE_ZERO_SERVER=wss://your-domain.com/zero
VITE_AUTH_ENABLED=true
```

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review script help: `./scripts/script-name.sh --help`
3. Check logs in `/home/adam/grocery/logs/`
4. Review Docker logs: `docker compose -f docker-compose.prod.yml logs`

## License

Part of the Grocery List application.
