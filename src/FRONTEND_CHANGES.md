# Frontend sync notes
Added: Dues page (/dues), vendor-bill "Record payment", product "Stock movements" tab,
sub-category edit, shipment receipt PDF download, nav tabs (Vendor Bills, Dues),
/profile + catch-all routes, extra API helpers (products summary/by id/stock history,
dashboard pending/daily/order-wise, vendor bills list/by id/payments, payments list/delete,
bank-details, sub-category update/by id/with-types, shipment by id).
Not in backend: GET /api/vendor-bills/print/{id} is documented but VendorBillController does not expose it.

Round 2: Product Type table -> "Sub category" action (+count column); dashboard Pending per period;
shipment receipt dialog after create; labelled "Installments" button on orders; dashboard dues -> /dues link.

## Create order: Complete / Installment + installment receipts
- Create order > Payment status is only **Complete** or **Installment**.
  - Complete: Paid date + Payment method. Cash hides Receiving account and Transaction ID.
  - Installment: order is saved as before; the plan is created from the order list (click "Installment").
- InstallmentPlanModal: Total / Paid / Pending shown for Equal parts and Custom amounts (and for the created plan).
  Equal parts shows a preview of every installment. Custom amounts has "Customer pays some amount now"
  (paid amount becomes installment #1, rest is scheduled in the rows below).
- New `Components/InstallmentReceiptModal.jsx`: receipt per installment / per payment (opens automatically after a payment, print / save as PDF).
- `OrderPaymentDetailsModal.jsx` removed (payment fields are now inline in the create order form).

## Clean-up round
- `utils/format.js`: one `money` / `moneyAuto` / `moneyPlain` instead of a copy in 11 files.
- The installment window (1,400 lines) is split into `Components/Installment/*` (CreatePlanForm, InstallmentEntryForm, UpdateInstallmentsForm, InstallmentRow, PaymentFields, SummaryLine, installmentHelpers). `InstallmentPlanModal.jsx` keeps the same import path.
- Create order sends the payment of a Complete order together with the order (one request).
- About 400 lines of commented-out old code removed.
