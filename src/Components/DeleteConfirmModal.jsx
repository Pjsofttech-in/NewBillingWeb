/**
 * Reusable Confirmation / Delete Modal
 *
 * @param {boolean} isOpen - Controls modal visibility
 * @param {string} title - Header title (default: "Confirm Delete")
 * @param {string} itemName - Name of the item being deleted/acted upon
 * @param {string} message - Custom message (optional: overrides default text)
 * @param {function} onConfirm - Function triggered on confirmation
 * @param {function} onCancel - Function triggered on cancellation
 * @param {boolean} isLoading - Indicates whether action is in progress
 * @param {string} confirmText - Label for confirm button (default: "Yes, Delete")
 * @param {string} cancelText - Label for cancel button (default: "Cancel")
 */
const DeleteConfirmModal = ({
  isOpen,
  title = "Confirm Delete",
  itemName,
  message,
  onConfirm,
  onCancel,
  isLoading = false,
  confirmText = "Yes, Delete",
  cancelText = "Cancel",
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 border border-slate-100 transform transition-all">
        {/* Header with Warning Icon */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-100 text-red-600 rounded-full shrink-0">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500">
              This action cannot be undone.
            </p>
          </div>
        </div>

        {/* Modal Body */}
        <p className="text-sm text-slate-600">
          {message ? (
            message
          ) : (
            <>
              Are you sure you want to delete{" "}
              {itemName ? (
                <span className="font-semibold text-slate-900">
                  "{itemName}"
                </span>
              ) : (
                "this item"
              )}
              ?
            </>
          )}
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition disabled:opacity-50 cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition flex items-center gap-2 disabled:opacity-50 shadow-sm cursor-pointer"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin h-3.5 w-3.5 text-white"
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
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Deleting...
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

export default DeleteConfirmModal;
