# Privacy Policy for ModHead

**Last Updated: November 2025**

## Overview

ModHead is committed to protecting your privacy. This privacy policy explains how ModHead handles user data.

## Data Collection

**ModHead does NOT collect, store, or transmit any user data.**

Specifically:
- ❌ No browsing history is collected
- ❌ No personal information is collected
- ❌ No data is sent to external servers
- ❌ No analytics or tracking is performed
- ❌ No cookies are used

## Data Storage

All data created by ModHead is stored **locally** on your device using Chrome's storage API:

- **Rules:** Header modification rules you create are stored locally
- **Variables:** Variables you define are stored locally
- **Settings:** All configuration is stored locally

This data:
- ✅ Never leaves your browser
- ✅ Is never transmitted to any servers
- ✅ Is only accessible by you on your device
- ✅ Can be deleted at any time by uninstalling the extension

## Permissions

ModHead requests the following permissions:

### declarativeNetRequest
Used to modify HTTP request headers as configured by the user. This is the core functionality of the extension.

### declarativeNetRequestWithHostAccess
Required to apply header modifications to websites matching user-defined URL patterns.

### storage
Used to save your rules and settings locally in your browser.

### Host Permissions (<all_urls>)
Allows you to modify headers for any domain you specify in your rules. You have full control over which domains are affected.

**Important:** These permissions are used exclusively for the extension's functionality and do NOT grant ModHead access to view, collect, or transmit any of your personal data or browsing activity.

## Third-Party Services

ModHead does NOT use any third-party services, analytics, or tracking tools.

## Auto-Refresh Feature

When you configure auto-refresh for variables (optional feature):
- Refresh requests are sent directly from your browser to the endpoints you specify
- ModHead does not intercept, log, or transmit these requests
- All communication is between your browser and your configured endpoints

## Open Source

ModHead is open-source software. You can review the complete source code at:
https://github.com/HawkeyePierce89/ModHead

## Changes to This Policy

We may update this privacy policy from time to time. Any changes will be posted in the GitHub repository and the extension listing.

## Contact

If you have questions about this privacy policy, please open an issue on GitHub:
https://github.com/HawkeyePierce89/ModHead/issues

## Summary

**ModHead is a developer tool that operates entirely locally in your browser. No data is collected, no data is transmitted, and your privacy is fully protected.**
