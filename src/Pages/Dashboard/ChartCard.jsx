// Card wrapper for every chart. Handles the loading / empty states so
// each chart only has to render its own data.
export default function ChartCard({
  title,
  subtitle,
  actions,
  loading = false,
  error = null, // error message when the request failed
  isEmpty = false,
  emptyText = "No data available.",
  heightClass = "h-72",
  children,
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-800">{title}</h2>
          {subtitle && <p className="text-[11px] text-slate-400">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>

      <div className={`${heightClass} w-full`}>
        {loading ? (
          <div className="flex h-full items-center justify-center text-xs text-slate-400">
            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
            Loading chart...
          </div>
        ) : error ? (
          <div className="flex h-full flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-red-200 bg-red-50/50 px-4 text-center text-xs text-red-600">
            <span className="font-semibold">Could not load data</span>
            <span className="text-red-500">{error}</span>
          </div>
        ) : isEmpty ? (
          <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-slate-200 text-xs text-slate-400">
            {emptyText}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
