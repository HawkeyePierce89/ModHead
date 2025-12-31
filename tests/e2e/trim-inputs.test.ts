/**
 * E2E Tests for Input Trimming Functionality
 * Tests that whitespace is properly trimmed from inputs where expected,
 * and warnings are shown for values that are intentionally not trimmed.
 */
import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { Browser } from 'puppeteer';
import { launchBrowserWithExtension, getExtensionId } from '../helpers/browser.js';
import { TEST_PAGE_URL } from '../helpers/server.js';
import { configureExtensionRule, configureVariables } from '../helpers/config.js';
import { TestResult } from '../helpers/types.js';

let browser: Browser | null = null;

beforeEach(async () => {
  browser = await launchBrowserWithExtension();
});

afterEach(async () => {
  if (browser) {
    await browser.close();
    browser = null;
  }
});

describe('Input Trimming', () => {
  test('should trim whitespace from target domain URL', async () => {
    const extensionId = await getExtensionId(browser!);

    const optionsPage = await browser!.newPage();
    await optionsPage.goto(`chrome-extension://${extensionId}/options.html`);

    // Configure rule with spaces in target domain
    await configureExtensionRule(
      optionsPage,
      'Trim Domain Test',
      [{ url: '  localhost:3333  ', matchType: 'startsWith' }],
      [{ name: 'X-Custom-Header', value: 'TrimTest' }]
    );

    // Open test page and make request
    const testPage = await browser!.newPage();
    await testPage.goto(`${TEST_PAGE_URL}?autotest=true`);

    await testPage.waitForFunction(
      () => window.testResult !== null && window.testResult !== undefined,
      { timeout: 10000 }
    );

    const result = await testPage.evaluate(() => window.testResult) as TestResult;

    // Should work because the domain URL was trimmed
    expect(result).toBeDefined();
    expect(result.customHeaders['x-custom-header']).toBe('TrimTest');
  }, 30000);

  test('should trim whitespace from header name', async () => {
    const extensionId = await getExtensionId(browser!);

    const optionsPage = await browser!.newPage();
    await optionsPage.goto(`chrome-extension://${extensionId}/options.html`);

    // Configure rule with spaces in header name
    await configureExtensionRule(
      optionsPage,
      'Trim Header Name Test',
      [{ url: 'localhost:3333', matchType: 'startsWith' }],
      [{ name: '  X-Custom-Header  ', value: 'HeaderNameTrimTest' }]
    );

    const testPage = await browser!.newPage();
    await testPage.goto(`${TEST_PAGE_URL}?autotest=true`);

    await testPage.waitForFunction(
      () => window.testResult !== null && window.testResult !== undefined,
      { timeout: 10000 }
    );

    const result = await testPage.evaluate(() => window.testResult) as TestResult;

    // Header name should be trimmed - check lowercase as HTTP headers are case-insensitive
    expect(result).toBeDefined();
    expect(result.customHeaders['x-custom-header']).toBe('HeaderNameTrimTest');
  }, 30000);

  test('header value whitespace is trimmed by browser HTTP layer (per RFC 7230)', async () => {
    const extensionId = await getExtensionId(browser!);

    const optionsPage = await browser!.newPage();
    await optionsPage.goto(`chrome-extension://${extensionId}/options.html`);

    // Configure rule with spaces in header value
    // Note: We don't trim in our code, but Chrome's HTTP layer trims per RFC 7230
    await configureExtensionRule(
      optionsPage,
      'Header Value HTTP Trim Test',
      [{ url: 'localhost:3333', matchType: 'startsWith' }],
      [{ name: 'X-Custom-Header', value: '  ValueWithSpaces  ' }]
    );

    const testPage = await browser!.newPage();
    await testPage.goto(`${TEST_PAGE_URL}?autotest=true`);

    await testPage.waitForFunction(
      () => window.testResult !== null && window.testResult !== undefined,
      { timeout: 10000 }
    );

    const result = await testPage.evaluate(() => window.testResult) as TestResult;

    // Per HTTP spec (RFC 7230 Section 3.2.6), browsers trim leading/trailing
    // whitespace from header values. This is expected behavior.
    expect(result).toBeDefined();
    expect(result.customHeaders['x-custom-header']).toBe('ValueWithSpaces');
  }, 30000);

  test('should trim variable name for substitution to work', async () => {
    const extensionId = await getExtensionId(browser!);

    const optionsPage = await browser!.newPage();
    await optionsPage.goto(`chrome-extension://${extensionId}/options.html`);

    // Configure variable with spaces in name and value
    await configureVariables(optionsPage, [
      { name: '  myToken  ', value: '  secret123  ' }
    ]);

    // Configure rule using the variable (with trimmed name)
    await configureExtensionRule(
      optionsPage,
      'Variable Trim Test',
      [{ url: 'localhost:3333', matchType: 'startsWith' }],
      [{ name: 'X-Auth', value: '${myToken}' }]
    );

    const testPage = await browser!.newPage();
    await testPage.goto(`${TEST_PAGE_URL}?autotest=true`);

    await testPage.waitForFunction(
      () => window.testResult !== null && window.testResult !== undefined,
      { timeout: 10000 }
    );

    const result = await testPage.evaluate(() => window.testResult) as TestResult;

    // Variable name was trimmed, so ${myToken} should work
    // Note: Variable value may contain spaces in storage, but HTTP layer trims
    expect(result).toBeDefined();
    expect(result.customHeaders['x-auth']).toBe('secret123');
  }, 30000);

  test('should handle multiple fields with whitespace simultaneously', async () => {
    const extensionId = await getExtensionId(browser!);

    const optionsPage = await browser!.newPage();
    await optionsPage.goto(`chrome-extension://${extensionId}/options.html`);

    // Configure rule with spaces in multiple fields
    await configureExtensionRule(
      optionsPage,
      '  Trim All Test  ',  // Rule name with spaces
      [{ url: '  localhost:3333  ', matchType: 'startsWith' }],  // Domain with spaces
      [
        { name: '  X-Test-Header  ', value: '  TestValue  ' },  // Name and value with spaces
        { name: '  X-Custom-Header  ', value: 'NoSpaces' }
      ]
    );

    const testPage = await browser!.newPage();
    await testPage.goto(`${TEST_PAGE_URL}?autotest=true`);

    await testPage.waitForFunction(
      () => window.testResult !== null && window.testResult !== undefined,
      { timeout: 10000 }
    );

    const result = await testPage.evaluate(() => window.testResult) as TestResult;

    expect(result).toBeDefined();
    // Header names are trimmed by our code, values trimmed by HTTP layer
    expect(result.customHeaders['x-test-header']).toBe('TestValue');
    expect(result.customHeaders['x-custom-header']).toBe('NoSpaces');
  }, 30000);
});

describe('Whitespace Warning UI', () => {
  test('should show warning when header value has whitespace', async () => {
    const extensionId = await getExtensionId(browser!);

    const optionsPage = await browser!.newPage();
    await optionsPage.goto(`chrome-extension://${extensionId}/options.html`);

    // Open rule editor
    await optionsPage.waitForSelector('[data-testid="create-rule-button"]', { timeout: 5000 });
    await new Promise(resolve => setTimeout(resolve, 200));
    await optionsPage.evaluate(() => {
      const button = document.querySelector('[data-testid="create-rule-button"]') as HTMLElement;
      button?.click();
    });
    await optionsPage.waitForSelector('[data-testid="save-rule-button"]', { timeout: 5000 });

    // Add a header
    await optionsPage.click('[data-testid="add-header-button"]');
    await new Promise(resolve => setTimeout(resolve, 200));

    // Type header name
    const headerNameInputs = await optionsPage.$$('[data-testid="header-name-input"]');
    await headerNameInputs[0].type('X-Test');

    // Type header value with spaces
    const headerValueInputs = await optionsPage.$$('[data-testid="header-value-input"]');
    await headerValueInputs[0].type('  value with spaces  ');

    // Wait a bit for state update
    await new Promise(resolve => setTimeout(resolve, 100));

    // Check for warning message
    const warning = await optionsPage.$('[data-testid="header-value-whitespace-warning"]');
    expect(warning).not.toBeNull();

    const warningText = await optionsPage.evaluate(
      el => el?.textContent,
      warning
    );
    expect(warningText).toContain('leading or trailing spaces');
  }, 30000);

  test('should show warning when variable value has whitespace', async () => {
    const extensionId = await getExtensionId(browser!);

    const optionsPage = await browser!.newPage();
    await optionsPage.goto(`chrome-extension://${extensionId}/options.html`);

    // Click add variable button
    await optionsPage.waitForSelector('[data-testid="add-variable-button"]', { timeout: 5000 });
    await optionsPage.click('[data-testid="add-variable-button"]');
    await new Promise(resolve => setTimeout(resolve, 200));

    // Type variable name
    const nameInput = await optionsPage.$('input[placeholder*="Variable name"]');
    await nameInput!.type('testVar');

    // Type variable value with spaces
    const valueInput = await optionsPage.$('input[placeholder*="Variable value"]');
    await valueInput!.type('  value with spaces  ');

    // Wait a bit for state update
    await new Promise(resolve => setTimeout(resolve, 100));

    // Check for warning message
    const warning = await optionsPage.$('[data-testid="variable-value-whitespace-warning"]');
    expect(warning).not.toBeNull();

    const warningText = await optionsPage.evaluate(
      el => el?.textContent,
      warning
    );
    expect(warningText).toContain('leading or trailing spaces');
  }, 30000);

  test('should not show warning when value has no whitespace', async () => {
    const extensionId = await getExtensionId(browser!);

    const optionsPage = await browser!.newPage();
    await optionsPage.goto(`chrome-extension://${extensionId}/options.html`);

    // Open rule editor
    await optionsPage.waitForSelector('[data-testid="create-rule-button"]', { timeout: 5000 });
    await new Promise(resolve => setTimeout(resolve, 200));
    await optionsPage.evaluate(() => {
      const button = document.querySelector('[data-testid="create-rule-button"]') as HTMLElement;
      button?.click();
    });
    await optionsPage.waitForSelector('[data-testid="save-rule-button"]', { timeout: 5000 });

    // Add a header
    await optionsPage.click('[data-testid="add-header-button"]');
    await new Promise(resolve => setTimeout(resolve, 200));

    // Type header value without spaces
    const headerValueInputs = await optionsPage.$$('[data-testid="header-value-input"]');
    await headerValueInputs[0].type('valueWithoutSpaces');

    // Wait a bit for state update
    await new Promise(resolve => setTimeout(resolve, 100));

    // Check that warning is NOT present
    const warning = await optionsPage.$('[data-testid="header-value-whitespace-warning"]');
    expect(warning).toBeNull();
  }, 30000);
});
