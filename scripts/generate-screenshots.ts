#!/usr/bin/env tsx
import { Browser, Page } from 'puppeteer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { launchBrowserWithExtension, getExtensionId } from '../tests/helpers/browser.js';
import { configureExtensionRule, configureVariables, configureVariableWithRefresh } from '../tests/helpers/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCREENSHOTS_DIR = path.join(__dirname, '../docs/images');

// Screenshot configuration
const VIEWPORT = {
  width: 1280,
  height: 800,
};

/**
 * Ensure screenshots directory exists
 */
function ensureScreenshotsDir() {
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }
  console.log(`Screenshots will be saved to: ${SCREENSHOTS_DIR}`);
}

/**
 * Take a screenshot and save it
 */
async function takeScreenshot(page: Page, filename: string, fullPage = false) {
  const filepath = path.join(SCREENSHOTS_DIR, filename);
  await page.screenshot({
    path: filepath,
    fullPage,
  });
  console.log(`✓ Screenshot saved: ${filename}`);
}

/**
 * Wait for page to be stable (no animations, layout shifts)
 */
async function waitForStable(page: Page, delay = 500) {
  await new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Main screenshot generation function
 */
async function generateScreenshots() {
  console.log('🚀 Starting screenshot generation...\n');

  ensureScreenshotsDir();

  let browser: Browser | undefined;

  try {
    // Launch browser with extension
    browser = await launchBrowserWithExtension();
    const extensionId = await getExtensionId(browser);
    const optionsUrl = `chrome-extension://${extensionId}/options.html`;

    console.log('\n📸 Generating screenshots...\n');

    // Screenshot 1: Empty options page (initial state)
    console.log('1. Empty options page...');
    const page1 = await browser.newPage();
    await page1.setViewport(VIEWPORT);
    await page1.goto(optionsUrl, { waitUntil: 'networkidle0' });
    await waitForStable(page1);
    await takeScreenshot(page1, '01-options-page-empty.png');
    await page1.close();

    // Screenshot 2: Rule editor modal (empty)
    console.log('2. Rule editor modal...');
    const page2 = await browser.newPage();
    await page2.setViewport(VIEWPORT);
    await page2.goto(optionsUrl, { waitUntil: 'networkidle0' });
    await waitForStable(page2);

    // Open rule editor
    await page2.evaluate(() => {
      const button = document.querySelector('[data-testid="create-rule-button"]') as HTMLElement;
      button?.click();
    });
    await page2.waitForSelector('[data-testid="save-rule-button"]', { timeout: 5000 });
    await waitForStable(page2);
    await takeScreenshot(page2, '02-rule-editor-empty.png');
    await page2.close();

    // Screenshot 3: Rule with single header
    console.log('3. Rule with single header...');
    const page3 = await browser.newPage();
    await page3.setViewport(VIEWPORT);
    await page3.goto(optionsUrl, { waitUntil: 'networkidle0' });
    await waitForStable(page3);

    await configureExtensionRule(
      page3,
      'API Authentication',
      [{ url: 'api.example.com', matchType: 'startsWith' }],
      [{ name: 'Authorization', value: 'Bearer token123' }]
    );
    await waitForStable(page3);
    await takeScreenshot(page3, '03-rule-single-header.png');
    await page3.close();

    // Screenshot 4: Rule card (showing details)
    console.log('4. Rule card details...');
    const page4 = await browser.newPage();
    await page4.setViewport(VIEWPORT);
    await page4.goto(optionsUrl, { waitUntil: 'networkidle0' });
    await waitForStable(page4);

    await configureExtensionRule(
      page4,
      'Development API',
      [{ url: 'dev.example.com', matchType: 'startsWith' }],
      [
        { name: 'X-API-Key', value: 'dev-key-12345' },
        { name: 'X-Environment', value: 'development' }
      ]
    );
    await waitForStable(page4);
    await takeScreenshot(page4, '04-rule-card.png');
    await page4.close();

    // Screenshot 5: Multiple rules
    console.log('5. Multiple rules...');
    const page5 = await browser.newPage();
    await page5.setViewport(VIEWPORT);
    await page5.goto(optionsUrl, { waitUntil: 'networkidle0' });
    await waitForStable(page5);

    await configureExtensionRule(
      page5,
      'Production API',
      [{ url: 'api.production.com', matchType: 'startsWith' }],
      [{ name: 'Authorization', value: 'Bearer prod-token' }]
    );
    await waitForStable(page5, 300);

    await configureExtensionRule(
      page5,
      'Staging API',
      [{ url: 'api.staging.com', matchType: 'startsWith' }],
      [{ name: 'Authorization', value: 'Bearer staging-token' }]
    );
    await waitForStable(page5, 300);

    await configureExtensionRule(
      page5,
      'CORS Headers',
      [{ url: 'localhost', matchType: 'startsWith' }],
      [
        { name: 'Access-Control-Allow-Origin', value: '*' },
        { name: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE' }
      ]
    );
    await waitForStable(page5);
    await takeScreenshot(page5, '05-multiple-rules.png', true);
    await page5.close();

    // Screenshot 6: URL pattern matching types
    console.log('6. URL pattern matching...');
    const page6 = await browser.newPage();
    await page6.setViewport(VIEWPORT);
    await page6.goto(optionsUrl, { waitUntil: 'networkidle0' });
    await waitForStable(page6);

    await configureExtensionRule(
      page6,
      'Pattern Examples',
      [
        { url: 'api.example.com', matchType: 'startsWith' },
        { url: '.com', matchType: 'endsWith' },
        { url: 'https://exact.example.com/path', matchType: 'equals' }
      ],
      [{ name: 'X-Pattern', value: 'mixed' }]
    );
    await waitForStable(page6);
    await takeScreenshot(page6, '06-url-pattern-matching.png');
    await page6.close();

    // Screenshot 7: Variables section
    console.log('7. Variables section...');
    const page7 = await browser.newPage();
    await page7.setViewport(VIEWPORT);
    await page7.goto(optionsUrl, { waitUntil: 'networkidle0' });
    await waitForStable(page7);

    await configureVariables(page7, [
      { name: 'apiKey', value: 'abc123def456', isSensitive: false },
      { name: 'apiSecret', value: 'secret-value-hidden', isSensitive: true },
      { name: 'environment', value: 'production', isSensitive: false }
    ]);
    await waitForStable(page7);
    await takeScreenshot(page7, '07-variables-section.png', true);
    await page7.close();

    // Screenshot 8: Variable editor modal
    console.log('8. Variable editor...');
    const page8 = await browser.newPage();
    await page8.setViewport(VIEWPORT);
    await page8.goto(optionsUrl, { waitUntil: 'networkidle0' });
    await waitForStable(page8);

    // Open variable editor
    await page8.click('[data-testid="add-variable-button"]');
    await waitForStable(page8);
    await takeScreenshot(page8, '08-variable-editor-empty.png');
    await page8.close();

    // Screenshot 9: Variable usage in headers
    console.log('9. Variable usage in headers...');
    const page9 = await browser.newPage();
    await page9.setViewport(VIEWPORT);
    await page9.goto(optionsUrl, { waitUntil: 'networkidle0' });
    await waitForStable(page9);

    await configureVariables(page9, [
      { name: 'apiToken', value: 'my-secret-token', isSensitive: true }
    ]);
    await waitForStable(page9, 300);

    await configureExtensionRule(
      page9,
      'Using Variables',
      [{ url: 'api.example.com', matchType: 'startsWith' }],
      [{ name: 'Authorization', value: 'Bearer ${apiToken}' }]
    );
    await waitForStable(page9);
    await takeScreenshot(page9, '09-variable-in-header.png', true);
    await page9.close();

    // Screenshot 10: Sensitive variable masked
    console.log('10. Sensitive variable masked...');
    const page10 = await browser.newPage();
    await page10.setViewport(VIEWPORT);
    await page10.goto(optionsUrl, { waitUntil: 'networkidle0' });
    await waitForStable(page10);

    await configureVariables(page10, [
      { name: 'password', value: 'super-secret-password', isSensitive: true }
    ]);
    await waitForStable(page10);
    await takeScreenshot(page10, '10-sensitive-variable-masked.png');
    await page10.close();

    // Screenshot 11: Auto-refresh configuration
    console.log('11. Auto-refresh configuration...');
    const page11 = await browser.newPage();
    await page11.setViewport(VIEWPORT);
    await page11.goto(optionsUrl, { waitUntil: 'networkidle0' });
    await waitForStable(page11);

    await configureVariableWithRefresh(page11, {
      name: 'accessToken',
      value: 'initial-token',
      refreshConfig: {
        url: 'https://auth.example.com/token',
        method: 'POST',
        headers: [
          { key: 'Content-Type', value: 'application/json' }
        ],
        body: JSON.stringify({
          grant_type: 'refresh_token',
          refresh_token: 'refresh-token-value'
        }),
        transformResponse: 'access_token'
      }
    });
    await waitForStable(page11);
    await takeScreenshot(page11, '11-auto-refresh-config.png', true);
    await page11.close();

    // Screenshot 12: JWT refresh example
    console.log('12. JWT refresh example...');
    const page12 = await browser.newPage();
    await page12.setViewport(VIEWPORT);
    await page12.goto(optionsUrl, { waitUntil: 'networkidle0' });
    await waitForStable(page12);

    await configureVariableWithRefresh(page12, {
      name: 'jwtToken',
      value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      refreshConfig: {
        url: 'https://api.example.com/auth/refresh',
        method: 'POST',
        headers: [
          { key: 'Content-Type', value: 'application/json' }
        ],
        body: '{"refreshToken": "refresh-token-here"}',
        transformResponse: 'data.token'
      }
    });
    await waitForStable(page12, 300);

    await configureExtensionRule(
      page12,
      'JWT Authentication',
      [{ url: 'api.example.com', matchType: 'startsWith' }],
      [{ name: 'Authorization', value: 'Bearer ${jwtToken}' }]
    );
    await waitForStable(page12);
    await takeScreenshot(page12, '12-jwt-refresh-example.png', true);
    await page12.close();

    // Screenshot 13: OAuth example
    console.log('13. OAuth example...');
    const page13 = await browser.newPage();
    await page13.setViewport(VIEWPORT);
    await page13.goto(optionsUrl, { waitUntil: 'networkidle0' });
    await waitForStable(page13);

    await configureVariables(page13, [
      { name: 'clientId', value: 'my-client-id', isSensitive: false },
      { name: 'clientSecret', value: 'my-client-secret', isSensitive: true }
    ]);
    await waitForStable(page13, 300);

    await configureVariableWithRefresh(page13, {
      name: 'oauthToken',
      value: 'initial-oauth-token',
      refreshConfig: {
        url: 'https://oauth.example.com/token',
        method: 'POST',
        headers: [
          { key: 'Content-Type', value: 'application/x-www-form-urlencoded' }
        ],
        body: 'grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}',
        transformResponse: 'access_token'
      }
    });
    await waitForStable(page13, 300);

    await configureExtensionRule(
      page13,
      'OAuth API',
      [{ url: 'api.oauth-example.com', matchType: 'startsWith' }],
      [{ name: 'Authorization', value: 'Bearer ${oauthToken}' }]
    );
    await waitForStable(page13);
    await takeScreenshot(page13, '13-oauth-example.png', true);
    await page13.close();

    // Screenshot 14: Multiple headers example
    console.log('14. Multiple headers...');
    const page14 = await browser.newPage();
    await page14.setViewport(VIEWPORT);
    await page14.goto(optionsUrl, { waitUntil: 'networkidle0' });
    await waitForStable(page14);

    await configureExtensionRule(
      page14,
      'Custom Headers',
      [{ url: 'api.example.com', matchType: 'startsWith' }],
      [
        { name: 'X-API-Key', value: 'key-12345' },
        { name: 'X-Environment', value: 'production' },
        { name: 'X-Version', value: 'v2' },
        { name: 'X-User-Agent', value: 'CustomApp/1.0' }
      ]
    );
    await waitForStable(page14);
    await takeScreenshot(page14, '14-multiple-headers.png');
    await page14.close();

    // Screenshot 15: CORS headers example
    console.log('15. CORS headers example...');
    const page15 = await browser.newPage();
    await page15.setViewport(VIEWPORT);
    await page15.goto(optionsUrl, { waitUntil: 'networkidle0' });
    await waitForStable(page15);

    await configureExtensionRule(
      page15,
      'Local Development CORS',
      [{ url: 'localhost', matchType: 'startsWith' }],
      [
        { name: 'Access-Control-Allow-Origin', value: '*' },
        { name: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
        { name: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' }
      ]
    );
    await waitForStable(page15);
    await takeScreenshot(page15, '15-cors-headers.png');
    await page15.close();

    // Screenshot 16: Options page overview with content
    console.log('16. Options page overview...');
    const page16 = await browser.newPage();
    await page16.setViewport(VIEWPORT);
    await page16.goto(optionsUrl, { waitUntil: 'networkidle0' });
    await waitForStable(page16);

    await configureVariables(page16, [
      { name: 'apiKey', value: 'abc123', isSensitive: false }
    ]);
    await waitForStable(page16, 300);

    await configureExtensionRule(
      page16,
      'My API',
      [{ url: 'api.myapp.com', matchType: 'startsWith' }],
      [{ name: 'X-API-Key', value: '${apiKey}' }]
    );
    await waitForStable(page16);
    await takeScreenshot(page16, '16-options-page-overview.png', true);
    await page16.close();

    console.log('\n✅ All screenshots generated successfully!');
    console.log(`📁 Screenshots saved to: ${SCREENSHOTS_DIR}`);

  } catch (error) {
    console.error('\n❌ Error generating screenshots:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the script
generateScreenshots().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
