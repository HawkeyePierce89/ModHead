/**
 * DEPRECATED: This file has been refactored into modular test files
 *
 * Please use the new test structure:
 * - tests/e2e/basic-headers.test.ts - Tests 1-3
 * - tests/e2e/variables.test.ts - Tests 4-7
 * - tests/e2e/auto-refresh.test.ts - Tests 8-15
 *
 * This file is kept for reference only and will be removed in a future version.
 */

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
  await page.waitForSelector('[data-testid="create-rule-button"]', { timeout: 5000 });

  // Click "Create Rule" button
  await page.click('[data-testid="create-rule-button"]');

  // Wait for modal to appear (check for the save button in the modal)
  await page.waitForSelector('[data-testid="save-rule-button"]', { timeout: 5000 });

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
    const domainInputs = await page.$$('[data-testid="target-domain-input"]');
    const domainSelects = await page.$$('select');

    if (domainInputs[i] && domainSelects[i]) {
      await domainInputs[i].type(domain.url);
      await domainSelects[i].select(domain.matchType);
    }
  }

  // Add headers
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];

    // Click "Add Header" button
    await page.click('[data-testid="add-header-button"]');

    // Wait a bit for the new input fields to appear
    await new Promise(resolve => setTimeout(resolve, 200));

    // Fill header name and value (find all header inputs)
    const headerNameInputs = await page.$$('[data-testid="header-name-input"]');
    const headerValueInputs = await page.$$('[data-testid="header-value-input"]');

    if (headerNameInputs[i] && headerValueInputs[i]) {
      await headerNameInputs[i].type(header.name);
      await headerValueInputs[i].type(header.value);
    }
  }

  // Click Create/Save button
  await page.click('[data-testid="save-rule-button"]');

  // Wait for modal to close (check that save button is gone)
  await page.waitForFunction(
    () => !document.querySelector('[data-testid="save-rule-button"]'),
    { timeout: 5000 }
  );

  console.log(`Rule "${ruleName}" configured successfully`);
}

// Helper function to configure variables
async function configureVariables(
  page: Page,
  variables: { name: string; value: string }[]
): Promise<void> {
  console.log(`Configuring ${variables.length} variable(s)`);

  for (const variable of variables) {
    // Click "Add Variable" button
    await page.click('[data-testid="add-variable-button"]');

    // Wait for input fields to appear
    await new Promise(resolve => setTimeout(resolve, 200));

    // Find the input fields by placeholder text
    const nameInput = await page.$('input[placeholder*="Variable name"]');
    const valueInput = await page.$('input[placeholder*="Variable value"]');

    if (!nameInput || !valueInput) {
      throw new Error('Variable input fields not found');
    }

    // Fill in variable name and value
    await nameInput.type(variable.name);
    await valueInput.type(variable.value);

    // Click Save button
    await page.click('[data-testid="save-variable-button"]');

    // Wait for edit form to close
    await page.waitForFunction(
      () => !document.querySelector('[data-testid="save-variable-button"]'),
      { timeout: 3000 }
    );

    console.log(`  Variable "${variable.name}" = "${variable.value}" configured`);
  }

  console.log('Variables configured successfully');
}

// Helper function to configure variable with refresh config
async function configureVariableWithRefresh(
  page: Page,
  variable: {
    name: string;
    value: string;
    refreshConfig: {
      url: string;
      method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
      headers?: { key: string; value: string }[];
      body?: string;
      transformResponse?: string;
    };
  }
): Promise<void> {
  console.log(`Configuring variable with refresh: ${variable.name}`);

  // Click "Add Variable" button
  await page.click('[data-testid="add-variable-button"]');

  // Wait for input fields to appear
  await new Promise(resolve => setTimeout(resolve, 200));

  // Fill in variable name and value
  const nameInput = await page.$('input[placeholder*="Variable name"]');
  const valueInput = await page.$('input[placeholder*="Variable value"]');

  if (!nameInput || !valueInput) {
    throw new Error('Variable input fields not found');
  }

  await nameInput.type(variable.name);
  await valueInput.type(variable.value);

  // Fill refresh URL
  const refreshUrlInput = await page.$('[data-testid="refresh-url-input"]');
  if (!refreshUrlInput) {
    throw new Error('Refresh URL input not found');
  }
  await refreshUrlInput.type(variable.refreshConfig.url);

  // Wait for conditional fields to appear
  await new Promise(resolve => setTimeout(resolve, 200));

  // Set HTTP method if specified
  if (variable.refreshConfig.method && variable.refreshConfig.method !== 'POST') {
    const methodSelect = await page.$('[data-testid="refresh-method-select"]');
    if (methodSelect) {
      await methodSelect.select(variable.refreshConfig.method);
    }
  }

  // Add headers if specified
  if (variable.refreshConfig.headers && variable.refreshConfig.headers.length > 0) {
    for (const header of variable.refreshConfig.headers) {
      // Click "Add Header" button
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const addHeaderBtn = buttons.find(btn => btn.textContent?.includes('+ Add Header'));
        addHeaderBtn?.click();
      });

      await new Promise(resolve => setTimeout(resolve, 200));

      // Find the last pair of header inputs
      const headerKeyInputs = await page.$$('input[placeholder*="Header name"]');
      const headerValueInputs = await page.$$('input[placeholder*="Header value"]');

      const lastKeyInput = headerKeyInputs[headerKeyInputs.length - 1];
      const lastValueInput = headerValueInputs[headerValueInputs.length - 1];

      if (lastKeyInput && lastValueInput) {
        await lastKeyInput.type(header.key);
        await lastValueInput.type(header.value);
      }
    }
  }

  // Fill request body if specified
  if (variable.refreshConfig.body) {
    const bodyTextarea = await page.$('[data-testid="refresh-body-textarea"]');
    if (bodyTextarea) {
      await bodyTextarea.type(variable.refreshConfig.body);
    }
  }

  // Fill transform response if specified
  if (variable.refreshConfig.transformResponse) {
    const transformInput = await page.$('[data-testid="transform-response-input"]');
    if (transformInput) {
      await transformInput.type(variable.refreshConfig.transformResponse);
    }
  }

  // Click Save button
  await page.click('[data-testid="save-variable-button"]');

  // Wait for edit form to close
  await page.waitForFunction(
    () => !document.querySelector('[data-testid="save-variable-button"]'),
    { timeout: 3000 }
  );

  console.log(`  Variable "${variable.name}" with refresh config configured`);
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
    throw new Error(
      `Test 1 FAILED: Expected X-Custom-Header: TestValue123, got: ${result.customHeaders['x-custom-header']}`
    );
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

// Test 4: Variable substitution - basic
async function test4_BasicVariableSubstitution(): Promise<void> {
  console.log('\n=== Test 4: Basic Variable Substitution ===');

  browser = await launchBrowserWithExtension();
  const extensionId = await getExtensionId(browser);

  const optionsPage = await browser.newPage();
  await optionsPage.goto(`chrome-extension://${extensionId}/options.html`);

  // Configure variable
  await configureVariables(optionsPage, [
    { name: 'authToken', value: 'secret123' }
  ]);

  // Configure rule using the variable
  await configureExtensionRule(
    optionsPage,
    'Variable Test Rule',
    [{ url: 'localhost:3333', matchType: 'startsWith' }],
    [{ name: 'X-Auth', value: 'Bearer ${authToken}' }]
  );

  const testPage = await browser.newPage();
  await testPage.goto(`${TEST_PAGE_URL}?autotest=true`);

  await testPage.waitForFunction(
    () => window.testResult !== null && window.testResult !== undefined,
    { timeout: 10000 }
  );

  const result = await testPage.evaluate(() => window.testResult);

  if (!result) {
    throw new Error('Test 4 FAILED: No test result received');
  }

  // Verify variable was substituted correctly
  if (result.customHeaders['x-auth'] === 'Bearer secret123') {
    console.log('✓ Test 4 PASSED: Variable substitution works correctly');
  } else {
    throw new Error(
      `Test 4 FAILED: Expected "Bearer secret123", got: "${result.customHeaders['x-auth']}"`
    );
  }

  await browser.close();
  browser = null;
}

// Test 5: Multiple variables in one value
async function test5_MultipleVariablesInValue(): Promise<void> {
  console.log('\n=== Test 5: Multiple Variables in One Value ===');

  browser = await launchBrowserWithExtension();
  const extensionId = await getExtensionId(browser);

  const optionsPage = await browser.newPage();
  await optionsPage.goto(`chrome-extension://${extensionId}/options.html`);

  // Configure multiple variables
  await configureVariables(optionsPage, [
    { name: 'prefix', value: 'test' },
    { name: 'suffix', value: 'value' }
  ]);

  // Configure rule using multiple variables in one header
  await configureExtensionRule(
    optionsPage,
    'Multi Variable Rule',
    [{ url: 'localhost:3333', matchType: 'startsWith' }],
    [{ name: 'X-Combined', value: '${prefix}-${suffix}' }]
  );

  const testPage = await browser.newPage();
  await testPage.goto(`${TEST_PAGE_URL}?autotest=true`);

  await testPage.waitForFunction(
    () => window.testResult !== null && window.testResult !== undefined,
    { timeout: 10000 }
  );

  const result = await testPage.evaluate(() => window.testResult);

  if (!result) {
    throw new Error('Test 5 FAILED: No test result received');
  }

  if (result.customHeaders['x-combined'] === 'test-value') {
    console.log('✓ Test 5 PASSED: Multiple variables substituted correctly');
  } else {
    throw new Error(
      `Test 5 FAILED: Expected "test-value", got: "${result.customHeaders['x-combined']}"`
    );
  }

  await browser.close();
  browser = null;
}

// Test 6: Undefined variable reference
async function test6_UndefinedVariable(): Promise<void> {
  console.log('\n=== Test 6: Undefined Variable Reference ===');

  browser = await launchBrowserWithExtension();
  const extensionId = await getExtensionId(browser);

  const optionsPage = await browser.newPage();
  await optionsPage.goto(`chrome-extension://${extensionId}/options.html`);

  // Configure rule with undefined variable (no variables configured)
  await configureExtensionRule(
    optionsPage,
    'Undefined Var Rule',
    [{ url: 'localhost:3333', matchType: 'startsWith' }],
    [{ name: 'X-Undefined', value: 'Value-${undefinedVar}-End' }]
  );

  const testPage = await browser.newPage();
  await testPage.goto(`${TEST_PAGE_URL}?autotest=true`);

  await testPage.waitForFunction(
    () => window.testResult !== null && window.testResult !== undefined,
    { timeout: 10000 }
  );

  const result = await testPage.evaluate(() => window.testResult);

  if (!result) {
    throw new Error('Test 6 FAILED: No test result received');
  }

  // Variable substitution should leave undefined variables as-is
  if (result.customHeaders['x-undefined'] === 'Value-${undefinedVar}-End') {
    console.log('✓ Test 6 PASSED: Undefined variable left as placeholder');
  } else {
    throw new Error(
      `Test 6 FAILED: Expected "Value-\${undefinedVar}-End", got: "${result.customHeaders['x-undefined']}"`
    );
  }

  await browser.close();
  browser = null;
}

// Test 7: Empty variable value
async function test7_EmptyVariableValue(): Promise<void> {
  console.log('\n=== Test 7: Empty Variable Value ===');

  browser = await launchBrowserWithExtension();
  const extensionId = await getExtensionId(browser);

  const optionsPage = await browser.newPage();
  await optionsPage.goto(`chrome-extension://${extensionId}/options.html`);

  // Configure variable with empty value
  await configureVariables(optionsPage, [
    { name: 'emptyVar', value: '' }
  ]);

  // Configure rule using the empty variable
  await configureExtensionRule(
    optionsPage,
    'Empty Var Rule',
    [{ url: 'localhost:3333', matchType: 'startsWith' }],
    [{ name: 'X-Empty', value: 'Before${emptyVar}After' }]
  );

  const testPage = await browser.newPage();
  await testPage.goto(`${TEST_PAGE_URL}?autotest=true`);

  await testPage.waitForFunction(
    () => window.testResult !== null && window.testResult !== undefined,
    { timeout: 10000 }
  );

  const result = await testPage.evaluate(() => window.testResult);

  if (!result) {
    throw new Error('Test 7 FAILED: No test result received');
  }

  // Empty variable should result in concatenation without the variable
  if (result.customHeaders['x-empty'] === 'BeforeAfter') {
    console.log('✓ Test 7 PASSED: Empty variable substituted correctly');
  } else {
    throw new Error(
      `Test 7 FAILED: Expected "BeforeAfter", got: "${result.customHeaders['x-empty']}"`
    );
  }

  await browser.close();
  browser = null;
}

// Test 8: Auto-refresh with basic GET and path extraction
async function test8_AutoRefreshBasicGET(): Promise<void> {
  console.log('\n=== Test 8: Auto-refresh with Basic GET and Path Extraction ===');

  browser = await launchBrowserWithExtension();
  const extensionId = await getExtensionId(browser);

  const optionsPage = await browser.newPage();
  await optionsPage.goto(`chrome-extension://${extensionId}/options.html`);

  // Configure variable with refresh config
  await configureVariableWithRefresh(optionsPage, {
    name: 'apiToken',
    value: 'initial_value',
    refreshConfig: {
      url: 'http://localhost:3333/auth/token-simple',
      method: 'GET',
      transformResponse: 'access_token'
    }
  });

  // Wait for the Refresh button to appear
  console.log('Waiting for Refresh button to appear...');
  await optionsPage.waitForSelector('[data-testid="refresh-variable-button"]', { timeout: 5000 });

  // Set up dialog handler to automatically accept the success alert
  optionsPage.on('dialog', async dialog => {
    console.log(`Dialog message: ${dialog.message()}`);
    await dialog.accept();
  });

  // Click the Refresh button
  console.log('Clicking Refresh button...');
  await optionsPage.click('[data-testid="refresh-variable-button"]');

  // Wait for refresh to complete (button changes back from "Refreshing..." to "Refresh")
  await optionsPage.waitForFunction(
    () => {
      const btn = document.querySelector('[data-testid="refresh-variable-button"]');
      return btn?.textContent === 'Refresh';
    },
    { timeout: 10000 }
  );

  // Wait a bit more for storage to update
  await new Promise(resolve => setTimeout(resolve, 500));

  // Verify the variable value was updated
  const updatedValue = await optionsPage.evaluate(() => {
    const variableElement = document.querySelector('code.text-\\[\\#27ae60\\]');
    return variableElement?.textContent || '';
  });

  console.log(`Updated value: ${updatedValue}`);

  // Check that value starts with "simple_token_" (since we use Date.now() in the token)
  if (updatedValue.startsWith('simple_token_')) {
    console.log('✓ Test 8 PASSED: Variable refreshed correctly with path extraction');
  } else {
    throw new Error(
      `Test 8 FAILED: Expected value to start with "simple_token_", got: "${updatedValue}"`
    );
  }

  await browser.close();
  browser = null;
}

// Test 9: Auto-refresh with POST and template transformation
async function test9_AutoRefreshPOSTWithTemplate(): Promise<void> {
  console.log('\n=== Test 9: Auto-refresh with POST and Template Transformation ===');

  browser = await launchBrowserWithExtension();
  const extensionId = await getExtensionId(browser);

  const optionsPage = await browser.newPage();
  await optionsPage.goto(`chrome-extension://${extensionId}/options.html`);

  // Configure variable with POST request and template transformation
  await configureVariableWithRefresh(optionsPage, {
    name: 'bearerToken',
    value: 'initial_value',
    refreshConfig: {
      url: 'http://localhost:3333/auth/token-post',
      method: 'POST',
      body: '{"username": "testuser", "password": "testpass"}',
      transformResponse: '{token_type} {access_token}'
    }
  });

  // Wait for the Refresh button to appear
  console.log('Waiting for Refresh button to appear...');
  await optionsPage.waitForSelector('[data-testid="refresh-variable-button"]', { timeout: 5000 });

  // Set up dialog handler to automatically accept the success alert
  optionsPage.on('dialog', async dialog => {
    console.log(`Dialog message: ${dialog.message()}`);
    await dialog.accept();
  });

  // Click the Refresh button
  console.log('Clicking Refresh button...');
  await optionsPage.click('[data-testid="refresh-variable-button"]');

  // Wait for refresh to complete
  await optionsPage.waitForFunction(
    () => {
      const btn = document.querySelector('[data-testid="refresh-variable-button"]');
      return btn?.textContent === 'Refresh';
    },
    { timeout: 10000 }
  );

  // Wait a bit for storage to update
  await new Promise(resolve => setTimeout(resolve, 500));

  // Verify the variable value was updated with template
  const updatedValue = await optionsPage.evaluate(() => {
    const variableElement = document.querySelector('code.text-\\[\\#27ae60\\]');
    return variableElement?.textContent || '';
  });

  console.log(`Updated value: ${updatedValue}`);

  // Check that value starts with "Bearer post_token_"
  if (updatedValue.startsWith('Bearer post_token_')) {
    console.log('✓ Test 9 PASSED: Variable refreshed with POST and template transformation');
  } else {
    throw new Error(
      `Test 9 FAILED: Expected value to start with "Bearer post_token_", got: "${updatedValue}"`
    );
  }

  await browser.close();
  browser = null;
}

// Test 10: Variable substitution in refresh URL
async function test10_VariableSubstitutionInURL(): Promise<void> {
  console.log('\n=== Test 10: Variable Substitution in Refresh URL ===');

  browser = await launchBrowserWithExtension();
  const extensionId = await getExtensionId(browser);

  const optionsPage = await browser.newPage();
  await optionsPage.goto(`chrome-extension://${extensionId}/options.html`);

  // First, create a variable for the base URL
  await configureVariables(optionsPage, [
    { name: 'baseUrl', value: 'http://localhost:3333' }
  ]);

  // Now create a variable with refresh config that uses ${baseUrl}
  await configureVariableWithRefresh(optionsPage, {
    name: 'dynamicToken',
    value: 'initial_value',
    refreshConfig: {
      url: '${baseUrl}/auth/token-simple',
      method: 'GET',
      transformResponse: 'access_token'
    }
  });

  // Wait for the Refresh button to appear
  console.log('Waiting for Refresh button to appear...');
  await optionsPage.waitForSelector('[data-testid="refresh-variable-button"]', { timeout: 5000 });

  // Set up dialog handler to automatically accept the success alert
  optionsPage.on('dialog', async dialog => {
    console.log(`Dialog message: ${dialog.message()}`);
    await dialog.accept();
  });

  // Click the Refresh button
  console.log('Clicking Refresh button...');
  await optionsPage.click('[data-testid="refresh-variable-button"]');

  // Wait for refresh to complete
  await optionsPage.waitForFunction(
    () => {
      const btn = document.querySelector('[data-testid="refresh-variable-button"]');
      return btn?.textContent === 'Refresh';
    },
    { timeout: 10000 }
  );

  // Wait a bit for storage to update
  await new Promise(resolve => setTimeout(resolve, 500));

  // Verify the variable value was updated
  const updatedValue = await optionsPage.evaluate(() => {
    // Find the second variable (dynamicToken) - the first one is baseUrl
    const variableElements = document.querySelectorAll('code.text-\\[\\#27ae60\\]');
    return variableElements[1]?.textContent || '';
  });

  console.log(`Updated value: ${updatedValue}`);

  // Check that value starts with "simple_token_"
  if (updatedValue.startsWith('simple_token_')) {
    console.log('✓ Test 10 PASSED: Variable substitution in URL works correctly');
  } else {
    throw new Error(
      `Test 10 FAILED: Expected value to start with "simple_token_", got: "${updatedValue}"`
    );
  }

  await browser.close();
  browser = null;
}

// Test 11: Nested path extraction with dot notation
async function test11_NestedPathExtraction(): Promise<void> {
  console.log('\n=== Test 11: Nested Path Extraction ===');

  browser = await launchBrowserWithExtension();
  const extensionId = await getExtensionId(browser);

  const optionsPage = await browser.newPage();
  await optionsPage.goto(`chrome-extension://${extensionId}/options.html`);

  // Configure variable with nested path extraction
  await configureVariableWithRefresh(optionsPage, {
    name: 'nestedToken',
    value: 'initial_value',
    refreshConfig: {
      url: 'http://localhost:3333/auth/token-nested',
      method: 'GET',
      transformResponse: 'data.token'
    }
  });

  // Wait for the Refresh button to appear
  console.log('Waiting for Refresh button to appear...');
  await optionsPage.waitForSelector('[data-testid="refresh-variable-button"]', { timeout: 5000 });

  // Set up dialog handler to automatically accept the success alert
  optionsPage.on('dialog', async dialog => {
    console.log(`Dialog message: ${dialog.message()}`);
    await dialog.accept();
  });

  // Click the Refresh button
  console.log('Clicking Refresh button...');
  await optionsPage.click('[data-testid="refresh-variable-button"]');

  // Wait for refresh to complete
  await optionsPage.waitForFunction(
    () => {
      const btn = document.querySelector('[data-testid="refresh-variable-button"]');
      return btn?.textContent === 'Refresh';
    },
    { timeout: 10000 }
  );

  // Wait a bit for storage to update
  await new Promise(resolve => setTimeout(resolve, 500));

  // Verify the variable value was updated
  const updatedValue = await optionsPage.evaluate(() => {
    const variableElement = document.querySelector('code.text-\\[\\#27ae60\\]');
    return variableElement?.textContent || '';
  });

  console.log(`Updated value: ${updatedValue}`);

  // Check that value starts with "nested_token_"
  if (updatedValue.startsWith('nested_token_')) {
    console.log('✓ Test 11 PASSED: Nested path extraction works correctly');
  } else {
    throw new Error(
      `Test 11 FAILED: Expected value to start with "nested_token_", got: "${updatedValue}"`
    );
  }

  await browser.close();
  browser = null;
}

// Test 12: Template with multiple fields
async function test12_TemplateMultipleFields(): Promise<void> {
  console.log('\n=== Test 12: Template with Multiple Fields ===');

  browser = await launchBrowserWithExtension();
  const extensionId = await getExtensionId(browser);

  const optionsPage = await browser.newPage();
  await optionsPage.goto(`chrome-extension://${extensionId}/options.html`);

  // Configure variable with complex template transformation
  await configureVariableWithRefresh(optionsPage, {
    name: 'complexToken',
    value: 'initial_value',
    refreshConfig: {
      url: 'http://localhost:3333/auth/token-complex',
      method: 'GET',
      transformResponse: 'Token: {data.access_token} (expires in {data.expires_in}s)'
    }
  });

  // Wait for the Refresh button to appear
  console.log('Waiting for Refresh button to appear...');
  await optionsPage.waitForSelector('[data-testid="refresh-variable-button"]', { timeout: 5000 });

  // Set up dialog handler to automatically accept the success alert
  optionsPage.on('dialog', async dialog => {
    console.log(`Dialog message: ${dialog.message()}`);
    await dialog.accept();
  });

  // Click the Refresh button
  console.log('Clicking Refresh button...');
  await optionsPage.click('[data-testid="refresh-variable-button"]');

  // Wait for refresh to complete
  await optionsPage.waitForFunction(
    () => {
      const btn = document.querySelector('[data-testid="refresh-variable-button"]');
      return btn?.textContent === 'Refresh';
    },
    { timeout: 10000 }
  );

  // Wait a bit for storage to update
  await new Promise(resolve => setTimeout(resolve, 500));

  // Verify the variable value was updated
  const updatedValue = await optionsPage.evaluate(() => {
    const variableElement = document.querySelector('code.text-\\[\\#27ae60\\]');
    return variableElement?.textContent || '';
  });

  console.log(`Updated value: ${updatedValue}`);

  // Check that value matches the expected template format
  if (updatedValue.startsWith('Token: complex_token_') && updatedValue.includes('(expires in 3600s)')) {
    console.log('✓ Test 12 PASSED: Template with multiple fields works correctly');
  } else {
    throw new Error(
      `Test 12 FAILED: Expected value to match template format, got: "${updatedValue}"`
    );
  }

  await browser.close();
  browser = null;
}

// Test 13: No transform - full response
async function test13_NoTransformFullResponse(): Promise<void> {
  console.log('\n=== Test 13: No Transform - Full Response ===');

  browser = await launchBrowserWithExtension();
  const extensionId = await getExtensionId(browser);

  const optionsPage = await browser.newPage();
  await optionsPage.goto(`chrome-extension://${extensionId}/options.html`);

  // Configure variable WITHOUT transformResponse - should return full JSON response
  await configureVariableWithRefresh(optionsPage, {
    name: 'fullResponse',
    value: 'initial_value',
    refreshConfig: {
      url: 'http://localhost:3333/auth/token-simple',
      method: 'GET',
      // NO transformResponse specified
    }
  });

  // Wait for the Refresh button to appear
  console.log('Waiting for Refresh button to appear...');
  await optionsPage.waitForSelector('[data-testid="refresh-variable-button"]', { timeout: 5000 });

  // Set up dialog handler to automatically accept the success alert
  optionsPage.on('dialog', async dialog => {
    console.log(`Dialog message: ${dialog.message()}`);
    await dialog.accept();
  });

  // Click the Refresh button
  console.log('Clicking Refresh button...');
  await optionsPage.click('[data-testid="refresh-variable-button"]');

  // Wait for refresh to complete
  await optionsPage.waitForFunction(
    () => {
      const btn = document.querySelector('[data-testid="refresh-variable-button"]');
      return btn?.textContent === 'Refresh';
    },
    { timeout: 10000 }
  );

  // Wait a bit for storage to update
  await new Promise(resolve => setTimeout(resolve, 500));

  // Verify the variable value was updated with full JSON response
  const updatedValue = await optionsPage.evaluate(() => {
    const variableElement = document.querySelector('code.text-\\[\\#27ae60\\]');
    return variableElement?.textContent || '';
  });

  console.log(`Updated value: ${updatedValue}`);

  // The value should be a JSON string containing the full response
  // Expected format: {"access_token":"simple_token_...","expires_in":3600}
  try {
    const parsed = JSON.parse(updatedValue);
    if (parsed.access_token && parsed.access_token.startsWith('simple_token_') && parsed.expires_in === 3600) {
      console.log('✓ Test 13 PASSED: Full response returned when no transform specified');
    } else {
      throw new Error(
        `Test 13 FAILED: Expected full JSON response with access_token and expires_in, got: "${updatedValue}"`
      );
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('Test 13 FAILED')) {
      throw error;
    }
    const errorMsg = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Test 13 FAILED: Expected valid JSON response, got: "${updatedValue}". ` +
      `Parse error: ${errorMsg}`
    );
  }

  await browser.close();
  browser = null;
}

// Test 14: HTTP error handling
async function test14_HTTPErrorHandling(): Promise<void> {
  console.log('\n=== Test 14: HTTP Error Handling ===');

  browser = await launchBrowserWithExtension();
  const extensionId = await getExtensionId(browser);

  const optionsPage = await browser.newPage();
  await optionsPage.goto(`chrome-extension://${extensionId}/options.html`);

  // Configure variable with error endpoint (returns 401)
  await configureVariableWithRefresh(optionsPage, {
    name: 'errorToken',
    value: 'initial_value',
    refreshConfig: {
      url: 'http://localhost:3333/auth/token-error',
      method: 'GET',
      transformResponse: 'access_token'
    }
  });

  // Wait for the Refresh button to appear
  console.log('Waiting for Refresh button to appear...');
  await optionsPage.waitForSelector('[data-testid="refresh-variable-button"]', { timeout: 5000 });

  // Set up dialog handler to capture the error alert
  let dialogMessage = '';
  optionsPage.on('dialog', async dialog => {
    dialogMessage = dialog.message();
    console.log(`Dialog message: ${dialogMessage}`);
    await dialog.accept();
  });

  // Click the Refresh button
  console.log('Clicking Refresh button...');
  await optionsPage.click('[data-testid="refresh-variable-button"]');

  // Wait for refresh to complete (button text changes back to "Refresh")
  await optionsPage.waitForFunction(
    () => {
      const btn = document.querySelector('[data-testid="refresh-variable-button"]');
      return btn?.textContent === 'Refresh';
    },
    { timeout: 10000 }
  );

  // Wait a bit for storage to update (or not update in this case)
  await new Promise(resolve => setTimeout(resolve, 500));

  // Verify the variable value was NOT updated (should still be initial_value)
  const updatedValue = await optionsPage.evaluate(() => {
    const variableElement = document.querySelector('code.text-\\[\\#27ae60\\]');
    return variableElement?.textContent || '';
  });

  console.log(`Variable value after error: ${updatedValue}`);
  console.log(`Dialog was shown: ${dialogMessage ? 'Yes' : 'No'}`);

  // Check that:
  // 1. An error dialog was shown
  // 2. The variable value remains unchanged
  if (dialogMessage.includes('Failed to refresh variable') && updatedValue === 'initial_value') {
    console.log('✓ Test 14 PASSED: HTTP errors are handled correctly');
  } else {
    throw new Error(
      `Test 14 FAILED: Expected error dialog and unchanged value. Dialog: "${dialogMessage}", Value: "${updatedValue}"`
    );
  }

  await browser.close();
  browser = null;
}

// Test 15: Variable substitution in headers and body
async function test15_VariableSubstitutionInHeadersAndBody(): Promise<void> {
  console.log('\n=== Test 15: Variable Substitution in Headers and Body ===');

  browser = await launchBrowserWithExtension();
  const extensionId = await getExtensionId(browser);

  const optionsPage = await browser.newPage();
  await optionsPage.goto(`chrome-extension://${extensionId}/options.html`);

  // First, create variables that will be used in headers and body
  await configureVariables(optionsPage, [
    { name: 'apiKey', value: 'test-api-key-12345' },
    { name: 'username', value: 'testuser' },
    { name: 'password', value: 'testpass' }
  ]);

  // Now create a variable with refresh config that uses variables in headers and body
  await configureVariableWithRefresh(optionsPage, {
    name: 'authToken',
    value: 'initial_value',
    refreshConfig: {
      url: 'http://localhost:3333/auth/token-post',
      method: 'POST',
      headers: [
        { key: 'X-API-Key', value: '${apiKey}' },
        { key: 'X-Test-Header', value: 'test-value' }
      ],
      body: '{"username": "${username}", "password": "${password}"}',
      transformResponse: 'access_token'
    }
  });

  // Wait for the Refresh button to appear
  console.log('Waiting for Refresh button to appear...');
  await optionsPage.waitForSelector('[data-testid="refresh-variable-button"]', { timeout: 5000 });

  // Set up dialog handler to automatically accept the success alert
  optionsPage.on('dialog', async dialog => {
    console.log(`Dialog message: ${dialog.message()}`);
    await dialog.accept();
  });

  // Click the Refresh button
  console.log('Clicking Refresh button...');
  await optionsPage.click('[data-testid="refresh-variable-button"]');

  // Wait for refresh to complete
  await optionsPage.waitForFunction(
    () => {
      const btn = document.querySelector('[data-testid="refresh-variable-button"]');
      return btn?.textContent === 'Refresh';
    },
    { timeout: 10000 }
  );

  // Wait a bit for storage to update
  await new Promise(resolve => setTimeout(resolve, 500));

  // Verify the variable value was updated (the last variable in the list)
  const updatedValue = await optionsPage.evaluate(() => {
    const variableElements = document.querySelectorAll('code.text-\\[\\#27ae60\\]');
    // authToken is the 4th variable (after apiKey, username, password)
    return variableElements[3]?.textContent || '';
  });

  console.log(`Updated value: ${updatedValue}`);

  // Check that value starts with "post_token_" which means the server received
  // the substituted values correctly
  if (updatedValue.startsWith('post_token_')) {
    console.log('✓ Test 15 PASSED: Variable substitution in headers and body works correctly');
  } else {
    throw new Error(
      `Test 15 FAILED: Expected value to start with "post_token_", got: "${updatedValue}"`
    );
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

    // Run all tests for regression check
    const tests = [
      test1_BasicHeaderAddition,
      test2_MultipleHeaders,
      test3_MatchTypeEquals,
      test4_BasicVariableSubstitution,
      test5_MultipleVariablesInValue,
      test6_UndefinedVariable,
      test7_EmptyVariableValue,
      test8_AutoRefreshBasicGET,
      test9_AutoRefreshPOSTWithTemplate,
      test10_VariableSubstitutionInURL,
      test11_NestedPathExtraction,
      test12_TemplateMultipleFields,
      test13_NoTransformFullResponse,
      test14_HTTPErrorHandling,
      test15_VariableSubstitutionInHeadersAndBody,
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
    'x-auth': string | null;
    'x-combined': string | null;
    'x-undefined': string | null;
    'x-empty': string | null;
  };
  error?: string;
}

declare global {
  interface Window {
    testResult: TestResult | null;
  }
}
