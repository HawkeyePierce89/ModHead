import { useState, useEffect } from 'react';
import type { ModificationRule } from '../types';
import { getSettings, saveSettings } from '../utils/storage';
import { RuleCard } from './components/RuleCard';
import { RuleEditor } from './components/RuleEditor';
import './App.css';

function App() {
  const [rules, setRules] = useState<ModificationRule[]>([]);
  const [editingRule, setEditingRule] = useState<ModificationRule | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    const settings = await getSettings();
    setRules(settings.rules);
  };

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
    if (!confirm('Вы уверены, что хотите удалить это правило?')) {
      return;
    }

    const settings = await getSettings();
    settings.rules = settings.rules.filter(r => r.id !== id);
    await saveSettings(settings);
    await loadRules();
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(rules, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'modhead-rules.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const importedRules = JSON.parse(text) as ModificationRule[];

        if (!Array.isArray(importedRules)) {
          alert('Неверный формат файла');
          return;
        }

        const settings = await getSettings();
        settings.rules = importedRules;
        await saveSettings(settings);
        await loadRules();
        alert('Правила успешно импортированы');
      } catch (error) {
        alert('Ошибка при импорте: ' + error);
      }
    };
    input.click();
  };

  return (
    <div className="app">
      <div className="header">
        <h1>ModHead</h1>
        <p>Модификация HTTP заголовков для Chrome</p>
      </div>

      <div className="controls">
        <button className="btn btn-primary" onClick={() => setIsCreating(true)}>
          + Создать правило
        </button>
        <button className="btn btn-secondary" onClick={handleExport} disabled={rules.length === 0}>
          Экспорт правил
        </button>
        <button className="btn btn-secondary" onClick={handleImport}>
          Импорт правил
        </button>
      </div>

      {rules.length === 0 ? (
        <div className="empty-state">
          <h3>Нет правил</h3>
          <p>Создайте первое правило для модификации заголовков HTTP</p>
          <button className="btn btn-primary" onClick={() => setIsCreating(true)}>
            Создать правило
          </button>
        </div>
      ) : (
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
    </div>
  );
}

export default App;
