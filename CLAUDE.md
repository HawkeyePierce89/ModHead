# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ModHead is a Chrome extension (Manifest V3) that allows users to modify HTTP request headers. It uses Chrome's `declarativeNetRequest` API to dynamically modify headers based on user-defined rules with URL pattern matching.

## Build Commands

```bash
# Development build with watch mode
npm run dev

# Production build (TypeScript compilation + Vite build)
npm run build
```

Build output is in the `dist/` directory, which contains the complete Chrome extension ready to be loaded.

## Testing

```bash
# Run all tests (build + E2E)
npm test

# Run only E2E tests (without building)
npm run test:e2e

# Run specific test categories
npm run test:basic       # Tests 1-3: Basic headers and match types
npm run test:variables   # Tests 4-7: Variable substitution
npm run test:refresh     # Tests 8-15: Auto-refresh tokens

# Vitest UI for interactive debugging
npm run test:e2e:ui

# Run tests with visible browser
HEADLESS=false npm run test:e2e

# Run tests in debug mode (browser stays open on errors)
DEBUG=true npm run test:e2e
```

**Test Structure** (`tests/`)
- **E2E Tests** (using Vitest + Puppeteer):
  - `e2e/basic-headers.test.ts`: Tests 1-3 (basic headers, multiple headers, match types)
  - `e2e/variables.test.ts`: Tests 4-7 (variable substitution scenarios)
  - `e2e/auto-refresh.test.ts`: Tests 8-15 (auto-refresh with GET/POST, transformations, error handling)
- **Test Helpers:**
  - `helpers/browser.ts`: Browser/extension launch and management utilities
  - `helpers/server.ts`: Test server lifecycle management
  - `helpers/config.ts`: Extension configuration helpers (rules, variables)
  - `helpers/types.ts`: TypeScript type definitions for tests
- **Infrastructure:**
  - `setup.ts`: Vitest global setup (starts/stops test server)
  - `server/test-server.ts`: Express server that echoes headers for testing
  - `fixtures/test-page.html`: Test page for AJAX requests
- `README.md`: Detailed testing documentation

**How Tests Work:**
1. Vitest global setup starts test server on `localhost:3333` that echoes received headers
2. Each test file launches its own browser instance via beforeEach/afterEach hooks
3. Puppeteer launches Chrome with the extension loaded from `dist/`
4. Tests configure rules via the Options page UI using helper functions
5. Test page makes requests to verify headers are modified correctly
6. Tests run sequentially (not in parallel) to avoid browser conflicts
7. Tests use Puppeteer's bundled Chromium (no separate Chrome installation needed)

**Test Framework:**
- **Vitest**: Modern test runner with ESM support and fast execution
- **Puppeteer**: Browser automation for E2E testing
- Tests organized by functionality for easy maintenance and selective execution

## Documentation

The project includes comprehensive documentation in the `docs/` folder, which is automatically synced to the GitHub Wiki.

### Documentation Structure

```
docs/
├── Home.md                      # Main documentation landing page
├── Getting-Started.md           # Installation and first steps
├── Variables.md                 # Variables system documentation
├── Auto-Refresh-Tokens.md       # Auto-refresh feature guide
├── Advanced-Features.md         # Power user features
├── Examples.md                  # Real-world configuration examples
├── FAQ.md                       # Frequently asked questions
└── images/                      # Screenshots for documentation
    ├── README.md                # Screenshot catalog
    └── *.png                    # Screenshot files (15 files)
```

### Generating Documentation Screenshots

```bash
# Generate all documentation screenshots
npm run screenshots
```

This command:
1. Builds the extension (`npm run build`)
2. Launches Chrome with the extension loaded (via Puppeteer)
3. Creates various UI configurations (rules, variables, auto-refresh setups)
4. Captures screenshots in 1280x800 resolution (light theme)
5. Saves them to `docs/images/`

**Screenshot Generation Script:** `scripts/generate-screenshots.ts`
- Reuses test helpers from `tests/helpers/` (browser launch, configuration)
- Automatically creates 15+ screenshots covering all major features
- Screenshots are version-controlled and should be updated when UI changes

### Wiki Synchronization

Documentation is automatically synced to GitHub Wiki via GitHub Actions:
- **Workflow:** `.github/workflows/sync-wiki.yml`
- **Trigger:** Push to `master` branch with changes in `docs/**`
- **Synced content:**
  - All `*.md` files from `docs/`
  - All images from `docs/images/`
- **Requirements:** `WIKI_TOKEN` secret must be configured in repository settings

## Architecture

### Core Components

**Background Service Worker** (`src/background/background.ts`)
- Listens to Chrome storage changes and updates declarative net request rules dynamically
- Manages tab URL tracking via `tabUrls` Map
- Converts user rules into Chrome `declarativeNetRequest` rules with unique IDs (offset by 1000)
- Opens options page when extension icon is clicked

**Options UI** (`src/options/`)
- React-based settings interface for managing header modification rules
- `App.tsx`: Main component handling rule CRUD operations
- `RuleCard.tsx`: Displays individual rules with toggle/edit/delete controls
- `RuleEditor.tsx`: Modal form for creating/editing rules
- `index.css`: Tailwind CSS directives and base styles

**Storage Layer** (`src/utils/storage.ts`)
- Abstracts Chrome storage API with typed interfaces
- Storage key: `modhead_settings`
- Stores all rules in a single `AppSettings` object

**Type Definitions** (`src/types/index.ts`)
- `ModificationRule`: Defines a rule with target domain matching, optional tab URL filtering, and header modifications
- `MatchType`: 'startsWith' | 'endsWith' | 'equals' for URL pattern matching
- `HeaderModification`: Individual header name-value pairs

### Build Configuration

**Vite Config** (`vite.config.ts`)
- Custom plugin that post-processes build output:
  - Copies `manifest.json` and icons from `public/` to `dist/`
  - Moves `options.html` from nested location to dist root
  - Fixes HTML paths for Chrome extension compatibility
- Multiple entry points: `options` (HTML + React) and `background` (service worker)
- Code splitting: vendor chunks separated from project code
- Minification disabled for Chrome Web Store review requirements
- Source maps enabled for debugging

**Styling Configuration**
- **Tailwind CSS v4**: Utility-first CSS framework
- **PostCSS** (`postcss.config.js`): Processes Tailwind with `@tailwindcss/postcss` plugin
- **Tailwind Config** (`tailwind.config.js`): Configured to scan all React components in `src/`
- All styles are compiled into a single optimized CSS file during build

### Data Flow

1. User creates/edits rules in Options UI → saved to Chrome storage
2. Storage change event triggers background worker
3. Background worker converts rules to `declarativeNetRequest` format
4. Chrome applies rules to matching network requests
5. Headers are modified according to rule configuration

### Rule Processing Logic

Each modification rule generates multiple Chrome declarative rules:
- One Chrome rule per header modification
- Rule IDs: `RULE_ID_OFFSET + (ruleIndex * 100) + headerIndex`
- All resource types are affected (MAIN_FRAME, SUB_FRAME, XHR, SCRIPT, etc.)
- URL filtering based on `targetDomain` and `targetDomainMatchType`
- Tab URL filtering is defined but not currently implemented in the Chrome rules

## TypeScript Configuration

- Target: ES2020
- React JSX transform
- Strict mode enabled with unused variable/parameter checks
- Chrome types included via `@types/chrome`
- Path alias: `@/` maps to `./src/`

## Extension Loading

To load the extension in Chrome:
1. Run `npm run build`
2. Open Chrome → Extensions → Enable Developer Mode
3. Click "Load unpacked" → select the `dist/` directory

## Coding Standards

### CSS and Styling

**This project uses Tailwind CSS v4 for styling.**

**IMPORTANT: Inline styles are prohibited in this codebase.**

- NEVER use inline styles (`style={{ ... }}`) in React components
- Use Tailwind utility classes directly in className attributes
- For complex/repeated patterns, consider extracting to Tailwind `@layer components` in `index.css`
- Use arbitrary values `[value]` syntax for one-off custom values (e.g., `text-[#2c3e50]`, `w-[50px]`)
- Maintain consistency with existing Tailwind patterns in the codebase

**Bad:**
```tsx
<div style={{ marginTop: '10px', color: 'red' }}>...</div>
```

**Good:**
```tsx
<div className="mt-2.5 text-red-500">...</div>
```

**For custom values:**
```tsx
<div className="text-[#e74c3c] px-[30px]">...</div>
```

**For reusable components, extract to CSS:**
```css
/* src/options/index.css */
@layer components {
  .btn-primary {
    @apply px-5 py-2.5 bg-blue-500 text-white rounded hover:bg-blue-600;
  }
}
```

### Package Execution

**IMPORTANT: Do not use `npx` in this project.**

- Always use local npm scripts defined in `package.json` (`npm run ...`)
- Never use `npx` to run packages directly

### Workflow

**After completing code changes, always run in this order:**

1. `npm run lint` — check for type and linting errors
2. `npm run build` — build the project
3. `npm run test:e2e` — run tests
