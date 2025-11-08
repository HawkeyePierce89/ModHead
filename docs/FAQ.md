# Frequently Asked Questions (FAQ)

Common questions and answers about ModHead.

## Table of Contents

- [General Questions](#general-questions)
- [Security](#security)
- [Troubleshooting](#troubleshooting)
- [Limitations](#limitations)
- [When Rules Apply](#when-rules-apply)
- [Technical Questions](#technical-questions)

---

## General Questions

### What is ModHead?

ModHead is a Chrome extension that allows you to modify HTTP request headers dynamically based on user-defined rules. It uses Chrome's Manifest V3 `declarativeNetRequest` API for efficient and secure header modification.

### How is this different from other header modification extensions?

ModHead uses the modern Manifest V3 architecture, which provides:
- Better performance through declarative rules
- Enhanced security with limited permissions
- Chrome's native support for rule-based modifications
- Support for variables and auto-refresh tokens

### Does ModHead work on all websites?

ModHead modifies headers for URLs that match your configured rules. It works on all websites where Chrome's `declarativeNetRequest` API is allowed, which includes most websites.

**Exception:** Chrome Web Store and some Chrome internal pages (`chrome://`) do not allow extensions to modify headers.

### Is ModHead open source?

Yes! ModHead is an open-source project. You can view the source code, contribute, or report issues on GitHub.

---

## Security

### Are my tokens and API keys stored securely?

⚠️ **Important:** Variables and rules are stored in **plain text** in Chrome's `storage.sync` API.

**Security implications:**
- Data is NOT encrypted
- Data syncs across all Chrome browsers signed into your Google account
- Any extension with storage permissions could potentially access this data
- Data is stored locally on your device(s)

**Recommendations:**
1. **Don't store production credentials** in ModHead
2. **Use development/staging tokens** when possible
3. **Leverage auto-refresh** to use short-lived tokens
4. **Mark sensitive variables** as "Sensitive" to hide them in the UI (this only masks the display, it doesn't encrypt the value)
5. **Regularly rotate** your tokens and API keys
6. **Be cautious** when sharing your Chrome profile or screenshots

### What does the "Sensitive" variable flag do?

The "Sensitive" flag masks the variable value in the UI, displaying it as `••••••••` instead of plain text.

**What it does:**
- Hides the value in the options page
- Prevents shoulder-surfing
- Helps avoid accidental exposure in screenshots

**What it does NOT do:**
- Encrypt the value in storage
- Protect against malicious extensions
- Prevent syncing to other devices

### Can I use ModHead for production systems?

ModHead is designed for **development and testing** purposes. While it's technically possible to use it in production scenarios, we strongly recommend against it due to:
- Plain text storage of credentials
- Manual configuration requirements
- Potential for misconfiguration
- Security risks

**For production:**
- Use proper authentication flows in your application code
- Store credentials in secure vaults (AWS Secrets Manager, HashiCorp Vault, etc.)
- Implement token refresh logic in your backend
- Follow security best practices for your specific use case

### What data does ModHead collect?

ModHead does NOT collect, transmit, or share any user data. All configuration is stored locally in Chrome's storage and optionally synced via your Google account (if Chrome sync is enabled).

---

## Troubleshooting

### My headers are not being added

**Possible causes and solutions:**

1. **Rule is disabled**
   - Check that the rule toggle is ON
   - Disabled rules don't modify headers

2. **URL pattern doesn't match**
   - Verify the target domain matches the request URL
   - Check the match type (startsWith, endsWith, equals)
   - Test with a simpler pattern first

3. **Rule hasn't been saved**
   - Make sure you clicked "Save" after editing
   - Check if the rule appears in the rules list

4. **Browser cache**
   - Clear your browser cache
   - Try in an Incognito window
   - Reload the page after saving rules

5. **Chrome Web Store pages**
   - Extensions cannot modify headers on Chrome Web Store or `chrome://` pages

**Debugging steps:**
1. Open Chrome DevTools (F12)
2. Go to Network tab
3. Make a request to your target URL
4. Check the request headers
5. Verify your headers are present

### Variables are not being replaced

**Problem:** Header shows `${variableName}` instead of the actual value.

**Solutions:**

1. **Variable doesn't exist**
   - Check spelling (case-sensitive)
   - Verify the variable exists in the Variables section

2. **Syntax error**
   - Correct: `${variableName}`
   - Incorrect: `$variableName`, `{variableName}`, `${ variableName }` (extra spaces)

3. **Variable not saved**
   - Ensure you saved the variable after creating/editing it

### Auto-refresh is not working

**Problem:** Variable value doesn't update when clicking refresh.

**Solutions:**

1. **Check the refresh URL**
   - Verify the URL is correct and accessible
   - Test the endpoint with curl or Postman

2. **Verify HTTP method and headers**
   - Ensure the method (GET, POST, etc.) is correct
   - Check that required headers are included

3. **Check response transformation**
   - Verify the transform path matches the response structure
   - Use `$response` to see the full response
   - Check for typos in the path (case-sensitive)

4. **Check for errors**
   - Open the browser console (F12)
   - Look for error messages
   - Check the Network tab for failed requests

5. **CORS issues**
   - The refresh request must allow cross-origin requests from the extension
   - Contact your API provider if CORS is blocking the request

### Extension is not loading

**Solutions:**

1. **Check Chrome extensions page**
   - Go to `chrome://extensions/`
   - Verify ModHead is installed and enabled

2. **Reload the extension**
   - Click the reload icon on the extension card

3. **Check for errors**
   - Look for errors on the extension card
   - Click "Errors" if available to see details

4. **Reinstall the extension**
   - Remove ModHead
   - Reinstall from source or Chrome Web Store

### Dark theme is not working

**Solutions:**

1. **Check theme setting**
   - Click the theme toggle in the options page
   - Try switching between Light, Dark, and Auto

2. **Clear cache**
   - Clear browser cache
   - Reload the options page

3. **Auto mode**
   - If set to Auto, theme follows your system settings
   - Change your OS theme to test

---

## Limitations

### What are ModHead's current limitations?

1. **No automatic time-based refresh**
   - Currently, auto-refresh is triggered manually
   - Future versions may support time-based automatic refresh

2. **Tab URL filtering not fully implemented**
   - The UI allows configuring tab URL filters
   - The background worker doesn't currently apply this filter
   - Will be implemented in future versions

3. **No conditional logic**
   - Cannot use if/else or other conditional logic in rules
   - Cannot dynamically enable/disable rules based on conditions

4. **No request body modification**
   - ModHead only modifies headers, not request bodies
   - Cannot intercept or modify POST data

5. **No response header modification**
   - Only modifies request headers
   - Cannot modify response headers from the server

6. **Plain text storage**
   - No encryption for stored variables and rules
   - See [Security](#security) section for details

7. **Chrome rule limits**
   - Maximum 5,000 dynamic declarativeNetRequest rules
   - Each header modification = 1 rule
   - In practice, this limit is rarely reached

### Can ModHead modify response headers?

No, ModHead only modifies **request headers** (headers sent from the browser to the server).

**Workarounds:**
- Configure your server to send the desired response headers
- Use a local proxy that can modify response headers
- Use browser DevTools to override response headers for testing

### Can ModHead modify request bodies?

No, ModHead only modifies headers, not request bodies.

**Workarounds:**
- Modify the request in your application code
- Use a local proxy that can modify request bodies
- Use tools like Postman for testing specific payloads

### Does ModHead work in Incognito mode?

By default, Chrome extensions are disabled in Incognito mode.

**To enable in Incognito:**
1. Go to `chrome://extensions/`
2. Find ModHead
3. Click "Details"
4. Enable "Allow in Incognito"

**Note:** Your rules and variables will still be available in Incognito mode if you enable this setting.

---

## When Rules Apply

### When are my rules applied?

Rules are applied in real-time as Chrome makes network requests.

**Application flow:**
1. You save a rule in ModHead
2. ModHead updates Chrome's declarativeNetRequest rules
3. Chrome applies the rules to matching network requests
4. Headers are modified before the request is sent

**No reload required:** Rules take effect immediately for new requests.

### Do rules apply to all request types?

Yes, rules apply to all request types, including:
- Main frames (page loads)
- Sub-frames (iframes)
- XHR (AJAX requests)
- Fetch API requests
- Script loads
- Stylesheet loads
- Image loads
- And all other resource types

### What happens when multiple rules match?

If multiple rules match the same URL, all matching rules are applied.

**Example:**

**Rule 1:**
- Target: `api.example.com`
- Header: `X-API-Key: key123`

**Rule 2:**
- Target: `api.example.com`
- Header: `Authorization: Bearer token456`

**Request to `api.example.com/users`:**
```
X-API-Key: key123
Authorization: Bearer token456
```

Both headers are added.

**If headers conflict:**
- Chrome will apply rules in order of rule ID
- The last matching rule wins for a specific header name

**Best practice:** Avoid creating conflicting rules.

### Do disabled rules still work?

No, disabled rules do not modify headers. Toggle a rule OFF to temporarily disable it without deleting the configuration.

---

## Technical Questions

### How does ModHead work internally?

**Architecture:**

1. **Options UI (React)**
   - User interface for managing rules and variables
   - Stores configuration in Chrome storage

2. **Background Service Worker**
   - Listens for storage changes
   - Converts user rules to Chrome `declarativeNetRequest` rules
   - Updates Chrome's dynamic rules

3. **Chrome declarativeNetRequest API**
   - Native Chrome API for efficient rule-based modifications
   - Applies header modifications without extension overhead

**Data flow:**
```
User creates rule → Saved to storage → Background worker notified
→ Converts to Chrome rules → Chrome applies rules to requests
```

### What is the difference between startsWith, endsWith, and equals?

**startsWith:**
- Pattern: `api.example.com`
- Matches: `api.example.com`, `api.example.com/users`, `api.example.com/products/123`
- Doesn't match: `www.api.example.com`, `example.com/api`

**endsWith:**
- Pattern: `.json`
- Matches: `api.example.com/data.json`, `example.com/config.json`
- Doesn't match: `example.com/data.xml`, `example.com/json`

**equals:**
- Pattern: `api.example.com/auth/login`
- Matches: `api.example.com/auth/login` (exact match only)
- Doesn't match: `api.example.com/auth/login?redirect=/home`

### How are Chrome rule IDs calculated?

ModHead generates unique rule IDs using this formula:
```
RULE_ID_OFFSET + (ruleIndex * 100) + headerIndex
```

**Where:**
- `RULE_ID_OFFSET = 1000`
- `ruleIndex` = position of the rule in the rules array
- `headerIndex` = position of the header within that rule

**Example:**
- Rule 0, Header 0 = ID 1000
- Rule 0, Header 1 = ID 1001
- Rule 1, Header 0 = ID 1100

This ensures unique IDs and allows up to 100 headers per rule.

### Can I export/import my configuration?

Currently, ModHead doesn't have a built-in export/import feature.

**Workaround:**
1. Open Chrome DevTools console on the options page
2. Run: `chrome.storage.sync.get('modhead_settings', console.log)`
3. Copy the JSON output
4. To import, run: `chrome.storage.sync.set({modhead_settings: YOUR_JSON_HERE})`

**Note:** Be careful when manually editing storage. Invalid JSON will break ModHead.

**Future feature:** Export/import UI may be added in future versions.

### Does ModHead work on other browsers?

ModHead is currently designed for Chrome and Chromium-based browsers (Edge, Brave, etc.).

**Compatibility:**
- ✅ Chrome
- ✅ Microsoft Edge
- ✅ Brave
- ✅ Other Chromium-based browsers
- ❌ Firefox (uses different extension APIs)
- ❌ Safari (different extension architecture)

**For Firefox/Safari:** A port would require significant changes to use their respective APIs.

---

## Still Have Questions?

If your question isn't answered here:

1. **Check the documentation:**
   - [Getting Started](./Getting-Started.md)
   - [Variables](./Variables.md)
   - [Auto-Refresh Tokens](./Auto-Refresh-Tokens.md)
   - [Advanced Features](./Advanced-Features.md)
   - [Examples](./Examples.md)

2. **Open an issue on GitHub** with:
   - Detailed description of the problem
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable

3. **Check existing GitHub issues** for similar questions

---

**Back to:** [Home](./Home.md) | **Examples:** [Examples](./Examples.md)
