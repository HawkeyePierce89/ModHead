import { spawn, ChildProcess } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let serverProcess: ChildProcess | null = null;

/**
 * Start the test server on port 3333
 */
export async function startTestServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log('Starting test server...');
    const tsxPath = path.join(__dirname, '../../node_modules/.bin/tsx');
    serverProcess = spawn(tsxPath, ['tests/server/test-server.ts'], {
      stdio: 'pipe',
      detached: false
    });

    serverProcess.stdout?.on('data', (data) => {
      const output = data.toString();
      console.log('[Server]', output);
      if (output.includes('Test server running')) {
        setTimeout(resolve, 1000); // Give server time to fully initialize
      }
    });

    serverProcess.stderr?.on('data', (data) => {
      console.error('[Server Error]', data.toString());
    });

    serverProcess.on('error', (error) => {
      reject(error);
    });

    // Timeout if server doesn't start
    setTimeout(() => {
      reject(new Error('Server failed to start within 10 seconds'));
    }, 10000);
  });
}

/**
 * Stop the test server
 */
export async function stopTestServer(): Promise<void> {
  if (!serverProcess) {
    return;
  }

  console.log('Stopping test server...');

  return new Promise((resolve) => {
    // Force kill after 5 seconds if graceful shutdown fails
    const timeout = setTimeout(() => {
      console.log('Server did not stop gracefully, forcing kill...');
      if (serverProcess) {
        serverProcess.kill('SIGKILL');
        serverProcess = null;
      }
      resolve();
    }, 5000);

    serverProcess!.once('exit', () => {
      clearTimeout(timeout);
      serverProcess = null;
      console.log('Test server stopped');
      resolve();
    });

    serverProcess!.kill('SIGTERM');
  });
}

/**
 * Get test server port
 */
export const TEST_SERVER_PORT = 3333;

/**
 * Get test page URL
 */
export const TEST_PAGE_URL = `http://localhost:${TEST_SERVER_PORT}/test-page.html`;
