# Users Schema Quick Start Guide

## Installation

### 1. Start PostgreSQL

```bash
docker compose up -d
```

### 2. Run the Migration

```bash
# Option A: Direct execution
docker compose exec -T postgres psql -U grocery -d grocery_db < src/migrations/001_create_users_table.sql

# Option B: Using psql from host (if installed)
psql -h localhost -p 5432 -U grocery -d grocery_db -f src/migrations/001_create_users_table.sql
```

### 3. Verify Installation

```bash
docker compose exec postgres psql -U grocery -d grocery_db -c "\d users"
```

You should see the users table structure with all columns and constraints.

## Quick Test

### Create a Test User

```sql
-- Connect to database
docker compose exec -it postgres psql -U grocery -d grocery_db

-- Insert test user (with example bcrypt hash)
INSERT INTO users (username, email, password_hash)
VALUES ('testuser', 'test@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIq.Zu7tGC')
RETURNING id, username, email, created_at;

-- Query the user
SELECT id, username, email, created_at, is_active FROM users WHERE username = 'testuser';

-- Clean up
DELETE FROM users WHERE username = 'testuser';
```

## Schema Overview

```
users
├── id (UUID, Primary Key)
├── username (VARCHAR(50), UNIQUE, NOT NULL)
├── email (VARCHAR(255), UNIQUE, NOT NULL)
├── password_hash (VARCHAR(255), NOT NULL)
├── created_at (TIMESTAMP WITH TIME ZONE, NOT NULL)
├── updated_at (TIMESTAMP WITH TIME ZONE, NOT NULL)
├── last_login (TIMESTAMP WITH TIME ZONE, NULLABLE)
├── is_active (BOOLEAN, DEFAULT true)
└── email_verified (BOOLEAN, DEFAULT false)
```

### Indexes
- `idx_users_email` - Fast email lookup
- `idx_users_username` - Fast username lookup
- `idx_users_email_active` - Optimized authentication queries
- `idx_users_created_at` - Analytics queries
- `idx_users_last_login` - Activity tracking
- `idx_users_active` - Active user filtering

### Automatic Features
- **Email lowercase**: Emails automatically converted to lowercase
- **Updated_at**: Automatically updated on any row modification
- **Constraints**: Username format, email format, minimum length validation

## Integration with Existing Schema

### Link Grocery Items to Users

```sql
-- Add user_id column to grocery_items
ALTER TABLE grocery_items
ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX idx_grocery_items_user_id ON grocery_items(user_id);

-- Make it required for new items (optional)
-- ALTER TABLE grocery_items ALTER COLUMN user_id SET NOT NULL;
```

### Query User's Grocery Items

```sql
-- Get all items for a user
SELECT gi.* FROM grocery_items gi
WHERE gi.user_id = 'user-uuid-here'
ORDER BY gi.created_at DESC;

-- Get user with their item count
SELECT
  u.id,
  u.username,
  u.email,
  COUNT(gi.id) as item_count
FROM users u
LEFT JOIN grocery_items gi ON gi.user_id = u.id
WHERE u.id = 'user-uuid-here'
GROUP BY u.id, u.username, u.email;
```

## Password Hashing Example

### Node.js with bcrypt

```bash
npm install bcrypt
```

```javascript
import bcrypt from 'bcrypt';

// Hash a password (during registration)
const saltRounds = 12;
const hashedPassword = await bcrypt.hash('userPassword123', saltRounds);

// Compare password (during login)
const isMatch = await bcrypt.compare('userPassword123', hashedPassword);
console.log(isMatch); // true
```

### Test Hash Generation

```bash
# Install bcrypt globally (if needed)
npm install -g bcrypt-cli

# Generate a hash for testing
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('test123', 12, (err, hash) => console.log(hash));"
```

## Common Operations

### Register User
```sql
INSERT INTO users (username, email, password_hash)
VALUES ($1, $2, $3)
RETURNING id, username, email, created_at;
```

### Login (Get User)
```sql
SELECT id, username, email, password_hash, is_active
FROM users
WHERE email = LOWER($1) AND is_active = true;
```

### Update Last Login
```sql
UPDATE users
SET last_login = CURRENT_TIMESTAMP
WHERE id = $1;
```

### Get User Profile
```sql
SELECT id, username, email, created_at, last_login, email_verified
FROM users
WHERE id = $1;
```

## Rollback

If you need to remove the users table:

```bash
docker compose exec -T postgres psql -U grocery -d grocery_db < src/migrations/rollback/001_drop_users_table.sql
```

**WARNING**: This will permanently delete all user data!

## Next Steps

1. **Install Authentication Library**: Choose JWT library (jsonwebtoken, jose, etc.)
2. **Create API Endpoints**: Register, login, profile, update password
3. **Add Rate Limiting**: Prevent brute force attacks
4. **Implement Email Verification**: Add verification token system
5. **Add Refresh Tokens**: Create separate table for refresh tokens
6. **Link to Grocery Items**: Add user_id foreign key to grocery_items
7. **Add Authorization**: Ensure users can only access their own items

## File Locations

- **Main Schema**: `/home/adam/grocery/src/users-schema.sql`
- **Migration**: `/home/adam/grocery/src/migrations/001_create_users_table.sql`
- **Rollback**: `/home/adam/grocery/src/migrations/rollback/001_drop_users_table.sql`
- **Query Examples**: `/home/adam/grocery/src/sql/user-queries.sql`
- **Full Guide**: `/home/adam/grocery/docs/authentication-guide.md`

## Troubleshooting

### Extension Error
```
ERROR: extension "uuid-ossp" does not exist
```
**Solution**: The extension is created automatically in the migration. If it fails, ensure you're using PostgreSQL 9.1+

### Unique Constraint Violation
```
ERROR: duplicate key value violates unique constraint "users_email_key"
```
**Solution**: Email already exists. Check before inserting or handle the error in your application.

### Connection Refused
```
psql: error: connection to server at "localhost" (127.0.0.1), port 5432 failed
```
**Solution**: Ensure PostgreSQL is running: `docker compose up -d`

## Resources

- See `/home/adam/grocery/docs/authentication-guide.md` for detailed security recommendations
- See `/home/adam/grocery/src/sql/user-queries.sql` for more SQL query examples
- See `/home/adam/grocery/src/migrations/README.md` for migration instructions
