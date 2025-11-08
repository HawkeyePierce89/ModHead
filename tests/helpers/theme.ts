import { Page } from 'puppeteer';

/**
 * Theme helper functions for E2E tests
 */

export type Theme = 'light' | 'dark' | 'auto';

/**
 * Set theme by clicking the appropriate button in ThemeToggle component
 */
export async function setTheme(page: Page, theme: Theme): Promise<void> {
  const titleMap: Record<Theme, string> = {
    light: 'Light theme',
    dark: 'Dark theme',
    auto: 'Auto (system)',
  };

  await page.evaluate((title) => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const themeBtn = buttons.find(btn => btn.getAttribute('title') === title);
    if (!themeBtn) {
      throw new Error(`Theme button with title "${title}" not found`);
    }
    (themeBtn as HTMLButtonElement).click();
  }, titleMap[theme]);

  // Wait for theme to apply
  await new Promise(resolve => setTimeout(resolve, 300));
}

/**
 * Check if dark mode is currently active (dark class on html element)
 */
export async function isDarkModeActive(page: Page): Promise<boolean> {
  return await page.evaluate(() => {
    return document.documentElement.classList.contains('dark');
  });
}

/**
 * Get the current theme from Chrome storage
 */
export async function getThemeFromStorage(page: Page): Promise<Theme> {
  return await page.evaluate(async () => {
    const result = await chrome.storage.local.get('modhead_settings');
    const theme = result.modhead_settings?.theme || 'auto';
    return theme as 'light' | 'dark' | 'auto';
  });
}
