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

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: {errors},
  } = useForm({defaultValues: DEFAULT_VALUES});

  const isGstApplicable = useWatch({control, name: "gstApplicable"});
  const selectedProductTypeId = useWatch({control, name: "productTypeId"});
  const watchedMrp = useWatch({control, name: "mrp"});
  const watchedVendorDiscount = useWatch({
    control,
    name: "vendorDiscountPercentage",
  });
  const watchedStock = useWatch({control, name: "stock"});
  const watchedPaid = useWatch({control, name: "amountPaidNow"});
  const watchedCustomerPrice = useWatch({control, name: "customerPrice"});

  const purchasePrice = useMemo(() => {
    const mrp = safeFloat(watchedMrp);
    const discount = clampPercent(watchedVendorDiscount);
    return Math.max(0, Number((mrp - (mrp * discount) / 100).toFixed(2)));
  }, [watchedMrp, watchedVendorDiscount]);

  const totalBill = useMemo(
    () => purchasePrice * Math.max(0, safeInt(watchedStock)),
    [purchasePrice, watchedStock],
  );

  const dueAmount = Math.max(0, totalBill - Math.max(0, safeFloat(watchedPaid)));

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
        await updateProductStock({
          id: product.id,
          ...stockPayload,
        });
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
      reset({...DEFAULT_VALUES, receivedDate: new Date().toISOString().slice(0, 10)});
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
      transactionRef: amountPaidNow > 0 ? data.transactionRef?.trim() || null : null,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b bg-slate-900 px-5 py-4 text-white">
          <div>
            <h2 className="text-base font-bold">Add Product</h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Product details, first stock batch, vendor bill and GST.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-300 transition hover:bg-slate-800 hover:text-white"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50 p-5">
          {errorMessage && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          <form id="product-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="mb-3 border-b border-slate-100 pb-2 text-sm font-bold text-slate-800">
                Product Information
              </h3>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Input
                  label="Product Name"
                  name="productName"
                  placeholder="Enter product name"
                  register={register}
                  rules={{required: "Product name is required"}}
                  error={errors.productName}
                  required
                />
                <Select
                  label="Product Type"
                  name="productTypeId"
                  register={register}
                  rules={{required: "Product type is required"}}
                  error={errors.productTypeId}
                  required
                  placeholder={loadingTypes ? "Loading..." : "Select product type"}
                  options={typeOptions}
                  disabled={loadingTypes}
                />
                <Select
                  label="Brand"
                  name="brandId"
                  register={register}
                  rules={{required: "Brand is required"}}
                  error={errors.brandId}
                  required
                  placeholder={loadingBrands ? "Loading..." : "Select brand"}
                  options={brandOptions}
                  disabled={loadingBrands}
                />
                <Select
                  label="Vendor"
                  name="vendorId"
                  register={register}
                  rules={{required: "Vendor is required"}}
                  error={errors.vendorId}
                  required
                  placeholder={loadingVendors ? "Loading..." : "Select vendor"}
                  options={vendorOptions}
                  disabled={loadingVendors}
                />
                <Select
                  label="Unit Type"
                  name="unitTypeId"
                  register={register}
                  rules={{required: "Unit type is required"}}
                  error={errors.unitTypeId}
                  required
                  placeholder={loadingUnits ? "Loading..." : "Select unit type"}
                  options={unitOptions}
                  disabled={loadingUnits}
                />
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="mb-3 border-b border-slate-100 pb-2 text-sm font-bold text-slate-800">
                Pricing & First Stock Batch
              </h3>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                <Input
                  label="Initial Stock Quantity"
                  name="stock"
                  type="number"
                  min="0"
                  step="1"
                  register={register}
                  rules={{min: {value: 0, message: "Minimum is 0"}}}
                  error={errors.stock}
                />
                <Input
                  label="Vendor MRP"
                  name="mrp"
                  type="number"
                  min="0"
                  step="0.01"
                  register={register}
                  rules={{required: "Vendor MRP is required", min: {value: 0.01, message: "Must be greater than 0"}}}
                  error={errors.mrp}
                  required
                />
                <Input
                  label="Vendor Discount %"
                  name="vendorDiscountPercentage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  register={register}
                />
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Purchase Price / Store Cost
                  </label>
                  <input
                    value={money(purchasePrice)}
                    readOnly
                    className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700"
                  />
                  <p className="mt-1 text-[10px] text-slate-400">
                    Vendor MRP − vendor discount
                  </p>
                </div>
                <Input
                  label="Actual Product MRP"
                  name="productMrp"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="MRP printed on product"
                  register={register}
                  rules={{min: {value: 0, message: "Minimum is 0"}}}
                  error={errors.productMrp}
                />
                <Input
                  label="Customer / Selling Price"
                  name="customerPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  register={register}
                  rules={{required: "Selling price is required", min: {value: 0, message: "Minimum is 0"}}}
                  error={errors.customerPrice}
                  required
                />
                <Input
                  label="Batch Number"
                  name="batchNumber"
                  placeholder="Optional; backend generates one"
                  register={register}
                />
                <Input
                  label="Received Date"
                  name="receivedDate"
                  type="date"
                  register={register}
                />
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                <Input
                  label="Vendor Bill Due Date"
                  name="dueDate"
                  type="date"
                  register={register}
                />
                <Input
                  label="Amount Paid Now"
                  name="amountPaidNow"
                  type="number"
                  min="0"
                  max={totalBill}
                  step="0.01"
                  register={register}
                />
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Payment Method
                  </label>
                  <select
                    {...register("paymentMethod")}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="CREDIT_CARD">Credit Card</option>
                    <option value="DEBIT_CARD">Debit Card</option>
                    <option value="NET_BANKING">Net Banking</option>
                  </select>
                </div>
                <Input
                  label="Transaction / Reference"
                  name="transactionRef"
                  placeholder="UPI reference / bank reference"
                  register={register}
                />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Summary label="Purchase / Unit" value={money(purchasePrice)} />
                <Summary label="Vendor Bill" value={money(totalBill)} />
                <Summary label="Paid Now" value={money(watchedPaid)} />
                <Summary label="Vendor Due" value={money(dueAmount)} />
              </div>

              <p className="mt-3 text-xs text-slate-500">
                Selling price is the current customer price. Each purchase is stored as a separate stock batch with its own purchase and selling price.
              </p>
              {safeFloat(watchedCustomerPrice) > safeFloat(watchedMrp) && (
                <p className="mt-1 text-xs font-medium text-amber-600">
                  Selling price is above the vendor MRP. Verify this is intentional.
                </p>
              )}
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-slate-800">GST</h3>
                <Checkbox label="GST Applicable" name="gstApplicable" register={register} />
              </div>

              {isGstApplicable && (
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <TaxField label="CGST" checkbox="applyCgst" name="cgstPercentage" register={register} />
                  <TaxField label="SGST" checkbox="applySgst" name="sgstPercentage" register={register} />
                  <TaxField label="UGST" checkbox="applyUgst" name="ugstPercentage" register={register} />
                  <TaxField label="IGST" checkbox="applyIgst" name="igstPercentage" register={register} />
                </div>
              )}
            </section>

            {selectedProductTypeId && (
              <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="mb-3 border-b border-slate-100 pb-2 text-sm font-bold text-slate-800">
                  Product Specifications {loadingAttributes ? "" : `(${attributes.length})`}
                </h3>
                {loadingAttributes ? (
                  <p className="text-sm text-slate-500">Loading attributes...</p>
                ) : attributes.length ? (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {attributes.map((attribute) => (
                      <Input
                        key={attribute.id}
                        label={attribute.name || attribute.attributeName || `Attribute #${attribute.id}`}
                        name={`attribute_${attribute.id}`}
                        placeholder="Enter value"
                        register={register}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No additional attributes configured.</p>
                )}
              </section>
            )}
          </form>
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-slate-200 bg-white px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="product-form"
            disabled={createMutation.isPending}
            className="rounded-lg bg-[#0073b7] px-5 py-2 text-sm font-semibold text-white hover:bg-[#005f99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {createMutation.isPending ? "Saving..." : "Save Product"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Summary({label, value}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-[10px] font-semibold uppercase text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-bold text-slate-800">{value}</p>
    </div>
  );
}

function TaxField({label, checkbox, name, register}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <Checkbox label={`Apply ${label}`} name={checkbox} register={register} />
      <input
        type="number"
        min="0"
        step="0.01"
        placeholder="%"
        {...register(name)}
        className="w-24 rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}
