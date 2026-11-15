import { useEffect } from "react";
import { Trash2 } from "lucide-react";

interface DeleteConfirmationProps {
  open: boolean;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function DeleteConfirmation({
  open,
  busy = false,
  onCancel,
  onConfirm,
}: DeleteConfirmationProps) {
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel, open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-950/20 p-4 backdrop-blur-[2px]"
      role="presentation"
      onClick={onCancel}
    >
      <div
        className="flex w-[370px] max-w-full flex-col items-center rounded-xl border border-gray-200 bg-white px-5 py-6 shadow-md md:w-[460px]"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-confirmation-title"
        aria-describedby="delete-confirmation-description"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-center rounded-full bg-red-100 p-4">
          <Trash2 className="h-6 w-6 text-red-600" strokeWidth={1.8} />
        </div>
        <h2 id="delete-confirmation-title" className="mt-4 text-xl font-semibold text-gray-900">
          Are you sure?
        </h2>
        <p id="delete-confirmation-description" className="mt-2 text-center text-sm text-gray-600">
          Do you really want to continue? This action
          <br />
          cannot be undone.
        </p>
        <div className="mt-5 flex w-full items-center justify-center gap-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="h-10 w-full rounded-md border border-gray-300 bg-white font-medium text-gray-600 transition hover:bg-gray-100 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 md:w-36"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="h-10 w-full rounded-md bg-red-600 font-medium text-sm text-white transition hover:bg-red-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 md:w-36"
          >
            {busy ? "Deleting..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
