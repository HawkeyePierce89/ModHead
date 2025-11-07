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
    <div className={`bg-white p-5 rounded-lg shadow border-l-4 ${!rule.enabled ? 'opacity-60 border-l-[#95a5a6]' : 'border-[#3498db]'}`}>
      <div className="flex items-center justify-between mb-[15px]">
        <div className="flex items-center gap-[15px]">
          <label className="relative w-[50px] h-6">
            <input
              type="checkbox"
              checked={rule.enabled}
              onChange={(e) => onToggle(rule.id, e.target.checked)}
              className="peer opacity-0 w-0 h-0"
            />
            <span className="absolute cursor-pointer inset-0 bg-[#ccc] transition-all duration-[0.4s] rounded-[24px] peer-checked:bg-[#3498db] before:absolute before:content-[''] before:h-[18px] before:w-[18px] before:left-[3px] before:bottom-[3px] before:bg-white before:transition-all before:duration-[0.4s] before:rounded-full peer-checked:before:translate-x-[26px]"></span>
          </label>
          <h3 className="text-lg text-[#2c3e50]">{rule.name}</h3>
        </div>
        <div className="flex gap-2.5">
          <button className="px-5 py-2.5 border-0 rounded cursor-pointer text-sm font-medium transition-all duration-200 bg-[#3498db] text-white hover:bg-[#2980b9]" onClick={() => onEdit(rule)}>
            Edit
          </button>
          <button className="px-5 py-2.5 border-0 rounded cursor-pointer text-sm font-medium transition-all duration-200 bg-[#e74c3c] text-white hover:bg-[#c0392b]" onClick={() => onDelete(rule.id)}>
            Delete
          </button>
        </div>
      </div>

      <div>
        {rule.tabUrl && (
          <p>
            <strong>Tab URL:</strong> {rule.tabUrl} ({matchTypeLabels[rule.tabUrlMatchType]})
          </p>
        )}
        <div className="mt-2.5">
          <strong>Target Domains:</strong> {rule.targetDomains?.length || 0}
          {rule.targetDomains && rule.targetDomains.length > 0 && (
            <ul className="mt-1.5 ml-5">
              {rule.targetDomains.map((domain) => (
                <li key={domain.id}>
                  <code>{domain.url}</code> ({matchTypeLabels[domain.matchType]})
                </li>
              ))}
            </ul>
          )}
        </div>
        {rule.headers.length > 0 && (
          <div className="mt-2.5">
            <strong>Headers:</strong> {rule.headers.length}
            <ul className="mt-1.5 ml-5">
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
