type Props = {
    open: boolean;
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isBusy?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
  };

  export default function ConfirmDialog({
    open,
    title = "Confirm",
    message,
    confirmText = "Delete",
    cancelText = "Cancel",
    isBusy,
    onConfirm,
    onCancel,
  }: Props) {
    if (!open) return null;

    return (
      <div className="modal-backdrop" role="dialog" aria-modal="true">
        <div className="modal">
          <h3 className="modal-title">{title}</h3>
          <p className="modal-msg">{message}</p>

          <div className="modal-actions">
            <button type="button" className="btn btn--outline" onClick={onCancel} disabled={isBusy}>
              {cancelText}
            </button>
            <button type="button" className="btn btn--primary" onClick={onConfirm} disabled={isBusy}>
              {isBusy ? "Deleting..." : confirmText}
            </button>
          </div>
        </div>
      </div>
    );
  }
 