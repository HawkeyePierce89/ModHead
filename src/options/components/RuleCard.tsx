import type { ModificationRule } from '../../types';

interface RuleCardProps {
  rule: ModificationRule;
  onToggle: (id: string, enabled: boolean) => void;
  onEdit: (rule: ModificationRule) => void;
  onDelete: (id: string) => void;
}

export function RuleCard({ rule, onToggle, onEdit, onDelete }: RuleCardProps) {
  const matchTypeLabels = {
    startsWith: 'начинается с',
    endsWith: 'заканчивается на',
    equals: 'равно',
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
            Редактировать
          </button>
          <button className="btn btn-danger" onClick={() => onDelete(rule.id)}>
            Удалить
          </button>
        </div>
      </div>

      <div className="rule-details">
        {rule.tabUrl && (
          <p>
            <strong>URL таба:</strong> {rule.tabUrl} ({matchTypeLabels[rule.tabUrlMatchType]})
          </p>
        )}
        <p>
          <strong>Целевой домен:</strong> {rule.targetDomain} ({matchTypeLabels[rule.targetDomainMatchType]})
        </p>
        <p>
          <strong>Заголовков:</strong> {rule.headers.length}
        </p>
        {rule.headers.length > 0 && (
          <div style={{ marginTop: '10px' }}>
            <strong>Заголовки:</strong>
            <ul style={{ marginTop: '5px', marginLeft: '20px' }}>
              {rule.headers.map((header) => (
                <li key={header.id}>
                  <code>{header.name}</code>
                  {header.action === 'remove' ? (
                    <span> - удалить</span>
                  ) : (
                    <span>: <code>{header.value}</code> ({header.action === 'set' ? 'установить' : 'добавить'})</span>
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
