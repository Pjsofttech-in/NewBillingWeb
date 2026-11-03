/**
 * Reusable Yes / No confirmation modal (refund, cancel, remove, delete ...).
 *
 * @param {boolean}  isOpen       - Controls modal visibility
 * @param {string}   title        - Header title (default: "Are you sure?")
 * @param {string}   subtitle     - Small line under the title (optional)
 * @param {node}     message      - Body text / question
 * @param {node}     icon         - Icon shown in the header circle (optional)
 * @param {string}   tone         - "danger" (red, default) | "primary" (blue) | "warning" (amber)
 * @param {function} onConfirm    - Called on the confirm button
 * @param {function} onCancel     - Called on the cancel button
 * @param {boolean}  isLoading    - Action in progress (disables both buttons)
 * @param {string}   confirmText  - Confirm button label (default: "Yes")
 * @param {string}   cancelText   - Cancel button label (default: "No")
 * @param {string}   loadingText  - Confirm label while loading (default: "Please wait...")
 */
const TONES = {
  danger: {
    iconBox: "bg-red-100 text-red-600",
    btn: "bg-red-600 hover:bg-red-700",
  },
  primary: {
    iconBox: "bg-blue-100 text-blue-600",
    btn: "bg-blue-700 hover:bg-blue-800",
  },
  warning: {
    iconBox: "bg-amber-100 text-amber-600",
    btn: "bg-amber-600 hover:bg-amber-700",
  },
};

const ConfirmModal = ({
  isOpen,
  title = "Are you sure?",
  subtitle,
  message,
  icon,
  tone = "danger",
  onConfirm,
  onCancel,
  isLoading = false,
  confirmText = "Yes",
  cancelText = "No",
  loadingText = "Please wait...",
}) => {
  if (!isOpen) return null;
  const t = TONES[tone] || TONES.danger;

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="w-full max-w-md space-y-4 rounded-xl border border-slate-100 bg-white p-6 shadow-xl">
        <div className="flex items-center gap-3">
          {icon && (
            <div className={`shrink-0 rounded-full p-3 ${t.iconBox}`}>
              {icon}
            </div>
          )}
          <div>
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
        </div>

        {message && (
          <div className="whitespace-pre-line text-sm text-slate-600">
            {message}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="cursor-pointer rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold text-white shadow-sm transition disabled:opacity-50 ${t.btn}`}
          >
            {isLoading ? (
              <>
                <svg
                  className="h-3.5 w-3.5 animate-spin text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                {loadingText}
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
