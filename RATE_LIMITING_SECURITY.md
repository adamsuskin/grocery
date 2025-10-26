# Rate Limiting Security Best Practices

## Security Features Implemented

### 1. Multi-Layer Protection

#### Layer 1: IP-Based Rate Limiting
- **Purpose**: Prevent automated attacks from single IP
- **Implementation**: express-rate-limit middleware
- **Scope**: Per endpoint, per IP address
- **Response**: HTTP 429 with retry-after header

#### Layer 2: User-Specific Tracking
- **Purpose**: Prevent targeted attacks on specific accounts
- **Implementation**: Database-backed failed attempt tracking
- **Scope**: Per user account
- **Response**: HTTP 423 (Locked) with unlock time

#### Layer 3: Request Validation
- **Purpose**: Reject malformed requests early
- **Implementation**: express-validator
- **Scope**: All authentication endpoints
- **Response**: HTTP 400 with validation errors

### 2. Anti-Enumeration Measures

#### Generic Error Messages
```typescript
// Don't reveal if user exists
if (!user) {
  return res.status(401).json({
    error: 'Invalid credentials',
    message: 'Invalid email or password', // Same message as wrong password
  });
}
```

#### Track Non-Existent Users
```typescript
// Record attempts even for non-existent users
if (!user) {
  await handleFailedLogin(email, null, req);
  // Prevents discovering valid emails
}
```

#### Consistent Response Times
- Failed attempts tracked regardless of user existence
- Similar processing time for valid/invalid emails
- Prevents timing attacks

### 3. IP Address Handling

#### Multi-Header Support
```typescript
// Checks multiple headers in order
const headers = [
  'x-forwarded-for',     // Standard proxy header
  'x-real-ip',           // Nginx
  'cf-connecting-ip',    // Cloudflare
  'x-client-ip',         // Other proxies
];
```

#### IPv6 Support
- Database field supports both IPv4 and IPv6
- VARCHAR(45) accommodates longest IPv6 format
- Proper indexing for performance

#### Proxy Handling
```typescript
// Extracts first IP from x-forwarded-for
const forwarded = req.headers['x-forwarded-for'];
const ips = forwarded.split(',');
return ips[0].trim(); // Client IP, not proxy
```

### 4. Token Security

#### Password Reset Tokens
```typescript
// Generate cryptographically secure token
const resetToken = crypto.randomBytes(32).toString('hex');

// Store hashed version only
const resetTokenHash = crypto
  .createHash('sha256')
  .update(resetToken)
  .digest('hex');

// Send unhashed token in email
// Store hashed token in database
```

#### Token Expiration
```typescript
// 1 hour expiration
const expiresAt = new Date();
expiresAt.setHours(expiresAt.getHours() + 1);

// Verify expiration on use
WHERE reset_token = $1 AND reset_token_expires > NOW()
```

### 5. Database Security

#### SQL Injection Prevention
```typescript
// Always use parameterized queries
await query(
  'SELECT * FROM users WHERE email = $1',
  [email.toLowerCase()] // Parameterized
);

// Never concatenate user input
// ❌ BAD: `SELECT * FROM users WHERE email = '${email}'`
```

#### Proper Indexing
```sql
-- Indexes for performance
CREATE INDEX idx_failed_login_email ON failed_login_attempts(email);
CREATE INDEX idx_failed_login_ip ON failed_login_attempts(ip_address);
CREATE INDEX idx_lockout_unlock_at ON account_lockouts(unlock_at);

-- Prevents slow queries during attacks
```

#### Automatic Cleanup
```sql
-- Cleanup functions prevent table bloat
CREATE OR REPLACE FUNCTION cleanup_old_failed_attempts()
RETURNS void AS $$
BEGIN
  DELETE FROM failed_login_attempts
  WHERE attempt_time < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;
```

## Attack Mitigation

### 1. Brute Force Attacks

#### Mitigation Strategy
1. **IP Rate Limiting**: Max 5 login attempts per 15 minutes
2. **Account Lockout**: Lock account after 5 failed attempts
3. **Progressive Delays**: Rate limit window increases with attempts
4. **Monitoring**: Log all failed attempts for analysis

#### Attack Scenario
```
Attacker tries common passwords:
- Attempt 1-5: Rate limited (5 per 15 min)
- Attempt 6+: 429 Too Many Requests
- Account locks after 5 failed attempts
- 30-minute lockout prevents further attempts
```

### 2. Credential Stuffing

#### Mitigation Strategy
1. **IP Tracking**: Detect single IP hitting multiple accounts
2. **Rate Limiting**: Limit total login attempts per IP
3. **Account Lockout**: Lock individual accounts under attack
4. **Monitoring**: Alert on suspicious patterns

#### Detection Query
```sql
-- Find IPs attacking multiple accounts
SELECT ip_address,
       COUNT(DISTINCT email) as accounts_targeted,
       COUNT(*) as total_attempts
FROM failed_login_attempts
WHERE attempt_time > NOW() - INTERVAL '1 hour'
GROUP BY ip_address
HAVING COUNT(DISTINCT email) > 10
ORDER BY total_attempts DESC;
```

### 3. Account Enumeration

#### Mitigation Strategy
1. **Generic Messages**: Same error for all failure types
2. **Track Non-Existent**: Record attempts for invalid emails
3. **Consistent Timing**: Similar response times
4. **Rate Limiting**: Limit enumeration attempts

#### Protected Responses
```typescript
// All return same message
- User not found: "Invalid email or password"
- Wrong password: "Invalid email or password"
- Account locked: "Invalid email or password"
- Email not verified: "Invalid email or password"
```

### 4. Distributed Attacks

#### Mitigation Strategy
1. **Per-Account Tracking**: Locks account regardless of IP
2. **Database Logging**: Correlate attacks across IPs
3. **Monitoring Alerts**: Detect coordinated attacks
4. **Adaptive Limits**: Tighten limits during attacks

#### Detection
```sql
-- Find coordinated attacks on single account
SELECT email,
       COUNT(DISTINCT ip_address) as unique_ips,
       COUNT(*) as total_attempts
FROM failed_login_attempts
WHERE attempt_time > NOW() - INTERVAL '1 hour'
GROUP BY email
HAVING COUNT(DISTINCT ip_address) > 5
ORDER BY total_attempts DESC;
```

### 5. Registration Spam

#### Mitigation Strategy
1. **Strict Rate Limiting**: 3 registrations per hour per IP
2. **Email Verification**: Require email confirmation
3. **Monitoring**: Track registration patterns
4. **Cleanup**: Remove unverified accounts

#### Rate Limits
```typescript
register: {
  windowMs: 60 * 60 * 1000,  // 1 hour
  max: 3,                     // Only 3 registrations
  message: 'Too many registration attempts',
}
```

### 6. Password Reset Abuse

#### Mitigation Strategy
1. **Rate Limiting**: 3 requests per hour per IP
2. **Token Expiration**: 1-hour token lifetime
3. **Single Use**: Tokens invalidated after use
4. **No Enumeration**: Success message even if email doesn't exist

#### Security Features
```typescript
// Always return success to prevent enumeration
if (!user) {
  return res.status(200).json({
    success: true,
    message: 'If an account exists, a reset link has been sent',
  });
}

// Secure token generation
const resetToken = crypto.randomBytes(32).toString('hex');

// Store only hashed version
const hash = crypto.createHash('sha256').update(resetToken).digest('hex');
```

## Monitoring & Alerting

### Key Metrics to Monitor

#### 1. Failed Login Rate
```sql
-- Failed logins in last hour
SELECT COUNT(*) as failed_attempts,
       COUNT(DISTINCT email) as unique_users,
       COUNT(DISTINCT ip_address) as unique_ips
FROM failed_login_attempts
WHERE attempt_time > NOW() - INTERVAL '1 hour';
```

**Alert Thresholds:**
- \> 100 attempts/hour: Warning
- \> 500 attempts/hour: Critical
- \> 50 unique users: Potential credential stuffing

#### 2. Active Lockouts
```sql
-- Currently locked accounts
SELECT COUNT(*) as active_lockouts,
       MAX(unlock_at) as latest_unlock
FROM account_lockouts
WHERE is_active = TRUE;
```

**Alert Thresholds:**
- \> 10 active lockouts: Warning
- \> 50 active lockouts: Critical
- Sudden spike: Potential attack

#### 3. Rate Limit Hits
```sql
-- Rate limits exceeded in last hour
SELECT limit_type,
       COUNT(*) as hits,
       COUNT(DISTINCT ip_address) as unique_ips
FROM rate_limit_logs
WHERE hit_time > NOW() - INTERVAL '1 hour'
GROUP BY limit_type
ORDER BY hits DESC;
```

**Alert Thresholds:**
- \> 100 hits/hour: Warning
- \> 500 hits/hour: Critical
- Multiple limit types hit: Coordinated attack

#### 4. Suspicious Patterns
```sql
-- IPs with high failure rate
SELECT ip_address,
       COUNT(*) as attempts,
       COUNT(DISTINCT email) as users_targeted,
       MIN(attempt_time) as first_attempt,
       MAX(attempt_time) as last_attempt
FROM failed_login_attempts
WHERE attempt_time > NOW() - INTERVAL '24 hours'
GROUP BY ip_address
HAVING COUNT(*) > 20
ORDER BY attempts DESC;
```

**Alert Thresholds:**
- Single IP, many users: Credential stuffing
- Many IPs, single user: Distributed attack
- High rate from single IP: Brute force

### Recommended Alerts

#### Critical Alerts
```yaml
- name: Mass Account Lockout
  condition: active_lockouts > 50
  action: Immediate investigation

- name: Coordinated Attack
  condition: >50 IPs attacking same account
  action: Consider blocking account temporarily

- name: Rate Limit Breach
  condition: >1000 rate limit hits/hour
  action: Review rate limit configuration
```

#### Warning Alerts
```yaml
- name: Elevated Failed Logins
  condition: >100 failed attempts/hour
  action: Monitor for escalation

- name: Suspicious IP Pattern
  condition: Single IP targeting >20 accounts
  action: Consider IP blocking

- name: High Lockout Rate
  condition: >10 new lockouts/hour
  action: Investigate attack pattern
```

## Incident Response

### 1. Detecting an Attack

**Signs of Attack:**
- Sudden spike in failed login attempts
- Multiple accounts locked simultaneously
- High rate limit hits from few IPs
- Geographic anomalies (if tracking)

**Immediate Actions:**
```sql
-- Identify attack pattern
SELECT ip_address,
       COUNT(DISTINCT email) as accounts,
       COUNT(*) as attempts
FROM failed_login_attempts
WHERE attempt_time > NOW() - INTERVAL '1 hour'
GROUP BY ip_address
ORDER BY attempts DESC
LIMIT 20;
```

### 2. Responding to Attack

**Immediate Response:**
1. Verify attack is occurring
2. Identify attack vector (brute force, credential stuffing, etc.)
3. Check if rate limiting is working
4. Review locked accounts
5. Consider temporary measures

**Temporary Measures:**
```typescript
// Temporarily tighten rate limits
export const rateLimitConfigs = {
  login: {
    windowMs: 15 * 60 * 1000,
    max: 3,  // Reduce from 5 to 3
    // ...
  },
};
```

### 3. Post-Incident Analysis

**Analysis Queries:**
```sql
-- Attack timeline
SELECT DATE_TRUNC('minute', attempt_time) as minute,
       COUNT(*) as attempts
FROM failed_login_attempts
WHERE attempt_time > NOW() - INTERVAL '24 hours'
GROUP BY minute
ORDER BY minute;

-- Most targeted accounts
SELECT email,
       COUNT(*) as attack_attempts,
       COUNT(DISTINCT ip_address) as attacker_ips
FROM failed_login_attempts
WHERE attempt_time > NOW() - INTERVAL '24 hours'
GROUP BY email
ORDER BY attack_attempts DESC
LIMIT 20;
```

**Preventive Actions:**
1. Notify affected users
2. Force password reset for compromised accounts
3. Review and adjust rate limits
4. Update monitoring thresholds
5. Document incident for future reference

## Production Deployment

### Pre-Deployment Checklist

- [ ] Database schema applied
- [ ] Environment variables configured
- [ ] Rate limits tested in staging
- [ ] Account lockout tested
- [ ] Monitoring configured
- [ ] Alerting rules set up
- [ ] Incident response plan documented
- [ ] Team trained on admin functions
- [ ] Cleanup jobs scheduled
- [ ] Load testing completed

### Configuration Review

```bash
# Verify environment variables
echo "MAX_LOGIN_ATTEMPTS: ${MAX_LOGIN_ATTEMPTS:-5}"
echo "LOCKOUT_DURATION_MINUTES: ${LOCKOUT_DURATION_MINUTES:-30}"
echo "TRUST_PROXY: ${TRUST_PROXY:-false}"
echo "LOG_RATE_LIMITS: ${LOG_RATE_LIMITS:-false}"
```

### Health Checks

```bash
# Verify rate limiting is working
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "wrong"}' \
  -i | grep -E "(RateLimit|Retry-After)"

# Verify database schema
psql -h localhost -U grocery -d grocery_db \
  -c "\dt+ failed_login_attempts" \
  -c "\dt+ account_lockouts"
```

## Security Checklist

### Implementation Security
- [x] IP-based rate limiting
- [x] User-specific account lockout
- [x] Failed attempt tracking
- [x] Generic error messages
- [x] Token security (hashing)
- [x] SQL injection prevention (parameterized queries)
- [x] Proper indexing
- [x] Automatic cleanup

### Operational Security
- [ ] Monitoring configured
- [ ] Alerting set up
- [ ] Incident response plan
- [ ] Regular security reviews
- [ ] Cleanup jobs running
- [ ] Log retention policy
- [ ] Access control for admin functions

### Compliance
- [ ] GDPR considerations (data retention)
- [ ] User notification of lockouts
- [ ] Audit trail maintained
- [ ] Security documentation
- [ ] Privacy policy updated

## Additional Resources

### Related Security Measures

1. **HTTPS Only**: Ensure all authentication traffic uses HTTPS
2. **Secure Headers**: Implement security headers (helmet.js)
3. **Session Management**: Proper JWT token management
4. **Password Policies**: Strong password requirements
5. **2FA**: Consider two-factor authentication
6. **Email Verification**: Verify email addresses
7. **Login History**: Show users recent login activity
8. **Security Notifications**: Email users on security events

### Testing Tools

```bash
# Apache Bench (ab) - Load testing
ab -n 100 -c 10 -p login.json -T application/json \
  http://localhost:3000/api/auth/login

# JMeter - Comprehensive load testing
# Configure JMeter to test rate limiting

# Custom script - Automated testing
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email": "test@example.com", "password": "wrong"}'
done
```

### Reference Documentation

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [OWASP Credential Stuffing](https://owasp.org/www-community/attacks/Credential_stuffing)
- [Express Rate Limit](https://www.npmjs.com/package/express-rate-limit)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/security.html)

## Conclusion

This rate limiting implementation provides comprehensive protection against common authentication attacks. Regular monitoring, testing, and updates are essential to maintain security effectiveness.

For support or questions, refer to:
- `RATE_LIMITING_DOCUMENTATION.md` - Detailed documentation
- `RATE_LIMITING_INTEGRATION.md` - Quick integration guide
