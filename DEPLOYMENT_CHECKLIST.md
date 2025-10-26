# Production Deployment Checklist

Use this checklist to ensure a smooth production deployment.

## Pre-Deployment

### Server Setup
- [ ] Server provisioned with adequate resources (2+ GB RAM, 2+ CPU cores recommended)
- [ ] Docker and Docker Compose installed and updated
- [ ] Git installed for code updates
- [ ] Firewall configured with the following ports:
  - [ ] Port 22 (SSH) - restricted to your IP
  - [ ] Port 80 (HTTP) - open for Let's Encrypt
  - [ ] Port 443 (HTTPS) - open for production traffic
  - [ ] Port 5432 (PostgreSQL) - closed or restricted to internal network only

### Domain Configuration
- [ ] Domain name registered
- [ ] DNS A record pointing to server IP address
- [ ] DNS propagated (check with `dig your-domain.com` or `nslookup your-domain.com`)
- [ ] Wait 24-48 hours after DNS changes for full propagation

### Environment Configuration
- [ ] Copy `.env.prod.template` to `.env.prod`
- [ ] Set `DOMAIN` to your domain name
- [ ] Set `CERTBOT_EMAIL` to your email address
- [ ] Generate and set strong `DB_PASSWORD` (use password manager)
- [ ] Generate and set `JWT_ACCESS_SECRET` (use `openssl rand -base64 32`)
- [ ] Generate and set `JWT_REFRESH_SECRET` (use `openssl rand -base64 32`)
- [ ] Generate and set `ZERO_AUTH_SECRET` (use `openssl rand -base64 32`)
- [ ] Update `CORS_ORIGIN` to `https://your-domain.com`
- [ ] Update `VITE_API_URL` to `https://your-domain.com/api`
- [ ] Update `VITE_ZERO_SERVER` to `wss://your-domain.com/zero`
- [ ] Review all other configuration values

### Security Checklist
- [ ] All secrets are unique and randomly generated
- [ ] Secrets are at least 32 characters long
- [ ] `.env.prod` is added to `.gitignore`
- [ ] `.env.prod` has restricted permissions (`chmod 600 .env.prod`)
- [ ] SSH key authentication enabled
- [ ] SSH password authentication disabled
- [ ] Root login disabled
- [ ] Non-root user created for deployment
- [ ] Fail2ban or similar intrusion prevention installed

## Initial Deployment

### Code Deployment
- [ ] Clone repository to server
  ```bash
  git clone <repository-url> /path/to/grocery
  cd /path/to/grocery
  ```
- [ ] Checkout production branch or tag
  ```bash
  git checkout main  # or your production branch
  ```
- [ ] Copy environment file
  ```bash
  cp .env.prod.template .env.prod
  # Edit .env.prod with your values
  ```

### Database Setup
- [ ] Start PostgreSQL container
  ```bash
  docker-compose -f docker-compose.prod.yml up -d postgres
  ```
- [ ] Wait for database to be healthy
  ```bash
  docker-compose -f docker-compose.prod.yml ps postgres
  ```
- [ ] Verify database schema applied
  ```bash
  docker-compose -f docker-compose.prod.yml exec postgres psql -U grocery -d grocery_db -c "\dt"
  ```

### Application Deployment
- [ ] Build application images
  ```bash
  docker-compose -f docker-compose.prod.yml build --pull
  ```
- [ ] Start backend services
  ```bash
  docker-compose -f docker-compose.prod.yml up -d auth-server zero-cache
  ```
- [ ] Verify backend services are healthy
  ```bash
  docker-compose -f docker-compose.prod.yml ps
  ```
- [ ] Start frontend service
  ```bash
  docker-compose -f docker-compose.prod.yml up -d frontend
  ```
- [ ] Verify all services are running
  ```bash
  ./deploy.sh status
  ```

### SSL Certificate Setup
- [ ] Start nginx service
  ```bash
  docker-compose -f docker-compose.prod.yml -f docker-compose.ssl.yml up -d nginx
  ```
- [ ] Obtain SSL certificate
  ```bash
  ./deploy.sh ssl-cert --ssl
  ```
- [ ] Verify certificate obtained successfully
  ```bash
  docker-compose -f docker-compose.prod.yml -f docker-compose.ssl.yml exec certbot certbot certificates
  ```
- [ ] Restart nginx to use certificate
  ```bash
  docker-compose -f docker-compose.prod.yml -f docker-compose.ssl.yml restart nginx
  ```
- [ ] Start certbot renewal service
  ```bash
  docker-compose -f docker-compose.prod.yml -f docker-compose.ssl.yml up -d certbot
  ```

### Verification
- [ ] Access application at `https://your-domain.com`
- [ ] Verify SSL certificate is valid (lock icon in browser)
- [ ] Test user registration
- [ ] Test user login
- [ ] Test creating a grocery list
- [ ] Test adding items to list
- [ ] Test real-time sync (open in two browsers)
- [ ] Test API endpoints at `https://your-domain.com/api/health`
- [ ] Verify WebSocket connection for Zero-cache

### Testing
- [ ] Run SSL Labs test: https://www.ssllabs.com/ssltest/
  - [ ] Aim for A or A+ rating
- [ ] Test from different devices (desktop, mobile, tablet)
- [ ] Test from different browsers (Chrome, Firefox, Safari, Edge)
- [ ] Test from different networks (mobile data, different WiFi)
- [ ] Load testing with expected user load
- [ ] Test error scenarios (database down, invalid credentials, etc.)

## Post-Deployment

### Monitoring Setup
- [ ] Create directory for logs
  ```bash
  mkdir -p logs/nginx logs/certbot
  ```
- [ ] Set up log rotation
- [ ] Configure monitoring for:
  - [ ] Server CPU and memory usage
  - [ ] Disk space usage
  - [ ] Container health status
  - [ ] Application errors
  - [ ] SSL certificate expiry
- [ ] Set up alerting for critical issues

### Backup Configuration
- [ ] Create backup directory
  ```bash
  mkdir -p backups
  ```
- [ ] Test database backup
  ```bash
  ./deploy.sh backup-db
  ```
- [ ] Verify backup file created
  ```bash
  ls -lh backups/
  ```
- [ ] Set up automated daily backups (cron job)
  ```bash
  # Add to crontab
  0 2 * * * cd /path/to/grocery && ./deploy.sh backup-db
  ```
- [ ] Test backup restoration on separate system
  ```bash
  ./deploy.sh restore-db
  ```
- [ ] Set up off-site backup storage

### Performance Optimization
- [ ] Review Docker resource limits
- [ ] Monitor database query performance
- [ ] Check nginx access logs for slow requests
- [ ] Enable database query logging if needed
- [ ] Review and adjust rate limits based on usage

### Documentation
- [ ] Document server access procedures
- [ ] Document deployment procedures for updates
- [ ] Document backup and restore procedures
- [ ] Document emergency rollback procedures
- [ ] Document monitoring and alerting setup
- [ ] Create runbook for common issues

## Ongoing Maintenance

### Weekly Tasks
- [ ] Check service health status
  ```bash
  ./deploy.sh health --ssl
  ```
- [ ] Review error logs
  ```bash
  ./deploy.sh logs --ssl | grep -i error
  ```
- [ ] Check disk space usage
  ```bash
  df -h
  ```
- [ ] Review backup success/failure

### Monthly Tasks
- [ ] Update Docker images
  ```bash
  ./deploy.sh update --ssl
  ```
- [ ] Review and rotate logs
- [ ] Review security advisories
- [ ] Test backup restoration
- [ ] Review SSL certificate expiry
  ```bash
  docker-compose -f docker-compose.prod.yml -f docker-compose.ssl.yml exec certbot certbot certificates
  ```
- [ ] Review and update dependencies
- [ ] Performance analysis and optimization

### Quarterly Tasks
- [ ] Security audit
- [ ] Penetration testing
- [ ] Disaster recovery drill
- [ ] Review and update documentation
- [ ] Review and update monitoring thresholds
- [ ] Capacity planning review

## Update Procedures

### Applying Updates
- [ ] Announce maintenance window to users
- [ ] Create database backup
  ```bash
  ./deploy.sh backup-db
  ```
- [ ] Pull latest code
  ```bash
  git fetch origin
  git checkout <version-tag>
  ```
- [ ] Review changelog for breaking changes
- [ ] Update environment variables if needed
- [ ] Build new images
  ```bash
  docker-compose -f docker-compose.prod.yml -f docker-compose.ssl.yml build --pull
  ```
- [ ] Apply database migrations if needed
- [ ] Deploy update
  ```bash
  docker-compose -f docker-compose.prod.yml -f docker-compose.ssl.yml up -d --force-recreate
  ```
- [ ] Verify services are healthy
  ```bash
  ./deploy.sh health --ssl
  ```
- [ ] Test critical functionality
- [ ] Monitor for errors

### Rollback Procedure
If deployment fails:
- [ ] Stop services
  ```bash
  docker-compose -f docker-compose.prod.yml -f docker-compose.ssl.yml down
  ```
- [ ] Restore database backup if needed
  ```bash
  ./deploy.sh restore-db
  ```
- [ ] Checkout previous version
  ```bash
  git checkout <previous-version>
  ```
- [ ] Rebuild and restart
  ```bash
  docker-compose -f docker-compose.prod.yml -f docker-compose.ssl.yml build
  docker-compose -f docker-compose.prod.yml -f docker-compose.ssl.yml up -d
  ```
- [ ] Verify services are healthy
- [ ] Investigate and document the issue

## Emergency Procedures

### Service Down
1. Check service status
   ```bash
   ./deploy.sh status --ssl
   ```
2. Check logs for errors
   ```bash
   ./deploy.sh logs --ssl | tail -100
   ```
3. Restart specific service
   ```bash
   docker-compose -f docker-compose.prod.yml -f docker-compose.ssl.yml restart <service-name>
   ```
4. If restart fails, check Docker daemon
   ```bash
   systemctl status docker
   ```

### Database Issues
1. Check PostgreSQL logs
   ```bash
   docker-compose -f docker-compose.prod.yml logs postgres
   ```
2. Check database connectivity
   ```bash
   docker-compose -f docker-compose.prod.yml exec postgres pg_isready
   ```
3. If corrupted, restore from backup
   ```bash
   ./deploy.sh restore-db
   ```

### SSL Certificate Issues
1. Check certificate status
   ```bash
   docker-compose -f docker-compose.prod.yml -f docker-compose.ssl.yml exec certbot certbot certificates
   ```
2. Manually renew if expired
   ```bash
   ./deploy.sh ssl-renew --ssl
   ```
3. If renewal fails, check DNS and port 80 accessibility

### Out of Disk Space
1. Check disk usage
   ```bash
   df -h
   ```
2. Clean up old logs
   ```bash
   find logs/ -name "*.log" -mtime +30 -delete
   ```
3. Remove old Docker images
   ```bash
   docker system prune -a --volumes
   ```
4. Remove old database backups
   ```bash
   find backups/ -name "*.sql.gz" -mtime +90 -delete
   ```

## Contact Information

### Key Contacts
- Server Administrator: _______________
- Database Administrator: _______________
- Application Developer: _______________
- Security Contact: _______________

### Service Providers
- Domain Registrar: _______________
- Hosting Provider: _______________
- SSL Certificate: Let's Encrypt (automated)

### Important URLs
- Production Site: https://your-domain.com
- SSL Labs Test: https://www.ssllabs.com/ssltest/
- Docker Hub: https://hub.docker.com/

## Notes

Add any deployment-specific notes, quirks, or important information here:

_______________________________________________________________________________
_______________________________________________________________________________
_______________________________________________________________________________
