import type { Variable } from '../../types';

interface VariableListItemProps {
  variable: Variable;
  isRefreshing: boolean;
  isVisible: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onRefresh: () => void;
  onToggleVisibility: () => void;
}

export function VariableListItem({
  variable,
  isRefreshing,
  isVisible,
  onEdit,
  onDelete,
  onRefresh,
  onToggleVisibility,
}: VariableListItemProps) {
  const isSensitive = variable.isSensitive || false;
  const displayValue = isSensitive && !isVisible ? '•••••••' : variable.value;

  return (
    <div
      data-testid="variable-item"
      data-variable-name={variable.name}
      className="flex items-center justify-between p-2.5 bg-[#ecf0f1] dark:bg-[#3a3a3a] rounded"
    >
      <div className="flex-1 flex items-center gap-2">
        <code className="text-[#2c3e50] dark:text-[#e4e4e4] font-semibold">
          {'${' + variable.name + '}'}
        </code>
        <span className="text-[#7f8c8d] dark:text-[#b0b0b0]">=</span>
        <code data-testid="variable-value" className="text-[#27ae60]">{displayValue}</code>
        {isSensitive && (
          <button
            data-testid="toggle-sensitive-visibility"
            onClick={onToggleVisibility}
            className="px-1.5 py-0.5 border-0 rounded cursor-pointer text-sm
              bg-transparent hover:bg-[#bdc3c7] dark:hover:bg-[#4a4a4a]
              transition-colors duration-200"
            title={isVisible ? 'Hide value' : 'Show value'}
          >
            {isVisible ? '🙈' : '👁️'}
          </button>
        )}
        {variable.refreshConfig && (
          <span className="text-xs text-[#95a5a6] dark:text-[#888]">(auto-refresh enabled)</span>
        )}
      </div>
      <div className="flex gap-2.5">
        {variable.refreshConfig && (
          <button
            data-testid="refresh-variable-button"
            className="px-2.5 py-1.5 border-0 rounded cursor-pointer text-xs font-medium
              transition-all duration-200 bg-[#f39c12] text-white hover:bg-[#e67e22]
              disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        )}
        <button
          className="px-2.5 py-1.5 border-0 rounded cursor-pointer text-xs font-medium
            transition-all duration-200 bg-[#3498db] text-white hover:bg-[#2980b9]"
          onClick={onEdit}
        >
          Edit
        </button>
        <button
          data-testid="delete-variable-button"
          className="px-2.5 py-1.5 border-0 rounded cursor-pointer text-xs font-medium
            transition-all duration-200 bg-[#e74c3c] text-white hover:bg-[#c0392b]"
          onClick={onDelete}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
