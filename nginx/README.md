# Nginx Production Configuration Files

This directory contains production-ready nginx configuration files for deploying the Grocery App with SSL/HTTPS support, security hardening, and optimized performance.

## Files Overview

### 1. `nginx.prod.conf`
Main production nginx configuration with:
- HTTPS with Let's Encrypt SSL certificates
- HTTP to HTTPS redirect
- Rate limiting to prevent abuse
- Reverse proxy to auth-server (API endpoints)
- Reverse proxy to zero-cache (real-time sync)
- WebSocket support for Zero sync
- Static asset serving with aggressive caching
- Security headers (HSTS, CSP, X-Frame-Options, etc.)
- Gzip compression
- SPA routing support
- Health check endpoint

### 2. `ssl-params.conf`
SSL/TLS security parameters including:
- Modern TLS protocols (1.2 and 1.3 only)
- Strong cipher suites with forward secrecy
- OCSP stapling for better SSL performance
- Security headers (HSTS, X-Frame-Options, etc.)
- Session caching and optimization

### 3. `proxy-params.conf`
Reverse proxy parameters for upstream services:
- HTTP/1.1 with connection upgrade support
- Client IP forwarding headers
- Timeout configurations
- Buffer optimization
- Error handling and failover
- Request body size limits

## Prerequisites

1. **Nginx** installed on your server
2. **Certbot** for Let's Encrypt SSL certificates
3. **Docker** (if using containerized deployment)
4. Backend services running:
   - auth-server on port 3001
   - zero-cache on port 4848
5. Built frontend files in `/usr/share/nginx/html` or your chosen directory

## Quick Start

### Step 1: Generate SSL Certificates

Install Certbot and obtain Let's Encrypt certificates:

```bash
# Install Certbot (Ubuntu/Debian)
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Obtain certificates (replace YOUR_DOMAIN with actual domain)
sudo certbot certonly --nginx -d YOUR_DOMAIN -d www.YOUR_DOMAIN

# Or use standalone mode if nginx is not running yet
sudo certbot certonly --standalone -d YOUR_DOMAIN -d www.YOUR_DOMAIN
```

Certificates will be saved to:
- `/etc/letsencrypt/live/YOUR_DOMAIN/fullchain.pem`
- `/etc/letsencrypt/live/YOUR_DOMAIN/privkey.pem`
- `/etc/letsencrypt/live/YOUR_DOMAIN/chain.pem`

### Step 2: Generate DH Parameters (Optional but Recommended)

For enhanced security, generate Diffie-Hellman parameters:

```bash
sudo openssl dhparam -out /etc/nginx/dhparam.pem 4096
```

This takes 10-30 minutes. Then uncomment this line in `ssl-params.conf`:
```nginx
ssl_dhparam /etc/nginx/dhparam.pem;
```

### Step 3: Configure Your Domain

Replace all instances of `YOUR_DOMAIN` in `nginx.prod.conf` with your actual domain:

```bash
sed -i 's/YOUR_DOMAIN/example.com/g' nginx.prod.conf
```

### Step 4: Copy Configuration Files

Copy the configuration files to nginx directory:

```bash
# Copy main configuration
sudo cp nginx.prod.conf /etc/nginx/sites-available/grocery

# Copy SSL and proxy parameters
sudo cp ssl-params.conf /etc/nginx/ssl-params.conf
sudo cp proxy-params.conf /etc/nginx/proxy-params.conf

# Enable the site
sudo ln -s /etc/nginx/sites-available/grocery /etc/nginx/sites-enabled/

# Remove default site if exists
sudo rm /etc/nginx/sites-enabled/default
```

### Step 5: Add Connection Upgrade Map

Add this to the `http` block in `/etc/nginx/nginx.conf`:

```nginx
http {
    # ... other settings ...

    # WebSocket connection upgrade map
    map $http_upgrade $connection_upgrade {
        default upgrade;
        '' close;
    }

    # ... rest of configuration ...
}
```

### Step 6: Create Certbot Root Directory

For Let's Encrypt ACME challenge:

```bash
sudo mkdir -p /var/www/certbot
```

### Step 7: Test and Reload Nginx

```bash
# Test configuration
sudo nginx -t

# If test passes, reload nginx
sudo systemctl reload nginx

# Or restart nginx
sudo systemctl restart nginx
```

### Step 8: Set Up Auto-Renewal

Certbot automatically sets up a renewal timer. Verify it:

```bash
# Check renewal timer
sudo systemctl status certbot.timer

# Test renewal process (dry run)
sudo certbot renew --dry-run
```

## Docker Deployment

If using Docker, create a `docker-compose.yml`:

```yaml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.prod.conf:/etc/nginx/conf.d/default.conf
      - ./nginx/ssl-params.conf:/etc/nginx/ssl-params.conf
      - ./nginx/proxy-params.conf:/etc/nginx/proxy-params.conf
      - ./dist:/usr/share/nginx/html:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
      - /var/www/certbot:/var/www/certbot:ro
    depends_on:
      - auth-server
      - zero-cache
    networks:
      - app-network

  auth-server:
    # Your auth server configuration
    networks:
      - app-network

  zero-cache:
    # Your zero-cache configuration
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

## Configuration Customization

### Adjusting Rate Limits

Edit rate limit zones in `nginx.prod.conf`:

```nginx
# Increase API rate limit from 30r/s to 100r/s
limit_req_zone $binary_remote_addr zone=api:10m rate=100r/s;
```

### Adjusting File Upload Size

Edit `proxy-params.conf`:

```nginx
# Increase from 20M to 100M for larger uploads
client_max_body_size 100M;
```

### Modifying Content Security Policy

Edit CSP header in `nginx.prod.conf` to allow third-party resources:

```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self' https://cdn.example.com; ...";
```

### Changing Backend Service URLs

Update upstream servers in `nginx.prod.conf`:

```nginx
upstream auth_backend {
    server auth-server:3001;
    # Add more servers for load balancing
    server auth-server-2:3001;
}
```

## Security Considerations

### Firewall Configuration

Ensure your firewall allows traffic:

```bash
# UFW (Ubuntu)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Firewalld (CentOS/RHEL)
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### Security Headers

The configuration includes:
- **HSTS**: Forces HTTPS for 1 year
- **CSP**: Restricts resource loading
- **X-Frame-Options**: Prevents clickjacking
- **X-Content-Type-Options**: Prevents MIME sniffing
- **X-XSS-Protection**: Enables browser XSS protection

### Rate Limiting

Three rate limit zones protect against abuse:
- **general**: 10 req/sec for general traffic
- **api**: 30 req/sec for API endpoints
- **auth**: 5 req/sec for authentication endpoints

## Testing

### Test SSL Configuration

```bash
# Test with curl
curl -I https://YOUR_DOMAIN

# Check SSL certificate
openssl s_client -connect YOUR_DOMAIN:443 -showcerts

# Verify OCSP stapling
openssl s_client -connect YOUR_DOMAIN:443 -status
```

### Test SSL Security

Use online tools:
- **SSL Labs**: https://www.ssllabs.com/ssltest/
- **Security Headers**: https://securityheaders.com/

### Test Rate Limiting

```bash
# Rapid requests should trigger rate limit
for i in {1..100}; do curl https://YOUR_DOMAIN/api/health; done
```

### Test WebSocket Connection

```bash
# Test WebSocket upgrade
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" https://YOUR_DOMAIN/ws
```

## Monitoring

### Access Logs

```bash
# Watch access logs
sudo tail -f /var/log/nginx/grocery_access.log

# Watch error logs
sudo tail -f /var/log/nginx/grocery_error.log
```

### Nginx Status

```bash
# Check nginx status
sudo systemctl status nginx

# View nginx process
ps aux | grep nginx
```

## Troubleshooting

### Common Issues

**Issue**: 502 Bad Gateway
- **Cause**: Backend services not running or unreachable
- **Fix**: Check auth-server and zero-cache are running and accessible

**Issue**: 403 Forbidden
- **Cause**: Incorrect file permissions
- **Fix**: `sudo chown -R www-data:www-data /usr/share/nginx/html`

**Issue**: 404 Not Found for SPA routes
- **Cause**: Missing try_files directive
- **Fix**: Ensure `try_files $uri $uri/ /index.html;` is in location /

**Issue**: WebSocket connection fails
- **Cause**: Missing upgrade headers or buffering enabled
- **Fix**: Check proxy_http_version 1.1 and connection upgrade headers

**Issue**: SSL certificate error
- **Cause**: Certificate path incorrect or expired
- **Fix**: Verify paths and renew with `sudo certbot renew`

### Debug Mode

Enable debug logging temporarily:

```nginx
error_log /var/log/nginx/grocery_error.log debug;
```

Then reload nginx and check logs.

## Maintenance

### Certificate Renewal

Certificates auto-renew, but verify:

```bash
# List certificates
sudo certbot certificates

# Force renewal
sudo certbot renew --force-renewal
```

### Log Rotation

Nginx logs are rotated automatically by logrotate. Configuration at:
`/etc/logrotate.d/nginx`

### Updating Configuration

After any configuration changes:

```bash
# Always test first
sudo nginx -t

# If test passes
sudo systemctl reload nginx
```

## Performance Tuning

### Worker Processes

Edit `/etc/nginx/nginx.conf`:

```nginx
# Set to number of CPU cores
worker_processes auto;

# Increase worker connections
events {
    worker_connections 2048;
}
```

### Caching

Add caching for proxied content:

```nginx
# In http block
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=1g inactive=60m;

# In location block
proxy_cache api_cache;
proxy_cache_valid 200 5m;
```

### Buffer Sizes

Adjust in `proxy-params.conf` based on your traffic:

```nginx
proxy_buffer_size 8k;
proxy_buffers 16 8k;
```

## Additional Resources

- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)
- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)

## Support

For issues specific to this configuration, check:
1. Nginx error logs: `/var/log/nginx/grocery_error.log`
2. Nginx configuration test: `sudo nginx -t`
3. Backend service logs
4. SSL certificate status: `sudo certbot certificates`
