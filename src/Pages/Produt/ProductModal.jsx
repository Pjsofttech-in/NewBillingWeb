import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createProduct } from "../../api/productApi";

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
      price: "0",
      gstApplicable: false,
      applyCgst: false,
      applySgst: false,
      cgstPercentage: "0",
      sgstPercentage: "0",
    },
  });

  const isGstApplicable = useWatch({ control, name: "gstApplicable" });

  useEffect(() => {
    if (!isGstApplicable) {
      setValue("applyCgst", false);
      setValue("applySgst", false);
      setValue("cgstPercentage", "0");
      setValue("sgstPercentage", "0");
    }
  }, [isGstApplicable, setValue]);

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

  const createMutation = useMutation({
    mutationFn: createProduct,
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
        "Failed to create product";
      setErrorMessage(msg);
    },
  });

  if (!isOpen) return null;

  // Helper function to safely parse numeric inputs to avoid NaN
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
      customerPrice: safeFloat(data.price),
      stock: safeInt(data.stock),
      gstApplicable: Boolean(data.gstApplicable),
      applyCgst: Boolean(data.applyCgst),
      cgstPercentage: data.applyCgst ? safeFloat(data.cgstPercentage) : 0,
      applySgst: Boolean(data.applySgst),
      sgstPercentage: data.applySgst ? safeFloat(data.sgstPercentage) : 0,
      productType: { id: safeInt(data.productTypeId) },
      brand: { id: safeInt(data.brandId) },
      vendor: { id: safeInt(data.vendorId) },
      unitType: { id: safeInt(data.unitTypeId) },
    };

    createMutation.mutate(payload);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl transition-all">
        <div className="flex justify-between items-center mb-4 border-b pb-3">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800">
            Add New Product
          </h2>
          <button
            onClick={() => {
              setErrorMessage("");
              onClose();
            }}
            className="text-gray-400 hover:text-gray-700 font-bold text-xl px-2 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Product Name"
              name="productName"
              placeholder="e.g. Dell Laptop"
              register={register}
              rules={{ required: "Product name is required" }}
              error={errors.productName}
              required
            />

            <Select
              label="Product Type"
              name="productTypeId"
              register={register}
              rules={{ required: "Product type is required" }}
              error={errors.productTypeId}
              required
              placeholder={
                loadingTypes ? "Loading types..." : "Select Product Type"
              }
              options={typeOptions}
              disabled={loadingTypes}
            />

            <Input
              label="Stock Quantity"
              name="stock"
              type="number"
              placeholder="0"
              register={register}
              rules={{
                required: "Stock is required",
                min: { value: 0, message: "Stock cannot be negative" },
              }}
              error={errors.stock}
              required
            />

            <Select
              label="Unit Type"
              name="unitTypeId"
              register={register}
              rules={{ required: "Unit type is required" }}
              error={errors.unitTypeId}
              required
              placeholder={
                loadingUnits ? "Loading unit types..." : "Select Unit Type"
              }
              options={unitOptions}
              disabled={loadingUnits}
            />

            <Select
              label="Brand"
              name="brandId"
              register={register}
              rules={{ required: "Brand is required" }}
              error={errors.brandId}
              required
              placeholder={
                loadingBrands ? "Loading brands..." : "Select Brand"
              }
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
              placeholder={
                loadingVendors ? "Loading vendors..." : "Select Vendor"
              }
              options={vendorOptions}
              disabled={loadingVendors}
            />

            <Input
              label="MRP"
              name="mrp"
              type="number"
              step="0.01"
              placeholder="0.00"
              register={register}
              rules={{
                required: "MRP is required",
                min: { value: 0, message: "MRP must be positive" },
              }}
              error={errors.mrp}
              required
            />

            <Input
              label="Vendor Discount (%)"
              name="vendorDiscountPercentage"
              type="number"
              step="0.01"
              placeholder="0"
              register={register}
            />

            <Input
              label="Customer Selling Price"
              name="price"
              type="number"
              step="0.01"
              placeholder="0.00"
              register={register}
              rules={{
                required: "Selling price is required",
                min: { value: 0, message: "Price must be positive" },
              }}
              error={errors.price}
              required
            />

            <div className="flex items-center pt-2 sm:col-span-2">
              <Checkbox
                label="Is GST Applicable?"
                name="gstApplicable"
                register={register}
              />
            </div>

            {isGstApplicable && (
              <>
                <div className="flex items-center gap-4 sm:col-span-2">
                  <Checkbox
                    label="Apply CGST"
                    name="applyCgst"
                    register={register}
                  />
                  <Checkbox
                    label="Apply SGST"
                    name="applySgst"
                    register={register}
                  />
                </div>

                <Input
                  label="CGST Percentage (%)"
                  name="cgstPercentage"
                  type="number"
                  placeholder="9"
                  register={register}
                />

                <Input
                  label="SGST Percentage (%)"
                  name="sgstPercentage"
                  type="number"
                  placeholder="9"
                  register={register}
                />
              </>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => {
                setErrorMessage("");
                onClose();
              }}
              className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {createMutation.isPending ? "Saving..." : "Save Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;