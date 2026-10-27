import {useMemo, useState} from "react";
import {useNavigate} from "react-router-dom";
import {useQuery} from "@tanstack/react-query";
import {ArrowLeft, Eye, RefreshCw, Search} from "lucide-react";
import {fetchVendorBills} from "../../api/vendorServiceApi";
import {vendorBillInstallmentApi} from "../../api/installmentApi";
import Pagination from "../../Components/Pagination";
import {usePagination} from "../../hooks/usePagination";
import VendorBillDetailModal, {money} from "./VendorBillDetailModal";
import Toast from "../../Components/Toast";
import InstallmentPlanModal from "../../Components/InstallmentPlanModal";
import VendorBillStatusBadge, {
  VENDOR_BILL_STATUS_FILTERS,
  getVendorBillPaymentDisplay,
} from "../../Components/VendorBillStatusBadge";

const SummaryCard = ({label, value, tone = "blue"}) => {
  // Pre-configured color schemes based on the tone prop
  const toneStyles = {
    blue: "border-blue-200 bg-blue-50/50 text-blue-700",
    green: "border-emerald-200 bg-emerald-50/50 text-emerald-700",
    red: "border-rose-200 bg-rose-50/50 text-rose-700",
    amber: "border-amber-200 bg-amber-50/50 text-amber-700",
    purple: "border-purple-200 bg-purple-50/50 text-purple-700",
    slate: "border-slate-200 bg-slate-50/50 text-slate-700",
  };

  const activeStyle = toneStyles[tone] || toneStyles.blue;

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-0.5 sm:gap-2 rounded-lg border px-3 py-2 shadow-sm text-xs w-full overflow-hidden ${activeStyle}`}
    >
      <span className="font-semibold text-slate-600 uppercase tracking-wide truncate">
        {label}:
      </span>
      <span className="font-bold truncate">{value}</span>
    </div>
  );
};

// Each vendor bill (one per stock purchase) is its own row.
const VendorBillPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [selectedBill, setSelectedBill] = useState(null);
  const [planBill, setPlanBill] = useState(null); // "Installment" badge -> plan window
  const [toast, setToast] = useState(null);

  const {
    data: bills = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["vendorBills", "list"],
    queryFn: fetchVendorBills,
  });

  // Open installments of every bill -> "next installment due date" column.
  const {data: dueInstallments = []} = useQuery({
    queryKey: ["vendorBills", "dueInstallments"],
    queryFn: () => vendorBillInstallmentApi.fetchDue({days: 3650}),
  });

  const nextDueByBill = useMemo(() => {
    const map = new Map();
    for (const inst of dueInstallments) {
      const current = map.get(inst.referenceId);
      if (!current || inst.dueDate < current.dueDate)
        map.set(inst.referenceId, inst);
    }
    return map;
  }, [dueInstallments]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bills.filter((b) => {
      if (
        status !== "ALL" &&
        getVendorBillPaymentDisplay(b, nextDueByBill.has(b.id)).key !== status
      )
        return false;
      if (!q) return true;
      return [b.billNumber, b.vendor?.vendorName, b.vendor?.companyName].some(
        (f) => (f || "").toLowerCase().includes(q),
      );
    });
  }, [bills, search, status, nextDueByBill]);

  // back to page 1 whenever the search or the status filter changes
  const pagination = usePagination(filtered, 25, `${search}|${status}`);
  const paginatedBills = pagination.paginatedItems || filtered;

  const totals = useMemo(
    () =>
      filtered.reduce(
        (acc, b) => ({
          total: acc.total + Number(b.totalAmount || 0),
          paid: acc.paid + Number(b.paidAmount || 0),
          remaining: acc.remaining + Number(b.dueAmount || 0),
        }),
        {total: 0, paid: 0, remaining: 0},
      ),
    [filtered],
  );

  const errorMessage =
    error?.response?.data?.message ||
    error?.message ||
    "Unable to load vendor bills.";

  return (
    <div className="w-full space-y-3 px-1 py-1 sm:px-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate("/add")}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white hover:bg-slate-50"
            title="Back to products"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Vendor Bills</h2>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search bill or vendor..."
              className="h-9 w-48 rounded-lg border border-slate-300 bg-white pl-8 pr-2 text-sm outline-none focus:border-blue-500 sm:w-64"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-sm"
            aria-label="Filter by status"
          >
            {VENDOR_BILL_STATUS_FILTERS.map((s) => (
              <option
                key={s.value}
                value={s.value}
              >
                {s.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => refetch()}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw
              size={14}
              className={isFetching ? "animate-spin" : ""}
            />{" "}
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        <SummaryCard
          label="Bills"
          value={filtered.length}
          tone="slate"
        />
        <SummaryCard
          label="Total to pay"
          value={money(totals.total)}
          tone="blue"
        />
        <SummaryCard
          label="Paid"
          value={money(totals.paid)}
          tone="green"
        />
        <SummaryCard
          label="Remaining"
          value={money(totals.remaining)}
          tone="red"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {isLoading ? (
          <p className="p-10 text-center text-sm">Loading vendor bills...</p>
        ) : isError ? (
          <div className="p-10 text-center">
            <p className="mb-2 font-semibold text-red-600">
              Failed to load vendor bills
            </p>
            <p className="mb-4 text-xs text-slate-500">{errorMessage}</p>
            <button
              onClick={() => refetch()}
              className="text-sm font-semibold text-blue-600"
            >
              Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <p className="p-10 text-center text-sm text-slate-500">
            {bills.length === 0
              ? "No vendor bills found."
              : "No bill matches your filters."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-xs">
              <thead className="text-[11px] uppercase tracking-wider font-bold bg-blue-400 text-white">
                <tr>
                  <th className="px-2 py-2 text-left">Sr. No.</th>
                  <th className="px-2 py-2 text-left">Bill No.</th>
                  <th className="px-2 py-2 text-left">Vendor</th>
                  <th className="px-2 py-2 text-left">Bill date</th>
                  <th className="px-2 py-2 text-right">Total</th>
                  <th className="px-2 py-2 text-right">Paid</th>
                  <th className="px-2 py-2 text-right">Remaining</th>
                  <th className="px-2 py-2 text-left">Status</th>
                  <th className="px-2 py-2 text-left">Next installment due</th>
                  <th className="px-2 py-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedBills.map((b, index) => {
                  const serialNumber =
                    (pagination.currentPage - 1) * pagination.itemsPerPage +
                    index +
                    1;
                  const next = nextDueByBill.get(b.id);
                  return (
                    <tr
                      key={b.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-2 py-1.5 font-medium text-slate-600">
                        {serialNumber}
                      </td>
                      <td className="px-2 py-1.5 font-semibold text-slate-800">
                        {b.billNumber}
                      </td>
                      <td className="px-2 py-1.5">
                        <p className="font-medium text-slate-800 leading-tight">
                          {b.vendor?.vendorName}
                        </p>
                        {b.vendor?.companyName && (
                          <p className="text-[10px] text-slate-500 leading-tight">
                            {b.vendor.companyName}
                          </p>
                        )}
                      </td>
                      <td className="px-2 py-1.5 text-[11px] text-slate-600">
                        {b.billDate || "-"}
                      </td>
                      <td className="px-2 py-1.5 text-right font-semibold text-slate-800">
                        {money(b.totalAmount)}
                      </td>
                      <td className="px-2 py-1.5 text-right font-semibold text-emerald-700">
                        {money(b.paidAmount)}
                      </td>
                      <td className="px-2 py-1.5 text-right font-semibold text-rose-700">
                        {money(b.dueAmount)}
                      </td>
                      <td className="px-2 py-1.5">
                        <VendorBillStatusBadge
                          bill={b}
                          hasPlan={nextDueByBill.has(b.id)}
                          onOpen={setPlanBill}
                        />
                      </td>
                      <td className="px-2 py-1.5 text-[11px]">
                        {next ? (
                          <>
                            <p
                              className={`font-semibold leading-tight ${
                                next.overdue
                                  ? "text-rose-700"
                                  : "text-slate-800"
                              }`}
                            >
                              {next.dueDate}
                              {next.overdue ? " (overdue)" : ""}
                            </p>
                            <p className="text-[10px] text-slate-500 leading-tight">
                              #{next.installmentNumber} •{" "}
                              {money(next.pendingAmount)}
                            </p>
                          </>
                        ) : Number(b.dueAmount) > 0 && b.dueDate ? (
                          <p className="text-slate-600">Bill due {b.dueDate}</p>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedBill(b)}
                          className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-blue-700 transition-colors"
                        >
                          <Eye size={12} /> View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="px-1 py-0.5">
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          itemsPerPage={pagination.itemsPerPage}
          onPageChange={pagination.setCurrentPage}
          onItemsPerPageChange={pagination.setItemsPerPage}
        />
      </div>

      {planBill && (
        <InstallmentPlanModal
          kind="vendor"
          referenceId={planBill.id}
          title={planBill.billNumber || `Bill #${planBill.id}`}
          summary={{
            total: planBill.totalAmount,
            paid: planBill.paidAmount,
            pending: planBill.dueAmount,
          }}
          showToast={(message, type = "success") => setToast({message, type})}
          onClose={() => setPlanBill(null)}
          onChanged={() => refetch()}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {selectedBill && (
        <VendorBillDetailModal
          bill={selectedBill}
          onClose={() => setSelectedBill(null)}
        />
      )}
    </div>
  );
};

export default VendorBillPage;
