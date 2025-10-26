import { getSettings } from '../utils/storage';

const RULE_ID_OFFSET = 1000;

// Отслеживание текущих табов и их URL
const tabUrls = new Map<number, string>();

// Обновление URL таба
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url || tab.url) {
    tabUrls.set(tabId, tab.url || '');
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  tabUrls.delete(tabId);
});

// Инициализация URLs активных табов
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

  // Удаляем все существующие динамические правила
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const ruleIdsToRemove = existingRules.map(rule => rule.id);

  // Создаем новые правила для каждого активного правила модификации
  const newRules: chrome.declarativeNetRequest.Rule[] = [];

  enabledRules.forEach((rule, index) => {
    rule.headers.forEach((header, headerIndex) => {
      const ruleId = RULE_ID_OFFSET + index * 100 + headerIndex;

      // Формируем условие для правила
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

      // Добавляем фильтр по target domain
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

      // Формируем действие
      const action: chrome.declarativeNetRequest.RuleAction = {
        type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
        requestHeaders: [],
      };

      switch (header.action) {
        case 'set':
          action.requestHeaders!.push({
            operation: chrome.declarativeNetRequest.HeaderOperation.SET,
            header: header.name,
            value: header.value,
          });
          break;
        case 'append':
          action.requestHeaders!.push({
            operation: chrome.declarativeNetRequest.HeaderOperation.APPEND,
            header: header.name,
            value: header.value,
          });
          break;
        case 'remove':
          action.requestHeaders!.push({
            operation: chrome.declarativeNetRequest.HeaderOperation.REMOVE,
            header: header.name,
          });
          break;
      }

      newRules.push({
        id: ruleId,
        priority: 1,
        condition,
        action,
      });
    });
  });

  // Обновляем правила
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: ruleIdsToRemove,
    addRules: newRules,
  });

  console.log(`Updated ${newRules.length} dynamic rules`);
}

// Слушаем изменения в хранилище
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.modhead_settings) {
    updateDynamicRules();
  }
});

// Инициализация при загрузке расширения
chrome.runtime.onInstalled.addListener(() => {
  console.log('ModHead installed');
  updateDynamicRules();
});

// Обновление правил при запуске
updateDynamicRules();

// Открытие страницы настроек при клике на иконку
chrome.action.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage();
});
