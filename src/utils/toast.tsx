import toast from 'react-hot-toast';

/**
 * Show a success toast notification
 */
export function showSuccess(message: string): void {
  toast.success(message, {
    duration: 3000,
  });
}

/**
 * Show an error toast notification
 */
export function showError(message: string): void {
  toast.error(message, {
    duration: 4000,
  });
}

/**
 * Show a confirmation toast with action buttons
 * Returns a promise that resolves with true if confirmed, false if cancelled
 */
export function showConfirm(
  message: string,
  onConfirm: () => void | Promise<void>
): void {
  toast(
    (t) => (
      <div className="flex flex-col gap-3">
        <span className="text-sm">{message}</span>
        <div className="flex gap-2 justify-end">
          <button
            className="px-3 py-1.5 text-xs rounded bg-[#95a5a6] text-white hover:bg-[#7f8c8d] transition-colors"
            onClick={() => toast.dismiss(t.id)}
          >
            Cancel
          </button>
          <button
            className="px-3 py-1.5 text-xs rounded bg-[#e74c3c] text-white hover:bg-[#c0392b] transition-colors"
            onClick={async () => {
              toast.dismiss(t.id);
              await onConfirm();
            }}
          >
            Delete
          </button>
        </div>
      </div>
    ),
    {
      duration: Infinity,
      className: '!bg-white !text-[#2c3e50]',
    }
  );
}
