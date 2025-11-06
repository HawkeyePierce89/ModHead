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
