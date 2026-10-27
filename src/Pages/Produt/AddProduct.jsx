import {useMemo, useState} from "react";
import {useNavigate} from "react-router-dom";
import {useQuery, keepPreviousData} from "@tanstack/react-query";
import {PackagePlus, Plus, Receipt, X} from "lucide-react";
import {fetchAllProducts, exportProducts} from "../../api/productApi";
import {fetchBrands} from "../../api/brandServiceApi";
import {fetchVendors} from "../../api/vendorServiceApi";
import {fetchUnitTypes} from "../../api/unitTypeServiceApi";
import {fetchProductTypes} from "../../api/productTypeServiceApi";
import {fetchSubCategories} from "../../api/subCategoryApi";

import ProductList from "./ProductList";
import ProductModal from "./ProductModal";
import UpdateStockModal from "./UpdateStockModal";
import SearchableSelect from "../../Components/Form/SearchableSelect";
import SearchBar from "../../Components/SearchBar";
import ExportButtons from "../../Components/ExportButtons";
import Toast from "../../Components/Toast";

const EMPTY_FILTERS = {
  productName: "",
  productTypeId: "",
  subCategoryId: "",
  brandId: "",
  vendorId: "",
  unitTypeId: "",
};

const AddProduct = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // Fetch dropdown list options
  const {data: productTypes = []} = useQuery({
    queryKey: ["productTypes"],
    queryFn: fetchProductTypes,
  });
  const {data: subCategories = []} = useQuery({
    queryKey: ["subCategories", "all"],
    queryFn: fetchSubCategories,
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
    // keep the table (and the toolbar with the search box) mounted while a new search loads
    placeholderData: keepPreviousData,
  });

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      // a sub category belongs to one type, so drop it when the type changes
      ...(key === "productTypeId" ? {subCategoryId: ""} : {}),
    }));
  };

  const hasActiveFilters = Object.values(filters).some(
    (v) => v !== "" && v !== null && v !== undefined,
  );

  const showToast = (message, type = "success") => setToast({message, type});

  // Downloads exactly what the table shows: same filters, done by the backend.
  const handleExport = (format) => exportProducts(format, filters);

  const typeOptions = productTypes.map((t) => ({
    label: t.typeName || t.name,
    value: t.id,
  }));
  const subCategoryOptions = useMemo(
    () =>
      subCategories
        .filter(
          (sc) =>
            !filters.productTypeId ||
            String(sc.productType?.id) === String(filters.productTypeId),
        )
        .map((sc) => ({label: sc.subCategoryName, value: sc.id})),
    [subCategories, filters.productTypeId],
  );
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

  // Order inside toolbar: 1) filters  2) total count + action buttons
  const toolbar = (
    <div className="w-full bg-white p-3 rounded-xl border border-slate-200 shadow-sm space-y-3">
      {/* ============ 1) FILTERS ============ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2">
        <SearchBar
          value={filters.productName}
          onChange={(text) => handleFilterChange("productName", text)}
          placeholder="Search product..."
          ariaLabel="Search products"
          size="md"
        />

        <SearchableSelect
          placeholder="All Types"
          allLabel="All Types"
          options={typeOptions}
          value={filters.productTypeId}
          onChange={(val) => handleFilterChange("productTypeId", val)}
        />

        {filters.productTypeId && (
          <SearchableSelect
            placeholder="All Sub Categories"
            allLabel="All Sub Categories"
            options={subCategoryOptions}
            value={filters.subCategoryId}
            onChange={(val) => handleFilterChange("subCategoryId", val)}
          />
        )}

        <SearchableSelect
          placeholder="All Brands"
          allLabel="All Brands"
          options={brandOptions}
          value={filters.brandId}
          onChange={(val) => handleFilterChange("brandId", val)}
        />

        <SearchableSelect
          placeholder="All Vendors"
          allLabel="All Vendors"
          options={vendorOptions}
          value={filters.vendorId}
          onChange={(val) => handleFilterChange("vendorId", val)}
        />

        <SearchableSelect
          placeholder="All Units"
          allLabel="All Units"
          options={unitOptions}
          value={filters.unitTypeId}
          onChange={(val) => handleFilterChange("unitTypeId", val)}
        />
      </div>

      {/* ============ 2) TOTAL COUNT + ACTION BUTTONS (below filters) ============ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-slate-100">
        {/* Left: total count + clear filters */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-xs font-bold border border-blue-100">
            Total products
            <span className="bg-blue-600 text-white rounded-full px-2 py-1 text-[11px] leading-none">
              {products.length}
            </span>
          </span>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => setFilters(EMPTY_FILTERS)}
              className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-red-50 hover:text-red-600 transition cursor-pointer"
            >
              <X size={14} />
              Clear
            </button>
          )}
        </div>

        {/* Right: action buttons */}
        <div className="grid grid-cols-3 sm:flex sm:flex-wrap items-center gap-2 w-full sm:w-auto">
          <ExportButtons
            className="col-span-3 sm:col-span-1"
            itemName="products"
            filtered={hasActiveFilters}
            disabled={isLoading || products.length === 0}
            onExport={handleExport}
            onError={(message) => showToast(message, "error")}
          />

          <button
            type="button"
            onClick={() => setIsStockModalOpen(true)}
            className="h-9 px-3.5 rounded-lg text-sm font-semibold text-white bg-linear-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-sm hover:shadow-md active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <PackagePlus size={16} />
            <span className="truncate">Update stock</span>
          </button>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="h-9 px-3.5 rounded-lg text-sm font-semibold text-white bg-linear-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-sm hover:shadow-md active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus size={16} />
            <span className="truncate">Add Product</span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/vendor-bills")}
            className="h-9 px-3.5 rounded-lg text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 hover:border-slate-400 shadow-sm active:scale-95 transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Receipt size={16} />
            <span className="truncate">Vendor bills</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full px-1 sm:px-2 py-1 space-y-3">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

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

        {!isLoading && !isError && (
          <ProductList
            products={products}
            toolbar={toolbar}
          />
        )}
      </div>

      {/* Modals */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={(planError) =>
          planError
            ? showToast(
                `Product created, but the installment plan failed: ${planError}. Create it from Vendor Bills.`,
                "error",
              )
            : showToast("Product created successfully!", "success")
        }
      />

      <UpdateStockModal
        isOpen={isStockModalOpen}
        productsList={products}
        onClose={() => setIsStockModalOpen(false)}
        onSuccess={(updated, planError) =>
          planError
            ? showToast(
                `Stock updated, but the installment plan failed: ${planError}. Create it from Vendor Bills.`,
                "error",
              )
            : showToast("Stock updated successfully!", "success")
        }
      />
    </div>
  );
};

export default AddProduct;
