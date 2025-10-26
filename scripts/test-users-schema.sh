#!/bin/bash

# Test script for users schema
# This script verifies that the users table was created correctly

set -e

echo "Testing Users Schema Installation..."
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Database connection details
DB_USER="grocery"
DB_NAME="grocery_db"
DOCKER_CMD="docker compose exec -T postgres psql -U $DB_USER -d $DB_NAME"

# Test 1: Check if users table exists
echo "Test 1: Checking if users table exists..."
if $DOCKER_CMD -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users');" | grep -q "t"; then
    echo -e "${GREEN}✓ Users table exists${NC}"
else
    echo -e "${RED}✗ Users table not found${NC}"
    exit 1
fi

# Test 2: Check if uuid-ossp extension is installed
echo "Test 2: Checking if uuid-ossp extension is installed..."
if $DOCKER_CMD -c "SELECT EXISTS (SELECT FROM pg_extension WHERE extname = 'uuid-ossp');" | grep -q "t"; then
    echo -e "${GREEN}✓ uuid-ossp extension installed${NC}"
else
    echo -e "${RED}✗ uuid-ossp extension not found${NC}"
    exit 1
fi

# Test 3: Check table structure
echo "Test 3: Verifying table structure..."
COLUMNS=$($DOCKER_CMD -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position;" | grep -E '(id|username|email|password_hash|created_at|updated_at|last_login|is_active|email_verified)' | wc -l)
if [ "$COLUMNS" -eq 9 ]; then
    echo -e "${GREEN}✓ All 9 columns present${NC}"
else
    echo -e "${RED}✗ Expected 9 columns, found $COLUMNS${NC}"
    exit 1
fi

# Test 4: Check indexes
echo "Test 4: Verifying indexes..."
INDEX_COUNT=$($DOCKER_CMD -c "SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'users';" | grep -E '^[0-9]+$')
if [ "$INDEX_COUNT" -ge 6 ]; then
    echo -e "${GREEN}✓ Found $INDEX_COUNT indexes${NC}"
else
    echo -e "${RED}✗ Expected at least 6 indexes, found $INDEX_COUNT${NC}"
    exit 1
fi

# Test 5: Check triggers
echo "Test 5: Verifying triggers..."
TRIGGER_COUNT=$($DOCKER_CMD -c "SELECT COUNT(*) FROM information_schema.triggers WHERE event_object_table = 'users';" | grep -E '^[0-9]+$')
if [ "$TRIGGER_COUNT" -ge 2 ]; then
    echo -e "${GREEN}✓ Found $TRIGGER_COUNT triggers${NC}"
else
    echo -e "${RED}✗ Expected at least 2 triggers, found $TRIGGER_COUNT${NC}"
    exit 1
fi

# Test 6: Test email lowercase trigger
echo "Test 6: Testing email lowercase trigger..."
$DOCKER_CMD -c "INSERT INTO users (username, email, password_hash) VALUES ('test_lowercase', 'TEST@EXAMPLE.COM', 'hash123');" > /dev/null 2>&1
EMAIL=$($DOCKER_CMD -c "SELECT email FROM users WHERE username = 'test_lowercase';" | grep -E '^[a-z@.]+$')
$DOCKER_CMD -c "DELETE FROM users WHERE username = 'test_lowercase';" > /dev/null 2>&1
if [ "$EMAIL" = "test@example.com" ]; then
    echo -e "${GREEN}✓ Email lowercase trigger works${NC}"
else
    echo -e "${RED}✗ Email lowercase trigger failed${NC}"
    exit 1
fi

# Test 7: Test updated_at trigger
echo "Test 7: Testing updated_at trigger..."
$DOCKER_CMD -c "INSERT INTO users (username, email, password_hash) VALUES ('test_update', 'test@example.com', 'hash123');" > /dev/null 2>&1
sleep 1
$DOCKER_CMD -c "UPDATE users SET username = 'test_update2' WHERE username = 'test_update';" > /dev/null 2>&1
TIMESTAMPS=$($DOCKER_CMD -c "SELECT created_at != updated_at FROM users WHERE username = 'test_update2';" | grep -E '^t$')
$DOCKER_CMD -c "DELETE FROM users WHERE username = 'test_update2';" > /dev/null 2>&1
if [ "$TIMESTAMPS" = "t" ]; then
    echo -e "${GREEN}✓ updated_at trigger works${NC}"
else
    echo -e "${RED}✗ updated_at trigger failed${NC}"
    exit 1
fi

# Test 8: Test username constraint
echo "Test 8: Testing username length constraint..."
if $DOCKER_CMD -c "INSERT INTO users (username, email, password_hash) VALUES ('ab', 'test2@example.com', 'hash123');" 2>&1 | grep -q "username_length"; then
    echo -e "${GREEN}✓ Username length constraint works${NC}"
else
    echo -e "${RED}✗ Username length constraint failed${NC}"
    exit 1
fi

# Test 9: Test unique email constraint
echo "Test 9: Testing unique email constraint..."
$DOCKER_CMD -c "INSERT INTO users (username, email, password_hash) VALUES ('unique_test1', 'unique@test.com', 'hash123');" > /dev/null 2>&1
if $DOCKER_CMD -c "INSERT INTO users (username, email, password_hash) VALUES ('unique_test2', 'unique@test.com', 'hash123');" 2>&1 | grep -q "unique"; then
    echo -e "${GREEN}✓ Unique email constraint works${NC}"
else
    echo -e "${RED}✗ Unique email constraint failed${NC}"
fi
$DOCKER_CMD -c "DELETE FROM users WHERE email = 'unique@test.com';" > /dev/null 2>&1

# Test 10: Test UUID generation
echo "Test 10: Testing UUID generation..."
$DOCKER_CMD -c "INSERT INTO users (username, email, password_hash) VALUES ('uuid_test', 'uuid@test.com', 'hash123');" > /dev/null 2>&1
UUID=$($DOCKER_CMD -c "SELECT id FROM users WHERE username = 'uuid_test';" | grep -E '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
$DOCKER_CMD -c "DELETE FROM users WHERE username = 'uuid_test';" > /dev/null 2>&1
if [ -n "$UUID" ]; then
    echo -e "${GREEN}✓ UUID generation works${NC}"
else
    echo -e "${RED}✗ UUID generation failed${NC}"
    exit 1
fi

echo ""
echo "===================================="
echo -e "${GREEN}All tests passed! ✓${NC}"
echo "===================================="
echo ""
echo "The users schema is correctly installed and working."
