import {useEffect, useState} from "react";
import {Printer} from "lucide-react";
import {money} from "../../utils/format";
import Select from "../Form/Select";
import {METHOD_OPTIONS, fieldCls, today} from "./installmentHelpers";
import PaymentFields from "./PaymentFields";

// ----------------------------------------------------------- installment row
// Columns: Invoice No | Amount | Due Date | Paid Date | Remark | Status | Method | Invoice
// Invoice No      -> click to open the update table (orders)
// Status          -> dropdown Pending / Paid / Refund.
//                    Paid   turns THIS row into the payment form:
//                           [Installment date] ... [Paid] [method] [account] [Txn ID] [SAVE]
//                    Refund (only for an installment that received money) cancels the order and marks the
//                           received money as REFUND. After that every paid installment shows "Refund".
// Invoice print button at the end (orders only).
export default function InstallmentRow({
  inst,
  index,
  orderId,
  isOrder,
  accounts,
  isSaving,
  onSave,
  onPrint,
  onOpenUpdate, // (installment) => void, orders only
  onRefund, // (installment) => void, orders only: asks to cancel the order -> REFUND
  isRefunding = false,
  locked = false, // cancelled order: no more payments
}) {
  const [open, setOpen] = useState(false); // payment form
  const [date, setDate] = useState(today());
  const [method, setMethod] = useState("CASH");
  const [accountId, setAccountId] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  const isCash = method === "CASH";
  const isPaid = inst.status === "PAID";
  const isPartial = inst.status === "PARTIAL";
  const hasMoney = isPaid || isPartial;
  // Cancelled order + this installment had received money -> it is shown as Refund
  const isRefund = locked && hasMoney;
  const statusValue = isRefund ? "REFUND" : isPaid || open ? "PAID" : "PENDING";
  const lastPayment = (inst.payments || []).reduce(
    (latest, p) => (!latest || p.paymentDate > latest ? p.paymentDate : latest),
    "",
  );
  // Payment method(s) the money of this installment came in with
  const methodLabel =
    [
      ...new Set(
        (inst.payments || [])
          .map((p) => p.paymentMethod)
          .filter(Boolean)
          .map(
            (m) => METHOD_OPTIONS.find((o) => o.value === m)?.label || m,
          ),
      ),
    ].join(", ") || "-";
  const label = isOrder
    ? `INV-${orderId}-${inst.installmentNumber}`
    : `#${inst.installmentNumber}`;

  // Payment saved -> the row turns Paid, close the form
  useEffect(() => {
    if (isPaid) setOpen(false);
  }, [isPaid]);

  const statusOptions = [
    {value: "PENDING", label: "Pending", disabled: isPaid || isRefund},
    {value: "PAID", label: "Paid", disabled: isRefund},
    {
      value: "REFUND",
      label: "Refund",
      // only an installment that received money can be refunded (and only through an order that is not cancelled yet)
      disabled: !(hasMoney && (isRefund || onRefund)),
    },
  ];

  const handleStatusChange = (value) => {
    if (value === "REFUND") {
      setOpen(false);
      onRefund?.(inst);
      return;
    }
    setOpen(value === "PAID");
  };

  const save = () =>
    onSave({
      installmentId: inst.id,
      amount: Number(inst.pendingAmount),
      paymentDate: date,
      paymentMethod: method,
      // Cash has no transaction id / bank account
      transactionReference:
        !isCash && reference.trim() ? reference.trim() : undefined,
      ...(isOrder
        ? {
            receivingAccountId:
              !isCash && accountId ? Number(accountId) : undefined,
          }
        : {notes: notes.trim() || undefined}),
    });

  const rowBg = index % 2 === 0 ? "bg-slate-100" : "bg-white";
  const cell = "border border-slate-200 px-3 py-2 text-center text-sm";

  return (
    <tr className={rowBg}>
      <td className={cell}>
        {isOrder && onOpenUpdate ? (
          <button
            type="button"
            onClick={() => onOpenUpdate(inst)}
            title={
              isPaid
                ? "A paid installment cannot be changed"
                : "Click to update the installments"
            }
            className="cursor-pointer font-semibold text-blue-700 underline-offset-2 hover:underline"
          >
            {label}
          </button>
        ) : (
          label
        )}
      </td>
      <td className={cell}>
        {money(inst.dueAmount)}
        {isPartial && (
          <div className="text-[11px] text-amber-700">
            Paid {money(inst.paidAmount)} · Pending {money(inst.pendingAmount)}
          </div>
        )}
      </td>
      <td className={cell}>
        {inst.dueDate}
        {inst.overdue && !isPaid && (
          <div className="text-[11px] font-bold text-red-600">OVERDUE</div>
        )}
      </td>

      {/* Installment date: the payment date while the payment form is open */}
      <td className={cell}>
        {open && !isPaid ? (
          <input
            type="date"
            value={date}
            max={today()}
            onChange={(e) => setDate(e.target.value)}
            className={`${fieldCls} py-1.5 sm:text-sm`}
            aria-label="Payment date"
          />
        ) : (
          lastPayment || "-"
        )}
      </td>

      <td className={`${cell} max-w-48 wrap-break-word`}>
        {inst.remark || "-"}
      </td>

      {/* Status dropdown; when Paid is chosen the payment details open on the same line */}
      <td className={cell}>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <div className="w-28">
            <Select
              id={`installment-status-${inst.id}`}
              value={statusValue}
              disabled={
                isSaving ||
                isRefunding ||
                isRefund ||
                (locked && !hasMoney) ||
                (isPaid && !onRefund)
              }
              showPlaceholder={false}
              options={statusOptions}
              className={`py-1.5 sm:text-sm ${
                isRefund
                  ? "font-semibold text-rose-700"
                  : isPaid
                    ? "font-semibold text-green-700"
                    : open
                      ? "font-semibold text-blue-700"
                      : "text-amber-700"
              }`}
              onChange={(e) => handleStatusChange(e.target.value)}
            />
          </div>

          {open && !isPaid && (
            <>
              <PaymentFields
                compact
                isOrder={isOrder}
                accounts={accounts}
                method={method}
                setMethod={setMethod}
                accountId={accountId}
                setAccountId={setAccountId}
                reference={reference}
                setReference={setReference}
              />
              {!isOrder && (
                <input
                  placeholder="Notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className={`${fieldCls} w-32 py-1.5 sm:text-sm`}
                />
              )}
              <button
                type="button"
                disabled={isSaving || !date}
                onClick={save}
                className="cursor-pointer rounded-md bg-blue-700 px-4 py-1.5 text-xs font-bold uppercase text-white disabled:opacity-50"
              >
                {isSaving ? "..." : "Save"}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="cursor-pointer text-xs font-bold uppercase text-slate-500 hover:underline"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </td>

      <td className={cell}>{methodLabel}</td>

      {isOrder && (
        <td className={cell}>
          <button
            type="button"
            onClick={onPrint}
            title="Print invoice of this installment"
            aria-label={`Print invoice of installment ${inst.installmentNumber}`}
            className="inline-flex cursor-pointer items-center justify-center rounded-md border border-slate-300 bg-white p-2 text-slate-700 hover:bg-slate-50"
          >
            <Printer className="h-4 w-4" />
          </button>
        </td>
      )}
    </tr>
  );
}