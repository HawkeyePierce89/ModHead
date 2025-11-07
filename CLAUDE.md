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

# Run tests with visible browser
HEADLESS=false npm run test:e2e

# Run tests in debug mode (browser stays open on errors)
DEBUG=true npm run test:e2e
```

**Test Structure** (`tests/`)
- `e2e/extension.test.ts`: Main E2E test file using Puppeteer
- `server/test-server.ts`: Express server that echoes headers for testing
- `fixtures/test-page.html`: Test page for AJAX requests
- `README.md`: Detailed testing documentation

**How Tests Work:**
1. Test server runs on `localhost:3333` and echoes received headers
2. Puppeteer launches Chrome with the extension loaded from `dist/`
3. Tests configure rules via the Options page UI
4. Test page makes requests to verify headers are modified correctly
5. Tests use Puppeteer's bundled Chromium (no separate Chrome installation needed)

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

**IMPORTANT: Inline styles are prohibited in this codebase.**

- NEVER use inline styles (`style={{ ... }}`) in React components
- Always define styles in CSS files (e.g., `App.css`) and use CSS classes
- Use semantic class names that describe the purpose, not the appearance
- Keep styles maintainable and reusable through proper CSS architecture

**Bad:**
```tsx
<div style={{ marginTop: '10px', color: 'red' }}>...</div>
```

**Good:**
```tsx
<div className="error-message">...</div>
```
```css
.error-message {
  margin-top: 10px;
  color: red;
}
```
