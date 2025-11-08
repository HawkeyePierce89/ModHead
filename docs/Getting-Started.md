# Getting Started with ModHead

This guide will help you install ModHead and create your first header modification rule.

## Installation

ModHead can be installed in two ways:

### Option 1: From Source (Development)

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-repo/ModHead.git
   cd ModHead
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the extension**
   ```bash
   npm run build
   ```

4. **Load in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right corner)
   - Click "Load unpacked"
   - Select the `dist/` directory from the ModHead project

5. **Verify installation**
   - You should see the ModHead icon in your Chrome toolbar
   - Click the icon to open the Options page

### Option 2: Chrome Web Store (Coming Soon)

The extension will be available on the Chrome Web Store soon.

## Opening the Options Page

There are two ways to access ModHead's options page:

1. **Click the extension icon** in the Chrome toolbar
2. **Right-click the icon** → Select "Options"

## Creating Your First Rule

Let's create a simple rule to add a custom header to all requests to `httpbin.org`.

### Step 1: Create a New Rule

1. Click the **"Create Rule"** button
2. The rule editor modal will open

### Step 2: Configure Basic Settings

**Rule Name:** Give your rule a descriptive name
```
Example: "HTTPBin Test Header"
```

**Enable Rule:** Make sure the toggle is ON (enabled by default)

### Step 3: Add Target Domain

Target domains specify which URLs should have their headers modified.

1. Click **"Add Target Domain"**
2. **URL:** `httpbin.org`
3. **Match Type:** Select `startsWith`

This will match all URLs that start with `httpbin.org` (e.g., `httpbin.org/get`, `httpbin.org/headers`, etc.)

### Step 4: Add Header Modification

1. Click **"Add Header"**
2. **Header Name:** `X-Custom-Header`
3. **Header Value:** `Hello from ModHead`

### Step 5: Save the Rule

Click **"Save"** to create the rule.

## Understanding URL Pattern Matching

ModHead offers three match types for flexible URL filtering:

### `startsWith`
Matches URLs that start with the specified pattern.

**Example:**
- Pattern: `api.example.com`
- ✅ Matches: `api.example.com/users`, `api.example.com/products/123`
- ❌ Doesn't match: `example.com/api`, `www.api.example.com`

**Use case:** Match all endpoints under a specific domain

### `endsWith`
Matches URLs that end with the specified pattern.

**Example:**
- Pattern: `.json`
- ✅ Matches: `api.example.com/data.json`, `example.com/config.json`
- ❌ Doesn't match: `example.com/data.xml`, `example.com/json`

**Use case:** Match specific file types or path patterns

### `equals`
Matches URLs that exactly match the specified pattern.

**Example:**
- Pattern: `api.example.com/auth/login`
- ✅ Matches: `api.example.com/auth/login`
- ❌ Doesn't match: `api.example.com/auth/login/callback`, `api.example.com/auth`

**Use case:** Target a specific endpoint

## Multiple Target Domains

A single rule can have multiple target domains with different match types:

**Example: API Development Rule**
- Target 1: `localhost:3000` (startsWith) - Local development
- Target 2: `dev-api.example.com` (startsWith) - Development server
- Target 3: `staging-api.example.com` (startsWith) - Staging server

All three domains will receive the same header modifications.

## Multiple Headers

You can add multiple headers to a single rule:

**Example: Authentication and Content Type**
```
Header 1:
  Name: Authorization
  Value: Bearer YOUR_TOKEN_HERE

Header 2:
  Name: Content-Type
  Value: application/json

Header 3:
  Name: X-API-Version
  Value: v2
```

## Testing Your Rule

Let's verify that your rule is working:

1. **Open a new tab** in Chrome
2. **Navigate to** `https://httpbin.org/headers`
3. **Look for your header** in the response

You should see `X-Custom-Header: Hello from ModHead` in the returned headers.

## Managing Rules

### Enable/Disable Rules

Click the toggle switch on any rule card to enable or disable it without deleting.

**Tip:** Disable rules you don't need right now instead of deleting them.

### Edit Rules

Click the **Edit** button (pencil icon) on any rule card to modify it.

### Delete Rules

Click the **Delete** button (trash icon) to permanently remove a rule.

**Warning:** This action cannot be undone. You'll be asked to confirm.

## Tab URL Filtering (Optional)

Tab URL filtering allows you to apply rules only when you're on a specific website.

**Example Use Case:**
- Only modify headers when testing on your development dashboard
- Tab URL: `localhost:3000/dashboard`
- Target Domain: `api.example.com`

This means the headers will only be modified for `api.example.com` requests when you're viewing `localhost:3000/dashboard`.

**Note:** This is an advanced feature. Leave it empty for most use cases.

## Common Use Cases

### 1. Add API Key to All Requests

```
Rule Name: Production API Key
Target Domain: api.example.com (startsWith)
Headers:
  - X-API-Key: your-api-key-here
```

### 2. CORS Headers for Local Development

```
Rule Name: Dev CORS Headers
Target Domain: localhost:3000 (startsWith)
Headers:
  - Access-Control-Allow-Origin: *
  - Access-Control-Allow-Methods: GET, POST, PUT, DELETE
  - Access-Control-Allow-Headers: Content-Type, Authorization
```

### 3. Bearer Token Authentication

```
Rule Name: Auth Token
Target Domain: secure-api.example.com (startsWith)
Headers:
  - Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Next Steps

Now that you've created your first rule, explore these advanced features:

- **[Variables](./Variables.md)** - Reuse values across multiple rules
- **[Auto-Refresh Tokens](./Auto-Refresh-Tokens.md)** - Automatically refresh authentication tokens
- **[Examples](./Examples.md)** - Real-world configuration examples
- **[Advanced Features](./Advanced-Features.md)** - Power user features

## Troubleshooting

### Headers Not Being Applied

1. **Check if the rule is enabled** (toggle should be ON)
2. **Verify the URL pattern** matches your target
3. **Check the browser console** for any errors
4. **Try reloading the page** after saving the rule

### Extension Not Showing

1. **Check Chrome extensions page** (`chrome://extensions/`)
2. **Ensure ModHead is enabled**
3. **Try disabling and re-enabling** the extension
4. **Check for errors** in the extension details

For more help, see the [FAQ](./FAQ.md).

---

**Next:** Learn about [Variables](./Variables.md) to make your rules more flexible and maintainable.
