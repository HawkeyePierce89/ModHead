import type { Page } from 'puppeteer';

/**
 * Wait for a toast message to appear with the specified text
 * @param page Puppeteer page instance
 * @param expectedText The expected toast message text (can be partial match)
 * @param timeout Maximum time to wait in milliseconds
 * @returns The toast element
 */
export async function waitForToast(
  page: Page,
  expectedText: string,
  timeout = 5000
): Promise<void> {
  await page.waitForFunction(
    (text: string) => {
      const toasts = Array.from(document.querySelectorAll('[role="status"]'));
      return toasts.some((toast) => {
        const content = toast.textContent || '';
        return content.includes(text);
      });
    },
    { timeout },
    expectedText
  );
}

/**
 * Get the text content of the currently visible toast message
 * @param page Puppeteer page instance
 * @returns The toast message text, or null if no toast is visible
 */
export async function getToastMessage(page: Page): Promise<string | null> {
  const toastText = await page.evaluate(() => {
    const toast = document.querySelector('[role="status"]');
    return toast ? toast.textContent : null;
  });
  return toastText;
}

/**
 * Wait for all toast messages to disappear
 * @param page Puppeteer page instance
 * @param timeout Maximum time to wait in milliseconds
 */
export async function waitForToastDisappear(
  page: Page,
  timeout = 6000
): Promise<void> {
  await page.waitForFunction(
    () => {
      const toasts = document.querySelectorAll('[role="status"]');
      return toasts.length === 0;
    },
    { timeout }
  );
}

/**
 * Check if a toast with specific type and message is visible
 * @param page Puppeteer page instance
 * @param type The toast type ('success' or 'error')
 * @param expectedText The expected message text (can be partial match)
 * @returns true if the toast is visible, false otherwise
 */
export async function hasToast(
  page: Page,
  type: 'success' | 'error',
  expectedText: string
): Promise<boolean> {
  return await page.evaluate(
    (args: { type: string; text: string }) => {
      const toasts = Array.from(document.querySelectorAll('[role="status"]'));
      const bgColorClass = args.type === 'success' ? 'bg-[#27ae60]' : 'bg-[#e74c3c]';

      return toasts.some((toast) => {
        const content = toast.textContent || '';
        const hasCorrectType = toast.classList.contains(bgColorClass) ||
          (toast as HTMLElement).style.backgroundColor.includes(args.type === 'success' ? '27ae60' : 'e74c3c');
        return hasCorrectType && content.includes(args.text);
      });
    },
    { type, text: expectedText }
  );
}
