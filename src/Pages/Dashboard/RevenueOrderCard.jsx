import {getTone, money} from "./dashboardUtils";

// Revenue + order count for one time period
export default function RevenueOrderCard({
  label,
  revenue,
  orders,
  pending,
  icon: Icon,
  tone = "blue",
  loading = false,
}) {
  const t = getTone(tone);

  return (
    <div
      className={`flex flex-col justify-between rounded-xl border p-3 shadow-xs ${t.box}`}
    >
      <div className="flex items-center justify-between gap-2 border-b-amber border-slate-200/60 pb-2">
        <span className="text-xs font-semibold text-slate-600">{label}</span>
        {Icon && (
          <div className={`rounded-lg p-1.5 ${t.icon}`}>
            <Icon className="h-3.5 w-3.5" />
          </div>
        )}
      </div>

      <div className="mt-2.5 space-y-1.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-medium text-slate-800">Revenue</span>
          <span className="font-semibold text-slate-700">
            {loading ? "..." : money(revenue)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-medium text-slate-800">Orders</span>
          <span className="font-semibold text-slate-700">
            {loading ? "..." : (orders ?? 0)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-medium text-slate-800">Pending</span>
          <span className="font-semibold text-amber-700">
            {loading || pending == null ? "..." : money(pending)}
          </span>
        </div>
      </div>
    </div>
  );
}
