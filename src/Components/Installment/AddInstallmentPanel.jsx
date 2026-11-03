import {useState} from "react";
import {money} from "../../utils/format";
import Select from "../Form/Select";
import {
  STATUS_OPTIONS,
  dueDateFor,
  fieldCls,
  fieldLabelCls,
  today,
} from "./installmentHelpers";
import PaymentFields from "./PaymentFields";

const round2 = (n) => Math.round(Number(n) * 100) / 100;

/**
 * The "Add installment" form. Order of the fields:
 *
 *   Amount | Paid / Pending | Due date (Pending) or Paid date (Paid) | Remark | (payment details when Paid) | ADD | CANCEL
 *
 *  - Nothing is chosen at first: only Amount and Paid / Pending show until one is selected.
 *  - Pending: only the due date is asked.
 *  - Paid:    only the paid date is asked - method / account / transaction ID follow on the same line.
 *  - Remark is shown for both (after the date, before the payment method).
 *
 * ADD saves the installment straight away (the parent creates the plan with the first one and adds the following
 * ones). An installment that is still Pending can be paid later from the table below (Status > Paid).
 *
 *  unallocated  = amount that is not in any installment yet (null when unknown)
 *  defaultAmount / afterDate = what the form starts with (the parent sets them after every add)
 */
export default function AddInstallmentPanel({
  isOrder,
  accounts,
  unallocated,
  defaultAmount = "",
  afterDate = null,
  busy = false,
  onAdd, // async ({dueAmount, dueDate, paidDate, remark, paid, payment}) => void ; throws when it fails
  onCancel,
}) {
  const known = unallocated !== null && unallocated !== undefined;
  const [status, setStatus] = useState("");
  const [amount, setAmount] = useState(String(defaultAmount ?? ""));
  const [dueDate, setDueDate] = useState(
    afterDate ? dueDateFor(afterDate, "MONTHLY", 1) : today(),
  );
  const [paidDate, setPaidDate] = useState(today());
  const [remark, setRemark] = useState("");
  const [method, setMethod] = useState("CASH");
  const [accountId, setAccountId] = useState("");
  const [reference, setReference] = useState("");
  const [error, setError] = useState("");

  const isPaid = status === "PAID";
  const isPending = status === "PENDING";

  const submit = async () => {
    setError("");
    const value = round2(amount);
    if (!(value > 0)) {
      setError("Enter the installment amount");
      return;
    }
    if (known && value > round2(unallocated) + 0.004) {
      setError(`Amount cannot be more than ${money(unallocated)}`);
      return;
    }
    if (!isPaid && !isPending) {
      setError("Select Paid or Pending");
      return;
    }
    if (isPaid) {
      if (!paidDate) {
        setError("Select the paid date");
        return;
      }
      if (paidDate > today()) {
        setError("Paid date cannot be in the future");
        return;
      }
    } else {
      if (!dueDate) {
        setError("Select the due date");
        return;
      }
      if (dueDate < today()) {
        setError("Due date cannot be in the past");
        return;
      }
    }
    try {
      await onAdd({
        dueAmount: value,
        // a paid installment is due and paid on the same day it is added
        dueDate: isPaid ? today() : dueDate,
        paidDate: isPaid ? paidDate : undefined,
        remark: remark.trim(),
        paid: isPaid,
        payment: {
          method,
          accountId,
          reference: reference.trim(),
        },
      });
    } catch {
      /* the parent already showed the error; keep the values so nothing has to be typed again */
    }
  };

  return (
    <div
      className="rounded-lg border border-slate-200 bg-slate-50 p-3"
      onKeyDown={(e) => {
        // Enter in a field adds the installment
        if (e.key === "Enter" && e.target.tagName === "INPUT") {
          e.preventDefault();
          submit();
        }
      }}
    >
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-full sm:w-32">
          <label className={fieldLabelCls}>Amount</label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={fieldCls}
          />
        </div>
        <div className="w-full sm:w-40">
          <Select
            label="Paid / Pending"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setError("");
            }}
            placeholder="Select"
            options={STATUS_OPTIONS}
          />
        </div>
        {isPaid && (
          <div className="w-full sm:w-44">
            <label className={fieldLabelCls}>Paid date</label>
            <input
              type="date"
              max={today()}
              value={paidDate}
              onChange={(e) => setPaidDate(e.target.value)}
              className={fieldCls}
            />
          </div>
        )}
        {isPending && (
          <div className="w-full sm:w-44">
            <label className={fieldLabelCls}>Due date</label>
            <input
              type="date"
              min={today()}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={fieldCls}
            />
          </div>
        )}
        {(isPaid || isPending) && (
          <div className="w-full sm:min-w-40 sm:flex-1">
            <label className={fieldLabelCls}>Remark</label>
            <input
              type="text"
              maxLength={255}
              placeholder="Remark"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              className={fieldCls}
            />
          </div>
        )}

        {/* Paid: the payment details sit on the same line */}
        {isPaid && (
          <PaymentFields
            inline
            isOrder={isOrder}
            accounts={accounts}
            method={method}
            setMethod={setMethod}
            accountId={accountId}
            setAccountId={setAccountId}
            reference={reference}
            setReference={setReference}
          />
        )}

        <div className="flex items-center gap-3 pb-1">
          <button
            type="button"
            disabled={busy}
            onClick={submit}
            className="cursor-pointer rounded-md bg-blue-700 px-6 py-2.5 text-xs font-bold uppercase text-white disabled:opacity-50"
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

      {known && (
        <p className="mt-2 text-xs text-slate-500">
          Left to allocate: {money(unallocated)}
        </p>
      )}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
