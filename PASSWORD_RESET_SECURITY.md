# Password Reset Security Guide

## Critical Security Considerations for Production

### 1. Token Security

#### Current Implementation
- **Token Generation**: 32 bytes (256 bits) of cryptographically secure random data
- **Storage**: SHA-256 hashed in database
- **Transmission**: Plain token sent via email (HTTPS only)
- **Expiration**: 1 hour from generation

#### Production Recommendations

**MUST DO**:
1. **Use HTTPS Only**
   ```typescript
   // In production, enforce HTTPS for all reset links
   const resetUrl = `https://${process.env.DOMAIN}/reset-password?token=${resetToken}`;
   ```

2. **One-Time Use Tokens**
   ```typescript
   // After successful password reset, ensure token is nullified
   // Already implemented in resetPassword controller
   await query(
     `UPDATE users
      SET reset_token = NULL,
          reset_token_expires = NULL
      WHERE id = $2`,
     [newPasswordHash, user.id]
   );
   ```

3. **Shorter Expiration for Sensitive Applications**
   ```typescript
   // For high-security applications, reduce to 15-30 minutes
   const expiresAt = new Date();
   expiresAt.setMinutes(expiresAt.getMinutes() + 30); // 30 minutes instead of 1 hour
   ```

4. **Token Length Consideration**
   ```typescript
   // For extra security, increase token length
   const resetToken = crypto.randomBytes(64).toString('hex'); // 512 bits instead of 256
   ```

**SHOULD DO**:
1. **IP Address Validation**
   ```typescript
   // Store IP when token is generated
   interface User {
     reset_token_ip?: string;
     // ...
   }

   // Validate IP matches when resetting
   if (user.reset_token_ip && user.reset_token_ip !== req.ip) {
     // Log suspicious activity
     console.warn('Password reset attempt from different IP');
   }
   ```

2. **Token Usage Tracking**
   ```typescript
   // Track failed token attempts
   interface User {
     reset_token_attempts?: number;
     // ...
   }

   // Invalidate after 3 failed attempts
   if (user.reset_token_attempts >= 3) {
     await query('UPDATE users SET reset_token = NULL WHERE id = $1', [user.id]);
     throw new Error('Too many failed attempts');
   }
   ```

### 2. Email Security

#### Email Enumeration Prevention

**Current Implementation** (Good):
```typescript
// Always return same message whether user exists or not
if (!user) {
  res.status(200).json({
    success: true,
    message: 'If an account exists with that email, a password reset link has been sent',
  });
  return;
}
```

**Why This Matters**:
- Prevents attackers from discovering valid email addresses
- Maintains user privacy
- Reduces social engineering attack surface

**Additional Recommendations**:
1. **Timing Attack Prevention**
   ```typescript
   // Add artificial delay to normalize response times
   const startTime = Date.now();

   // ... perform password reset logic

   const elapsed = Date.now() - startTime;
   const minTime = 500; // 500ms minimum response time
   if (elapsed < minTime) {
     await new Promise(resolve => setTimeout(resolve, minTime - elapsed));
   }
   ```

2. **Rate Limiting Per Email**
   ```typescript
   // In addition to IP-based rate limiting, limit per email
   // Using Redis or in-memory cache
   const emailKey = `reset:${email}`;
   const attempts = await cache.get(emailKey);

   if (attempts > 3) {
     throw new Error('Too many reset requests for this email');
   }

   await cache.set(emailKey, (attempts || 0) + 1, 'EX', 3600); // 1 hour
   ```

### 3. Email Service Security

#### Production Email Integration

**DO NOT Use Mock Email in Production**:
```typescript
// ❌ BAD - Never in production
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  console.log('Email:', options); // This only logs, doesn't send
  return true;
}
```

**✓ GOOD - Use Real Email Service**:
```typescript
import sgMail from '@sendgrid/mail';

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    await sgMail.send({
      from: {
        email: process.env.EMAIL_FROM!,
        name: 'Grocery App'
      },
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      trackingSettings: {
        clickTracking: { enable: false },
        openTracking: { enable: false }
      }
    });

    // Log success (but not email content)
    logger.info('Password reset email sent', {
      to: options.to.replace(/(.{2}).*(@.*)/, '$1***$2'), // Mask email
      timestamp: new Date().toISOString()
    });

    return true;
  } catch (error) {
    logger.error('Email send failed', { error });
    return false;
  }
}
```

**Recommended Email Services**:
1. **SendGrid** (Recommended for most use cases)
   - Easy to set up
   - Good deliverability
   - Generous free tier
   - [Setup Guide](https://sendgrid.com/docs/for-developers/sending-email/api-getting-started/)

2. **AWS SES** (Best for AWS infrastructure)
   - Very cost-effective at scale
   - Requires verification in sandbox mode
   - [Setup Guide](https://docs.aws.amazon.com/ses/latest/dg/send-email-nodejs.html)

3. **Postmark** (Best deliverability)
   - Excellent for transactional emails
   - Higher cost but best delivery rates
   - [Setup Guide](https://postmarkapp.com/developer/user-guide/send-email-with-nodejs)

#### Email Content Security

**MUST DO**:
1. **Use Plain Text + HTML**
   - Always provide both formats
   - Some email clients strip HTML
   - Already implemented ✓

2. **No Sensitive Data in Subject Lines**
   ```typescript
   // ❌ BAD
   subject: `Password Reset for ${email}`

   // ✓ GOOD
   subject: 'Reset Your Password - Grocery List'
   ```

3. **Clear Sender Identity**
   ```typescript
   from: {
     email: 'noreply@yourdomain.com',
     name: 'Grocery List Security'
   }
   ```

4. **SPF, DKIM, DMARC Records**
   - Configure DNS records to prevent spoofing
   - Most email services provide these automatically
   - Verify setup: `dig TXT yourdomain.com`

### 4. Rate Limiting

#### Current Implementation
```typescript
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  // ...
});
```

#### Production Enhancements

**1. Distributed Rate Limiting (for multi-server deployments)**:
```typescript
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

const authLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:auth:'
  }),
  windowMs: 15 * 60 * 1000,
  max: 5
});
```

**2. Progressive Delays**:
```typescript
// Increase delay with each failed attempt
const progressiveRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: async (req) => {
    const key = req.ip;
    const attempts = await getAttempts(key);

    // Reduce allowed requests as attempts increase
    if (attempts > 10) return 1;
    if (attempts > 5) return 2;
    return 5;
  },
  skipSuccessfulRequests: true
});
```

**3. Account-Level Rate Limiting**:
```typescript
// Track per email, not just per IP
middleware.use('/forgot-password', async (req, res, next) => {
  const email = req.body.email;
  const key = `reset:email:${email}`;

  const attempts = await redis.incr(key);
  await redis.expire(key, 3600); // 1 hour

  if (attempts > 3) {
    return res.status(429).json({
      success: false,
      error: 'Too many requests',
      message: 'Please wait before requesting another reset'
    });
  }

  next();
});
```

### 5. Password Security

#### Current Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

#### Production Recommendations

**1. Enhanced Password Validation**:
```typescript
export function validatePassword(password: string): { isValid: boolean; error?: string } {
  if (password.length < 12) { // Increase to 12
    return { isValid: false, error: 'Password must be at least 12 characters long' };
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

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one special character' };
  }

  // Check against common passwords
  if (isCommonPassword(password)) {
    return { isValid: false, error: 'This password is too common' };
  }

  return { isValid: true };
}
```

**2. Password History**:
```typescript
// Prevent password reuse
interface User {
  password_history?: string[]; // Store hashes of last 5 passwords
  // ...
}

async function isPasswordReused(userId: string, newPassword: string): Promise<boolean> {
  const user = await getUser(userId);

  if (!user.password_history) return false;

  for (const oldHash of user.password_history) {
    if (await bcrypt.compare(newPassword, oldHash)) {
      return true;
    }
  }

  return false;
}
```

**3. Bcrypt Work Factor**:
```typescript
// Current implementation
const hash = await bcrypt.hash(password, 10);

// Production recommendation
const BCRYPT_ROUNDS = process.env.NODE_ENV === 'production' ? 12 : 10;
const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
```

### 6. Logging and Monitoring

#### What to Log

**Security Events**:
```typescript
// Log all password reset requests
logger.security('password_reset_requested', {
  email: maskEmail(email),
  ip: req.ip,
  userAgent: req.get('user-agent'),
  timestamp: new Date().toISOString()
});

// Log successful resets
logger.security('password_reset_successful', {
  userId: user.id,
  ip: req.ip,
  timestamp: new Date().toISOString()
});

// Log failed attempts
logger.security('password_reset_failed', {
  reason: 'invalid_token',
  ip: req.ip,
  timestamp: new Date().toISOString()
});
```

**Never Log**:
- Plain text passwords
- Reset tokens (only log that one was generated/used)
- Full email addresses in plain text (mask them)
- Password hashes

**Alerting Rules**:
1. Alert if >10 password reset requests from same IP in 1 hour
2. Alert if >5 failed token validations from same IP
3. Alert if password reset requested for admin accounts
4. Alert if unusual geographic pattern detected

#### Recommended Logging Services
- **Datadog** - Comprehensive monitoring
- **Sentry** - Error tracking
- **CloudWatch** - AWS integration
- **ELK Stack** - Self-hosted option

### 7. Database Security

#### Connection Security
```typescript
// Use SSL for database connections
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync('/path/to/ca-cert.pem').toString()
  }
});
```

#### Query Parameterization
```typescript
// ✓ GOOD - Already implemented
await query(
  'SELECT * FROM users WHERE reset_token = $1',
  [resetTokenHash]
);

// ❌ BAD - Never do this
await query(
  `SELECT * FROM users WHERE reset_token = '${resetTokenHash}'`
);
```

#### Backup and Recovery
1. **Regular Backups**: Daily automated backups of users table
2. **Point-in-Time Recovery**: Enable WAL archiving
3. **Test Restores**: Monthly restore testing
4. **Backup Encryption**: Encrypt backups at rest

### 8. Frontend Security

#### XSS Prevention
```typescript
// Already handled by React - JSX escapes by default
<span>{error}</span> // Safe - React escapes this
```

#### CSRF Protection
```typescript
// Add CSRF token for form submissions
<input type="hidden" name="_csrf" value={csrfToken} />
```

#### Content Security Policy
```typescript
// Add CSP headers
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';"
  );
  next();
});
```

### 9. Compliance Considerations

#### GDPR (European Users)
- **Right to Access**: Users can see when password was last reset
- **Data Retention**: Expire old reset tokens
- **Audit Log**: Keep record of password changes
- **Clear Notifications**: Inform users when password is changed

#### CCPA (California Users)
- Similar to GDPR requirements
- Provide data export functionality

#### HIPAA (Healthcare Data)
- Enhanced logging requirements
- Stricter password requirements
- Audit trails required
- Regular security assessments

### 10. Incident Response Plan

#### If Reset Token is Compromised

1. **Immediate Actions**:
   ```sql
   -- Invalidate all active reset tokens
   UPDATE users SET reset_token = NULL, reset_token_expires = NULL;
   ```

2. **Investigation**:
   - Review logs for suspicious activity
   - Identify affected accounts
   - Determine breach vector

3. **Notification**:
   - Notify affected users
   - Provide guidance on account security
   - Force password reset if necessary

4. **Prevention**:
   - Patch vulnerability
   - Update security measures
   - Review and improve monitoring

### 11. Security Testing

#### Penetration Testing Checklist
- [ ] Test rate limiting bypass
- [ ] Test token brute force
- [ ] Test email enumeration
- [ ] Test expired token handling
- [ ] Test SQL injection
- [ ] Test XSS in email input
- [ ] Test CSRF attacks
- [ ] Test timing attacks
- [ ] Test concurrent token usage
- [ ] Test token reuse after password change

#### Automated Security Scanning
```bash
# Run security audits
npm audit

# Use OWASP ZAP or similar
zap-cli quick-scan http://localhost:3000

# Use Snyk for dependency scanning
npx snyk test
```

### 12. Environment Variable Security

#### Required Environment Variables
```bash
# .env.production (NEVER commit this file)
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
JWT_ACCESS_SECRET=<generated-with-crypto.randomBytes(64).toString('hex')>
JWT_REFRESH_SECRET=<different-generated-secret>
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com
FRONTEND_URL=https://yourdomain.com
NODE_ENV=production
```

#### Secret Management Best Practices
1. Use secret management service (AWS Secrets Manager, HashiCorp Vault)
2. Rotate secrets regularly (every 90 days)
3. Never log secrets
4. Use different secrets per environment
5. Implement secret access controls

### 13. Production Deployment Checklist

Before deploying to production, ensure:

- [ ] Database migration applied and tested
- [ ] Environment variables configured in production
- [ ] Real email service configured (not mock)
- [ ] HTTPS enabled and enforced
- [ ] Rate limiting tested and tuned
- [ ] Logging configured and tested
- [ ] Monitoring alerts set up
- [ ] Backup strategy implemented
- [ ] Security headers configured
- [ ] CORS properly configured
- [ ] Error messages don't leak sensitive info
- [ ] Security testing completed
- [ ] Incident response plan documented
- [ ] Team trained on security procedures

### 14. Ongoing Security Maintenance

#### Weekly
- Review security logs for anomalies
- Check failed reset attempts

#### Monthly
- Review and update dependencies
- Test backup restoration
- Review access logs

#### Quarterly
- Rotate secrets and tokens
- Security audit
- Update security documentation
- Team security training

#### Annually
- Comprehensive security assessment
- Penetration testing
- Compliance review
- Disaster recovery drill

## Contact for Security Issues

If you discover a security vulnerability:
1. Do NOT open a public issue
2. Email security@yourdomain.com
3. Include detailed description
4. Allow 48 hours for response

## Additional Resources

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [OWASP Forgot Password Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html)
- [NIST Password Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)
- [CWE-640: Weak Password Recovery](https://cwe.mitre.org/data/definitions/640.html)

---

**Last Updated**: October 26, 2025
**Review Schedule**: Quarterly
**Next Review**: January 26, 2026
