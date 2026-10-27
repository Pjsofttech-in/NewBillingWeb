import {useState} from "react";
import {Trash2} from "lucide-react";
import {money} from "../../utils/format";
import {
  FREQUENCIES,
  today,
  dueDateFor,
  equalParts,
  inputCls,
  labelCls,
} from "./installmentHelpers";
import PaymentFields from "./PaymentFields";
import InstallmentEntryForm from "./InstallmentEntryForm";

// ---------------------------------------------------------------- create plan
/**
 * pending = the amount still unpaid (null when unknown, e.g. a vendor bill: the backend then does the checks).
 * Custom amounts for an order can also take a payment "now": that amount becomes installment #1,
 * is paid immediately (and gets its receipt) and the rest is scheduled in the rows below it.
 */
export default function CreatePlanForm({
  orderId,
  isOrder,
  pending,
  accounts,
  onSubmit,
  isPending,
}) {
  const [mode, setMode] = useState("AUTO");
  const [error, setError] = useState("");

  // Equal parts
  const [count, setCount] = useState("3");
  const [firstDueDate, setFirstDueDate] = useState(today());
  const [frequency, setFrequency] = useState("MONTHLY");

  // Custom amounts
  const canPayNow = pending !== null; // customer orders and vendor bills
  const [payNowOn, setPayNowOn] = useState(false);
  const [payNow, setPayNow] = useState("");
  const [method, setMethod] = useState("CASH");
  const [accountId, setAccountId] = useState("");
  const [reference, setReference] = useState("");
  // Installments added with the small "Add installment" form
  const [rows, setRows] = useState([]);
  const [showRowForm, setShowRowForm] = useState(false);

  const known = pending !== null;
  const payNowAmount = payNowOn ? Number(payNow) || 0 : 0;
  const scheduled = rows.reduce((s, r) => s + (Number(r.dueAmount) || 0), 0);
  const remaining = known
    ? Math.round((pending - payNowAmount - scheduled) * 100) / 100
    : 0;

  const autoCount = Number(count);
  const preview =
    known && mode === "AUTO" && autoCount >= 2 && autoCount <= 60
      ? equalParts(pending, autoCount).map((amount, i) => ({
          amount,
          dueDate: firstDueDate ? dueDateFor(firstDueDate, frequency, i) : "",
        }))
      : [];

  // Next installment must be due after the previous one (after today when money is paid now)
  const lastDate = rows.length
    ? rows[rows.length - 1].dueDate
    : payNowOn
      ? today()
      : null;
  const minRowDate = lastDate ? dueDateFor(lastDate, "DAILY", 1) : today();

  const addRow = (row) => {
    setRows((prev) => [...prev, row]);
    setShowRowForm(false);
    setError("");
  };

  const togglePayNow = (checked) => {
    setPayNowOn(checked);
    setError("");
    // installments added earlier must come after today's payment
    if (checked) setRows((prev) => prev.filter((r) => r.dueDate > today()));
  };

  const submit = (e) => {
    e.preventDefault();
    setError("");

    if (mode === "AUTO") {
      if (autoCount < 2) {
        setError("An installment plan needs at least 2 installments");
        return;
      }
      onSubmit({
        numberOfInstallments: autoCount,
        firstDueDate,
        frequency,
      });
      return;
    }

    if (payNowOn) {
      if (!(payNowAmount > 0)) {
        setError(
          isOrder
            ? "Enter the amount the customer is paying now"
            : "Enter the amount you are paying now",
        );
        return;
      }
      if (known && payNowAmount >= pending - 0.004) {
        setError(
          "The amount paid now must be less than the pending amount. To pay everything at once, record a full payment instead.",
        );
        return;
      }
    }
    if (rows.length + (payNowOn ? 1 : 0) < 2) {
      setError("A plan needs at least 2 installments");
      return;
    }
    if (known && Math.abs(remaining) > 0.004) {
      setError(
        remaining > 0
          ? `${money(remaining)} is still not allocated to an installment`
          : `Installments are ${money(-remaining)} more than the pending amount`,
      );
      return;
    }

    const installments = [
      ...(payNowOn ? [{dueAmount: payNowAmount, dueDate: today()}] : []),
      ...rows.map((r) => ({
        dueAmount: Number(r.dueAmount),
        dueDate: r.dueDate,
        remark: r.remark || undefined,
      })),
    ];
    onSubmit({
      installments,
      ...(payNowOn
        ? {
            initialPayment: {
              amount: payNowAmount,
              paymentDate: today(),
              paymentMethod: method,
              receivingAccountId:
                method !== "CASH" && accountId ? Number(accountId) : undefined,
              transactionReference:
                method !== "CASH" && reference.trim()
                  ? reference.trim()
                  : undefined,
            },
          }
        : {}),
    });
  };

  const th =
    "border border-blue-300 bg-blue-400 px-3 py-2 text-sm font-bold text-white";
  const cell = "border border-slate-200 px-3 py-1.5 text-center text-sm";
  const invNo = (n) => (isOrder ? `INV-${orderId}-${n}` : `#${n}`);
  const tabBtn = (active) =>
    `cursor-pointer rounded-md px-4 py-2 text-xs font-bold uppercase ${
      active
        ? "bg-blue-700 text-white"
        : "border border-blue-600 bg-white text-blue-700 hover:bg-blue-50"
    }`;

  // Rows of the installment table (same look as the installment details window)
  const tableRows =
    mode === "AUTO"
      ? preview.map((row, i) => ({
          key: i,
          no: i + 1,
          amount: <>{row.amount}</>,
          date: row.dueDate,
        }))
      : [
          ...(payNowOn
            ? [
                {
                  key: "now",
                  no: 1,
                  amount: <>{payNowAmount || 0}</>,
                  date: today(),
                  note: "Paid now",
                },
              ]
            : []),
          ...rows.map((r, i) => ({
            key: `r${i}`,
            no: i + 1 + (payNowOn ? 1 : 0),
            index: i,
            amount: <>{Number(r.dueAmount)}</>,
            date: r.dueDate,
            remark: r.remark,
          })),
        ];

  return (
    <form
      onSubmit={submit}
      className="space-y-3"
    >
      <div className="flex flex-wrap items-center gap-2">
        {["AUTO", "CUSTOM"].map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setError("");
              setShowRowForm(false);
            }}
            className={tabBtn(mode === m)}
          >
            {m === "AUTO" ? "Equal parts" : "Custom amounts"}
          </button>
        ))}
      </div>

      {mode === "AUTO" ? (
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-28">
            <label className={labelCls}>Installments</label>
            <input
              type="number"
              min="2"
              max="60"
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
              min={today()}
              value={firstDueDate}
              onChange={(e) => setFirstDueDate(e.target.value)}
              className={inputCls}
            />
          </div>
          <div className="w-40">
            <label className={labelCls}>Frequency</label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className={inputCls}
            >
              {FREQUENCIES.map((f) => (
                <option
                  key={f}
                  value={f}
                >
                  {f}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : (
        <>
          {canPayNow && (
            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
                <label className="flex cursor-pointer items-center gap-2 self-center text-sm font-semibold text-slate-800">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={payNowOn}
                    onClick={() => togglePayNow(!payNowOn)}
                    className={`relative inline-flex h-4 w-8 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                      payNowOn ? "bg-blue-700" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-3 w-3 rounded-full bg-white shadow transition-transform ${
                        payNowOn ? "translate-x-4" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                  {isOrder ? "Pay deposit now" : "Pay vendor deposit now"}
                </label>

                {payNowOn && (
                  <>
                    <div className="w-32">
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        max={pending}
                        required
                        placeholder="Amount"
                        aria-label="Amount paid now"
                        value={payNow}
                        onChange={(e) => setPayNow(e.target.value)}
                        className={inputCls}
                      />
                    </div>
                    <PaymentFields
                      isOrder={isOrder}
                      accounts={accounts}
                      method={method}
                      setMethod={setMethod}
                      accountId={accountId}
                      setAccountId={setAccountId}
                      reference={reference}
                      setReference={setReference}
                    />
                  </>
                )}
              </div>
            </div>
          )}

          {/* ADD INSTALLMENT -> small form (Amount / Due date / Remark) */}
          <div>
            <button
              type="button"
              disabled={showRowForm}
              onClick={() => setShowRowForm(true)}
              className="cursor-pointer rounded-md bg-blue-700 px-4 py-2 text-xs font-bold uppercase text-white disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
            >
              Add installment
            </button>
          </div>

          {showRowForm && (
            <InstallmentEntryForm
              defaultAmount={remaining > 0.004 ? remaining.toFixed(2) : ""}
              maxAmount={known ? Math.max(0, remaining) : null}
              minDate={minRowDate}
              hint={
                known
                  ? `Left to allocate: ${money(Math.max(0, remaining))}`
                  : null
              }
              onSubmit={addRow}
              onCancel={() => setShowRowForm(false)}
            />
          )}
        </>
      )}

      {tableRows.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className={th}>{isOrder ? "Invoice No" : "No"}</th>
                <th className={th}>Amount</th>
                <th className={th}>Due Date</th>
                {mode === "CUSTOM" && <th className={th}>Remark</th>}
                {mode === "CUSTOM" && <th className={th}>Action</th>}
              </tr>
            </thead>
            <tbody>
              {tableRows.map((r, i) => (
                <tr
                  key={r.key}
                  className={i % 2 === 0 ? "bg-slate-100" : "bg-white"}
                >
                  <td className={cell}>{invNo(r.no)}</td>
                  <td className={cell}>{r.amount}</td>
                  <td className={cell}>{r.date}</td>
                  {mode === "CUSTOM" && (
                    <td className={cell}>{r.remark || "-"}</td>
                  )}
                  {mode === "CUSTOM" && (
                    <td className={cell}>
                      {r.note ? (
                        <span className="font-bold text-green-700">
                          {r.note}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            setRows((prev) =>
                              prev.filter((_, idx) => idx !== r.index),
                            )
                          }
                          className="cursor-pointer rounded-md p-1.5 text-red-600 hover:bg-red-50"
                          aria-label="Remove installment"
                          title="Remove installment"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {mode === "CUSTOM" &&
        (known ? (
          <div className="flex flex-wrap items-center gap-x-8 gap-y-1 text-sm">
            <span>
              Pending to plan: <b>{money(pending)}</b>
            </span>
            <span>
              Paid now: <b className="text-green-700">{money(payNowAmount)}</b>
            </span>
            <span>
              Scheduled: <b>{money(scheduled)}</b>
            </span>
            <span>
              Left to allocate:{" "}
              <b
                className={
                  Math.abs(remaining) < 0.005
                    ? "text-green-700"
                    : "text-red-600"
                }
              >
                {money(remaining)}
              </b>
            </span>
          </div>
        ) : (
          <p className="text-xs text-slate-500">
            Amounts must add up to the unpaid amount.
          </p>
        ))}

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="cursor-pointer rounded-md bg-blue-700 px-5 py-2 text-xs font-bold uppercase text-white disabled:opacity-50"
        >
          {isPending
            ? "Creating..."
            : mode === "CUSTOM" && payNowOn
              ? "Pay now & create plan"
              : "Create plan"}
        </button>
      </div>
    </form>
  );
}
