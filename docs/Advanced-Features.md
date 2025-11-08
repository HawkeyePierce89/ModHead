# Advanced Features

This guide covers advanced ModHead features and patterns for power users.

## Table of Contents

- [Complex Response Transformations](#complex-response-transformations)
- [Nested Variable Usage](#nested-variable-usage)
- [Multi-Stage Authentication](#multi-stage-authentication)
- [Tab URL Filtering](#tab-url-filtering)
- [Dark Theme](#dark-theme)
- [Advanced URL Matching](#advanced-url-matching)
- [Performance Optimization](#performance-optimization)

## Complex Response Transformations

### Working with Deeply Nested JSON

For complex API responses, you can navigate deep into the JSON structure.

**Example Response:**
```json
{
  "status": "success",
  "metadata": {
    "timestamp": "2024-01-15T10:30:00Z",
    "version": "2.0"
  },
  "payload": {
    "authentication": {
      "credentials": {
        "access": {
          "token": "deep_nested_token_123",
          "expires": 3600
        }
      }
    }
  }
}
```

**Transform:** `payload.authentication.credentials.access.token`

**Result:** `deep_nested_token_123`

### Array Transformations

#### Access First Element
```json
{
  "tokens": ["primary_token", "secondary_token", "backup_token"]
}
```

**Transform:** `tokens[0]`
**Result:** `primary_token`

#### Access Nested Array Element
```json
{
  "users": [
    {
      "id": 1,
      "tokens": ["user1_token1", "user1_token2"]
    }
  ]
}
```

**Transform:** `users[0].tokens[0]`
**Result:** `user1_token1`

### Complex Template Transformations

#### Combining Multiple Fields
```json
{
  "auth": {
    "token": "abc123",
    "type": "Bearer",
    "version": "v2"
  }
}
```

**Transform:** `{{auth.type}} {{auth.token}} ({{auth.version}})`
**Result:** `Bearer abc123 (v2)`

#### Creating Custom Formats
```json
{
  "user_id": "12345",
  "session_id": "xyz789",
  "timestamp": "1640000000"
}
```

**Transform:** `user={{user_id}}&session={{session_id}}&ts={{timestamp}}`
**Result:** `user=12345&session=xyz789&ts=1640000000`

#### URL-Safe Formatting
```json
{
  "key": "my_api_key",
  "secret": "my_secret"
}
```

**Transform:** `key={{key}}&secret={{secret}}`
**Result:** `key=my_api_key&secret=my_secret`

Use in header:
```
Header: X-Credentials
Value: ${credentialsVar}
```

### Handling Different Response Types

#### Plain Text Responses

If the API returns plain text instead of JSON:

**Response:** `new_token_abc123`

**Transform:** Leave empty or use `$response`

**Result:** `new_token_abc123`

#### XML Responses

ModHead primarily works with JSON, but you can use the full response for XML:

**Response:**
```xml
<auth>
  <token>xml_token_123</token>
</auth>
```

**Transform:** `$response`

**Result:** The entire XML string

**Note:** You'll need to manually parse XML. Consider converting XML to JSON on the server side if possible.

## Nested Variable Usage

### Variables Referencing Variables

Variables can reference other variables, enabling powerful composition patterns.

**Example: Multi-Tier Authentication**

**Variables:**
```
refreshToken: long_lived_refresh_token_xyz
```

**Variable: accessToken**
```
Refresh Config:
  URL: https://auth.example.com/token
  Method: POST
  Headers:
    Authorization: Bearer ${refreshToken}
  Body:
    {
      "grant_type": "refresh_token"
    }
  Transform: access_token
```

**Variable: userApiKey**
```
Refresh Config:
  URL: https://api.example.com/keys
  Method: POST
  Headers:
    Authorization: Bearer ${accessToken}
  Transform: api_key
```

**Usage Chain:**
1. `accessToken` uses `refreshToken` to get a new access token
2. `userApiKey` uses `accessToken` to get an API key
3. Your rules use `${userApiKey}` in headers

### Avoiding Circular Dependencies

⚠️ **Warning:** Circular dependencies will cause errors.

**Invalid Configuration:**
```
Variable A refresh config uses ${B}
Variable B refresh config uses ${A}
```

**Solution:** Ensure variables form a directed acyclic graph (DAG):
```
refreshToken (no dependencies)
    ↓
accessToken (depends on refreshToken)
    ↓
apiKey (depends on accessToken)
```

## Multi-Stage Authentication

### Pattern 1: OAuth Flow with Multiple Tokens

**Stage 1: Long-Lived Refresh Token**
```
Variable: oauthRefreshToken
Value: (manually obtained refresh token)
```

**Stage 2: Short-Lived Access Token**
```
Variable: oauthAccessToken
Refresh Config:
  URL: https://oauth.example.com/token
  Method: POST
  Headers:
    Content-Type: application/x-www-form-urlencoded
  Body: "grant_type=refresh_token&refresh_token=${oauthRefreshToken}&client_id=xyz"
  Transform: access_token
```

**Stage 3: Service-Specific Token**
```
Variable: serviceToken
Refresh Config:
  URL: https://service.example.com/auth
  Method: POST
  Headers:
    Authorization: Bearer ${oauthAccessToken}
  Transform: service_access_token
```

### Pattern 2: JWT with API Key Derivation

**Stage 1: Master JWT**
```
Variable: masterJWT
Value: (manually set)
```

**Stage 2: Session JWT**
```
Variable: sessionJWT
Refresh Config:
  URL: https://auth.example.com/session/create
  Method: POST
  Headers:
    Authorization: Bearer ${masterJWT}
  Body:
    {
      "scope": "read write",
      "duration": 3600
    }
  Transform: jwt
```

**Stage 3: Encrypted API Key**
```
Variable: encryptedApiKey
Refresh Config:
  URL: https://api.example.com/keys/derive
  Method: POST
  Headers:
    Authorization: Bearer ${sessionJWT}
  Transform: encrypted_key
```

### Pattern 3: Database Credentials → App Token → API Key

**Stage 1: Database Credentials (Static)**
```
Variable: dbUsername
Value: admin

Variable: dbPassword
Value: secret123
Sensitive: ON
```

**Stage 2: Application Token**
```
Variable: appToken
Refresh Config:
  URL: https://app.example.com/auth/login
  Method: POST
  Body:
    {
      "username": "${dbUsername}",
      "password": "${dbPassword}"
    }
  Transform: token
```

**Stage 3: API Key**
```
Variable: apiKey
Refresh Config:
  URL: https://app.example.com/api/keys/generate
  Method: POST
  Headers:
    Authorization: Bearer ${appToken}
  Transform: api_key
```

## Tab URL Filtering

Tab URL filtering allows you to apply rules only when you're viewing a specific webpage.

### Use Case: Development Dashboard

**Scenario:** Only modify API headers when testing from your development dashboard.

**Configuration:**
```
Rule: Dev API Headers
Tab URL: localhost:3000/dashboard
Tab URL Match Type: startsWith
Target Domain: api.example.com
Target Domain Match Type: startsWith
Headers:
  - Authorization: Bearer ${devToken}
```

**Behavior:**
- ✅ Headers are modified when you're on `localhost:3000/dashboard` making requests to `api.example.com`
- ❌ Headers are NOT modified when you're on `localhost:3000/profile` making requests to `api.example.com`

### Use Case: Multi-Environment Testing

**Rule 1: Production Testing**
```
Tab URL: app.example.com
Target Domain: api.example.com
Headers:
  - Authorization: Bearer ${prodToken}
```

**Rule 2: Staging Testing**
```
Tab URL: staging.app.example.com
Target Domain: staging-api.example.com
Headers:
  - Authorization: Bearer ${stagingToken}
```

**Rule 3: Local Development**
```
Tab URL: localhost:3000
Target Domain: localhost:8080
Headers:
  - Authorization: Bearer ${devToken}
```

### When to Use Tab URL Filtering

**Good Use Cases:**
- Environment-specific configurations
- Preventing accidental production modifications
- Testing from specific admin panels or dashboards

**When NOT to Use:**
- Most general-purpose rules (leave Tab URL empty)
- When you want headers applied regardless of the current page
- When testing across multiple pages

**Note:** Currently, tab URL filtering is defined in the UI but not fully implemented in the rule processing logic. This feature may be fully activated in future versions.

## Dark Theme

ModHead includes a dark theme for reduced eye strain during extended use.

### Enabling Dark Theme

**Method 1: Theme Toggle**
1. Open ModHead options page
2. Click the theme toggle button in the top-right corner
3. Select "Dark" mode

**Method 2: Auto Mode**
- Select "Auto" to follow your system theme
- Changes automatically when your OS theme changes

### Theme Persistence

Your theme preference is:
- Saved in Chrome storage
- Synced across Chrome browsers
- Persists across browser restarts

### Customizing Theme (Advanced)

While there's no built-in theme customization, you can:
1. Fork the repository
2. Edit `src/options/index.css`
3. Modify CSS variables in the dark theme section
4. Build and load your custom version

## Advanced URL Matching

### Combining Multiple Match Types

Use multiple target domains with different match types to create complex matching logic.

**Example: Match API and CDN**
```
Rule: API & CDN Headers
Target Domains:
  1. api.example.com (startsWith)
  2. cdn.example.com (startsWith)
  3. static.example.com (startsWith)
Headers:
  - X-Custom-Header: shared_value
```

All three domains will receive the same headers.

### Match Specific File Types

**Example: JSON Files Only**
```
Target Domain: .json
Match Type: endsWith
```

This matches any URL ending with `.json`:
- `api.example.com/data.json` ✅
- `example.com/users.json` ✅
- `example.com/config.jsonp` ❌

### Match Specific Endpoints

**Example: Exact Login Endpoint**
```
Target Domain: api.example.com/auth/login
Match Type: equals
```

Only exact matches:
- `api.example.com/auth/login` ✅
- `api.example.com/auth/login?redirect=/home` ❌
- `api.example.com/auth/login/callback` ❌

**Note:** Query parameters and fragments may affect exact matching depending on Chrome's URL normalization.

### Wildcard-Like Behavior with startsWith

**Example: All Subdomains**
```
Target Domain: .example.com
Match Type: endsWith
```

Matches:
- `api.example.com` ✅
- `www.example.com` ✅
- `staging.api.example.com` ✅
- `example.com` ❌ (no leading subdomain)

## Performance Optimization

### Rule Organization

**Tip 1: Disable Unused Rules**
- Disabled rules don't create Chrome declarativeNetRequest rules
- Reduces overhead and improves performance
- Quick toggle for temporary rules

**Tip 2: Consolidate Similar Rules**
- Combine rules that share the same headers
- Use multiple target domains instead of multiple rules
- Reduces total number of Chrome rules

**Before (5 rules):**
```
Rule 1: api1.example.com → Header A
Rule 2: api2.example.com → Header A
Rule 3: api3.example.com → Header A
Rule 4: api4.example.com → Header A
Rule 5: api5.example.com → Header A
```

**After (1 rule):**
```
Rule 1:
  Target Domains:
    - api1.example.com
    - api2.example.com
    - api3.example.com
    - api4.example.com
    - api5.example.com
  Headers:
    - Header A
```

### Variable Efficiency

**Tip 1: Reuse Variables**
- Define once, use everywhere
- Reduces duplication and improves maintainability

**Tip 2: Minimize Refresh Frequency**
- Only refresh when necessary
- Use longer-lived tokens when possible
- Batch token refreshes if possible

### Chrome Rule Limits

Chrome has limits on the number of declarativeNetRequest rules:
- **Static rules:** 30,000 per extension (not applicable to ModHead)
- **Dynamic rules:** 5,000 per extension (used by ModHead)

ModHead creates rules as follows:
- Each header modification = 1 Chrome rule
- Rule ID = `RULE_ID_OFFSET + (ruleIndex * 100) + headerIndex`

**Example:**
- Rule 1 with 3 headers = 3 Chrome rules
- Rule 2 with 2 headers = 2 Chrome rules
- Total = 5 Chrome rules

With the 5,000 rule limit, you can have approximately:
- 5,000 rules with 1 header each
- 1,000 rules with 5 headers each
- 500 rules with 10 headers each

**In practice:** Most users will never hit this limit.

## Advanced Debugging

### Using Browser DevTools

**Step 1: Open DevTools**
1. Navigate to a page that triggers your rules
2. Open Chrome DevTools (F12)
3. Go to the **Network** tab

**Step 2: Inspect Headers**
1. Make a request (or reload the page)
2. Click on the request in the Network tab
3. Go to **Headers** section
4. Verify your headers are present under "Request Headers"

### Checking Background Service Worker

**Step 1: Open Extension Management**
1. Go to `chrome://extensions/`
2. Find ModHead
3. Click "Inspect views: background page"

**Step 2: Check Console**
- Look for errors or warnings
- Check that rules are being created correctly

### Testing with curl

Test your refresh configurations manually with curl:

```bash
curl -X POST https://auth.example.com/refresh \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_REFRESH_TOKEN" \
  -d '{"grant_type": "refresh_token"}'
```

Compare the response with your expected transformation.

## Tips and Best Practices

### Naming Conventions

**Rules:**
- Descriptive: "Production API Authentication"
- Environment-prefixed: "DEV - CORS Headers"
- Service-specific: "GitHub API Token"

**Variables:**
- camelCase: `accessToken`, `apiKey`, `userId`
- Prefixed: `devApiKey`, `prodJWT`, `stagingToken`

### Security Best Practices

1. **Use Sensitive Flag:** Mark all tokens and secrets as sensitive
2. **Short-Lived Tokens:** Prefer access tokens with auto-refresh over long-lived tokens
3. **Environment Separation:** Use different variables for dev/staging/prod
4. **Regular Rotation:** Periodically rotate tokens and secrets

### Organization Strategies

**Strategy 1: By Environment**
```
Rules:
  - DEV - All Headers
  - STAGING - All Headers
  - PROD - All Headers
```

**Strategy 2: By Service**
```
Rules:
  - GitHub API
  - AWS API
  - Internal API
```

**Strategy 3: By Purpose**
```
Rules:
  - Authentication Headers
  - CORS Headers
  - Custom Headers
```

## Next Steps

- **[Examples](./Examples.md)** - See real-world implementations
- **[FAQ](./FAQ.md)** - Common questions and troubleshooting
- **[Auto-Refresh Tokens](./Auto-Refresh-Tokens.md)** - Deep dive into token refresh

---

**Back to:** [Auto-Refresh Tokens](./Auto-Refresh-Tokens.md) | **Next:** [Examples](./Examples.md)
