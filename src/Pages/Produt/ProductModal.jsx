import {useEffect} from "react";
import {useForm} from "react-hook-form";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {createProduct} from "../../api/productApi";

import {fetchBrands} from "../../api/brandServiceApi";
import {fetchVendors} from "../../api/vendorServiceApi";
import {fetchUnitTypes} from "../../api/unitTypeServiceApi";
import Input from "../../Components/Form/Input";
import Select from "../../Components/Form/Select";
import {fetchProductTypes} from "../../api/productTypeServiceApi";

const ProductModal = ({isOpen, onClose}) => {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: {errors},
  } = useForm({
    defaultValues: {
      gstApplicable: "true", // Default to true or "" based on your requirement
      gstPercentage: "",
    },
  });

  // Watch the gstApplicable field value
  const isGstApplicable = watch("gstApplicable");

  // Automatically reset/clear GST percentage when gstApplicable is changed to "false"
  useEffect(() => {
    if (isGstApplicable === "false") {
      setValue("gstPercentage", "0");
    }
  }, [isGstApplicable, setValue]);

  // 1. Fetch Dynamic Dropdown Data from Backend APIs
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

  // 2. Mutation to save Product
  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["products"]});
      reset();
      onClose();
    },
    onError: (err) => {
      alert(
        "Failed to create product: " +
          (err.response?.data?.message || err.message),
      );
    },
  });

  if (!isOpen) return null;

  const onSubmit = (data) => {
    // Transform payload so Spring Boot @ManyToOne relations parse correctly
    const payload = {
      productName: data.productName,
      price: parseFloat(data.price),
      mrp: parseFloat(data.mrp),
      stock: parseInt(data.stock, 10),
      gstApplicable: data.gstApplicable === "true",
      gstPercentage:
        data.gstApplicable === "true" ? parseFloat(data.gstPercentage || 0) : 0,
      productType: {id: parseInt(data.productTypeId, 10)},
      brand: {id: parseInt(data.brandId, 10)},
      vendor: {id: parseInt(data.vendorId, 10)},
      unitType: {id: parseInt(data.unitTypeId, 10)},
    };

    createMutation.mutate(payload);
  };

  // Helper functions to format arrays into { label, value } for the Select component
  const typeOptions = Array.isArray(productTypes)
    ? productTypes.map((t) => ({label: t.typeName || t.name, value: t.id}))
    : [];

  const brandOptions = Array.isArray(brands)
    ? brands.map((b) => ({label: b.brandName || b.name, value: b.id}))
    : [];

  const vendorOptions = Array.isArray(vendors)
    ? vendors.map((v) => ({label: v.vendorName || v.name, value: v.id}))
    : [];

  const unitOptions = Array.isArray(unitTypes)
    ? unitTypes.map((u) => ({
        label: u.unitType || u.unitName || u.name,
        value: u.id,
      }))
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Add New Product</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 font-bold text-xl"
          >
            ✕
          </button>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Product Name"
              name="productName"
              placeholder="e.g. Dell Laptop"
              register={register}
              rules={{required: "Product name is required"}}
              error={errors.productName}
              required
            />

            <Input
              label="Stock Quantity"
              name="stock"
              type="number"
              placeholder="0"
              register={register}
              rules={{required: "Stock is required", min: 0}}
              error={errors.stock}
              required
            />

            <Input
              label="Price (Selling)"
              name="price"
              type="number"
              step="0.01"
              placeholder="0.00"
              register={register}
              rules={{required: "Price is required"}}
              error={errors.price}
              required
            />

            <Input
              label="MRP"
              name="mrp"
              type="number"
              step="0.01"
              placeholder="0.00"
              register={register}
              rules={{required: "MRP is required"}}
              error={errors.mrp}
              required
            />

            <Select
              label="GST Applicable"
              name="gstApplicable"
              register={register}
              rules={{required: "Please select GST option"}}
              error={errors.gstApplicable}
              required
              options={[
                {label: "Yes", value: "true"},
                {label: "No", value: "false"},
              ]}
            />

            {/* GST Percentage field with dynamic disable & validation */}
            <Input
              label="GST Percentage (%)"
              name="gstPercentage"
              type="number"
              placeholder={isGstApplicable === "false" ? "0" : "18"}
              register={register}
              disabled={isGstApplicable === "false"}
              rules={{
                required:
                  isGstApplicable === "true"
                    ? "GST percentage is required"
                    : false,
              }}
              error={errors.gstPercentage}
            />

            {/* Dynamic Backend Select Dropdowns */}
            <Select
              label="Product Type"
              name="productTypeId"
              register={register}
              rules={{required: "Product type is required"}}
              error={errors.productTypeId}
              required
              placeholder={
                loadingTypes ? "Loading types..." : "Select Product Type"
              }
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
              placeholder={loadingBrands ? "Loading brands..." : "Select Brand"}
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
              placeholder={
                loadingVendors ? "Loading vendors..." : "Select Vendor"
              }
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
              placeholder={
                loadingUnits ? "Loading unit types..." : "Select Unit Type"
              }
              options={unitOptions}
              disabled={loadingUnits}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
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
