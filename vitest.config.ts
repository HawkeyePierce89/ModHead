import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Global setup file
    globalSetup: './tests/setup.ts',

    // Test timeout (30 seconds per test, 60 seconds for hooks)
    testTimeout: 30000,
    hookTimeout: 60000,

    // Run tests sequentially to avoid browser conflicts
    // Each test file launches its own browser instance
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 1,
        minThreads: 1
      }
    },

    // Test file patterns
    include: ['tests/e2e/**/*.test.ts'],

    // Disable file parallelization within a single file
    // Each test will run in sequence
    sequence: {
      concurrent: false
    },

    // Reporter
    reporters: ['verbose'],

    // Coverage (optional)
    coverage: {
      enabled: false
    }
  }
});
