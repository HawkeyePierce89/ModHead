import type { AppSettings, ExportedSettings, Variable, ModificationRule } from '../types';

/**
 * Prepare settings for export by stripping sensitive variable values
 */
export function prepareSettingsForExport(settings: AppSettings): ExportedSettings {
  const exportedVariables = settings.variables.map(v => ({
    ...v,
    value: v.isSensitive ? '' : v.value,
  }));

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    settings: {
      rules: settings.rules,
      variables: exportedVariables,
    },
  };
}

/**
 * Generate filename for export
 */
export function generateExportFilename(): string {
  const date = new Date().toISOString().split('T')[0];
  return `modhead-settings-${date}.json`;
}

/**
 * Trigger file download in browser
 */
export function downloadAsJson(data: ExportedSettings, filename: string): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Validate imported JSON structure
 */
export function validateImportedSettings(data: unknown): { valid: boolean; error?: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid JSON structure' };
  }

  const obj = data as Record<string, unknown>;

  if (obj.version !== undefined && obj.version !== 1) {
    return { valid: false, error: `Unsupported version: ${obj.version}` };
  }

  if (!obj.settings || typeof obj.settings !== 'object') {
    return { valid: false, error: 'Missing settings object' };
  }

  const settings = obj.settings as Record<string, unknown>;

  if (!Array.isArray(settings.rules)) {
    return { valid: false, error: 'Missing or invalid rules array' };
  }

  if (!Array.isArray(settings.variables)) {
    return { valid: false, error: 'Missing or invalid variables array' };
  }

  for (const rule of settings.rules) {
    if (!rule.id || !rule.name || !Array.isArray(rule.targetDomains) || !Array.isArray(rule.headers)) {
      return { valid: false, error: 'Invalid rule structure' };
    }
  }

  for (const variable of settings.variables) {
    if (!variable.id || !variable.name) {
      return { valid: false, error: 'Invalid variable structure' };
    }
  }

  return { valid: true };
}

/**
 * Parse imported JSON file content
 */
export function parseImportedFile(content: string): ExportedSettings | null {
  try {
    const parsed = JSON.parse(content);
    const validation = validateImportedSettings(parsed);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    return parsed as ExportedSettings;
  } catch {
    return null;
  }
}

/**
 * Merge imported settings with existing settings
 * - Variables: add new ones, for sensitive variables with same name preserve existing value
 * - Rules: add new rules, skip if rule with same ID already exists
 */
export function mergeSettings(
  existing: AppSettings,
  imported: ExportedSettings['settings']
): AppSettings {
  const existingVarsByName = new Map<string, Variable>();
  existing.variables.forEach(v => existingVarsByName.set(v.name, v));

  const mergedVariables: Variable[] = [...existing.variables];
  for (const importedVar of imported.variables) {
    const existingVar = existingVarsByName.get(importedVar.name);
    if (existingVar) {
      const idx = mergedVariables.findIndex(v => v.id === existingVar.id);
      mergedVariables[idx] = {
        ...importedVar,
        id: existingVar.id,
        value: importedVar.isSensitive ? existingVar.value : importedVar.value,
      };
    } else {
      mergedVariables.push(importedVar);
    }
  }

  const existingRuleIds = new Set(existing.rules.map(r => r.id));

  const mergedRules: ModificationRule[] = [...existing.rules];
  for (const importedRule of imported.rules) {
    if (!existingRuleIds.has(importedRule.id)) {
      mergedRules.push(importedRule);
    }
  }

  return {
    rules: mergedRules,
    variables: mergedVariables,
    theme: existing.theme,
  };
}

/**
 * Replace all settings with imported settings
 * - Variables: use imported variable configs but preserve values for sensitive variables with matching names
 */
export function replaceSettings(
  existing: AppSettings,
  imported: ExportedSettings['settings']
): AppSettings {
  const existingVarsByName = new Map<string, string>();
  existing.variables.forEach(v => {
    if (v.isSensitive) {
      existingVarsByName.set(v.name, v.value);
    }
  });

  const replacedVariables: Variable[] = imported.variables.map(importedVar => ({
    ...importedVar,
    value: importedVar.isSensitive
      ? (existingVarsByName.get(importedVar.name) || '')
      : importedVar.value,
  }));

  return {
    rules: imported.rules,
    variables: replacedVariables,
    theme: existing.theme,
  };
}
