import {useState} from "react";
import {useQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import {Plus, Search, Trash2, Package} from "lucide-react";

import {
  fetchProductTypes,
  createProductType,
  deleteProductType,
} from "../../../api/productTypeServiceApi";
import Toast from "../../../Components/Toast";
import ProductTypeModal from "./ProductTypeModal";
import DeleteConfirmModal from "../../../Components/DeleteConfirmModal";
import Pagination from "../../../Components/Pagination"; // Ensure correct relative path

const AddProductType = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productTypeToDelete, setProductTypeToDelete] = useState(null);
  const [toast, setToast] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header Bar */}
      <div className="flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search Product Type..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset to page 1 on search
            }}
            className="w-full rounded-full border border-slate-300 py-2 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Action Button & Counter */}
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
            Total Product Types : {filteredProductTypes.length}
          </span>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow transition-all hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            ADD PRODUCT TYPE
          </button>
        </div>
      </div>

      {/* Product Type Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">S.No.</th>
              <th className="px-4 py-3 font-semibold">Type ID</th>
              <th className="px-4 py-3 font-semibold">Product Type</th>
              <th className="px-4 py-3 text-center font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td
                  colSpan="4"
                  className="py-8 text-center text-slate-400"
                >
                  Fetching product type data...
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td
                  colSpan="4"
                  className="py-8 text-center text-red-500"
                >
                  {error?.message || "Error loading product types."}
                </td>
              </tr>
            ) : paginatedProductTypes.length > 0 ? (
              paginatedProductTypes.map((pt, index) => (
                <tr
                  key={pt.id || index}
                  className="hover:bg-slate-50/80"
                >
                  <td className="px-4 py-3 font-medium text-slate-500">
                    {startIndex + index + 1}
                  </td>
                  <td className="px-4 py-3 text-slate-600">#{pt.id}</td>
                  <td className="px-4 py-3 font-bold text-slate-800">
                    {pt.typeName || pt.productType || pt.name || "N/A"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => setProductTypeToDelete(pt)}
                      disabled={deleteProductTypeMutation.isPending}
                      className="cursor-pointer rounded p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                      title="Delete Product Type"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="4"
                  className="py-12 text-center text-slate-400"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Package className="h-10 w-10 stroke-1 text-slate-300" />
                    <p className="font-medium">No product types found</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Standalone Pagination Component */}
      {filteredProductTypes.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          startIndex={startIndex}
          endIndex={endIndex}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          pageSizeOptions={[10, 25, 50, 100]}
          itemName="product types"
        />
      )}

      {/* Modal Component */}
      <ProductTypeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateProductType}
        isSubmitting={createProductTypeMutation.isPending}
      />

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
