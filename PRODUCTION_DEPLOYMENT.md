# Production Deployment Guide

This guide provides step-by-step instructions for deploying the Grocery List application to production.

## Prerequisites

Before deploying to production, ensure you have:

- [x] Production database (PostgreSQL) provisioned
- [x] Domain names configured (frontend and API)
- [x] SSL/TLS certificates set up
- [x] Email service provider account (SendGrid, AWS SES, etc.)
- [x] Hosting platform account configured

## Quick Start: Environment Configuration

### Step 1: Generate Secure Secrets

Generate all required secrets using OpenSSL:

```bash
# Generate JWT Access Secret
openssl rand -base64 64

# Generate JWT Refresh Secret (use different output)
openssl rand -base64 64

# Generate Zero Auth Secret
openssl rand -base64 64
```

### Step 2: Generate VAPID Keys for Push Notifications

```bash
# Install web-push CLI globally
npm install -g web-push

# Generate VAPID keys
web-push generate-vapid-keys
```

Save both the public and private keys. You'll need both for configuration.

### Step 3: Copy and Configure .env.production

1. Copy `.env.production` file (already created)
2. Replace all `TODO-REPLACE-WITH-*` placeholders with actual values
3. Replace all `REPLACE_ME_*` secrets with generated values from Step 1 and 2
4. Never commit this file to git (already in .gitignore)

### Critical Configuration Items

#### Required Configuration (Must Change):

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require

# JWT Secrets (use generated values from Step 1)
JWT_ACCESS_SECRET=<your-generated-access-secret>
JWT_REFRESH_SECRET=<your-generated-refresh-secret>

# Zero Cache
ZERO_AUTH_SECRET=<your-generated-zero-secret>
ZERO_REPLICA_FILE=/var/lib/grocery-app/zero-replica.db  # Persistent storage!

# VAPID (use generated values from Step 2)
VAPID_PUBLIC_KEY=<your-vapid-public-key>
VAPID_PRIVATE_KEY=<your-vapid-private-key>
VAPID_SUBJECT=mailto:admin@yourdomain.com

# URLs
VITE_API_URL=https://api.yourdomain.com
VITE_ZERO_SERVER=https://sync.yourdomain.com
CORS_ORIGIN=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com
```

#### Recommended Configuration:

```env
# Environment
NODE_ENV=production

# Security
BCRYPT_ROUNDS=12
TRUST_PROXY=true

# Features
VITE_AUTH_ENABLED=true
```

## Database Setup

### 1. Create Production Database

```bash
# Connect to your PostgreSQL server
psql -h your-db-host -U postgres

# Create database and user
CREATE DATABASE grocery_db_production;
CREATE USER grocery_prod WITH ENCRYPTED PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE grocery_db_production TO grocery_prod;
```

### 2. Run Migrations

```bash
# Set DATABASE_URL environment variable
export DATABASE_URL="postgresql://grocery_prod:password@host:5432/grocery_db_production?sslmode=require"

# Run migrations
npm run migrate
```

### 3. Verify Database Schema

```bash
# Connect and verify tables
psql "$DATABASE_URL"

# List tables
\dt

# Expected tables:
# - users
# - refresh_tokens
# - failed_login_attempts
# - push_subscriptions
# - (zero-cache tables)
```

## Email Service Configuration

### Option 1: SendGrid (Recommended)

1. Sign up at https://sendgrid.com
2. Create API key with "Mail Send" permissions
3. Verify sender email address
4. Update code in `server/utils/email.ts` to use SendGrid:

```typescript
import sgMail from '@sendgrid/mail';
sgMail.setApiKey(process.env.EMAIL_API_KEY!);

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    await sgMail.send({
      from: process.env.EMAIL_FROM!,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
    return true;
  } catch (error) {
    console.error('Email send failed:', error);
    return false;
  }
}
```

### Option 2: AWS SES

1. Enable AWS SES in your AWS account
2. Verify domain and sender email
3. Get AWS credentials (Access Key ID and Secret)
4. Install AWS SDK: `npm install @aws-sdk/client-ses`
5. Update `server/utils/email.ts` with SES implementation

## Security Checklist

Before going live, verify:

- [ ] All secrets are securely generated (64+ characters)
- [ ] JWT secrets are different from each other
- [ ] Database password is strong and unique
- [ ] SSL/TLS certificates are valid and not expiring soon
- [ ] CORS is restricted to production domains only
- [ ] Rate limiting is configured appropriately
- [ ] TRUST_PROXY is set to true if behind proxy
- [ ] Debug logging is disabled (DEBUG_DB=false)
- [ ] NODE_ENV is set to "production"
- [ ] Default/development passwords are changed
- [ ] .env.production is in .gitignore
- [ ] Secrets are stored in secrets manager (not just env file)

## Hosting Platform Setup

### Heroku

```bash
# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set DATABASE_URL="your-database-url"
heroku config:set JWT_ACCESS_SECRET="your-secret"
# ... (set all other variables)

# Deploy
git push heroku main

# Run migrations
heroku run npm run migrate
```

### DigitalOcean App Platform

1. Create new app from GitHub repository
2. Configure environment variables in dashboard
3. Set build and run commands:
   - Build: `npm run build`
   - Run: `npm start`
4. Configure health check endpoint: `/api/health`
5. Deploy

### AWS (Elastic Beanstalk)

```bash
# Initialize EB
eb init

# Create environment
eb create production-env

# Set environment variables
eb setenv NODE_ENV=production DATABASE_URL="your-url" JWT_ACCESS_SECRET="your-secret"

# Deploy
eb deploy
```

### Docker + Kubernetes

```bash
# Build Docker image
docker build -t grocery-list:latest .

# Push to registry
docker tag grocery-list:latest your-registry/grocery-list:latest
docker push your-registry/grocery-list:latest

# Deploy to Kubernetes
kubectl apply -f k8s/production/

# Set secrets
kubectl create secret generic grocery-secrets \
  --from-literal=jwt-access-secret='your-secret' \
  --from-literal=jwt-refresh-secret='your-secret' \
  --from-literal=database-url='your-url'
```

## Zero-Cache Server Setup

The zero-cache server requires special attention:

### 1. Persistent Storage

Ensure `ZERO_REPLICA_FILE` points to persistent storage:

```env
# NOT THIS (temporary storage):
ZERO_REPLICA_FILE=/tmp/zero-replica.db

# USE THIS (persistent storage):
ZERO_REPLICA_FILE=/var/lib/grocery-app/zero-replica.db
```

### 2. Storage Permissions

```bash
# Create directory with proper permissions
sudo mkdir -p /var/lib/grocery-app
sudo chown appuser:appuser /var/lib/grocery-app
sudo chmod 755 /var/lib/grocery-app
```

### 3. Backup Strategy

```bash
# Set up daily backups of zero-replica.db
0 2 * * * /usr/local/bin/backup-zero-replica.sh
```

## Monitoring Setup

### Health Check Endpoint

The application should expose a health check endpoint:

```typescript
// server/index.ts
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
```

### Recommended Monitoring

1. **Uptime Monitoring**: UptimeRobot, Pingdom
2. **Error Tracking**: Sentry, Rollbar
3. **APM**: New Relic, Datadog
4. **Logs**: Loggly, Papertrail, CloudWatch

### Key Metrics to Monitor

- API response times
- Error rates (4xx, 5xx)
- Database connection pool usage
- Memory and CPU usage
- Rate limit violations
- Failed authentication attempts
- SSL certificate expiration (30 days warning)

## Testing Before Launch

### 1. Smoke Tests

```bash
# Test API endpoints
curl https://api.yourdomain.com/api/health

# Test authentication
curl -X POST https://api.yourdomain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","name":"Test User"}'
```

### 2. Load Testing

Use tools like Apache Bench, Artillery, or k6:

```bash
# Install Artillery
npm install -g artillery

# Run load test
artillery quick --count 100 --num 10 https://api.yourdomain.com/api/health
```

### 3. Security Scan

```bash
# Check for security vulnerabilities
npm audit

# SSL/TLS test
curl -I https://api.yourdomain.com

# Check headers
curl -I https://api.yourdomain.com/api/health | grep -i "strict-transport-security"
```

## Post-Deployment

### 1. Verify All Services

- [ ] Frontend loads correctly
- [ ] API responds to health checks
- [ ] Authentication works (register, login, refresh)
- [ ] Database connections are stable
- [ ] Zero-cache sync is working
- [ ] Push notifications work
- [ ] Email sending works
- [ ] SSL certificates are valid
- [ ] CORS is properly configured

### 2. Monitor for Issues

Watch logs for the first 24 hours:

```bash
# Heroku
heroku logs --tail

# Docker/K8s
kubectl logs -f deployment/grocery-list

# DigitalOcean
doctl apps logs your-app-id --follow
```

### 3. Set Up Alerts

Configure alerts for:
- Application errors (error rate > 5%)
- High response times (p95 > 1s)
- Database connection failures
- SSL certificate expiration (< 30 days)
- Memory usage (> 80%)
- Failed authentication spike

## Rollback Procedure

If issues occur, rollback immediately:

### Heroku
```bash
heroku rollback
```

### DigitalOcean
```bash
doctl apps deployment list your-app-id
doctl apps deployment rollback your-app-id deployment-id
```

### Kubernetes
```bash
kubectl rollout undo deployment/grocery-list
```

## Troubleshooting

### Database Connection Issues

```bash
# Test connection
psql "$DATABASE_URL"

# Check SSL mode
echo $DATABASE_URL | grep sslmode

# Verify firewall/security groups
```

### JWT Authentication Failing

- Verify JWT_ACCESS_SECRET is set correctly
- Check token expiration settings
- Ensure system clocks are synchronized

### CORS Errors

- Verify CORS_ORIGIN includes your frontend domain
- Check for trailing slashes in URLs
- Ensure protocol (https://) matches

### Rate Limiting Issues

- Check TRUST_PROXY setting if behind proxy
- Verify IP extraction is working correctly
- Consider using Redis for multi-instance deployments

## Maintenance

### Regular Tasks

- **Daily**: Monitor error logs and metrics
- **Weekly**: Review security alerts, check SSL expiration
- **Monthly**: Rotate secrets (if policy requires), review access logs
- **Quarterly**: Security audit, dependency updates, load testing

### Dependency Updates

```bash
# Check for updates
npm outdated

# Update dependencies
npm update

# Check for security vulnerabilities
npm audit fix
```

### Secret Rotation

When rotating secrets:

1. Generate new secrets
2. Update in secrets manager
3. Deploy new configuration
4. Monitor for issues
5. Invalidate old secrets after verification

## Support

For production support:

- Check application logs first
- Review monitoring dashboards
- Consult this deployment guide
- Check GitHub issues
- Contact team lead for critical issues

## Additional Resources

- [PostgreSQL Production Checklist](https://wiki.postgresql.org/wiki/Production_Checklist)
- [Node.js Production Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [OWASP Security Guidelines](https://owasp.org/www-project-web-security-testing-guide/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

---

**Last Updated**: 2025-10-26
**Version**: 1.0
