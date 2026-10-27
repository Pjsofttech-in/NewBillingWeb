import {useRef} from "react";
import {useQuery} from "@tanstack/react-query";
import {Printer, Receipt, X} from "lucide-react";

import {fetchStoreProfile} from "../api/storeSettingsApi";
import {money} from "../utils/format";


const METHOD_LABELS = {
  CASH: "Cash",
  UPI: "UPI",
  CREDIT_CARD: "Credit Card",
  DEBIT_CARD: "Debit Card",
  NET_BANKING: "Net Banking",
};

const RECEIPT_CSS = `
  .rc { font-family: Arial, Helvetica, sans-serif; color: #0f172a; font-size: 13px; }
  .rc-head { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 10px; }
  .rc-store { font-size: 18px; font-weight: 700; }
  .rc-muted { color: #64748b; font-size: 12px; }
  .rc-title { text-align: center; font-size: 15px; font-weight: 700; letter-spacing: 1px; margin: 8px 0; }
  .rc-grid { display: flex; justify-content: space-between; gap: 16px; margin-bottom: 10px; }
  .rc-grid > div { flex: 1; }
  .rc-right { text-align: right; }
  .rc table { width: 100%; border-collapse: collapse; margin: 8px 0; }
  .rc th { background: #f1f5f9; text-align: left; font-size: 12px; }
  .rc th, .rc td { border: 1px solid #cbd5e1; padding: 5px 7px; }
  .rc td.num, .rc th.num { text-align: right; }
  .rc-totals { margin-left: auto; width: 60%; }
  .rc-totals div { display: flex; justify-content: space-between; padding: 3px 0; }
  .rc-totals .strong { font-weight: 700; border-top: 1px solid #0f172a; margin-top: 3px; padding-top: 5px; }
  .rc-paid { color: #047857; }
  .rc-pending { color: #b45309; }
  .rc-foot { text-align: center; margin-top: 14px; border-top: 1px dashed #94a3b8; padding-top: 8px; }
`;

/**
 * Receipt of the money paid against ONE installment of an order.
 * - `payments` = the payment(s) printed on this receipt (one payment, or every payment of the installment).
 * - Order totals are "as of" the last printed payment, so the first installment's receipt shows the
 *   balance after the first installment and the second receipt the balance after the second one.
 */
export default function InstallmentReceiptModal({
  plan,
  order,
  installment,
  payments,
  onClose,
}) {
  const printRef = useRef(null);

  const {data: store} = useQuery({
    queryKey: ["storeProfile"],
    queryFn: fetchStoreProfile,
    retry: false,
  });

  // No payment yet (unpaid installment): the invoice is "as of now" and dated with the due date.
  const lastPaymentId = payments.length
    ? Math.max(...payments.map((p) => Number(p.id)))
    : Infinity;
  const lastPaymentDate = payments.length
    ? payments.reduce(
        (latest, p) =>
          !latest || p.paymentDate > latest ? p.paymentDate : latest,
        "",
      )
    : installment.dueDate;
  const paidNow = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  // Installment level
  const installmentPaidTillNow = (installment.payments || [])
    .filter((p) => Number(p.id) <= lastPaymentId)
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const installmentPending = Math.max(
    0,
    Number(installment.dueAmount || 0) - installmentPaidTillNow,
  );

  // Order level: everything paid up to (and including) this receipt
  const paymentsAfterThis = plan.installments
    .flatMap((inst) => inst.payments || [])
    .filter((p) => Number(p.id) > lastPaymentId)
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const orderTotal = order ? Number(order.totalAmount || 0) : plan.planAmount;
  const orderPaidTillNow = order
    ? Math.max(0, Number(order.paidAmount || 0) - paymentsAfterThis)
    : Math.max(0, Number(plan.paidAmount || 0) - paymentsAfterThis);
  const orderBalance = Math.max(0, Number(orderTotal) - orderPaidTillNow);

  const receiptNo = `INV-${plan.referenceId}-${installment.installmentNumber}`;

  const print = () => {
    const win = window.open("", "_blank", "width=800,height=900");
    if (!win) return;
    win.document.write(
      `<html><head><title>${receiptNo}</title><style>body{margin:24px}${RECEIPT_CSS}</style></head><body>${printRef.current.innerHTML}</body></html>`,
    );
    win.document.close();
    win.focus();
    win.print();
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-blue-500 px-5 py-3 text-white">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-blue-100" />
            <h2 className="text-base font-bold">
              Installment invoice — {receiptNo}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-5">
          <style>{RECEIPT_CSS}</style>
          <div
            ref={printRef}
            className="rc"
          >
            <div className="rc-head">
              <div className="rc-store">{store?.storeName || "Store"}</div>
              {store?.address && (
                <div className="rc-muted">{store.address}</div>
              )}
              <div className="rc-muted">
                {[
                  store?.phoneNumber && `Phone: ${store.phoneNumber}`,
                  store?.email,
                  store?.gstin && `GSTIN: ${store.gstin}`,
                ]
                  .filter(Boolean)
                  .join("  |  ")}
              </div>
            </div>

            <div className="rc-title">INSTALLMENT INVOICE</div>

            <div className="rc-grid">
              <div>
                <div className="rc-muted">Billed to</div>
                <b>{order?.customer?.customerName || plan.partyName || "—"}</b>
                {order?.customer?.phone && <div>{order.customer.phone}</div>}
              </div>
              <div className="rc-right">
                <div>
                  <b>Invoice no:</b> {receiptNo}
                </div>
                <div>
                  <b>{payments.length ? "Date" : "Due date"}:</b>{" "}
                  {lastPaymentDate}
                </div>
                <div>
                  <b>Order:</b> #{plan.referenceId}
                  {order?.orderDate ? ` (${order.orderDate})` : ""}
                </div>
                <div>
                  <b>Installment:</b> {installment.installmentNumber} of{" "}
                  {plan.totalInstallments}
                </div>
              </div>
            </div>

            {payments.length > 0 && (
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Method</th>
                    <th>Transaction ID</th>
                    <th className="num">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td>{p.paymentDate}</td>
                      <td>
                        {METHOD_LABELS[p.paymentMethod] || p.paymentMethod}
                      </td>
                      <td>{p.transactionReference || "—"}</td>
                      <td className="num">{money(p.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div className="rc-totals">
              <div className="strong">
                <span>Amount received</span>
                <span className="rc-paid">{money(paidNow)}</span>
              </div>
              <div>
                <span>Installment {installment.installmentNumber} amount</span>
                <span>{money(installment.dueAmount)}</span>
              </div>
              <div>
                <span>Installment paid</span>
                <span className="rc-paid">{money(installmentPaidTillNow)}</span>
              </div>
              <div>
                <span>Installment pending</span>
                <span className="rc-pending">{money(installmentPending)}</span>
              </div>
              <div className="strong">
                <span>Order total</span>
                <span>{money(orderTotal)}</span>
              </div>
              <div>
                <span>Total paid till now</span>
                <span className="rc-paid">{money(orderPaidTillNow)}</span>
              </div>
              <div>
                <span>Balance pending</span>
                <span className="rc-pending">{money(orderBalance)}</span>
              </div>
            </div>

            <div className="rc-foot rc-muted">
              Thank you. This is a computer generated invoice.
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg border px-4 py-2 text-xs font-semibold hover:bg-slate-50"
          >
            Close
          </button>
          <button
            type="button"
            onClick={print}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
          >
            <Printer className="h-3.5 w-3.5" /> Print / Save as PDF
          </button>
        </div>
      </div>
    </div>
  );
}
