# E2E Tests for ModHead Extension

This directory contains end-to-end (E2E) tests for the ModHead Chrome extension using Vitest and Puppeteer.

## Structure

```
tests/
├── e2e/
│   ├── basic-headers.test.ts    # Tests 1-3: Basic header modification
│   ├── variables.test.ts        # Tests 4-7: Variable substitution
│   └── auto-refresh.test.ts     # Tests 8-15: Auto-refresh functionality
├── helpers/
│   ├── types.ts                 # TypeScript type definitions
│   ├── browser.ts               # Browser launch and extension utilities
│   ├── server.ts                # Test server management
│   └── config.ts                # Extension configuration helpers
├── server/
│   └── test-server.ts           # Express server for testing
├── fixtures/
│   └── test-page.html           # Test HTML page for AJAX requests
├── setup.ts                     # Global test setup (Vitest)
└── README.md                    # This file
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

### Run specific test categories
```bash
# Run only basic header tests (Tests 1-3)
npm run test:basic

# Run only variable substitution tests (Tests 4-7)
npm run test:variables

# Run only auto-refresh tests (Tests 8-15)
npm run test:refresh
```

### Run tests with Vitest UI
```bash
npm run test:e2e:ui
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

## Test Framework

The tests use **Vitest** as the test runner, which provides:
- Fast test execution with modern JavaScript support
- Excellent integration with Vite (already used in the project)
- Built-in TypeScript support
- Better error messages and debugging experience
- Parallel test execution (currently disabled for browser stability)

## Test Scenarios

### Basic Headers (tests/e2e/basic-headers.test.ts)

1. **Basic Header Addition**: Adds a custom header (`X-Custom-Header`) to requests matching `localhost:3333` with `startsWith` match type

2. **Multiple Headers**: Adds multiple custom headers (`X-Test-Header`, `X-Modified-Header`) to requests

3. **Equals Match Type**: Tests the `equals` match type for URL pattern matching

### Variable Substitution (tests/e2e/variables.test.ts)

4. **Basic Variable Substitution**: Substitutes a single variable in header value (e.g., `Bearer ${authToken}`)

5. **Multiple Variables in Value**: Substitutes multiple variables in a single header value (e.g., `${prefix}-${suffix}`)

6. **Undefined Variable Reference**: Verifies that undefined variables are left as placeholders (e.g., `${undefinedVar}`)

7. **Empty Variable Value**: Tests handling of variables with empty values

### Auto-Refresh Variables (tests/e2e/auto-refresh.test.ts)

8. **Auto-refresh with Basic GET**: Tests variable refresh with GET request and simple path extraction

9. **Auto-refresh with POST and Template**: Tests variable refresh with POST request and template transformation

10. **Variable Substitution in URL**: Tests variable substitution in refresh URL (e.g., `${baseUrl}/auth/token`)

11. **Nested Path Extraction**: Tests extraction of nested JSON paths (e.g., `data.token`)

12. **Template with Multiple Fields**: Tests complex templates with multiple field placeholders

13. **No Transform - Full Response**: Tests returning full JSON response when no transform is specified

14. **HTTP Error Handling**: Verifies that HTTP errors don't update the variable value

15. **Variable Substitution in Headers and Body**: Tests variable substitution in request headers and body

## How Tests Work

1. **Test Server**: An Express server runs on `localhost:3333` that echoes back all received HTTP headers and provides auth endpoints for refresh tests
2. **Extension Loading**: Puppeteer launches Chrome with the ModHead extension loaded
3. **UI Automation**: Tests interact with the extension's Options page to configure rules and variables
4. **Request Testing**: Tests navigate to a test page that makes AJAX requests to the test server
5. **Verification**: Tests verify that custom headers were correctly added/modified by checking responses

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

### Vitest UI

For an interactive test UI with watch mode:

```bash
npm run test:e2e:ui
```

This opens a web-based UI where you can:
- See test results in real-time
- Filter and run specific tests
- View detailed error messages
- Inspect test execution timeline

## Known Limitations

- Tests currently don't verify tab URL filtering (only target domain filtering)
- Server must be running on port 3333 (hardcoded)
- Tests use Puppeteer's bundled Chromium by default
- Tests run sequentially (not in parallel) to avoid browser conflicts

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

3. Increase test timeouts if needed (edit `vitest.config.ts`)

### Common Errors

#### Error: "Extension service worker not found"
- Make sure the extension builds successfully (`npm run build`)
- Check that `dist/` directory contains `manifest.json` and extension files

#### Error: "Server failed to start"
- Port 3333 might be in use. Kill any process using it:
  ```bash
  lsof -ti:3333 | xargs kill -9
  ```

#### Vitest-specific Errors

- If you see module resolution errors, ensure all imports use `.js` extensions (required for ES modules)
- If tests timeout, increase `testTimeout` in `vitest.config.ts`

## Migrating from Old Test Structure

The tests have been refactored from a single large file (`extension.test.ts`) to a modular structure with:

- **Helper modules** in `tests/helpers/` for reusable functionality
- **Separate test files** by feature category for better organization
- **Vitest** as the test runner for better performance and developer experience

Old test commands still work, but now use Vitest internally. The test behavior remains the same.
