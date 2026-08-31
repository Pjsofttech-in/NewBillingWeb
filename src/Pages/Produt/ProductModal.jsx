import { useEffect, useState, useCallback } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createProduct, purchaseStockBatch } from "../../api/productApi";
import { fetchAttributesByProductType } from "../../api/attributeApi";
import { createProductAttributeValue } from "../../api/productAttributeValueApi";

import { fetchBrands } from "../../api/brandServiceApi";
import { fetchVendors } from "../../api/vendorServiceApi";
import { fetchUnitTypes } from "../../api/unitTypeServiceApi";
import { fetchProductTypes } from "../../api/productTypeServiceApi";

import Input from "../../Components/Form/Input";
import Select from "../../Components/Form/Select";
import Checkbox from "../../Components/Form/Checkbox";

const ProductModal = ({ isOpen, onClose, onSuccess }) => {
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      productName: "",
      productTypeId: "",
      brandId: "",
      vendorId: "",
      unitTypeId: "",
      stock: "0",
      mrp: "0",
      vendorDiscountPercentage: "0",
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
    },
  });

  const isGstApplicable = useWatch({ control, name: "gstApplicable" });
  const selectedProductTypeId = useWatch({ control, name: "productTypeId" });

  // Reset tax values when GST is untagged
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

  // Close on Escape key press
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") {
        setErrorMessage("");
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleKeyDown]);

  // Data Queries
  const { data: productTypes = [], isLoading: loadingTypes } = useQuery({
    queryKey: ["productTypes"],
    queryFn: fetchProductTypes,
    enabled: isOpen,
  });

  const { data: brands = [], isLoading: loadingBrands } = useQuery({
    queryKey: ["brands"],
    queryFn: fetchBrands,
    enabled: isOpen,
  });

  const { data: vendors = [], isLoading: loadingVendors } = useQuery({
    queryKey: ["vendors"],
    queryFn: fetchVendors,
    enabled: isOpen,
  });

  const { data: unitTypes = [], isLoading: loadingUnits } = useQuery({
    queryKey: ["unitTypes"],
    queryFn: fetchUnitTypes,
    enabled: isOpen,
  });

  const { data: attributes = [], isLoading: loadingAttributes } = useQuery({
    queryKey: ["attributes", selectedProductTypeId],
    queryFn: () => fetchAttributesByProductType(selectedProductTypeId),
    enabled: Boolean(isOpen && selectedProductTypeId),
  });

  const createMutation = useMutation({
    mutationFn: async ({ productPayload, stockPayload, attributeValues }) => {
      const product = await createProduct(productPayload);
      if (stockPayload.quantity > 0) await purchaseStockBatch({ ...stockPayload, productId: product.id });
      await Promise.all(
        (attributeValues || [])
          .filter((item) => String(item.value ?? "").trim() !== "")
          .map((item) =>
            createProductAttributeValue({
              product: { id: product.id },
              attribute: { id: Number(item.attributeId) },
              value: String(item.value),
            })
          )
      );
      return product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      reset();
      setErrorMessage("");
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (err) => {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Failed to create product. Please review details and try again.";
      setErrorMessage(msg);
    },
  });

  if (!isOpen) return null;

  const safeFloat = (val) => {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? 0 : parsed;
  };

  const safeInt = (val) => {
    const parsed = parseInt(val, 10);
    return isNaN(parsed) ? 0 : parsed;
  };

  const onSubmit = (data) => {
    setErrorMessage("");

    const payload = {
      productName: data.productName,
      mrp: safeFloat(data.mrp),
      vendorDiscountPercentage: safeFloat(data.vendorDiscountPercentage),
      customerPrice: safeFloat(data.customerPrice),

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
      productType: { id: safeInt(data.productTypeId) },
      brand: { id: safeInt(data.brandId) },
      vendor: { id: safeInt(data.vendorId) },
      unitType: { id: safeInt(data.unitTypeId) },
    };

    const attributeValues = Array.isArray(attributes)
      ? attributes.map((attribute) => ({
          attributeId: attribute.id,
          value: data[`attribute_${attribute.id}`] || "",
        }))
      : [];

    const vendorMrp = safeFloat(data.mrp);
    const vendorDiscount = safeFloat(data.vendorDiscountPercentage);
    const purchasePrice = Math.max(0, vendorMrp - (vendorMrp * Math.max(0, Math.min(100, vendorDiscount))) / 100);
    const customerPrice = safeFloat(data.customerPrice);
    const stockPayload = {
      vendorId: safeInt(data.vendorId),
      quantity: safeInt(data.stock),
      vendorMrp,
      vendorDiscountPercentage: vendorDiscount,
      purchasePrice,
      sellingPrice: customerPrice,
      amountPaidNow: 0,
    };
    createMutation.mutate({ productPayload: payload, stockPayload, attributeValues });
  };

  const typeOptions = Array.isArray(productTypes)
    ? productTypes.map((t) => ({ label: t.typeName || t.name, value: t.id }))
    : [];
  const brandOptions = Array.isArray(brands)
    ? brands.map((b) => ({ label: b.brandName || b.name, value: b.id }))
    : [];
  const vendorOptions = Array.isArray(vendors)
    ? vendors.map((v) => ({ label: v.vendorName || v.name, value: v.id }))
    : [];
  const unitOptions = Array.isArray(unitTypes)
    ? unitTypes.map((u) => ({
        label: u.unitType || u.unitName || u.name,
        value: u.id,
      }))
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      {/* Container with dynamic height limits */}
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-lg border border-indigo-400/30">
              <svg className="w-5 h-5 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Add New Product</h2>
              <p className="text-xs text-slate-400">Fill in inventory details, pricing, and specific attributes</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setErrorMessage("");
              onClose();
            }}
            className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg p-1.5 transition cursor-pointer"
            aria-label="Close Modal"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-6 bg-slate-50/60 flex-1 overflow-y-auto">
          {errorMessage && (
            <div className="mb-4 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}

          <form id="product-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5 text-xs">
            
            {/* Section 1: Basic Information */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <span className="h-2 w-2 rounded-full bg-indigo-600"></span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">General Information</h3>
              </div>

              <div className="space-y-3">
                <Input
                  label="Product Name"
                  name="productName"
                  placeholder="e.g. Dell UltraSharp 27 Monitor"
                  register={register}
                  rules={{ required: "Product name is required" }}
                  error={errors.productName}
                  required
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Select
                    label="Product Type"
                    name="productTypeId"
                    register={register}
                    rules={{ required: "Product type is required" }}
                    error={errors.productTypeId}
                    required
                    placeholder={loadingTypes ? "Loading..." : "Select Product Type"}
                    options={typeOptions}
                    disabled={loadingTypes}
                  />
                  <Select
                    label="Brand"
                    name="brandId"
                    register={register}
                    rules={{ required: "Brand is required" }}
                    error={errors.brandId}
                    required
                    placeholder={loadingBrands ? "Loading..." : "Select Brand"}
                    options={brandOptions}
                    disabled={loadingBrands}
                  />
                  <Select
                    label="Vendor"
                    name="vendorId"
                    register={register}
                    rules={{ required: "Vendor is required" }}
                    error={errors.vendorId}
                    required
                    placeholder={loadingVendors ? "Loading..." : "Select Vendor"}
                    options={vendorOptions}
                    disabled={loadingVendors}
                  />
                  <Select
                    label="Unit Type"
                    name="unitTypeId"
                    register={register}
                    rules={{ required: "Unit type is required" }}
                    error={errors.unitTypeId}
                    required
                    placeholder={loadingUnits ? "Loading..." : "Select Unit Type"}
                    options={unitOptions}
                    disabled={loadingUnits}
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Pricing & Inventory */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <span className="h-2 w-2 rounded-full bg-emerald-600"></span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Inventory & Pricing</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  label="Stock Quantity"
                  name="stock"
                  type="number"
                  placeholder="0"
                  register={register}
                  rules={{ required: "Stock quantity is required", min: { value: 0, message: "Minimum value is 0" } }}
                  error={errors.stock}
                  required
                />
                <Input
                  label="MRP (₹)"
                  name="mrp"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  register={register}
                  rules={{ required: "MRP is required", min: { value: 0, message: "Minimum value is 0" } }}
                  error={errors.mrp}
                  required
                />
                <Input
                  label="Vendor Discount (%)"
                  name="vendorDiscountPercentage"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  register={register}
                />
                <Input
                  label="Customer Price / Selling Price (₹)"
                  name="customerPrice"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  register={register}
                  rules={{ required: "Selling price is required", min: { value: 0, message: "Minimum value is 0" } }}
                  error={errors.customerPrice}
                  required
                />
              </div>
            </div>

            {/* Section 3: Tax Settings */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Tax Configurations</h3>
                </div>
                <div className="bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                  <Checkbox
                    label="GST Applicable"
                    name="gstApplicable"
                    register={register}
                  />
                </div>
              </div>

              {isGstApplicable && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-amber-50/40 border border-amber-200/60 rounded-xl transition-all">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between gap-2">
                    <Checkbox label="Apply CGST" name="applyCgst" register={register} />
                    <div className="w-24">
                      <Input label="" name="cgstPercentage" type="number" placeholder="9%" register={register} />
                    </div>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between gap-2">
                    <Checkbox label="Apply SGST" name="applySgst" register={register} />
                    <div className="w-24">
                      <Input label="" name="sgstPercentage" type="number" placeholder="9%" register={register} />
                    </div>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between gap-2">
                    <Checkbox label="Apply UGST" name="applyUgst" register={register} />
                    <div className="w-24">
                      <Input label="" name="ugstPercentage" type="number" placeholder="0%" register={register} />
                    </div>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between gap-2">
                    <Checkbox label="Apply IGST" name="applyIgst" register={register} />
                    <div className="w-24">
                      <Input label="" name="igstPercentage" type="number" placeholder="18%" register={register} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Section 4: Dynamic Attributes */}
            {selectedProductTypeId && (
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <span className="h-2 w-2 rounded-full bg-purple-600"></span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Product Specifications {loadingAttributes ? "(Loading...)" : `(${attributes.length})`}
                  </h3>
                </div>

                {loadingAttributes ? (
                  <p className="text-slate-400 italic">Fetching product attributes...</p>
                ) : Array.isArray(attributes) && attributes.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {attributes.map((attribute) => (
                      <Input
                        key={attribute.id}
                        label={attribute.name || attribute.attributeName || `Attribute #${attribute.id}`}
                        name={`attribute_${attribute.id}`}
                        placeholder={`Enter ${attribute.name || 'value'}`}
                        register={register}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic">No additional attributes configured for this product type.</p>
                )}
              </div>
            )}

          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-white border-t border-slate-200 flex justify-end items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              setErrorMessage("");
              onClose();
            }}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="product-form"
            disabled={createMutation.isPending}
            className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm disabled:opacity-50 transition cursor-pointer flex items-center gap-2"
          >
            {createMutation.isPending ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Saving Product...</span>
              </>
            ) : (
              "Save Product"
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ProductModal;