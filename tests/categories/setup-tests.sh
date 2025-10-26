#!/bin/bash

# Setup script for custom category tests
# This script installs necessary dependencies and configures the test environment

set -e

echo "🧪 Setting up Custom Category Tests..."
echo ""

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is not installed"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

echo "📦 Installing test dependencies..."
echo ""

# Install Vitest and related tools
npm install --save-dev vitest@latest @vitest/ui@latest

# Install React Testing Library
npm install --save-dev @testing-library/react@latest \
  @testing-library/user-event@latest \
  @testing-library/jest-dom@latest

# Install jsdom for DOM testing
npm install --save-dev jsdom@latest

# Install coverage tool
npm install --save-dev @vitest/coverage-v8@latest

echo ""
echo "✅ Dependencies installed successfully!"
echo ""

# Add test scripts to package.json if not present
echo "📝 Adding test scripts to package.json..."

# Check if test script exists
if ! grep -q '"test"' package.json; then
    # Create a temporary file
    TMP_FILE=$(mktemp)

    # Add test scripts before the closing brace of scripts section
    sed '/"scripts": {/,/}/ {
        /"scripts": {/! {
            /}/i\    "test": "vitest",\
    "test:categories": "vitest tests/categories",\
    "test:watch": "vitest --watch",\
    "test:ui": "vitest --ui",\
    "test:coverage": "vitest --coverage"
        }
    }' package.json > "$TMP_FILE"

    mv "$TMP_FILE" package.json
    echo "✅ Test scripts added to package.json"
else
    echo "ℹ️  Test scripts already exist in package.json"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "You can now run tests with:"
echo "  npm test                    # Run all tests"
echo "  npm run test:categories     # Run category tests only"
echo "  npm run test:watch          # Run in watch mode"
echo "  npm run test:ui             # Open test UI"
echo "  npm run test:coverage       # Run with coverage"
echo ""
echo "Or use npx directly:"
echo "  npx vitest tests/categories"
echo ""
