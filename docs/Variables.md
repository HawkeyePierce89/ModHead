# Variables

Variables in ModHead allow you to define reusable values that can be used across multiple rules, making your configuration more maintainable and flexible.

## What Are Variables?

Variables are named placeholders that store values you can reuse throughout your header configurations. Instead of duplicating the same value across multiple rules, you define it once as a variable and reference it wherever needed.

### Benefits of Using Variables

- **Maintainability**: Update a value in one place instead of editing multiple rules
- **Security**: Sensitive variables are masked in the UI (password-style display)
- **Flexibility**: Easily switch between different environments (dev, staging, prod)
- **Auto-refresh**: Variables can automatically refresh their values via HTTP requests

## Creating Variables

### Basic Variable

1. **Open the Variables section** in the ModHead options page
2. **Click "Add Variable"**
3. **Fill in the details:**
   - **Name**: `apiKey` (no spaces, use camelCase or snake_case)
   - **Value**: `sk_live_1234567890abcdef`
   - **Sensitive**: OFF (for now)

4. **Click "Save"**

Here's the variable editor interface:

![Variable Editor](images/08-variable-editor-empty.png)

### Sensitive Variables

Sensitive variables are displayed with password masking in the UI to prevent shoulder-surfing.

**Example: API Secret**
```
Name: apiSecret
Value: super_secret_key_12345
Sensitive: ✅ ON
```

When enabled, the value will display as `••••••••` in the UI but will work normally in your rules.

**When to use sensitive variables:**
- API keys
- Access tokens
- Passwords
- Client secrets
- Any confidential data

Here's how sensitive variables appear in the UI:

![Sensitive Variable Masked](images/10-sensitive-variable-masked.png)

## Using Variables in Headers

Use the `${variableName}` syntax to reference variables in header values.

### Basic Usage

**Variable Definition:**
```
Name: authToken
Value: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Header Configuration:**
```
Header Name: Authorization
Header Value: ${authToken}
```

**Result:** The header will be sent as:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Inline Variables

You can embed variables within other text:

**Variables:**
```
apiKey: abc123
apiVersion: v2
```

**Header:**
```
Header Name: X-API-Credentials
Header Value: key=${apiKey}&version=${apiVersion}
```

**Result:**
```
X-API-Credentials: key=abc123&version=v2
```

### Multiple Variables in One Header

**Variables:**
```
userId: 12345
sessionId: xyz789
```

**Header:**
```
Header Name: X-Session-Info
Header Value: user=${userId};session=${sessionId}
```

**Result:**
```
X-Session-Info: user=12345;session=xyz789
```

Here's an example of using variables in header values:

![Variable Usage in Headers](images/09-variable-in-header.png)

The variables section showing multiple variables:

![Variables Section](images/07-variables-section.png)

## Variable Naming Best Practices

### Valid Names
- Use alphanumeric characters
- Use camelCase: `accessToken`, `apiKey`, `userId`
- Use snake_case: `access_token`, `api_key`, `user_id`
- Can include numbers: `apiKeyV2`, `token1`

### Invalid Names
- ❌ Spaces: `api key`
- ❌ Special characters: `api-key`, `api.key`, `api@key`
- ❌ Starting with numbers: `1apiKey`

### Naming Conventions

**Good:**
- `accessToken` - Clear purpose
- `devApiKey` - Environment-specific
- `jwtToken` - Descriptive

**Avoid:**
- `token` - Too generic
- `x` - Not descriptive
- `myVar` - Not meaningful

## Managing Variables

### Edit Variables

1. Click the **Edit** button (pencil icon) on the variable
2. Modify the name, value, or sensitivity
3. Click **Save**

**Note:** Changing a variable name will affect all rules using it.

### Delete Variables

1. Click the **Delete** button (trash icon)
2. Confirm the deletion

**Warning:** Deleting a variable will not remove it from rules, but those rules will use the literal string `${variableName}` instead of the value.

## Practical Examples

### Example 1: Multi-Environment Setup

**Variables:**
```
Environment: dev
devApiUrl: api-dev.example.com
stagingApiUrl: api-staging.example.com
prodApiUrl: api.example.com
apiKey: sk_dev_123456
```

**Rules:**
Switch the `Environment` variable between `dev`, `staging`, and `prod`, and update target domains accordingly.

### Example 2: Authentication Headers

**Variables:**
```
bearerToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
apiKey: abc123xyz789
userId: 12345
```

**Headers:**
```
Authorization: Bearer ${bearerToken}
X-API-Key: ${apiKey}
X-User-ID: ${userId}
```

### Example 3: API Versioning

**Variables:**
```
apiVersion: v2
clientId: client_123
```

**Headers:**
```
Accept: application/vnd.api+json;version=${apiVersion}
X-Client-ID: ${clientId}
```

## Auto-Refresh Variables

Variables can automatically update their values by making HTTP requests. This is particularly useful for authentication tokens that expire.

### Basic Auto-Refresh Setup

**Variable Configuration:**
```
Name: accessToken
Value: (initial token value)
Refresh Config:
  URL: https://auth.example.com/token/refresh
  Method: POST
  Headers:
    Content-Type: application/json
  Body:
    {
      "refresh_token": "your-refresh-token"
    }
  Transform Response: access_token
```

**How it works:**
1. ModHead makes a POST request to the refresh URL
2. The server responds with a new token
3. The `access_token` field is extracted from the response
4. The variable value is updated automatically

### Response Transformation

ModHead supports three transformation modes:

#### 1. JSON Path (Extract Specific Field)
Extract a specific field from a JSON response.

**Response:**
```json
{
  "access_token": "new_token_12345",
  "expires_in": 3600
}
```

**Transform:** `access_token`

**Result:** Variable value becomes `new_token_12345`

#### 2. Template (Custom Format)
Use template syntax to extract and format values.

**Response:**
```json
{
  "token": "abc123",
  "type": "Bearer"
}
```

**Transform:** `{{type}} {{token}}`

**Result:** Variable value becomes `Bearer abc123`

#### 3. Full Response
Store the entire response body as the variable value.

**Transform:** Leave empty or set to `$response`

**Result:** Variable value becomes the full JSON response string

See [Auto-Refresh Tokens](./Auto-Refresh-Tokens.md) for detailed documentation on automatic token refresh.

## Using Variables in Refresh Configs

You can use variables within refresh configurations, enabling powerful multi-stage authentication flows.

**Example:**
```
Variable: accessToken
Refresh Config:
  Headers:
    Authorization: Bearer ${refreshToken}
```

This allows you to use one variable (`refreshToken`) to obtain another (`accessToken`).

**Warning:** Be careful to avoid circular dependencies (Variable A depends on Variable B, which depends on Variable A).

## Variable Storage and Security

### Storage Location
Variables are stored in Chrome's `storage.sync` API, which means:
- They persist across browser restarts
- They sync across Chrome browsers signed in to the same account
- They are stored in **plain text**

### Security Considerations

⚠️ **Important Security Notes:**

1. **Plain Text Storage**: Variables are stored unencrypted in Chrome's storage
2. **Synced Across Devices**: Variables sync across all Chrome instances
3. **Sensitive Variables**: The "Sensitive" flag only masks the UI display—it does NOT encrypt the value
4. **Local Access**: Any extension or script with storage permissions could potentially access your variables

**Recommendations:**
- Avoid storing highly sensitive credentials (production passwords, etc.)
- Use short-lived tokens when possible
- Leverage auto-refresh to minimize token lifetime
- Consider using environment-specific variables (dev/staging only)
- Regularly rotate your secrets

See the [FAQ - Security](./FAQ.md#security) for more details.

## Common Use Cases

### Use Case 1: Development vs Production

**Variables:**
```
env: dev
devToken: dev_token_123
prodToken: prod_token_456
```

**Header:**
```
Authorization: ${env == 'dev' ? devToken : prodToken}
```

**Note:** Currently, ModHead doesn't support conditional logic. You'll need to manually update the variable value or use different rules.

### Use Case 2: Shared Team Configuration

**Variables:**
```
teamApiKey: shared_key_123
apiEndpoint: api.team.example.com
```

Share these variables across your team for consistent testing.

### Use Case 3: Token Rotation

**Variables with Auto-Refresh:**
```
Name: jwtToken
Refresh Config:
  URL: https://auth.example.com/refresh
  Method: POST
  Body: { "refresh_token": "${refreshToken}" }
  Transform: access_token
```

Automatically refresh JWT tokens before they expire.

## Troubleshooting

### Variable Not Replaced

**Problem:** Header shows `${variableName}` literally

**Solutions:**
1. Check that the variable name is spelled correctly (case-sensitive)
2. Verify the variable exists in the Variables section
3. Ensure there are no extra spaces: `${ variableName }` won't work

### Sensitive Variable Not Masking

**Problem:** Sensitive variable still shows plain text

**Solutions:**
1. Ensure the "Sensitive" toggle is ON
2. Refresh the options page
3. If editing, make sure you saved the change

### Auto-Refresh Not Working

**Problem:** Variable value isn't updating

**Solutions:**
1. Check the refresh URL is correct
2. Verify the HTTP method and headers
3. Check the response transformation path
4. Look for errors in the browser console

See [Auto-Refresh Tokens - Troubleshooting](./Auto-Refresh-Tokens.md#troubleshooting) for more details.

## Next Steps

- **[Auto-Refresh Tokens](./Auto-Refresh-Tokens.md)** - Detailed guide on automatic token refresh
- **[Advanced Features](./Advanced-Features.md)** - Complex variable usage patterns
- **[Examples](./Examples.md)** - Real-world variable configurations

---

**Back to:** [Home](./Home.md) | **Next:** [Auto-Refresh Tokens](./Auto-Refresh-Tokens.md)
