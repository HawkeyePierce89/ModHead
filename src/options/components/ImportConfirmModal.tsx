import type { ExportedSettings } from '../../types';

interface ImportConfirmModalProps {
  importedData: ExportedSettings;
  onMerge: () => void;
  onReplace: () => void;
  onCancel: () => void;
}

export function ImportConfirmModal({
  importedData,
  onMerge,
  onReplace,
  onCancel,
}: ImportConfirmModalProps) {
  const { settings } = importedData;
  const ruleCount = settings.rules.length;
  const variableCount = settings.variables.length;
  const sensitiveVarsWithEmptyValue = settings.variables.filter(
    v => v.isSensitive && !v.value
  ).length;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Import Settings</h2>

        <div className="mb-5">
          <p className="text-[#2c3e50] dark:text-[#e4e4e4] mb-2.5">
            The file contains:
          </p>
          <ul className="ml-5 list-disc text-[#7f8c8d] dark:text-[#b0b0b0]">
            <li>{ruleCount} rule{ruleCount !== 1 ? 's' : ''}</li>
            <li>{variableCount} variable{variableCount !== 1 ? 's' : ''}</li>
          </ul>
        </div>

        {sensitiveVarsWithEmptyValue > 0 && (
          <div className="mb-5 px-4 py-3 bg-[#fff3cd] dark:bg-[#5a4a1a] border-l-4 border-[#f39c12] rounded">
            <p className="text-sm text-[#856404] dark:text-[#ffc107]">
              <strong>Note:</strong> Sensitive variable values are not exported for security.
              You will need to fill in values for {sensitiveVarsWithEmptyValue}
              {' '}variable{sensitiveVarsWithEmptyValue !== 1 ? 's' : ''}.
            </p>
          </div>
        )}

        <div className="mb-5 text-sm text-[#7f8c8d] dark:text-[#b0b0b0]">
          <p className="mb-2">
            <strong className="text-[#2c3e50] dark:text-[#e4e4e4]">Merge:</strong>
            {' '}Add new items while keeping existing settings.
          </p>
          <p>
            <strong className="text-[#2c3e50] dark:text-[#e4e4e4]">Replace:</strong>
            {' '}Remove all existing settings and use imported ones.
          </p>
        </div>

        <div className="modal-actions">
          <button
            className="btn btn-secondary"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={onMerge}
            data-testid="import-merge-button"
          >
            Merge
          </button>
          <button
            className="btn btn-danger"
            onClick={onReplace}
            data-testid="import-replace-button"
          >
            Replace All
          </button>
        </div>
      </div>
    </div>
  );
}
