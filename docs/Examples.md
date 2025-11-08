# Practical Examples

This guide provides real-world examples of ModHead configurations for common use cases.

## Table of Contents

1. [Simple API Key Injection](#1-simple-api-key-injection)
2. [Bearer Token Authentication](#2-bearer-token-authentication)
3. [CORS Headers for Local Development](#3-cors-headers-for-local-development)
4. [OAuth 2.0 Token Refresh](#4-oauth-20-token-refresh)
5. [Multi-Stage Authentication](#5-multi-stage-authentication)
6. [GitHub API Authentication](#6-github-api-authentication)
7. [AWS API Signature (Static)](#7-aws-api-signature-static)
8. [Custom Headers for Testing](#8-custom-headers-for-testing)
9. [Environment-Specific Configuration](#9-environment-specific-configuration)
10. [JWT Token with Auto-Refresh](#10-jwt-token-with-auto-refresh)

---

## 1. Simple API Key Injection

**Use Case:** Add an API key to all requests to a third-party API.

### Configuration

**Variable:**
```
Name: newsApiKey
Value: abc123xyz789myapikey
Sensitive: ON
```

**Rule:**
```
Name: News API Key
Enabled: ON
Target Domain: newsapi.org
Match Type: startsWith
Headers:
  - Name: X-Api-Key
    Value: ${newsApiKey}
```

### How It Works

All requests to `newsapi.org/*` will include:
```
X-Api-Key: abc123xyz789myapikey
```

### Use Cases
- Third-party API integration
- Testing API endpoints
- Development and debugging

---

## 2. Bearer Token Authentication

**Use Case:** Add a Bearer token to authenticate API requests.

### Configuration

**Variable:**
```
Name: bearerToken
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U
Sensitive: ON
```

**Rule:**
```
Name: API Bearer Auth
Enabled: ON
Target Domains:
  1. api.example.com (startsWith)
  2. api-staging.example.com (startsWith)
Headers:
  - Name: Authorization
    Value: Bearer ${bearerToken}
```

### How It Works

Requests to both `api.example.com` and `api-staging.example.com` will include:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Use Cases
- REST API authentication
- Testing protected endpoints
- Development with multiple environments

---

## 3. CORS Headers for Local Development

**Use Case:** Bypass CORS restrictions when developing locally.

### Configuration

**Rule:**
```
Name: Dev CORS Headers
Enabled: ON
Target Domain: localhost
Match Type: startsWith
Headers:
  - Name: Access-Control-Allow-Origin
    Value: *
  - Name: Access-Control-Allow-Methods
    Value: GET, POST, PUT, DELETE, PATCH, OPTIONS
  - Name: Access-Control-Allow-Headers
    Value: Content-Type, Authorization, X-Requested-With
  - Name: Access-Control-Allow-Credentials
    Value: true
```

### How It Works

All requests to `localhost:*` will include CORS headers, allowing your local frontend to communicate with your local backend.

### Use Cases
- Local frontend ↔ backend development
- Testing cross-origin requests
- Avoiding CORS errors during development

### Note

These headers are added to **requests**, not responses. For proper CORS handling, your server must return the appropriate CORS headers in **responses**. However, this configuration can help with certain testing scenarios.

---

## 4. OAuth 2.0 Token Refresh

**Use Case:** Automatically refresh an OAuth 2.0 access token using a refresh token.

### Configuration

**Variable 1: Refresh Token (Long-Lived)**
```
Name: oauthRefreshToken
Value: 1/mZ1edKKACtPAb7zGlwSzvs72PvhAbGmB8K1ZrGxpcNM
Sensitive: ON
```

**Variable 2: Access Token (Auto-Refresh)**
```
Name: oauthAccessToken
Value: (initial access token)
Sensitive: ON
Refresh Config:
  URL: https://oauth2.googleapis.com/token
  Method: POST
  Headers:
    Content-Type: application/x-www-form-urlencoded
  Body: grant_type=refresh_token&refresh_token=${oauthRefreshToken}&client_id=YOUR_CLIENT_ID&client_secret=YOUR_CLIENT_SECRET
  Transform Response: access_token
```

**Rule:**
```
Name: Google API OAuth
Enabled: ON
Target Domain: www.googleapis.com
Match Type: startsWith
Headers:
  - Name: Authorization
    Value: Bearer ${oauthAccessToken}
```

### How It Works

1. Initial setup uses a manually obtained refresh token
2. When you refresh the `oauthAccessToken` variable, ModHead:
   - Sends a POST request to Google's OAuth endpoint
   - Includes the refresh token in the body
   - Extracts the new access token from the response
   - Updates the variable value
3. Your API requests use the fresh access token

### Use Cases
- Google API integration
- Long-running development sessions
- Testing OAuth flows

---

## 5. Multi-Stage Authentication

**Use Case:** Chain multiple authentication steps (refresh token → access token → API key).

### Configuration

**Variable 1: Master Refresh Token**
```
Name: masterRefreshToken
Value: long_lived_refresh_token_xyz789
Sensitive: ON
```

**Variable 2: Access Token**
```
Name: accessToken
Value: (auto-populated)
Sensitive: ON
Refresh Config:
  URL: https://auth.example.com/oauth/token
  Method: POST
  Headers:
    Content-Type: application/json
  Body:
    {
      "grant_type": "refresh_token",
      "refresh_token": "${masterRefreshToken}"
    }
  Transform Response: access_token
```

**Variable 3: Service API Key**
```
Name: serviceApiKey
Value: (auto-populated)
Sensitive: ON
Refresh Config:
  URL: https://api.example.com/keys/generate
  Method: POST
  Headers:
    Authorization: Bearer ${accessToken}
    Content-Type: application/json
  Body:
    {
      "scope": "read write delete",
      "expires_in": 3600
    }
  Transform Response: api_key
```

**Rule:**
```
Name: Service API Access
Enabled: ON
Target Domain: api.example.com
Match Type: startsWith
Headers:
  - Name: X-API-Key
    Value: ${serviceApiKey}
```

### How It Works

**Authentication Chain:**
1. `masterRefreshToken` (manually set, long-lived)
2. → `accessToken` (refreshed using master token)
3. → `serviceApiKey` (derived from access token)
4. → Used in API requests

**Refresh Process:**
1. Refresh `accessToken` first
2. Then refresh `serviceApiKey` (which uses the new `accessToken`)
3. Your requests now use the fresh API key

### Use Cases
- Complex authentication flows
- Multi-tier security systems
- Enterprise API access

---

## 6. GitHub API Authentication

**Use Case:** Authenticate GitHub API requests with a personal access token.

### Configuration

**Variable:**
```
Name: githubToken
Value: ghp_1234567890abcdefghijklmnopqrstuvwxyz
Sensitive: ON
```

**Rule:**
```
Name: GitHub API Token
Enabled: ON
Target Domain: api.github.com
Match Type: startsWith
Headers:
  - Name: Authorization
    Value: Bearer ${githubToken}
  - Name: Accept
    Value: application/vnd.github+json
  - Name: X-GitHub-Api-Version
    Value: 2022-11-28
```

### How It Works

All requests to `api.github.com` will include:
```
Authorization: Bearer ghp_1234567890abcdefghijklmnopqrstuvwxyz
Accept: application/vnd.github+json
X-GitHub-Api-Version: 2022-11-28
```

### Use Cases
- Testing GitHub API endpoints
- Developing GitHub integrations
- Higher rate limits for authenticated requests

### Note

Generate a GitHub Personal Access Token at: https://github.com/settings/tokens

---

## 7. AWS API Signature (Static)

**Use Case:** Add AWS credentials to API requests (simplified example).

### Configuration

**Variables:**
```
Name: awsAccessKeyId
Value: AKIAIOSFODNN7EXAMPLE
Sensitive: ON

Name: awsSecretAccessKey
Value: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
Sensitive: ON

Name: awsSessionToken
Value: (optional session token)
Sensitive: ON
```

**Rule:**
```
Name: AWS API Credentials
Enabled: ON
Target Domain: .amazonaws.com
Match Type: endsWith
Headers:
  - Name: X-Amz-Access-Key-Id
    Value: ${awsAccessKeyId}
  - Name: X-Amz-Secret-Access-Key
    Value: ${awsSecretAccessKey}
  - Name: X-Amz-Security-Token
    Value: ${awsSessionToken}
```

### Important Security Note

⚠️ **This is a simplified example.** AWS Signature Version 4 requires complex request signing that involves hashing and HMAC calculations. ModHead cannot perform these calculations.

**For real AWS API testing:**
- Use AWS SDK in your application
- Use AWS CLI with proper credentials
- Use tools like Postman that support AWS Signature v4

**This example is only suitable for:**
- Custom AWS-compatible APIs that accept simple credentials
- Testing internal AWS-like services
- Development environments with simplified auth

### Use Cases
- Custom S3-compatible storage (MinIO, etc.)
- Internal AWS-like services
- Simplified dev environments

---

## 8. Custom Headers for Testing

**Use Case:** Add custom headers for debugging and testing.

### Configuration

**Rule:**
```
Name: Debug Headers
Enabled: ON
Target Domain: localhost:3000
Match Type: startsWith
Headers:
  - Name: X-Debug-Mode
    Value: true
  - Name: X-Request-ID
    Value: debug-12345
  - Name: X-User-ID
    Value: test-user-001
  - Name: X-Feature-Flags
    Value: new-ui,dark-mode,beta-features
  - Name: X-Environment
    Value: development
```

### How It Works

All requests to `localhost:3000` will include debugging headers that your backend can use for:
- Enabling debug mode
- Request tracing
- User impersonation
- Feature flag testing
- Environment detection

### Use Cases
- Testing feature flags
- Debugging backend logic
- Simulating different user contexts
- Request tracing

---

## 9. Environment-Specific Configuration

**Use Case:** Easily switch between development, staging, and production environments.

### Configuration

**Variables:**
```
Name: devApiUrl
Value: api-dev.example.com

Name: stagingApiUrl
Value: api-staging.example.com

Name: prodApiUrl
Value: api.example.com

Name: devToken
Value: dev_token_123
Sensitive: ON

Name: stagingToken
Value: staging_token_456
Sensitive: ON

Name: prodToken
Value: prod_token_789
Sensitive: ON

Name: currentEnv
Value: dev
```

**Rule 1: Development**
```
Name: DEV Environment
Enabled: ON (enable this rule for dev)
Target Domain: ${devApiUrl}
Match Type: startsWith
Headers:
  - Name: Authorization
    Value: Bearer ${devToken}
  - Name: X-Environment
    Value: development
```

**Rule 2: Staging**
```
Name: STAGING Environment
Enabled: OFF (enable when testing staging)
Target Domain: ${stagingApiUrl}
Match Type: startsWith
Headers:
  - Name: Authorization
    Value: Bearer ${stagingToken}
  - Name: X-Environment
    Value: staging
```

**Rule 3: Production**
```
Name: PROD Environment
Enabled: OFF (enable carefully!)
Target Domain: ${prodApiUrl}
Match Type: startsWith
Headers:
  - Name: Authorization
    Value: Bearer ${prodToken}
  - Name: X-Environment
    Value: production
```

### How It Works

**Switching Environments:**
1. Disable all environment rules
2. Enable the rule for your target environment
3. Your requests now use the correct API URL and token

### Best Practice

Never enable the production rule unless absolutely necessary. Use development and staging for most testing.

---

## 10. JWT Token with Auto-Refresh

**Use Case:** Automatically refresh a JWT token that expires every hour.

### Configuration

**Variable 1: Username & Password (Static)**
```
Name: username
Value: admin
Sensitive: OFF

Name: password
Value: secret123
Sensitive: ON
```

**Variable 2: JWT Token (Auto-Refresh)**
```
Name: jwtToken
Value: (initial JWT)
Sensitive: ON
Refresh Config:
  URL: https://api.example.com/auth/login
  Method: POST
  Headers:
    Content-Type: application/json
  Body:
    {
      "username": "${username}",
      "password": "${password}"
    }
  Transform Response: token
```

**Rule:**
```
Name: JWT Authentication
Enabled: ON
Target Domain: api.example.com
Match Type: startsWith
Headers:
  - Name: Authorization
    Value: Bearer ${jwtToken}
```

### How It Works

**Initial Setup:**
1. Set `username` and `password` variables
2. Set initial `jwtToken` value (or leave empty and refresh immediately)
3. Enable the rule

**Token Refresh:**
1. Click the refresh button for `jwtToken` variable
2. ModHead sends login request with username/password
3. Server responds with new JWT
4. Variable is updated automatically

**Example Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600,
  "user": {
    "id": 123,
    "name": "Admin"
  }
}
```

**Transform:** `token`
**Result:** JWT is extracted and stored

### Use Cases
- Testing authenticated endpoints
- Long development sessions
- Avoiding manual token updates

---

## Combining Examples

You can combine multiple examples for complex setups:

### Example: Full Stack Development Environment

**Variables:**
```
devApiKey (API key)
jwtToken (auto-refresh JWT)
userId (for testing)
```

**Rules:**
```
1. Dev CORS Headers (localhost)
2. API Authentication (api.example.com)
3. Debug Headers (localhost:3000)
```

**Result:** Complete local development setup with CORS, authentication, and debugging.

---

## Tips for Creating Your Own Examples

1. **Start Simple:** Begin with basic rules and add complexity gradually
2. **Test Incrementally:** Test each header/variable addition before moving on
3. **Use Variables:** Define reusable values as variables
4. **Enable/Disable:** Use rule toggles instead of deleting rules
5. **Document:** Use descriptive names for rules and variables
6. **Secure Sensitive Data:** Always mark tokens and secrets as sensitive

---

## Next Steps

- **[Advanced Features](./Advanced-Features.md)** - Complex patterns and techniques
- **[FAQ](./FAQ.md)** - Troubleshooting and common questions
- **[Auto-Refresh Tokens](./Auto-Refresh-Tokens.md)** - Detailed refresh configuration

---

**Back to:** [Advanced Features](./Advanced-Features.md) | **Next:** [FAQ](./FAQ.md)
