import puppeteer, { Browser } from 'puppeteer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EXTENSION_PATH = path.join(__dirname, '../../dist');
const DEBUG_MODE = process.env.DEBUG === 'true';
// Headless mode: default true, disabled in DEBUG mode or if HEADLESS=false
const HEADLESS_MODE = !DEBUG_MODE && process.env.HEADLESS !== 'false';

/**
 * Find Chrome executable on the system
 */
export function findChromeExecutable(): string | undefined {
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

/**
 * Launch Chrome browser with the extension loaded
 */
export async function launchBrowserWithExtension(): Promise<Browser> {
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

/**
 * Get the extension ID from the loaded extension
 */
export async function getExtensionId(browser: Browser): Promise<string> {
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
