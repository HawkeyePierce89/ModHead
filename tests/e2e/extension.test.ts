import puppeteer, { Browser, Page } from 'puppeteer';
import path from 'path';
import { spawn, ChildProcess } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EXTENSION_PATH = path.join(__dirname, '../../dist');
const TEST_SERVER_PORT = 3333;
const TEST_PAGE_URL = `http://localhost:${TEST_SERVER_PORT}/test-page.html`;

let browser: Browser | null = null;
let serverProcess: ChildProcess | null = null;

// Helper function to start test server
async function startTestServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log('Starting test server...');
    serverProcess = spawn('npx', ['tsx', 'tests/server/test-server.ts'], {
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
function stopTestServer(): void {
  if (serverProcess) {
    console.log('Stopping test server...');
    serverProcess.kill('SIGTERM');
    serverProcess = null;
  }
}

// Helper function to launch Chrome with extension
async function launchBrowserWithExtension(): Promise<Browser> {
  console.log('Launching Chrome with extension...');
  console.log('Extension path:', EXTENSION_PATH);

  // Try to find Chrome executable
  const executablePath = process.env.CHROME_BIN ||
                         process.env.PUPPETEER_EXEC_PATH ||
                         '/usr/bin/google-chrome-stable' ||
                         '/usr/bin/google-chrome' ||
                         '/usr/bin/chromium-browser' ||
                         '/usr/bin/chromium';

  const browser = await puppeteer.launch({
    headless: false, // Extensions require non-headless mode
    executablePath,
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`,
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  });

  return browser;
}

// Helper function to get extension ID
async function getExtensionId(browser: Browser): Promise<string> {
  const targets = await browser.targets();
  const extensionTarget = targets.find(
    target => target.type() === 'service_worker' && target.url().includes('chrome-extension://')
  );

  if (!extensionTarget) {
    throw new Error('Extension service worker not found');
  }

  const extensionUrl = extensionTarget.url();
  const extensionId = extensionUrl.split('/')[2];
  console.log('Extension ID:', extensionId);

  return extensionId;
}

// Helper function to configure extension rule
async function configureExtensionRule(
  page: Page,
  ruleName: string,
  targetDomain: string,
  matchType: string,
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

  // Fill in target domain (input with placeholder containing "api.example.com")
  await page.waitForSelector('input[placeholder*="api.example.com"]', { timeout: 3000 });
  await page.type('input[placeholder*="api.example.com"]', targetDomain);

  // Select match type for target domain (second select in the form)
  const selects = await page.$$('select');
  if (selects.length >= 2) {
    await selects[1].select(matchType);
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
    'localhost:3333',
    'startsWith',
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
    'localhost:3333',
    'startsWith',
    [
      { name: 'X-Test-Header', value: 'Value1' },
      { name: 'X-Modified-Header', value: 'Value2' }
    ]
  );

  const testPage = await browser.newPage();
  await testPage.goto(`${TEST_PAGE_URL}?autotest=true`);

  await testPage.waitForFunction(
    () => window.testResult !== null,
    { timeout: 10000 }
  );

  const result = await testPage.evaluate(() => window.testResult);

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
    'localhost:3333/api/test',
    'equals',
    [{ name: 'X-Custom-Header', value: 'EqualsTest' }]
  );

  const testPage = await browser.newPage();
  await testPage.goto(`${TEST_PAGE_URL}?autotest=true`);

  await testPage.waitForFunction(
    () => window.testResult !== null,
    { timeout: 10000 }
  );

  const result = await testPage.evaluate(() => window.testResult);

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
      }
    }

    // Summary
    console.log('\n=================================');
    console.log(`Tests Passed: ${testsPassed}`);
    console.log(`Tests Failed: ${testsFailed}`);
    console.log('=================================\n');

    if (testsFailed > 0) {
      process.exit(1);
    }

  } catch (error) {
    console.error('Fatal error during test execution:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  } finally {
    // Cleanup
    if (browser) {
      await browser.close();
    }
    stopTestServer();
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('Unhandled error:', error);
  if (browser) {
    browser.close();
  }
  stopTestServer();
  process.exit(1);
});

// Type declaration for window.testResult
declare global {
  interface Window {
    testResult: any;
  }
}
