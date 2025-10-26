# Production Deployment Checklist

This checklist ensures all critical steps are completed before, during, and after deployment.

## Pre-Deployment Checklist

### Infrastructure Preparation

- [ ] **Server Provisioned**
  - [ ] VPS/server purchased and accessible
  - [ ] Minimum 2GB RAM, 2 CPU cores
  - [ ] 20GB+ SSD storage
  - [ ] Ubuntu 22.04 LTS installed

- [ ] **Domain Configuration**
  - [ ] Domain name registered
  - [ ] DNS A records configured (@ and www)
  - [ ] DNS CNAME record for API subdomain
  - [ ] DNS propagation verified (dig/nslookup)

- [ ] **Server Access**
  - [ ] SSH access working
  - [ ] SSH key authentication configured
  - [ ] Non-root user created
  - [ ] Sudo access configured

### System Configuration

- [ ] **System Updates**
  - [ ] System packages updated (`apt update && apt upgrade`)
  - [ ] Timezone configured
  - [ ] Hostname set appropriately
  - [ ] Locale configured

- [ ] **Firewall Configuration**
  - [ ] UFW installed and enabled
  - [ ] Port 22 (SSH) allowed
  - [ ] Port 80 (HTTP) allowed
  - [ ] Port 443 (HTTPS) allowed
  - [ ] Other ports blocked
  - [ ] Firewall status verified

- [ ] **Security Hardening**
  - [ ] Root login disabled in SSH config
  - [ ] Password authentication disabled
  - [ ] SSH key-only authentication enabled
  - [ ] Fail2ban installed and configured
  - [ ] Automatic security updates enabled

### Software Installation

- [ ] **Core Dependencies**
  - [ ] Node.js 20.x installed
  - [ ] pnpm package manager installed
  - [ ] Git installed and configured
  - [ ] PostgreSQL 16 installed
  - [ ] Nginx installed
  - [ ] Certbot installed

- [ ] **Optional Dependencies**
  - [ ] Docker installed (if using Docker deployment)
  - [ ] Docker Compose installed
  - [ ] PM2 process manager (alternative to systemd)

### Application Preparation

- [ ] **Repository Setup**
  - [ ] Repository cloned to `/home/grocery/grocery`
  - [ ] Correct branch checked out (main/production)
  - [ ] Dependencies installed (`pnpm install`)
  - [ ] Build successful (`pnpm run build`)

- [ ] **Environment Configuration**
  - [ ] `.env.production` file created
  - [ ] All required environment variables set
  - [ ] Strong JWT secrets generated (32+ characters)
  - [ ] Strong Zero auth secret generated
  - [ ] Strong database password set
  - [ ] CORS origins configured correctly
  - [ ] API URLs set to production domains
  - [ ] File permissions set to 600

- [ ] **Secrets Management**
  - [ ] JWT_ACCESS_SECRET: Strong random string
  - [ ] JWT_REFRESH_SECRET: Different strong random string
  - [ ] ZERO_AUTH_SECRET: Strong random string
  - [ ] DB_PASSWORD: Strong database password
  - [ ] All secrets documented in secure location
  - [ ] Secrets never committed to git

### Database Setup

- [ ] **PostgreSQL Configuration**
  - [ ] PostgreSQL service running
  - [ ] Database user created
  - [ ] Database created with correct owner
  - [ ] User password set
  - [ ] Logical replication enabled (wal_level=logical)
  - [ ] Connection authentication configured (pg_hba.conf)
  - [ ] Performance tuning applied

- [ ] **Schema Initialization**
  - [ ] Database schema created (`schema.sql`)
  - [ ] All migrations run successfully
  - [ ] Tables verified (users, lists, grocery_items, etc.)
  - [ ] Indexes created
  - [ ] Constraints verified

- [ ] **Database Security**
  - [ ] Database only accepts local connections
  - [ ] Strong password authentication required
  - [ ] Superuser access restricted
  - [ ] Regular backups configured

### SSL/TLS Configuration

- [ ] **SSL Certificates**
  - [ ] Let's Encrypt certificates obtained
  - [ ] Certificates for main domain
  - [ ] Certificates for www subdomain
  - [ ] Certificates for api subdomain
  - [ ] Certificate files verified in `/etc/letsencrypt/live/`
  - [ ] Auto-renewal tested (`certbot renew --dry-run`)
  - [ ] Renewal hook created (Nginx reload)

- [ ] **SSL Configuration**
  - [ ] Modern TLS protocols enabled (TLSv1.2, TLSv1.3)
  - [ ] Strong cipher suites configured
  - [ ] HSTS header enabled
  - [ ] SSL session caching configured

### Service Configuration

- [ ] **Systemd Services (if not using Docker)**
  - [ ] Auth server service file created
  - [ ] Zero-cache service file created
  - [ ] Services enabled for auto-start
  - [ ] Service dependencies configured
  - [ ] Security hardening applied (NoNewPrivileges, etc.)

- [ ] **Docker Configuration (if using Docker)**
  - [ ] docker-compose.prod.yml reviewed
  - [ ] Environment variables configured
  - [ ] Resource limits set appropriately
  - [ ] Health checks configured
  - [ ] Logging configured
  - [ ] Volumes for persistent data configured

- [ ] **Nginx Configuration**
  - [ ] Reverse proxy configuration created
  - [ ] SSL configuration added
  - [ ] Security headers configured
  - [ ] Gzip compression enabled
  - [ ] Static file caching configured
  - [ ] WebSocket proxying for Zero configured
  - [ ] Configuration syntax validated (`nginx -t`)
  - [ ] Site enabled in sites-enabled
  - [ ] Default site disabled

### Backup Strategy

- [ ] **Backup Configuration**
  - [ ] Backup directory created
  - [ ] Backup script created and tested
  - [ ] Database backup working
  - [ ] Application files backup working
  - [ ] Zero data backup working
  - [ ] Cron job for automated backups configured
  - [ ] Backup retention policy set (7 days default)
  - [ ] Remote backup location configured (optional)

- [ ] **Restore Testing**
  - [ ] Restore procedure documented
  - [ ] Test restore performed successfully
  - [ ] Restore time acceptable

---

## Deployment Checklist

### Final Pre-Deployment Steps

- [ ] **Code Review**
  - [ ] Latest code pulled from repository
  - [ ] Version/commit documented
  - [ ] No debug code or console.logs in production
  - [ ] Environment-specific code reviewed

- [ ] **Build Verification**
  - [ ] TypeScript compilation successful
  - [ ] No TypeScript errors
  - [ ] Frontend build successful
  - [ ] Backend build successful
  - [ ] Build artifacts verified

- [ ] **Pre-Deployment Backup**
  - [ ] Current database backed up
  - [ ] Current application files backed up
  - [ ] Backup verified and accessible

### Service Deployment

- [ ] **Start Services**
  - [ ] PostgreSQL running
  - [ ] Auth server started
  - [ ] Zero-cache started
  - [ ] Nginx running
  - [ ] All services enabled for auto-start

- [ ] **Service Verification**
  - [ ] Auth server responding on port 3001
  - [ ] Zero-cache responding on port 4848
  - [ ] Nginx responding on ports 80 and 443
  - [ ] Health endpoints returning 200 OK
  - [ ] WebSocket connections working

### DNS and SSL Verification

- [ ] **DNS Resolution**
  - [ ] Main domain resolves correctly
  - [ ] www subdomain resolves correctly
  - [ ] api subdomain resolves correctly
  - [ ] DNS propagation complete

- [ ] **SSL Verification**
  - [ ] HTTPS working on main domain
  - [ ] HTTPS working on www subdomain
  - [ ] HTTPS working on api subdomain
  - [ ] No certificate warnings in browser
  - [ ] SSL Labs test score A or higher
  - [ ] HSTS working correctly

### Application Testing

- [ ] **Frontend Testing**
  - [ ] Homepage loads successfully
  - [ ] Static assets loading (CSS, JS, images)
  - [ ] Service Worker registered
  - [ ] PWA installable
  - [ ] Offline mode working
  - [ ] No console errors

- [ ] **API Testing**
  - [ ] Health endpoint responding
  - [ ] User registration working
  - [ ] User login working
  - [ ] JWT token generation working
  - [ ] Token refresh working
  - [ ] Protected endpoints working
  - [ ] CORS working correctly

- [ ] **Database Testing**
  - [ ] Can connect to database
  - [ ] Can query tables
  - [ ] Can insert data
  - [ ] Can update data
  - [ ] Can delete data
  - [ ] Transactions working

- [ ] **Real-Time Sync Testing**
  - [ ] Zero-cache connected to database
  - [ ] WebSocket connections establishing
  - [ ] Real-time updates working
  - [ ] Multi-device sync working
  - [ ] Offline queue working

- [ ] **Authentication Testing**
  - [ ] User can register
  - [ ] User can login
  - [ ] User can logout
  - [ ] Token refresh automatic
  - [ ] Session persistence working
  - [ ] Rate limiting working

- [ ] **Feature Testing**
  - [ ] Can create lists
  - [ ] Can add items
  - [ ] Can edit items
  - [ ] Can delete items
  - [ ] Can share lists
  - [ ] Can set permissions
  - [ ] Real-time collaboration working
  - [ ] Price tracking working
  - [ ] Budget management working
  - [ ] Templates working

---

## Post-Deployment Checklist

### Immediate Post-Deployment (First Hour)

- [ ] **Service Monitoring**
  - [ ] All services running without crashes
  - [ ] No error logs
  - [ ] CPU usage normal
  - [ ] Memory usage normal
  - [ ] Disk usage acceptable
  - [ ] Network connectivity stable

- [ ] **Application Monitoring**
  - [ ] Users can access the application
  - [ ] User registration working
  - [ ] User login working
  - [ ] Core features functional
  - [ ] No error reports from users

- [ ] **Log Review**
  - [ ] Nginx access logs showing traffic
  - [ ] No Nginx error logs
  - [ ] Auth server logs normal
  - [ ] Zero-cache logs normal
  - [ ] PostgreSQL logs normal
  - [ ] No unexpected errors or warnings

### First 24 Hours

- [ ] **Performance Monitoring**
  - [ ] Response times acceptable (<500ms avg)
  - [ ] Database query performance good
  - [ ] No memory leaks detected
  - [ ] No connection pool exhaustion
  - [ ] WebSocket connections stable

- [ ] **User Testing**
  - [ ] Multiple users tested the application
  - [ ] Different browsers tested
  - [ ] Mobile devices tested
  - [ ] PWA installation tested
  - [ ] Offline mode tested
  - [ ] Real-time sync tested with multiple users

- [ ] **Security Verification**
  - [ ] No unauthorized access attempts succeeded
  - [ ] Rate limiting working
  - [ ] CORS restrictions enforced
  - [ ] SQL injection prevention working
  - [ ] XSS prevention working
  - [ ] CSRF protection working

- [ ] **Backup Verification**
  - [ ] First automated backup successful
  - [ ] Backup files created correctly
  - [ ] Backup file sizes reasonable
  - [ ] Old backups cleaned up correctly

### First Week

- [ ] **Stability Check**
  - [ ] No unexpected downtime
  - [ ] No service crashes
  - [ ] No database corruption
  - [ ] No data loss incidents
  - [ ] Uptime > 99.9%

- [ ] **Performance Analysis**
  - [ ] Average response time tracked
  - [ ] Peak load handled successfully
  - [ ] Database performance stable
  - [ ] No performance degradation over time

- [ ] **User Feedback**
  - [ ] User feedback collected
  - [ ] No critical bugs reported
  - [ ] User experience positive
  - [ ] Feature requests documented

- [ ] **Documentation**
  - [ ] Deployment process documented
  - [ ] Issues encountered documented
  - [ ] Solutions applied documented
  - [ ] Lessons learned recorded

---

## Security Hardening Checklist

### Server Security

- [ ] **SSH Hardening**
  - [ ] Root login disabled
  - [ ] Password authentication disabled
  - [ ] SSH key-only authentication
  - [ ] SSH port changed (optional)
  - [ ] Fail2ban configured for SSH

- [ ] **Firewall Rules**
  - [ ] UFW enabled
  - [ ] Only necessary ports open
  - [ ] Default deny incoming
  - [ ] Default allow outgoing
  - [ ] Logging enabled

- [ ] **System Hardening**
  - [ ] Unnecessary services disabled
  - [ ] System updates automated
  - [ ] Kernel security modules enabled
  - [ ] File permissions reviewed
  - [ ] Sudo access restricted

### Application Security

- [ ] **Authentication Security**
  - [ ] Strong password requirements enforced
  - [ ] Password hashing with bcrypt (12+ rounds)
  - [ ] JWT secrets long and random (32+ chars)
  - [ ] Token expiration appropriate (15m access, 7d refresh)
  - [ ] Refresh token rotation implemented
  - [ ] Rate limiting on auth endpoints

- [ ] **API Security**
  - [ ] CORS properly configured
  - [ ] No wildcard CORS origins in production
  - [ ] Input validation on all endpoints
  - [ ] SQL injection prevention
  - [ ] XSS prevention (sanitize inputs)
  - [ ] CSRF protection
  - [ ] Rate limiting on all endpoints

- [ ] **Database Security**
  - [ ] Database user has minimal privileges
  - [ ] Database password is strong
  - [ ] Database not exposed to internet
  - [ ] Prepared statements used (SQL injection prevention)
  - [ ] Connection pooling configured
  - [ ] Query timeouts set

- [ ] **SSL/TLS Security**
  - [ ] Modern TLS versions only (1.2+)
  - [ ] Strong cipher suites
  - [ ] Perfect forward secrecy enabled
  - [ ] HSTS enabled with long max-age
  - [ ] SSL session tickets disabled
  - [ ] OCSP stapling enabled (optional)

- [ ] **HTTP Security Headers**
  - [ ] Strict-Transport-Security
  - [ ] X-Frame-Options: SAMEORIGIN
  - [ ] X-Content-Type-Options: nosniff
  - [ ] X-XSS-Protection: 1; mode=block
  - [ ] Referrer-Policy
  - [ ] Content-Security-Policy (optional, advanced)

### Environment Security

- [ ] **Secrets Management**
  - [ ] No secrets in git repository
  - [ ] `.env` files in `.gitignore`
  - [ ] Environment file permissions 600
  - [ ] Secrets stored securely
  - [ ] Secrets documented separately
  - [ ] Secrets rotation plan in place

- [ ] **File Permissions**
  - [ ] Application files owned by app user
  - [ ] No world-writable files
  - [ ] Executable files have +x only where needed
  - [ ] Config files readable only by owner
  - [ ] Log files have appropriate permissions

- [ ] **Docker Security (if applicable)**
  - [ ] Non-root user in containers
  - [ ] Read-only root filesystem where possible
  - [ ] No privileged containers
  - [ ] Resource limits set
  - [ ] Security options configured (no-new-privileges)
  - [ ] Minimal base images used

---

## Performance Optimization Checklist

### Database Performance

- [ ] **PostgreSQL Tuning**
  - [ ] shared_buffers configured (25% of RAM)
  - [ ] effective_cache_size configured (50-75% of RAM)
  - [ ] work_mem configured appropriately
  - [ ] maintenance_work_mem configured
  - [ ] checkpoint settings optimized
  - [ ] WAL settings optimized

- [ ] **Query Optimization**
  - [ ] All necessary indexes created
  - [ ] Slow query log enabled
  - [ ] Query plans analyzed (EXPLAIN ANALYZE)
  - [ ] N+1 queries eliminated
  - [ ] Database connection pooling configured

- [ ] **Database Maintenance**
  - [ ] Regular VACUUM scheduled
  - [ ] ANALYZE run regularly
  - [ ] Index bloat monitored
  - [ ] Table bloat monitored

### Application Performance

- [ ] **Node.js Optimization**
  - [ ] NODE_ENV set to production
  - [ ] Clustering enabled (optional)
  - [ ] Memory limits appropriate
  - [ ] Garbage collection optimized

- [ ] **Code Optimization**
  - [ ] Async/await used correctly
  - [ ] No blocking operations in request handlers
  - [ ] Database queries optimized
  - [ ] Error handling doesn't leak resources

### Frontend Performance

- [ ] **Build Optimization**
  - [ ] Production build minified
  - [ ] Source maps generated but not served
  - [ ] Tree shaking enabled
  - [ ] Code splitting configured
  - [ ] Lazy loading for routes

- [ ] **Asset Optimization**
  - [ ] Images optimized and compressed
  - [ ] Icons optimized
  - [ ] Fonts subset and optimized
  - [ ] Static assets served with long cache headers

- [ ] **PWA Optimization**
  - [ ] Service Worker caching configured
  - [ ] Critical assets precached
  - [ ] Network-first/cache-first strategies appropriate
  - [ ] Offline fallback pages configured

### Server Performance

- [ ] **Nginx Optimization**
  - [ ] Gzip compression enabled
  - [ ] Static file caching configured
  - [ ] Proxy caching configured (if appropriate)
  - [ ] Keepalive connections enabled
  - [ ] Worker processes configured
  - [ ] Worker connections optimized

- [ ] **System Performance**
  - [ ] Swap configured appropriately
  - [ ] File descriptor limits increased
  - [ ] TCP tuning applied
  - [ ] Disk I/O optimized

### Monitoring Performance

- [ ] **Metrics Collection**
  - [ ] Response time monitoring
  - [ ] Request rate monitoring
  - [ ] Error rate monitoring
  - [ ] CPU usage tracking
  - [ ] Memory usage tracking
  - [ ] Disk usage tracking
  - [ ] Database connection pool monitoring

- [ ] **Alerting**
  - [ ] High CPU alerts configured
  - [ ] High memory alerts configured
  - [ ] High error rate alerts configured
  - [ ] Disk space alerts configured
  - [ ] Service down alerts configured

---

## Final Sign-Off

### Deployment Approval

- [ ] **Technical Review**
  - [ ] All checklist items completed
  - [ ] Tests passing
  - [ ] Documentation complete
  - [ ] Rollback plan documented

- [ ] **Stakeholder Approval**
  - [ ] Product owner approval
  - [ ] Technical lead approval
  - [ ] Security review complete

- [ ] **Communication**
  - [ ] Users notified of new deployment
  - [ ] Support team briefed
  - [ ] Monitoring alerts configured
  - [ ] Incident response plan ready

### Post-Deployment Review (After 1 Week)

- [ ] **Success Metrics**
  - [ ] Uptime meets SLA (>99.9%)
  - [ ] Performance meets targets
  - [ ] No critical bugs
  - [ ] User satisfaction high

- [ ] **Lessons Learned**
  - [ ] Deployment issues documented
  - [ ] Process improvements identified
  - [ ] Documentation updated
  - [ ] Team retrospective completed

---

## Quick Reference

### Critical Passwords and Secrets

Store these securely (password manager, vault):

- Server root password
- Server user password
- Database password
- JWT access secret
- JWT refresh secret
- Zero auth secret
- SSL certificate email
- DNS provider credentials
- Git repository credentials

### Emergency Contacts

- Server provider support
- Domain registrar support
- SSL certificate support
- Database administrator
- Application developer
- DevOps engineer

### Important URLs

- Main application: https://yourdomain.com
- API: https://api.yourdomain.com
- Server IP: YOUR_SERVER_IP
- DNS provider: https://your-dns-provider.com
- Repository: https://github.com/yourusername/grocery

---

## Notes

Use this space for deployment-specific notes:

- Deployment date: _____________
- Deployed by: _____________
- Version/commit: _____________
- Issues encountered: _____________
- Special configurations: _____________
