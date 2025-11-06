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
- All npm dependencies installed (`npm install`)
- **Note:** Tests use Puppeteer's bundled Chromium by default - no need to install Chrome separately!

## Running Tests

### Run all tests (build + E2E)
```bash
npm test
```

### Run only E2E tests (without building)
```bash
npm run test:e2e
```

### Run tests with visible browser (non-headless)
```bash
HEADLESS=false npm run test:e2e
```

### Run tests in debug mode (browser stays open on errors)
```bash
DEBUG=true npm run test:e2e
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

- `HEADLESS`: Set to `'false'` to run tests with visible browser (default: `true`)
- `DEBUG`: Set to `'true'` to enable debug mode - keeps browser open on errors and disables headless mode (default: `false`)

## CI/CD

Tests run automatically on GitHub Actions for:
- Push to `main` or `master` branches
- All pull requests

See `.github/workflows/test.yml` for the CI configuration.

## Debugging

### Debug Mode

Run tests in debug mode to keep the browser open when errors occur:

```bash
DEBUG=true npm run test:e2e
```

This automatically:
- Disables headless mode (makes the browser visible)
- Keeps the browser window open after test failures
- Allows you to inspect the extension in chrome://extensions
- Lets you see what went wrong in the browser UI
- Shows console errors in the browser DevTools

### Visual Mode (non-headless)

To see the browser during tests without debug mode:

```bash
HEADLESS=false npm run test:e2e
```

This runs tests with a visible browser window but closes it after completion.

## Known Limitations

- Tests currently don't verify tab URL filtering (only target domain filtering)
- Server must be running on port 3333 (hardcoded)
- Tests use Puppeteer's bundled Chromium by default

## Troubleshooting

If tests fail:

1. Verify the extension builds successfully:
   ```bash
   npm run build
   ```

2. Run the test server manually and verify it works:
   ```bash
   npm run test:server
   # In another terminal:
   curl http://localhost:3333/api/test
   ```

3. Increase test timeouts if needed (edit `tests/e2e/extension.test.ts`)

### Common Errors

#### Error: "Extension service worker not found"
- Make sure the extension builds successfully (`npm run build`)
- Check that `dist/` directory contains `manifest.json` and extension files

#### Error: "Server failed to start"
- Port 3333 might be in use. Kill any process using it:
  ```bash
  lsof -ti:3333 | xargs kill -9
  ```
