import {money} from "../../utils/format";

/*
 * "Vendor Payment" block shared by Add Product and Restock (Update Stock).
 *
 *  Payment status dropdown:
 *    Complete     -> the whole bill is paid now: payment method (+ Transaction ID, hidden for cash)
 *    Installment  -> nothing is shown and nothing is paid now. The bill is saved as "Installment"
 *                    and its plan is created from the Vendor Bills page.
 */

export const VENDOR_PAYMENT_OPTIONS = [
  {value: "COMPLETE", label: "Complete"},
  {value: "INSTALLMENT", label: "Installment"},
];


const inputCls =
  "h-8 w-full rounded border border-slate-300 bg-white px-2 text-xs outline-none focus:border-blue-500";
const labelCls = "mb-1 block text-xs font-semibold text-slate-700";

export default function VendorPaymentSection({
  status, // "COMPLETE" | "INSTALLMENT"
  onStatusChange,
  totalBill,
  method,
  onMethodChange,
  reference,
  onReferenceChange,
}) {
  const isComplete = status === "COMPLETE";
  const isCash = method === "CASH";

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-xs">
      <div className="grid grid-cols-2 items-end gap-3 sm:grid-cols-4">
        <div className="flex flex-col">
          <label className={labelCls}>Vendor Payment Status</label>
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            className={inputCls}
          >
            {VENDOR_PAYMENT_OPTIONS.map((o) => (
              <option
                key={o.value}
                value={o.value}
              >
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {isComplete && (
          <>
            <div className="flex flex-col">
              <label className={labelCls}>Amount to Pay</label>
              <div className="flex h-8 w-full items-center rounded border border-slate-200 bg-slate-100 px-2 text-xs font-semibold text-slate-700">
                {money(totalBill)}
              </div>
            </div>

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

            {/* Cash has no transaction id */}
            {!isCash && (
              <div className="flex flex-col">
                <label className={labelCls}>Transaction ID</label>
                <input
                  placeholder="UPI / bank reference"
                  value={reference}
                  onChange={(e) => onReferenceChange(e.target.value)}
                  className={inputCls}
                />
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
