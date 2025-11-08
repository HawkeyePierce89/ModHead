import { useState } from 'react';
import type { Variable } from '../../types';
import { refreshVariable } from '../../utils/variableRefresh';
import { showSuccess, showError, showConfirm } from '../../utils/toast';
import { VariableEditor } from './VariableEditor';
import { VariableListItem } from './VariableListItem';

interface VariablesManagerProps {
  variables: Variable[];
  onSave: (variables: Variable[]) => void;
}

export function VariablesManager({ variables, onSave }: VariablesManagerProps) {
  const [editingVariable, setEditingVariable] = useState<Variable | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [visibleSensitiveIds, setVisibleSensitiveIds] = useState<Set<string>>(new Set());

  const handleAdd = () => {
    setIsAdding(true);
    setEditingVariable(null);
  };

  const handleEdit = (variable: Variable) => {
    setEditingVariable(variable);
    setIsAdding(false);
  };

  const handleSaveVariable = (variable: Variable) => {
    let newVariables: Variable[];

    if (isAdding) {
      // Adding new variable
      newVariables = [...variables, variable];
    } else {
      // Updating existing variable
      newVariables = variables.map(v =>
        v.id === variable.id ? variable : v
      );
    }

    onSave(newVariables);
    handleCancel();
  };

  const handleDelete = (id: string) => {
    showConfirm('Are you sure you want to delete this variable?', () => {
      const newVariables = variables.filter(v => v.id !== id);
      onSave(newVariables);
    });
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingVariable(null);
  };

  const handleRefresh = async (variable: Variable) => {
    if (!variable.refreshConfig) {
      return;
    }

    setRefreshingId(variable.id);
    try {
      const newValue = await refreshVariable(variable, variables);
      const newVariables = variables.map(v =>
        v.id === variable.id ? { ...v, value: newValue } : v
      );
      onSave(newVariables);
      showSuccess('Variable refreshed successfully!');
    } catch (error) {
      showError('Failed to refresh variable: ' + (error as Error).message);
    } finally {
      setRefreshingId(null);
    }
  };

  const toggleSensitiveVisibility = (id: string) => {
    setVisibleSensitiveIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const showEditor = isAdding || editingVariable !== null;

  return (
    <div className="bg-white dark:bg-[#2d2d2d] px-[30px] py-5 rounded-lg mb-5 shadow">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl text-[#2c3e50] dark:text-[#e4e4e4] mb-1">Variables</h2>
          <p className="text-[#7f8c8d] dark:text-[#b0b0b0] text-sm">
            Define variables to use in header values with syntax: {'${variableName}'}
          </p>
        </div>
        {!showEditor && (
          <button
            data-testid="add-variable-button"
            className="px-5 py-2.5 border-0 rounded cursor-pointer text-sm font-medium
              transition-all duration-200 bg-[#3498db] text-white hover:bg-[#2980b9]"
            onClick={handleAdd}
          >
            + Add Variable
          </button>
        )}
      </div>

      {/* Security Warning Banner */}
      <div className="mb-5 px-4 py-3 bg-[#fff3cd] dark:bg-[#5a4a1a] border-l-4 border-[#f39c12] rounded">
        <div className="flex items-start gap-2">
          <span className="text-[#f39c12] text-lg">⚠️</span>
          <p className="text-sm text-[#856404] dark:text-[#ffc107] leading-relaxed">
            <strong>Security Notice:</strong> Variables are stored in plain text in browser storage.
            For sensitive credentials, use tokens with limited permissions and short expiration times.
          </p>
        </div>
      </div>

      {showEditor && (
        <VariableEditor
          variable={editingVariable || undefined}
          existingVariables={variables}
          onSave={handleSaveVariable}
          onCancel={handleCancel}
        />
      )}

      {variables.length === 0 ? (
        <p className="text-[#95a5a6] dark:text-[#888] text-sm">
          No variables defined yet. Variables allow you to reuse values across multiple headers.
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {variables.map(variable => (
            <VariableListItem
              key={variable.id}
              variable={variable}
              isRefreshing={refreshingId === variable.id}
              isVisible={visibleSensitiveIds.has(variable.id)}
              onEdit={() => handleEdit(variable)}
              onDelete={() => handleDelete(variable.id)}
              onRefresh={() => handleRefresh(variable)}
              onToggleVisibility={() => toggleSensitiveVisibility(variable.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
