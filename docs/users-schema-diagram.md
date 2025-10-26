# Users Table Schema Diagram

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        USERS TABLE                          │
├─────────────────────────────────────────────────────────────┤
│ PK  id                  UUID (auto-generated)               │
│ UQ  username            VARCHAR(50)                         │
│ UQ  email               VARCHAR(255) (lowercase)            │
│     password_hash       VARCHAR(255) (bcrypt)               │
│     created_at          TIMESTAMP WITH TIME ZONE            │
│     updated_at          TIMESTAMP WITH TIME ZONE (auto)     │
│     last_login          TIMESTAMP WITH TIME ZONE (nullable) │
│     is_active           BOOLEAN (default: true)             │
│     email_verified      BOOLEAN (default: false)            │
└─────────────────────────────────────────────────────────────┘
```

## Indexes

```
idx_users_email          (email)                   - Login queries
idx_users_username       (username)                - Profile lookups
idx_users_email_active   (email, is_active)        - Auth queries
idx_users_created_at     (created_at DESC)         - Analytics
idx_users_last_login     (last_login DESC) partial - Activity tracking
idx_users_active         (is_active) partial       - Active users filter
```

## Triggers

```
lowercase_users_email    BEFORE INSERT/UPDATE     - Normalize email to lowercase
update_users_updated_at  BEFORE UPDATE            - Auto-update timestamp
```

## Constraints

```
PRIMARY KEY              id
UNIQUE                   username, email
CHECK                    username_length (>= 3 characters)
CHECK                    username_format (alphanumeric + underscore only)
CHECK                    email_format (valid email pattern)
NOT NULL                 username, email, password_hash, created_at, updated_at, is_active, email_verified
```

## Integration with Grocery Items

```
┌─────────────────────┐         ┌──────────────────────┐
│       USERS         │         │   GROCERY_ITEMS      │
├─────────────────────┤         ├──────────────────────┤
│ PK id (UUID)        │────┐    │ PK id (TEXT)         │
│    username         │    │    │    name              │
│    email            │    │    │    quantity          │
│    password_hash    │    │    │    gotten            │
│    ...              │    │    │    category          │
└─────────────────────┘    │    │    notes             │
                           │    │    created_at        │
                           └───→│ FK user_id (UUID)    │
                                └──────────────────────┘

Relationship: One user has many grocery items
Foreign Key: grocery_items.user_id REFERENCES users.id ON DELETE CASCADE
```

## Data Flow - Authentication

### Registration Flow
```
1. Client sends: username, email, password
2. Server validates input
3. Server hashes password with bcrypt (cost 12)
4. Server inserts into users table
5. Triggers execute:
   - Email converted to lowercase
   - UUID auto-generated
   - Timestamps set
6. Server returns: user object (without password_hash)
```

### Login Flow
```
1. Client sends: email/username, password
2. Server queries: SELECT * FROM users WHERE email = ? AND is_active = true
3. Server compares: bcrypt.compare(password, password_hash)
4. If valid:
   - Update last_login timestamp (triggers updated_at)
   - Generate JWT token
   - Return token + user object
5. If invalid:
   - Return error
```

### JWT Token Flow
```
1. User logs in → Receives JWT token
2. Client stores token (httpOnly cookie or localStorage)
3. Client sends token in Authorization header:
   "Authorization: Bearer <token>"
4. Server validates token:
   - Verify signature
   - Check expiration
   - Extract user ID from payload
5. Server uses user ID to query database or authorize actions
```

## Security Layers

```
Layer 1: Network        HTTPS/TLS encryption
Layer 2: Authentication JWT token validation
Layer 3: Database       Bcrypt password hashing
Layer 4: Authorization  User ID verification
Layer 5: Rate Limiting  Prevent brute force
Layer 6: Input Validation Constraints & checks
```

## Password Hashing Details

```
Bcrypt Hash Structure:
$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIq.Zu7tGC
│   │  │                                                    │
│   │  │                                                    └─ Hash (31 chars)
│   │  └─ Salt (22 chars)
│   └─ Cost factor (12 = 2^12 = 4096 iterations)
└─ Algorithm version (2b = bcrypt)

Time complexity: ~260ms per hash at cost 12
Salt: Automatically generated per password
Output length: 60 characters
```

## Index Usage Examples

```sql
-- Query 1: Login by email (uses idx_users_email_active)
EXPLAIN ANALYZE
SELECT id, username, password_hash
FROM users
WHERE email = 'user@example.com' AND is_active = true;

-- Query 2: Check username availability (uses idx_users_username)
EXPLAIN ANALYZE
SELECT EXISTS(SELECT 1 FROM users WHERE username = 'newuser');

-- Query 3: Recent registrations (uses idx_users_created_at)
EXPLAIN ANALYZE
SELECT id, username, created_at
FROM users
ORDER BY created_at DESC
LIMIT 10;

-- Query 4: Active users (uses idx_users_last_login)
EXPLAIN ANALYZE
SELECT COUNT(*)
FROM users
WHERE last_login >= NOW() - INTERVAL '7 days';
```

## Performance Characteristics

```
Operation               Index Used                Time Complexity
─────────────────────────────────────────────────────────────────
Login by email         idx_users_email_active     O(log n)
Login by username      idx_users_username         O(log n)
Check email exists     idx_users_email            O(log n)
Check username exists  idx_users_username         O(log n)
Get user by ID         PRIMARY KEY                O(1)
List recent users      idx_users_created_at       O(log n + k)
Count active users     idx_users_active           O(n) but filtered
Update last login      PRIMARY KEY                O(log n)
```

## Storage Estimates

```
Per User Record:
- id (UUID):             16 bytes
- username (avg 15):     ~20 bytes
- email (avg 25):        ~30 bytes
- password_hash:         60 bytes
- timestamps (3):        24 bytes
- booleans (2):          2 bytes
- Total per user:        ~150 bytes

+ Index overhead:        ~100 bytes per user
= Total per user:        ~250 bytes

Estimated capacity:
- 1,000 users:           ~250 KB
- 10,000 users:          ~2.5 MB
- 100,000 users:         ~25 MB
- 1,000,000 users:       ~250 MB
```

## Common Query Patterns

```sql
-- Pattern 1: Authentication
SELECT id, username, email, password_hash, is_active
FROM users
WHERE email = LOWER($1) AND is_active = true;

-- Pattern 2: Profile Retrieval
SELECT id, username, email, created_at, last_login, email_verified
FROM users
WHERE id = $1;

-- Pattern 3: User's Items
SELECT gi.* FROM grocery_items gi
JOIN users u ON gi.user_id = u.id
WHERE u.id = $1 AND u.is_active = true;

-- Pattern 4: Activity Analytics
SELECT
  COUNT(*) as total,
  COUNT(CASE WHEN last_login >= NOW() - INTERVAL '7 days' THEN 1 END) as active_week
FROM users
WHERE is_active = true;
```

## Migration Timeline

```
Phase 1: User Table         [READY]
  - Create users table
  - Add indexes
  - Add triggers
  - Add constraints

Phase 2: Link Grocery Items [PENDING]
  - Add user_id to grocery_items
  - Create foreign key
  - Migrate existing data
  - Add index on user_id

Phase 3: Refresh Tokens     [FUTURE]
  - Create refresh_tokens table
  - Link to users
  - Add token rotation

Phase 4: Email Verification [FUTURE]
  - Create verification_tokens table
  - Add email sending
  - Update email_verified flag

Phase 5: Password Reset     [FUTURE]
  - Create reset_tokens table
  - Add reset flow
  - Add expiration logic
```

## Backup & Recovery

```bash
# Backup users table
docker compose exec postgres pg_dump -U grocery -d grocery_db -t users > users_backup.sql

# Restore users table
docker compose exec -T postgres psql -U grocery -d grocery_db < users_backup.sql

# Backup with data only
docker compose exec postgres pg_dump -U grocery -d grocery_db -t users --data-only > users_data.sql

# Export to CSV
docker compose exec postgres psql -U grocery -d grocery_db -c "COPY users TO STDOUT CSV HEADER" > users.csv
```

## Monitoring Queries

```sql
-- Table size
SELECT pg_size_pretty(pg_total_relation_size('users')) AS total_size;

-- Index sizes
SELECT
  indexname,
  pg_size_pretty(pg_relation_size(indexname::regclass)) AS size
FROM pg_indexes
WHERE tablename = 'users';

-- Most recent activity
SELECT
  MAX(created_at) as latest_registration,
  MAX(last_login) as latest_login,
  MAX(updated_at) as latest_update
FROM users;

-- Dead tuples (for vacuum monitoring)
SELECT
  n_dead_tup,
  n_live_tup,
  last_vacuum,
  last_autovacuum
FROM pg_stat_user_tables
WHERE relname = 'users';
```
