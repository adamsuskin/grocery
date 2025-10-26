# Nginx Production Configuration - Feature Overview

## Configuration Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Browser (HTTPS)                    │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    Nginx (Port 443)                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  SSL/TLS Termination (Let's Encrypt)                 │  │
│  │  - TLS 1.2/1.3 only                                  │  │
│  │  - Strong cipher suites                              │  │
│  │  - OCSP stapling                                     │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Security Headers                                     │  │
│  │  - HSTS (1 year)                                     │  │
│  │  - CSP (Content Security Policy)                     │  │
│  │  - X-Frame-Options, X-XSS-Protection                 │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Rate Limiting                                        │  │
│  │  - General: 10 req/s                                 │  │
│  │  - API: 30 req/s                                     │  │
│  │  - Auth: 5 req/s                                     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────┬──────────────┬──────────────┬────────────────┘
              │              │              │
              ▼              ▼              ▼
    ┌─────────────┐  ┌──────────────┐  ┌──────────────┐
    │   Static    │  │  Auth Server │  │  Zero Cache  │
    │   Files     │  │  (API) :3001 │  │  (Sync) :4848│
    │  /dist/*    │  │   /api/*     │  │  /zero/*     │
    │             │  │              │  │   /ws (WS)   │
    └─────────────┘  └──────────────┘  └──────────────┘
```

## Core Features

### 1. SSL/HTTPS Configuration
- ✅ Let's Encrypt certificate integration
- ✅ Automatic HTTP to HTTPS redirect
- ✅ TLS 1.2 and 1.3 support only (secure protocols)
- ✅ Strong cipher suites with forward secrecy (ECDHE)
- ✅ OCSP stapling for improved SSL handshake performance
- ✅ SSL session caching (10MB shared cache)
- ✅ DH parameters support (4096-bit recommended)

### 2. Security Headers
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'...
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

### 3. Rate Limiting
| Endpoint Type | Rate Limit | Burst | Purpose |
|--------------|------------|-------|---------|
| General      | 10 req/s   | 20    | Page loads, static assets |
| API          | 30 req/s   | 20    | API endpoints |
| Auth         | 5 req/s    | 10    | Login, registration |
| WebSocket    | 10 req/s   | 10    | WS connections |

### 4. Reverse Proxy Configuration

#### API Endpoints (`/api/*`)
- Routes to: `auth-server:3001`
- Rate limit: 30 req/s
- Timeout: 60s
- Buffering: Enabled
- Features:
  - Client IP forwarding (X-Real-IP, X-Forwarded-For)
  - Protocol forwarding (X-Forwarded-Proto)
  - Host header preservation
  - Connection keepalive
  - Failover support (3 retries)

#### Zero Cache (`/zero/*`, `/ws`)
- Routes to: `zero-cache:4848`
- Rate limit: 50 req/s (higher for sync operations)
- Timeout: 86400s (24 hours for long-lived connections)
- Buffering: Disabled (real-time sync)
- Features:
  - WebSocket upgrade support
  - Connection: upgrade header
  - No buffering for real-time sync
  - Extended timeouts for persistent connections

### 5. Static Asset Optimization

#### Caching Strategy
| Asset Type | Cache Duration | Cache-Control |
|-----------|---------------|---------------|
| JS/CSS/Images | 1 year | public, immutable |
| index.html | No cache | no-cache, no-store |
| Service Worker | No cache | no-cache |
| Manifest | 1 day | public, max-age=86400 |

#### Compression (Gzip)
- Enabled for: text/*, application/json, application/javascript
- Min size: 1024 bytes
- Compression level: 6
- Vary header: Added for proper caching

### 6. WebSocket Support
Fully configured for:
- Zero Cache real-time sync
- Connection upgrade handling
- Long-lived persistent connections
- No buffering for real-time data
- Extended timeouts (24 hours)

### 7. Progressive Web App (PWA) Support
- Service Worker (`/sw.js`): No caching for updates
- Manifest (`/manifest.json`): 1-day cache
- Icons and assets: Optimized caching
- Offline support via service worker

### 8. SPA (Single Page Application) Routing
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```
- All routes serve index.html
- Client-side routing handled by React Router
- No caching of HTML for fresh updates

### 9. Health Check Endpoint
```
GET /health
Response: 200 OK "healthy"
```
- No authentication required
- No logging (access_log off)
- For load balancer health checks

### 10. Error Handling
- Custom error pages support
- 404 → index.html (SPA routing)
- 50x → /50x.html (server errors)
- Upstream failover (3 retries, 30s timeout)

## Performance Optimizations

### Connection Management
- HTTP/2 enabled (faster multiplexing)
- Keepalive connections to upstreams (32 connections)
- SSL session reuse (1 day cache)
- Connection upgrade for WebSockets

### Buffer Optimization
- Proxy buffers: 8 × 4KB
- SSL buffer: 4KB
- Client body buffer: 128KB
- Max temp file: 1024MB

### Request Limits
- Max body size: 20MB (configurable for file uploads)
- Client header timeout: 60s
- Client body timeout: 60s

## Security Features Summary

1. **Transport Security**
   - Force HTTPS (HSTS with 1-year max-age)
   - Modern TLS only (1.2+)
   - Strong ciphers with forward secrecy

2. **Content Security**
   - CSP to prevent XSS
   - X-Frame-Options to prevent clickjacking
   - X-Content-Type-Options to prevent MIME sniffing

3. **Access Control**
   - Rate limiting per endpoint type
   - Hidden file protection (deny /.*)
   - X-Powered-By header removal

4. **Privacy**
   - Strict referrer policy
   - Permissions policy (disable camera, mic, etc.)
   - No third-party cookies

5. **Availability**
   - Upstream failover
   - Health check support
   - DDoS protection via rate limiting

## SSL Configuration Strength

Expected SSL Labs Grade: **A+**

Key factors:
- ✅ Certificate chain complete
- ✅ TLS 1.3 support
- ✅ Forward secrecy
- ✅ OCSP stapling
- ✅ HSTS with preload
- ✅ Strong key exchange (DH 4096-bit)
- ✅ No weak ciphers

## Monitoring & Logging

### Log Files
- Access log: `/var/log/nginx/grocery_access.log`
- Error log: `/var/log/nginx/grocery_error.log` (warn level)

### Metrics Available
- Request rate (from rate limit zones)
- Response times (from access logs)
- Error rates (from error logs)
- SSL handshake performance
- Upstream server health

### Health Checks
```bash
# Application health
curl https://YOUR_DOMAIN/health

# SSL health
openssl s_client -connect YOUR_DOMAIN:443 -status

# Nginx status
sudo systemctl status nginx
```

## Browser Compatibility

Minimum browser versions supported:
- Chrome 70+ (2018)
- Firefox 62+ (2018)
- Safari 12.1+ (2019)
- Edge 79+ (2020)
- Opera 57+ (2018)

Note: Older browsers may not support TLS 1.2/1.3 and will be unable to connect.

## Compliance

This configuration helps meet:
- ✅ OWASP Top 10 security controls
- ✅ PCI DSS SSL/TLS requirements
- ✅ GDPR privacy headers
- ✅ HIPAA transport security (with additional measures)
- ✅ SOC 2 security controls

## Customization Points

Easy to customize:
1. Domain name (placeholder: YOUR_DOMAIN)
2. Rate limits (3 zones defined)
3. File upload size (default: 20MB)
4. Cache durations (per asset type)
5. Backend server addresses
6. CSP policy (adjust for third-party scripts)
7. Timeout values (default: 60s)
8. Buffer sizes (default: 4KB)

## Next Steps

1. ✅ SSL certificates obtained
2. ✅ Configuration files created
3. ⬜ Domain name updated
4. ⬜ Files copied to /etc/nginx/
5. ⬜ Configuration tested (nginx -t)
6. ⬜ Nginx restarted
7. ⬜ SSL rating verified (SSL Labs)
8. ⬜ Application tested in production

See `QUICK_SETUP.md` for step-by-step deployment instructions.
