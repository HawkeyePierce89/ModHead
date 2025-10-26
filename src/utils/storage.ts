import type { AppSettings, ModificationRule } from '../types';

const STORAGE_KEY = 'modhead_settings';

export const defaultSettings: AppSettings = {
  rules: [],
};

export async function getSettings(): Promise<AppSettings> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    return result[STORAGE_KEY] || defaultSettings;
  } catch (error) {
    console.error('Error loading settings:', error);
    return defaultSettings;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  try {
    await chrome.storage.local.set({ [STORAGE_KEY]: settings });
  } catch (error) {
    console.error('Error saving settings:', error);
    throw error;
  }
}

export async function addRule(rule: ModificationRule): Promise<void> {
  const settings = await getSettings();
  settings.rules.push(rule);
  await saveSettings(settings);
}

export async function updateRule(ruleId: string, updatedRule: Partial<ModificationRule>): Promise<void> {
  const settings = await getSettings();
  const index = settings.rules.findIndex(r => r.id === ruleId);
  if (index !== -1) {
    settings.rules[index] = { ...settings.rules[index], ...updatedRule };
    await saveSettings(settings);
  }
}

export async function deleteRule(ruleId: string): Promise<void> {
  const settings = await getSettings();
  settings.rules = settings.rules.filter(r => r.id !== ruleId);
  await saveSettings(settings);
}
