/**
 * E2E Tests for Theme Toggle Functionality
 * Test 16: Theme persistence across page reloads
 */
import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { Browser } from 'puppeteer';
import { launchBrowserWithExtension, getExtensionId } from '../helpers/browser.js';
import { setTheme, isDarkModeActive, getThemeFromStorage } from '../helpers/theme.js';

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

describe('Theme Toggle', () => {
  test('should persist theme selection across page reloads', async () => {
    const extensionId = await getExtensionId(browser!);

    // Open options page
    const optionsPage = await browser!.newPage();
    await optionsPage.goto(`chrome-extension://${extensionId}/options.html`);

    // Wait for page to load
    await optionsPage.waitForSelector('button[title="Light theme"]', { timeout: 5000 });

    // Test 1: Switch to dark theme
    console.log('Testing dark theme...');
    await setTheme(optionsPage, 'dark');

    // Verify dark mode is active
    let isDark = await isDarkModeActive(optionsPage);
    expect(isDark).toBe(true);

    // Verify theme is saved in storage
    let savedTheme = await getThemeFromStorage(optionsPage);
    expect(savedTheme).toBe('dark');

    // Reload page
    await optionsPage.reload({ waitUntil: 'networkidle0' });
    await optionsPage.waitForSelector('button[title="Light theme"]', { timeout: 5000 });

    // Verify theme persisted after reload
    isDark = await isDarkModeActive(optionsPage);
    expect(isDark).toBe(true);
    savedTheme = await getThemeFromStorage(optionsPage);
    expect(savedTheme).toBe('dark');

    // Test 2: Switch to light theme
    console.log('Testing light theme...');
    await setTheme(optionsPage, 'light');

    // Verify light mode is active
    isDark = await isDarkModeActive(optionsPage);
    expect(isDark).toBe(false);

    // Verify theme is saved in storage
    savedTheme = await getThemeFromStorage(optionsPage);
    expect(savedTheme).toBe('light');

    // Reload page
    await optionsPage.reload({ waitUntil: 'networkidle0' });
    await optionsPage.waitForSelector('button[title="Light theme"]', { timeout: 5000 });

    // Verify theme persisted after reload
    isDark = await isDarkModeActive(optionsPage);
    expect(isDark).toBe(false);
    savedTheme = await getThemeFromStorage(optionsPage);
    expect(savedTheme).toBe('light');

    // Test 3: Switch to auto theme
    console.log('Testing auto theme...');
    await setTheme(optionsPage, 'auto');

    // Verify theme is saved in storage
    savedTheme = await getThemeFromStorage(optionsPage);
    expect(savedTheme).toBe('auto');

    // Note: We don't check isDarkModeActive for auto mode because it depends on system settings

    // Reload page
    await optionsPage.reload({ waitUntil: 'networkidle0' });
    await optionsPage.waitForSelector('button[title="Light theme"]', { timeout: 5000 });

    // Verify theme persisted after reload
    savedTheme = await getThemeFromStorage(optionsPage);
    expect(savedTheme).toBe('auto');

    console.log('✓ All theme persistence tests passed');
  }, 30000);
});
