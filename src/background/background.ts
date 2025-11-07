// Inline storage functions to avoid ES module imports that might not work with Chrome extensions
import type { AppSettings, Variable } from '../types';

const STORAGE_KEY = 'modhead_settings';
const defaultSettings: AppSettings = {
  rules: [],
  variables: [],
};

async function getSettings(): Promise<AppSettings> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    const settings = result[STORAGE_KEY] || defaultSettings;
    // Ensure backward compatibility - add variables if not present
    if (!settings.variables) {
      settings.variables = [];
    }
    return settings;
  } catch (error) {
    console.error('[ModHead] Error loading settings:', error);
    return defaultSettings;
  }
}

// Function to substitute variables in a string
function substituteVariables(value: string, variables: Variable[]): string {
  let result = value;
  variables.forEach((variable) => {
    const placeholder = `\${${variable.name}}`;
    // Use split/join for compatibility with ES2020
    result = result.split(placeholder).join(variable.value);
  });
  return result;
}

const RULE_ID_OFFSET = 1000;

// Track current tabs and their URLs
const tabUrls = new Map<number, string>();

// Update tab URL
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url || tab.url) {
    tabUrls.set(tabId, tab.url || '');
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  tabUrls.delete(tabId);
});

// Initialize active tab URLs
chrome.tabs.query({}, (tabs) => {
  tabs.forEach((tab) => {
    if (tab.id && tab.url) {
      tabUrls.set(tab.id, tab.url);
    }
  });
});

async function updateDynamicRules() {
  try {
    const settings = await getSettings();
    const enabledRules = settings?.rules?.filter(rule => rule.enabled) || [];
    const variables = settings?.variables || [];

    // Remove all existing dynamic rules
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const ruleIdsToRemove = existingRules.map(rule => rule.id);

    // Create new rules for each active modification rule
    const newRules: chrome.declarativeNetRequest.Rule[] = [];
    let ruleIdCounter = RULE_ID_OFFSET;

    enabledRules.forEach((rule) => {
      // For each target domain, create rules for each header
      rule.targetDomains?.forEach((targetDomain) => {
        rule.headers.forEach((header) => {
          // Build condition for the rule
          const condition: chrome.declarativeNetRequest.RuleCondition = {
            resourceTypes: [
              chrome.declarativeNetRequest.ResourceType.MAIN_FRAME,
              chrome.declarativeNetRequest.ResourceType.SUB_FRAME,
              chrome.declarativeNetRequest.ResourceType.XMLHTTPREQUEST,
              chrome.declarativeNetRequest.ResourceType.SCRIPT,
              chrome.declarativeNetRequest.ResourceType.STYLESHEET,
              chrome.declarativeNetRequest.ResourceType.IMAGE,
              chrome.declarativeNetRequest.ResourceType.FONT,
              chrome.declarativeNetRequest.ResourceType.MEDIA,
              chrome.declarativeNetRequest.ResourceType.OTHER,
            ],
          };

          // Add target domain filter
          if (targetDomain.url) {
            switch (targetDomain.matchType) {
              case 'startsWith':
                condition.urlFilter = targetDomain.url + '*';
                break;
              case 'endsWith':
                condition.urlFilter = '*' + targetDomain.url;
                break;
              case 'equals':
                condition.urlFilter = targetDomain.url;
                break;
            }
          }

          // Build action - always SET header
          // Substitute variables in header value
          const headerValue = substituteVariables(header.value, variables);

          const action: chrome.declarativeNetRequest.RuleAction = {
            type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
            requestHeaders: [
              {
                operation: chrome.declarativeNetRequest.HeaderOperation.SET,
                header: header.name,
                value: headerValue,
              },
            ],
          };

          newRules.push({
            id: ruleIdCounter++,
            priority: 1,
            condition,
            action,
          });
        });
      });
    });

    // Update rules
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: ruleIdsToRemove,
      addRules: newRules,
    });
  } catch (error) {
    console.error('[ModHead] Error updating dynamic rules:', error);
    // Don't throw - we want the service worker to continue running
  }
}

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.modhead_settings) {
    updateDynamicRules();
  }
});

// Initialize on extension install
chrome.runtime.onInstalled.addListener(() => {
  updateDynamicRules();
});

// Update rules on startup
updateDynamicRules().catch((error) => {
  console.error('[ModHead] Failed to initialize on startup:', error);
});

// Open settings page when icon is clicked
chrome.action.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage();
});
