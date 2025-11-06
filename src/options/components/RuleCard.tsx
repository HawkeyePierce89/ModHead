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
        <p>
          <strong>Target Domain:</strong> {rule.targetDomain} ({matchTypeLabels[rule.targetDomainMatchType]})
        </p>
        <p>
          <strong>Headers:</strong> {rule.headers.length}
        </p>
        {rule.headers.length > 0 && (
          <div style={{ marginTop: '10px' }}>
            <strong>Headers:</strong>
            <ul style={{ marginTop: '5px', marginLeft: '20px' }}>
              {rule.headers.map((header) => (
                <li key={header.id}>
                  <code>{header.name}</code>
                  {header.action === 'remove' ? (
                    <span> - remove</span>
                  ) : (
                    <span>: <code>{header.value}</code> ({header.action === 'set' ? 'set' : 'append'})</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
