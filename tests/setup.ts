/**
 * Global test setup for Vitest
 * Starts and stops the test server for all tests
 */
import { startTestServer, stopTestServer } from './helpers/server.js';

// Global setup - runs once before all test files
export async function setup() {
  console.log('\n=== Starting E2E Test Suite ===\n');

  const DEBUG_MODE = process.env.DEBUG === 'true';
  const HEADLESS_MODE = !DEBUG_MODE && process.env.HEADLESS !== 'false';

  if (DEBUG_MODE) {
    console.log('🐛 DEBUG MODE ENABLED');
    console.log('Browser will stay open on errors for inspection');
    console.log('Headless mode is disabled in DEBUG mode\n');
  } else {
    console.log(`Running in ${HEADLESS_MODE ? 'headless' : 'visible'} mode\n`);
  }

  await startTestServer();

  return async () => {
    // Teardown - runs once after all test files
    console.log('\n=== Test Suite Complete ===\n');
    await stopTestServer();
  };
}
