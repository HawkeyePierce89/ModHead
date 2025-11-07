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
    <div className="max-w-[1200px] mx-auto p-5">
      <div className="bg-white px-[30px] py-5 rounded-lg mb-5 shadow">
        <h1 className="text-[28px] text-[#2c3e50] mb-2">ModHead</h1>
        <p className="text-[#7f8c8d] text-sm">Modify HTTP headers for Chrome</p>
      </div>

      {rules.length === 0 ? (
        <div className="text-center py-[60px] px-5 bg-white rounded-lg shadow">
          <h3 className="text-[#7f8c8d] mb-2.5">No Rules</h3>
          <p className="text-[#95a5a6] mb-5">Create your first rule to modify HTTP headers</p>
          <button
            data-testid="create-rule-button"
            className="px-5 py-2.5 border-0 rounded cursor-pointer text-sm font-medium
              transition-all duration-200 bg-[#3498db] text-white hover:bg-[#2980b9]"
            onClick={() => setIsCreating(true)}
          >
            Create Rule
          </button>
        </div>
      ) : (
        <>
          <div className="bg-white px-[30px] py-5 rounded-lg mb-5 shadow">
            <button
              data-testid="create-rule-button"
              className="px-5 py-2.5 border-0 rounded cursor-pointer text-sm font-medium
              transition-all duration-200 bg-[#3498db] text-white hover:bg-[#2980b9]"
              onClick={() => setIsCreating(true)}
            >
              + Create Rule
            </button>
          </div>
          <div className="flex flex-col gap-[15px]">
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
