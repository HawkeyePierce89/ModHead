import { useState } from 'react';
import type { Variable, RefreshConfig } from '../../types';
import { refreshVariable } from '../../utils/variableRefresh';

interface VariablesManagerProps {
  variables: Variable[];
  onSave: (variables: Variable[]) => void;
}

export function VariablesManager({ variables, onSave }: VariablesManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editName, setEditName] = useState('');
  const [editValue, setEditValue] = useState('');
  const [editRefreshUrl, setEditRefreshUrl] = useState('');
  const [editRefreshMethod, setEditRefreshMethod] = useState<string>('POST');
  const [editRefreshHeaders, setEditRefreshHeaders] = useState<Array<{ key: string; value: string }>>([]);
  const [editRefreshBody, setEditRefreshBody] = useState('');
  const [editTransformResponse, setEditTransformResponse] = useState('');
  const [refreshingId, setRefreshingId] = useState<string | null>(null);

  const handleAdd = () => {
    setIsAdding(true);
    setEditName('');
    setEditValue('');
    setEditRefreshUrl('');
    setEditRefreshMethod('POST');
    setEditRefreshHeaders([]);
    setEditRefreshBody('');
    setEditTransformResponse('');
  };

  const handleEdit = (variable: Variable) => {
    setEditingId(variable.id);
    setEditName(variable.name);
    setEditValue(variable.value);

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
  };

  const handleSave = () => {
    if (!editName.trim()) {
      alert('Variable name cannot be empty');
      return;
    }

    // Check for duplicate names (excluding current variable being edited)
    const duplicate = variables.find(
      v => v.name === editName && v.id !== editingId
    );
    if (duplicate) {
      alert(`Variable "${editName}" already exists`);
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

    let newVariables: Variable[];

    if (isAdding) {
      // Generate ID using timestamp and random number for uniqueness
      const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const newVariable: Variable = {
        id: generateId(),
        name: editName,
        value: editValue,
        refreshConfig,
      };
      newVariables = [...variables, newVariable];
    } else if (editingId) {
      newVariables = variables.map(v =>
        v.id === editingId ? { ...v, name: editName, value: editValue, refreshConfig } : v
      );
    } else {
      return;
    }

    onSave(newVariables);
    handleCancel();
  };

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this variable?')) {
      return;
    }
    const newVariables = variables.filter(v => v.id !== id);
    onSave(newVariables);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setEditName('');
    setEditValue('');
    setEditRefreshUrl('');
    setEditRefreshMethod('POST');
    setEditRefreshHeaders([]);
    setEditRefreshBody('');
    setEditTransformResponse('');
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
      alert('Variable refreshed successfully!');
    } catch (error) {
      alert('Failed to refresh variable: ' + (error as Error).message);
    } finally {
      setRefreshingId(null);
    }
  };

  return (
    <div className="bg-white px-[30px] py-5 rounded-lg mb-5 shadow">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl text-[#2c3e50] mb-1">Variables</h2>
          <p className="text-[#7f8c8d] text-sm">
            Define variables to use in header values with syntax: {'${variableName}'}
          </p>
        </div>
        {!isAdding && !editingId && (
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

      {(isAdding || editingId) && (
        <div className="p-5 mb-5 bg-[#ecf0f1] rounded">
          <div className="flex gap-2.5 mb-2.5">
            <input
              type="text"
              placeholder="Variable name (e.g., bearer)"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              className="flex-1 px-2.5 py-2 border border-[#bdc3c7] rounded text-sm"
            />
            <input
              type="text"
              placeholder="Variable value"
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              className="flex-1 px-2.5 py-2 border border-[#bdc3c7] rounded text-sm"
            />
          </div>
          <div className="mb-2.5">
            <label className="block text-sm text-[#7f8c8d] mb-1">
              Auto-refresh URL (optional):
            </label>
            <input
              type="text"
              placeholder="https://example.com/auth/token"
              value={editRefreshUrl}
              onChange={e => setEditRefreshUrl(e.target.value)}
              className="w-full px-2.5 py-2 border border-[#bdc3c7] rounded text-sm"
            />
            <p className="text-xs text-[#95a5a6] mt-1">
              URL to fetch new token. You can use variables with {'${variableName}'} syntax
            </p>
          </div>

          {editRefreshUrl.trim() && (
            <>
              <div className="mb-2.5">
                <label className="block text-sm text-[#7f8c8d] mb-1">
                  HTTP Method:
                </label>
                <select
                  value={editRefreshMethod}
                  onChange={e => setEditRefreshMethod(e.target.value)}
                  className="w-full px-2.5 py-2 border border-[#bdc3c7] rounded text-sm"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="PATCH">PATCH</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>

              <div className="mb-2.5">
                <label className="block text-sm text-[#7f8c8d] mb-2">
                  Headers (optional):
                </label>
                {editRefreshHeaders.map((header, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Header name"
                      value={header.key}
                      onChange={e => {
                        const newHeaders = [...editRefreshHeaders];
                        newHeaders[index].key = e.target.value;
                        setEditRefreshHeaders(newHeaders);
                      }}
                      className="flex-1 px-2.5 py-1.5 border border-[#bdc3c7] rounded text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Header value (can use ${variables})"
                      value={header.value}
                      onChange={e => {
                        const newHeaders = [...editRefreshHeaders];
                        newHeaders[index].value = e.target.value;
                        setEditRefreshHeaders(newHeaders);
                      }}
                      className="flex-[2] px-2.5 py-1.5 border border-[#bdc3c7] rounded text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newHeaders = editRefreshHeaders.filter((_, i) => i !== index);
                        setEditRefreshHeaders(newHeaders);
                      }}
                      className="px-2.5 py-1.5 border-0 rounded cursor-pointer text-xs
                        bg-[#e74c3c] text-white hover:bg-[#c0392b]"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setEditRefreshHeaders([...editRefreshHeaders, { key: '', value: '' }])}
                  className="px-3 py-1.5 border-0 rounded cursor-pointer text-xs
                    bg-[#3498db] text-white hover:bg-[#2980b9]"
                >
                  + Add Header
                </button>
              </div>

              <div className="mb-2.5">
                <label className="block text-sm text-[#7f8c8d] mb-1">
                  Request Body (JSON, optional):
                </label>
                <textarea
                  placeholder={'{\n  "username": "${username}",\n  "password": "${password}"\n}'}
                  value={editRefreshBody}
                  onChange={e => setEditRefreshBody(e.target.value)}
                  className="w-full px-2.5 py-2 border border-[#bdc3c7] rounded text-sm font-mono min-h-[80px]"
                />
                <p className="text-xs text-[#95a5a6] mt-1">
                  JSON object. Use variables with {'${variableName}'} syntax
                </p>
              </div>

              <div className="mb-2.5">
                <label className="block text-sm text-[#7f8c8d] mb-1">
                  Transform Response (optional):
                </label>
                <input
                  type="text"
                  placeholder="{token_type} {access_token}"
                  value={editTransformResponse}
                  onChange={e => setEditTransformResponse(e.target.value)}
                  className="w-full px-2.5 py-2 border border-[#bdc3c7] rounded text-sm font-mono"
                />
                <p className="text-xs text-[#95a5a6] mt-1">
                  Path (e.g., &quot;access_token&quot;) or template
                  (e.g., &quot;{'{token_type} {access_token}'}&quot;).
                  If empty, uses entire response
                </p>
              </div>
            </>
          )}
          <div className="flex gap-2.5 justify-end">
            <button
              className="px-5 py-2.5 border-0 rounded cursor-pointer text-sm font-medium
                transition-all duration-200 bg-[#95a5a6] text-white hover:bg-[#7f8c8d]"
              onClick={handleCancel}
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
      )}

      {variables.length === 0 ? (
        <p className="text-[#95a5a6] text-sm">
          No variables defined yet. Variables allow you to reuse values across multiple headers.
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {variables.map(variable => (
            <div
              key={variable.id}
              className="flex items-center justify-between p-2.5 bg-[#ecf0f1] rounded"
            >
              <div className="flex-1">
                <code className="text-[#2c3e50] font-semibold">
                  {'${' + variable.name + '}'}
                </code>
                <span className="mx-2.5 text-[#7f8c8d]">=</span>
                <code className="text-[#27ae60]">{variable.value}</code>
                {variable.refreshConfig && (
                  <span className="ml-2.5 text-xs text-[#95a5a6]">(auto-refresh enabled)</span>
                )}
              </div>
              <div className="flex gap-2.5">
                {variable.refreshConfig && (
                  <button
                    className="px-2.5 py-1.5 border-0 rounded cursor-pointer text-xs font-medium
                      transition-all duration-200 bg-[#f39c12] text-white hover:bg-[#e67e22]
                      disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => handleRefresh(variable)}
                    disabled={refreshingId === variable.id}
                  >
                    {refreshingId === variable.id ? 'Refreshing...' : 'Refresh'}
                  </button>
                )}
                <button
                  className="px-2.5 py-1.5 border-0 rounded cursor-pointer text-xs font-medium
                    transition-all duration-200 bg-[#3498db] text-white hover:bg-[#2980b9]"
                  onClick={() => handleEdit(variable)}
                >
                  Edit
                </button>
                <button
                  data-testid="delete-variable-button"
                  className="px-2.5 py-1.5 border-0 rounded cursor-pointer text-xs font-medium
                    transition-all duration-200 bg-[#e74c3c] text-white hover:bg-[#c0392b]"
                  onClick={() => handleDelete(variable.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
