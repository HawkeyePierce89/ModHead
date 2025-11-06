# ModHead

> Modern Chrome extension for modifying HTTP headers

ModHead is a Chrome extension that allows you to easily modify HTTP request headers. Perfect for developers, testers, and power users who need precise control over web requests.

## ✨ Features

- **🔧 Easy Header Modification** - Add, modify, or remove any HTTP request headers
- **🎯 Smart URL Filtering** - Target URLs with flexible matching patterns:
  - `Starts with` - URL starts with the specified pattern
  - `Ends with` - URL ends with the specified pattern
  - `Equals` - Exact URL match
- **📍 Tab Filtering** - Optionally specify the tab URL where rules should apply
- **⚡ Real-time Updates** - Changes apply instantly without reload
- **💾 Import/Export** - Save and load your rule configurations
- **🎨 Clean Interface** - Intuitive and modern UI design
- **🔒 Manifest V3** - Built with the latest Chrome extension standards for security and performance
- **⚛️ React 19.0** - Uses the latest React version for fast and responsive UI
- **📘 TypeScript** - Fully typed code for better reliability

## 🛠 Tech Stack

- **Chrome Manifest V3** - Latest manifest version for Chrome extensions
- **TypeScript 5.6+** - Strict typing
- **React 19.0** - Modern UI framework
- **Vite 7.0** - Fast build tool
- **DeclarativeNetRequest API** - Modern API for request modification

## 📦 Installation

### Development

1. Clone the repository:
```bash
git clone https://github.com/yourusername/modhead.git
cd modhead
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

4. Load the extension in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode" in the top right corner
   - Click "Load unpacked extension"
   - Select the `dist` folder

### Development Mode

For development with automatic rebuilding:
```bash
npm run dev
```

## 🚀 Usage

### Creating a Rule

1. Click the ModHead icon in the Chrome toolbar
2. The settings page will open in a new tab
3. Click "+ Create Rule"
4. Fill in the form:
   - **Rule Name** (required) - Name to identify the rule
   - **Tab URL** (optional) - URL of the page where the rule should apply
   - **Tab Match Type** - How to match the tab URL
   - **Target Domain** (required) - Domain for requests to modify
   - **Domain Match Type** - How to match the target domain
5. Add HTTP headers:
   - Click "+ Add Header"
   - Enter header name and value
   - Select action: Set, Append, or Remove
6. Click "Create" to save

### Managing Rules

- **Enable/Disable** - Use the toggle switch next to the rule name
- **Edit** - Click the "Edit" button
- **Delete** - Click the "Delete" button (with confirmation)

### Example Configurations

#### Adding Authorization Header
```
Name: API Authorization
Tab URL: https://myapp.com (Starts with)
Target Domain: https://api.example.com (Starts with)
Headers:
  - Authorization: Bearer your-token-here (Set)
```

#### Modifying User-Agent
```
Name: Custom User Agent
Tab URL: [empty] (applies everywhere)
Target Domain: https://testing.site.com (Starts with)
Headers:
  - User-Agent: ModHead/1.0 Testing Bot (Set)
```

#### Adding Multiple Headers
```
Name: API Headers
Tab URL: [empty]
Target Domain: api.service.com (Ends with)
Headers:
  - X-API-Key: your-api-key (Set)
  - X-Client-Version: 1.0.0 (Set)
  - X-Debug: true (Set)
```

### Import and Export

- **Export Rules** - Click "Export Rules" to save all rules to a JSON file
- **Import Rules** - Click "Import Rules" and select a previously exported JSON file

## 📝 Project Structure

```
modhead/
├── public/
│   ├── manifest.json       # Chrome Extension Manifest V3
│   └── icon*.svg          # Extension icons
├── src/
│   ├── background/
│   │   └── background.ts  # Service Worker for header modification
│   ├── options/
│   │   ├── components/    # React components
│   │   ├── App.tsx        # Main component
│   │   ├── App.css        # Styles
│   │   └── main.tsx       # React entry point
│   ├── types/
│   │   └── index.ts       # TypeScript types
│   └── utils/
│       ├── storage.ts     # Chrome Storage utilities
│       └── matcher.ts     # URL matching utilities
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 🔧 API

### Data Types

```typescript
type MatchType = 'startsWith' | 'endsWith' | 'equals';
type HeaderAction = 'set' | 'append' | 'remove';

interface HeaderModification {
  id: string;
  name: string;
  value: string;
  action: HeaderAction;
}

interface ModificationRule {
  id: string;
  enabled: boolean;
  name: string;
  tabUrl?: string;
  tabUrlMatchType: MatchType;
  targetDomain: string;
  targetDomainMatchType: MatchType;
  headers: HeaderModification[];
}
```

## 🐛 Known Limitations

- Headers cannot be modified for requests to Chrome Web Store or internal Chrome pages
- Some headers are protected by Chrome and cannot be modified (e.g., `Host`, `Content-Length`)
- The current version uses the `declarativeNetRequest` API, which has some URL filtering limitations

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details. 
