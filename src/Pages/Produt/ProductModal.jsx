import {useCallback, useEffect, useMemo, useState} from "react";
import {useForm, useWatch} from "react-hook-form";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {createProduct, updateProductStock} from "../../api/productApi";
import {fetchAttributesByProductType} from "../../api/attributeApi";
import {createProductAttributeValue} from "../../api/productAttributeValueApi";
import {fetchBrands} from "../../api/brandServiceApi";
import {fetchVendors} from "../../api/vendorServiceApi";
import {fetchUnitTypes} from "../../api/unitTypeServiceApi";
import {fetchProductTypes} from "../../api/productTypeServiceApi";

import Input from "../../Components/Form/Input";
import Select from "../../Components/Form/Select";
import Checkbox from "../../Components/Form/Checkbox";

const DEFAULT_VALUES = {
  productName: "",
  productTypeId: "",
  brandId: "",
  vendorId: "",
  unitTypeId: "",
  stock: "0",
  mrp: "0",
  vendorDiscountPercentage: "0",
  productMrp: "0",
  customerPrice: "0",

  gstApplicable: false,
  applyCgst: false,
  applySgst: false,
  applyUgst: false,
  applyIgst: false,
  cgstPercentage: "0",
  sgstPercentage: "0",
  ugstPercentage: "0",
  igstPercentage: "0",

  receivedDate: new Date().toISOString().slice(0, 10),
  dueDate: "",
  amountPaidNow: "0",
  paymentMethod: "CASH",
  transactionRef: "",
};

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const safeFloat = (value) => {
  const number = Number.parseFloat(value);
  return Number.isFinite(number) ? number : 0;
};

const safeInt = (value) => {
  const number = Number.parseInt(value, 10);
  return Number.isFinite(number) ? number : 0;
};

const clampPercent = (value) => Math.max(0, Math.min(100, safeFloat(value)));

export default function ProductModal({isOpen, onClose, onSuccess}) {
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState("");
  const [paymentOption, setPaymentOption] = useState("PENDING");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: {errors},
  } = useForm({
    defaultValues: DEFAULT_VALUES,
  });

  const isGstApplicable = useWatch({control, name: "gstApplicable"});
  const isApplyCgst = useWatch({control, name: "applyCgst"});
  const isApplySgst = useWatch({control, name: "applySgst"});
  const isApplyUgst = useWatch({control, name: "applyUgst"});
  const isApplyIgst = useWatch({control, name: "applyIgst"});

  const cgstPercentage = useWatch({control, name: "cgstPercentage"});
  const sgstPercentage = useWatch({control, name: "sgstPercentage"});
  const ugstPercentage = useWatch({control, name: "ugstPercentage"});
  const igstPercentage = useWatch({control, name: "igstPercentage"});

  const selectedProductTypeId = useWatch({control, name: "productTypeId"});
  const watchedMrp = useWatch({control, name: "mrp"});
  const watchedVendorDiscount = useWatch({
    control,
    name: "vendorDiscountPercentage",
  });
  const watchedStock = useWatch({control, name: "stock"});
  const watchedPaid = useWatch({control, name: "amountPaidNow"});

  /*
   * Vendor purchase price after vendor discount.
   */
  const purchasePrice = useMemo(() => {
    const mrp = safeFloat(watchedMrp);
    const discount = clampPercent(watchedVendorDiscount);
    return Math.max(0, Number((mrp - (mrp * discount) / 100).toFixed(2)));
  }, [watchedMrp, watchedVendorDiscount]);

  /*
   * GST Amounts calculation based on purchase price
   */
  const cgstAmount = useMemo(
    () =>
      isGstApplicable && isApplyCgst
        ? (purchasePrice * safeFloat(cgstPercentage)) / 100
        : 0,
    [isGstApplicable, isApplyCgst, purchasePrice, cgstPercentage],
  );
  const sgstAmount = useMemo(
    () =>
      isGstApplicable && isApplySgst
        ? (purchasePrice * safeFloat(sgstPercentage)) / 100
        : 0,
    [isGstApplicable, isApplySgst, purchasePrice, sgstPercentage],
  );
  const ugstAmount = useMemo(
    () =>
      isGstApplicable && isApplyUgst
        ? (purchasePrice * safeFloat(ugstPercentage)) / 100
        : 0,
    [isGstApplicable, isApplyUgst, purchasePrice, ugstPercentage],
  );
  const igstAmount = useMemo(
    () =>
      isGstApplicable && isApplyIgst
        ? (purchasePrice * safeFloat(igstPercentage)) / 100
        : 0,
    [isGstApplicable, isApplyIgst, purchasePrice, igstPercentage],
  );

  /*
   * Total vendor bill for this stock batch.
   */
  const totalBill = useMemo(
    () => purchasePrice * Math.max(0, safeInt(watchedStock)),
    [purchasePrice, watchedStock],
  );

  const paidAmount = Math.max(0, safeFloat(watchedPaid));
  const dueAmount = Math.max(0, totalBill - paidAmount);
  const isVendorBillPaid = totalBill > 0 && paidAmount >= totalBill - 0.009;

  const handlePaymentOptionChange = (option) => {
    setPaymentOption(option);
    if (option === "PAID") {
      setValue("amountPaidNow", totalBill.toString());
      setValue("dueDate", "");
    } else {
      setValue("amountPaidNow", "0");
    }
  };

  useEffect(() => {
    if (paymentOption === "PAID") {
      setValue("amountPaidNow", totalBill.toString());
    }
  }, [totalBill, paymentOption, setValue]);

  useEffect(() => {
    if (!isGstApplicable) {
      setValue("applyCgst", false);
      setValue("applySgst", false);
      setValue("applyUgst", false);
      setValue("applyIgst", false);
      setValue("cgstPercentage", "0");
      setValue("sgstPercentage", "0");
      setValue("ugstPercentage", "0");
      setValue("igstPercentage", "0");
    }
  }, [isGstApplicable, setValue]);

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === "Escape") {
        setErrorMessage("");
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!isOpen) return undefined;
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleKeyDown]);

  const {data: productTypes = [], isLoading: loadingTypes} = useQuery({
    queryKey: ["productTypes"],
    queryFn: fetchProductTypes,
    enabled: isOpen,
  });
  const {data: brands = [], isLoading: loadingBrands} = useQuery({
    queryKey: ["brands"],
    queryFn: fetchBrands,
    enabled: isOpen,
  });
  const {data: vendors = [], isLoading: loadingVendors} = useQuery({
    queryKey: ["vendors"],
    queryFn: fetchVendors,
    enabled: isOpen,
  });
  const {data: unitTypes = [], isLoading: loadingUnits} = useQuery({
    queryKey: ["unitTypes"],
    queryFn: fetchUnitTypes,
    enabled: isOpen,
  });
  const {data: attributes = [], isLoading: loadingAttributes} = useQuery({
    queryKey: ["attributes", selectedProductTypeId],
    queryFn: () => fetchAttributesByProductType(selectedProductTypeId),
    enabled: Boolean(isOpen && selectedProductTypeId),
  });

  const createMutation = useMutation({
    mutationFn: async ({productPayload, stockPayload, attributeValues}) => {
      const product = await createProduct(productPayload);
      if (stockPayload.addedQuantity > 0) {
        await updateProductStock({id: product.id, ...stockPayload});
      }
      await Promise.all(
        attributeValues
          .filter((item) => String(item.value ?? "").trim() !== "")
          .map((item) =>
            createProductAttributeValue({
              product: {id: product.id},
              attribute: {id: Number(item.attributeId)},
              value: String(item.value).trim(),
            }),
          ),
      );
      return product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["products"]});
      queryClient.invalidateQueries({queryKey: ["productBatches"]});
      queryClient.invalidateQueries({queryKey: ["vendorBills"]});
      reset({
        ...DEFAULT_VALUES,
        receivedDate: new Date().toISOString().slice(0, 10),
      });
      setPaymentOption("PENDING");
      setErrorMessage("");
      onSuccess?.();
      onClose();
    },
    onError: (error) => {
      setErrorMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to create product.",
      );
    },
  });

  const onSubmit = (data) => {
    setErrorMessage("");
    const quantity = safeInt(data.stock);
    const amountPaidNow = Math.max(0, safeFloat(data.amountPaidNow));
    const vendorMrp = Math.max(0, safeFloat(data.mrp));
    const vendorDiscount = clampPercent(data.vendorDiscountPercentage);
    const actualProductMrp = Math.max(0, safeFloat(data.productMrp));
    const customerPrice = Math.max(0, safeFloat(data.customerPrice));

    if (!data.productName?.trim()) {
      setErrorMessage("Product name is required.");
      return;
    }
    if (!data.vendorId) {
      setErrorMessage("Vendor is required.");
      return;
    }
    if (vendorMrp <= 0) {
      setErrorMessage("Vendor MRP must be greater than 0.");
      return;
    }
    if (actualProductMrp < 0 || customerPrice < 0) {
      setErrorMessage("Product MRP and selling price cannot be negative.");
      return;
    }
    if (amountPaidNow > totalBill + 0.009) {
      setErrorMessage("Amount paid now cannot exceed the vendor bill amount.");
      return;
    }

    const productPayload = {
      productName: data.productName.trim(),
      mrp: vendorMrp,
      vendorDiscountPercentage: vendorDiscount,
      customerPrice,
      productMrp: actualProductMrp,
      stock: 0,
      gstApplicable: Boolean(data.gstApplicable),
      applyCgst: Boolean(data.applyCgst),
      cgstPercentage: data.applyCgst ? safeFloat(data.cgstPercentage) : 0,
      applySgst: Boolean(data.applySgst),
      sgstPercentage: data.applySgst ? safeFloat(data.sgstPercentage) : 0,
      applyUgst: Boolean(data.applyUgst),
      ugstPercentage: data.applyUgst ? safeFloat(data.ugstPercentage) : 0,
      applyIgst: Boolean(data.applyIgst),
      igstPercentage: data.applyIgst ? safeFloat(data.igstPercentage) : 0,
      productType: {id: safeInt(data.productTypeId)},
      brand: {id: safeInt(data.brandId)},
      vendor: {id: safeInt(data.vendorId)},
      unitType: {id: safeInt(data.unitTypeId)},
    };

    const stockPayload = {
      vendorId: safeInt(data.vendorId),
      batchNumber: data.batchNumber?.trim() || undefined,
      vendorMrp,
      vendorDiscountPercentage: vendorDiscount,
      purchasePrice,
      productMrp: actualProductMrp,
      sellingPrice: customerPrice,
      addedQuantity: quantity,
      receivedDate: data.receivedDate || null,
      dueDate: data.dueDate || null,
      amountPaidNow,
      paymentMethod: amountPaidNow > 0 ? data.paymentMethod : null,
      transactionRef:
        amountPaidNow > 0 ? data.transactionRef?.trim() || null : null,
    };

    const attributeValues = Array.isArray(attributes)
      ? attributes.map((attribute) => ({
          attributeId: attribute.id,
          value: data[`attribute_${attribute.id}`] || "",
        }))
      : [];

    createMutation.mutate({productPayload, stockPayload, attributeValues});
  };

  const typeOptions = productTypes.map((item) => ({
    label: item.typeName || item.name,
    value: item.id,
  }));
  const brandOptions = brands.map((item) => ({
    label: item.brandName || item.name,
    value: item.id,
  }));
  const vendorOptions = vendors.map((item) => ({
    label: item.vendorName || item.name,
    value: item.id,
  }));
  const unitOptions = unitTypes.map((item) => ({
    label: item.unitType || item.unitName || item.name,
    value: item.id,
  }));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-5 backdrop-blur-sm">
      {/* Increased max-width from max-w-6xl to max-w-7xl */}
      <div className="flex max-h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl text-xs">
        {/* ================= HEADER ================= */}
        <div className="flex shrink-0 items-center justify-between border-b bg-blue-500 px-5 py-2.5 text-white">
          <div>
            <h2 className="text-sm font-bold">Add Product</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-blue-100 hover:bg-blue-600 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* ================= BODY (SCROLLABLE) ================= */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-4">
          {errorMessage && (
            <div className="mb-3 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
              <span className="font-bold">!</span>
              <span>{errorMessage}</span>
            </div>
          )}

          <form
            id="product-form"
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-3"
          >
            {/* PRODUCT INFORMATION */}
            <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-xs">
              <SectionHeader title="Product Information" />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 items-start">
                <Input
                  label="Product Name"
                  name="productName"
                  register={register}
                  rules={{required: "Required"}}
                  error={errors.productName}
                  required
                />
                <Select
                  label="Product Type"
                  name="productTypeId"
                  register={register}
                  rules={{required: "Required"}}
                  error={errors.productTypeId}
                  required
                  placeholder={loadingTypes ? "..." : "Select type"}
                  options={typeOptions}
                  disabled={loadingTypes}
                />
                <Select
                  label="Brand"
                  name="brandId"
                  register={register}
                  rules={{required: "Required"}}
                  error={errors.brandId}
                  required
                  placeholder={loadingBrands ? "..." : "Select brand"}
                  options={brandOptions}
                  disabled={loadingBrands}
                />
                <Select
                  label="Vendor"
                  name="vendorId"
                  register={register}
                  rules={{required: "Required"}}
                  error={errors.vendorId}
                  required
                  placeholder={loadingVendors ? "..." : "Select vendor"}
                  options={vendorOptions}
                  disabled={loadingVendors}
                />
                <Select
                  label="Unit Type"
                  name="unitTypeId"
                  register={register}
                  rules={{required: "Required"}}
                  error={errors.unitTypeId}
                  required
                  placeholder={loadingUnits ? "..." : "Select unit"}
                  options={unitOptions}
                  disabled={loadingUnits}
                />
                <Input
                  label="Batch No."
                  name="batchNumber"
                  placeholder="Optional"
                  register={register}
                />
                <Input
                  label="Received Date"
                  name="receivedDate"
                  type="date"
                  register={register}
                />
              </div>

              {selectedProductTypeId && (
                <div className="mt-3 border-t border-slate-100 pt-2.5">
                  <span className="block text-[10px] font-semibold uppercase text-slate-400 mb-1.5">
                    Specifications
                  </span>
                  {loadingAttributes ? (
                    <p className="text-[10px] text-slate-400">Loading...</p>
                  ) : attributes.length ? (
                    <div className="flex flex-wrap gap-2.5 items-center">
                      {attributes.map((attribute) => (
                        <div
                          key={attribute.id}
                          className="inline-flex h-8 items-center gap-1.5 rounded border border-slate-200 bg-slate-50 px-2"
                        >
                          <span className="shrink-0 text-[10px] font-medium text-slate-600">
                            {attribute.name || attribute.attributeName}:
                          </span>
                          <input
                            type="text"
                            placeholder="Value"
                            {...register(`attribute_${attribute.id}`)}
                            className="h-6 w-20 rounded border border-slate-300 bg-white px-1.5 text-xs outline-none focus:border-blue-500"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400 italic">
                      No attributes found.
                    </p>
                  )}
                </div>
              )}
            </section>

            {/* PRICING & STOCK */}
            <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-xs">
              <SectionHeader title="Pricing & Stock" />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-6 items-start">
                <Input
                  label="Stock Qty"
                  name="stock"
                  type="number"
                  min="0"
                  step="1"
                  register={register}
                  error={errors.stock}
                />
                <Input
                  label="Actual Product MRP"
                  name="productMrp"
                  type="number"
                  min="0"
                  step="0.01"
                  register={register}
                  error={errors.productMrp}
                />
                <Input
                  label="Vendor MRP"
                  name="mrp"
                  type="number"
                  min="0"
                  step="0.01"
                  register={register}
                  rules={{required: true}}
                  error={errors.mrp}
                  required
                />
                <Input
                  label="Vendor Disc %"
                  name="vendorDiscountPercentage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  register={register}
                />
                <PriceDisplay
                  label="Purchase Price"
                  value={money(purchasePrice)}
                />
                <Input
                  label="Selling Price"
                  name="customerPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  register={register}
                  rules={{required: true}}
                  error={errors.customerPrice}
                  required
                />
              </div>
            </section>

            {/* VENDOR PAYMENT */}
            <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="font-bold text-slate-800">Vendor Payment</h3>
                <div className="flex items-center gap-3 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                  <label className="flex items-center gap-1.5 text-[11px] font-semibold cursor-pointer text-slate-700">
                    <input
                      type="radio"
                      name="paymentOptionGroup"
                      checked={paymentOption === "PAID"}
                      onChange={() => handlePaymentOptionChange("PAID")}
                      className="h-3 w-3 text-emerald-600"
                    />
                    Paid
                  </label>
                  <label className="flex items-center gap-1.5 text-[11px] font-semibold cursor-pointer text-slate-700">
                    <input
                      type="radio"
                      name="paymentOptionGroup"
                      checked={paymentOption === "PENDING"}
                      onChange={() => handlePaymentOptionChange("PENDING")}
                      className="h-3 w-3 text-amber-600"
                    />
                    Pending
                  </label>
                </div>
              </div>

              <div className="mt-2.5 grid grid-cols-4 gap-3">
                <PaymentSummary
                  label="Total Bill"
                  value={money(totalBill)}
                />
                <PaymentSummary
                  label="Paid"
                  value={money(paidAmount)}
                />
                <PaymentSummary
                  label="Due"
                  value={money(dueAmount)}
                  danger={!isVendorBillPaid}
                />
                <PaymentSummary
                  label="Status"
                  value={isVendorBillPaid ? "Paid" : "Pending"}
                  status
                  paid={isVendorBillPaid}
                />
              </div>

              {paymentOption === "PENDING" && (
                <div className="mt-2.5 rounded border border-amber-200 bg-amber-50/40 p-2.5">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 items-start">
                    <Input
                      label="Amount Paid Now"
                      name="amountPaidNow"
                      type="number"
                      min="0"
                      max={totalBill}
                      step="0.01"
                      register={register}
                    />
                    <Input
                      label="Due Date"
                      name="dueDate"
                      type="date"
                      register={register}
                    />
                    <div className="flex flex-col">
                      <label className="mb-1 block text-xs font-semibold text-slate-700">
                        Payment Method
                      </label>
                      <select
                        {...register("paymentMethod")}
                        className="h-8 w-full rounded border border-slate-300 bg-white px-2 text-xs outline-none focus:border-blue-500"
                      >
                        <option value="CASH">Cash</option>
                        <option value="UPI">UPI</option>
                        <option value="CREDIT_CARD">Credit Card</option>
                        <option value="DEBIT_CARD">Debit Card</option>
                        <option value="NET_BANKING">Net Banking</option>
                      </select>
                    </div>
                    <Input
                      label="Ref / Transaction No."
                      name="transactionRef"
                      placeholder="UPI/Bank ref"
                      register={register}
                    />
                  </div>
                </div>
              )}
            </section>

            {/* GST SECTION */}
            <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <h3 className="font-bold text-slate-800">GST Settings</h3>
                <Checkbox
                  label="GST Applicable"
                  name="gstApplicable"
                  register={register}
                />
              </div>

              {isGstApplicable && (
                <div className="mt-2.5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <TaxField
                    label="CGST"
                    checkbox="applyCgst"
                    name="cgstPercentage"
                    amount={cgstAmount}
                    register={register}
                  />
                  <TaxField
                    label="SGST"
                    checkbox="applySgst"
                    name="sgstPercentage"
                    amount={sgstAmount}
                    register={register}
                  />
                  <TaxField
                    label="UGST"
                    checkbox="applyUgst"
                    name="ugstPercentage"
                    amount={ugstAmount}
                    register={register}
                  />
                  <TaxField
                    label="IGST"
                    checkbox="applyIgst"
                    name="igstPercentage"
                    amount={igstAmount}
                    register={register}
                  />
                </div>
              )}
            </section>
          </form>
        </div>

        {/* ================= FOOTER ================= */}
        <div className="flex shrink-0 items-center justify-between border-t border-slate-200 bg-white px-5 py-2.5">
          <div className="text-xs text-slate-500">
            {isVendorBillPaid ? (
              <span className="font-medium text-emerald-600">
                Vendor Payment: Paid
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
              onClick={onClose}
              className="rounded bg-slate-100 px-3.5 py-1.5 font-medium text-slate-600 hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="product-form"
              disabled={createMutation.isPending}
              className="rounded bg-blue-600 px-4 py-1.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {createMutation.isPending ? "Saving..." : "Save Product"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({title}) {
  return (
    <h3 className="mb-2 border-b border-slate-100 pb-1 font-bold text-slate-800">
      {title}
    </h3>
  );
}

function PriceDisplay({label, value}) {
  return (
    <div className="flex flex-col">
      <label className="mb-2 block text-xs font-semibold text-slate-700">
        {label}
      </label>
      <div className="flex h-8 items-center w-full rounded border border-slate-200 bg-slate-100 px-2 py-5 text-xs font-semibold text-slate-700">
        {value}
      </div>
    </div>
  );
}

function PaymentSummary({
  label,
  value,
  danger = false,
  status = false,
  paid = false,
}) {
  return (
    <div className="rounded border border-slate-200 bg-slate-50 px-2.5 py-1">
      <p className="text-[9px] font-semibold uppercase text-slate-400">
        {label}
      </p>
      <p
        className={`font-bold ${status ? (paid ? "text-emerald-600" : "text-amber-600") : danger ? "text-amber-600" : "text-slate-800"}`}
      >
        {value}
      </p>
    </div>
  );
}

function TaxField({label, checkbox, name, amount = 0, register}) {
  return (
    <div className="flex h-8 items-center justify-between rounded border border-slate-200 bg-slate-50 px-2">
      <Checkbox
        label={label}
        name={checkbox}
        register={register}
      />
      <div className="flex items-center gap-1.5">
        <div className="flex items-center gap-0.5">
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="0"
            {...register(name)}
            className="h-6 w-12 rounded border border-slate-300 bg-white px-1 text-xs text-right outline-none focus:border-blue-500"
          />
          <span className="text-[10px] text-slate-400">%</span>
        </div>
        <span className="text-[10px] font-bold text-slate-600">
          ({money(amount)})
        </span>
      </div>
    </div>
  );
}
