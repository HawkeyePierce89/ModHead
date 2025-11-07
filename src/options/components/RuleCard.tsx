import type { ModificationRule } from '../../types';

interface RuleCardProps {
  rule: ModificationRule;
  onToggle: (id: string, enabled: boolean) => void;
  onEdit: (rule: ModificationRule) => void;
  onDelete: (id: string) => void;
}

export function RuleCard({ rule, onToggle, onEdit, onDelete }: RuleCardProps) {
  const matchTypeLabels = {
    startsWith: 'starts with',
    endsWith: 'ends with',
    equals: 'equals',
  };

  return (
    <div className={`rule-card ${!rule.enabled ? 'disabled' : ''}`}>
      <div className="rule-header">
        <div className="rule-title">
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={rule.enabled}
              onChange={(e) => onToggle(rule.id, e.target.checked)}
            />
            <span className="slider"></span>
          </label>
          <h3>{rule.name}</h3>
        </div>
        <div className="rule-actions">
          <button className="btn btn-primary" onClick={() => onEdit(rule)}>
            Edit
          </button>
          <button className="btn btn-danger" onClick={() => onDelete(rule.id)}>
            Delete
          </button>
        </div>
      </div>

      <div className="rule-details">
        {rule.tabUrl && (
          <p>
            <strong>Tab URL:</strong> {rule.tabUrl} ({matchTypeLabels[rule.tabUrlMatchType]})
          </p>
        )}
        <div className="rule-details-section">
          <strong>Target Domains:</strong> {rule.targetDomains?.length || 0}
          {rule.targetDomains && rule.targetDomains.length > 0 && (
            <ul className="rule-details-list">
              {rule.targetDomains.map((domain) => (
                <li key={domain.id}>
                  <code>{domain.url}</code> ({matchTypeLabels[domain.matchType]})
                </li>
              ))}
            </ul>
          )}
        </div>
        {rule.headers.length > 0 && (
          <div className="rule-details-section">
            <strong>Headers:</strong> {rule.headers.length}
            <ul className="rule-details-list">
              {rule.headers.map((header) => (
                <li key={header.id}>
                  <code>{header.name}</code>: <code>{header.value}</code>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
