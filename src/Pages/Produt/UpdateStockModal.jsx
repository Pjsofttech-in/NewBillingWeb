import {useEffect, useMemo, useState} from "react";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {fetchVendors} from "../../api/vendorServiceApi";
import {updateProductStock} from "../../api/productApi";
import SearchableSelect from "../../Components/Form/SearchableSelect";

const money = (v) =>
  `₹${Number(v || 0).toLocaleString("en-IN", {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

const UpdateStockModal = ({
  isOpen,
  onClose,
  product = null,
  productsList = [],
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const [selectedProductId, setSelectedProductId] = useState("");
  const [addedQuantity, setAddedQuantity] = useState("");
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [mrp, setMrp] = useState("");
  const [vendorDiscountPercentage, setVendorDiscountPercentage] = useState("");
  const [productMrp, setProductMrp] = useState("");
  // customerPrice is the ONLY manually-typed price. Store/purchase price is
  // always derived from MRP - discount%, never typed directly, so it can
  // never drift out of sync with what the vendor actually charged.
  const [customerPrice, setCustomerPrice] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [receivedDate, setReceivedDate] = useState(
    new Date().toISOString().slice(0, 10),
  );

  const [dueDate, setDueDate] = useState("");
  const [amountPaidNow, setAmountPaidNow] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [transactionRef, setTransactionRef] = useState("");
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState("");

  const activeProduct =
    product || productsList.find((p) => p.id === Number(selectedProductId));

  const {data: vendors = [], isLoading: loadingVendors} = useQuery({
    queryKey: ["vendors"],
    queryFn: fetchVendors,
    enabled: isOpen,
  });

  useEffect(() => {
    if (!isOpen) return;
    const p = product || activeProduct;
    if (p) {
      setSelectedProductId(String(p.id));
      setSelectedVendorId(p.vendor?.id ? String(p.vendor.id) : "");
      setMrp(p.mrp ?? "");
      setVendorDiscountPercentage(p.vendorDiscountPercentage ?? "");
      setCustomerPrice(p.customerPrice ?? "");
      setProductMrp(p.productMrp ?? "");
    }
    setReceivedDate(new Date().toISOString().slice(0, 10));
  }, [isOpen, product]);

  // ---- Store / Purchase Price = MRP - (MRP * discount% / 100) ----
  // This is THE single source of truth for what we pay per unit on this
  // batch. It automatically recalculates any time MRP or discount changes.
  const storePrice = useMemo(() => {
    const mrpNum = Number(mrp) || 0;
    const discountNum = Math.max(0, Math.min(100, Number(vendorDiscountPercentage) || 0));
    const calculated = mrpNum - (mrpNum * discountNum) / 100;
    return Math.max(0, Number(calculated.toFixed(2)));
  }, [mrp, vendorDiscountPercentage]);

  const updateMutation = useMutation({
    mutationFn: (payload) =>
      updateProductStock({id: activeProduct.id, ...payload}),
    onSuccess: async (updated) => {
      await Promise.all([
        queryClient.invalidateQueries({queryKey: ["products"]}),
        queryClient.invalidateQueries({
          queryKey: ["productBatches", activeProduct.id],
        }),
        queryClient.invalidateQueries({queryKey: ["vendorBills"]}),
      ]);
      onSuccess?.(updated);
      handleClose();
    },
    onError: (err) =>
      setError(err.response?.data?.message || "Failed to update stock"),
  });

  const handleClose = () => {
    setSelectedProductId("");
    setAddedQuantity("");
    setBatchNumber("");
    setProductMrp("");
    setAmountPaidNow("0");
    setTransactionRef("");
    setRemarks("");
    setDueDate("");
    setError("");
    onClose();
  };

  const currentStock = activeProduct?.stock ?? 0;
  const qty = Math.max(0, Number.parseInt(addedQuantity, 10) || 0);
  const projectedStock = currentStock + qty;
  const totalBill = storePrice * qty;
  const due = Math.max(0, totalBill - (Number(amountPaidNow) || 0));

  const vendorOptions = useMemo(
    () =>
      vendors.map((v) => ({
        label: v.vendorName || v.name,
        value: String(v.id),
      })),
    [vendors],
  );
  const productOptions = useMemo(
    () =>
      productsList.map((p) => ({
        label: `${p.productName} (Stock: ${p.stock ?? 0})`,
        value: String(p.id),
      })),
    [productsList],
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (!activeProduct) return setError("Please select a product");
    if (qty <= 0) return setError("Quantity must be greater than 0");
    if (!selectedVendorId)
      return setError("Please select the vendor for this stock batch");
    if (Number(mrp) <= 0) return setError("Vendor MRP is required");
    if (Number(productMrp) < 0)
      return setError("Actual product MRP cannot be negative");
    if (Number(customerPrice) < 0)
      return setError("Customer price cannot be negative");
    if ((Number(amountPaidNow) || 0) > totalBill)
      return setError("Paid amount cannot be greater than the vendor bill");

    // storePrice/purchasePrice and customerPrice/sellingPrice are the SAME
    // number each, sent under both names because the backend records the
    // "current product price" (storePrice/customerPrice) AND the
    // "this specific batch's price" (purchasePrice/sellingPrice) — but
    // they are never independently editable, so they can't drift apart.
    updateMutation.mutate({
      addedQuantity: qty,
      vendorId: Number(selectedVendorId),
      mrp: Number(mrp),
      vendorDiscountPercentage: Number(vendorDiscountPercentage) || 0,
      storePrice: storePrice,
      productMrp: productMrp === "" ? Number(activeProduct?.productMrp || 0) : Number(productMrp),
      customerPrice: customerPrice === "" ? storePrice : Number(customerPrice),
      batchNumber: batchNumber.trim() || null,
      receivedDate: receivedDate || null,
      dueDate: dueDate || null,
      purchasePrice: storePrice,
      sellingPrice: customerPrice === "" ? storePrice : Number(customerPrice),
      amountPaidNow: Number(amountPaidNow || 0),
      paymentMethod: Number(amountPaidNow || 0) > 0 ? paymentMethod : null,
      transactionRef: transactionRef || null,
      remarks: remarks || "Restocked via UI",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 z-10 bg-white border-b px-5 py-4 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Restock Product
            </h3>
            <p className="text-xs text-slate-500">
              New quantity + new batch prices. Existing prices are not averaged.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-700 text-xl"
          >
            ✕
          </button>
        </div>
        <form
          onSubmit={handleSubmit}
          className="p-5 space-y-5"
        >
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {!product && (
            <SearchableSelect
              label="Product"
              options={productOptions}
              value={selectedProductId}
              onChange={setSelectedProductId}
              placeholder="Select product"
            />
          )}

          {activeProduct && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-xl border">
              <div>
                <span className="text-[10px] text-slate-500 block">
                  CURRENT STOCK
                </span>
                <b>{currentStock}</b>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">
                  CURRENT STORE PRICE
                </span>
                <b>{money(activeProduct.storePrice)}</b>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">
                  CURRENT VENDOR MRP
                </span>
                <b>{money(activeProduct.mrp)}</b>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">
                  CURRENT PRODUCT MRP
                </span>
                <b>{money(activeProduct.productMrp)}</b>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">
                  CURRENT SELL PRICE
                </span>
                <b>{money(activeProduct.customerPrice)}</b>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="New Quantity *"
              type="number"
              min="1"
              value={addedQuantity}
              onChange={setAddedQuantity}
            />
            <SearchableSelect
              label="Vendor *"
              options={vendorOptions}
              value={selectedVendorId}
              onChange={setSelectedVendorId}
              placeholder={loadingVendors ? "Loading..." : "Select vendor"}
            />
            <Field
              label="Vendor MRP *"
              type="number"
              min="0"
              step="0.01"
              value={mrp}
              onChange={setMrp}
            />
            <Field
              label="Vendor Discount %"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={vendorDiscountPercentage}
              onChange={setVendorDiscountPercentage}
            />

            {/* Read-only, auto-calculated. This IS the Batch Purchase Price. */}
            <label className="text-sm">
              <span className="block font-semibold text-slate-700 mb-1">
                Store / Purchase Price (auto)
              </span>
              <input
                readOnly
                value={money(storePrice)}
                className="w-full border rounded-lg px-3 py-2 bg-slate-100 text-slate-700 font-semibold cursor-not-allowed"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                = MRP − (MRP × Discount%) → what we pay the vendor per unit
              </span>
            </label>

            <Field
              label="Actual Product MRP *"
              type="number"
              min="0"
              step="0.01"
              value={productMrp}
              onChange={setProductMrp}
            />

            <Field
              label="New Customer / Selling Price *"
              type="number"
              min="0"
              step="0.01"
              value={customerPrice}
              onChange={setCustomerPrice}
            />

            <Field
              label="Batch Number"
              value={batchNumber}
              onChange={setBatchNumber}
              placeholder="Auto generated if blank"
            />
            <Field
              label="Received Date"
              type="date"
              value={receivedDate}
              onChange={setReceivedDate}
            />
            <Field
              label="Vendor Bill Due Date"
              type="date"
              value={dueDate}
              onChange={setDueDate}
            />
            <Field
              label="Amount Paid Now"
              type="number"
              min="0"
              step="0.01"
              value={amountPaidNow}
              onChange={setAmountPaidNow}
            />
            <label className="text-sm">
              <span className="block font-semibold text-slate-700 mb-1">
                Payment Method
              </span>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option>CASH</option>
                <option>UPI</option>
                <option>CREDIT_CARD</option>
                <option>DEBIT_CARD</option>
                <option>NET_BANKING</option>
              </select>
            </label>
            <Field
              label="Transaction / UTR"
              value={transactionRef}
              onChange={setTransactionRef}
            />
          </div>
          <label className="text-sm">
            <span className="block font-semibold text-slate-700 mb-1">
              Remarks
            </span>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows="2"
              className="w-full border rounded-lg px-3 py-2"
            />
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Summary
              title="New Stock"
              value={projectedStock}
            />
            <Summary
              title="New Store Price"
              value={money(storePrice)}
            />
            <Summary
              title="Vendor Bill"
              value={money(totalBill)}
            />
            <Summary
              title="Due"
              value={money(due)}
            />
          </div>
          <div className="flex justify-end gap-3 border-t pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 rounded-lg bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="px-6 py-2.5 rounded-lg bg-emerald-600 text-white font-bold disabled:opacity-50"
            >
              {updateMutation.isPending
                ? "Updating..."
                : "Update Stock & Create Bill"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Field = ({label, value, onChange, ...props}) => (
  <label className="text-sm">
    <span className="block font-semibold text-slate-700 mb-1">{label}</span>
    <input
      {...props}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
    />
  </label>
);
const Summary = ({title, value}) => (
  <div className="rounded-xl border bg-slate-50 p-3">
    <span className="text-[10px] text-slate-500 block">{title}</span>
    <b className="text-sm text-slate-900">{value}</b>
  </div>
);
export default UpdateStockModal;
