import {useState} from "react";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {CalendarClock, Plus, Trash2, X} from "lucide-react";

import {
  orderInstallmentApi,
  vendorBillInstallmentApi,
} from "../api/installmentApi";
import {fetchPaymentReceivingAccounts} from "../api/storeSettingsApi";

const money = (v) =>
  `₹${Number(v || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const METHODS = ["CASH", "UPI", "CREDIT_CARD", "DEBIT_CARD", "NET_BANKING"];
const FREQUENCIES = ["DAILY", "WEEKLY", "FORTNIGHTLY", "MONTHLY"];
const today = () => new Date().toISOString().slice(0, 10);

const STATUS_STYLE = {
  PAID: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PARTIAL: "bg-amber-50 text-amber-700 border-amber-200",
  PENDING: "bg-slate-100 text-slate-700 border-slate-200",
};

const inputCls = "w-full rounded-lg border border-slate-300 p-2 text-sm";
const labelCls = "text-xs font-semibold uppercase text-slate-600";

const messageOf = (e, fallback) =>
  e.response?.data?.message || e.message || fallback;

// ---------------------------------------------------------------- create plan
function CreatePlanForm({onSubmit, isPending}) {
  const [mode, setMode] = useState("AUTO");
  const [count, setCount] = useState("3");
  const [firstDueDate, setFirstDueDate] = useState(today());
  const [frequency, setFrequency] = useState("MONTHLY");
  const [rows, setRows] = useState([{dueAmount: "", dueDate: today()}]);

  const updateRow = (i, key, value) =>
    setRows((prev) => prev.map((r, idx) => (idx === i ? {...r, [key]: value} : r)));

  const submit = (e) => {
    e.preventDefault();
    if (mode === "AUTO") {
      onSubmit({
        numberOfInstallments: Number(count),
        firstDueDate,
        frequency,
      });
    } else {
      onSubmit({
        installments: rows.map((r) => ({
          dueAmount: Number(r.dueAmount),
          dueDate: r.dueDate,
        })),
      });
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex gap-2">
        {["AUTO", "CUSTOM"].map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-semibold ${
              mode === m
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-slate-300 bg-white text-slate-700"
            }`}
          >
            {m === "AUTO" ? "Equal parts" : "Custom amounts"}
          </button>
        ))}
      </div>

      {mode === "AUTO" ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className={labelCls}>Installments</label>
            <input
              type="number"
              min="1"
              required
              value={count}
              onChange={(e) => setCount(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>First due date</label>
            <input
              type="date"
              required
              value={firstDueDate}
              onChange={(e) => setFirstDueDate(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Frequency</label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className={inputCls}
            >
              {FREQUENCIES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((r, i) => (
            <div key={i} className="flex items-end gap-2">
              <div className="flex-1">
                <label className={labelCls}>Amount (₹)</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={r.dueAmount}
                  onChange={(e) => updateRow(i, "dueAmount", e.target.value)}
                  className={inputCls}
                />
              </div>
              <div className="flex-1">
                <label className={labelCls}>Due date</label>
                <input
                  type="date"
                  required
                  value={r.dueDate}
                  onChange={(e) => updateRow(i, "dueDate", e.target.value)}
                  className={inputCls}
                />
              </div>
              <button
                type="button"
                disabled={rows.length === 1}
                onClick={() => setRows((prev) => prev.filter((_, idx) => idx !== i))}
                className="mb-1 cursor-pointer rounded-md p-2 text-red-600 hover:bg-red-50 disabled:opacity-30"
                aria-label="Remove row"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setRows((prev) => [...prev, {dueAmount: "", dueDate: today()}])}
            className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-blue-700"
          >
            <Plus className="h-3.5 w-3.5" /> Add installment
          </button>
          <p className="text-xs text-slate-500">
            Amounts must add up to the unpaid amount.
          </p>
        </div>
      )}

      <div className="flex justify-end border-t pt-3">
        <button
          type="submit"
          disabled={isPending}
          className="cursor-pointer rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {isPending ? "Creating..." : "Create plan"}
        </button>
      </div>
    </form>
  );
}

// ------------------------------------------------------------ pay installment
function PayForm({installment, isOrder, accounts, onSubmit, onCancel, isPending}) {
  const [amount, setAmount] = useState(Number(installment.pendingAmount).toFixed(2));
  const [method, setMethod] = useState("UPI");
  const [accountId, setAccountId] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  const submit = (e) => {
    e.preventDefault();
    onSubmit({
      installmentId: installment.id,
      amount: Number(amount),
      paymentDate: today(),
      paymentMethod: method,
      transactionReference: reference || undefined,
      ...(isOrder
        ? {receivingAccountId: method !== "CASH" && accountId ? Number(accountId) : undefined}
        : {notes: notes || undefined}),
    });
  };

  return (
    <form
      onSubmit={submit}
      className="grid grid-cols-1 gap-2 bg-blue-50/50 p-3 sm:grid-cols-5"
    >
      <input
        type="number"
        min="0.01"
        max={installment.pendingAmount}
        step="0.01"
        required
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className={inputCls}
        aria-label="Amount"
      />
      <select value={method} onChange={(e) => setMethod(e.target.value)} className={inputCls}>
        {METHODS.map((m) => (
          <option key={m} value={m}>
            {m.replace("_", " ")}
          </option>
        ))}
      </select>
      {isOrder && method !== "CASH" ? (
        <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className={inputCls}>
          <option value="">No bank account</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.accountName || a.bankName}
            </option>
          ))}
        </select>
      ) : (
        !isOrder && (
          <input
            placeholder="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={inputCls}
          />
        )
      )}
      <input
        placeholder="Reference"
        value={reference}
        onChange={(e) => setReference(e.target.value)}
        className={inputCls}
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 cursor-pointer rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
        >
          {isPending ? "..." : "Pay"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="cursor-pointer rounded-lg border px-3 py-2 text-xs"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ------------------------------------------------------------------- modal
/**
 * kind = "order"  -> customer pays the store, in installments
 * kind = "vendor" -> the store pays a vendor bill, in installments
 */
export default function InstallmentPlanModal({
  kind,
  referenceId,
  title,
  onClose,
  onChanged,
  showToast,
}) {
  const isOrder = kind === "order";
  const api = isOrder ? orderInstallmentApi : vendorBillInstallmentApi;
  const queryClient = useQueryClient();
  const [payingId, setPayingId] = useState(null);

  const planKey = ["installmentPlan", kind, referenceId];

  const {data: plan, isLoading} = useQuery({
    queryKey: planKey,
    queryFn: () => api.fetchPlan(referenceId),
    retry: false, // the backend answers with an error while no plan exists
  });

  const {data: accounts = []} = useQuery({
    queryKey: ["paymentReceivingAccounts"],
    queryFn: fetchPaymentReceivingAccounts,
    enabled: isOrder && Boolean(plan),
  });

  const changed = () => {
    queryClient.invalidateQueries({queryKey: planKey});
    queryClient.invalidateQueries({queryKey: ["dashboard"]});
    queryClient.invalidateQueries({queryKey: ["installmentDues"]});
    queryClient.invalidateQueries({queryKey: isOrder ? ["orders"] : ["vendorBills"]});
    onChanged?.();
  };

  const createMutation = useMutation({
    mutationFn: (payload) => api.createPlan({id: referenceId, ...payload}),
    onSuccess: () => {
      showToast?.("Installment plan created", "success");
      changed();
    },
    onError: (e) => showToast?.(messageOf(e, "Could not create the plan"), "error"),
  });

  const payMutation = useMutation({
    mutationFn: api.payInstallment,
    onSuccess: () => {
      showToast?.("Installment payment recorded", "success");
      setPayingId(null);
      changed();
    },
    onError: (e) => showToast?.(messageOf(e, "Payment failed"), "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.deletePlan(referenceId),
    onSuccess: () => {
      showToast?.("Installment plan removed", "success");
      changed();
    },
    onError: (e) => showToast?.(messageOf(e, "Could not remove the plan"), "error"),
  });

  const hasPayments = plan?.paidAmount > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-bold">Installments — {title}</h2>
          </div>
          <button type="button" onClick={onClose} className="cursor-pointer" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto p-4">
          {isLoading ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : !plan ? (
            <>
              <p className="text-sm text-slate-600">
                No plan yet. A plan covers the amount that is still unpaid.
              </p>
              <CreatePlanForm
                onSubmit={(payload) => createMutation.mutate(payload)}
                isPending={createMutation.isPending}
              />
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-sm sm:grid-cols-4">
                <div>
                  <p className="text-slate-500">{plan.partyName}</p>
                  <b>{money(plan.planAmount)}</b>
                </div>
                <div>
                  <p className="text-slate-500">Paid</p>
                  <b className="text-emerald-700">{money(plan.paidAmount)}</b>
                </div>
                <div>
                  <p className="text-slate-500">Pending</p>
                  <b className="text-amber-700">{money(plan.pendingAmount)}</b>
                </div>
                <div>
                  <p className="text-slate-500">Overdue</p>
                  <b className="text-red-700">{money(plan.overdueAmount)}</b>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border">
                {plan.installments.map((inst) => (
                  <div key={inst.id} className="border-b last:border-b-0">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 p-3 text-sm">
                      <span className="w-8 font-bold">#{inst.installmentNumber}</span>
                      <span className="text-slate-600">Due {inst.dueDate}</span>
                      <span className="font-semibold">{money(inst.dueAmount)}</span>
                      <span className="text-emerald-700">Paid {money(inst.paidAmount)}</span>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${
                          STATUS_STYLE[inst.status] || STATUS_STYLE.PENDING
                        }`}
                      >
                        {inst.overdue && inst.status !== "PAID" ? "OVERDUE" : inst.status}
                      </span>
                      {inst.status !== "PAID" && payingId !== inst.id && (
                        <button
                          type="button"
                          onClick={() => setPayingId(inst.id)}
                          className="ml-auto cursor-pointer rounded-lg bg-blue-600 px-3 py-1 text-xs font-semibold text-white"
                        >
                          Pay
                        </button>
                      )}
                    </div>
                    {payingId === inst.id && (
                      <PayForm
                        installment={inst}
                        isOrder={isOrder}
                        accounts={accounts}
                        isPending={payMutation.isPending}
                        onCancel={() => setPayingId(null)}
                        onSubmit={(payload) => payMutation.mutate(payload)}
                      />
                    )}
                    {inst.payments?.length > 0 && (
                      <ul className="bg-slate-50 px-3 py-2 text-xs text-slate-600">
                        {inst.payments.map((p) => (
                          <li key={p.id}>
                            {p.paymentDate} · {money(p.amount)} · {p.paymentMethod}
                            {p.transactionReference ? ` · ${p.transactionReference}` : ""}
                            {p.notes ? ` · ${p.notes}` : ""}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={hasPayments || deleteMutation.isPending}
                  title={hasPayments ? "A plan with payments cannot be removed" : undefined}
                  onClick={() => {
                    if (window.confirm("Remove this installment plan?")) deleteMutation.mutate();
                  }}
                  className="cursor-pointer rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Remove plan
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
