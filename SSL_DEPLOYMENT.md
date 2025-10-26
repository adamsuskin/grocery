# SSL/TLS Production Deployment Guide

This guide explains how to deploy the Grocery application with SSL/TLS encryption using nginx and Let's Encrypt.

## Prerequisites

1. A registered domain name pointing to your server's IP address
2. Ports 80 and 443 open on your firewall
3. Docker and Docker Compose installed
4. Environment variables configured (see below)

## Environment Variables

Create a `.env.prod` file with the following variables:

```bash
# Domain Configuration
DOMAIN=your-domain.com
CERTBOT_EMAIL=your-email@example.com

# Database Configuration
DB_USER=grocery
DB_PASSWORD=your-secure-database-password
DB_NAME=grocery_db
DB_PORT=5432

# JWT Secrets (generate with: openssl rand -base64 32)
JWT_ACCESS_SECRET=your-jwt-access-secret
JWT_REFRESH_SECRET=your-jwt-refresh-secret

# Zero-cache Secret
ZERO_AUTH_SECRET=your-zero-auth-secret

# CORS Configuration
CORS_ORIGIN=https://your-domain.com

# API URLs (use your domain)
VITE_API_URL=https://your-domain.com/api
VITE_ZERO_SERVER=wss://your-domain.com/zero
VITE_AUTH_ENABLED=true
```

## Initial SSL Certificate Setup

### Step 1: Start nginx without SSL

First, we need to obtain the SSL certificate. Start only the services needed:

```bash
# Start the base services
docker-compose -f docker-compose.prod.yml up -d postgres auth-server zero-cache frontend

# Start nginx (it will redirect HTTP to HTTPS, but HTTPS won't work yet)
docker-compose -f docker-compose.prod.yml -f docker-compose.ssl.yml up -d nginx
```

### Step 2: Obtain SSL Certificate

Run certbot to obtain your SSL certificate:

```bash
docker-compose -f docker-compose.prod.yml -f docker-compose.ssl.yml run --rm certbot \
  certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email $CERTBOT_EMAIL \
  --agree-tos \
  --no-eff-email \
  -d $DOMAIN
```

If successful, you should see a message like:
```
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/your-domain.com/fullchain.pem
```

### Step 3: Restart nginx

Now that the certificate exists, restart nginx to use it:

```bash
docker-compose -f docker-compose.prod.yml -f docker-compose.ssl.yml restart nginx
```

### Step 4: Verify SSL

Visit your domain in a browser: `https://your-domain.com`

You should see:
- A secure connection (lock icon)
- Your application loading correctly
- No certificate warnings

## Automatic Certificate Renewal

The certbot container runs a renewal check every 12 hours. Let's Encrypt certificates are valid for 90 days, and certbot will automatically renew them when they have 30 days or less remaining.

To manually trigger a renewal:

```bash
docker-compose -f docker-compose.prod.yml -f docker-compose.ssl.yml exec certbot certbot renew
```

After renewal, reload nginx:

```bash
docker-compose -f docker-compose.prod.yml -f docker-compose.ssl.yml exec nginx nginx -s reload
```

## Full Deployment Commands

### Start all services with SSL

```bash
docker-compose -f docker-compose.prod.yml -f docker-compose.ssl.yml up -d
```

### View logs

```bash
# All services
docker-compose -f docker-compose.prod.yml -f docker-compose.ssl.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml -f docker-compose.ssl.yml logs -f nginx
docker-compose -f docker-compose.prod.yml -f docker-compose.ssl.yml logs -f certbot
```

### Stop all services

```bash
docker-compose -f docker-compose.prod.yml -f docker-compose.ssl.yml down
```

### Update and restart

```bash
# Pull latest images and rebuild
docker-compose -f docker-compose.prod.yml -f docker-compose.ssl.yml build --pull

# Restart services with zero downtime
docker-compose -f docker-compose.prod.yml -f docker-compose.ssl.yml up -d --force-recreate
```

## Security Features

The SSL configuration includes:

1. **Strong SSL/TLS Configuration**
   - TLS 1.2 and 1.3 only
   - Strong cipher suites
   - Perfect Forward Secrecy

2. **Security Headers**
   - HSTS (HTTP Strict Transport Security)
   - X-Frame-Options: DENY
   - X-Content-Type-Options: nosniff
   - X-XSS-Protection
   - Content-Security-Policy
   - Permissions-Policy

3. **Rate Limiting**
   - API endpoints: 10 requests/second
   - General endpoints: 30 requests/second
   - Configurable burst limits

4. **OCSP Stapling**
   - Enabled for better performance and privacy

## Monitoring

### Check SSL certificate expiry

```bash
docker-compose -f docker-compose.prod.yml -f docker-compose.ssl.yml exec certbot certbot certificates
```

### Test SSL configuration

Use SSL Labs to test your SSL configuration:
https://www.ssllabs.com/ssltest/analyze.html?d=your-domain.com

### Check nginx status

```bash
docker-compose -f docker-compose.prod.yml -f docker-compose.ssl.yml exec nginx nginx -t
```

## Troubleshooting

### Certificate not found error

If nginx fails to start because certificates don't exist:

1. Make sure you've run the certbot command to obtain certificates
2. Check certbot logs: `docker-compose -f docker-compose.prod.yml -f docker-compose.ssl.yml logs certbot`
3. Verify the domain DNS is pointing to your server

### Port 80 or 443 already in use

```bash
# Check what's using the ports
sudo lsof -i :80
sudo lsof -i :443

# Stop conflicting services
sudo systemctl stop apache2  # or nginx if installed system-wide
```

### Rate limiting issues

If you're hitting rate limits during testing, adjust the limits in `nginx-ssl.conf`:

```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=50r/s;
limit_req_zone $binary_remote_addr zone=general_limit:10m rate=100r/s;
```

### Certificate renewal fails

1. Check certbot logs
2. Ensure port 80 is accessible (Let's Encrypt needs it for verification)
3. Verify DNS is still pointing to your server
4. Try manual renewal: `docker-compose -f docker-compose.prod.yml -f docker-compose.ssl.yml exec certbot certbot renew --dry-run`

## Backup and Recovery

### Backup certificates

```bash
docker run --rm \
  -v grocery_letsencrypt-certs:/etc/letsencrypt \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/letsencrypt-$(date +%Y%m%d).tar.gz /etc/letsencrypt
```

### Restore certificates

```bash
docker run --rm \
  -v grocery_letsencrypt-certs:/etc/letsencrypt \
  -v $(pwd)/backups:/backup \
  alpine tar xzf /backup/letsencrypt-YYYYMMDD.tar.gz -C /
```

## Production Checklist

- [ ] Domain DNS configured and propagated
- [ ] Environment variables set in `.env.prod`
- [ ] Firewall rules configured (ports 80, 443, 5432)
- [ ] SSL certificates obtained
- [ ] Services started and healthy
- [ ] SSL configuration tested (SSL Labs)
- [ ] Backups configured
- [ ] Monitoring set up
- [ ] Log rotation configured
- [ ] Certificate renewal tested

## Additional Resources

- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [nginx SSL Configuration](https://nginx.org/en/docs/http/configuring_https_servers.html)
- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)
