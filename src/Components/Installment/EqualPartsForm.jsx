import {useState} from "react";
import {money} from "../../utils/format";
import Select from "../Form/Select";
import {
  FREQUENCIES,
  dueDateFor,
  equalParts,
  fieldCls,
  fieldLabelCls,
  today,
} from "./installmentHelpers";

/**
 * Equal parts: the whole pending amount is split into N equal installments in one go.
 * (There is nothing to add one by one here, so this one keeps a button: "Create installments".)
 */
export default function EqualPartsForm({
  orderId,
  isOrder,
  pending, // null when unknown
  onSubmit,
  isPending,
}) {
  const [count, setCount] = useState("3");
  const [firstDueDate, setFirstDueDate] = useState(today());
  const [frequency, setFrequency] = useState("MONTHLY");
  const [error, setError] = useState("");

  const n = Number(count);
  const preview =
    pending !== null && n >= 2 && n <= 60
      ? equalParts(pending, n).map((value, i) => ({
          amount: value,
          dueDate: firstDueDate ? dueDateFor(firstDueDate, frequency, i) : "",
        }))
      : [];

  const submit = (e) => {
    e.preventDefault();
    setError("");
    if (!(n >= 2)) {
      setError("An installment plan needs at least 2 installments");
      return;
    }
    if (!firstDueDate || firstDueDate < today()) {
      setError("Select a first due date that is not in the past");
      return;
    }
    onSubmit({numberOfInstallments: n, firstDueDate, frequency});
  };

  const th =
    "border border-blue-300 bg-blue-400 px-3 py-2 text-sm font-bold text-white";
  const cell = "border border-slate-200 px-3 py-1.5 text-center text-sm";

  return (
    <form
      noValidate
      onSubmit={submit}
      className="space-y-3"
    >
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-full sm:w-36">
          <label className={fieldLabelCls}>Installments</label>
          <input
            type="number"
            min="2"
            max="60"
            value={count}
            onChange={(e) => setCount(e.target.value)}
            className={fieldCls}
          />
        </div>
        <div className="w-full sm:w-44">
          <label className={fieldLabelCls}>First due date</label>
          <input
            type="date"
            min={today()}
            value={firstDueDate}
            onChange={(e) => setFirstDueDate(e.target.value)}
            className={fieldCls}
          />
        </div>
        <div className="w-full sm:w-44">
          <Select
            label="Frequency"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            showPlaceholder={false}
            options={FREQUENCIES.map((f) => ({value: f, label: f}))}
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="cursor-pointer rounded-md bg-blue-700 px-5 py-2.5 text-xs font-bold uppercase text-white disabled:opacity-50"
        >
          {isPending ? "Creating..." : "Create installments"}
        </button>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={th}>{isOrder ? "Invoice No" : "No"}</th>
              <th className={th}>Amount</th>
              <th className={th}>Due Date</th>
            </tr>
          </thead>
          <tbody>
            {preview.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-3 py-6 text-center text-sm text-slate-400"
                >
                  Enter the number of installments to see them here.
                </td>
              </tr>
            ) : (
              preview.map((row, i) => (
                <tr
                  key={i}
                  className={i % 2 === 0 ? "bg-slate-100" : "bg-white"}
                >
                  <td className={cell}>
                    {isOrder ? `INV-${orderId}-${i + 1}` : `#${i + 1}`}
                  </td>
                  <td className={cell}>{money(row.amount)}</td>
                  <td className={cell}>{row.dueDate}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </form>
  );
}
