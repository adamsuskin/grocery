# Production Deployment Guide

Quick reference guide for deploying and managing the Grocery List application in production.

## Quick Start

### First-Time Deployment

```bash
# 1. Generate production secrets
cd /home/adam/grocery
./scripts/generate-secrets.sh

# 2. Edit .env.production with your production settings
nano .env.production
# Update: CORS_ORIGIN, VITE_API_URL, VITE_ZERO_SERVER

# 3. Deploy to production
./scripts/deploy-prod.sh
```

### Update Existing Deployment

```bash
# Update all services with zero downtime
./scripts/update-prod.sh

# Update specific service only
./scripts/update-prod.sh --service frontend
```

### Backup and Restore

```bash
# Create backup
./scripts/backup-db.sh --auto

# Restore from backup
./scripts/restore-db.sh backups/grocery_db_backup_YYYYMMDD-HHMMSS.dump
```

### Health Monitoring

```bash
# Check all services
./scripts/health-check.sh

# Detailed health report
./scripts/health-check.sh --detailed

# Continuous monitoring
./scripts/health-check.sh --continuous
```

## Available Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `generate-secrets.sh` | Generate secure secrets | `./scripts/generate-secrets.sh` |
| `deploy-prod.sh` | Deploy to production | `./scripts/deploy-prod.sh` |
| `backup-db.sh` | Backup database | `./scripts/backup-db.sh --auto` |
| `restore-db.sh` | Restore database | `./scripts/restore-db.sh <file>` |
| `health-check.sh` | Check service health | `./scripts/health-check.sh` |
| `update-prod.sh` | Zero-downtime update | `./scripts/update-prod.sh` |

## Common Commands

### Service Management

```bash
# Start all services
docker compose -f docker-compose.prod.yml up -d

# Stop all services
docker compose -f docker-compose.prod.yml down

# Restart a service
docker compose -f docker-compose.prod.yml restart auth-server

# View logs
docker compose -f docker-compose.prod.yml logs -f

# View service logs
docker compose -f docker-compose.prod.yml logs -f auth-server
```

### Health Checks

```bash
# Frontend
curl http://localhost:3000/

# Auth Server
curl http://localhost:3001/health

# Zero Cache
curl http://localhost:4848/health

# Database
docker exec grocery-postgres-prod pg_isready -U grocery -d grocery_db
```

### Monitoring

```bash
# Check service status
./scripts/health-check.sh --detailed

# View container resources
docker stats

# View disk usage
df -h
du -sh /home/adam/grocery/backups
```

## Troubleshooting

### Service Won't Start

```bash
# Check logs
docker compose -f docker-compose.prod.yml logs <service-name>

# Restart service
docker compose -f docker-compose.prod.yml restart <service-name>

# Full restart
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d
```

### Deployment Failed

```bash
# Check deployment logs
tail -100 logs/deploy-*.log

# Rollback to previous version
./scripts/update-prod.sh --rollback
```

### Database Issues

```bash
# Check database health
./scripts/health-check.sh --service postgres

# View database logs
docker compose -f docker-compose.prod.yml logs postgres

# Restore from backup
./scripts/restore-db.sh backups/latest.dump
```

## Service URLs

- **Frontend**: http://localhost:3000
- **Auth Server**: http://localhost:3001
- **Zero Cache**: http://localhost:4848
- **Database**: localhost:5432

## Important Files

- **Environment**: `.env.production` (generated, never commit)
- **Docker Compose**: `docker-compose.prod.yml`
- **Logs**: `logs/` directory
- **Backups**: `backups/` directory
- **Scripts**: `scripts/` directory

## Security Checklist

- [ ] `.env.production` is in `.gitignore`
- [ ] Strong, unique secrets generated
- [ ] CORS_ORIGIN set to production domain
- [ ] Database password changed from default
- [ ] Automated backups scheduled
- [ ] Health monitoring enabled
- [ ] Logs reviewed regularly

## Scheduled Tasks

Add to crontab for automated maintenance:

```bash
# Edit crontab
crontab -e

# Daily backup at 2 AM
0 2 * * * /home/adam/grocery/scripts/backup-db.sh --auto --keep-days 7

# Health check every 5 minutes
*/5 * * * * /home/adam/grocery/scripts/health-check.sh --quiet || echo "Health check failed" | mail -s "Grocery App Alert" admin@example.com
```

## Emergency Procedures

### Complete System Failure

1. Check Docker is running: `docker ps`
2. Check disk space: `df -h`
3. View logs: `docker compose -f docker-compose.prod.yml logs`
4. Restart services: `docker compose -f docker-compose.prod.yml restart`
5. If needed, full redeploy: `./scripts/deploy-prod.sh`

### Data Loss / Corruption

1. Stop services: `docker compose -f docker-compose.prod.yml down`
2. Restore database: `./scripts/restore-db.sh --clean backups/latest.dump`
3. Restart services: `./scripts/deploy-prod.sh --skip-migrations`
4. Verify: `./scripts/health-check.sh --detailed`

### Need to Rollback Update

```bash
# Rollback to previous deployment
./scripts/update-prod.sh --rollback

# Or restore from backup
./scripts/restore-db.sh --clean backups/pre-update-backup.dump
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d
```

## Support Resources

- **Script Documentation**: `scripts/README.md`
- **Script Help**: `./scripts/<script-name>.sh --help`
- **Logs Directory**: `logs/`
- **Docker Logs**: `docker compose -f docker-compose.prod.yml logs`

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

---

For detailed information about each script, see `scripts/README.md`
