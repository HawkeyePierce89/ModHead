import { useState, useEffect, useCallback, useRef } from 'react';
import { Toaster } from 'react-hot-toast';
import type { ModificationRule, Variable, ExportedSettings } from '../types';
import { getSettings, saveSettings } from '../utils/storage';
import {
  prepareSettingsForExport,
  generateExportFilename,
  downloadAsJson,
  parseImportedFile,
  mergeSettings,
  replaceSettings,
} from '../utils/exportImport';
import { RuleCard } from './components/RuleCard';
import { RuleEditor } from './components/RuleEditor';
import { VariablesManager } from './components/VariablesManager';
import { ThemeToggle } from './components/ThemeToggle';
import { ImportConfirmModal } from './components/ImportConfirmModal';
import { showConfirm, showSuccess, showError } from '../utils/toast';
import './index.css';

function App() {
  const [rules, setRules] = useState<ModificationRule[]>([]);
  const [variables, setVariables] = useState<Variable[]>([]);
  const [editingRule, setEditingRule] = useState<ModificationRule | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [importData, setImportData] = useState<ExportedSettings | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadRules = useCallback(async () => {
    const settings = await getSettings();
    setRules(settings.rules);
    setVariables(settings.variables);
  }, []);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  const handleSaveRule = async (rule: ModificationRule) => {
    const settings = await getSettings();

    const existingIndex = settings.rules.findIndex(r => r.id === rule.id);
    if (existingIndex !== -1) {
      settings.rules[existingIndex] = rule;
    } else {
      settings.rules.push(rule);
    }

    await saveSettings(settings);
    await loadRules();
    setEditingRule(null);
    setIsCreating(false);
  };

  const handleToggleRule = async (id: string, enabled: boolean) => {
    const settings = await getSettings();
    const rule = settings.rules.find(r => r.id === id);
    if (rule) {
      rule.enabled = enabled;
      await saveSettings(settings);
      await loadRules();
    }
  };

  const handleDeleteRule = async (id: string) => {
    showConfirm('Are you sure you want to delete this rule?', async () => {
      const settings = await getSettings();
      settings.rules = settings.rules.filter(r => r.id !== id);
      await saveSettings(settings);
      await loadRules();
    });
  };

  const handleSaveVariables = async (newVariables: Variable[]) => {
    const settings = await getSettings();
    settings.variables = newVariables;
    await saveSettings(settings);
    await loadRules();
  };

  const handleExport = async () => {
    const settings = await getSettings();
    const exportData = prepareSettingsForExport(settings);
    const filename = generateExportFilename();
    downloadAsJson(exportData, filename);
    showSuccess('Settings exported successfully');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    event.target.value = '';

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const parsed = parseImportedFile(content);
      if (parsed) {
        setImportData(parsed);
      } else {
        showError('Invalid settings file');
      }
    };
    reader.onerror = () => {
      showError('Failed to read file');
    };
    reader.readAsText(file);
  };

  const handleImportMerge = async () => {
    if (!importData) return;
    const existing = await getSettings();
    const merged = mergeSettings(existing, importData.settings);
    await saveSettings(merged);
    await loadRules();
    setImportData(null);
    showSuccess('Settings merged successfully');
  };

  const handleImportReplace = async () => {
    if (!importData) return;
    const existing = await getSettings();
    const replaced = replaceSettings(existing, importData.settings);
    await saveSettings(replaced);
    await loadRules();
    setImportData(null);
    showSuccess('Settings replaced successfully');
  };

  return (
    <>
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          className: '!text-base !py-4 !px-6 !min-w-[320px] dark:!bg-[#3a3a3a] dark:!text-[#e4e4e4]',
          success: {
            className: '!bg-[#27ae60] !text-white !text-base !py-4 !px-6 !min-w-[320px] dark:!bg-[#27ae60]',
            iconTheme: {
              primary: '#fff',
              secondary: '#27ae60',
            },
          },
          error: {
            className: '!bg-[#e74c3c] !text-white !text-base !py-4 !px-6 !min-w-[320px] dark:!bg-[#e74c3c]',
            iconTheme: {
              primary: '#fff',
              secondary: '#e74c3c',
            },
          },
        }}
      />
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".json"
        onChange={handleFileSelect}
        data-testid="import-file-input"
      />
      <div className="app">
        <div className="header">
          <div>
            <h1>ModHead</h1>
            <p>Modify HTTP headers for Chrome</p>
          </div>
          <ThemeToggle />
        </div>

      <VariablesManager variables={variables} onSave={handleSaveVariables} />

      {rules.length === 0 ? (
        <div className="empty-state">
          <h3>No Rules</h3>
          <p>Create your first rule to modify HTTP headers</p>
          <div className="flex gap-2.5 justify-center">
            <button
              data-testid="create-rule-button"
              className="btn btn-primary"
              onClick={() => setIsCreating(true)}
            >
              Create Rule
            </button>
            <button
              data-testid="export-button"
              className="btn btn-secondary"
              onClick={handleExport}
            >
              Export
            </button>
            <button
              data-testid="import-button"
              className="btn btn-secondary"
              onClick={handleImportClick}
            >
              Import
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="controls">
            <button
              data-testid="create-rule-button"
              className="btn btn-primary"
              onClick={() => setIsCreating(true)}
            >
              + Create Rule
            </button>
            <div className="flex gap-2.5 ml-auto">
              <button
                data-testid="export-button"
                className="btn btn-secondary"
                onClick={handleExport}
              >
                Export
              </button>
              <button
                data-testid="import-button"
                className="btn btn-secondary"
                onClick={handleImportClick}
              >
                Import
              </button>
            </div>
          </div>
          <div className="rules-list">
            {rules.map((rule) => (
              <RuleCard
                key={rule.id}
                rule={rule}
                onToggle={handleToggleRule}
                onEdit={setEditingRule}
                onDelete={handleDeleteRule}
              />
            ))}
          </div>
        </>
      )}

      {(isCreating || editingRule) && (
        <RuleEditor
          rule={editingRule || undefined}
          onSave={handleSaveRule}
          onCancel={() => {
            setIsCreating(false);
            setEditingRule(null);
          }}
        />
      )}

      {importData && (
        <ImportConfirmModal
          importedData={importData}
          onMerge={handleImportMerge}
          onReplace={handleImportReplace}
          onCancel={() => setImportData(null)}
        />
      )}
      </div>
    </>
  );
}

export default App;
