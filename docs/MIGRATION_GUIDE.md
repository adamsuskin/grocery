# Migration Guide: List Sharing Feature

## Overview

This guide details the migration process for transitioning existing users from the user-based item model to the list-based sharing model. The migration is designed to be seamless and non-disruptive to end users.

**Migration Version:** 004_migrate_to_lists.sql
**Date Created:** 2025-10-26
**Target Systems:** PostgreSQL 12+

---

## Table of Contents

1. [What's Changing](#whats-changing)
2. [User Impact](#user-impact)
3. [Auto-Migration Process](#auto-migration-process)
4. [Database Migration Steps](#database-migration-steps)
5. [Verification Steps](#verification-steps)
6. [Potential Issues & Solutions](#potential-issues--solutions)
7. [Rollback Procedure](#rollback-procedure)
8. [User Communication Template](#user-communication-template)
9. [FAQ](#faq)

---

## What's Changing

### Before Migration
- Users own grocery items directly via `user_id`
- Items are associated with a single user
- No concept of shared lists or collaboration

### After Migration
- Items belong to **lists** (not directly to users)
- Each list has members with permissions (owner, editor, viewer)
- Each user gets a default "My Grocery List" automatically
- All existing items are migrated to the user's default list
- Users can create additional lists and share them with others

### Database Schema Changes

**New Tables:**
- `lists` - Stores list metadata (name, owner, timestamps)
- `list_members` - Junction table for list access and permissions

**Modified Tables:**
- `grocery_items` - Adds `list_id` column (replaces direct user ownership)

**New Features:**
- Multi-user list sharing
- Permission levels: owner (full control), editor (add/edit items), viewer (read-only)
- List customization (color, icons)
- Invite links for sharing
- List archiving and pinning
- Activity tracking

---

## User Impact

### What Users Will See

#### Immediate Changes (After Login)
1. **Default List Created**
   - Each user automatically gets a list called "My Grocery List"
   - All their existing items appear in this list
   - No items are lost or changed

2. **New Interface Elements**
   - List selector in the navigation/header
   - List management section (create, rename, delete lists)
   - Share button for inviting collaborators
   - Members section showing who has access

3. **No Disruption**
   - All existing items remain accessible
   - Checked/unchecked status preserved
   - Categories, quantities, and notes unchanged
   - No re-login required

#### New Capabilities (After Migration)
1. **Create Multiple Lists**
   - "Weekly Shopping", "Party Supplies", "Hardware Store", etc.
   - Color-code lists for easy identification
   - Archive old lists to hide them

2. **Share Lists with Others**
   - Add family members, roommates, or colleagues
   - Set permissions (owner, editor, viewer)
   - Share via invite links or email

3. **Collaborate in Real-Time**
   - See updates from other list members instantly
   - Track who added or checked off items
   - Leave comments/activity on shared lists

### What Stays the Same
- Login credentials (username/password)
- All grocery items and their data
- Categories and filtering
- Bulk operations (check all, delete checked)
- Search and sorting functionality

---

## Auto-Migration Process

The migration is **fully automatic** and requires no user intervention.

### Migration Flow

```
┌─────────────────────────────────────────────────────────┐
│ 1. Backup Database (Administrator)                      │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│ 2. Run Migration Script                                 │
│    - Creates lists and list_members tables              │
│    - Adds list_id to grocery_items                      │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│ 3. For Each User:                                       │
│    a. Create "My Grocery List"                          │
│    b. Add user as list owner/admin                      │
│    c. Migrate all user's items to their list            │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│ 4. Verification                                         │
│    - Check all items have list_id                       │
│    - Verify no orphaned items                           │
│    - Confirm user memberships                           │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│ 5. Finalize                                             │
│    - Make list_id required (NOT NULL)                   │
│    - Create helper functions                            │
│    - Generate statistics report                         │
└─────────────────────────────────────────────────────────┘
```

### Default List Creation

**For each user, the migration automatically:**

1. Creates a list named "My Grocery List"
2. Sets the user as the list owner
3. Adds the user to `list_members` with 'admin' permission
4. Updates all their grocery items to reference the new list
5. Preserves all item data (quantity, category, checked status, etc.)

**Example:**
```sql
-- User: alice@example.com (id: 550e8400...)
-- Items: 15 grocery items

-- Migration creates:
List: "My Grocery List" (id: 7a3b8c...)
  Owner: alice@example.com
  Members: alice@example.com (admin)
  Items: 15 items migrated
```

---

## Database Migration Steps

### Prerequisites

1. **PostgreSQL Version:** 12.0 or higher
2. **Node.js Version:** 18.0 or higher (for migration tool)
3. **Database Access:** User with DDL permissions
4. **Dependencies Installed:** `npm install` in `/server` directory

### Pre-Migration Checklist

- [ ] **Backup database** (CRITICAL - see below)
- [ ] **Check PostgreSQL version:** `SELECT version();`
- [ ] **Verify disk space:** At least 2x current database size
- [ ] **Test on staging environment** (highly recommended)
- [ ] **Schedule maintenance window** (optional, migration is fast)
- [ ] **Notify users** (use template below)
- [ ] **Review migration script:** `server/migrations/004_migrate_to_lists.sql`
- [ ] **Prepare rollback script:** `server/migrations/rollback/004_revert_list_migration.sql`

### Step 1: Backup Database

**CRITICAL: Always backup before running migrations!**

```bash
# Full database backup (recommended)
pg_dump -h localhost -p 5432 -U grocery grocery_db \
  > backup_pre_migration_$(date +%Y%m%d_%H%M%S).sql

# Verify backup was created
ls -lh backup_pre_migration_*.sql

# Optional: Test backup restore on a test database
createdb grocery_test
psql -h localhost -U grocery grocery_test < backup_pre_migration_*.sql
```

**Alternative: Using Docker**
```bash
# Backup from Docker container
docker exec -t grocery-postgres pg_dump -U grocery grocery_db \
  > backup_pre_migration_$(date +%Y%m%d_%H%M%S).sql
```

### Step 2: Check Current State

Verify the current database state and gather statistics:

```bash
cd server

# Check migration status
npm run migrate:status

# Count existing users and items
psql -h localhost -U grocery -d grocery_db <<EOF
SELECT COUNT(*) as user_count FROM users;
SELECT COUNT(*) as item_count FROM grocery_items;
SELECT u.email, COUNT(gi.id) as item_count
FROM users u
LEFT JOIN grocery_items gi ON gi.user_id = u.id
GROUP BY u.email
ORDER BY item_count DESC;
EOF
```

**Expected output:**
```
user_count
-----------
         5

item_count
-----------
       142

     email          | item_count
--------------------+-----------
 alice@example.com  |        45
 bob@example.com    |        38
 charlie@example.com|        32
 ...
```

### Step 3: Run Migration

**Option A: Using NPM Script (Recommended)**

```bash
cd server

# Run migration
npm run migrate:up

# The script will:
# - Connect to database
# - Check for pending migrations
# - Run migration 004 in a transaction
# - Display progress and statistics
# - Automatically rollback on errors
```

**Option B: Direct SQL Execution**

```bash
psql -h localhost -p 5432 -U grocery -d grocery_db \
  -f server/migrations/004_migrate_to_lists.sql
```

### Step 4: Monitor Migration Progress

The migration provides detailed logging:

```
========================================
Starting Migration 004: Migrate to Lists
========================================
Found 5 users to migrate
Created default list for user: Alice (alice@example.com) - List ID: 7a3b8c...
  -> Migrated 45 items to list
Created default list for user: Bob (bob@example.com) - List ID: 9d4e1f...
  -> Migrated 38 items to list
...
========================================
Migration Summary:
  Users processed: 5
  New lists created: 5
  Items migrated: 142
========================================
Verification passed: All grocery items have been assigned to lists
========================================
```

### Step 5: Verify Migration Success

Run verification queries to ensure data integrity:

```bash
psql -h localhost -U grocery -d grocery_db <<EOF

-- Verify all users have default lists
SELECT u.email, COUNT(DISTINCT l.id) as list_count
FROM users u
LEFT JOIN lists l ON l.owner_id = u.id
GROUP BY u.email;

-- Verify all items have list_id
SELECT
  COUNT(*) as total_items,
  COUNT(list_id) as items_with_list,
  COUNT(*) - COUNT(list_id) as orphaned_items
FROM grocery_items;

-- Check list memberships
SELECT
  l.name as list_name,
  u.email as owner_email,
  lm.permission,
  COUNT(gi.id) as item_count
FROM lists l
JOIN users u ON l.owner_id = u.id
JOIN list_members lm ON lm.list_id = l.id AND lm.user_id = u.id
LEFT JOIN grocery_items gi ON gi.list_id = l.id
GROUP BY l.name, u.email, lm.permission
ORDER BY u.email;

-- Verify helper functions exist
\df user_has_list_access
\df get_user_list_permission
\df get_user_lists

EOF
```

**Expected Results:**
- All users have at least 1 list
- `orphaned_items = 0`
- All list owners have 'admin' permission
- Helper functions are created

---

## Verification Steps

### Automated Verification

The migration includes built-in verification that runs automatically:

1. **Orphan Check:** Ensures no items lack a `list_id`
2. **Membership Check:** Confirms all list owners are members
3. **Permission Check:** Validates permission constraints
4. **Function Check:** Verifies helper functions work

If any verification fails, the migration throws an error and rolls back automatically.

### Manual Post-Migration Testing

#### Test 1: User Login and List Access

```bash
# Test API access for a user
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "password123"
  }'

# Save the returned token, then get lists
curl -X GET http://localhost:3001/api/lists \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Expected response:
# {
#   "success": true,
#   "data": {
#     "lists": [
#       {
#         "id": "7a3b8c...",
#         "name": "My Grocery List",
#         "permission": "admin",
#         "itemCount": 45,
#         "memberCount": 1
#       }
#     ]
#   }
# }
```

#### Test 2: List Items Accessible

```bash
# Get items for the default list
curl -X GET "http://localhost:3001/api/items?listId=7a3b8c..." \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Expected: All user's items returned
```

#### Test 3: Sharing Functionality

```bash
# Add a member to a list (as owner)
curl -X POST http://localhost:3001/api/lists/7a3b8c.../members \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "550e8400...",
    "permission": "editor"
  }'

# Expected: Member added successfully
```

### Performance Testing

```bash
# Test query performance
psql -h localhost -U grocery -d grocery_db <<EOF

-- Should be fast with indexes
EXPLAIN ANALYZE
SELECT * FROM get_user_lists('550e8400-e29b-41d4-a716-446655440000');

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND tablename IN ('lists', 'list_members', 'grocery_items')
ORDER BY tablename, indexname;

EOF
```

---

## Potential Issues & Solutions

### Issue 1: Orphaned Items (Items Without user_id)

**Symptom:**
```
ERROR: Migration incomplete: Cannot proceed with orphaned items.
Found 3 orphaned grocery items without list_id!
```

**Cause:** Some items don't have a `user_id` (data integrity issue from before)

**Solution:**
```sql
-- Find orphaned items
SELECT * FROM grocery_items WHERE user_id IS NULL;

-- Option A: Assign to admin user
UPDATE grocery_items
SET user_id = (SELECT id FROM users WHERE email = 'admin@grocery.local' LIMIT 1)
WHERE user_id IS NULL;

-- Option B: Delete orphaned items (if invalid)
DELETE FROM grocery_items WHERE user_id IS NULL;

-- Then re-run migration
```

### Issue 2: Migration Takes Too Long

**Symptom:** Migration hangs or times out

**Cause:** Large number of users/items, slow disk I/O, or locks

**Solution:**
```bash
# Check active queries
psql -h localhost -U grocery -d grocery_db -c "
SELECT pid, query, state, wait_event_type
FROM pg_stat_activity
WHERE datname = 'grocery_db';
"

# If needed, increase statement timeout
psql -h localhost -U grocery -d grocery_db <<EOF
SET statement_timeout = '600s';
\i server/migrations/004_migrate_to_lists.sql
EOF
```

### Issue 3: Foreign Key Constraint Violations

**Symptom:**
```
ERROR: insert or update on table "grocery_items" violates foreign key constraint
```

**Cause:** Referenced user or list doesn't exist

**Solution:**
```sql
-- Check for invalid references
SELECT gi.id, gi.user_id, u.id as user_exists
FROM grocery_items gi
LEFT JOIN users u ON gi.user_id = u.id
WHERE u.id IS NULL;

-- Fix by assigning to valid user or removing item
-- Then re-run migration
```

### Issue 4: Duplicate List Names

**Symptom:** Multiple users have lists with the same name (not an error, but may confuse)

**Cause:** Migration creates "My Grocery List" for everyone

**Solution:** This is expected and not a problem. Users can rename their lists:
```sql
-- Rename a list
UPDATE lists
SET name = 'Alice''s Shopping List'
WHERE owner_id = (SELECT id FROM users WHERE email = 'alice@example.com')
  AND name = 'My Grocery List';
```

### Issue 5: Permission Denied Errors

**Symptom:**
```
ERROR: permission denied for table users
```

**Cause:** Database user lacks necessary permissions

**Solution:**
```sql
-- Grant permissions (as postgres superuser)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO grocery;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO grocery;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO grocery;
```

### Issue 6: Out of Disk Space

**Symptom:**
```
ERROR: could not extend file "base/16384/16389": No space left on device
```

**Cause:** Insufficient disk space for new tables and indexes

**Solution:**
```bash
# Check disk space
df -h /var/lib/postgresql/data

# Free up space or increase volume size
# Then re-run migration
```

### Issue 7: API Returns Empty Lists After Migration

**Symptom:** Users see no lists in the UI after migration

**Cause:**
- Frontend not updated to use new list-based API
- Token expired or authentication issue

**Solution:**
```bash
# Check if lists exist in database
psql -h localhost -U grocery -d grocery_db -c "
SELECT u.email, l.name, lm.permission
FROM users u
JOIN lists l ON l.owner_id = u.id
JOIN list_members lm ON lm.list_id = l.id AND lm.user_id = u.id;
"

# If lists exist but API returns empty:
# 1. Clear browser cache and refresh
# 2. Re-login to get new token
# 3. Check API endpoint is using correct query
# 4. Verify authentication middleware
```

---

## Rollback Procedure

### When to Rollback

Consider rollback if:
- Migration fails with unrecoverable errors
- Data corruption is detected
- Critical functionality is broken
- Performance is severely degraded

**WARNING:** Rollback will DELETE all lists and list memberships. Items are preserved but will revert to user-owned model.

### Rollback Steps

#### Step 1: Backup Current State (Post-Migration)

```bash
# Backup current state before rollback
pg_dump -h localhost -U grocery grocery_db \
  > backup_pre_rollback_$(date +%Y%m%d_%H%M%S).sql
```

#### Step 2: Execute Rollback

**Option A: Using NPM Script**
```bash
cd server
npm run migrate:down
```

**Option B: Direct SQL**
```bash
psql -h localhost -p 5432 -U grocery -d grocery_db \
  -f server/migrations/rollback/004_revert_list_migration.sql
```

#### Step 3: Verify Rollback Success

```bash
psql -h localhost -U grocery -d grocery_db <<EOF

-- Verify tables removed
\dt lists
\dt list_members

-- Should return: "No relations found"

-- Verify items still exist with user_id
SELECT COUNT(*) FROM grocery_items WHERE user_id IS NOT NULL;

-- Verify list_id column removed
\d grocery_items

EOF
```

#### Step 4: Restore Application Code

If you deployed application updates for list sharing, revert to previous version:

```bash
# Revert to previous git commit
git log --oneline -10  # Find commit before list sharing
git checkout <commit-hash>

# Or revert specific files
git checkout HEAD~1 -- server/lists/
git checkout HEAD~1 -- client/src/components/Lists/

# Rebuild and restart
npm run build
npm run start
```

### Rollback Impact

**What Gets Deleted:**
- All `lists` table data
- All `list_members` table data
- `list_id` column from `grocery_items`
- Helper functions for list access
- List-related indexes

**What Gets Preserved:**
- All grocery items
- User associations (`user_id` column)
- Item data (quantity, category, checked, etc.)
- User accounts and authentication

**Post-Rollback State:**
- Database returns to user-based item model
- Users access items via `user_id` only
- No sharing functionality
- Application reverts to pre-migration behavior

---

## User Communication Template

### Pre-Migration Announcement

**Email Subject:** Exciting Update: Shared Grocery Lists Coming Soon!

**Email Body:**

```
Hi [User Name],

We're excited to announce a new feature that will make your grocery shopping even easier: Shared Lists!

What's New?
-----------
Soon you'll be able to:
- Create multiple grocery lists (e.g., "Weekly Shopping", "Party Supplies")
- Share lists with family, friends, or roommates
- Collaborate in real-time - see updates instantly
- Set permissions (owner, editor, viewer)

What's Changing?
----------------
On [MIGRATION_DATE], we'll be upgrading our system. Here's what you need to know:

1. Your existing items will be safe and accessible
2. We'll automatically create a "My Grocery List" with all your current items
3. No action required from you - it's fully automatic
4. The migration will take approximately 5 minutes

During the Migration:
---------------------
- Date: [MIGRATION_DATE]
- Time: [MIGRATION_TIME] [TIMEZONE]
- Duration: ~5 minutes
- The app may be briefly unavailable

After the Migration:
--------------------
- All your items will be in "My Grocery List"
- You can create additional lists
- Try sharing a list with someone!

Need Help?
----------
Contact us at support@grocery.app or reply to this email.

Thanks for using [App Name]!
The [App Name] Team
```

### Post-Migration Announcement

**Email Subject:** Update Complete: Your Lists Are Ready!

**Email Body:**

```
Hi [User Name],

Great news! The list sharing feature is now live.

What's Ready:
-------------
✓ Your items are safely stored in "My Grocery List"
✓ You can now create multiple lists
✓ Sharing is enabled - invite others to your lists
✓ Real-time collaboration is active

Get Started:
------------
1. Log in to [App URL]
2. Check out your "My Grocery List" - all your items are there
3. Create a new list by clicking "Create List"
4. Share a list by clicking the "Share" button

New Features to Try:
--------------------
- Create separate lists for different stores or occasions
- Share your "Weekly Shopping" list with your household
- Set permissions: owner (full control), editor (can add items), viewer (read-only)
- Color-code your lists for easy identification
- Pin your favorite lists to the top

Need Help?
----------
Check out our guide: [LINK_TO_GUIDE]
Or contact support at support@grocery.app

Happy list-making!
The [App Name] Team

P.S. We'd love to hear your feedback on the new feature!
```

### Migration Issues Notification

**Email Subject:** [Action Required] Issue with Your Account Migration

**Email Body:**

```
Hi [User Name],

We encountered a minor issue during the recent system upgrade affecting your account.

What Happened?
--------------
During migration, we couldn't automatically move some of your items to lists.

Action Required:
----------------
Please log in and verify your grocery items are accessible:
1. Go to [App URL]
2. Check "My Grocery List"
3. If items are missing, contact us immediately

We're Here to Help:
-------------------
Priority support: support@grocery.app
Phone: [PHONE_NUMBER]
We'll respond within 1 hour.

We apologize for the inconvenience and are working to ensure all your data is safe.

Best regards,
The [App Name] Team
```

---

## FAQ

### General Questions

**Q: Will I lose any of my grocery items during the migration?**
A: No. All items are preserved and migrated to your default list. The migration includes verification steps to ensure no data loss.

**Q: Do I need to do anything before or after the migration?**
A: No. The migration is fully automatic. After migration, simply log in and continue using the app as normal.

**Q: How long will the migration take?**
A: Typically 1-5 minutes depending on database size. Large deployments (10,000+ users) may take up to 15 minutes.

**Q: Will the app be down during migration?**
A: We recommend a brief maintenance window, but the migration can run while the app is live with minimal impact.

### Data & Privacy

**Q: Who can see my grocery items after migration?**
A: Only you. Your items are in "My Grocery List" which only you can access until you choose to share it.

**Q: Can I keep my lists private?**
A: Yes. Lists are private by default. You control who has access by adding members explicitly.

**Q: What happens if I was already sharing items with someone informally?**
A: After migration, you can formally share your list with them using the new sharing feature.

### Technical Questions

**Q: What database version is required?**
A: PostgreSQL 12.0 or higher. Check with `SELECT version();`

**Q: Is the migration idempotent?**
A: Yes. You can safely re-run the migration multiple times. It checks for existing data and won't duplicate lists or items.

**Q: Can I rollback the migration?**
A: Yes. A rollback script is provided, but note that it will delete all lists and memberships (items are preserved).

**Q: What if I have a custom fork of the code?**
A: Review the migration script and adjust for your schema changes. Test thoroughly on a staging environment first.

### Using the New Features

**Q: How do I create a new list?**
A: Click "Create List" in the lists section, enter a name, and click "Create".

**Q: How do I share a list?**
A: Open the list, click "Share", enter the person's email (they must have an account), select their permission level, and click "Add Member".

**Q: What's the difference between owner, editor, and viewer?**
A:
- **Owner:** Full control - can add/edit/delete items, manage members, delete the list
- **Editor:** Can add, edit, and delete items, but can't manage members or settings
- **Viewer:** Read-only access - can see items but not make changes

**Q: Can I rename my default list?**
A: Yes. Open "My Grocery List", click settings/edit, change the name, and save.

**Q: What happens if I delete a shared list?**
A: Only the owner can delete a list. When deleted, all items in that list are permanently removed for all members.

**Q: Can I move items between lists?**
A: Yes. Select items, click "Move to List", choose the destination list.

### Troubleshooting

**Q: I don't see my items after migration. What should I do?**
A:
1. Refresh the page (Ctrl+R or Cmd+R)
2. Clear browser cache
3. Log out and log back in
4. If still missing, contact support immediately

**Q: The migration failed with an error. What now?**
A: The database automatically rolled back to the pre-migration state. Check the error log, fix the issue, and re-run the migration.

**Q: Performance seems slower after migration. Is this normal?**
A: There may be a brief slowdown immediately after migration. Run `ANALYZE` on the database to update query statistics. Performance should normalize within a few minutes.

**Q: I'm getting "permission denied" errors in the app.**
A: This may be a caching issue. Clear browser cache, log out, log back in. If it persists, verify the user's list membership in the database.

### Rollback Questions

**Q: If I rollback, will I lose data?**
A: Lists and memberships are deleted, but all grocery items are preserved with their original user associations.

**Q: Can I partially rollback (e.g., keep lists but remove sharing)?**
A: Not with the provided rollback script. You'd need to write custom SQL to selectively remove features.

**Q: After rollback, can I re-run the migration later?**
A: Yes. After fixing issues, you can re-run migration 004 again.

---

## Additional Resources

### Documentation
- [Migration README](/server/migrations/README.md) - Technical migration guide
- [List Sharing API](/docs/API-AUTH.md) - API endpoints for list operations
- [Permission System](/docs/PERMISSION_TESTS.md) - Understanding permissions
- [Security Guide](/docs/SECURITY.md) - Security best practices

### Scripts & Tools
- Migration script: `/server/migrations/004_migrate_to_lists.sql`
- Rollback script: `/server/migrations/rollback/004_revert_list_migration.sql`
- Migration tool: `/server/migrations/migrate.ts`

### Support Contacts
- Technical Issues: dev-team@grocery.app
- User Support: support@grocery.app
- Emergency Contact: [EMERGENCY_PHONE]

---

## Appendix

### Migration Statistics Example

```
========================================
Migration 004_migrate_to_lists completed successfully!
========================================
Final Database Statistics:
  Total users: 1,247
  Total lists: 1,247
  Total list members: 1,247
  Total grocery items: 18,432
  Orphaned items: 0
========================================
SUCCESS: All items successfully migrated to lists
========================================
What changed:
  - Each user now has a "My Grocery List" default list
  - All existing items assigned to their owner's list
  - list_id is now required on grocery_items
  - Helper functions created for list access control
========================================
```

### Database Schema Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                       USERS TABLE                           │
│  ┌────────────────────────────────────────────────────┐     │
│  │ id (UUID, PK)                                      │     │
│  │ email (VARCHAR, UNIQUE)                            │     │
│  │ name (VARCHAR)                                     │     │
│  │ password_hash (VARCHAR)                            │     │
│  │ created_at, updated_at (TIMESTAMP)                 │     │
│  └────────────────────────────────────────────────────┘     │
└──────────────────┬─────────────────────┬────────────────────┘
                   │                     │
                   │ owner_id            │ user_id
                   ▼                     ▼
┌──────────────────────────────┐   ┌────────────────────────┐
│      LISTS TABLE             │   │  LIST_MEMBERS TABLE    │
│ ┌──────────────────────────┐ │   │ ┌────────────────────┐ │
│ │ id (UUID, PK)            │ │   │ │ list_id (UUID, PK) │ │
│ │ name (VARCHAR)           │ │   │ │ user_id (UUID, PK) │ │
│ │ owner_id (UUID, FK)      │ │   │ │ permission (VARCHAR)│ │
│ │ color (VARCHAR)          │ │   │ │ joined_at (TIMESTAMP)│ │
│ │ icon (VARCHAR)           │ │   │ └────────────────────┘ │
│ │ created_at (TIMESTAMP)   │ │   └────────────────────────┘
│ │ updated_at (TIMESTAMP)   │ │              │
│ │ is_archived (BOOLEAN)    │ │              │ list_id
│ └──────────────────────────┘ │              │
└──────────────┬───────────────┘              │
               │ list_id                       │
               └───────────────┬───────────────┘
                               ▼
                  ┌─────────────────────────────┐
                  │   GROCERY_ITEMS TABLE       │
                  │ ┌─────────────────────────┐ │
                  │ │ id (UUID, PK)           │ │
                  │ │ list_id (UUID, FK)      │ │
                  │ │ user_id (UUID, FK)      │ │
                  │ │ name (VARCHAR)          │ │
                  │ │ quantity (VARCHAR)      │ │
                  │ │ category (VARCHAR)      │ │
                  │ │ gotten (BOOLEAN)        │ │
                  │ │ notes (TEXT)            │ │
                  │ │ created_at (TIMESTAMP)  │ │
                  │ └─────────────────────────┘ │
                  └─────────────────────────────┘
```

---

**Last Updated:** 2025-10-26
**Version:** 1.0.0
**Author:** System Migration Team
