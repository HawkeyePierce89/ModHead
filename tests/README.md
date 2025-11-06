# E2E Tests for ModHead Extension

This directory contains end-to-end (E2E) tests for the ModHead Chrome extension using Puppeteer.

## Structure

```
tests/
├── e2e/
│   └── extension.test.ts     # Main E2E test file
├── server/
│   └── test-server.ts        # Express server for testing
├── fixtures/
│   └── test-page.html        # Test HTML page for AJAX requests
└── README.md                 # This file
```

## Prerequisites

- Node.js (version 18 or higher)
- Chrome/Chromium browser installed on your system
- All npm dependencies installed (`npm install`)

## Running Tests

### Run all tests (build + E2E)
```bash
npm test
```

### Run only E2E tests (without building)
```bash
npm run test:e2e
```

### Run test server separately (for debugging)
```bash
npm run test:server
```

## Test Scenarios

The E2E tests verify the following functionality:

1. **Basic Header Addition**: Adds a custom header (`X-Custom-Header`) to requests matching `localhost:3333` with `startsWith` match type

2. **Multiple Headers**: Adds multiple custom headers (`X-Test-Header`, `X-Modified-Header`) to requests

3. **Equals Match Type**: Tests the `equals` match type for URL pattern matching

## How Tests Work

1. **Test Server**: An Express server runs on `localhost:3333` that echoes back all received HTTP headers
2. **Extension Loading**: Puppeteer launches Chrome with the ModHead extension loaded
3. **UI Automation**: Tests interact with the extension's Options page to configure rules
4. **Request Testing**: Tests navigate to a test page that makes AJAX requests to the test server
5. **Verification**: Tests verify that custom headers were correctly added by checking the server's response

## Environment Variables

- `CHROME_BIN`: Path to Chrome executable (optional, auto-detected)
- `PUPPETEER_EXEC_PATH`: Alternative path to Chrome executable (optional)
- `PUPPETEER_SKIP_DOWNLOAD`: Set to `'true'` to skip Chrome download during `npm install`

### Chrome Auto-Detection

The tests automatically detect Chrome installation on different operating systems:

**macOS:**
- `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome` (default)
- `/Applications/Chromium.app/Contents/MacOS/Chromium`
- `/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary`

**Linux:**
- `/usr/bin/google-chrome-stable`
- `/usr/bin/google-chrome`
- `/usr/bin/chromium-browser`
- `/usr/bin/chromium`
- `/snap/bin/chromium`

**Windows:**
- `C:/Program Files/Google/Chrome/Application/chrome.exe`
- `C:/Program Files (x86)/Google/Chrome/Application/chrome.exe`
- `%LOCALAPPDATA%/Google/Chrome/Application/chrome.exe`

If auto-detection fails, set `CHROME_BIN`:

```bash
# macOS
export CHROME_BIN="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
npm test

# Linux
export CHROME_BIN="/usr/bin/google-chrome-stable"
npm test

# Windows (PowerShell)
$env:CHROME_BIN="C:\Program Files\Google\Chrome\Application\chrome.exe"
npm test
```

## CI/CD

Tests run automatically on GitHub Actions for:
- Push to `main` or `master` branches
- Pull requests to `main` or `master` branches

See `.github/workflows/test.yml` for the CI configuration.

## Debugging

### Debug Mode

Run tests in debug mode to keep the browser open when errors occur:

```bash
DEBUG=true npm run test:e2e
```

This allows you to:
- Inspect the extension in chrome://extensions
- See what went wrong in the browser UI
- Check console errors
- Verify the extension loaded correctly

### Troubleshooting

If tests fail:

1. Check that Chrome is installed:
   ```bash
   which google-chrome-stable
   google-chrome-stable --version
   ```

2. Verify the extension builds successfully:
   ```bash
   npm run build
   ```

3. Run the test server manually and verify it works:
   ```bash
   npm run test:server
   # In another terminal:
   curl http://localhost:3333/api/test
   ```

4. Increase test timeouts if needed (edit `tests/e2e/extension.test.ts`)

## Known Limitations

- Tests require non-headless Chrome (Chrome extensions don't work in headless mode)
- Tests currently don't verify tab URL filtering (only target domain filtering)
- Server must be running on port 3333 (hardcoded)

## Adding New Tests

To add a new test:

1. Create a new test function in `tests/e2e/extension.test.ts`:
   ```typescript
   async function testX_YourTestName(): Promise<void> {
     console.log('\n=== Test X: Your Test Name ===');
     // Your test logic here
   }
   ```

2. Add it to the `tests` array in `runAllTests()`:
   ```typescript
   const tests = [
     test1_BasicHeaderAddition,
     test2_MultipleHeaders,
     test3_MatchTypeEquals,
     testX_YourTestName, // Add your test here
   ];
   ```

## Troubleshooting

### Error: "Extension service worker not found"
- Make sure the extension builds successfully (`npm run build`)
- Check that `dist/` directory contains `manifest.json` and extension files

### Error: "Server failed to start"
- Port 3333 might be in use. Kill any process using it:
  ```bash
  lsof -ti:3333 | xargs kill -9
  ```

### Error: "chrome: not found"
- Set `CHROME_BIN` environment variable:
  ```bash
  export CHROME_BIN=/path/to/chrome
  npm test
  ```
