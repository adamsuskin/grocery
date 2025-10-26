# Security Checklist for Deployment

This is a quick reference checklist for deploying the Grocery List Manager application securely.

## Pre-Deployment Checklist

### Environment & Secrets
- [ ] Generate strong JWT secrets (256-bit minimum)
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- [ ] Set unique secrets per environment (dev/staging/prod)
- [ ] Never commit secrets to version control
- [ ] Use environment variable management service
- [ ] Validate all required environment variables on startup

### HTTPS & SSL
- [ ] SSL/TLS certificate installed and valid
- [ ] HTTPS enforced (redirect HTTP to HTTPS)
- [ ] HSTS header configured: `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- [ ] Certificate auto-renewal configured
- [ ] Test SSL configuration with SSL Labs

### Database Security
- [ ] Database connection uses SSL/TLS (`sslmode=require`)
- [ ] Database user has minimal required permissions
- [ ] Foreign key constraints enabled
- [ ] Automated backup configured
- [ ] Backup encryption enabled
- [ ] Test backup restoration

### CORS Configuration
- [ ] CORS restricted to specific origin (not wildcard)
- [ ] Credentials enabled if needed
- [ ] Allowed methods specified
- [ ] Preflight caching configured

### Security Headers
- [ ] `helmet` middleware installed and configured
- [ ] Content Security Policy (CSP) header set
- [ ] X-Frame-Options set to DENY
- [ ] X-Content-Type-Options set to nosniff
- [ ] X-XSS-Protection enabled

### Rate Limiting
- [ ] Rate limiting configured for all auth endpoints
- [ ] Consider distributed rate limiting (Redis) for multiple servers
- [ ] Monitor rate limit hits
- [ ] Configure appropriate limits per endpoint

### Monitoring & Logging
- [ ] Error monitoring service configured (Sentry, Rollbar, etc.)
- [ ] Centralized logging setup (ELK, CloudWatch, etc.)
- [ ] Security event logging enabled
- [ ] Alert rules configured for suspicious activity
- [ ] Uptime monitoring active

### Server Hardening
- [ ] Firewall configured and active
- [ ] Only necessary ports exposed (443, 80 for redirect)
- [ ] SSH key authentication only (no password auth)
- [ ] Regular security updates scheduled
- [ ] Intrusion detection system considered

## Runtime Security Checklist

### Authentication
- [ ] JWT tokens expire appropriately (15 min access, 7 day refresh)
- [ ] Password requirements enforced (8 chars, uppercase, lowercase, number)
- [ ] Failed login attempts tracked and limited
- [ ] Account lockout mechanism active
- [ ] Token refresh working correctly

### Authorization
- [ ] All protected routes use `authenticateToken` middleware
- [ ] Permission checks on all list operations
- [ ] Non-members cannot access lists
- [ ] Viewers cannot edit
- [ ] Editors cannot manage members
- [ ] Only owners can delete lists

### Input Validation
- [ ] All inputs validated with express-validator
- [ ] UUIDs validated
- [ ] Email format validated
- [ ] Permission enums validated
- [ ] Length limits enforced

### Data Protection
- [ ] Passwords hashed with bcrypt (10+ rounds)
- [ ] Sensitive data not logged
- [ ] Error messages don't expose internals
- [ ] API responses properly sanitized

## Security Testing

### Before Each Release
- [ ] Run security audit
- [ ] Test authentication flows
- [ ] Test authorization boundaries
- [ ] Verify rate limiting
- [ ] Check for exposed secrets
- [ ] Review dependency vulnerabilities: `npm audit`
- [ ] Test error handling

### Penetration Testing
- [ ] Test SQL injection (all queries parameterized)
- [ ] Test XSS vulnerabilities
- [ ] Test CSRF attacks
- [ ] Test authentication bypass
- [ ] Test authorization bypass
- [ ] Test rate limit bypass
- [ ] Test session management

## Incident Response

### If Security Issue Detected
1. Assess severity and impact
2. Isolate affected systems if needed
3. Rotate compromised credentials
4. Notify affected users if required
5. Document incident and response
6. Implement fixes
7. Review and update security measures

### Emergency Contacts
- System Admin: [Contact Info]
- Database Admin: [Contact Info]
- Security Team: [Contact Info]
- On-Call Engineer: [Contact Info]

## Regular Maintenance

### Weekly
- [ ] Review security logs
- [ ] Check rate limit effectiveness
- [ ] Monitor failed authentication attempts
- [ ] Review error logs for suspicious activity

### Monthly
- [ ] Update dependencies: `npm update`
- [ ] Run security audit: `npm audit fix`
- [ ] Review access logs
- [ ] Test backup restoration
- [ ] Review and rotate API keys if needed

### Quarterly
- [ ] Full security audit
- [ ] Penetration testing
- [ ] Review and update security policies
- [ ] Security training for team
- [ ] Rotate database credentials
- [ ] Review and update this checklist

## Compliance

### GDPR (if applicable)
- [ ] Privacy policy published
- [ ] Data retention policy implemented
- [ ] User data export functionality
- [ ] Account deletion with data cleanup
- [ ] Cookie consent (if using cookies)
- [ ] Data processing agreement with third parties

### General Compliance
- [ ] Terms of service published
- [ ] Security policy documented
- [ ] Incident response plan documented
- [ ] Data breach notification procedures defined

## Security Resources

- OWASP Top 10: https://owasp.org/www-project-top-ten/
- Node.js Security: https://nodejs.org/en/docs/guides/security/
- JWT Best Practices: https://tools.ietf.org/html/rfc8725
- PostgreSQL Security: https://www.postgresql.org/docs/current/security.html

## Quick Commands

### Check for vulnerabilities
```bash
npm audit
npm audit fix
```

### Generate secure secret
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Test SSL configuration
```bash
curl -I https://your-domain.com
```

### Check security headers
```bash
curl -I https://your-domain.com | grep -i "x-\|content-security\|strict-transport"
```

---

**Last Updated:** October 26, 2025
**Review Schedule:** Quarterly
**Next Review:** January 26, 2026
