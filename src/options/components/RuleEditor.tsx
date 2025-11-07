import { useState } from 'react';
import type { ModificationRule, HeaderModification, MatchType, TargetDomain } from '../../types';

interface RuleEditorProps {
  rule?: ModificationRule;
  onSave: (rule: ModificationRule) => void;
  onCancel: () => void;
}

export function RuleEditor({ rule, onSave, onCancel }: RuleEditorProps) {
  const [formData, setFormData] = useState<ModificationRule>(() => {
    if (rule) {
      return rule;
    }

    return {
      id: crypto.randomUUID(),
      enabled: true,
      name: '',
      tabUrl: '',
      tabUrlMatchType: 'startsWith' as MatchType,
      targetDomains: [],
      headers: [],
    };
  });

  const addTargetDomain = () => {
    const newDomain: TargetDomain = {
      id: crypto.randomUUID(),
      url: '',
      matchType: 'startsWith',
    };
    setFormData({
      ...formData,
      targetDomains: [...formData.targetDomains, newDomain],
    });
  };

  const updateTargetDomain = (id: string, field: keyof TargetDomain, value: string | MatchType) => {
    setFormData({
      ...formData,
      targetDomains: formData.targetDomains.map(d =>
        d.id === id ? { ...d, [field]: value } : d
      ),
    });
  };

  const removeTargetDomain = (id: string) => {
    setFormData({
      ...formData,
      targetDomains: formData.targetDomains.filter(d => d.id !== id),
    });
  };

  const addHeader = () => {
    const newHeader: HeaderModification = {
      id: crypto.randomUUID(),
      name: '',
      value: '',
    };
    setFormData({
      ...formData,
      headers: [...formData.headers, newHeader],
    });
  };

  const updateHeader = (id: string, field: keyof HeaderModification, value: string) => {
    setFormData({
      ...formData,
      headers: formData.headers.map(h =>
        h.id === id ? { ...h, [field]: value } : h
      ),
    });
  };

  const removeHeader = (id: string) => {
    setFormData({
      ...formData,
      headers: formData.headers.filter(h => h.id !== id),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      alert('Please fill in the rule name');
      return;
    }
    if (formData.targetDomains.length === 0) {
      alert('Please add at least one target domain');
      return;
    }
    if (formData.targetDomains.some(d => !d.url)) {
      alert('All target domains must have a URL');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
      <div className="bg-white p-[30px] rounded-lg w-[90%] max-w-[700px] max-h-[90vh] overflow-y-auto">
        <h2 className="mb-5 text-[#2c3e50]">{rule ? 'Edit Rule' : 'New Rule'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-[15px]">
            <label className="block mb-1.5 font-medium text-[#555] text-sm">Rule Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. API Headers"
              required
              className="w-full px-3 py-2 border border-[#ddd] rounded text-sm focus:outline-none focus:border-[#3498db]"
            />
          </div>

          <div className="grid grid-cols-[2fr_1fr] gap-[15px]">
            <div className="mb-[15px]">
              <label className="block mb-1.5 font-medium text-[#555] text-sm">Tab URL - optional</label>
              <input
                type="text"
                value={formData.tabUrl || ''}
                onChange={(e) => setFormData({ ...formData, tabUrl: e.target.value })}
                placeholder="https://example.com"
                className="w-full px-3 py-2 border border-[#ddd] rounded text-sm focus:outline-none focus:border-[#3498db]"
              />
            </div>
            <div className="mb-[15px]">
              <label className="block mb-1.5 font-medium text-[#555] text-sm">Match Type</label>
              <select
                value={formData.tabUrlMatchType}
                onChange={(e) => setFormData({ ...formData, tabUrlMatchType: e.target.value as MatchType })}
                className="w-full px-3 py-2 border border-[#ddd] rounded text-sm focus:outline-none focus:border-[#3498db]"
              >
                <option value="startsWith">Starts with</option>
                <option value="endsWith">Ends with</option>
                <option value="equals">Equals</option>
              </select>
            </div>
          </div>

          <div className="mt-5 pt-5 border-t border-[#eee]">
            <h4 className="mb-[15px] text-[#2c3e50]">Target Domains *</h4>
            {formData.targetDomains.map((domain) => (
              <div key={domain.id} className="flex gap-2.5 mb-2.5 items-center">
                <input
                  data-testid="target-domain-input"
                  type="text"
                  value={domain.url}
                  onChange={(e) => updateTargetDomain(domain.id, 'url', e.target.value)}
                  placeholder="https://api.example.com"
                  className="flex-[2] px-3 py-2 border border-[#ddd] rounded text-sm focus:outline-none focus:border-[#3498db]"
                />
                <select
                  value={domain.matchType}
                  onChange={(e) => updateTargetDomain(domain.id, 'matchType', e.target.value as MatchType)}
                  className="flex-1 px-3 py-2 border border-[#ddd] rounded text-sm focus:outline-none focus:border-[#3498db]"
                >
                  <option value="startsWith">Starts with</option>
                  <option value="endsWith">Ends with</option>
                  <option value="equals">Equals</option>
                </select>
                <button
                  type="button"
                  className="px-3 py-2 bg-transparent border border-[#e74c3c] text-[#e74c3c] rounded cursor-pointer transition-all duration-200 hover:bg-[#e74c3c] hover:text-white"
                  onClick={() => removeTargetDomain(domain.id)}
                  title="Remove domain"
                >
                  ✕
                </button>
              </div>
            ))}
            <button type="button" className="px-5 py-2.5 border-0 rounded cursor-pointer text-sm font-medium transition-all duration-200 bg-[#95a5a6] text-white hover:bg-[#7f8c8d]" onClick={addTargetDomain}>
              + Add Target Domain
            </button>
          </div>

          <div className="mt-5 pt-5 border-t border-[#eee]">
            <h4 className="mb-[15px] text-[#2c3e50]">HTTP Headers</h4>
            {formData.headers.map((header) => (
              <div key={header.id} className="grid grid-cols-[2fr_2fr_auto] gap-2.5 mb-2.5 items-center">
                <input
                  data-testid="header-name-input"
                  type="text"
                  value={header.name}
                  onChange={(e) => updateHeader(header.id, 'name', e.target.value)}
                  placeholder="Header name"
                  className="px-3 py-2 border border-[#ddd] rounded text-sm focus:outline-none focus:border-[#3498db]"
                />
                <input
                  data-testid="header-value-input"
                  type="text"
                  value={header.value}
                  onChange={(e) => updateHeader(header.id, 'value', e.target.value)}
                  placeholder="Value"
                  className="px-3 py-2 border border-[#ddd] rounded text-sm focus:outline-none focus:border-[#3498db]"
                />
                <button
                  type="button"
                  className="px-3 py-2 bg-transparent border border-[#e74c3c] text-[#e74c3c] rounded cursor-pointer transition-all duration-200 hover:bg-[#e74c3c] hover:text-white"
                  onClick={() => removeHeader(header.id)}
                  title="Remove header"
                >
                  ✕
                </button>
              </div>
            ))}
            <button data-testid="add-header-button" type="button" className="px-5 py-2.5 border-0 rounded cursor-pointer text-sm font-medium transition-all duration-200 bg-[#95a5a6] text-white hover:bg-[#7f8c8d]" onClick={addHeader}>
              + Add Header
            </button>
          </div>

          <div className="flex justify-end gap-2.5 mt-5 pt-5 border-t border-[#eee]">
            <button data-testid="cancel-button" type="button" className="px-5 py-2.5 border-0 rounded cursor-pointer text-sm font-medium transition-all duration-200 bg-[#95a5a6] text-white hover:bg-[#7f8c8d]" onClick={onCancel}>
              Cancel
            </button>
            <button data-testid="save-rule-button" type="submit" className="px-5 py-2.5 border-0 rounded cursor-pointer text-sm font-medium transition-all duration-200 bg-[#3498db] text-white hover:bg-[#2980b9]">
              {rule ? 'Save' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
