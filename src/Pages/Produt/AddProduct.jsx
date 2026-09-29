import {useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {fetchAllProducts} from "../../api/productApi";
import {fetchBrands} from "../../api/brandServiceApi";
import {fetchVendors} from "../../api/vendorServiceApi";
import {fetchUnitTypes} from "../../api/unitTypeServiceApi";
import {fetchProductTypes} from "../../api/productTypeServiceApi";

import ProductList from "./ProductList";
import ProductModal from "./ProductModal";
import UpdateStockModal from "./UpdateStockModal";
import VendorBillModal from "./VendorBillModal";
import SearchableSelect from "../../Components/Form/SearchableSelect";
import Toast from "../../Components/Toast";

const AddProduct = () => {
  const [filters, setFilters] = useState({
    productName: "",
    productTypeId: "",
    brandId: "",
    vendorId: "",
    unitTypeId: "",
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [showVendorBills, setShowVendorBills] = useState(false);
  const [toast, setToast] = useState(null);

  // Fetch dropdown list options
  const {data: productTypes = []} = useQuery({
    queryKey: ["productTypes"],
    queryFn: fetchProductTypes,
  });
  const {data: brands = []} = useQuery({
    queryKey: ["brands"],
    queryFn: fetchBrands,
  });
  const {data: vendors = []} = useQuery({
    queryKey: ["vendors"],
    queryFn: fetchVendors,
  });
  const {data: unitTypes = []} = useQuery({
    queryKey: ["unitTypes"],
    queryFn: fetchUnitTypes,
  });

  // Fetch backend-filtered products dynamically on filter changes
  const {
    data: products = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["products", filters],
    queryFn: () => fetchAllProducts(filters),
  });

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({...prev, [key]: value}));
  };

  const showToast = (message, type = "success") => setToast({message, type});

  const typeOptions = productTypes.map((t) => ({
    label: t.typeName || t.name,
    value: t.id,
  }));
  const brandOptions = brands.map((b) => ({
    label: b.brandName || b.name,
    value: b.id,
  }));
  const vendorOptions = vendors.map((v) => ({
    label: v.vendorName || v.name,
    value: v.id,
  }));
  const unitOptions = unitTypes.map((u) => ({
    label: u.unitType || u.name,
    value: u.id,
  }));

  return (
    <div className="w-full px-1 sm:px-2 py-1 space-y-1.5">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Integrated Filter & Actions Header */}
      <div className="w-full bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs space-y-2">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
          {/* Left: Title */}
          <div className="flex items-center gap-2">
            {/* <span className="text-sm font-bold text-slate-800">
              Filter Products
            </span> */}
            {/* <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[11px] font-semibold border border-blue-100">
              Total: {products.length}
            </span> */}
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[11px] font-semibold border border-blue-100">
              Total: {products.length}
            </span>
            <button
              onClick={() => setIsStockModalOpen(true)}
              className="flex-1 sm:flex-none px-2.5 py-1 bg-emerald-600 text-white font-semibold rounded text-xs hover:bg-emerald-700 transition shadow-xs flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>+</span> Update Stock
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex-1 sm:flex-none px-2.5 py-1 bg-blue-600 text-white font-semibold rounded text-xs hover:bg-blue-700 transition shadow-xs flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>+</span> Add Product
            </button>

            <button
              onClick={() => setShowVendorBills(true)}
              className="flex-1 sm:flex-none px-2.5 py-1 bg-slate-100 text-slate-700 font-semibold rounded text-xs hover:bg-slate-200 transition shadow-xs flex items-center justify-center gap-1 cursor-pointer border border-slate-200"
            >
              Vendor Bills
            </button>
          </div>
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {/* Product Name Search */}
          <div>
            {/* <label className="block text-[12px] font-semibold text-slate-600 mb-0.5">
              Product Name
            </label> */}
            <input
              type="text"
              placeholder="Search product..."
              value={filters.productName}
              onChange={(e) =>
                handleFilterChange("productName", e.target.value)
              }
              className="w-full px-2.5 py-2 border rounded text-xs outline-none focus:ring-1 focus:ring-blue-500 border-slate-300 transition"
            />
          </div>

          {/* Product Type Searchable Dropdown */}
          <SearchableSelect
            // label="Product Type"
            placeholder="All Types"
            allLabel="All Types"
            options={typeOptions}
            value={filters.productTypeId}
            onChange={(val) => handleFilterChange("productTypeId", val)}
          />

          {/* Brand Searchable Dropdown */}
          <SearchableSelect
            // label="Brand"
            placeholder="All Brands"
            allLabel="All Brands"
            options={brandOptions}
            value={filters.brandId}
            onChange={(val) => handleFilterChange("brandId", val)}
          />

          {/* Vendor Searchable Dropdown */}
          <SearchableSelect
            // label="Vendor"
            placeholder="All Vendors"
            allLabel="All Vendors"
            options={vendorOptions}
            value={filters.vendorId}
            onChange={(val) => handleFilterChange("vendorId", val)}
          />

          {/* Unit Type Searchable Dropdown */}
          <SearchableSelect
            // label="Unit Type"
            placeholder="All Units"
            allLabel="All Units"
            options={unitOptions}
            value={filters.unitTypeId}
            onChange={(val) => handleFilterChange("unitTypeId", val)}
          />
        </div>
      </div>

      {/* Product Table View */}
      <div className="w-full">
        {isLoading && (
          <div className="flex justify-center items-center py-10 bg-white rounded border border-slate-200">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-xs text-slate-600 font-medium">
              Loading products...
            </span>
          </div>
        )}

        {isError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-center text-red-600 text-xs font-medium">
            Error loading products:{" "}
            {error?.response?.data?.message ||
              error?.message ||
              "Something went wrong"}
          </div>
        )}

        {!isLoading && !isError && <ProductList products={products} />}
      </div>

      {/* Modals */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => showToast("Product created successfully!", "success")}
      />

      <UpdateStockModal
        isOpen={isStockModalOpen}
        productsList={products}
        onClose={() => setIsStockModalOpen(false)}
        onSuccess={() => showToast("Stock updated successfully!", "success")}
      />

      <VendorBillModal
        isOpen={showVendorBills}
        onClose={() => setShowVendorBills(false)}
      />
    </div>
  );
};

export default AddProduct;
