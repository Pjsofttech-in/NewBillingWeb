import {useMemo, useState} from "react";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {fetchVendors} from "../../api/vendorServiceApi";
import {updateProductStock} from "../../api/productApi";
import SearchableSelect from "../../Components/Form/SearchableSelect";
import VendorDiscountFields from "../../Components/Form/VendorDiscountFields";
import VendorPaymentSection from "../../Components/Form/VendorPaymentSection";
import {
  resolveVendorPricing,
  valueForMode,
  vendorPricingFields,
} from "../../utils/vendorPricing";
import {money} from "../../utils/format";


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
  const [discountMode, setDiscountMode] = useState("PERCENT");
  const [discountValue, setDiscountValue] = useState("");
  const [productMrp, setProductMrp] = useState("");
  const [customerPrice, setCustomerPrice] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [receivedDate, setReceivedDate] = useState(
    new Date().toISOString().slice(0, 10),
  );

  // COMPLETE: bill paid now | INSTALLMENT: unpaid, plan is created in Vendor Bills
  const [paymentOption, setPaymentOption] = useState("INSTALLMENT");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [transactionRef, setTransactionRef] = useState("");
  const [error, setError] = useState("");

  const activeProduct =
    product || productsList.find((p) => p.id === Number(selectedProductId));

  const {data: vendors = [], isLoading: loadingVendors} = useQuery({
    queryKey: ["vendors"],
    queryFn: fetchVendors,
    enabled: isOpen,
  });

  const [prevModalProductKey, setPrevModalProductKey] = useState(null);
  const currentModalProductKey = isOpen ? product?.id || "open" : null;
  if (prevModalProductKey !== currentModalProductKey) {
    setPrevModalProductKey(currentModalProductKey);
    if (isOpen) {
      const p = product;
      if (p) {
        setSelectedProductId(String(p.id));
        setSelectedVendorId(p.vendor?.id ? String(p.vendor.id) : "");
        setDiscountMode("PERCENT");
        setDiscountValue(p.vendorDiscountPercentage ?? "");
        setCustomerPrice(p.customerPrice ?? "");
        setProductMrp(p.productMrp ?? "");
      }
      setReceivedDate(new Date().toISOString().slice(0, 10));
    }
  }

  // Vendor pricing is on the ACTUAL Product MRP: flat price () OR discount %, the other is calculated.
  const pricing = useMemo(
    () =>
      resolveVendorPricing({
        productMrp,
        mode: discountMode,
        value: discountValue,
      }),
    [productMrp, discountMode, discountValue],
  );
  const storePrice = pricing.purchasePrice;

  const handleDiscountModeChange = (mode) => {
    if (mode === discountMode) return;
    setDiscountValue(valueForMode(mode, pricing));
    setDiscountMode(mode);
  };

  const qty = Math.max(0, Number.parseInt(addedQuantity, 10) || 0);
  const totalBill = storePrice * qty;
  const paidAmount = paymentOption === "COMPLETE" ? totalBill : 0;
  const dueAmount = Math.max(0, totalBill - paidAmount);
  const isVendorBillPaid = totalBill > 0 && paidAmount >= totalBill - 0.009;

  const handlePaymentOptionChange = (option) => {
    setPaymentOption(option);
    if (option !== "COMPLETE") {
      setPaymentMethod("CASH");
      setTransactionRef("");
    }
  };

  const updateMutation = useMutation({
    mutationFn: async (payload) => {
      const updated = await updateProductStock({
        id: activeProduct.id,
        ...payload,
      });
      return {updated};
    },
    onSuccess: async ({updated}) => {
      await Promise.all([
        queryClient.invalidateQueries({queryKey: ["products"]}),
        queryClient.invalidateQueries({
          queryKey: ["productBatches", activeProduct.id],
        }),
        queryClient.invalidateQueries({queryKey: ["vendorBills"]}),
        queryClient.invalidateQueries({queryKey: ["dashboard"]}),
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
    setDiscountMode("PERCENT");
    setDiscountValue("");
    setPaymentMethod("CASH");
    setTransactionRef("");
    setPaymentOption("INSTALLMENT");
    setError("");
    onClose();
  };

  const currentStock = activeProduct?.stock ?? 0;
  const projectedStock = currentStock + qty;

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
    if (Number(productMrp) <= 0)
      return setError("Actual product MRP must be greater than 0");
    if (pricing.error) return setError(pricing.error);
    if (Number(customerPrice) < 0)
      return setError("Customer price cannot be negative");
    if (paymentOption === "COMPLETE" && !paymentMethod)
      return setError("Select the payment method");

    updateMutation.mutate({
      addedQuantity: qty,
      vendorId: Number(selectedVendorId),
      ...vendorPricingFields(discountMode, discountValue),
      productMrp: Number(productMrp),
      customerPrice: customerPrice === "" ? storePrice : Number(customerPrice),
      batchNumber: batchNumber.trim() || null,
      receivedDate: receivedDate || null,
      dueDate: null,
      // saved on the vendor bill: the bill list then shows "Installment"
      installmentRequested: paymentOption !== "COMPLETE",
      sellingPrice: customerPrice === "" ? storePrice : Number(customerPrice),
      amountPaidNow: paidAmount,
      paymentMethod: paidAmount > 0 ? paymentMethod : null,
      // Cash has no transaction id
      transactionRef:
        paidAmount > 0 && paymentMethod !== "CASH"
          ? transactionRef.trim() || null
          : null,
      remarks: "Restocked via UI",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-5 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl text-xs">
        {/* ================= HEADER ================= */}
        <div className="flex shrink-0 items-center justify-between border-b bg-blue-500 px-5 py-2.5 text-white">
          <div>
            <h2 className="text-sm font-bold">Restock Product</h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded p-1 text-blue-100 hover:bg-blue-600 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* ================= BODY (SCROLLABLE) ================= */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-4">
          {error && (
            <div className="mb-3 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
              <span className="font-bold">!</span>
              <span>{error}</span>
            </div>
          )}

          <form
            id="restock-form"
            onSubmit={handleSubmit}
            className="space-y-3"
          >
            {/* PRODUCT SELECT & CURRENT DETAILS */}
            <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-xs">
              <h3 className="mb-2 border-b border-slate-100 pb-1 font-bold text-slate-800">
                Product & Vendor Information
              </h3>
              {!product && (
                <div className="mb-3 max-w-md">
                  <SearchableSelect
                    label="Product"
                    options={productOptions}
                    value={selectedProductId}
                    onChange={setSelectedProductId}
                    placeholder="Select product"
                  />
                </div>
              )}

              {activeProduct && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 items-start rounded-md border border-slate-100 bg-slate-50 p-2.5">
                  <div>
                    <span className="block text-[10px] font-semibold text-slate-400 uppercase">
                      Current Stock
                    </span>
                    <strong className="text-slate-800">{currentStock}</strong>
                  </div>
                  <div>
                    <span className="block text-[10px] font-semibold text-slate-400 uppercase">
                      Current Store Price
                    </span>
                    <strong className="text-slate-800">
                      {money(activeProduct.storePrice)}
                      <span className="ml-1 text-[10px] font-semibold text-emerald-600">
                        ({activeProduct.vendorDiscountPercentage ?? 0}% off)
                      </span>
                    </strong>
                  </div>
                  <div>
                    <span className="block text-[10px] font-semibold text-slate-400 uppercase">
                      Current Product MRP
                    </span>
                    <strong className="text-slate-800">
                      {money(activeProduct.productMrp)}
                    </strong>
                  </div>
                  <div>
                    <span className="block text-[10px] font-semibold text-slate-400 uppercase">
                      Current Sell Price
                    </span>
                    <strong className="text-slate-800">
                      {money(activeProduct.customerPrice)}
                    </strong>
                  </div>
                </div>
              )}
            </section>

            {/* PRICING & STOCK */}
            <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-xs">
              <h3 className="mb-2 border-b border-slate-100 pb-1 font-bold text-slate-800">
                Pricing & Stock
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-6 items-start">
                <Field
                  label="New Stock Qty"
                  type="number"
                  min="1"
                  value={addedQuantity}
                  onChange={setAddedQuantity}
                  required
                />
                <div className="flex flex-col">
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Vendor <span className="text-red-500">*</span>
                  </label>
                  <SearchableSelect
                    options={vendorOptions}
                    value={selectedVendorId}
                    onChange={setSelectedVendorId}
                    placeholder={loadingVendors ? "..." : "Select vendor"}
                  />
                </div>
                <Field
                  label="Actual Product MRP"
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={productMrp}
                  onChange={setProductMrp}
                />
                <VendorDiscountFields
                  mode={discountMode}
                  value={discountValue}
                  onModeChange={handleDiscountModeChange}
                  onValueChange={setDiscountValue}
                  resolved={pricing}
                />
                <PriceDisplay
                  label="Purchase Price"
                  value={money(storePrice)}
                />
                <Field
                  label="Selling Price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={customerPrice}
                  onChange={setCustomerPrice}
                  required
                />
                <Field
                  label="Batch No."
                  value={batchNumber}
                  onChange={setBatchNumber}
                  placeholder="Optional"
                />
                <Field
                  label="Received Date"
                  type="date"
                  value={receivedDate}
                  onChange={setReceivedDate}
                />
              </div>
            </section>

            {/* VENDOR PAYMENT SECTION */}
            {/* VENDOR PAYMENT: Complete | Installment (reusable) */}
            <VendorPaymentSection
              status={paymentOption}
              onStatusChange={handlePaymentOptionChange}
              totalBill={totalBill}
              method={paymentMethod}
              onMethodChange={setPaymentMethod}
              reference={transactionRef}
              onReferenceChange={setTransactionRef}
            />
          </form>
        </div>

        {/* ================= FOOTER ================= */}
        <div className="flex shrink-0 items-center justify-between border-t border-slate-200 bg-white px-5 py-2.5">
          <div className="text-xs text-slate-500">
            <span>
              Projected Stock:{" "}
              <strong className="text-slate-800">{projectedStock}</strong>
            </span>
            <span className="mx-2">|</span>
            {isVendorBillPaid ? (
              <span className="font-medium text-emerald-600">
                Vendor Payment: Complete
              </span>
            ) : (
              <span>
                Vendor Due:{" "}
                <strong className="text-amber-600">{money(dueAmount)}</strong>
              </span>
            )}
          </div>

          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={handleClose}
              className="rounded bg-slate-100 px-3.5 py-1.5 font-medium text-slate-600 hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="restock-form"
              disabled={updateMutation.isPending}
              className="rounded bg-blue-600 px-4 py-1.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {updateMutation.isPending
                ? "Updating..."
                : "Update Stock & Create Bill"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Field = ({label, value, onChange, required = false, ...props}) => (
  <div className="flex flex-col">
    <label className="mb-1 block text-xs font-semibold text-slate-700">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      {...props}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 w-full rounded border border-slate-300 bg-white px-2 text-xs outline-none focus:border-blue-500"
    />
  </div>
);

function PriceDisplay({label, value}) {
  return (
    <div className="flex flex-col">
      <label className="mb-1 block text-xs font-semibold text-slate-700">
        {label}
      </label>
      <div className="flex h-8 items-center w-full rounded border border-slate-200 bg-slate-100 px-2 text-xs font-semibold text-slate-700">
        {value}
      </div>
    </div>
  );
}

export default UpdateStockModal;
