# Quick Setup Guide - Nginx Production Configuration

## 5-Minute Setup (After Building Your App)

### 1. Prerequisites Check
```bash
# Check nginx is installed
nginx -v

# Check certbot is installed
certbot --version

# If not installed:
sudo apt update && sudo apt install nginx certbot python3-certbot-nginx
```

### 2. Obtain SSL Certificate
```bash
# Replace YOUR_DOMAIN with your actual domain
sudo certbot certonly --nginx -d YOUR_DOMAIN -d www.YOUR_DOMAIN
```

### 3. Update Configuration
```bash
# Go to nginx config directory
cd /home/adam/grocery/nginx/

# Replace YOUR_DOMAIN with your actual domain
sed -i 's/YOUR_DOMAIN/yourdomain.com/g' nginx.prod.conf
```

### 4. Copy Files to Nginx
```bash
# Copy configuration files
sudo cp nginx.prod.conf /etc/nginx/sites-available/grocery
sudo cp ssl-params.conf /etc/nginx/ssl-params.conf
sudo cp proxy-params.conf /etc/nginx/proxy-params.conf

# Enable the site
sudo ln -s /etc/nginx/sites-available/grocery /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
```

### 5. Add WebSocket Support to Main Config
```bash
# Edit main nginx config
sudo nano /etc/nginx/nginx.conf

# Add this inside the http {} block:
# map $http_upgrade $connection_upgrade {
#     default upgrade;
#     '' close;
# }
```

### 6. Create Certbot Directory
```bash
sudo mkdir -p /var/www/certbot
```

### 7. Build and Deploy Frontend
```bash
# Go to project root
cd /home/adam/grocery/

# Build production frontend
npm run build

# Copy built files to nginx web root
sudo cp -r dist/* /usr/share/nginx/html/
sudo chown -R www-data:www-data /usr/share/nginx/html/
```

### 8. Test and Start
```bash
# Test configuration
sudo nginx -t

# If test passes, restart nginx
sudo systemctl restart nginx

# Enable nginx to start on boot
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx
```

### 9. Verify Deployment
```bash
# Test HTTPS
curl -I https://yourdomain.com

# Test API proxy
curl https://yourdomain.com/api/health

# Check SSL rating
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=yourdomain.com
```

### 10. Setup Firewall (if needed)
```bash
# Ubuntu/Debian (UFW)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# CentOS/RHEL (Firewalld)
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

## Docker Compose Setup

If using Docker, create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    container_name: grocery-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.prod.conf:/etc/nginx/conf.d/default.conf:ro
      - ./nginx/ssl-params.conf:/etc/nginx/ssl-params.conf:ro
      - ./nginx/proxy-params.conf:/etc/nginx/proxy-params.conf:ro
      - ./dist:/usr/share/nginx/html:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
      - /var/www/certbot:/var/www/certbot:ro
      - nginx-logs:/var/log/nginx
    depends_on:
      - auth-server
      - zero-cache
    networks:
      - grocery-network

  auth-server:
    build: ./auth-server
    container_name: grocery-auth
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PORT=3001
    networks:
      - grocery-network

  zero-cache:
    build: ./zero-cache
    container_name: grocery-zero
    restart: unless-stopped
    ports:
      - "4848:4848"
    networks:
      - grocery-network

volumes:
  nginx-logs:

networks:
  grocery-network:
    driver: bridge
```

Then run:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Important Paths to Update

Before deployment, ensure these paths match your setup:

1. **SSL Certificates**: `/etc/letsencrypt/live/YOUR_DOMAIN/`
2. **Frontend Files**: `/usr/share/nginx/html/`
3. **Backend Services**:
   - auth-server: `http://auth-server:3001`
   - zero-cache: `http://zero-cache:4848`

## Configuration Checklist

- [ ] SSL certificates obtained and paths updated
- [ ] Domain name replaced in nginx.prod.conf
- [ ] WebSocket connection upgrade map added to nginx.conf
- [ ] Frontend built and copied to web root
- [ ] Backend services running and accessible
- [ ] Configuration files copied to /etc/nginx/
- [ ] Nginx configuration tested (nginx -t)
- [ ] Firewall rules configured
- [ ] Nginx restarted successfully
- [ ] HTTPS works in browser
- [ ] API endpoints accessible
- [ ] WebSocket connection works
- [ ] SSL rating A or A+ on SSL Labs

## Troubleshooting Quick Fixes

**502 Bad Gateway?**
```bash
# Check backend services
docker ps  # If using Docker
# or
sudo systemctl status auth-server zero-cache
```

**SSL Certificate Error?**
```bash
# Verify certificate paths
sudo ls -la /etc/letsencrypt/live/YOUR_DOMAIN/
# Renew if needed
sudo certbot renew
```

**403 Forbidden?**
```bash
# Fix permissions
sudo chown -R www-data:www-data /usr/share/nginx/html/
sudo chmod -R 755 /usr/share/nginx/html/
```

**SPA Routes 404?**
```bash
# Ensure try_files is correct in nginx.prod.conf
# Should be: try_files $uri $uri/ /index.html;
```

**WebSocket Connection Fails?**
```bash
# Verify connection upgrade map in nginx.conf
# Check proxy headers in location /ws or /zero/
```

## Monitoring Commands

```bash
# Watch access logs
sudo tail -f /var/log/nginx/grocery_access.log

# Watch error logs
sudo tail -f /var/log/nginx/grocery_error.log

# Check nginx status
sudo systemctl status nginx

# Test configuration
sudo nginx -t

# Reload after changes
sudo systemctl reload nginx
```

## Need More Help?

See the full `README.md` in this directory for:
- Detailed explanations of each configuration
- Advanced customization options
- Performance tuning guides
- Security hardening tips
- Complete troubleshooting guide
