# Rate Limiting Implementation Guide

## Overview

This document describes the comprehensive rate limiting implementation for authentication endpoints to prevent brute force attacks, credential stuffing, and other malicious activities.

## Features Implemented

### 1. IP-Based Rate Limiting
- **Login Endpoint**: 5 attempts per 15 minutes per IP
- **Registration Endpoint**: 3 attempts per hour per IP
- **Password Reset**: 3 attempts per hour per IP
- **Change Password**: 5 attempts per 15 minutes per IP
- **Token Refresh**: 10 attempts per 15 minutes per IP
- **Profile Update**: 10 attempts per 15 minutes per IP
- **General Auth**: 20 attempts per 15 minutes per IP

### 2. User-Specific Account Lockout
- Tracks failed login attempts per user
- Automatic account lockout after 5 failed attempts (configurable)
- 30-minute lockout duration (configurable)
- Clears failed attempts on successful login
- Automatic cleanup of old records

### 3. Database Tracking
- Failed login attempts with IP tracking
- Account lockout history
- Rate limit hit logging (optional)
- Automatic cleanup functions

## Files Created

### Core Files

1. **`/home/adam/grocery/server/middleware/rateLimiter.ts`**
   - Comprehensive rate limiting middleware
   - IP extraction utilities
   - Logging functionality
   - User-friendly error responses

2. **`/home/adam/grocery/server/middleware/failedLoginTracker.ts`**
   - Failed login tracking
   - Account lockout logic
   - Cleanup utilities
   - Admin functions

3. **`/home/adam/grocery/server/config/rateLimitConfig.ts`**
   - Centralized configuration
   - Environment variable support
   - Configurable limits and windows

4. **`/home/adam/grocery/server/db/rate_limit_schema.sql`**
   - Database schema for tracking
   - Indexes for performance
   - Cleanup functions

## Database Setup

### 1. Run the Schema Migration

```bash
# Ensure your database is running
pnpm db:up

# Run the rate limiting schema
psql -h localhost -U grocery -d grocery_db -f server/db/rate_limit_schema.sql
```

This creates three tables:
- `failed_login_attempts` - Tracks failed login attempts
- `account_lockouts` - Tracks account lockouts
- `rate_limit_logs` - Logs rate limit hits (optional)

### 2. Schema Details

#### failed_login_attempts
```sql
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key to users)
- email: VARCHAR(255)
- ip_address: VARCHAR(45)
- attempt_time: TIMESTAMP
```

#### account_lockouts
```sql
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key to users)
- email: VARCHAR(255)
- locked_at: TIMESTAMP
- unlock_at: TIMESTAMP
- reason: VARCHAR(255)
- is_active: BOOLEAN
```

#### rate_limit_logs
```sql
- id: UUID (Primary Key)
- endpoint: VARCHAR(255)
- ip_address: VARCHAR(45)
- user_id: UUID (Foreign Key to users)
- hit_time: TIMESTAMP
- limit_type: VARCHAR(50)
```

## Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# Rate Limiting Configuration
MAX_LOGIN_ATTEMPTS=5
LOGIN_ATTEMPT_WINDOW_MINUTES=15
LOCKOUT_DURATION_MINUTES=30
CLEANUP_INTERVAL_HOURS=24

# Optional: Rate limit logging
LOG_RATE_LIMITS=false

# Optional: If behind a proxy/load balancer
TRUST_PROXY=true

# Optional: Redis for distributed rate limiting (not yet implemented)
RATE_LIMIT_STORE=memory
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

### Rate Limit Configuration

Edit `/home/adam/grocery/server/config/rateLimitConfig.ts` to customize limits:

```typescript
export const rateLimitConfigs = {
  login: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts
    // ... other options
  },
  register: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 attempts
    // ... other options
  },
  // ... other endpoints
};
```

## Integration

### Current Integration Status

The rate limiting has been integrated into the following routes:

1. **POST /api/auth/register** - Uses `registerRateLimiter`
2. **POST /api/auth/login** - Uses `loginRateLimiter` + `checkAccountLockout`
3. **POST /api/auth/refresh** - Uses `tokenRefreshRateLimiter`
4. **POST /api/auth/logout** - Uses `generalAuthRateLimiter`
5. **POST /api/auth/forgot-password** - Uses `passwordResetRateLimiter`
6. **POST /api/auth/reset-password** - Uses `passwordResetRateLimiter`
7. **PATCH /api/auth/profile** - Uses `profileUpdateRateLimiter`
8. **POST /api/auth/change-password** - Uses `changePasswordRateLimiter`

### Login Flow

1. Request hits `loginRateLimiter` (IP-based)
2. `checkAccountLockout` middleware checks if account is locked
3. If locked, returns 423 (Locked) with unlock time
4. Login controller processes authentication
5. On failure: Records attempt, checks if lockout threshold reached
6. On success: Clears failed attempts

## Usage Examples

### Successful Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "ValidPassword123"}'
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

### Rate Limited (Too Many Requests)
After 5 login attempts in 15 minutes:

Response (429 Too Many Requests):
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "message": "Too many login attempts from this IP. Please try again in 15 minutes.",
  "retryAfter": "See Retry-After header for wait time"
}
```

Headers:
```
RateLimit-Limit: 5
RateLimit-Remaining: 0
RateLimit-Reset: 1234567890
Retry-After: 900
```

### Account Locked
After 5 failed login attempts:

Response (423 Locked):
```json
{
  "success": false,
  "error": "Account locked",
  "message": "Account temporarily locked due to too many failed login attempts. Please try again in 28 minute(s).",
  "unlockAt": "2025-10-26T12:00:00.000Z",
  "remainingMinutes": 28
}
```

## Security Best Practices

### 1. IP Extraction
- Handles various proxy configurations
- Checks multiple headers (x-forwarded-for, x-real-ip, cf-connecting-ip)
- Falls back to socket remote address

### 2. Error Messages
- Generic messages to prevent user enumeration
- Same message for "user not found" and "wrong password"
- Doesn't reveal whether email exists

### 3. Failed Attempt Tracking
- Tracks attempts even for non-existent users
- Prevents attackers from discovering valid emails
- IP-based tracking as additional layer

### 4. Cleanup
- Automatic cleanup of old records
- Configurable cleanup intervals
- Database functions for maintenance

### 5. Logging
- Optional database logging of rate limit hits
- Console logging in development
- Monitoring-friendly format

## Admin Functions

### Check Account Status
```typescript
import { isAccountLocked } from '../middleware/failedLoginTracker';

const status = await isAccountLocked('user@example.com');
console.log(status);
// { locked: true, unlockAt: Date, remainingMinutes: 25 }
```

### Manually Unlock Account
```typescript
import { unlockAccount } from '../middleware/failedLoginTracker';

await unlockAccount('user@example.com');
```

### Get Lockout Statistics
```typescript
import { getLockoutStats } from '../middleware/failedLoginTracker';

const stats = await getLockoutStats();
console.log(stats);
// {
//   totalLockouts: 150,
//   activeLockouts: 5,
//   recentAttempts24h: 1234
// }
```

### Get Failed Login History
```typescript
import { getFailedLoginHistory } from '../middleware/failedLoginTracker';

const history = await getFailedLoginHistory('user@example.com', 10);
console.log(history);
```

## Maintenance

### Cleanup Old Records

The schema includes automatic cleanup functions. To run manually:

```sql
-- Clean up failed attempts older than 24 hours
SELECT cleanup_old_failed_attempts();

-- Clean up expired lockouts
SELECT cleanup_expired_lockouts();

-- Clean up rate limit logs older than 30 days
SELECT cleanup_old_rate_limit_logs();
```

### Schedule Cleanup (Optional)

If using `pg_cron` extension:

```sql
-- Install pg_cron extension first
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule cleanup jobs
SELECT cron.schedule('cleanup-failed-attempts', '0 */6 * * *',
  'SELECT cleanup_old_failed_attempts()');

SELECT cron.schedule('cleanup-expired-lockouts', '*/15 * * * *',
  'SELECT cleanup_expired_lockouts()');

SELECT cron.schedule('cleanup-rate-logs', '0 2 * * *',
  'SELECT cleanup_old_rate_limit_logs()');
```

## Monitoring

### Key Metrics to Monitor

1. **Rate Limit Hits**
   - Count of rate limit exceeded responses
   - By endpoint and IP
   - Trend over time

2. **Account Lockouts**
   - Number of active lockouts
   - Lockout frequency
   - Most targeted accounts

3. **Failed Login Attempts**
   - Total attempts in last 24 hours
   - By IP address
   - Geographic distribution

### Query Examples

```sql
-- Rate limits hit in last hour
SELECT COUNT(*) FROM rate_limit_logs
WHERE hit_time > NOW() - INTERVAL '1 hour';

-- Top IPs with failed attempts
SELECT ip_address, COUNT(*) as attempts
FROM failed_login_attempts
WHERE attempt_time > NOW() - INTERVAL '24 hours'
GROUP BY ip_address
ORDER BY attempts DESC
LIMIT 10;

-- Active lockouts
SELECT email, locked_at, unlock_at, reason
FROM account_lockouts
WHERE is_active = TRUE
ORDER BY locked_at DESC;
```

## Production Considerations

### 1. Distributed Systems
For multi-server deployments, consider using Redis for rate limiting:
- Install `rate-limit-redis` package
- Configure Redis connection in config
- Update store configuration

### 2. Load Balancers
If behind a load balancer:
- Set `TRUST_PROXY=true`
- Configure load balancer to pass client IP headers
- Verify IP extraction is working correctly

### 3. Performance
- Database indexes are included in schema
- Rate limiting uses in-memory store by default
- Consider Redis for better performance at scale

### 4. Monitoring
- Enable rate limit logging for security monitoring
- Set up alerts for unusual patterns
- Monitor cleanup job execution

### 5. Testing
Test rate limiting in staging:
```bash
# Test login rate limiting
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email": "test@example.com", "password": "wrong"}' \
    -w "\nStatus: %{http_code}\n\n"
done
```

## Troubleshooting

### Rate Limiting Not Working
1. Check if middleware is properly imported
2. Verify route order (rate limiter before controller)
3. Check environment variables
4. Verify IP extraction is working

### Account Lockout Not Triggering
1. Check database schema is applied
2. Verify failed login tracking is called
3. Check configuration values
4. Review console logs for errors

### IP Address Always "Unknown"
1. Set `TRUST_PROXY=true` if behind proxy
2. Check proxy/load balancer headers
3. Review `getClientIp` function
4. Test with direct connection

### Cleanup Not Running
1. Verify cleanup functions exist in database
2. Check pg_cron installation (if using)
3. Manually run cleanup functions
4. Review database permissions

## Future Enhancements

Potential improvements for future versions:

1. **CAPTCHA Integration**
   - Add CAPTCHA after N failed attempts
   - Reduces automated attacks

2. **Geolocation Tracking**
   - Track login attempts by country
   - Alert on suspicious locations

3. **Device Fingerprinting**
   - Track devices used for login
   - Alert on new device logins

4. **Email Notifications**
   - Notify users of lockouts
   - Alert on suspicious activity

5. **Admin Dashboard**
   - View lockout statistics
   - Manage locked accounts
   - Monitor rate limit hits

6. **Adaptive Rate Limiting**
   - Adjust limits based on user behavior
   - Whitelist trusted IPs
   - Stricter limits for suspicious patterns

## Support

For questions or issues:
- Review this documentation
- Check console logs for errors
- Verify database schema is applied
- Test rate limiting endpoints

## Security Notes

- Never disable rate limiting in production
- Regularly review lockout statistics
- Monitor for unusual patterns
- Keep cleanup jobs running
- Update configuration as needed
- Test after any changes

## License

Part of the Grocery List application.
