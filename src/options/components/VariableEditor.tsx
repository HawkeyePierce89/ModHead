import { useState, useEffect } from 'react';
import type { Variable, RefreshConfig } from '../../types';
import { showError } from '../../utils/toast';
import { RefreshConfigEditor } from './RefreshConfigEditor';

interface VariableEditorProps {
  variable?: Variable; // If provided, we're editing; otherwise, we're adding
  existingVariables: Variable[];
  onSave: (variable: Variable) => void;
  onCancel: () => void;
}

export function VariableEditor({
  variable,
  existingVariables,
  onSave,
  onCancel,
}: VariableEditorProps) {
  const [editName, setEditName] = useState('');
  const [editValue, setEditValue] = useState('');
  const [editIsSensitive, setEditIsSensitive] = useState(false);
  const [editRefreshUrl, setEditRefreshUrl] = useState('');
  const [editRefreshMethod, setEditRefreshMethod] = useState<string>('POST');
  const [editRefreshHeaders, setEditRefreshHeaders] = useState<Array<{ key: string; value: string }>>([]);
  const [editRefreshBody, setEditRefreshBody] = useState('');
  const [editTransformResponse, setEditTransformResponse] = useState('');

  // Initialize form when variable changes
  useEffect(() => {
    if (variable) {
      setEditName(variable.name);
      setEditValue(variable.value);
      setEditIsSensitive(variable.isSensitive || false);

      if (variable.refreshConfig) {
        setEditRefreshUrl(variable.refreshConfig.url || '');
        setEditRefreshMethod((variable.refreshConfig.method as string) || 'POST');
        setEditTransformResponse(variable.refreshConfig.transformResponse || '');

        // Extract headers
        if (variable.refreshConfig.headers) {
          const headersArray = Object.entries(variable.refreshConfig.headers).map(([key, value]) => ({
            key,
            value,
          }));
          setEditRefreshHeaders(headersArray);
        } else {
          setEditRefreshHeaders([]);
        }

        // Extract body
        if (variable.refreshConfig.body) {
          if (typeof variable.refreshConfig.body === 'string') {
            setEditRefreshBody(variable.refreshConfig.body);
          } else {
            setEditRefreshBody(JSON.stringify(variable.refreshConfig.body, null, 2));
          }
        } else {
          setEditRefreshBody('');
        }
      } else {
        setEditRefreshUrl('');
        setEditRefreshMethod('POST');
        setEditRefreshHeaders([]);
        setEditRefreshBody('');
        setEditTransformResponse('');
      }
    } else {
      // Reset for adding new variable
      setEditName('');
      setEditValue('');
      setEditIsSensitive(false);
      setEditRefreshUrl('');
      setEditRefreshMethod('POST');
      setEditRefreshHeaders([]);
      setEditRefreshBody('');
      setEditTransformResponse('');
    }
  }, [variable]);

  const handleSave = () => {
    if (!editName.trim()) {
      showError('Variable name cannot be empty');
      return;
    }

    // Check for duplicate names (excluding current variable being edited)
    const duplicate = existingVariables.find(
      v => v.name === editName && v.id !== variable?.id
    );
    if (duplicate) {
      showError(`Variable "${editName}" already exists`);
      return;
    }

    // Build refresh config from separate fields
    let refreshConfig: RefreshConfig | undefined;
    if (editRefreshUrl.trim()) {
      // Build headers object
      const headers: Record<string, string> = {};
      editRefreshHeaders.forEach(header => {
        if (header.key.trim() && header.value.trim()) {
          headers[header.key.trim()] = header.value.trim();
        }
      });

      // Parse body JSON if provided
      let body: Record<string, unknown> | string | undefined;
      if (editRefreshBody.trim()) {
        try {
          body = JSON.parse(editRefreshBody) as Record<string, unknown>;
        } catch {
          // If not valid JSON, treat as string
          body = editRefreshBody;
        }
      }

      // Build complete refresh config
      refreshConfig = {
        url: editRefreshUrl,
        method: editRefreshMethod as RefreshConfig['method'],
        headers: Object.keys(headers).length > 0 ? headers : undefined,
        body,
        transformResponse: editTransformResponse.trim() || undefined,
      };
    }

    // Generate ID for new variables
    const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    const savedVariable: Variable = {
      id: variable?.id || generateId(),
      name: editName,
      value: editValue,
      isSensitive: editIsSensitive,
      refreshConfig,
    };

    onSave(savedVariable);
  };

  return (
    <div className="p-5 mb-5 bg-[#ecf0f1] dark:bg-[#3a3a3a] rounded">
      <div className="flex gap-2.5 mb-2.5">
        <input
          type="text"
          placeholder="Variable name (e.g., bearer)"
          value={editName}
          onChange={e => setEditName(e.target.value)}
          className="flex-1 px-2.5 py-2 border border-[#bdc3c7] rounded text-sm
            dark:border-[#404040] dark:bg-[#2d2d2d] dark:text-[#e4e4e4]"
        />
        <input
          type={editIsSensitive ? 'password' : 'text'}
          placeholder="Variable value"
          value={editValue}
          onChange={e => setEditValue(e.target.value)}
          className="flex-1 px-2.5 py-2 border border-[#bdc3c7] rounded text-sm
            dark:border-[#404040] dark:bg-[#2d2d2d] dark:text-[#e4e4e4]"
        />
      </div>
      <div className="mb-2.5">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            data-testid="sensitive-checkbox"
            type="checkbox"
            checked={editIsSensitive}
            onChange={e => setEditIsSensitive(e.target.checked)}
            className="cursor-pointer"
          />
          <span className="text-sm text-[#2c3e50] dark:text-[#e4e4e4]">
            🔒 Sensitive data (hide value in list)
          </span>
        </label>
      </div>

      <RefreshConfigEditor
        refreshUrl={editRefreshUrl}
        onRefreshUrlChange={setEditRefreshUrl}
        refreshMethod={editRefreshMethod}
        onRefreshMethodChange={setEditRefreshMethod}
        refreshHeaders={editRefreshHeaders}
        onRefreshHeadersChange={setEditRefreshHeaders}
        refreshBody={editRefreshBody}
        onRefreshBodyChange={setEditRefreshBody}
        transformResponse={editTransformResponse}
        onTransformResponseChange={setEditTransformResponse}
      />

      <div className="flex gap-2.5 justify-end">
        <button
          className="px-5 py-2.5 border-0 rounded cursor-pointer text-sm font-medium
            transition-all duration-200 bg-[#95a5a6] text-white hover:bg-[#7f8c8d]"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          data-testid="save-variable-button"
          className="px-5 py-2.5 border-0 rounded cursor-pointer text-sm font-medium
            transition-all duration-200 bg-[#27ae60] text-white hover:bg-[#229954]"
          onClick={handleSave}
        >
          Save
        </button>
      </div>
    </div>
  );
}
