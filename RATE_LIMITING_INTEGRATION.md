# Rate Limiting - Quick Integration Guide

## Quick Start

### Step 1: Apply Database Schema

```bash
# Start your database
pnpm db:up

# Apply the rate limiting schema
psql -h localhost -U grocery -d grocery_db -f server/db/rate_limit_schema.sql
```

Expected output:
```
CREATE TABLE
CREATE INDEX
CREATE INDEX
...
CREATE FUNCTION
```

### Step 2: Configure Environment Variables (Optional)

Add to `.env` file if you want to customize defaults:

```bash
# Optional: Customize rate limiting
MAX_LOGIN_ATTEMPTS=5              # Default: 5
LOGIN_ATTEMPT_WINDOW_MINUTES=15   # Default: 15
LOCKOUT_DURATION_MINUTES=30       # Default: 30
CLEANUP_INTERVAL_HOURS=24         # Default: 24

# Optional: Enable rate limit logging to database
LOG_RATE_LIMITS=false             # Default: false

# Optional: If behind proxy/load balancer
TRUST_PROXY=true                  # Default: false
```

### Step 3: Restart Server

The rate limiting is already integrated into the auth routes. Simply restart your server:

```bash
pnpm server:dev
```

### Step 4: Verify It Works

Test the rate limiting:

```bash
# Try multiple failed logins (should get locked after 5 attempts)
for i in {1..6}; do
  echo "Attempt $i:"
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email": "test@example.com", "password": "wrongpassword"}' \
    -w "\nHTTP Status: %{http_code}\n\n"
  sleep 1
done
```

Expected behavior:
- Attempts 1-5: 401 Unauthorized (Invalid credentials)
- Attempt 6: 423 Locked (Account temporarily locked)

## Files Modified

### Existing Files Updated
1. `/home/adam/grocery/server/auth/controller.ts` - Added failed login tracking
2. `/home/adam/grocery/server/auth/routes.ts` - Integrated new rate limiters

### New Files Created
1. `/home/adam/grocery/server/middleware/rateLimiter.ts` - Rate limiting middleware
2. `/home/adam/grocery/server/middleware/failedLoginTracker.ts` - Failed login tracking
3. `/home/adam/grocery/server/config/rateLimitConfig.ts` - Configuration
4. `/home/adam/grocery/server/db/rate_limit_schema.sql` - Database schema

## Current Rate Limits

### Authentication Endpoints

| Endpoint | Limit | Window | Purpose |
|----------|-------|--------|---------|
| POST /api/auth/login | 5 requests | 15 min | Prevent brute force |
| POST /api/auth/register | 3 requests | 1 hour | Prevent spam accounts |
| POST /api/auth/forgot-password | 3 requests | 1 hour | Prevent abuse |
| POST /api/auth/reset-password | 3 requests | 1 hour | Prevent token guessing |
| POST /api/auth/change-password | 5 requests | 15 min | Prevent brute force |
| POST /api/auth/refresh | 10 requests | 15 min | Moderate limit |
| PATCH /api/auth/profile | 10 requests | 15 min | Moderate limit |
| POST /api/auth/logout | 20 requests | 15 min | Lenient limit |

### Account Lockout

| Trigger | Duration | Notes |
|---------|----------|-------|
| 5 failed login attempts | 30 minutes | Configurable via env vars |
| Within 15-minute window | Auto-unlock | Clears on successful login |

## Response Examples

### Rate Limited (429 Too Many Requests)

```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "message": "Too many login attempts from this IP. Please try again in 15 minutes.",
  "retryAfter": "See Retry-After header for wait time"
}
```

Response headers:
```
RateLimit-Limit: 5
RateLimit-Remaining: 0
RateLimit-Reset: 1730000000
Retry-After: 900
```

### Account Locked (423 Locked)

```json
{
  "success": false,
  "error": "Account locked",
  "message": "Account temporarily locked due to too many failed login attempts. Please try again in 28 minute(s).",
  "unlockAt": "2025-10-26T12:00:00.000Z",
  "remainingMinutes": 28
}
```

## Admin Functions

### Unlock Account Manually

```typescript
import { unlockAccount } from './server/middleware/failedLoginTracker';

// Unlock a user's account
await unlockAccount('user@example.com');
```

### Check If Account Is Locked

```typescript
import { isAccountLocked } from './server/middleware/failedLoginTracker';

const status = await isAccountLocked('user@example.com');
console.log(status);
// { locked: false } or { locked: true, unlockAt: Date, remainingMinutes: 25 }
```

### Get Lockout Statistics

```typescript
import { getLockoutStats } from './server/middleware/failedLoginTracker';

const stats = await getLockoutStats();
console.log(stats);
// {
//   totalLockouts: 150,
//   activeLockouts: 5,
//   recentAttempts24h: 1234
// }
```

### View Failed Login History

```typescript
import { getFailedLoginHistory } from './server/middleware/failedLoginTracker';

const history = await getFailedLoginHistory('user@example.com', 10);
console.log(history);
```

## Database Queries

### View Active Lockouts

```sql
SELECT email, locked_at, unlock_at, reason,
       EXTRACT(MINUTE FROM (unlock_at - NOW())) as minutes_remaining
FROM account_lockouts
WHERE is_active = TRUE
ORDER BY locked_at DESC;
```

### View Recent Failed Attempts

```sql
SELECT email, ip_address, attempt_time
FROM failed_login_attempts
WHERE attempt_time > NOW() - INTERVAL '24 hours'
ORDER BY attempt_time DESC
LIMIT 50;
```

### Most Targeted Accounts

```sql
SELECT email, COUNT(*) as failed_attempts
FROM failed_login_attempts
WHERE attempt_time > NOW() - INTERVAL '24 hours'
GROUP BY email
ORDER BY failed_attempts DESC
LIMIT 10;
```

### Suspicious IPs

```sql
SELECT ip_address,
       COUNT(DISTINCT email) as targeted_accounts,
       COUNT(*) as total_attempts
FROM failed_login_attempts
WHERE attempt_time > NOW() - INTERVAL '24 hours'
GROUP BY ip_address
HAVING COUNT(DISTINCT email) > 5
ORDER BY total_attempts DESC;
```

## Maintenance

### Manual Cleanup

Run these SQL commands periodically:

```sql
-- Clean up old failed attempts (older than 24 hours)
SELECT cleanup_old_failed_attempts();

-- Clean up expired lockouts
SELECT cleanup_expired_lockouts();

-- Clean up old rate limit logs (older than 30 days)
SELECT cleanup_old_rate_limit_logs();
```

### Schedule Automatic Cleanup (Optional)

If you have `pg_cron` installed:

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule('cleanup-failed-attempts', '0 */6 * * *',
  'SELECT cleanup_old_failed_attempts()');

SELECT cron.schedule('cleanup-expired-lockouts', '*/15 * * * *',
  'SELECT cleanup_expired_lockouts()');
```

## Customization

### Adjust Rate Limits

Edit `/home/adam/grocery/server/config/rateLimitConfig.ts`:

```typescript
export const rateLimitConfigs = {
  login: {
    windowMs: 15 * 60 * 1000,  // Change window
    max: 5,                     // Change max attempts
    message: 'Custom message',  // Change message
    // ...
  },
};
```

### Adjust Account Lockout

Edit environment variables in `.env`:

```bash
MAX_LOGIN_ATTEMPTS=10           # Allow more attempts
LOGIN_ATTEMPT_WINDOW_MINUTES=30 # Longer window
LOCKOUT_DURATION_MINUTES=60     # Longer lockout
```

### Add Rate Limiting to New Endpoints

```typescript
import { generalAuthRateLimiter } from '../middleware/rateLimiter';

router.post('/new-endpoint',
  generalAuthRateLimiter,  // Add rate limiter
  yourController
);
```

## Testing

### Test Rate Limiting

```bash
# Test login rate limit (should fail after 5 attempts)
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email": "test@example.com", "password": "wrong"}' \
    -i
done
```

### Test Account Lockout

```bash
# Test account lockout (should lock after 5 failed attempts)
for i in {1..7}; do
  echo "Attempt $i:"
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email": "user@example.com", "password": "wrongpassword"}'
  echo -e "\n"
done
```

### Test Registration Rate Limit

```bash
# Should fail after 3 attempts in 1 hour
for i in {1..4}; do
  curl -X POST http://localhost:3000/api/auth/register \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"test$i@example.com\", \"password\": \"Test123\", \"name\": \"Test\"}"
  echo -e "\n"
done
```

## Production Checklist

- [ ] Database schema applied
- [ ] Environment variables configured
- [ ] Rate limiting tested
- [ ] Account lockout tested
- [ ] Cleanup jobs scheduled (optional)
- [ ] Monitoring set up
- [ ] Documentation reviewed
- [ ] Behind proxy: TRUST_PROXY=true set
- [ ] Security headers verified
- [ ] Error messages don't reveal user existence

## Troubleshooting

### Rate Limiting Not Working
- Check middleware is imported in routes
- Verify route order (rate limiter before controller)
- Check console for errors
- Test with curl to rule out browser caching

### Account Lockout Not Working
- Verify database schema is applied
- Check if failed login tracking is being called
- Review console logs
- Query database to see if attempts are recorded

### IP Address Issues
- If behind proxy: set TRUST_PROXY=true
- Check headers: x-forwarded-for, x-real-ip
- Test with direct connection (not through proxy)
- Review getClientIp function logs

## Support

For detailed documentation, see:
- `/home/adam/grocery/RATE_LIMITING_DOCUMENTATION.md`

For issues:
1. Check console logs
2. Verify database schema
3. Test with curl
4. Review environment variables
5. Check proxy configuration
