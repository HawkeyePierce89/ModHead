import { useState, useEffect, useCallback } from 'react';
import type { ModificationRule } from '../types';
import { getSettings, saveSettings } from '../utils/storage';
import { RuleCard } from './components/RuleCard';
import { RuleEditor } from './components/RuleEditor';
import './index.css';

function App() {
  const [rules, setRules] = useState<ModificationRule[]>([]);
  const [editingRule, setEditingRule] = useState<ModificationRule | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const loadRules = useCallback(async () => {
    const settings = await getSettings();
    setRules(settings.rules);
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
    if (!confirm('Are you sure you want to delete this rule?')) {
      return;
    }

    const settings = await getSettings();
    settings.rules = settings.rules.filter(r => r.id !== id);
    await saveSettings(settings);
    await loadRules();
  };

  return (
    <div className="app">
      <div className="header">
        <h1>ModHead</h1>
        <p>Modify HTTP headers for Chrome</p>
      </div>

      {rules.length === 0 ? (
        <div className="empty-state">
          <h3>No Rules</h3>
          <p>Create your first rule to modify HTTP headers</p>
          <button
            data-testid="create-rule-button"
            className="btn btn-primary"
            onClick={() => setIsCreating(true)}
          >
            Create Rule
          </button>
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
    </div>
  );
}

export default App;
