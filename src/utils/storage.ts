import type { AppSettings } from '../types';

const STORAGE_KEY = 'modhead_settings';

export const defaultSettings: AppSettings = {
  rules: [],
  variables: [],
  theme: 'auto',
};

export async function getSettings(): Promise<AppSettings> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    const settings = result[STORAGE_KEY] || defaultSettings;
    // Ensure backward compatibility - add variables if not present
    if (!settings.variables) {
      settings.variables = [];
    }
    // Ensure backward compatibility - add theme if not present
    if (!settings.theme) {
      settings.theme = 'auto';
    }
    return settings;
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
