# JWT Authentication Guide

This guide covers the database schema and security recommendations for implementing JWT authentication in the grocery list application.

## Database Schema Overview

The `users` table is designed to support secure JWT-based authentication with the following features:

### Core Fields

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key using UUID v4 for security |
| `username` | VARCHAR(50) | Unique username (3-50 chars, alphanumeric + underscore) |
| `email` | VARCHAR(255) | Unique email (stored in lowercase) |
| `password_hash` | VARCHAR(255) | Bcrypt hash of password |
| `created_at` | TIMESTAMP WITH TIME ZONE | Account creation time |
| `updated_at` | TIMESTAMP WITH TIME ZONE | Last update time (auto-updated) |
| `last_login` | TIMESTAMP WITH TIME ZONE | Last successful login (nullable) |
| `is_active` | BOOLEAN | Account active status |
| `email_verified` | BOOLEAN | Email verification status |

## Password Hashing Recommendations

### Bcrypt Configuration

**Recommended bcrypt cost factor: 12-14**

```javascript
// Node.js example with bcrypt
import bcrypt from 'bcrypt';

// Hash a password
const saltRounds = 12; // Adjust based on your security requirements
const hashedPassword = await bcrypt.hash(plainTextPassword, saltRounds);

// Verify a password
const isValid = await bcrypt.compare(plainTextPassword, hashedPassword);
```

### Cost Factor Guidelines

- **Cost 10**: ~65ms per hash (minimum recommended)
- **Cost 12**: ~260ms per hash (recommended for most applications)
- **Cost 14**: ~1000ms per hash (high security applications)
- **Cost 16**: ~4000ms per hash (very high security)

**Rule of thumb**: Choose a cost factor that takes 200-500ms on your server hardware. This provides good security while preventing brute-force attacks without degrading user experience.

### Security Best Practices

1. **Never store plain text passwords**
2. **Use bcrypt, argon2, or scrypt** (avoid MD5, SHA1, SHA256 for passwords)
3. **Use unique salts** (bcrypt handles this automatically)
4. **Implement rate limiting** on login attempts
5. **Use HTTPS** in production to protect credentials in transit

## JWT Token Structure

### JWT Payload Recommendations

```json
{
  "sub": "user-uuid",
  "username": "johndoe",
  "email": "john@example.com",
  "iat": 1635724800,
  "exp": 1635811200
}
```

### Token Security

1. **Use strong secret keys** (256+ bits of entropy)
2. **Set appropriate expiration times**:
   - Access tokens: 15-60 minutes
   - Refresh tokens: 7-30 days
3. **Store tokens securely on client**:
   - httpOnly cookies (preferred)
   - localStorage with XSS protection
4. **Implement token refresh mechanism**
5. **Consider token blacklisting** for logout

## Database Performance Optimizations

### Indexes Created

The schema includes optimized indexes for common queries:

1. **Email index**: Fast user lookup during login
2. **Username index**: Profile and username availability checks
3. **Email + is_active composite**: Optimized authentication queries
4. **Created_at index**: Analytics and admin queries
5. **Last_login partial index**: Activity tracking (only indexes non-null values)

### Query Examples

```sql
-- User login (uses idx_users_email_active)
SELECT id, username, email, password_hash, is_active
FROM users
WHERE email = $1 AND is_active = true;

-- Check username availability (uses idx_users_username)
SELECT EXISTS(SELECT 1 FROM users WHERE username = $1);

-- Update last login (triggers updated_at automatically)
UPDATE users
SET last_login = CURRENT_TIMESTAMP
WHERE id = $1;
```

## Data Integrity Features

### Automatic Triggers

1. **Updated_at auto-update**: Automatically sets `updated_at` on any row update
2. **Email lowercase normalization**: Ensures emails are stored in lowercase

### Constraints

1. **Username length**: Minimum 3 characters
2. **Username format**: Only alphanumeric and underscore allowed
3. **Email format**: Basic email validation regex
4. **Unique constraints**: Enforced on username and email

## Migration Instructions

### Initial Setup

```bash
# Start PostgreSQL
docker compose up -d

# Run the migration
docker compose exec -T postgres psql -U grocery -d grocery_db < src/migrations/001_create_users_table.sql
```

### Verify Installation

```sql
-- Check if table exists
\dt users

-- Verify indexes
\di

-- Check constraints
\d users
```

## Integration with Grocery Items

To link grocery items to users, you'll need to add a foreign key:

```sql
-- Migration to add user ownership to grocery_items
ALTER TABLE grocery_items
ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Index for filtering items by user
CREATE INDEX idx_grocery_items_user_id ON grocery_items(user_id);
```

## API Implementation Example

### Registration Endpoint

```javascript
async function registerUser(username, email, password) {
  // Validate input
  if (username.length < 3) {
    throw new Error('Username must be at least 3 characters');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);

  // Insert user
  const result = await db.query(`
    INSERT INTO users (username, email, password_hash)
    VALUES ($1, $2, $3)
    RETURNING id, username, email, created_at
  `, [username, email.toLowerCase(), passwordHash]);

  return result.rows[0];
}
```

### Login Endpoint

```javascript
async function loginUser(email, password) {
  // Find user
  const result = await db.query(`
    SELECT id, username, email, password_hash, is_active
    FROM users
    WHERE email = $1 AND is_active = true
  `, [email.toLowerCase()]);

  if (result.rows.length === 0) {
    throw new Error('Invalid credentials');
  }

  const user = result.rows[0];

  // Verify password
  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    throw new Error('Invalid credentials');
  }

  // Update last login
  await db.query(`
    UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1
  `, [user.id]);

  // Generate JWT token
  const token = jwt.sign(
    {
      sub: user.id,
      username: user.username,
      email: user.email
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  return { token, user: { id: user.id, username: user.username, email: user.email } };
}
```

## Security Checklist

- [ ] Use HTTPS in production
- [ ] Implement rate limiting on auth endpoints
- [ ] Set up CORS properly
- [ ] Use environment variables for secrets
- [ ] Implement password strength validation
- [ ] Add email verification flow
- [ ] Implement account lockout after failed attempts
- [ ] Log authentication events
- [ ] Implement refresh token rotation
- [ ] Set up monitoring for suspicious activity

## Recommended NPM Packages

```bash
# Password hashing
npm install bcrypt

# JWT handling
npm install jsonwebtoken

# Input validation
npm install joi  # or zod

# Rate limiting (Express)
npm install express-rate-limit

# PostgreSQL client
npm install pg  # or use existing kysely
```

## Additional Resources

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
- [Bcrypt Documentation](https://github.com/kelektiv/node.bcrypt.js)
