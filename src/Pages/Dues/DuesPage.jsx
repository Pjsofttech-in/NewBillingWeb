import {useMemo, useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {CalendarClock, Clock, HandCoins, Landmark, Search} from "lucide-react";

import {
  orderInstallmentApi,
  vendorBillInstallmentApi,
} from "../../api/installmentApi";
import InstallmentPlanModal from "../../Components/InstallmentPlanModal";
import Toast from "../../Components/Toast";
import StatCard from "../Dashboard/StatCard";
import {money} from "../Dashboard/dashboardUtils";

const TABS = [
  {id: "order", label: "Customers to collect from", api: orderInstallmentApi},
  {id: "vendor", label: "Vendors to pay", api: vendorBillInstallmentApi},
];

const DAY_OPTIONS = [7, 15, 30, 60, 90];

const STATUS_STYLE = {
  PARTIAL: "bg-amber-50 text-amber-700 border-amber-200",
  PENDING: "bg-slate-100 text-slate-700 border-slate-200",
  OVERDUE: "bg-red-50 text-red-700 border-red-200",
};

const messageOf = (e, fallback) =>
  e?.response?.data?.message || e?.message || fallback;

// Follow-up list of installments to collect from customers / to pay to vendors
// (GET /api/order-installments/due|summary and /api/vendor-bill-installments/due|summary).
export default function DuesPage() {
  const [tab, setTab] = useState("order");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [days, setDays] = useState(30);
  const [search, setSearch] = useState("");
  const [openRow, setOpenRow] = useState(null);
  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => setToast({message, type});

  const isOrder = tab === "order";
  const api = TABS.find((t) => t.id === tab).api;

  const summaryQuery = useQuery({
    queryKey: ["installmentDues", tab, "summary"],
    queryFn: api.fetchSummary,
  });

  const dueQuery = useQuery({
    queryKey: ["installmentDues", tab, "list", {overdueOnly, days}],
    queryFn: () => api.fetchDue({overdueOnly, days}),
  });

  const summary = summaryQuery.data;
  const rows = useMemo(() => {
    const list = dueQuery.data || [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((r) =>
      [r.partyName, r.partyPhone, r.referenceLabel].some((f) =>
        String(f || "").toLowerCase().includes(q),
      ),
    );
  }, [dueQuery.data, search]);

  const listedTotal = rows.reduce((sum, r) => sum + Number(r.pendingAmount || 0), 0);

  return (
    <div className="w-full space-y-3 px-1 py-1 sm:px-2">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      <div>
        <h2 className="text-lg font-bold text-slate-800">Installment Dues</h2>
        <p className="text-xs text-slate-500">
          Follow up on installments customers still owe you and installments you still owe vendors.
        </p>
      </div>

      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTab(t.id);
              setSearch("");
            }}
            className={`cursor-pointer rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
              tab === t.id
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
        <StatCard
          tone="amber"
          icon={isOrder ? HandCoins : Landmark}
          label={`Total pending (${summary?.openInstallments ?? 0} open)`}
          value={money(summary?.totalPending)}
          loading={summaryQuery.isLoading}
        />
        <StatCard
          tone="rose"
          icon={Clock}
          label={`Overdue (${summary?.overdueInstallments ?? 0})`}
          value={money(summary?.overdueAmount)}
          loading={summaryQuery.isLoading}
        />
        <StatCard
          tone="blue"
          icon={CalendarClock}
          label="Due today"
          value={money(summary?.dueToday)}
          loading={summaryQuery.isLoading}
        />
        <StatCard
          tone="indigo"
          icon={CalendarClock}
          label="Due in next 7 days"
          value={money(summary?.dueNext7Days)}
          loading={summaryQuery.isLoading}
        />
        <StatCard
          tone="slate"
          icon={HandCoins}
          label="Listed below"
          value={money(listedTotal)}
          loading={dueQuery.isLoading}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isOrder ? "Search customer / order" : "Search vendor / bill"}
            className="h-9 w-56 rounded-lg border border-slate-300 bg-white pl-8 pr-3 text-sm outline-none focus:border-blue-500"
          />
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={overdueOnly}
            onChange={(e) => setOverdueOnly(e.target.checked)}
            className="h-4 w-4"
          />
          Overdue only
        </label>

        {!overdueOnly && (
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            Due within
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-sm"
            >
              {DAY_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  {d} days
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        {dueQuery.isLoading ? (
          <p className="p-8 text-center text-sm text-slate-500">Loading dues...</p>
        ) : dueQuery.isError ? (
          <div className="p-8 text-center">
            <p className="mb-2 text-sm font-semibold text-red-600">
              {messageOf(dueQuery.error, "Unable to load dues.")}
            </p>
            <button
              type="button"
              onClick={() => dueQuery.refetch()}
              className="cursor-pointer text-sm font-semibold text-blue-600"
            >
              Retry
            </button>
          </div>
        ) : rows.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">
            {overdueOnly ? "Nothing is overdue." : "No installments due in this period."}
          </p>
        ) : (
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-600">
              <tr>
                <th className="p-2.5 text-left">{isOrder ? "Order" : "Bill"}</th>
                <th className="p-2.5 text-left">{isOrder ? "Customer" : "Vendor"}</th>
                <th className="p-2.5 text-left">Phone</th>
                <th className="p-2.5 text-center">Inst. #</th>
                <th className="p-2.5 text-left">Due date</th>
                <th className="p-2.5 text-right">Due</th>
                <th className="p-2.5 text-right">Paid</th>
                <th className="p-2.5 text-right">Pending</th>
                <th className="p-2.5 text-center">Status</th>
                <th className="p-2.5 text-right" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => {
                const status = r.overdue ? "OVERDUE" : r.status;
                return (
                  <tr key={r.installmentId} className="hover:bg-slate-50">
                    <td className="p-2.5 font-semibold">{r.referenceLabel}</td>
                    <td className="p-2.5">{r.partyName || "-"}</td>
                    <td className="p-2.5 text-slate-600">{r.partyPhone || "-"}</td>
                    <td className="p-2.5 text-center">{r.installmentNumber}</td>
                    <td className="p-2.5 whitespace-nowrap">
                      {r.dueDate}
                      {r.overdue && (
                        <span className="ml-1 text-xs font-semibold text-red-600">
                          ({r.daysOverdue}d late)
                        </span>
                      )}
                    </td>
                    <td className="p-2.5 text-right">{money(r.dueAmount)}</td>
                    <td className="p-2.5 text-right text-emerald-700">{money(r.paidAmount)}</td>
                    <td className="p-2.5 text-right font-bold text-amber-700">{money(r.pendingAmount)}</td>
                    <td className="p-2.5 text-center">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${
                          STATUS_STYLE[status] || STATUS_STYLE.PENDING
                        }`}
                      >
                        {status}
                      </span>
                    </td>
                    <td className="p-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => setOpenRow(r)}
                        className="cursor-pointer rounded-lg bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700"
                      >
                        {isOrder ? "Collect" : "Pay"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {openRow && (
        <InstallmentPlanModal
          kind={tab}
          referenceId={openRow.referenceId}
          title={`${openRow.referenceLabel} · ${openRow.partyName || ""}`}
          onClose={() => setOpenRow(null)}
          showToast={showToast}
        />
      )}
    </div>
  );
}
