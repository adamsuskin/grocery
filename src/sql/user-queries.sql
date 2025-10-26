-- Common User Queries for JWT Authentication
-- This file contains frequently used SQL queries for user management

-- =====================================================
-- USER REGISTRATION
-- =====================================================

-- Create new user
-- Parameters: $1=username, $2=email, $3=password_hash
INSERT INTO users (username, email, password_hash)
VALUES ($1, $2, $3)
RETURNING id, username, email, created_at, is_active;

-- Check if username exists
SELECT EXISTS(
  SELECT 1 FROM users WHERE username = $1
) AS username_exists;

-- Check if email exists
SELECT EXISTS(
  SELECT 1 FROM users WHERE email = LOWER($1)
) AS email_exists;

-- =====================================================
-- USER LOGIN
-- =====================================================

-- Get user by email for authentication
-- Parameters: $1=email
SELECT
  id,
  username,
  email,
  password_hash,
  is_active,
  email_verified
FROM users
WHERE email = LOWER($1) AND is_active = true;

-- Get user by username for authentication
-- Parameters: $1=username
SELECT
  id,
  username,
  email,
  password_hash,
  is_active,
  email_verified
FROM users
WHERE username = $1 AND is_active = true;

-- Update last login timestamp
-- Parameters: $1=user_id
UPDATE users
SET last_login = CURRENT_TIMESTAMP
WHERE id = $1;

-- =====================================================
-- USER PROFILE
-- =====================================================

-- Get user profile by ID
-- Parameters: $1=user_id
SELECT
  id,
  username,
  email,
  created_at,
  updated_at,
  last_login,
  is_active,
  email_verified
FROM users
WHERE id = $1;

-- Get user profile by username
-- Parameters: $1=username
SELECT
  id,
  username,
  email,
  created_at,
  last_login,
  email_verified
FROM users
WHERE username = $1 AND is_active = true;

-- =====================================================
-- USER UPDATE
-- =====================================================

-- Update username
-- Parameters: $1=new_username, $2=user_id
UPDATE users
SET username = $1
WHERE id = $2
RETURNING id, username, email, updated_at;

-- Update email
-- Parameters: $1=new_email, $2=user_id
UPDATE users
SET email = LOWER($1), email_verified = false
WHERE id = $2
RETURNING id, username, email, updated_at;

-- Update password
-- Parameters: $1=new_password_hash, $2=user_id
UPDATE users
SET password_hash = $1
WHERE id = $2
RETURNING id, updated_at;

-- Verify email
-- Parameters: $1=user_id
UPDATE users
SET email_verified = true
WHERE id = $1
RETURNING id, email, email_verified;

-- =====================================================
-- ACCOUNT MANAGEMENT
-- =====================================================

-- Deactivate user account
-- Parameters: $1=user_id
UPDATE users
SET is_active = false
WHERE id = $1
RETURNING id, username, is_active;

-- Reactivate user account
-- Parameters: $1=user_id
UPDATE users
SET is_active = true
WHERE id = $1
RETURNING id, username, is_active;

-- Delete user account (soft delete alternative: use deactivate instead)
-- Parameters: $1=user_id
DELETE FROM users
WHERE id = $1;

-- =====================================================
-- ADMIN QUERIES
-- =====================================================

-- Get all users (with pagination)
-- Parameters: $1=limit, $2=offset
SELECT
  id,
  username,
  email,
  created_at,
  last_login,
  is_active,
  email_verified
FROM users
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- Count total users
SELECT COUNT(*) as total_users FROM users;

-- Count active users
SELECT COUNT(*) as active_users FROM users WHERE is_active = true;

-- Get recently registered users (last 7 days)
SELECT
  id,
  username,
  email,
  created_at
FROM users
WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '7 days'
ORDER BY created_at DESC;

-- Get inactive users
SELECT
  id,
  username,
  email,
  last_login
FROM users
WHERE last_login < CURRENT_TIMESTAMP - INTERVAL '30 days'
  OR last_login IS NULL
ORDER BY last_login DESC NULLS LAST;

-- Get users without verified email
SELECT
  id,
  username,
  email,
  created_at
FROM users
WHERE email_verified = false
ORDER BY created_at DESC;

-- =====================================================
-- ANALYTICS QUERIES
-- =====================================================

-- User registration stats by month
SELECT
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as registrations
FROM users
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- Active users in last 24 hours
SELECT COUNT(*) as active_last_24h
FROM users
WHERE last_login >= CURRENT_TIMESTAMP - INTERVAL '24 hours';

-- User activity statistics
SELECT
  COUNT(*) as total_users,
  COUNT(CASE WHEN is_active THEN 1 END) as active_users,
  COUNT(CASE WHEN email_verified THEN 1 END) as verified_emails,
  COUNT(CASE WHEN last_login >= CURRENT_TIMESTAMP - INTERVAL '7 days' THEN 1 END) as active_last_week,
  COUNT(CASE WHEN last_login >= CURRENT_TIMESTAMP - INTERVAL '30 days' THEN 1 END) as active_last_month
FROM users;

-- =====================================================
-- SECURITY QUERIES
-- =====================================================

-- Find duplicate emails (should be none due to unique constraint)
SELECT email, COUNT(*) as count
FROM users
GROUP BY email
HAVING COUNT(*) > 1;

-- Find users with same username (should be none)
SELECT username, COUNT(*) as count
FROM users
GROUP BY username
HAVING COUNT(*) > 1;

-- Check for accounts created from same IP (requires additional ip_address column)
-- This is a placeholder for when you add IP tracking
-- SELECT ip_address, COUNT(*) as account_count
-- FROM users
-- GROUP BY ip_address
-- HAVING COUNT(*) > 5;
