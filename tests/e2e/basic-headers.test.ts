/**
 * E2E Tests for Basic Header Modification Functionality
 * Tests: 1-3 (Basic headers, multiple headers, match types)
 */
import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { Browser } from 'puppeteer';
import { launchBrowserWithExtension, getExtensionId } from '../helpers/browser.js';
import { TEST_PAGE_URL } from '../helpers/server.js';
import { configureExtensionRule } from '../helpers/config.js';
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

describe('Basic Header Modification', () => {
  test('should add a single custom header to requests', async () => {
    const extensionId = await getExtensionId(browser!);

    // Open options page
    const optionsPage = await browser!.newPage();
    await optionsPage.goto(`chrome-extension://${extensionId}/options.html`);

    // Configure rule to add X-Custom-Header
    await configureExtensionRule(
      optionsPage,
      'Test Rule 1',
      [{ url: 'localhost:3333', matchType: 'startsWith' }],
      [{ name: 'X-Custom-Header', value: 'TestValue123' }]
    );

    // Open test page and make request
    const testPage = await browser!.newPage();
    await testPage.goto(`${TEST_PAGE_URL}?autotest=true`);

    // Wait for request to complete
    await testPage.waitForFunction(
      () => window.testResult !== null && window.testResult !== undefined,
      { timeout: 10000 }
    );

    // Get result
    const result = await testPage.evaluate(() => window.testResult) as TestResult;

    expect(result).toBeDefined();
    expect(result.customHeaders['x-custom-header']).toBe('TestValue123');
  }, 30000);

  test('should add multiple headers to requests', async () => {
    const extensionId = await getExtensionId(browser!);

    const optionsPage = await browser!.newPage();
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

    const testPage = await browser!.newPage();
    await testPage.goto(`${TEST_PAGE_URL}?autotest=true`);

    await testPage.waitForFunction(
      () => window.testResult !== null && window.testResult !== undefined,
      { timeout: 10000 }
    );

    const result = await testPage.evaluate(() => window.testResult) as TestResult;

    expect(result).toBeDefined();
    expect(result.customHeaders['x-test-header']).toBe('Value1');
    expect(result.customHeaders['x-modified-header']).toBe('Value2');
  }, 30000);

  test('should correctly handle "equals" match type for URLs', async () => {
    const extensionId = await getExtensionId(browser!);

    const optionsPage = await browser!.newPage();
    await optionsPage.goto(`chrome-extension://${extensionId}/options.html`);

    // Configure rule with equals match
    await configureExtensionRule(
      optionsPage,
      'Equals Match Rule',
      [{ url: 'localhost:3333/api/test', matchType: 'equals' }],
      [{ name: 'X-Custom-Header', value: 'EqualsTest' }]
    );

    const testPage = await browser!.newPage();
    await testPage.goto(`${TEST_PAGE_URL}?autotest=true`);

    await testPage.waitForFunction(
      () => window.testResult !== null && window.testResult !== undefined,
      { timeout: 10000 }
    );

    const result = await testPage.evaluate(() => window.testResult) as TestResult;

    expect(result).toBeDefined();
    expect(result.customHeaders['x-custom-header']).toBe('EqualsTest');
  }, 30000);
});
