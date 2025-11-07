import puppeteer, { Browser, Page } from 'puppeteer';
import path from 'node:path';
import { spawn, ChildProcess } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EXTENSION_PATH = path.join(__dirname, '../../dist');
const TEST_SERVER_PORT = 3333;
const TEST_PAGE_URL = `http://localhost:${TEST_SERVER_PORT}/test-page.html`;
const DEBUG_MODE = process.env.DEBUG === 'true';
// Headless mode: default true, disabled in DEBUG mode or if HEADLESS=false
const HEADLESS_MODE = !DEBUG_MODE && process.env.HEADLESS !== 'false';

let browser: Browser | null = null;
let serverProcess: ChildProcess | null = null;

// Helper function to start test server
async function startTestServer(): Promise<void> {
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

// Helper function to stop test server
async function stopTestServer(): Promise<void> {
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

// Helper function to find Chrome executable
function findChromeExecutable(): string | undefined {
  // Check environment variables first
  if (process.env.CHROME_BIN) return process.env.CHROME_BIN;
  if (process.env.PUPPETEER_EXEC_PATH) return process.env.PUPPETEER_EXEC_PATH;

  const platform = process.platform;
  const possiblePaths: string[] = [];

  if (platform === 'darwin') {
    // macOS
    possiblePaths.push(
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary'
    );
  } else if (platform === 'linux') {
    // Linux
    possiblePaths.push(
      '/usr/bin/google-chrome-stable',
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      '/snap/bin/chromium'
    );
  } else if (platform === 'win32') {
    // Windows
    possiblePaths.push(
      'C:/Program Files/Google/Chrome/Application/chrome.exe',
      'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
      process.env.LOCALAPPDATA + '/Google/Chrome/Application/chrome.exe'
    );
  }

  // Check which path exists
  for (const chromePath of possiblePaths) {
    if (chromePath && fs.existsSync(chromePath)) {
      return chromePath;
    }
  }

  return undefined;
}

// Helper function to launch Chrome with extension
async function launchBrowserWithExtension(): Promise<Browser> {
  console.log('Launching Browser with extension...');
  console.log('Extension path:', EXTENSION_PATH);
  console.log('Platform:', process.platform);

  // Try to use Puppeteer's bundled Chromium first
  let executablePath = undefined;
  let browserType = 'Puppeteer Chromium';

  // Only use local Chrome if explicitly requested
  if (process.env.USE_LOCAL_CHROME === 'true') {
    executablePath = findChromeExecutable();
    if (!executablePath) {
      throw new Error(
        'Chrome executable not found. Please install Chrome or set CHROME_BIN environment variable.\n' +
        'For macOS: export CHROME_BIN="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"'
      );
    }
    browserType = 'Local Chrome';
  }

  console.log('Using:', browserType);
  if (executablePath) {
    console.log('Executable path:', executablePath);
  }
  console.log('Headless mode:', HEADLESS_MODE ? 'enabled' : 'disabled');

  const browser = await puppeteer.launch({
    headless: HEADLESS_MODE, // Headless mode works with extensions in modern Chrome
    executablePath, // undefined = use Puppeteer's Chromium
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`,
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--enable-logging=stderr', // Enable Chrome logging
      '--v=1', // Verbose logging level
      '--disable-default-apps', // Disable default apps
      '--disable-blink-features=AutomationControlled', // Hide automation
    ],
  });

  console.log('Browser launched successfully');

  // Set up console message capturing from service workers
  browser.on('targetcreated', async (target) => {
    if (target.type() === 'service_worker') {
      console.log(`[Browser] Service worker created: ${target.url()}`);
      try {
        const worker = await target.worker();
        if (worker) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          worker.on('console', (msg: any) => {
            const type = msg.type();
            const text = msg.text();
            console.log(`[Service Worker ${type}]`, text);
          });
        }
      } catch (e) {
        console.log(`[Browser] Could not attach to service worker:`, e instanceof Error ? e.message : String(e));
      }
    }
  });

  // Give Chrome a moment to initialize the extension
  console.log('Waiting for extension to initialize...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  return browser;
}

// Helper function to get extension ID
async function getExtensionId(browser: Browser): Promise<string> {
  console.log('Waiting for extension to load...');

  // Try opening options page directly first - this is more reliable
  console.log('Attempting to find extension by opening chrome://extensions page...');

  // Wait for service worker to register (up to 15 seconds)
  const maxAttempts = 30;
  const delayMs = 500;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const targets = await browser.targets();

    // Debug: show all targets periodically
    if (attempt === 1 || attempt % 5 === 0) {
      console.log(`[Attempt ${attempt}/${maxAttempts}] Available targets:`);
      targets.forEach(target => {
        console.log(`  - Type: ${target.type()}, URL: ${target.url()}`);
      });
    }

    // Look for service worker (preferred)
    const extensionTarget = targets.find(
      target => target.type() === 'service_worker' && target.url().includes('chrome-extension://')
    );

    if (extensionTarget) {
      const extensionUrl = extensionTarget.url();
      const extensionId = extensionUrl.split('/')[2];
      console.log(`✓ Extension service worker found! ID: ${extensionId}`);
      console.log(`  Service worker URL: ${extensionUrl}`);
      return extensionId;
    }

    // Alternative: look for any chrome-extension:// target (options page, popup, etc.)
    const anyExtensionTarget = targets.find(target =>
      target.url().includes('chrome-extension://')
    );

    if (anyExtensionTarget) {
      const extensionUrl = anyExtensionTarget.url();
      const extensionId = extensionUrl.split('/')[2];
      console.log(`⚠ Extension found via non-service-worker target! ID: ${extensionId}`);
      console.log(`  Target type: ${anyExtensionTarget.type()}, URL: ${extensionUrl}`);

      // Try to open options page to trigger service worker
      if (attempt <= 5) {
        try {
          console.log('  Attempting to open options page to trigger service worker...');
          const optionsPage = await browser.newPage();
          await optionsPage.goto(`chrome-extension://${extensionId}/options.html`, {
            waitUntil: 'networkidle0',
            timeout: 5000
          });
          console.log('  Options page opened successfully');
          await optionsPage.close();
        } catch (e) {
          console.log(`  Failed to open options page: ${e instanceof Error ? e.message : String(e)}`);
        }
      }

      // After attempt 5, accept the extension ID even without service worker
      if (attempt >= 5) {
        console.log(`  Proceeding with extension ID despite no service worker detected`);
        return extensionId;
      }

      console.log('  Waiting for service worker to initialize...');
      await new Promise(resolve => setTimeout(resolve, delayMs));
      continue;
    }

    if (attempt < maxAttempts) {
      console.log(`Attempt ${attempt}/${maxAttempts}: Extension not found yet, waiting...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  throw new Error(
    'Extension not found after 15 seconds.\n' +
    'Make sure the extension built correctly: npm run build\n' +
    'Check that dist/ contains manifest.json and background.js\n' +
    'Try running with DEBUG=true to keep browser open: DEBUG=true npm run test:e2e\n' +
    'The browser window will remain open for debugging.'
  );
}

// Helper function to configure extension rule
async function configureExtensionRule(
  page: Page,
  ruleName: string,
  targetDomains: { url: string; matchType: string }[],
  headers: { name: string; value: string }[]
): Promise<void> {
  console.log(`Configuring rule: ${ruleName}`);

  // Wait for page to load
  await page.waitForSelector('.btn-primary', { timeout: 5000 });

  // Click "Create Rule" button by evaluating and clicking
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const createButton = buttons.find(btn => btn.textContent?.includes('Create Rule'));
    createButton?.click();
  });

  // Wait for modal to appear
  await page.waitForSelector('.modal', { timeout: 5000 });

  // Fill in rule name (first input with placeholder "e.g. API Headers")
  await page.waitForSelector('input[placeholder*="API Headers"]', { timeout: 3000 });
  await page.type('input[placeholder*="API Headers"]', ruleName);

  // Add target domains
  for (let i = 0; i < targetDomains.length; i++) {
    const domain = targetDomains[i];

    // Click "Add Target Domain" button
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addDomainBtn = buttons.find(btn => btn.textContent?.includes('Add Target Domain'));
      addDomainBtn?.click();
    });

    // Wait a bit for the new input fields to appear
    await new Promise(resolve => setTimeout(resolve, 200));

    // Fill domain URL and select match type (find all domain inputs)
    const domainInputs = await page.$$('input[placeholder*="api.example.com"]');
    const domainSelects = await page.$$('.domain-item select');

    if (domainInputs[i] && domainSelects[i]) {
      await domainInputs[i].type(domain.url);
      await domainSelects[i].select(domain.matchType);
    }
  }

  // Add headers
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];

    // Click "Add Header" button
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addHeaderBtn = buttons.find(btn => btn.textContent?.includes('Add Header'));
      addHeaderBtn?.click();
    });

    // Wait a bit for the new input fields to appear
    await new Promise(resolve => setTimeout(resolve, 200));

    // Fill header name and value (find all header inputs)
    const headerNameInputs = await page.$$('input[placeholder="Header name"]');
    const headerValueInputs = await page.$$('input[placeholder="Value"]');

    if (headerNameInputs[i] && headerValueInputs[i]) {
      await headerNameInputs[i].type(header.name);
      await headerValueInputs[i].type(header.value);
    }
  }

  // Click Create/Save button
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button[type="submit"]'));
    const saveButton = buttons.find(btn =>
      btn.textContent?.includes('Create') || btn.textContent?.includes('Save')
    ) as HTMLButtonElement | undefined;
    saveButton?.click();
  });

  // Wait for modal to close
  await page.waitForFunction(
    () => !document.querySelector('.modal'),
    { timeout: 5000 }
  );

  console.log(`Rule "${ruleName}" configured successfully`);
}

// Test 1: Basic header addition
async function test1_BasicHeaderAddition(): Promise<void> {
  console.log('\n=== Test 1: Basic Header Addition ===');

  browser = await launchBrowserWithExtension();
  const extensionId = await getExtensionId(browser);

  // Open options page
  const optionsPage = await browser.newPage();
  await optionsPage.goto(`chrome-extension://${extensionId}/options.html`);

  // Configure rule to add X-Custom-Header
  await configureExtensionRule(
    optionsPage,
    'Test Rule 1',
    [{ url: 'localhost:3333', matchType: 'startsWith' }],
    [{ name: 'X-Custom-Header', value: 'TestValue123' }]
  );

  // Open test page and make request
  const testPage = await browser.newPage();
  await testPage.goto(`${TEST_PAGE_URL}?autotest=true`);

  // Wait for request to complete
  await testPage.waitForFunction(
    () => window.testResult !== null && window.testResult !== undefined,
    { timeout: 10000 }
  );

  // Get result
  const result = await testPage.evaluate(() => window.testResult);

  if (!result) {
    throw new Error('Test 1 FAILED: No test result received');
  }

  // Verify header was added
  if (result.customHeaders['x-custom-header'] === 'TestValue123') {
    console.log('✓ Test 1 PASSED: Custom header was added correctly');
  } else {
    throw new Error(`Test 1 FAILED: Expected X-Custom-Header: TestValue123, got: ${result.customHeaders['x-custom-header']}`);
  }

  await browser.close();
  browser = null;
}

// Test 2: Multiple headers
async function test2_MultipleHeaders(): Promise<void> {
  console.log('\n=== Test 2: Multiple Headers ===');

  browser = await launchBrowserWithExtension();
  const extensionId = await getExtensionId(browser);

  const optionsPage = await browser.newPage();
  await optionsPage.goto(`chrome-extension://${extensionId}/options.html`);

  // Configure rule with multiple headers
  await configureExtensionRule(
    optionsPage,
    'Multi Header Rule',
    [{ url: 'localhost:3333', matchType: 'startsWith' }],
    [
      { name: 'X-Test-Header', value: 'Value1' },
      { name: 'X-Modified-Header', value: 'Value2' }
    ]
  );

  const testPage = await browser.newPage();
  await testPage.goto(`${TEST_PAGE_URL}?autotest=true`);

  await testPage.waitForFunction(
    () => window.testResult !== null && window.testResult !== undefined,
    { timeout: 10000 }
  );

  const result = await testPage.evaluate(() => window.testResult);

  if (!result) {
    throw new Error('Test 2 FAILED: No test result received');
  }

  if (
    result.customHeaders['x-test-header'] === 'Value1' &&
    result.customHeaders['x-modified-header'] === 'Value2'
  ) {
    console.log('✓ Test 2 PASSED: Multiple headers added correctly');
  } else {
    throw new Error('Test 2 FAILED: Multiple headers not added correctly');
  }

  await browser.close();
  browser = null;
}

// Test 3: Match type equals
async function test3_MatchTypeEquals(): Promise<void> {
  console.log('\n=== Test 3: Match Type Equals ===');

  browser = await launchBrowserWithExtension();
  const extensionId = await getExtensionId(browser);

  const optionsPage = await browser.newPage();
  await optionsPage.goto(`chrome-extension://${extensionId}/options.html`);

  // Configure rule with equals match
  await configureExtensionRule(
    optionsPage,
    'Equals Match Rule',
    [{ url: 'localhost:3333/api/test', matchType: 'equals' }],
    [{ name: 'X-Custom-Header', value: 'EqualsTest' }]
  );

  const testPage = await browser.newPage();
  await testPage.goto(`${TEST_PAGE_URL}?autotest=true`);

  await testPage.waitForFunction(
    () => window.testResult !== null && window.testResult !== undefined,
    { timeout: 10000 }
  );

  const result = await testPage.evaluate(() => window.testResult);

  if (!result) {
    throw new Error('Test 3 FAILED: No test result received');
  }

  if (result.customHeaders['x-custom-header'] === 'EqualsTest') {
    console.log('✓ Test 3 PASSED: Equals match type works correctly');
  } else {
    throw new Error('Test 3 FAILED: Equals match type did not work');
  }

  await browser.close();
  browser = null;
}

// Main test runner
async function runAllTests(): Promise<void> {
  let testsPassed = 0;
  let testsFailed = 0;

  console.log('Starting E2E tests for ModHead extension...\n');

  if (DEBUG_MODE) {
    console.log('🐛 DEBUG MODE ENABLED');
    console.log('Browser will stay open on errors for inspection');
    console.log('Headless mode is disabled in DEBUG mode\n');
  } else {
    console.log(`Running in ${HEADLESS_MODE ? 'headless' : 'visible'} mode\n`);
  }

  try {
    // Start test server
    await startTestServer();

    // Run tests
    const tests = [
      test1_BasicHeaderAddition,
      test2_MultipleHeaders,
      test3_MatchTypeEquals,
    ];

    for (const test of tests) {
      try {
        await test();
        testsPassed++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`\n✗ Test failed:`, errorMessage);
        testsFailed++;

        if (DEBUG_MODE) {
          console.log('\n⚠️  DEBUG MODE: Browser will remain open for inspection');
          console.log('Press Ctrl+C to exit when done');
          // Wait indefinitely in debug mode
          await new Promise(() => {});
        }
      }
    }

    // Summary
    console.log('\n=================================');
    console.log(`Tests Passed: ${testsPassed}`);
    console.log(`Tests Failed: ${testsFailed}`);
    console.log('=================================\n');

  } catch (error) {
    console.error('Fatal error during test execution:', error instanceof Error ? error.message : String(error));
    testsFailed = 1; // Mark as failed
  } finally {
    // Cleanup - always runs before exit
    if (browser && !DEBUG_MODE) {
      await browser.close();
    }
    await stopTestServer();
  }

  // Exit after cleanup
  if (testsFailed > 0) {
    if (DEBUG_MODE) {
      console.log('⚠️  DEBUG MODE: Keeping browser open for inspection');
      console.log('Press Ctrl+C to exit when done');
      await new Promise(() => {});
    }
    process.exit(1);
  } else {
    // All tests passed - explicitly exit to ensure process terminates
    process.exit(0);
  }
}

// Run tests
runAllTests().catch(async (error) => {
  console.error('Unhandled error:', error);
  if (browser) {
    await browser.close();
  }
  await stopTestServer();
  process.exit(1);
});

// Type declaration for window.testResult
interface TestResult {
  success?: boolean;
  headers?: Record<string, string | string[] | undefined>;
  customHeaders: {
    'x-custom-header': string | null;
    'x-test-header': string | null;
    'x-modified-header': string | null;
  };
  error?: string;
}

declare global {
  interface Window {
    testResult: TestResult | null;
  }
}
