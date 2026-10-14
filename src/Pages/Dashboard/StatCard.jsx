import {getTone} from "./dashboardUtils";

// Single metric (orders today, stock, ...)
export default function StatCard({
  label,
  value,
  icon: Icon,
  tone = "slate",
  loading = false,
}) {
  const t = getTone(tone);

  return (
    <div
      className={`flex items-center justify-between rounded-xl border p-3.5 shadow-xs ${t.box}`}
    >
      <div>
        <p className="text-xs font-medium text-slate-800">{label}</p>
        <p className="mt-1 text-base font-bold text-slate-700">
          {loading ? "..." : value}
        </p>
      </div>
      {Icon && (
        <div className={`rounded-lg p-2 ${t.icon}`}>
          <Icon className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}