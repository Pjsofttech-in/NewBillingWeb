import {useState} from "react";
import {money} from "../../utils/format";
import {today, inputCls} from "./installmentHelpers";

// -------------------------------------------------------- installment entry form
// The small form used everywhere an installment is added: Amount | Due date | Remark, ADD / CANCEL.
// (create plan > Custom amounts, and "Add installment" on an existing plan)
export default function InstallmentEntryForm({
  defaultAmount = "",
  maxAmount = null,
  minDate,
  hint,
  busy = false,
  onSubmit,
  onCancel,
}) {
  const [dueAmount, setDueAmount] = useState(String(defaultAmount));
  const [dueDate, setDueDate] = useState(minDate || today());
  const [remark, setRemark] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    const amount = Number(dueAmount);
    if (!(amount > 0)) {
      setError("Enter the installment amount");
      return;
    }
    if (maxAmount !== null && amount > maxAmount + 0.004) {
      setError(`Amount cannot be more than ${money(maxAmount)}`);
      return;
    }
    if (!dueDate) {
      setError("Select the due date");
      return;
    }
    if (minDate && dueDate < minDate) {
      setError(`Due date must be on or after ${minDate}`);
      return;
    }
    setError("");
    onSubmit({
      dueAmount: Math.round(amount * 100) / 100,
      dueDate,
      remark: remark.trim(),
    });
  };

  return (
    <div className="space-y-3 rounded-lg bg-slate-50 p-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <input
          type="number"
          min="0.01"
          step="0.01"
          placeholder="Amount"
          value={dueAmount}
          onChange={(e) => setDueAmount(e.target.value)}
          className={inputCls}
          aria-label="Amount"
        />
        <input
          type="date"
          min={minDate}
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className={inputCls}
          aria-label="Due date"
        />
        <input
          type="text"
          maxLength={255}
          placeholder="Remark"
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          className={inputCls}
          aria-label="Remark"
        />
      </div>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={submit}
          className="cursor-pointer rounded-md bg-blue-700 px-5 py-2 text-xs font-bold uppercase text-white disabled:opacity-50"
        >
          {busy ? "..." : "Add"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="cursor-pointer text-xs font-bold uppercase text-blue-700 hover:underline"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
