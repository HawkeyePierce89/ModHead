# Documentation Screenshots

This directory contains screenshots for the ModHead documentation.

## Screenshot List

### UI Components

| File | Description | Used In |
|------|-------------|---------|
| `01-options-page-empty.png` | Empty options page (initial state) | Getting-Started.md |
| `02-rule-editor-empty.png` | Empty rule editor modal | Getting-Started.md |
| `03-rule-single-header.png` | Rule card with single header | Getting-Started.md |
| `04-rule-card.png` | Rule card with multiple headers | - |
| `05-multiple-rules.png` | Options page with multiple rules | Home.md |
| `06-url-pattern-matching.png` | Rule with different URL match types | Getting-Started.md |
| `08-variable-editor-empty.png` | Empty variable editor modal | Variables.md |

### Variables

| File | Description | Used In |
|------|-------------|---------|
| `07-variables-section.png` | Variables section with multiple variables | Variables.md |
| `09-variable-in-header.png` | Variable usage in header values | Variables.md |
| `10-sensitive-variable-masked.png` | Sensitive variable with masked value | Variables.md |

### Auto-Refresh

| File | Description | Used In |
|------|-------------|---------|
| `11-auto-refresh-config.png` | Auto-refresh configuration interface | Auto-Refresh-Tokens.md |
| `12-jwt-refresh-example.png` | JWT token with auto-refresh setup | Examples.md |
| `13-oauth-example.png` | OAuth 2.0 configuration example | Examples.md |

### Feature Examples

| File | Description | Used In |
|------|-------------|---------|
| `14-multiple-headers.png` | Rule with multiple custom headers | Getting-Started.md |
| `15-cors-headers.png` | CORS headers configuration | Examples.md |

## Generation

Screenshots are automatically generated using:

```bash
npm run screenshots
```

This command:
1. Builds the extension (`npm run build`)
2. Runs the screenshot generation script (`scripts/generate-screenshots.ts`)
3. Saves all screenshots to this directory

The generation script uses Puppeteer to:
- Launch Chrome with the extension loaded
- Create various configurations (rules, variables, auto-refresh)
- Capture screenshots of different UI states
- Save them as PNG files

## Screenshot Specifications

- **Resolution**: 1280x800
- **Format**: PNG
- **Theme**: Light mode only
- **Browser**: Chrome/Chromium (via Puppeteer)

## Updating Screenshots

If the UI changes and screenshots need to be updated:

1. Make your changes to the extension
2. Run `npm run screenshots` to regenerate all screenshots
3. Review the updated screenshots
4. Commit the changes

## Notes

- Screenshots are version controlled and should be updated when significant UI changes occur
- The GitHub Action workflow (`.github/workflows/sync-wiki.yml`) automatically syncs this directory to the GitHub Wiki
- All screenshots use English language interface
- Screenshots are captured in headless mode for consistency
