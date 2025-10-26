# Security Best Practices Guide

## Table of Contents

1. [Password Security](#password-security)
2. [JWT Secret Management](#jwt-secret-management)
3. [Token Expiration](#token-expiration)
4. [HTTPS Requirements](#https-requirements)
5. [CORS Configuration](#cors-configuration)
6. [SQL Injection Prevention](#sql-injection-prevention)
7. [XSS Prevention](#xss-prevention)
8. [CSRF Protection](#csrf-protection)
9. [Rate Limiting](#rate-limiting)
10. [Input Validation](#input-validation)
11. [Error Message Security](#error-message-security)
12. [Session Management](#session-management)
13. [Production Security Checklist](#production-security-checklist)

---

## 1. Password Security

### Bcrypt Configuration

**Current Implementation:**
```typescript
// server/config/env.ts
export const securityConfig = {
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
};

// server/auth/utils.ts
export async function hashPassword(password: string): Promise<string> {
  const hash = await bcrypt.hash(password, securityConfig.bcryptRounds);
  return hash;
}
```

### Best Practices

#### Recommended Bcrypt Rounds

| Environment | Rounds | Hash Time | Security Level |
|-------------|--------|-----------|----------------|
| Development | 10 | ~100ms | Good |
| Production | 12 | ~250ms | Better |
| High Security | 14 | ~1s | Best |

**Recommendation:** Use **10-12 rounds** for production. Higher rounds increase security but impact performance.

```bash
# .env
BCRYPT_ROUNDS=12
```

#### Password Requirements

**Current validation:**
```typescript
export function validatePassword(password: string): { isValid: boolean; error?: string } {
  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters long' };
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one number' };
  }
  return { isValid: true };
}
```

**Requirements enforced:**
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number

**Enhanced recommendations:**
- Consider adding special character requirement: `!/[@#$%^&*(),.?":{}|<>]/`
- Increase minimum length to 12 characters for admin accounts
- Implement password strength meter in frontend
- Check against common password databases (e.g., Have I Been Pwned API)

### Common Vulnerabilities to Avoid

**DO NOT:**
```typescript
// NEVER store passwords in plain text
const user = { password: 'mypassword' };  // WRONG

// NEVER log passwords
console.log('User password:', password);  // WRONG

// NEVER send passwords in URLs
fetch(`/api?password=${password}`);  // WRONG
```

**DO:**
```typescript
// Always hash passwords before storing
const passwordHash = await hashPassword(password);

// Never log sensitive data
console.log('User authenticated:', userId);  // GOOD

// Always send passwords in request body over HTTPS
fetch('/api/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, password }),
});
```

---

## 2. JWT Secret Management

### Secret Configuration

**Current implementation:**
```typescript
// server/config/env.ts
export const jwtConfig = {
  accessTokenSecret: process.env.JWT_ACCESS_SECRET || 'dev-access-secret-change-in-production',
  refreshTokenSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-production',
  accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
  refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
};
```

### Generating Secure Secrets

**Use strong, random secrets (minimum 32 bytes):**

```bash
# Generate a secure secret using OpenSSL
openssl rand -base64 32

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Output example:
# 8xKzP9mN2vQ5wE7tR4yU3iO1pA6sD8fG9hJ0kL2mN5vB7cX4zW6q
```

### Environment Configuration

**Development (.env):**
```bash
# Development secrets (less critical)
JWT_ACCESS_SECRET=dev-access-secret-change-in-production
JWT_REFRESH_SECRET=dev-refresh-secret-change-in-production
```

**Production (.env):**
```bash
# Production secrets (CRITICAL - use strong random values)
JWT_ACCESS_SECRET=8xKzP9mN2vQ5wE7tR4yU3iO1pA6sD8fG9hJ0kL2mN5vB7cX4zW6q
JWT_REFRESH_SECRET=2nM5vB7cX4zW6q1pA8xKzP9mN2vQ5wE7tR4yU3iO6sD8fG9hJ0kL
```

### Secret Management Best Practices

**DO:**
- Use different secrets for access and refresh tokens
- Store secrets in environment variables, never in code
- Use a secret management service in production (AWS Secrets Manager, HashiCorp Vault, etc.)
- Rotate secrets periodically (every 90 days recommended)
- Use at least 256 bits (32 bytes) of entropy

**DO NOT:**
- Never commit secrets to version control
- Never use the same secret across environments
- Never hardcode secrets in source code
- Never share secrets via email or chat
- Never reuse secrets between different applications

### Secret Rotation Strategy

**When to rotate:**
- Every 90 days (scheduled)
- After security incident
- After team member departure
- After suspected compromise

**How to rotate:**
1. Generate new secret
2. Update environment variables
3. Deploy with both old and new secrets temporarily
4. Invalidate old tokens (force re-login)
5. Remove old secret after grace period

---

## 3. Token Expiration

### Token Lifetime Configuration

**Current settings:**
```typescript
// Short-lived access token
JWT_ACCESS_EXPIRY=15m

// Longer-lived refresh token
JWT_REFRESH_EXPIRY=7d
```

### Recommended Token Lifetimes

| Token Type | Recommended | Security Level | Use Case |
|-----------|-------------|----------------|----------|
| Access Token | 15m | Standard | General web apps |
| Access Token | 5m | High security | Banking, healthcare |
| Access Token | 1h | Lower security | Internal tools |
| Refresh Token | 7d | Standard | Web apps |
| Refresh Token | 30d | Lower security | Mobile apps |
| Refresh Token | 1d | High security | Critical systems |

### Implementation Examples

**Standard security:**
```bash
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
```

**High security:**
```bash
JWT_ACCESS_EXPIRY=5m
JWT_REFRESH_EXPIRY=24h
```

**Mobile app (better UX):**
```bash
JWT_ACCESS_EXPIRY=1h
JWT_REFRESH_EXPIRY=30d
```

### Token Refresh Flow

**Current implementation:**
```typescript
// POST /api/auth/refresh
export async function refreshToken(req: AuthRequest, res: Response): Promise<void> {
  const { refreshToken } = req.body;

  // Verify refresh token
  const decoded = verifyRefreshToken(refreshToken);

  // Get user from database
  const user = await query<User>('SELECT * FROM users WHERE id = $1', [decoded.userId]);

  // Generate new token pair
  const tokens = generateTokenPair(user[0]);

  res.json({ success: true, data: tokens });
}
```

**Client-side refresh strategy:**
```typescript
// Refresh token 1 minute before expiry
const REFRESH_THRESHOLD = 60 * 1000; // 1 minute

async function refreshTokenIfNeeded(accessToken: string) {
  const decoded = jwtDecode(accessToken);
  const expiresIn = decoded.exp * 1000 - Date.now();

  if (expiresIn < REFRESH_THRESHOLD) {
    const refreshToken = localStorage.getItem('refreshToken');
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
    const { data } = await response.json();
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    return data.accessToken;
  }

  return accessToken;
}
```

### Token Revocation

**For critical operations, implement token blacklisting:**

```sql
-- Create token blacklist table
CREATE TABLE token_blacklist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES users(id),
  blacklisted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  reason VARCHAR(255)
);

CREATE INDEX idx_token_blacklist_hash ON token_blacklist(token_hash);
CREATE INDEX idx_token_blacklist_expires ON token_blacklist(expires_at);
```

```typescript
// Blacklist a token
async function blacklistToken(token: string, userId: string, reason: string) {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const decoded = jwt.decode(token) as any;

  await query(
    `INSERT INTO token_blacklist (token_hash, user_id, expires_at, reason)
     VALUES ($1, $2, $3, $4)`,
    [tokenHash, userId, new Date(decoded.exp * 1000), reason]
  );
}

// Check if token is blacklisted
async function isTokenBlacklisted(token: string): Promise<boolean> {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const result = await query(
    'SELECT 1 FROM token_blacklist WHERE token_hash = $1 AND expires_at > CURRENT_TIMESTAMP',
    [tokenHash]
  );
  return result.length > 0;
}
```

---

## 4. HTTPS Requirements

### Why HTTPS is Critical

**Without HTTPS, attackers can:**
- Intercept JWT tokens
- Steal passwords during login
- Modify requests/responses
- Perform man-in-the-middle attacks

### Development Environment

**For local development, HTTP is acceptable:**
```bash
# .env
VITE_API_URL=http://localhost:3001
```

**But consider using mkcert for local HTTPS:**
```bash
# Install mkcert
brew install mkcert  # macOS
choco install mkcert  # Windows

# Create local CA
mkcert -install

# Generate certificate
mkcert localhost 127.0.0.1

# Use in Express
import https from 'https';
import fs from 'fs';

const options = {
  key: fs.readFileSync('localhost-key.pem'),
  cert: fs.readFileSync('localhost.pem'),
};

https.createServer(options, app).listen(3001);
```

### Production Environment

**HTTPS is MANDATORY in production:**
```bash
# .env.production
VITE_API_URL=https://api.yourdomain.com
NODE_ENV=production
```

### HTTPS Implementation Options

**Option 1: Reverse Proxy (Recommended)**

Use nginx or Caddy as reverse proxy:

```nginx
# nginx.conf
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    # SSL certificates (Let's Encrypt recommended)
    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$host$request_uri;
}
```

**Option 2: Cloud Provider SSL**

Use cloud provider's SSL/TLS termination:
- AWS: Application Load Balancer with ACM certificate
- Google Cloud: HTTPS Load Balancer with managed certificate
- Azure: Application Gateway with certificate
- Cloudflare: Automatic HTTPS

### HSTS (HTTP Strict Transport Security)

**Current implementation:**
```typescript
// server/index.ts
if (serverConfig.isProduction) {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
}
```

**Enhanced HSTS configuration:**
```typescript
// Add preload directive for maximum security
res.setHeader(
  'Strict-Transport-Security',
  'max-age=63072000; includeSubDomains; preload'
);
```

**Submit to HSTS preload list:**
1. Visit https://hstspreload.org/
2. Enter your domain
3. Check requirements
4. Submit for inclusion in browsers' preload lists

---

## 5. CORS Configuration

### Current Implementation

```typescript
// server/index.ts
const corsOptions = {
  origin: serverConfig.corsOrigin,
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
```

### Environment-Specific Configuration

**Development:**
```bash
# .env
CORS_ORIGIN=http://localhost:3000
```

**Production (Single origin):**
```bash
# .env.production
CORS_ORIGIN=https://yourdomain.com
```

**Production (Multiple origins):**
```bash
# .env.production
CORS_ORIGIN=https://yourdomain.com,https://app.yourdomain.com,https://mobile.yourdomain.com
```

### Advanced CORS Configuration

**Dynamic origin validation:**
```typescript
const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [];

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (mobile apps, Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400, // 24 hours
};
```

### CORS Security Best Practices

**DO:**
- Always specify exact origins in production
- Enable credentials only when needed
- Limit allowed methods to what's necessary
- Use HTTPS origins only
- Log blocked CORS requests

**DO NOT:**
- Never use `*` wildcard in production with credentials
- Never allow all origins for authenticated APIs
- Never trust the Origin header alone
- Don't expose sensitive headers unnecessarily

**Example of INSECURE CORS:**
```typescript
// NEVER DO THIS IN PRODUCTION
const corsOptions = {
  origin: '*',  // WRONG - allows any origin
  credentials: true,  // WRONG - contradicts wildcard
};
```

### Preflight Requests

**CORS preflight for complex requests:**
```typescript
// Handle OPTIONS requests
app.options('*', cors(corsOptions));

// Or specific routes
app.options('/api/auth/*', cors(corsOptions));
```

---

## 6. SQL Injection Prevention

### Parameterized Queries (Current Implementation)

**SECURE - Using parameterized queries:**
```typescript
// server/db/pool.ts
export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows as T[];
}

// Usage in controller
const users = await query<User>(
  'SELECT * FROM users WHERE email = $1',  // ✓ Parameterized
  [email.toLowerCase()]
);
```

### SQL Injection Examples

**INSECURE - String concatenation:**
```typescript
// NEVER DO THIS - Vulnerable to SQL injection
const users = await query(
  `SELECT * FROM users WHERE email = '${email}'`  // ✗ VULNERABLE
);

// Attacker input: email = "admin' OR '1'='1"
// Results in: SELECT * FROM users WHERE email = 'admin' OR '1'='1'
// This returns ALL users!
```

**SECURE - Parameterized query:**
```typescript
// ALWAYS DO THIS - Safe from SQL injection
const users = await query<User>(
  'SELECT * FROM users WHERE email = $1',  // ✓ SAFE
  [email]
);

// Attacker input: email = "admin' OR '1'='1"
// Database treats entire input as literal string, not SQL code
```

### Complex Query Examples

**Dynamic WHERE clauses:**
```typescript
// SECURE way to build dynamic queries
export async function updateProfile(req: AuthRequest, res: Response): Promise<void> {
  const { name, email } = req.body;

  // Build query dynamically but safely
  const updates: string[] = [];
  const values: unknown[] = [];
  let paramCount = 1;

  if (name) {
    updates.push(`name = $${paramCount}`);
    values.push(name.trim());
    paramCount++;
  }

  if (email) {
    updates.push(`email = $${paramCount}`);
    values.push(email.toLowerCase());
    paramCount++;
  }

  values.push(req.user.userId);

  // Final query uses parameters
  const updatedUsers = await query<User>(
    `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
     WHERE id = $${paramCount}
     RETURNING *`,
    values
  );
}
```

**LIKE queries:**
```typescript
// SECURE LIKE query
async function searchUsers(searchTerm: string) {
  // Escape special characters
  const sanitized = searchTerm.replace(/[%_]/g, '\\$&');

  // Use parameterized query
  const users = await query<User>(
    'SELECT * FROM users WHERE name ILIKE $1',
    [`%${sanitized}%`]
  );
  return users;
}
```

### Database Input Validation

**Always validate before querying:**
```typescript
// Validate email format
if (!isValidEmail(email)) {
  throw new ValidationError('Invalid email format');
}

// Validate UUID format
if (!isValidUUID(userId)) {
  throw new ValidationError('Invalid user ID format');
}

// Validate and sanitize strings
const sanitizedName = name.trim().slice(0, 100);
```

### Additional SQL Security Measures

**Use least privilege principle:**
```sql
-- Create a read-only user for reporting
CREATE USER readonly_user WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE grocery_db TO readonly_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;

-- Create application user with limited permissions
CREATE USER app_user WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE grocery_db TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO app_user;
-- Don't grant DROP, TRUNCATE, or other dangerous operations
```

**Enable query logging for auditing:**
```bash
# postgresql.conf
log_statement = 'mod'  # Log all modifications
log_duration = on
log_min_duration_statement = 1000  # Log slow queries (>1s)
```

---

## 7. XSS Prevention

### Input Sanitization

**Current validation:**
```typescript
// server/middleware/validateRequest.ts
export function sanitizeString(input: string): string {
  return input.trim().replace(/\s+/g, ' ');
}
```

### Frontend XSS Prevention

**React automatically escapes content:**
```tsx
// SAFE - React escapes by default
function UserProfile({ user }) {
  return <div>{user.name}</div>;  // ✓ Automatically escaped
}

// DANGEROUS - dangerouslySetInnerHTML bypasses escaping
function UserProfile({ user }) {
  return (
    <div dangerouslySetInnerHTML={{ __html: user.bio }} />  // ✗ VULNERABLE
  );
}
```

**Use DOMPurify for rich text:**
```tsx
import DOMPurify from 'dompurify';

function UserBio({ bio }: { bio: string }) {
  const cleanBio = DOMPurify.sanitize(bio, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: [],
  });

  return <div dangerouslySetInnerHTML={{ __html: cleanBio }} />;
}
```

### Backend XSS Prevention

**Sanitize user input:**
```typescript
import validator from 'validator';

// Escape HTML entities
const safeName = validator.escape(name);

// Remove script tags
const safeContent = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
```

### Content Security Policy (CSP)

**Add CSP headers:**
```typescript
// server/index.ts
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' data:; " +
    "connect-src 'self' " + process.env.VITE_API_URL + "; " +
    "frame-ancestors 'none';"
  );
  next();
});
```

**Strict CSP (recommended):**
```typescript
res.setHeader(
  'Content-Security-Policy',
  "default-src 'none'; " +
  "script-src 'self'; " +
  "style-src 'self'; " +
  "img-src 'self'; " +
  "font-src 'self'; " +
  "connect-src 'self'; " +
  "base-uri 'self'; " +
  "form-action 'self'; " +
  "frame-ancestors 'none';"
);
```

### X-XSS-Protection Header

**Current implementation:**
```typescript
// server/index.ts
res.setHeader('X-XSS-Protection', '1; mode=block');
```

### HTTPOnly and Secure Cookies

**If using cookies (not applicable for current JWT in localStorage):**
```typescript
res.cookie('refreshToken', token, {
  httpOnly: true,  // Prevent JavaScript access
  secure: true,    // HTTPS only
  sameSite: 'strict',  // CSRF protection
  maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days
});
```

---

## 8. CSRF Protection

### JWT and CSRF

**Current implementation using JWT in Authorization header:**

JWT tokens in Authorization headers are **automatically protected** against CSRF attacks because:
1. Browsers don't automatically attach Authorization headers
2. Attacker websites can't access localStorage/sessionStorage
3. CORS policy prevents cross-origin requests

**This implementation is CSRF-proof:**
```typescript
// Client sends token in header
fetch('/api/auth/me', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
  },
});
```

### When CSRF Protection is Needed

**CSRF is a concern when:**
- Using cookies for authentication
- Using session-based authentication
- Accepting state-changing GET requests

### CSRF Protection Strategies

**If using cookies, implement CSRF tokens:**

```typescript
import csrf from 'csurf';

// Enable CSRF protection
const csrfProtection = csrf({ cookie: true });

app.use(csrfProtection);

// Send CSRF token to client
app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Verify CSRF token on protected routes
app.post('/api/protected', csrfProtection, (req, res) => {
  res.json({ success: true });
});
```

**Client-side:**
```typescript
// Get CSRF token
const response = await fetch('/api/csrf-token');
const { csrfToken } = await response.json();

// Include in requests
fetch('/api/protected', {
  method: 'POST',
  headers: {
    'X-CSRF-Token': csrfToken,
  },
  body: JSON.stringify(data),
});
```

### SameSite Cookie Attribute

**Additional protection layer:**
```typescript
res.cookie('token', value, {
  sameSite: 'strict',  // Best protection, may break some workflows
  // sameSite: 'lax',  // Good balance
  // sameSite: 'none',  // No protection (requires secure: true)
});
```

### Double Submit Cookie Pattern

**Alternative CSRF protection:**
```typescript
// Set CSRF token as cookie
res.cookie('XSRF-TOKEN', csrfToken, {
  httpOnly: false,  // Allow JavaScript access
  sameSite: 'strict',
});

// Verify token matches in request
app.use((req, res, next) => {
  const cookieToken = req.cookies['XSRF-TOKEN'];
  const headerToken = req.headers['x-xsrf-token'];

  if (cookieToken !== headerToken) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }

  next();
});
```

---

## 9. Rate Limiting Configuration

### Current Implementation

**Global rate limiter:**
```typescript
// server/index.ts
const limiter = rateLimit({
  windowMs: securityConfig.rateLimitWindowMs,  // 15 minutes
  max: securityConfig.rateLimitMaxRequests,    // 100 requests
  message: {
    success: false,
    error: 'Too many requests',
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
```

**Endpoint-specific rate limiters:**
```typescript
// server/middleware/rateLimiter.ts

// Login: 5 attempts per 15 minutes
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
});

// Registration: 3 attempts per hour
export const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  skipSuccessfulRequests: true,
});

// Password reset: 3 attempts per hour
export const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
});
```

### Rate Limit Configuration by Endpoint

| Endpoint | Window | Max Requests | Skip Successful | Rationale |
|----------|--------|--------------|-----------------|-----------|
| Login | 15 min | 5 | Yes | Prevent brute force |
| Register | 1 hour | 3 | Yes | Prevent spam accounts |
| Password Reset | 1 hour | 3 | No | Prevent abuse |
| Change Password | 15 min | 5 | Yes | Prevent brute force |
| Token Refresh | 15 min | 10 | Yes | Reasonable refresh rate |
| Profile Update | 15 min | 10 | Yes | Prevent spam updates |
| General Auth | 15 min | 20 | Yes | General protection |

### Environment Configuration

```bash
# .env
RATE_LIMIT_WINDOW_MS=900000      # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100      # Max requests per window
```

### Advanced Rate Limiting

**Redis-based rate limiting (for distributed systems):**
```typescript
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379'),
});

const limiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rate_limit:',
  }),
  windowMs: 15 * 60 * 1000,
  max: 100,
});
```

**User-specific rate limiting:**
```typescript
function keyGenerator(req: Request): string {
  // Rate limit by user ID if authenticated, else by IP
  if (req.user?.userId) {
    return `user:${req.user.userId}`;
  }
  return `ip:${getClientIp(req)}`;
}

const limiter = rateLimit({
  keyGenerator,
  windowMs: 15 * 60 * 1000,
  max: 100,
});
```

**Tiered rate limiting:**
```typescript
function getMaxRequests(req: Request): number {
  // Premium users get higher limits
  if (req.user?.subscriptionTier === 'premium') {
    return 1000;
  }
  if (req.user?.subscriptionTier === 'pro') {
    return 500;
  }
  return 100;  // Free tier
}

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: (req) => getMaxRequests(req),
});
```

### Rate Limit Response Headers

**Standard headers (included in current implementation):**
```
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 1634567890
```

**Legacy headers (disabled in current implementation):**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1634567890
```

### Monitoring Rate Limits

**Log rate limit hits:**
```typescript
async function logRateLimitHit(
  endpoint: string,
  ip: string,
  limitType: string,
  userId?: string
): Promise<void> {
  await query(
    `INSERT INTO rate_limit_logs (endpoint, ip_address, user_id, limit_type, hit_time)
     VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
    [endpoint, ip, userId || null, limitType]
  );
}
```

**Analyze rate limit patterns:**
```sql
-- Top offending IPs
SELECT ip_address, COUNT(*) as hit_count
FROM rate_limit_logs
WHERE hit_time > NOW() - INTERVAL '1 day'
GROUP BY ip_address
ORDER BY hit_count DESC
LIMIT 10;

-- Rate limit hits by endpoint
SELECT endpoint, COUNT(*) as hit_count
FROM rate_limit_logs
WHERE hit_time > NOW() - INTERVAL '1 day'
GROUP BY endpoint
ORDER BY hit_count DESC;
```

---

## 10. Input Validation

### Current Validation Implementation

**Field validation:**
```typescript
// server/middleware/validateRequest.ts
export function validateRequired(requiredFields: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const missingFields = requiredFields.filter((field) => {
      const value = req.body?.[field];
      return value === undefined || value === null || value === '';
    });

    if (missingFields.length > 0) {
      throw new ValidationError(
        `Missing required fields: ${missingFields.join(', ')}`
      );
    }

    next();
  };
}
```

### Validation Rules

**Email validation:**
```typescript
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
```

**Password validation:**
```typescript
export function validatePassword(password: string): { isValid: boolean; error?: string } {
  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters long' };
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one number' };
  }
  return { isValid: true };
}
```

**UUID validation:**
```typescript
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}
```

### Input Sanitization

**String sanitization:**
```typescript
export function sanitizeString(input: string): string {
  return input.trim().replace(/\s+/g, ' ');
}
```

**Length validation:**
```typescript
function validateLength(value: string, min: number, max: number): boolean {
  return value.length >= min && value.length <= max;
}

// Usage
if (!validateLength(name, 2, 100)) {
  throw new ValidationError('Name must be between 2 and 100 characters');
}
```

### Type Validation

**Using TypeScript for type safety:**
```typescript
interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export async function register(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const { email, password, name } = req.body as RegisterRequest;
  // TypeScript ensures correct types
}
```

**Runtime type validation with Zod:**
```typescript
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/),
  name: z.string().min(2).max(100),
});

export function validateRegistration() {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      registerSchema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Validation failed', {
          errors: error.errors,
        });
      }
      throw error;
    }
  };
}
```

### Validation Best Practices

**DO:**
- Validate all user input
- Validate on both client and server
- Use whitelist validation (allow known good, not block known bad)
- Normalize data before validation (trim, lowercase email, etc.)
- Provide clear error messages

**DO NOT:**
- Never trust client-side validation alone
- Never rely on frontend validation for security
- Don't accept overly large inputs
- Don't skip validation for "trusted" users

### Body Size Validation

**Current implementation:**
```typescript
// server/index.ts
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
```

**Custom size validation:**
```typescript
export function validateBodySize(maxSizeBytes: number = 1024 * 1024) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = req.headers['content-length'];

    if (contentLength && parseInt(contentLength) > maxSizeBytes) {
      throw new ValidationError('Request body too large');
    }

    next();
  };
}
```

---

## 11. Error Message Security

### Secure Error Handling

**Current implementation:**
```typescript
// server/middleware/errorHandler.ts
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log full error for debugging
  console.error('Error:', err);

  // Send safe error to client
  if (err instanceof ValidationError) {
    res.status(400).json({
      success: false,
      error: 'Validation error',
      message: err.message,
    });
  } else if (err instanceof AuthenticationError) {
    res.status(401).json({
      success: false,
      error: 'Authentication failed',
      message: err.message,
    });
  } else {
    // Generic error for unknown errors
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: serverConfig.isProduction
        ? 'An error occurred'
        : err.message,
    });
  }
}
```

### What NOT to Expose

**NEVER reveal in error messages:**
- Database structure or queries
- Stack traces (in production)
- File paths
- Internal system information
- User existence (during login)
- Password requirements before authentication

**BAD - Information leakage:**
```typescript
// NEVER DO THIS
res.status(500).json({
  error: 'Database error: SELECT * FROM users WHERE email = \'test@example.com\'',
  stack: err.stack,
  file: __filename,
});

// NEVER DO THIS - Reveals user existence
if (!user) {
  res.status(404).json({ error: 'User not found' });
} else if (!passwordMatch) {
  res.status(401).json({ error: 'Incorrect password' });
}
```

**GOOD - Generic errors:**
```typescript
// DO THIS - Generic message
res.status(500).json({
  success: false,
  error: 'Internal server error',
  message: 'An error occurred processing your request',
});

// DO THIS - Don't reveal user existence
if (!user || !passwordMatch) {
  res.status(401).json({
    success: false,
    error: 'Invalid credentials',
    message: 'Invalid email or password',
  });
}
```

### Login Error Messages

**Current implementation (SECURE):**
```typescript
// server/auth/controller.ts
export async function login(req: AuthRequest, res: Response): Promise<void> {
  const user = users[0];

  if (!user) {
    // Don't reveal whether user exists or not
    res.status(401).json({
      success: false,
      error: 'Invalid credentials',
      message: 'Invalid email or password',
    });
    return;
  }

  const isPasswordValid = await comparePassword(password, user.password_hash);

  if (!isPasswordValid) {
    // Same error message as above
    res.status(401).json({
      success: false,
      error: 'Invalid credentials',
      message: 'Invalid email or password',
    });
    return;
  }
}
```

### Error Logging

**Log detailed errors server-side:**
```typescript
// Full error logging (server-side only)
console.error('Authentication error:', {
  timestamp: new Date().toISOString(),
  ip: getClientIp(req),
  email: req.body.email,
  error: err.message,
  stack: err.stack,
});

// Send generic error to client
res.status(500).json({
  success: false,
  error: 'Internal server error',
  message: 'An error occurred',
});
```

**Structured logging with Winston:**
```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// Log errors
logger.error('Authentication failed', {
  ip: req.ip,
  email: req.body.email,
  error: err.message,
});
```

### Error Response Format

**Consistent error format:**
```typescript
interface ErrorResponse {
  success: false;
  error: string;      // Error type/category
  message: string;    // User-friendly message
  code?: string;      // Optional error code
  details?: any;      // Optional details (development only)
}

// Example
res.status(400).json({
  success: false,
  error: 'Validation error',
  message: 'Email is required',
  code: 'MISSING_EMAIL',
  details: serverConfig.isDevelopment ? { field: 'email' } : undefined,
});
```

---

## 12. Session Management

### JWT Token Storage

**Current implementation:**
```typescript
// Client-side (localStorage)
localStorage.setItem('accessToken', data.accessToken);
localStorage.setItem('refreshToken', data.refreshToken);
```

### Storage Options Comparison

| Storage | Security | Persistence | Accessibility | Best For |
|---------|----------|-------------|---------------|----------|
| localStorage | Medium | Permanent | JavaScript | SPAs, development |
| sessionStorage | Medium | Session only | JavaScript | Sensitive apps |
| Cookies (httpOnly) | High | Configurable | HTTP only | Production apps |
| Memory | Highest | Session only | JavaScript | High security |

### Secure Token Storage

**Option 1: localStorage (Current - Acceptable)**

**Pros:**
- Simple implementation
- Works with Authorization header
- CSRF-proof
- Works across tabs

**Cons:**
- Vulnerable to XSS attacks
- Accessible via JavaScript

**Mitigation:**
```typescript
// Only store tokens in localStorage if necessary
// Clear tokens on logout
function logout() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

// Clear tokens on security events
window.addEventListener('storage', (e) => {
  if (e.key === 'accessToken' && !e.newValue) {
    // Token was removed, log out
    window.location.href = '/login';
  }
});
```

**Option 2: httpOnly Cookies (Most Secure)**

**Backend:**
```typescript
export async function login(req: AuthRequest, res: Response): Promise<void> {
  const tokens = generateTokenPair(user);

  // Set refresh token in httpOnly cookie
  res.cookie('refreshToken', tokens.refreshToken, {
    httpOnly: true,      // Not accessible via JavaScript
    secure: true,        // HTTPS only
    sameSite: 'strict',  // CSRF protection
    maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days
  });

  // Send access token in response
  res.json({
    success: true,
    data: {
      user: sanitizeUser(user),
      accessToken: tokens.accessToken,
    },
  });
}
```

**Frontend:**
```typescript
// Access token still in memory or localStorage
let accessToken = '';

// Refresh token automatically sent via cookie
async function refreshToken() {
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    credentials: 'include',  // Include cookies
  });
  const { data } = await response.json();
  accessToken = data.accessToken;
}
```

**Option 3: In-Memory Storage (Highest Security)**

```typescript
// Store tokens in module-scope variable
let accessToken: string | null = null;
let refreshToken: string | null = null;

export function setTokens(access: string, refresh: string) {
  accessToken = access;
  refreshToken = refresh;
}

export function getAccessToken() {
  return accessToken;
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
}

// Tokens lost on page refresh - must re-authenticate
```

### Token Refresh Strategy

**Automatic token refresh:**
```typescript
// Refresh 1 minute before expiry
const REFRESH_THRESHOLD = 60 * 1000;

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  let token = localStorage.getItem('accessToken');

  // Check if token needs refresh
  if (token) {
    const decoded = jwtDecode(token);
    const expiresIn = decoded.exp * 1000 - Date.now();

    if (expiresIn < REFRESH_THRESHOLD) {
      token = await refreshAccessToken();
    }
  }

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    },
  });
}
```

### Session Timeout

**Implement inactivity timeout:**
```typescript
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
let inactivityTimer: NodeJS.Timeout;

function resetInactivityTimer() {
  clearTimeout(inactivityTimer);

  inactivityTimer = setTimeout(() => {
    // Log out user due to inactivity
    logout();
    window.location.href = '/login?reason=inactivity';
  }, INACTIVITY_TIMEOUT);
}

// Reset timer on user activity
document.addEventListener('click', resetInactivityTimer);
document.addEventListener('keypress', resetInactivityTimer);
document.addEventListener('scroll', resetInactivityTimer);

// Start timer
resetInactivityTimer();
```

### Concurrent Session Management

**Track active sessions in database:**
```sql
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  token_hash VARCHAR(64) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token_hash ON user_sessions(token_hash);
```

**Limit concurrent sessions:**
```typescript
async function createSession(userId: string, token: string, req: Request) {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  // Limit to 5 concurrent sessions per user
  const sessions = await query(
    'SELECT COUNT(*) as count FROM user_sessions WHERE user_id = $1 AND expires_at > CURRENT_TIMESTAMP',
    [userId]
  );

  if (sessions[0].count >= 5) {
    // Remove oldest session
    await query(
      'DELETE FROM user_sessions WHERE id IN (SELECT id FROM user_sessions WHERE user_id = $1 ORDER BY created_at ASC LIMIT 1)',
      [userId]
    );
  }

  // Create new session
  await query(
    `INSERT INTO user_sessions (user_id, token_hash, ip_address, user_agent, expires_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, tokenHash, getClientIp(req), req.headers['user-agent'], expiresAt]
  );
}
```

---

## 13. Production Security Checklist

### Pre-Deployment Checklist

#### Environment Configuration

- [ ] All environment variables are set correctly
- [ ] JWT secrets are strong and unique (min 32 characters)
  ```bash
  openssl rand -base64 32
  ```
- [ ] Database password is strong and not default
- [ ] `NODE_ENV=production` is set
- [ ] CORS origins are explicitly defined (no wildcards)
- [ ] HTTPS is enforced
- [ ] Database connections use SSL/TLS
- [ ] All default credentials have been changed

#### Security Headers

- [ ] HSTS header is enabled with appropriate max-age
- [ ] X-Content-Type-Options: nosniff
- [ ] X-Frame-Options: DENY
- [ ] X-XSS-Protection: 1; mode=block
- [ ] Content-Security-Policy is configured
- [ ] Referrer-Policy is set

**Verify headers:**
```bash
curl -I https://api.yourdomain.com/health
```

#### Authentication & Authorization

- [ ] Password hashing uses bcrypt with 10+ rounds
- [ ] JWT tokens have appropriate expiration times
- [ ] Access tokens: 15 minutes
- [ ] Refresh tokens: 7 days
- [ ] Refresh token rotation is implemented
- [ ] Failed login attempts are rate-limited
- [ ] Account lockout after repeated failures
- [ ] Password reset tokens expire after 1 hour
- [ ] Password reset tokens are single-use

#### Rate Limiting

- [ ] Global rate limiting is enabled
- [ ] Login endpoint: 5 attempts per 15 minutes
- [ ] Registration endpoint: 3 attempts per hour
- [ ] Password reset: 3 attempts per hour
- [ ] Rate limit logs are monitored
- [ ] Rate limiting uses Redis for distributed systems

#### Input Validation

- [ ] All user inputs are validated
- [ ] SQL injection protection (parameterized queries)
- [ ] XSS protection (input sanitization)
- [ ] Email format validation
- [ ] Password strength validation
- [ ] File upload validation (if applicable)
- [ ] Request body size limits (10MB max)

#### Database Security

- [ ] Database uses separate user account (not postgres/root)
- [ ] Database user has minimal required permissions
- [ ] Database connections use SSL in production
- [ ] Database backups are configured and tested
- [ ] Database is not publicly accessible
- [ ] Connection pool limits are configured

**Check database security:**
```sql
-- Verify SSL connection
SELECT * FROM pg_stat_ssl;

-- Check user permissions
\du app_user
```

#### Logging & Monitoring

- [ ] Error logging is configured
- [ ] Sensitive data is not logged (passwords, tokens)
- [ ] Rate limit violations are logged
- [ ] Failed authentication attempts are logged
- [ ] Log rotation is configured
- [ ] Logs are sent to centralized logging system
- [ ] Alerts are set up for security events

#### Dependencies

- [ ] All npm packages are up to date
  ```bash
  npm audit
  npm outdated
  ```
- [ ] No critical vulnerabilities in dependencies
- [ ] Renovate/Dependabot is configured for updates
- [ ] Lock file (pnpm-lock.yaml) is committed

#### Code Security

- [ ] No secrets in source code
- [ ] No secrets in git history
- [ ] `.env` file is in `.gitignore`
- [ ] Error messages don't leak sensitive info
- [ ] Stack traces are hidden in production
- [ ] Debug mode is disabled in production

#### Infrastructure

- [ ] Server OS is up to date
- [ ] Firewall is configured
- [ ] Only necessary ports are open (443, 80, 22)
- [ ] SSH is secured (key-based, no root login)
- [ ] Reverse proxy is configured (nginx/Caddy)
- [ ] CDN is configured for static assets
- [ ] DDoS protection is enabled

#### SSL/TLS

- [ ] SSL certificate is valid and not expired
- [ ] Certificate is from trusted CA (Let's Encrypt)
- [ ] TLS 1.2+ is enforced
- [ ] Weak ciphers are disabled
- [ ] Certificate chain is complete
- [ ] HTTP redirects to HTTPS
- [ ] HSTS is enabled

**Test SSL configuration:**
```bash
# Check certificate
openssl s_client -connect api.yourdomain.com:443 -servername api.yourdomain.com

# Test with SSL Labs
# Visit: https://www.ssllabs.com/ssltest/
```

#### Backup & Recovery

- [ ] Database backups are automated
- [ ] Backup restoration has been tested
- [ ] Backups are encrypted
- [ ] Backups are stored off-site
- [ ] Disaster recovery plan is documented
- [ ] RTO (Recovery Time Objective) is defined
- [ ] RPO (Recovery Point Objective) is defined

### Post-Deployment Verification

#### Security Testing

- [ ] Penetration testing completed
- [ ] OWASP Top 10 vulnerabilities addressed
- [ ] SQL injection testing passed
- [ ] XSS testing passed
- [ ] CSRF testing passed
- [ ] Authentication bypass testing passed
- [ ] Authorization testing passed

**Run security scans:**
```bash
# OWASP ZAP
zap-cli quick-scan https://api.yourdomain.com

# SQLMap
sqlmap -u "https://api.yourdomain.com/api/endpoint"

# NPM audit
npm audit --production
```

#### Performance Testing

- [ ] Load testing completed
- [ ] Rate limiting under load tested
- [ ] Database connection pool tested
- [ ] Response times acceptable
- [ ] Memory leaks checked

#### Monitoring Setup

- [ ] Health check endpoint monitored
- [ ] Uptime monitoring configured
- [ ] Error rate alerts configured
- [ ] Performance metrics tracked
- [ ] Security events monitored

**Example monitoring checks:**
```bash
# Health check
curl https://api.yourdomain.com/health

# Response time
time curl https://api.yourdomain.com/api

# SSL expiry
echo | openssl s_client -servername api.yourdomain.com -connect api.yourdomain.com:443 2>/dev/null | openssl x509 -noout -dates
```

### Ongoing Security Maintenance

#### Weekly Tasks

- [ ] Review access logs for suspicious activity
- [ ] Check rate limit logs
- [ ] Review error logs
- [ ] Monitor failed login attempts

#### Monthly Tasks

- [ ] Update npm dependencies
- [ ] Review and update security policies
- [ ] Test backup restoration
- [ ] Review user access levels
- [ ] Check SSL certificate expiry (30 days before)

#### Quarterly Tasks

- [ ] Security audit
- [ ] Penetration testing
- [ ] Rotate JWT secrets
- [ ] Review and update documentation
- [ ] Security training for team

#### Annual Tasks

- [ ] Comprehensive security assessment
- [ ] Disaster recovery drill
- [ ] Update incident response plan
- [ ] Third-party security audit

### Incident Response

**If a security incident occurs:**

1. **Immediate Actions**
   - [ ] Isolate affected systems
   - [ ] Preserve evidence (logs, backups)
   - [ ] Notify security team
   - [ ] Document incident timeline

2. **Investigation**
   - [ ] Identify attack vector
   - [ ] Determine data accessed
   - [ ] Assess impact
   - [ ] Identify vulnerabilities exploited

3. **Containment**
   - [ ] Patch vulnerabilities
   - [ ] Rotate compromised credentials
   - [ ] Invalidate compromised tokens
   - [ ] Update firewall rules

4. **Recovery**
   - [ ] Restore from clean backups
   - [ ] Verify system integrity
   - [ ] Monitor for continued attacks
   - [ ] Resume normal operations

5. **Post-Incident**
   - [ ] Document lessons learned
   - [ ] Update security procedures
   - [ ] Notify affected users (if required)
   - [ ] Report to authorities (if required)

### Security Tools

**Recommended tools:**

- **Dependency scanning:** `npm audit`, Snyk, Dependabot
- **Code scanning:** SonarQube, CodeQL
- **Secret scanning:** GitGuardian, TruffleHog
- **Penetration testing:** OWASP ZAP, Burp Suite
- **SSL testing:** SSL Labs, testssl.sh
- **Monitoring:** Sentry, LogRocket, Datadog
- **WAF:** Cloudflare, AWS WAF, ModSecurity

### Quick Security Audit Script

```bash
#!/bin/bash
# security-audit.sh

echo "=== Security Audit ==="

echo "1. Checking for secrets in code..."
grep -r "password\|secret\|api_key" --exclude-dir=node_modules --exclude-dir=.git .

echo "2. Checking npm vulnerabilities..."
npm audit --production

echo "3. Checking for outdated packages..."
npm outdated

echo "4. Checking SSL certificate..."
echo | openssl s_client -servername api.yourdomain.com -connect api.yourdomain.com:443 2>/dev/null | openssl x509 -noout -dates

echo "5. Checking security headers..."
curl -I https://api.yourdomain.com/health | grep -E "Strict-Transport-Security|X-Content-Type-Options|X-Frame-Options|X-XSS-Protection"

echo "6. Testing rate limiting..."
for i in {1..10}; do curl -w "%{http_code}\n" -o /dev/null -s https://api.yourdomain.com/api/auth/login -X POST; done

echo "=== Audit Complete ==="
```

---

## Summary

### Critical Security Priorities

1. **Always use HTTPS in production**
2. **Use strong, unique JWT secrets**
3. **Implement rate limiting on authentication endpoints**
4. **Use parameterized queries to prevent SQL injection**
5. **Validate all user input**
6. **Don't leak sensitive information in error messages**
7. **Keep dependencies up to date**
8. **Monitor and log security events**

### Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

### Contact

For security concerns or to report vulnerabilities:
- Create a private security advisory on GitHub
- Email: security@yourdomain.com

---

**Last Updated:** 2025-10-26
**Version:** 1.0.0
