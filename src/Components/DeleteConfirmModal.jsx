import ConfirmModal from "./ConfirmModal";


/**
 * Delete confirmation - a thin wrapper over the generic ConfirmModal.
 * Same props as before, so every existing screen keeps working unchanged.
 *
 * @param {boolean} isOpen - Controls modal visibility
 * @param {string} title - Header title (default: "Confirm Delete")
 * @param {string} itemName - Name of the item being deleted
 * @param {string} message - Custom message (optional: overrides default text)
 * @param {function} onConfirm - Function triggered on confirmation
 * @param {function} onCancel - Function triggered on cancellation
 * @param {boolean} isLoading - Indicates whether action is in progress
 * @param {string} confirmText - Label for confirm button (default: "Yes, Delete")
 * @param {string} cancelText - Label for cancel button (default: "Cancel")
 */
const TrashIcon = (
  <svg
    className="h-6 w-6"
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
);

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
}) => (
  <ConfirmModal
    isOpen={isOpen}
    title={title}
    subtitle="This action cannot be undone."
    icon={TrashIcon}
    tone="danger"
    message={
      message ? (
        message
      ) : (
        <>
          Are you sure you want to delete{" "}
          {itemName ? (
            <span className="font-semibold text-slate-900">"{itemName}"</span>
          ) : (
            "this item"
          )}
          ?
        </>
      )
    }
    onConfirm={onConfirm}
    onCancel={onCancel}
    isLoading={isLoading}
    confirmText={confirmText}
    cancelText={cancelText}
    loadingText="Deleting..."
  />
);

export default DeleteConfirmModal;
