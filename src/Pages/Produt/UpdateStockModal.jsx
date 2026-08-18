import {useState, useEffect} from "react";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import API from "../../api/axios";
import {fetchVendors} from "../../api/vendorServiceApi";
import SearchableSelect from "../../Components/Form/SearchableSelect";

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
  const [customerPrice, setCustomerPrice] = useState("");
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState("");

  const activeProduct =
    product ||
    productsList.find((p) => p.id === parseInt(selectedProductId, 10));

  useEffect(() => {
    if (product) {
      setSelectedProductId(product.id.toString());
      setSelectedVendorId(
        product.vendor?.id ? product.vendor.id.toString() : "",
      );
      setMrp(product.mrp || "");
      setVendorDiscountPercentage(product.vendorDiscountPercentage || "");
      setCustomerPrice(product.customerPrice || product.price || "");
    } else {
      setSelectedProductId("");
      setSelectedVendorId("");
      setMrp("");
      setVendorDiscountPercentage("");
      setCustomerPrice("");
    }
  }, [product, isOpen]);

  useEffect(() => {
    if (!product && activeProduct) {
      setSelectedVendorId(
        activeProduct.vendor?.id ? activeProduct.vendor.id.toString() : "",
      );
      setMrp(activeProduct.mrp || "");
      setVendorDiscountPercentage(activeProduct.vendorDiscountPercentage || "");
      setCustomerPrice(
        activeProduct.customerPrice || activeProduct.price || "",
      );
    }
  }, [selectedProductId, activeProduct, product]);

  const {data: vendors = [], isLoading: loadingVendors} = useQuery({
    queryKey: ["vendors"],
    queryFn: fetchVendors,
    enabled: isOpen,
  });

  const updateStockMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await API.put(
        `/api/products/${activeProduct.id}/add-stock`,
        payload,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["products"]});
      if (onSuccess) onSuccess();
      handleClose();
    },
    onError: (err) => {
      setError(err.response?.data?.message || "Failed to update stock");
    },
  });

  const handleClose = () => {
    setSelectedProductId("");
    setAddedQuantity("");
    setSelectedVendorId("");
    setMrp("");
    setVendorDiscountPercentage("");
    setCustomerPrice("");
    setRemarks("");
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!activeProduct) {
      setError("Please select a product");
      return;
    }
    if (!addedQuantity || parseInt(addedQuantity, 10) <= 0) {
      setError("Please enter a valid quantity greater than 0");
      return;
    }

    const payload = {
      addedQuantity: parseInt(addedQuantity, 10),
      vendorId: selectedVendorId ? parseInt(selectedVendorId, 10) : null,
      mrp: mrp ? parseFloat(mrp) : null,
      vendorDiscountPercentage: vendorDiscountPercentage
        ? parseFloat(vendorDiscountPercentage)
        : null,
      customerPrice: customerPrice ? parseFloat(customerPrice) : null,
      remarks: remarks || "Restocked via UI",
    };

    updateStockMutation.mutate(payload);
  };

  // Options mapping for SearchableSelect
  const productOptions = Array.isArray(productsList)
    ? productsList.map((p) => ({
        label: `${p.productName} (Current Stock: ${p.stock ?? 0})`,
        value: p.id.toString(),
      }))
    : [];

  const vendorOptions = Array.isArray(vendors)
    ? vendors.map((v) => ({
        label: v.vendorName || v.name,
        value: v.id.toString(),
      }))
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h3 className="text-lg font-bold text-gray-800">
            {activeProduct
              ? `Add Stock - ${activeProduct.productName}`
              : "Add / Update Stock"}
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 font-bold"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-3 p-2 bg-red-50 text-red-600 border border-red-200 rounded text-sm">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {/* Product Searchable Selector if triggered globally */}
          {!product && (
            <SearchableSelect
              label="Select Product *"
              placeholder="-- Choose Product --"
              options={productOptions}
              value={selectedProductId}
              onChange={(val) => setSelectedProductId(val)}
            />
          )}

          {activeProduct && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Current Available Stock
              </label>
              <input
                type="text"
                disabled
                value={`${activeProduct.stock || 0} ${
                  activeProduct.unitType?.unitType || ""
                }`}
                className="w-full bg-gray-100 border p-2 rounded text-sm font-bold text-gray-700"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Quantity to Add (+) *
            </label>
            <input
              type="number"
              min="1"
              value={addedQuantity}
              onChange={(e) => setAddedQuantity(e.target.value)}
              placeholder="e.g. 50"
              className="w-full border p-2 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          {/* Supplier / Vendor Searchable Selector */}
          <SearchableSelect
            label="Supplier / Vendor"
            placeholder={
              loadingVendors ? "Loading vendors..." : "Select Vendor"
            }
            options={vendorOptions}
            value={selectedVendorId}
            onChange={(val) => setSelectedVendorId(val)}
          />

          {/* Batch Pricing Inputs */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Batch MRP (₹)
              </label>
              <input
                type="number"
                step="0.01"
                value={mrp}
                onChange={(e) => setMrp(e.target.value)}
                placeholder="0.00"
                className="w-full border p-2 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Vendor Discount (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={vendorDiscountPercentage}
                onChange={(e) => setVendorDiscountPercentage(e.target.value)}
                placeholder="0"
                className="w-full border p-2 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Customer Selling Price (₹)
            </label>
            <input
              type="number"
              step="0.01"
              value={customerPrice}
              onChange={(e) => setCustomerPrice(e.target.value)}
              placeholder="0.00"
              className="w-full border p-2 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Remarks / Note (Optional)
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Purchased from Supplier X"
              className="w-full border p-2 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm cursor-pointer hover:bg-gray-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateStockMutation.isPending}
              className="px-4 py-2 bg-emerald-600 text-white rounded-md text-sm hover:bg-emerald-700 disabled:opacity-50 cursor-pointer transition"
            >
              {updateStockMutation.isPending ? "Updating..." : "Add Stock"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateStockModal;
