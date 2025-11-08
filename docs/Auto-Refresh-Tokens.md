# Auto-Refresh Tokens

One of ModHead's most powerful features is the ability to automatically refresh authentication tokens before they expire. This eliminates the need to manually update tokens and enables seamless testing of authenticated APIs.

## Why Auto-Refresh?

### The Problem

Many modern APIs use short-lived access tokens for security:
- OAuth 2.0 access tokens typically expire in 1-24 hours
- JWT tokens often have similar expiration times
- Session tokens may expire after inactivity

Without auto-refresh, you would need to:
1. Wait for the token to expire
2. Manually obtain a new token
3. Update the variable/header in ModHead
4. Resume testing

This interrupts your workflow and wastes time.

### The Solution

ModHead can automatically:
1. Make an HTTP request to your token refresh endpoint
2. Extract the new token from the response
3. Update the variable value
4. Continue working seamlessly

## Setting Up Auto-Refresh

### Basic Configuration

1. **Create or edit a variable**
2. **Scroll to "Refresh Configuration"**
3. **Click "Enable Auto-Refresh"**
4. **Configure the refresh request:**

**Required Fields:**
- **URL**: The endpoint to request a new token
- **Method**: HTTP method (GET, POST, PUT, PATCH, DELETE)

**Optional Fields:**
- **Headers**: Additional headers for the request
- **Body**: Request body (for POST/PUT/PATCH/DELETE)
- **Transform Response**: How to extract the token from the response

### Example: Simple GET Request

**Variable:** `accessToken`

**Refresh Config:**
```
URL: https://auth.example.com/token
Method: GET
Headers:
  Authorization: Bearer ${refreshToken}
Transform Response: access_token
```

**How it works:**
1. ModHead sends: `GET https://auth.example.com/token` with the refresh token
2. Server responds with: `{ "access_token": "new_token_123" }`
3. ModHead extracts `new_token_123` using the transform path
4. Variable `accessToken` is updated to `new_token_123`

Here's what the auto-refresh configuration looks like:

![Auto-Refresh Configuration](images/11-auto-refresh-config.png)

## HTTP Methods

ModHead supports all standard HTTP methods for refresh requests.

### GET

Best for: Simple token refresh endpoints that don't require a body.

**Example:**
```
URL: https://api.example.com/auth/refresh
Method: GET
Headers:
  X-Refresh-Token: ${refreshToken}
```

### POST

Best for: Most OAuth 2.0 and JWT refresh flows.

**Example:**
```
URL: https://auth.example.com/oauth/token
Method: POST
Headers:
  Content-Type: application/json
Body:
  {
    "grant_type": "refresh_token",
    "refresh_token": "${refreshToken}",
    "client_id": "your_client_id"
  }
Transform Response: access_token
```

### PUT

Best for: RESTful APIs that use PUT for updates.

**Example:**
```
URL: https://api.example.com/session/renew
Method: PUT
Headers:
  Content-Type: application/json
Body:
  {
    "session_id": "${sessionId}"
  }
```

### PATCH

Best for: Partial updates or specific token refresh implementations.

**Example:**
```
URL: https://api.example.com/tokens/current
Method: PATCH
Body:
  {
    "action": "refresh"
  }
```

### DELETE

Rarely used for token refresh, but available if your API requires it.

## Adding Headers to Refresh Requests

You can add custom headers to your refresh requests.

### Example: API Key Authentication

```
Method: POST
URL: https://auth.example.com/refresh
Headers:
  X-API-Key: your_api_key_here
  Content-Type: application/json
Body:
  {
    "refresh_token": "${refreshToken}"
  }
```

### Example: Multiple Headers

```
Headers:
  Authorization: Basic dXNlcm5hbWU6cGFzc3dvcmQ=
  Content-Type: application/json
  Accept: application/json
  X-Client-Version: 1.0.0
```

### Using Variables in Headers

You can reference other variables in refresh request headers:

```
Headers:
  X-API-Key: ${apiKey}
  X-Client-ID: ${clientId}
  Authorization: Bearer ${refreshToken}
```

## Request Body Configuration

The request body can be configured in two formats:

### JSON Object (Recommended)

ModHead will automatically serialize the object to JSON and set the appropriate `Content-Type`.

**Example:**
```
Body:
  {
    "grant_type": "refresh_token",
    "refresh_token": "${refreshToken}",
    "client_id": "abc123",
    "scope": "read write"
  }
```

**Sent as:**
```json
{
  "grant_type": "refresh_token",
  "refresh_token": "actual_refresh_token_value",
  "client_id": "abc123",
  "scope": "read write"
}
```

### Plain Text / Custom Format

For non-JSON payloads, use a string.

**Example: Form URL-Encoded**
```
Headers:
  Content-Type: application/x-www-form-urlencoded
Body: "grant_type=refresh_token&refresh_token=${refreshToken}&client_id=abc123"
```

**Example: XML**
```
Headers:
  Content-Type: application/xml
Body: "<refresh><token>${refreshToken}</token></refresh>"
```

## Response Transformation

Response transformation tells ModHead how to extract the new token value from the refresh response.

### Method 1: JSON Path (Most Common)

Extract a specific field from a JSON response using dot notation.

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

**Transform:** `access_token`

**Result:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

#### Nested Fields

For nested JSON objects, use dot notation:

**Response:**
```json
{
  "data": {
    "auth": {
      "token": "new_token_123"
    }
  }
}
```

**Transform:** `data.auth.token`

**Result:** `new_token_123`

#### Array Access

Access array elements by index:

**Response:**
```json
{
  "tokens": ["token1", "token2", "token3"]
}
```

**Transform:** `tokens[0]`

**Result:** `token1`

### Method 2: Template Syntax

Combine multiple fields or add formatting using template syntax.

**Response:**
```json
{
  "token": "abc123",
  "type": "Bearer"
}
```

**Transform:** `{{type}} {{token}}`

**Result:** `Bearer abc123`

#### Multiple Fields

**Response:**
```json
{
  "user_id": "12345",
  "session_token": "xyz789"
}
```

**Transform:** `user={{user_id}}&token={{session_token}}`

**Result:** `user=12345&token=xyz789`

### Method 3: Full Response

Store the entire response as the variable value.

**Transform:** Leave empty or set to `$response`

**Use case:** When you need the entire response object for later parsing or when the response is already in the correct format.

## Practical Examples

### Example 1: OAuth 2.0 Token Refresh

**Scenario:** Refresh an OAuth 2.0 access token using a refresh token.

**Variable:** `oauthAccessToken`

**Refresh Config:**
```
URL: https://oauth.example.com/token
Method: POST
Headers:
  Content-Type: application/x-www-form-urlencoded
Body: "grant_type=refresh_token&refresh_token=your_refresh_token&client_id=your_client_id&client_secret=your_client_secret"
Transform Response: access_token
```

**Response:**
```json
{
  "access_token": "new_access_token_here",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "new_refresh_token_here"
}
```

### Example 2: JWT Token Refresh

**Scenario:** Refresh a JWT using a custom API endpoint.

**Variable:** `jwtToken`

**Refresh Config:**
```
URL: https://api.example.com/auth/refresh
Method: POST
Headers:
  Content-Type: application/json
  Authorization: Bearer ${refreshToken}
Body:
  {
    "device_id": "device_123"
  }
Transform Response: jwt
```

**Response:**
```json
{
  "jwt": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_at": "2024-12-31T23:59:59Z"
}
```

### Example 3: Session Token with Nested Response

**Scenario:** Extract a session token from a nested API response.

**Variable:** `sessionToken`

**Refresh Config:**
```
URL: https://api.example.com/session/renew
Method: PUT
Headers:
  Content-Type: application/json
Body:
  {
    "user_id": "${userId}",
    "current_session": "${sessionToken}"
  }
Transform Response: data.session.token
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "session": {
      "token": "new_session_token_xyz",
      "expires_in": 1800
    }
  }
}
```

### Example 4: Multi-Stage Authentication

**Scenario:** Use one token to obtain another.

**Variable 1:** `refreshToken` (long-lived)
```
Value: long_lived_refresh_token
```

**Variable 2:** `accessToken` (short-lived)
```
Refresh Config:
  URL: https://auth.example.com/token
  Method: POST
  Headers:
    Authorization: Bearer ${refreshToken}
  Transform Response: access_token
```

**Variable 3:** `apiKey` (derived from access token)
```
Refresh Config:
  URL: https://api.example.com/keys/generate
  Method: POST
  Headers:
    Authorization: Bearer ${accessToken}
  Transform Response: api_key
```

This creates a chain: `refreshToken` → `accessToken` → `apiKey`

### Example 5: Bearer Token with Template

**Scenario:** Automatically format the token as a Bearer token.

**Variable:** `authHeader`

**Refresh Config:**
```
URL: https://auth.example.com/token
Method: GET
Headers:
  X-Refresh-Token: ${refreshToken}
Transform Response: Bearer {{access_token}}
```

**Response:**
```json
{
  "access_token": "abc123xyz789"
}
```

**Result:** Variable value becomes `Bearer abc123xyz789`

## When Does Auto-Refresh Trigger?

**Current Behavior:**
- Auto-refresh is triggered manually when you click a refresh button in the Variables section
- Future versions may support automatic time-based refresh

**Manual Refresh:**
1. Open the ModHead options page
2. Navigate to the Variables section
3. Click the **Refresh** button next to the variable

**Tip:** Refresh your tokens before starting a long testing session.

## Error Handling

### Network Errors

If the refresh request fails (network error, timeout, etc.):
- The variable value remains unchanged
- An error notification is displayed
- Check the browser console for detailed error messages

### Invalid Response

If the response doesn't contain the expected field:
- The variable value remains unchanged
- Check that the `Transform Response` path is correct
- Verify the API response structure

### Authentication Failures

If the refresh token is invalid or expired:
- The request will fail with a 401/403 error
- You'll need to obtain a new refresh token manually
- Update the `refreshToken` variable with a valid value

## Troubleshooting

### Problem: Refresh Button Doesn't Work

**Solutions:**
1. Check the browser console for error messages
2. Verify the refresh URL is correct and accessible
3. Test the URL manually (e.g., with Postman or curl)
4. Check that required headers are included

### Problem: Token Not Extracted Correctly

**Solutions:**
1. Verify the response structure matches your transform path
2. Test the API response manually to see the actual structure
3. Try using the full response (`$response`) to see what you're getting
4. Check for typos in the transform path (case-sensitive)

### Problem: Variables Not Replaced in Body/Headers

**Solutions:**
1. Ensure the referenced variable exists
2. Check variable name spelling (case-sensitive)
3. Verify the syntax: `${variableName}` (not `$variableName` or `{variableName}`)

### Problem: CORS Errors

**Solutions:**
1. The refresh request is made from the browser extension context
2. If the API has strict CORS policies, it may block the request
3. Contact your API provider to whitelist Chrome extension requests
4. Consider using a proxy server if CORS cannot be resolved

### Debugging Tips

1. **Test the endpoint manually** with curl or Postman first
2. **Use the full response** transform initially to see what you're getting
3. **Check the browser DevTools console** for detailed error messages
4. **Verify variable substitution** by checking what's actually sent
5. **Start simple** and add complexity gradually

## Security Considerations

⚠️ **Important:**

1. **Credentials in Config**: Refresh configs may contain sensitive data (client secrets, refresh tokens)
2. **Plain Text Storage**: All data is stored unencrypted in Chrome storage
3. **Synced Across Devices**: Configs sync with your Chrome account
4. **Use Sensitive Variables**: Mark tokens and secrets as sensitive to mask them in the UI

**Best Practices:**
- Use environment-specific tokens (dev/staging, not production)
- Rotate tokens regularly
- Don't commit tokens to version control
- Use short-lived access tokens with longer-lived refresh tokens
- Consider using variables for all sensitive values

See [FAQ - Security](./FAQ.md#security) for more information.

## Advanced Patterns

### Pattern 1: Chained Token Refresh

Use multiple variables that depend on each other:

```
refreshToken (manual, long-lived)
  ↓
accessToken (auto-refresh using refreshToken)
  ↓
apiKey (auto-refresh using accessToken)
```

### Pattern 2: Multi-Endpoint Authentication

Different APIs may require different tokens:

```
Variable: api1Token
Refresh Config: https://auth1.example.com/refresh

Variable: api2Token
Refresh Config: https://auth2.example.com/refresh
```

### Pattern 3: Conditional Refresh

While ModHead doesn't support conditional logic directly, you can:
1. Create multiple variables for different environments
2. Switch between them by changing the variable name in your rules

## Next Steps

- **[Advanced Features](./Advanced-Features.md)** - Complex transformation patterns
- **[Examples](./Examples.md)** - Real-world OAuth and JWT examples
- **[Variables](./Variables.md)** - Variable system overview

---

**Back to:** [Variables](./Variables.md) | **Next:** [Advanced Features](./Advanced-Features.md)
