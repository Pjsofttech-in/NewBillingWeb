import {useState} from "react";
import {Printer} from "lucide-react";
import {METHODS, today} from "./installmentHelpers";

// ----------------------------------------------------------- installment row
// Status / Action cell:
//   Completed            -> green text
//   otherwise            -> "MARK COMPLETE" button; click -> date + method + SAVE
// Followed by the invoice print button (orders only).
export default function InstallmentRow({
  inst,
  index,
  orderId,
  isOrder,
  accounts,
  isSaving,
  onSave,
  onPrint,
}) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(today());
  const [method, setMethod] = useState("CASH");
  const [accountId, setAccountId] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  const isCash = method === "CASH";
  const isPaid = inst.status === "PAID";
  const lastPayment = (inst.payments || []).reduce(
    (latest, p) => (!latest || p.paymentDate > latest ? p.paymentDate : latest),
    "",
  );

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
        {isOrder
          ? `INV-${orderId}-${inst.installmentNumber}`
          : `#${inst.installmentNumber}`}
      </td>
      <td className={cell}>
        {Number(inst.dueAmount)}
        {inst.status === "PARTIAL" && (
          <div className="text-[11px] text-amber-700">
            Paid {Number(inst.paidAmount)} · Pending
            {Number(inst.pendingAmount)}
          </div>
        )}
      </td>
      <td className={cell}>
        {inst.dueDate}
        {inst.remark && (
          <div className="text-[11px] text-slate-500">{inst.remark}</div>
        )}
        {inst.overdue && !isPaid && (
          <div className="text-[11px] font-bold text-red-600">OVERDUE</div>
        )}
      </td>
      <td className={cell}>
        {open ? (
          <input
            type="date"
            value={date}
            max={today()}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
        ) : (
          lastPayment || "-"
        )}
      </td>
      <td className={cell}>
        {isPaid ? (
          <span className="font-bold text-green-700">Completed</span>
        ) : open ? (
          <div className="flex flex-wrap items-center justify-center gap-2">
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            >
              {METHODS.map((m) => (
                <option
                  key={m}
                  value={m}
                >
                  {m === "CASH" ? "Cash" : m.replace("_", " ")}
                </option>
              ))}
            </select>
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
              className="cursor-pointer text-xs text-slate-500 hover:underline"
            >
              Cancel
            </button>

            {!isCash && isOrder && (
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
              >
                <option value="">No bank account</option>
                {accounts.map((a) => (
                  <option
                    key={a.id}
                    value={a.id}
                  >
                    {a.accountName || a.bankName}
                  </option>
                ))}
              </select>
            )}
            {!isCash && (
              <input
                placeholder="Transaction ID"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
              />
            )}
            {!isOrder && (
              <input
                placeholder="Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
              />
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="cursor-pointer rounded-md border border-blue-600 bg-white px-3 py-1.5 text-xs font-bold uppercase text-blue-700 hover:bg-blue-50"
          >
            Mark complete
          </button>
        )}
      </td>
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
