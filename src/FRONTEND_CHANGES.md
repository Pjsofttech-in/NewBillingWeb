# Frontend sync notes
Added: Dues page (/dues), vendor-bill "Record payment", product "Stock movements" tab,
sub-category edit, shipment receipt PDF download, nav tabs (Vendor Bills, Dues),
/profile + catch-all routes, extra API helpers (products summary/by id/stock history,
dashboard pending/daily/order-wise, vendor bills list/by id/payments, payments list/delete,
bank-details, sub-category update/by id/with-types, shipment by id).
Not in backend: GET /api/vendor-bills/print/{id} is documented but VendorBillController does not expose it.

Round 2: Product Type table -> "Sub category" action (+count column); dashboard Pending per period;
shipment receipt dialog after create; labelled "Installments" button on orders; dashboard dues -> /dues link.
