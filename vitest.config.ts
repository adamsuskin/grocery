import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // Use jsdom environment for React component testing
    environment: 'jsdom',

    // Setup files run before each test file
    setupFiles: ['./tests/auth/setup.ts'],

    // Make test utilities available globally
    globals: true,

    // Coverage configuration
    coverage: {
      provider: 'c8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData.ts',
        '**/mocks.ts',
        'server/**', // Exclude server code from client test coverage
      ],
      // Coverage thresholds
      lines: 85,
      branches: 80,
      functions: 85,
      statements: 85,
    },

    // Test file patterns
    include: ['tests/**/*.{test,spec}.{ts,tsx}'],
    exclude: [
      'node_modules',
      'dist',
      '.idea',
      '.git',
      '.cache',
      '**/node_modules/**',
    ],

    // Timeouts
    testTimeout: 10000, // 10 seconds
    hookTimeout: 10000,

    // Reporters
    reporter: process.env.CI ? ['dot', 'json'] : ['verbose', 'html'],

    // Mock behavior
    clearMocks: true,
    restoreMocks: true,
    mockReset: true,

    // Retry failed tests (useful for flaky tests)
    retry: process.env.CI ? 2 : 0,

    // Isolation
    isolate: true,

    // Threading
    threads: true,
    maxThreads: 4,
    minThreads: 1,

    // Update snapshots with --update flag
    update: process.env.UPDATE_SNAPSHOTS === 'true',
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tests': path.resolve(__dirname, './tests'),
      '@server': path.resolve(__dirname, './server'),
    },
  },
});
