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
    <div className="modal-overlay">
      <div className="modal">
        <h2>{rule ? 'Edit Rule' : 'New Rule'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Rule Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. API Headers"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Tab URL - optional</label>
              <input
                type="text"
                value={formData.tabUrl || ''}
                onChange={(e) => setFormData({ ...formData, tabUrl: e.target.value })}
                placeholder="https://example.com"
              />
            </div>
            <div className="form-group">
              <label>Match Type</label>
              <select
                value={formData.tabUrlMatchType}
                onChange={(e) => setFormData({ ...formData, tabUrlMatchType: e.target.value as MatchType })}
              >
                <option value="startsWith">Starts with</option>
                <option value="endsWith">Ends with</option>
                <option value="equals">Equals</option>
              </select>
            </div>
          </div>

          <div className="domains-section">
            <h4>Target Domains *</h4>
            {formData.targetDomains.map((domain) => (
              <div key={domain.id} className="domain-item">
                <input
                  type="text"
                  value={domain.url}
                  onChange={(e) => updateTargetDomain(domain.id, 'url', e.target.value)}
                  placeholder="https://api.example.com"
                />
                <select
                  value={domain.matchType}
                  onChange={(e) => updateTargetDomain(domain.id, 'matchType', e.target.value as MatchType)}
                >
                  <option value="startsWith">Starts with</option>
                  <option value="endsWith">Ends with</option>
                  <option value="equals">Equals</option>
                </select>
                <button
                  type="button"
                  className="btn-icon"
                  onClick={() => removeTargetDomain(domain.id)}
                  title="Remove domain"
                >
                  ✕
                </button>
              </div>
            ))}
            <button type="button" className="btn btn-secondary" onClick={addTargetDomain}>
              + Add Target Domain
            </button>
          </div>

          <div className="headers-section">
            <h4>HTTP Headers</h4>
            {formData.headers.map((header) => (
              <div key={header.id} className="header-item">
                <input
                  type="text"
                  value={header.name}
                  onChange={(e) => updateHeader(header.id, 'name', e.target.value)}
                  placeholder="Header name"
                />
                <input
                  type="text"
                  value={header.value}
                  onChange={(e) => updateHeader(header.id, 'value', e.target.value)}
                  placeholder="Value"
                />
                <button
                  type="button"
                  className="btn-icon"
                  onClick={() => removeHeader(header.id)}
                  title="Remove header"
                >
                  ✕
                </button>
              </div>
            ))}
            <button type="button" className="btn btn-secondary" onClick={addHeader}>
              + Add Header
            </button>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {rule ? 'Save' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
