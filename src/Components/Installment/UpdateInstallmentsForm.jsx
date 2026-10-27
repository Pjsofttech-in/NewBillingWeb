import {useState} from "react";
import {Plus, Trash2} from "lucide-react";
import {money} from "../../utils/format";
import {tomorrow, inputCls} from "./installmentHelpers";

// -------------------------------------------------------- update installments
// Edit the installments that have no payment yet (amount / due date / add / remove).
// Paid and partly paid installments stay as they are.
export default function UpdateInstallmentsForm({
  // orderId,
  installments,
  target,
  onSubmit,
  onCancel,
  isPending,
}) {
  const [rows, setRows] = useState(
    installments.map((i) => ({
      id: i.id,
      dueAmount: String(Number(i.dueAmount)),
      dueDate: i.dueDate,
      remark: i.remark || "",
    })),
  );
  const [error, setError] = useState("");

  const sum = rows.reduce((s, r) => s + (Number(r.dueAmount) || 0), 0);
  const left = Math.round((target - sum) * 100) / 100;

  const updateRow = (i, key, value) =>
    setRows((prev) =>
      prev.map((r, idx) => (idx === i ? {...r, [key]: value} : r)),
    );

  const submit = (e) => {
    e.preventDefault();
    setError("");
    if (Math.abs(left) > 0.004) {
      setError(
        left > 0
          ? `${money(left)} is still not allocated to an installment`
          : `Installments are ${money(-left)} more than the amount to be planned`,
      );
      return;
    }
    onSubmit(
      rows.map((r) => ({
        ...(r.id ? {id: r.id} : {}),
        dueAmount: Number(r.dueAmount),
        dueDate: r.dueDate,
        remark: r.remark?.trim() || undefined,
      })),
    );
  };

  const th =
    "border border-blue-300 bg-blue-400 px-3 py-2 text-sm font-bold text-white";
  const cell = "border border-slate-200 px-3 py-1.5 text-center text-sm";

  return (
    <form
      onSubmit={submit}
      className="space-y-3 rounded-lg border border-blue-200 bg-blue-50/40 p-3"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-slate-800">Update installments</p>
        <button
          type="button"
          onClick={() =>
            setRows((prev) => [
              ...prev,
              {
                dueAmount: left > 0.004 ? left.toFixed(2) : "",
                dueDate: tomorrow(),
              },
            ])
          }
          className="inline-flex cursor-pointer items-center gap-1 rounded-md bg-blue-700 px-3 py-1.5 text-xs font-bold uppercase text-white"
        >
          <Plus className="h-3.5 w-3.5" /> Row
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={th}>Installment</th>
              <th className={th}>Amount</th>
              <th className={th}>Due Date</th>
              <th className={th}>Remark</th>
              <th className={th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={r.id || `new${i}`}
                className={i % 2 === 0 ? "bg-slate-100" : "bg-white"}
              >
                <td className={cell}>{r.id ? "Existing" : "New"}</td>
                <td className={cell}>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={r.dueAmount}
                    onChange={(e) => updateRow(i, "dueAmount", e.target.value)}
                    className={`${inputCls} max-w-32 text-center`}
                  />
                </td>
                <td className={cell}>
                  <input
                    type="date"
                    required
                    value={r.dueDate}
                    onChange={(e) => updateRow(i, "dueDate", e.target.value)}
                    className={`${inputCls} max-w-44`}
                  />
                </td>
                <td className={cell}>
                  <input
                    type="text"
                    maxLength={255}
                    value={r.remark || ""}
                    onChange={(e) => updateRow(i, "remark", e.target.value)}
                    className={`${inputCls} max-w-48`}
                    aria-label="Remark"
                  />
                </td>
                <td className={cell}>
                  <button
                    type="button"
                    onClick={() =>
                      setRows((prev) => prev.filter((_, idx) => idx !== i))
                    }
                    className="cursor-pointer rounded-md p-1.5 text-red-600 hover:bg-red-50"
                    aria-label="Remove row"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-x-8 gap-y-1 text-sm">
        <span>
          To be planned: <b>{money(target)}</b>
        </span>
        <span>
          Scheduled: <b>{money(sum)}</b>
        </span>
        <span>
          Left to allocate:{" "}
          <b
            className={
              Math.abs(left) < 0.005 ? "text-green-700" : "text-red-600"
            }
          >
            {money(left)}
          </b>
        </span>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="cursor-pointer rounded-md border px-4 py-2 text-xs font-semibold"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="cursor-pointer rounded-md bg-blue-700 px-5 py-2 text-xs font-bold uppercase text-white disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save changes"}
        </button>
      </div>
    </form>
  );
}
