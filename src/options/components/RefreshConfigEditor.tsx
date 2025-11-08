interface RefreshConfigEditorProps {
  refreshUrl: string;
  onRefreshUrlChange: (url: string) => void;
  refreshMethod: string;
  onRefreshMethodChange: (method: string) => void;
  refreshHeaders: Array<{ key: string; value: string }>;
  onRefreshHeadersChange: (headers: Array<{ key: string; value: string }>) => void;
  refreshBody: string;
  onRefreshBodyChange: (body: string) => void;
  transformResponse: string;
  onTransformResponseChange: (transform: string) => void;
}

export function RefreshConfigEditor({
  refreshUrl,
  onRefreshUrlChange,
  refreshMethod,
  onRefreshMethodChange,
  refreshHeaders,
  onRefreshHeadersChange,
  refreshBody,
  onRefreshBodyChange,
  transformResponse,
  onTransformResponseChange,
}: RefreshConfigEditorProps) {
  const handleAddHeader = () => {
    onRefreshHeadersChange([...refreshHeaders, { key: '', value: '' }]);
  };

  const handleRemoveHeader = (index: number) => {
    const newHeaders = refreshHeaders.filter((_, i) => i !== index);
    onRefreshHeadersChange(newHeaders);
  };

  const handleHeaderKeyChange = (index: number, key: string) => {
    const newHeaders = [...refreshHeaders];
    newHeaders[index].key = key;
    onRefreshHeadersChange(newHeaders);
  };

  const handleHeaderValueChange = (index: number, value: string) => {
    const newHeaders = [...refreshHeaders];
    newHeaders[index].value = value;
    onRefreshHeadersChange(newHeaders);
  };

  return (
    <>
      <div className="mb-2.5">
        <label className="block text-sm text-[#7f8c8d] dark:text-[#b0b0b0] mb-1">
          Auto-refresh URL (optional):
        </label>
        <input
          data-testid="refresh-url-input"
          type="text"
          placeholder="https://example.com/auth/token"
          value={refreshUrl}
          onChange={e => onRefreshUrlChange(e.target.value)}
          className="w-full px-2.5 py-2 border border-[#bdc3c7] rounded text-sm
            dark:border-[#404040] dark:bg-[#2d2d2d] dark:text-[#e4e4e4]"
        />
        <p className="text-xs text-[#95a5a6] dark:text-[#888] mt-1">
          URL to fetch new token. You can use variables with {'${variableName}'} syntax
        </p>
      </div>

      {refreshUrl.trim() && (
        <>
          <div className="mb-2.5">
            <label className="block text-sm text-[#7f8c8d] dark:text-[#b0b0b0] mb-1">
              HTTP Method:
            </label>
            <select
              data-testid="refresh-method-select"
              value={refreshMethod}
              onChange={e => onRefreshMethodChange(e.target.value)}
              className="w-full px-2.5 py-2 border border-[#bdc3c7] rounded text-sm
                dark:border-[#404040] dark:bg-[#2d2d2d] dark:text-[#e4e4e4]"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>

          <div className="mb-2.5">
            <label className="block text-sm text-[#7f8c8d] dark:text-[#b0b0b0] mb-2">
              Headers (optional):
            </label>
            {refreshHeaders.map((header, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Header name"
                  value={header.key}
                  onChange={e => handleHeaderKeyChange(index, e.target.value)}
                  className="flex-1 px-2.5 py-1.5 border border-[#bdc3c7] rounded text-sm
                    dark:border-[#404040] dark:bg-[#2d2d2d] dark:text-[#e4e4e4]"
                />
                <input
                  type="text"
                  placeholder="Header value (can use ${variables})"
                  value={header.value}
                  onChange={e => handleHeaderValueChange(index, e.target.value)}
                  className="flex-[2] px-2.5 py-1.5 border border-[#bdc3c7] rounded text-sm
                    dark:border-[#404040] dark:bg-[#2d2d2d] dark:text-[#e4e4e4]"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveHeader(index)}
                  className="px-2.5 py-1.5 border-0 rounded cursor-pointer text-xs
                    bg-[#e74c3c] text-white hover:bg-[#c0392b]"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddHeader}
              className="px-3 py-1.5 border-0 rounded cursor-pointer text-xs
                bg-[#3498db] text-white hover:bg-[#2980b9]"
            >
              + Add Header
            </button>
          </div>

          <div className="mb-2.5">
            <label className="block text-sm text-[#7f8c8d] dark:text-[#b0b0b0] mb-1">
              Request Body (JSON, optional):
            </label>
            <textarea
              data-testid="refresh-body-textarea"
              placeholder={'{\n  "username": "${username}",\n  "password": "${password}"\n}'}
              value={refreshBody}
              onChange={e => onRefreshBodyChange(e.target.value)}
              className="w-full px-2.5 py-2 border border-[#bdc3c7] rounded text-sm font-mono min-h-[80px]
                dark:border-[#404040] dark:bg-[#2d2d2d] dark:text-[#e4e4e4]"
            />
            <p className="text-xs text-[#95a5a6] dark:text-[#888] mt-1">
              JSON object. Use variables with {'${variableName}'} syntax
            </p>
          </div>

          <div className="mb-2.5">
            <label className="block text-sm text-[#7f8c8d] dark:text-[#b0b0b0] mb-1">
              Transform Response (optional):
            </label>
            <input
              data-testid="transform-response-input"
              type="text"
              placeholder="{token_type} {access_token}"
              value={transformResponse}
              onChange={e => onTransformResponseChange(e.target.value)}
              className="w-full px-2.5 py-2 border border-[#bdc3c7] rounded text-sm font-mono
                dark:border-[#404040] dark:bg-[#2d2d2d] dark:text-[#e4e4e4]"
            />
            <p className="text-xs text-[#95a5a6] dark:text-[#888] mt-1">
              Path (e.g., &quot;access_token&quot;) or template
              (e.g., &quot;{'{token_type} {access_token}'}&quot;).
              If empty, uses entire response
            </p>
          </div>
        </>
      )}
    </>
  );
}
