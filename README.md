# ModHead 🎛️

> A powerful Chrome extension for modifying HTTP request headers with style

ModHead is a modern Chrome extension that allows you to easily modify HTTP request headers on the fly. Perfect for developers, testers, and power users who need precise control over their web requests.

## ✨ Features

- **🔧 Easy Header Modification** - Add, modify, or override any HTTP request header
- **👥 Multiple Profiles** - Switch between different header configurations instantly
- **🎯 Smart URL Filtering** - Target specific URLs with flexible matching patterns:
  - `is` - Exact URL match
  - `contains` - URL contains substring
  - `starts with` - URL starts with pattern
  - `ends with` - URL ends with pattern
- **⚡ Real-time Updates** - Changes apply immediately without reloading
- **🎨 Clean Interface** - Intuitive and modern UI design
- **🔒 Manifest V3** - Built with the latest Chrome extension standards for security and performance

## 📦 Installation

### From Source

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" button
5. Select the extension directory

## 🚀 Usage

### Basic Usage

1. Click the ModHead icon in your Chrome toolbar
2. Toggle the main switch to enable/disable the extension
3. Click "+ Add New Rule" to create a new header modification rule
4. Configure your rule:
   - Set URL filter type and pattern
   - Add header name and value
   - Enable/disable individual rules as needed
5. Click "Save" to apply changes

### Example Configurations

#### Add Authentication Header
- **URL Filter**: `contains` → `api.example.com`
- **Header**: `Authorization` → `Bearer your-token-here`

#### Modify User-Agent
- **URL Filter**: `starts with` → `https://testing.site.com`
- **Header**: `User-Agent` → `ModHead/1.0 Testing Bot`

#### Add Custom API Key
- **URL Filter**: `is` → `https://api.service.com/v1/data`
- **Header**: `X-API-Key` → `your-api-key`

### Profile Management

ModHead supports 3 profiles:
- **Default Profile** - Your main configuration
- **Profile 1** - Alternative configuration
- **Profile 2** - Another alternative configuration

Switch between profiles using the dropdown menu. Each profile maintains its own set of rules.

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🐛 Known Issues

- Headers cannot be modified for requests to Chrome Web Store or Chrome internal pages
- Some headers are protected by Chrome and cannot be modified (e.g., `Host`, `Content-Length`)

## 🎯 Roadmap

- [ ] Import/Export rules functionality
- [ ] RegEx support for URL patterns
- [ ] Response header modification
- [ ] Rule groups and categories
- [ ] Keyboard shortcuts
- [ ] Dark mode theme
- [ ] Sync profiles across devices
- [ ] 
