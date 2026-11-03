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

## Responsive + speed round
- Navbar: compact on phones, profile menu opens on tap (hover menus do not work on touch screens, so logout was unreachable on a phone).
- Layout uses the real phone viewport height (`h-dvh`, `dvh` units for pop-up heights); content is capped on very wide screens.
- Login stacks vertically on phones; header tabs swipe sideways; pagination centred on phones.
- Tables scroll sideways inside their box instead of being cut off (orders, products, shipments, batches, receipt).
- Pop-up windows scroll inside the screen when taller than the phone; fields are 16px on phones so iPhones do not zoom in; no stray horizontal page scroll; reduced-motion respected.
- `utils/lazyModal.jsx`: big pop-ups (create order, invoice, product details, stock, installments, shipment) are downloaded only when first opened.
- Fixed 3 imports with the wrong letter case in the login page (`./Portalgrid`, `./Accessnav`, `./Brandmark`): they work on Windows but break a build on Linux servers.

## Installment window redesign
- Opens on **Custom amounts** with the add-installment form already showing: Status (Pending / Paid) | Amount | Due date | Remark | Add.
  - Paid = the deposit: it becomes installment #1 (due today), asks the payment method / account / transaction ID (not for cash) and is paid when the plan is created. Only one deposit.
  - Pending rows are kept in date order; a table of what was added is shown with Paid / Pending badges.
- The plan table has a **Status dropdown** (Pending / Paid). Choosing Paid opens the payment form under the row (date, method, account, transaction ID); a paid installment is locked.
- `Components/Form/Select.jsx` now also works with plain state (`value` / `onChange`, `showPlaceholder={false}`) besides react-hook-form.

## Installment window, round 2
- No "Update installment" button: click an **invoice number** in the plan table to open the update table (that row highlighted). Paid installments cannot be changed.
- Choosing **Paid** in the Status dropdown turns that same table row into an inline payment form: installment date, method, account, Txn ID (not for cash), SAVE.
- Create form: Status / Amount / Date / Remark / payment details (when Paid) / Add on one line; the modal is wider (max-w-7xl).
- The installment table is always shown in Custom amounts (empty until the first installment is added).
- Top line while creating: Total, Paid, Pending, Scheduled, Left to allocate (live). The line under the table is gone.
- **Schedule the rest later** (orders): create a plan with only some installments (even one) and add the rest later with "Add installment".

## Refund, plan form, add-installment row
- Order list: a cancelled order that had payments shows **Refund** (hover: amount), one with no payments shows **Cancelled**. Edit order > Status Cancelled explains that the received amount becomes REFUND.
- The installment window of a cancelled order is read-only and tells the refund amount.
- Create plan: the "Schedule the rest later" tick box is gone. If some amount is still left, **Create plan** creates the plan with the installments added (orders); the rest is added later with Add installment. Vendor bills still need the full amount.
- Add installment form: Add and Cancel are in the same row as Amount / Due date / Remark.

## Installment window redesign, round 3
- No "Create plan" button: **Add** saves each installment straight away (the first one creates the plan, the next ones are added to it). Paid = paid at once (method / account / Txn ID on the same line); a Pending installment is paid later from the table (Status > Paid).
- The Add installment form is hidden until the **Add installment** button is clicked; it stays open while some amount is left.
- Tabs before the first installment: **Custom installment** | **Equal parts** (equal parts keeps one "Create installments" button).
- One table for both states: Invoice No | Amount | Due Date | Remark | Paid Date | Payment Method | Status | Invoice (empty until the first installment).
- Top line: Total / Paid / Pending / Scheduled / Left to allocate.
- Whole app: normal weight text, bold only in table headers and buttons (`keep-bold` for the main menu tabs); every word starts with a capital letter (display only).
