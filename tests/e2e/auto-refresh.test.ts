/**
 * E2E Tests for Auto-Refresh Variable Functionality
 * Tests: 8-15 (Auto-refresh with GET/POST, variable substitution in URL, transformations, error handling)
 */
import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { Browser } from 'puppeteer';
import { launchBrowserWithExtension, getExtensionId } from '../helpers/browser.js';
import { configureVariables, configureVariableWithRefresh } from '../helpers/config.js';
import { waitForToast } from '../helpers/toast.js';

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

describe('Auto-Refresh Variables', () => {
  test('should refresh variable with basic GET request and path extraction', async () => {
    const extensionId = await getExtensionId(browser!);

    const optionsPage = await browser!.newPage();
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
    await optionsPage.waitForSelector('[data-testid="refresh-variable-button"]', { timeout: 5000 });

    // Click the Refresh button
    await optionsPage.click('[data-testid="refresh-variable-button"]');

    // Wait for success toast
    await waitForToast(optionsPage, 'Variable refreshed successfully!');

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

    // Check that value starts with "simple_token_" (since we use Date.now() in the token)
    expect(updatedValue).toMatch(/^simple_token_/);
  }, 30000);

  test('should refresh variable with POST request and template transformation', async () => {
    const extensionId = await getExtensionId(browser!);

    const optionsPage = await browser!.newPage();
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
    await optionsPage.waitForSelector('[data-testid="refresh-variable-button"]', { timeout: 5000 });

    // Click the Refresh button
    await optionsPage.click('[data-testid="refresh-variable-button"]');

    // Wait for success toast
    await waitForToast(optionsPage, 'Variable refreshed successfully!');

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

    // Check that value starts with "Bearer post_token_"
    expect(updatedValue).toMatch(/^Bearer post_token_/);
  }, 30000);

  test('should substitute variables in refresh URL', async () => {
    const extensionId = await getExtensionId(browser!);

    const optionsPage = await browser!.newPage();
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
    await optionsPage.waitForSelector('[data-testid="refresh-variable-button"]', { timeout: 5000 });

    // Click the Refresh button
    await optionsPage.click('[data-testid="refresh-variable-button"]');

    // Wait for success toast
    await waitForToast(optionsPage, 'Variable refreshed successfully!');

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

    // Check that value starts with "simple_token_"
    expect(updatedValue).toMatch(/^simple_token_/);
  }, 30000);

  test('should extract nested paths with dot notation', async () => {
    const extensionId = await getExtensionId(browser!);

    const optionsPage = await browser!.newPage();
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
    await optionsPage.waitForSelector('[data-testid="refresh-variable-button"]', { timeout: 5000 });

    // Click the Refresh button
    await optionsPage.click('[data-testid="refresh-variable-button"]');

    // Wait for success toast
    await waitForToast(optionsPage, 'Variable refreshed successfully!');

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

    // Check that value starts with "nested_token_"
    expect(updatedValue).toMatch(/^nested_token_/);
  }, 30000);

  test('should support templates with multiple fields', async () => {
    const extensionId = await getExtensionId(browser!);

    const optionsPage = await browser!.newPage();
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
    await optionsPage.waitForSelector('[data-testid="refresh-variable-button"]', { timeout: 5000 });

    // Click the Refresh button
    await optionsPage.click('[data-testid="refresh-variable-button"]');

    // Wait for success toast
    await waitForToast(optionsPage, 'Variable refreshed successfully!');

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

    // Check that value matches the expected template format
    expect(updatedValue).toMatch(/^Token: complex_token_/);
    expect(updatedValue).toContain('(expires in 3600s)');
  }, 30000);

  test('should return full response when no transform is specified', async () => {
    const extensionId = await getExtensionId(browser!);

    const optionsPage = await browser!.newPage();
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
    await optionsPage.waitForSelector('[data-testid="refresh-variable-button"]', { timeout: 5000 });

    // Click the Refresh button
    await optionsPage.click('[data-testid="refresh-variable-button"]');

    // Wait for success toast
    await waitForToast(optionsPage, 'Variable refreshed successfully!');

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

    // The value should be a JSON string containing the full response
    // Expected format: {"access_token":"simple_token_...","expires_in":3600}
    const parsed = JSON.parse(updatedValue);
    expect(parsed.access_token).toMatch(/^simple_token_/);
    expect(parsed.expires_in).toBe(3600);
  }, 30000);

  test('should handle HTTP errors correctly without updating the variable', async () => {
    const extensionId = await getExtensionId(browser!);

    const optionsPage = await browser!.newPage();
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
    await optionsPage.waitForSelector('[data-testid="refresh-variable-button"]', { timeout: 5000 });

    // Click the Refresh button
    await optionsPage.click('[data-testid="refresh-variable-button"]');

    // Wait for error toast
    await waitForToast(optionsPage, 'Failed to refresh variable');

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

    // Check that the variable value remains unchanged
    // (error toast was already verified above)
    expect(updatedValue).toBe('initial_value');
  }, 30000);

  test('should substitute variables in request headers and body', async () => {
    const extensionId = await getExtensionId(browser!);

    const optionsPage = await browser!.newPage();
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
    await optionsPage.waitForSelector('[data-testid="refresh-variable-button"]', { timeout: 5000 });

    // Click the Refresh button
    await optionsPage.click('[data-testid="refresh-variable-button"]');

    // Wait for success toast
    await waitForToast(optionsPage, 'Variable refreshed successfully!');

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

    // Check that value starts with "post_token_" which means the server received
    // the substituted values correctly
    expect(updatedValue).toMatch(/^post_token_/);
  }, 30000);
});
