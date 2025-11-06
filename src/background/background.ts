import { getSettings } from '../utils/storage';

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
  const settings = await getSettings();
  const enabledRules = settings.rules.filter(rule => rule.enabled);

  // Remove all existing dynamic rules
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const ruleIdsToRemove = existingRules.map(rule => rule.id);

  // Create new rules for each active modification rule
  const newRules: chrome.declarativeNetRequest.Rule[] = [];

  enabledRules.forEach((rule, index) => {
    rule.headers.forEach((header, headerIndex) => {
      const ruleId = RULE_ID_OFFSET + index * 100 + headerIndex;

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
      if (rule.targetDomain) {
        switch (rule.targetDomainMatchType) {
          case 'startsWith':
            condition.urlFilter = rule.targetDomain + '*';
            break;
          case 'endsWith':
            condition.urlFilter = '*' + rule.targetDomain;
            break;
          case 'equals':
            condition.urlFilter = rule.targetDomain;
            break;
        }
      }

      // Build action - always SET header
      const action: chrome.declarativeNetRequest.RuleAction = {
        type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
        requestHeaders: [
          {
            operation: chrome.declarativeNetRequest.HeaderOperation.SET,
            header: header.name,
            value: header.value,
          },
        ],
      };

      newRules.push({
        id: ruleId,
        priority: 1,
        condition,
        action,
      });
    });
  });

  // Update rules
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: ruleIdsToRemove,
    addRules: newRules,
  });

  console.log(`Updated ${newRules.length} dynamic rules`);
}

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.modhead_settings) {
    updateDynamicRules();
  }
});

// Initialize on extension install
chrome.runtime.onInstalled.addListener(() => {
  console.log('ModHead installed');
  updateDynamicRules();
});

// Update rules on startup
updateDynamicRules();

// Open settings page when icon is clicked
chrome.action.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage();
});
