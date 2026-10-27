/*
 * Payment status of a vendor bill - ONE place for the list, the detail window and the filters.
 *
 *   Complete     everything is paid (paid now, or through the installments)
 *   Installment  the bill was bought as "Installment" or already has a plan.
 *                Clicking it opens the installment window (create the plan / pay the installments)
 *   Partial      some money paid, some still due (no installment mode)
 *   Unpaid       nothing paid yet (no installment mode)
 *
 * These come from what the backend saved: paymentStatus, dueAmount / remainingAmount
 * and installmentRequested of the bill (installmentRequested is also saved when a plan is created).
 */

const BADGE = "inline-block rounded-full px-2.5 py-1 text-[11px] font-bold";

export const VENDOR_BILL_STATUS_FILTERS = [
  {value: "ALL", label: "All statuses"},
  {value: "COMPLETE", label: "Complete"},
  {value: "INSTALLMENT", label: "Installment"},
  {value: "PARTIAL", label: "Partial"},
  {value: "UNPAID", label: "Unpaid"},
];

export const getVendorBillPaymentDisplay = (bill, hasPlan = false) => {
  const due = Number(bill?.dueAmount ?? bill?.remainingAmount ?? 0);
  const total = Number(bill?.totalAmount ?? 0);
  const paid = Number(bill?.paidAmount ?? 0);
  const isComplete = bill?.paymentStatus === "PAID" || (total > 0 && due <= 0.009);

  if (isComplete) {
    return {
      key: "COMPLETE",
      label: "Complete",
      style: "bg-emerald-100 text-emerald-700",
      opensInstallments: hasPlan,
    };
  }
  if (hasPlan || bill?.installmentRequested) {
    return {
      key: "INSTALLMENT",
      label: "Installment",
      style: "bg-violet-100 text-violet-700",
      opensInstallments: true,
    };
  }
  if (paid > 0 || bill?.paymentStatus === "PARTIAL") {
    return {
      key: "PARTIAL",
      label: "Partial",
      style: "bg-blue-100 text-blue-700",
      opensInstallments: false,
    };
  }
  return {
    key: "UNPAID",
    label: "Unpaid",
    style: "bg-amber-100 text-amber-700",
    opensInstallments: false,
  };
};

export default function VendorBillStatusBadge({bill, hasPlan = false, onOpen}) {
  const display = getVendorBillPaymentDisplay(bill, hasPlan);

  if (!display.opensInstallments || !onOpen) {
    return <span className={`${BADGE} ${display.style}`}>{display.label}</span>;
  }

  return (
    <button
      type="button"
      onClick={() => onOpen(bill)}
      title="Open installment plan"
      className={`${BADGE} ${display.style} cursor-pointer underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400`}
    >
      {display.label}
    </button>
  );
}
