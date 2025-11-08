/**
 * E2E Tests for Variable Substitution
 * Tests: 4-7 (Basic variables, multiple variables, undefined variables, empty variables)
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

describe('Variable Substitution', () => {
  test('should substitute a single variable in header value', async () => {
    const extensionId = await getExtensionId(browser!);

    const optionsPage = await browser!.newPage();
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

    const testPage = await browser!.newPage();
    await testPage.goto(`${TEST_PAGE_URL}?autotest=true`);

    await testPage.waitForFunction(
      () => window.testResult !== null && window.testResult !== undefined,
      { timeout: 10000 }
    );

    const result = await testPage.evaluate(() => window.testResult) as TestResult;

    expect(result).toBeDefined();
    expect(result.customHeaders['x-auth']).toBe('Bearer secret123');
  }, 30000);

  test('should substitute multiple variables in a single header value', async () => {
    const extensionId = await getExtensionId(browser!);

    const optionsPage = await browser!.newPage();
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

    const testPage = await browser!.newPage();
    await testPage.goto(`${TEST_PAGE_URL}?autotest=true`);

    await testPage.waitForFunction(
      () => window.testResult !== null && window.testResult !== undefined,
      { timeout: 10000 }
    );

    const result = await testPage.evaluate(() => window.testResult) as TestResult;

    expect(result).toBeDefined();
    expect(result.customHeaders['x-combined']).toBe('test-value');
  }, 30000);

  test('should leave undefined variable references as placeholders', async () => {
    const extensionId = await getExtensionId(browser!);

    const optionsPage = await browser!.newPage();
    await optionsPage.goto(`chrome-extension://${extensionId}/options.html`);

    // Configure rule with undefined variable (no variables configured)
    await configureExtensionRule(
      optionsPage,
      'Undefined Var Rule',
      [{ url: 'localhost:3333', matchType: 'startsWith' }],
      [{ name: 'X-Undefined', value: 'Value-${undefinedVar}-End' }]
    );

    const testPage = await browser!.newPage();
    await testPage.goto(`${TEST_PAGE_URL}?autotest=true`);

    await testPage.waitForFunction(
      () => window.testResult !== null && window.testResult !== undefined,
      { timeout: 10000 }
    );

    const result = await testPage.evaluate(() => window.testResult) as TestResult;

    expect(result).toBeDefined();
    // Variable substitution should leave undefined variables as-is
    expect(result.customHeaders['x-undefined']).toBe('Value-${undefinedVar}-End');
  }, 30000);

  test('should correctly handle empty variable values', async () => {
    const extensionId = await getExtensionId(browser!);

    const optionsPage = await browser!.newPage();
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

    const testPage = await browser!.newPage();
    await testPage.goto(`${TEST_PAGE_URL}?autotest=true`);

    await testPage.waitForFunction(
      () => window.testResult !== null && window.testResult !== undefined,
      { timeout: 10000 }
    );

    const result = await testPage.evaluate(() => window.testResult) as TestResult;

    expect(result).toBeDefined();
    // Empty variable should result in concatenation without the variable
    expect(result.customHeaders['x-empty']).toBe('BeforeAfter');
  }, 30000);
});
