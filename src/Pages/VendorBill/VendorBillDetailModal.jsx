import {useState} from "react";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {CalendarClock, CheckCircle2, HandCoins, X} from "lucide-react";
import {
  addVendorBillPayment,
  fetchVendorBillDetail,
  markVendorBillPaymentDone,
} from "../../api/vendorServiceApi";
import {vendorBillInstallmentApi} from "../../api/installmentApi";
import InstallmentPlanModal from "../../Components/InstallmentPlanModal";
import Toast from "../../Components/Toast";
import VendorBillStatusBadge from "../../Components/VendorBillStatusBadge";
import {money} from "../../utils/format";
export {money};


// Kept so older imports of StatusBadge keep working; it uses the shared Complete / Installment logic.
export const StatusBadge = ({bill, status, hasPlan}) => (
  <VendorBillStatusBadge
    bill={bill || {paymentStatus: status}}
    hasPlan={hasPlan}
  />
);

const Stat = ({label, value, tone}) => (
  <div className="rounded-xl border border-slate-200 bg-white p-3">
    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
      {label}
    </p>
    <p className={`mt-1 text-lg font-bold ${tone}`}>{value}</p>
  </div>
);

const Installments = ({installments = []}) => {
  if (!installments.length) {
    return (
      <p className="py-3 text-xs text-slate-500">No payment recorded yet.</p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-xs">
        <thead className="bg-blue-400 text-white">
          <tr>
            <th className="p-2 text-left">#</th>
            <th className="p-2 text-left">Paid on</th>
            <th className="p-2 text-right">Amount paid</th>
            <th className="p-2 text-right">Remaining after</th>
            <th className="p-2 text-left">Method</th>
            <th className="p-2 text-left">Notes</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {installments.map((p) => (
            <tr key={p.id}>
              <td className="p-2 font-semibold">{p.installmentNo}</td>
              <td className="p-2">
                {p.paymentDate ? new Date(p.paymentDate).toLocaleString() : "-"}
              </td>
              <td className="p-2 text-right font-bold text-emerald-700">
                {money(p.amountPaid)}
              </td>
              <td className="p-2 text-right font-semibold text-red-700">
                {money(p.balanceAfter)}
              </td>
              <td className="p-2">{p.paymentMethod || "-"}</td>
              <td className="p-2">
                {p.notes || p.transactionReference || "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const METHODS = ["CASH", "UPI", "CREDIT_CARD", "DEBIT_CARD", "NET_BANKING"];
const inputCls =
  "w-full rounded-lg border border-slate-300 bg-white p-2 text-xs";

// Records one part-payment on a bill (POST /api/vendor-bills/{id}/payments).
const RecordPaymentForm = ({bill, isPending, onSubmit, onCancel}) => {
  const remaining = Number(bill.remainingAmount || 0);
  const [amount, setAmount] = useState(String(remaining));
  const [method, setMethod] = useState("CASH");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  const submit = (e) => {
    e.preventDefault();
    onSubmit({
      billId: bill.id,
      amountPaid: Number(amount),
      paymentMethod: method,
      transactionReference: reference.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <form
      onSubmit={submit}
      className="mb-3 grid grid-cols-1 gap-2 rounded-lg border border-blue-100 bg-blue-50/60 p-3 sm:grid-cols-5"
    >
      <input
        type="number"
        min="0.01"
        max={remaining}
        step="0.01"
        required
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className={inputCls}
        aria-label="Amount paid"
        placeholder="Amount"
      />
      <select
        value={method}
        onChange={(e) => setMethod(e.target.value)}
        className={inputCls}
        aria-label="Payment method"
      >
        {METHODS.map((m) => (
          <option
            key={m}
            value={m}
          >
            {m.replace("_", " ")}
          </option>
        ))}
      </select>
      <input
        value={reference}
        onChange={(e) => setReference(e.target.value)}
        className={inputCls}
        placeholder="Reference"
        aria-label="Transaction reference"
      />
      <input
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className={inputCls}
        placeholder="Notes"
        aria-label="Notes"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border bg-white px-3 py-2 text-xs"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

const BillCard = ({
  bill,
  onMarkPaid,
  onOpenPlan,
  onRecordPayment,
  isMarking,
  isRecording,
}) => {
  const [showForm, setShowForm] = useState(false);
  const fullyPaid =
    bill.paymentStatus === "PAID" || Number(bill.remainingAmount || 0) <= 0;
  const percent =
    Number(bill.totalAmount) > 0
      ? Math.min(
          100,
          (Number(bill.paidAmount) / Number(bill.totalAmount)) * 100,
        )
      : 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3 p-4">
        <div>
          <p className="font-bold text-slate-800">{bill.billNumber}</p>
          <p className="text-xs text-slate-500">
            Bill date: {bill.billDate || "-"}
            {bill.dueDate ? ` • Due: ${bill.dueDate}` : ""}
          </p>
          {bill.productName && (
            <p className="text-xs text-slate-500">
              {bill.productName}
              {bill.quantity != null ? ` • Qty ${bill.quantity}` : ""}
              {bill.unitPrice != null ? ` × ${money(bill.unitPrice)}` : ""}
              {bill.batchNumber ? ` • Batch ${bill.batchNumber}` : ""}
            </p>
          )}
        </div>
        <div className="text-right text-xs">
          <StatusBadge bill={bill} />
          <p className="mt-1 text-slate-600">
            Total: <b>{money(bill.totalAmount)}</b>
          </p>
          <p className="text-emerald-700">
            Paid: <b>{money(bill.paidAmount)}</b>
          </p>
          <p className="text-red-700">
            Remaining: <b>{money(bill.remainingAmount)}</b>
          </p>
        </div>
      </div>

      <div className="px-4 pb-3">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full bg-emerald-500"
            style={{width: `${percent}%`}}
          />
        </div>
      </div>

      <div className="border-t bg-slate-50/60 p-4">
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-800">
            Installments ({bill.installments?.length || 0})
          </h4>
          {fullyPaid ? (
            <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" /> Payment Complete
            </span>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setShowForm((v) => !v)}
                className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800"
              >
                <HandCoins className="h-3.5 w-3.5" />
                Record payment
              </button>
              <button
                onClick={() => onOpenPlan(bill)}
                className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800"
              >
                <CalendarClock className="h-3.5 w-3.5" />
                Installment plan
              </button>
              <button
                onClick={() => onMarkPaid(bill.id)}
                disabled={isMarking}
                className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {isMarking ? "Marking..." : "Mark Payment Done"}
              </button>
            </div>
          )}
        </div>
        {showForm && !fullyPaid && (
          <RecordPaymentForm
            bill={bill}
            isPending={isRecording}
            onCancel={() => setShowForm(false)}
            onSubmit={(payload) =>
              onRecordPayment(payload, () => setShowForm(false))
            }
          />
        )}
        <Installments installments={bill.installments} />
      </div>
    </div>
  );
};

const PLAN_STATUS = {
  PAID: "text-emerald-700",
  PARTIAL: "text-amber-700",
  PENDING: "text-slate-600",
};

// Installment schedule of the bill (due date, amount, paid, status).
const PlanSchedule = ({plan}) => (
  <div className="rounded-xl border border-slate-200 bg-white p-4">
    <h4 className="mb-2 text-sm font-bold text-slate-800">
      Installment schedule ({plan.installments.length})
    </h4>
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-xs">
        <thead className="bg-blue-400 text-white">
          <tr>
            <th className="p-2 text-left">#</th>
            <th className="p-2 text-left">Due date</th>
            <th className="p-2 text-right">Amount</th>
            <th className="p-2 text-right">Paid</th>
            <th className="p-2 text-right">Pending</th>
            <th className="p-2 text-left">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {plan.installments.map((inst) => (
            <tr key={inst.id}>
              <td className="p-2 font-semibold">{inst.installmentNumber}</td>
              <td className="p-2">{inst.dueDate}</td>
              <td className="p-2 text-right">{money(inst.dueAmount)}</td>
              <td className="p-2 text-right text-emerald-700">
                {money(inst.paidAmount)}
              </td>
              <td className="p-2 text-right text-red-700">
                {money(inst.pendingAmount)}
              </td>
              <td
                className={`p-2 font-semibold ${inst.overdue && inst.status !== "PAID" ? "text-red-700" : PLAN_STATUS[inst.status] || ""}`}
              >
                {inst.overdue && inst.status !== "PAID"
                  ? "OVERDUE"
                  : inst.status}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// Everything about ONE vendor bill: amounts, product/batch, payments and installment schedule.
// `bill` is a row of GET /api/vendor-bills.
const VendorBillDetailModal = ({bill, onClose}) => {
  const queryClient = useQueryClient();
  const [showPlan, setShowPlan] = useState(false);
  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => setToast({message, type});

  const vendorId = bill?.vendor?.id;

  const {data, isLoading, isError, error, refetch} = useQuery({
    queryKey: ["vendorBills", "detail", vendorId],
    queryFn: () => fetchVendorBillDetail(vendorId),
    enabled: Boolean(vendorId),
  });

  // The backend answers with an error while the bill has no plan yet.
  const {data: plan} = useQuery({
    queryKey: ["installmentPlan", "vendor", bill?.id],
    queryFn: () => vendorBillInstallmentApi.fetchPlan(bill.id),
    enabled: Boolean(bill?.id),
    retry: false,
  });

  const refresh = () => {
    queryClient.invalidateQueries({queryKey: ["vendorBills"]});
    queryClient.invalidateQueries({
      queryKey: ["installmentPlan", "vendor", bill.id],
    });
    queryClient.invalidateQueries({queryKey: ["dashboard"]});
  };

  const markPaid = useMutation({
    mutationFn: markVendorBillPaymentDone,
    onSuccess: () => {
      refresh();
      showToast("Bill marked as paid");
    },
    onError: (e) =>
      showToast(
        e.response?.data?.message ||
          e.message ||
          "Unable to mark payment as done.",
        "error",
      ),
  });

  const recordPayment = useMutation({
    mutationFn: addVendorBillPayment,
    onSuccess: () => {
      refresh();
      showToast("Payment recorded");
    },
    onError: (e) =>
      showToast(
        e.response?.data?.message ||
          e.message ||
          "Could not record the payment",
        "error",
      ),
  });

  if (!bill) return null;

  const detail = data?.bills?.find((b) => b.id === bill.id);
  const errorMessage =
    error?.response?.data?.message ||
    error?.message ||
    "Unable to load bill details.";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-slate-50 shadow-2xl">
        <div className="flex items-start justify-between border-b bg-white px-5 py-4">
          <div>
            <h3 className="text-lg font-bold">{bill.billNumber}</h3>
            <p className="text-xs text-slate-500">
              {[
                bill.vendor?.vendorName,
                bill.vendor?.companyName,
                bill.vendor?.phone,
              ]
                .filter(Boolean)
                .join(" • ")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 overflow-auto p-4">
          {isLoading ? (
            <p className="p-8 text-center">Loading details...</p>
          ) : isError || !detail ? (
            <div className="p-8 text-center">
              <p className="mb-2 font-semibold text-red-600">
                Failed to load details
              </p>
              <p className="mb-4 text-xs text-slate-500">
                {isError ? errorMessage : "Bill not found."}
              </p>
              <button
                onClick={() => refetch()}
                className="text-sm font-semibold text-blue-600"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <Stat
                  label="Total"
                  value={money(detail.totalAmount)}
                  tone="text-slate-800"
                />
                <Stat
                  label="Paid"
                  value={money(detail.paidAmount)}
                  tone="text-emerald-700"
                />
                <Stat
                  label="Remaining"
                  value={money(detail.remainingAmount)}
                  tone="text-red-700"
                />
                <Stat
                  label="Status"
                  value={detail.paymentStatus}
                  tone="text-slate-800"
                />
              </div>

              <BillCard
                bill={detail}
                onMarkPaid={(id) => markPaid.mutate(id)}
                onOpenPlan={() => setShowPlan(true)}
                onRecordPayment={(payload, done) =>
                  recordPayment.mutate(payload, {onSuccess: done})
                }
                isRecording={recordPayment.isPending}
                isMarking={markPaid.isPending}
              />

              {plan?.installments?.length > 0 && <PlanSchedule plan={plan} />}
            </>
          )}
        </div>

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
        {showPlan && (
          <InstallmentPlanModal
            kind="vendor"
            referenceId={bill.id}
            summary={{
              total: bill.totalAmount,
              paid: bill.paidAmount,
              pending: bill.dueAmount,
            }}
            title={bill.billNumber || `Bill #${bill.id}`}
            onClose={() => setShowPlan(false)}
            onChanged={refresh}
            showToast={showToast}
          />
        )}

        <div className="flex justify-end border-t bg-white px-5 py-3">
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default VendorBillDetailModal;
