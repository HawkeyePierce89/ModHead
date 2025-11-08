# ModHead Documentation

Welcome to ModHead - a powerful Chrome extension for modifying HTTP request headers.

## What is ModHead?

ModHead is a Chrome Manifest V3 extension that allows you to dynamically modify HTTP request headers based on user-defined rules. Whether you're a developer testing APIs, debugging authentication flows, or working with CORS issues, ModHead provides a simple and intuitive interface to manage your HTTP headers.

## Key Features

### 🎯 Dynamic Header Modification
- Add, modify, or remove HTTP request headers on the fly
- Support for all HTTP request types (XHR, Fetch, main frames, sub-frames, scripts, etc.)
- Real-time updates without browser restart

### 🌐 URL Pattern Matching
- Flexible URL matching with `startsWith`, `endsWith`, and `equals` options
- Multiple target domains per rule
- Optional tab URL filtering for site-specific rules

### 🔄 Variables System
- Define reusable variables for header values
- Sensitive variable support with password masking
- Use variables across multiple rules with `${variableName}` syntax

### ⚡ Auto-Refresh Tokens
- Automatically refresh authentication tokens before they expire
- Support for multiple HTTP methods (GET, POST, PUT, PATCH, DELETE)
- Custom headers and body in refresh requests
- Response transformation to extract specific values (JSON path, templates, or full response)

### 🎨 User Interface
- Clean, intuitive React-based interface
- Dark theme support
- Enable/disable rules with a single click
- Visual feedback with toast notifications

## Documentation Navigation

### Getting Started
- [**Getting Started**](./Getting-Started.md) - Installation and first steps
  - How to install the extension
  - Creating your first rule
  - Understanding URL pattern matching

### Core Features
- [**Variables**](./Variables.md) - Learn about the variables system
  - Creating and managing variables
  - Sensitive variables
  - Using variables in headers

- [**Auto-Refresh Tokens**](./Auto-Refresh-Tokens.md) - Automatic token management
  - Setting up token auto-refresh
  - HTTP methods and configuration
  - Response transformation
  - OAuth and JWT examples

### Advanced Usage
- [**Advanced Features**](./Advanced-Features.md) - Power user features
  - Complex response transformations
  - Nested variable usage
  - Multi-stage authentication
  - Tab URL filtering

- [**Examples**](./Examples.md) - Real-world use cases
  - API key injection
  - Bearer token authentication
  - CORS headers for development
  - OAuth token refresh
  - Multi-stage authentication flows

### Help & Support
- [**FAQ**](./FAQ.md) - Frequently asked questions
  - Security considerations
  - Troubleshooting
  - Limitations
  - When rules apply

## Quick Example

Here's a simple example of adding an API key to all requests to `api.example.com`:

1. **Create a rule**
   - Name: "Example API Key"
   - Target Domain: `api.example.com` (startsWith)

2. **Add a header**
   - Name: `X-API-Key`
   - Value: `your-api-key-here`

3. **Enable the rule** and you're done!

All requests to `api.example.com/*` will now include your API key header.

## Architecture Overview

ModHead is built with modern web technologies:

- **Manifest V3**: Uses Chrome's latest extension architecture
- **React**: Modern UI with TypeScript
- **declarativeNetRequest API**: Chrome's powerful API for header modification
- **Chrome Storage API**: Persistent storage for rules and variables

## Contributing

ModHead is an open-source project. Contributions are welcome!

## Support

If you encounter issues or have questions:
1. Check the [FAQ](./FAQ.md)
2. Review the relevant documentation sections
3. Open an issue on GitHub

---

**Ready to get started?** Head over to the [Getting Started Guide](./Getting-Started.md)!
