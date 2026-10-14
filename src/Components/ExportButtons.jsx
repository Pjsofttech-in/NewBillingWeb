import {useState} from "react";
import {FileSpreadsheet, FileText, Loader2} from "lucide-react";

const SIZES = {
  md: "h-9 px-3 text-sm",
  sm: "h-8 px-2.5 text-xs",
};

/**
 * Reusable "Download PDF / CSV" button pair.
 *
 * `onExport(format)` must start the download and return a promise; `format` is "pdf" or "csv".
 * Errors are reported through `onError(message)` (e.g. a toast).
 * `filtered` only changes the tooltip so the user knows the file follows the active filters.
 */
const ExportButtons = ({
  onExport,
  onError,
  disabled = false,
  disabledReason = "Nothing to download",
  filtered = false,
  itemName = "data",
  size = "md",
  className = "",
}) => {
  const [busy, setBusy] = useState(null); // "pdf" | "csv" | null

  const run = async (format) => {
    if (busy || disabled) return;

    setBusy(format);
    try {
      await onExport(format);
    } catch (error) {
      onError?.(error?.message || "Download failed");
    } finally {
      setBusy(null);
    }
  };

  const buttons = [
    {
      format: "pdf",
      label: "PDF",
      Icon: FileText,
      tone: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
    },
    {
      format: "csv",
      label: "CSV",
      Icon: FileSpreadsheet,
      tone: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
    },
  ];

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {buttons.map(({format, label, Icon, tone}) => {
        const isBusy = busy === format;
        const title = disabled
          ? disabledReason
          : `Download ${filtered ? "filtered " : ""}${itemName} as ${label}`;

        return (
          <button
            key={format}
            type="button"
            onClick={() => run(format)}
            disabled={disabled || Boolean(busy)}
            title={title}
            aria-label={title}
            className={`inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border font-medium shadow-xs transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-45 ${
              SIZES[size] || SIZES.md
            } ${tone}`}
          >
            {isBusy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Icon className="h-4 w-4" />
            )}
            {label}
          </button>
        );
      })}
    </div>
  );
};

export default ExportButtons;
