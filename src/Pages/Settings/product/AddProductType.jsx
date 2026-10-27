import {useState} from "react";
import {useQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import {Plus, Search, Trash2, Package, Waypoints, Tags} from "lucide-react";
import {useNavigate} from "react-router-dom";

import {
  fetchProductTypes,
  createProductType,
  deleteProductType,
} from "../../../api/productTypeServiceApi";
import {fetchSubCategories} from "../../../api/subCategoryApi";
import Toast from "../../../Components/Toast";
// import SubCategoryQuickModal from "./SubCategoryQuickModal";
// import AttributeQuickModal from "../Attribute/AttributeQuickModal";
import ProductTypeModal from "./ProductTypeModal";
import DeleteConfirmModal from "../../../Components/DeleteConfirmModal";
import Pagination from "../../../Components/Pagination";

const AddProductType = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productTypeToDelete, setProductTypeToDelete] = useState(null);
  const [toast, setToast] = useState(null);
  // const [subCategoryType, setSubCategoryType] = useState(null);
  // const [attributeType, setAttributeType] = useState(null);

  const navigate = useNavigate();

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const queryClient = useQueryClient();

  const showToast = (message, type = "success") => {
    setToast({message, type});
  };

  // 1. Fetch Product Types
  const {
    data: productTypes = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["productTypes"],
    queryFn: fetchProductTypes,
  });

  // Sub category count per product type (shown in the table)
  const {data: allSubCategories = []} = useQuery({
    queryKey: ["subCategories", "all"],
    queryFn: fetchSubCategories,
  });

  const subCategoryCount = (typeId) =>
    allSubCategories.filter(
      (sc) => String(sc.productType?.id) === String(typeId),
    ).length;

  // 2. Create Product Type Mutation
  const createProductTypeMutation = useMutation({
    mutationFn: createProductType,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["productTypes"]});
      showToast("Product Type created successfully!");
      setIsModalOpen(false);
    },
    onError: (err) => {
      showToast(
        err?.response?.data?.message || "Failed to create product type",
        "error",
      );
    },
  });

  // 3. Delete Product Type Mutation
  const deleteProductTypeMutation = useMutation({
    mutationFn: deleteProductType,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["productTypes"]});
      showToast("Product Type deleted successfully!");
      setProductTypeToDelete(null);
    },
    onError: (err) => {
      showToast(
        err?.response?.data?.message || "Failed to delete product type",
        "error",
      );
    },
  });

  // Action Handlers
  const handleCreateProductType = async (formData) => {
    await createProductTypeMutation.mutateAsync(formData);
  };

  const handleConfirmDelete = () => {
    if (productTypeToDelete) {
      deleteProductTypeMutation.mutate(productTypeToDelete.id);
    }
  };

  // Filter List
  const filteredProductTypes = Array.isArray(productTypes)
    ? productTypes.filter((pt) => {
        const typeValue = pt?.typeName || pt?.productType || pt?.name || "";
        return typeValue.toLowerCase().includes(searchTerm.toLowerCase());
      })
    : [];

  // Pagination Logic
  const totalItems = filteredProductTypes.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProductTypes = filteredProductTypes.slice(
    startIndex,
    endIndex,
  );

  return (
    <div className="w-full space-y-4 px-2 py-2 sm:px-4 sm:py-4">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header Bar */}
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Bar */}
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search Product Type..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="h-9 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Action Button & Counter */}
        <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
          <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
            Total : {filteredProductTypes.length}
          </span>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Add Product Type
          </button>
        </div>
      </div>

      {/* Product Type Table Container */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-187.5 text-xs sm:text-sm text-slate-700">
            <thead className="text-[11px] uppercase tracking-wider font-bold bg-blue-400 text-white">
              <tr>
                <th className="px-4 py-3 text-left">S.No.</th>
                <th className="px-4 py-3 text-left">Product Type</th>
                <th className="px-4 py-3 text-center">Sub Categories</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td
                    colSpan="4"
                    className="py-12 text-center text-sm text-slate-400"
                  >
                    Fetching product type data...
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td
                    colSpan="4"
                    className="py-12 text-center text-sm text-red-500"
                  >
                    {error?.message || "Error loading product types."}
                  </td>
                </tr>
              ) : paginatedProductTypes.length > 0 ? (
                paginatedProductTypes.map((pt, index) => {
                  const count = subCategoryCount(pt.id);
                  return (
                    <tr
                      key={pt.id || index}
                      className="transition-colors hover:bg-slate-50"
                    >
                      <td className="px-4 py-3 font-medium text-slate-500">
                        {startIndex + index + 1}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-800">
                        {pt.typeName || pt.productType || pt.name || "N/A"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                          {count} {count === 1 ? "Item" : "Items"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {/* Sub Category Quick Action Button */}
                          <button
                            type="button"
                            onClick={() =>
                              navigate(`/product-types/${pt.id}/sub-categories`)
                            }
                            className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100"
                            title="Add / manage sub categories"
                          >
                            <Waypoints className="h-3.5 w-3.5" />
                            Sub Category
                          </button>

                          {/* Attribute Quick Action Button */}
                          <button
                            type="button"
                            onClick={() =>
                              navigate(`/product-types/${pt.id}/attributes`)
                            }
                            className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700 transition-colors hover:bg-purple-100"
                            title="Add / manage attributes"
                          >
                            <Tags className="h-3.5 w-3.5" />
                            Attributes
                          </button>

                          {/* Delete Action Button */}
                          <button
                            type="button"
                            onClick={() => setProductTypeToDelete(pt)}
                            disabled={deleteProductTypeMutation.isPending}
                            className="cursor-pointer rounded-lg border border-rose-200 bg-rose-50 p-1.5 text-rose-600 transition-colors hover:bg-rose-100 disabled:opacity-50"
                            title="Delete Product Type"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan="4"
                    className="py-16 text-center text-slate-400"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Package className="h-10 w-10 stroke-1 text-slate-300" />
                      <p className="font-medium text-slate-600">
                        No product types found
                      </p>
                      <p className="text-xs text-slate-400">
                        Try adjusting your search query.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Standalone Pagination Component */}
      {filteredProductTypes.length > 0 && (
        <div className="px-1 py-1">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
            pageSizeOptions={[10, 25, 50, 100]}
          />
        </div>
      )}

      {/* Modal Component */}
      <ProductTypeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateProductType}
        isSubmitting={createProductTypeMutation.isPending}
      />

      {/* {subCategoryType && (
        <SubCategoryQuickModal
          productType={subCategoryType}
          onClose={() => setSubCategoryType(null)}
          onNotify={showToast}
        />
      )}

      {attributeType && (
        <AttributeQuickModal
          productType={attributeType}
          onClose={() => setAttributeType(null)}
          onNotify={showToast}
        />
      )} */}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(productTypeToDelete)}
        itemName={
          productTypeToDelete?.typeName ||
          productTypeToDelete?.productType ||
          productTypeToDelete?.name
        }
        onConfirm={handleConfirmDelete}
        onCancel={() => setProductTypeToDelete(null)}
        isLoading={deleteProductTypeMutation.isPending}
      />
    </div>
  );
};

export default AddProductType;
