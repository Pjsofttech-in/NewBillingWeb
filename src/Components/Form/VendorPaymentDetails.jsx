import {useState} from "react";
import {fetchVendorBillsByVendor} from "../../api/vendorServiceApi";
import {vendorBillInstallmentApi} from "../../api/installmentApi";

/*
 * Payment details of a vendor bill, shared by "Add Product" and "Restock Product".
 *
 *  PAID    -> whole bill is paid now (method + reference).
 *  UNPAID  -> two checkboxes: pay an ADVANCE now, and/or pay the rest in INSTALLMENTS
 *             (equal parts or custom amounts). Fields appear only when a box is checked.
 *
 * How the advance works: it is paid today and taken off the bill. The installment plan
 * only covers what is left (bill - advance), and custom amounts must add up to that.
 */

export const EMPTY_PLAN = {
  mode: "EQUAL", // EQUAL | CUSTOM
  count: "3",
  firstDate: "",
  frequency: "MONTHLY",
  rows: [{dueAmount: "", dueDate: ""}],
};

const num = (v) => {
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};

const money = (v) =>
  `₹${Number(v || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

// Returns an error message, or null when the plan is valid for the amount left to pay.
export const validatePlan = (plan, remaining) => {
  if (remaining <= 0.009) return "Nothing is left to pay in installments.";
  if (plan.mode === "EQUAL") {
    if (Number.parseInt(plan.count, 10) < 1)
      return "Number of installments must be at least 1.";
    if (!plan.firstDate) return "First installment date is required.";
    return null;
  }
  if (plan.rows.some((r) => num(r.dueAmount) <= 0 || !r.dueDate)) {
    return "Every custom installment needs an amount and a due date.";
  }
  const sum = plan.rows.reduce((s, r) => s + num(r.dueAmount), 0);
  if (Math.abs(sum - remaining) > 0.009) {
    return `Custom installments must add up to ${money(remaining)} (now ${money(sum)}).`;
  }
  return null;
};

// Request body of POST /api/vendor-bill-installments/bill/{id}
export const buildPlanPayload = (plan) =>
  plan.mode === "EQUAL"
    ? {
        numberOfInstallments: Number.parseInt(plan.count, 10),
        firstDueDate: plan.firstDate,
        frequency: plan.frequency,
      }
    : {
        installments: plan.rows.map((r) => ({
          dueAmount: num(r.dueAmount),
          dueDate: r.dueDate,
        })),
      };

// Date stored as the bill's own due date = the first installment
export const planFirstDate = (plan) =>
  plan.mode === "EQUAL"
    ? plan.firstDate
    : plan.rows
        .map((r) => r.dueDate)
        .filter(Boolean)
        .sort()[0] || "";

// The stock purchase has just created the vendor bill: it is the vendor's newest unpaid bill.
// Never throws - returns an error message (or null) so the caller can still finish.
export const createPlanForNewBill = async (vendorId, plan) => {
  try {
    const bills = await fetchVendorBillsByVendor(vendorId);
    const bill = bills.find((b) => Number(b.dueAmount) > 0) || bills[0];
    if (!bill) throw new Error("vendor bill not found");
    await vendorBillInstallmentApi.createPlan({
      id: bill.id,
      ...buildPlanPayload(plan),
    });
    return null;
  } catch (e) {
    return e.response?.data?.message || e.message || "unknown error";
  }
};

const inputCls =
  "h-8 w-full rounded border border-slate-300 bg-white px-2 text-xs outline-none focus:border-blue-500";
const labelCls = "mb-1 block text-xs font-semibold text-slate-700";

const TextField = ({label, value, onChange, ...props}) => (
  <div className="flex flex-col">
    <label className={labelCls}>{label}</label>
    <input
      {...props}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={inputCls}
    />
  </div>
);

const MethodAndRef = ({
  method,
  onMethodChange,
  reference,
  onReferenceChange,
}) => (
  <>
    <div className="flex flex-col">
      <label className={labelCls}>Payment Method</label>
      <select
        value={method}
        onChange={(e) => onMethodChange(e.target.value)}
        className={inputCls}
      >
        <option value="CASH">Cash</option>
        <option value="UPI">UPI</option>
        <option value="CREDIT_CARD">Credit Card</option>
        <option value="DEBIT_CARD">Debit Card</option>
        <option value="NET_BANKING">Net Banking</option>
      </select>
    </div>
    <TextField
      label="Ref / Transaction No."
      placeholder="UPI/Bank ref"
      value={reference}
      onChange={onReferenceChange}
    />
  </>
);

function InstallmentPlanFields({plan, onPlanChange, remaining}) {
  const set = (patch) => onPlanChange({...plan, ...patch});
  const setRow = (i, patch) =>
    set({rows: plan.rows.map((r, idx) => (idx === i ? {...r, ...patch} : r))});

  const count = Number.parseInt(plan.count, 10) || 0;
  const customSum = plan.rows.reduce((s, r) => s + num(r.dueAmount), 0);
  const diff = remaining - customSum;

  return (
    <div className="space-y-2.5 rounded border border-slate-200 bg-white p-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1.5">
          {[
            ["EQUAL", "Equal parts"],
            ["CUSTOM", "Custom amounts"],
          ].map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              onClick={() => set({mode})}
              className={`rounded border px-2.5 py-1 text-[11px] font-semibold ${
                plan.mode === mode
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-slate-300 bg-white text-slate-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="text-[11px] text-slate-600">
          To pay in installments:{" "}
          <strong className="text-slate-800">{money(remaining)}</strong>
        </span>
      </div>

      {plan.mode === "EQUAL" ? (
        <div className="grid grid-cols-2 items-start gap-3 sm:grid-cols-4">
          <TextField
            label="No. of Installments"
            type="number"
            min="1"
            step="1"
            value={plan.count}
            onChange={(v) => set({count: v})}
          />
          <TextField
            label="First Installment Date"
            type="date"
            value={plan.firstDate}
            onChange={(v) => set({firstDate: v})}
          />
          <div className="flex flex-col">
            <label className={labelCls}>Frequency</label>
            <select
              value={plan.frequency}
              onChange={(e) => set({frequency: e.target.value})}
              className={inputCls}
            >
              <option value="WEEKLY">Weekly</option>
              <option value="FORTNIGHTLY">Fortnightly</option>
              <option value="MONTHLY">Monthly</option>
            </select>
          </div>
          <div className="flex flex-col justify-end pb-1.5 text-[11px] text-slate-600">
            {remaining > 0 && count > 0 ? (
              <span>
                {count} x{" "}
                <strong className="text-slate-800">
                  {money(remaining / count)}
                </strong>
              </span>
            ) : (
              <span>Enter quantity and price first.</span>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {plan.rows.map((row, i) => (
            <div
              key={i}
              className="grid grid-cols-[1fr_1fr_auto] items-end gap-2"
            >
              <TextField
                label={`Installment ${i + 1} amount`}
                type="number"
                min="0"
                step="0.01"
                value={row.dueAmount}
                onChange={(v) => setRow(i, {dueAmount: v})}
              />
              <TextField
                label="Due date"
                type="date"
                value={row.dueDate}
                onChange={(v) => setRow(i, {dueDate: v})}
              />
              <button
                type="button"
                disabled={plan.rows.length === 1}
                onClick={() =>
                  set({rows: plan.rows.filter((_, idx) => idx !== i)})
                }
                className="mb-0.5 h-8 rounded px-2 text-red-600 hover:bg-red-50 disabled:opacity-30"
                aria-label="Remove installment"
              >
                ✕
              </button>
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() =>
                set({
                  rows: [
                    ...plan.rows,
                    {
                      dueAmount: diff > 0.009 ? diff.toFixed(2) : "",
                      dueDate: "",
                    },
                  ],
                })
              }
              className="text-[11px] font-semibold text-blue-700"
            >
              + Add installment
            </button>
            <span
              className={`text-[11px] font-semibold ${
                Math.abs(diff) <= 0.009 ? "text-emerald-600" : "text-amber-600"
              }`}
            >
              Entered {money(customSum)} of {money(remaining)}
              {Math.abs(diff) > 0.009 &&
                ` (${diff > 0 ? "short" : "over"} by ${money(Math.abs(diff))})`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VendorPaymentDetails({
  option, // "PAID" | "UNPAID"
  totalBill,
  advance,
  onAdvanceChange,
  method,
  onMethodChange,
  reference,
  onReferenceChange,
  inInstallments,
  onInInstallmentsChange,
  plan,
  onPlanChange,
}) {
  const [showAdvance, setShowAdvance] = useState(num(advance) > 0);
  const remaining = Math.max(0, totalBill - num(advance));

  if (option === "PAID") {
    return (
      <div className="mt-2.5 rounded border border-emerald-200 bg-emerald-50/40 p-2.5">
        <div className="grid grid-cols-2 items-start gap-3 sm:grid-cols-4">
          <div className="flex flex-col">
            <label className={labelCls}>Amount to Pay</label>
            <div className="flex h-8 w-full items-center rounded border border-slate-200 bg-slate-100 px-2 text-xs font-semibold text-slate-700">
              {money(totalBill)}
            </div>
          </div>
          <MethodAndRef
            method={method}
            onMethodChange={onMethodChange}
            reference={reference}
            onReferenceChange={onReferenceChange}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2.5 space-y-2.5 rounded border border-amber-200 bg-amber-50/40 p-2.5">
      {/* 1. optional advance */}
      <div className="space-y-2">
        <label className="flex cursor-pointer items-center gap-2 text-[11px] font-semibold text-slate-700">
          <input
            type="checkbox"
            checked={showAdvance}
            onChange={(e) => {
              setShowAdvance(e.target.checked);
              if (!e.target.checked) onAdvanceChange("0");
            }}
            className="h-3.5 w-3.5"
          />
          Pay some amount now (advance)
        </label>
        {showAdvance && (
          <>
            <div className="grid grid-cols-2 items-start gap-3 sm:grid-cols-4">
              <TextField
                label="Amount Paid Now"
                type="number"
                min="0"
                max={totalBill}
                step="0.01"
                value={advance}
                onChange={onAdvanceChange}
              />
              <MethodAndRef
                method={method}
                onMethodChange={onMethodChange}
                reference={reference}
                onReferenceChange={onReferenceChange}
              />
            </div>
            <p className="text-[11px] text-slate-500">
              The advance is paid today and taken off the bill. What is left to
              pay:{" "}
              <strong className="text-slate-800">{money(remaining)}</strong>
            </p>
          </>
        )}
      </div>

      {/* 2. how the rest is paid */}
      <div className="space-y-2 border-t border-amber-200 pt-2.5">
        <label className="flex cursor-pointer items-center gap-2 text-[11px] font-semibold text-slate-700">
          <input
            type="checkbox"
            checked={inInstallments}
            onChange={(e) => onInInstallmentsChange(e.target.checked)}
            className="h-3.5 w-3.5"
          />
          Pay the remaining amount in installments
        </label>

        {inInstallments && (
          <InstallmentPlanFields
            plan={plan}
            onPlanChange={onPlanChange}
            remaining={remaining}
          />
        )}
      </div>
    </div>
  );
}
