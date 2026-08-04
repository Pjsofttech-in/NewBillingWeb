import {useState} from "react";
import {useQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import {Plus, Search, Trash2, Package} from "lucide-react";

import {
  fetchProductTypes,
  createProductType,
  deleteProductType,
} from "../../../api/productTypeServiceApi";
import Toast from "../../../Components/Toast";
import ProductTypeModal from "../product/ProductTypeModal";

const AddProductType = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const queryClient = useQueryClient();

  const showToast = (message, type = "success") => {
    setToast({message, type});
  };

  // 1. Fetch Product Types using TanStack Query
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
    },
    onError: (err) => {
      showToast(
        err?.response?.data?.message || "Failed to delete product type",
        "error",
      );
    },
  });

  // Action Handlers
  const handleCreateProductType = async (data) => {
    await createProductTypeMutation.mutateAsync(data);
  };

  const handleDeleteProductType = (id) => {
    if (window.confirm("Are you sure you want to delete this product type?")) {
      deleteProductTypeMutation.mutate(id);
    }
  };

  // Search Filter: Defensive checks across possible payload structures
  const filteredProductTypes = Array.isArray(productTypes)
    ? productTypes.filter((pt) => {
        const typeValue = pt?.typeName || pt?.productType || pt?.name || "";
        return typeValue.toLowerCase().includes(searchTerm.toLowerCase());
      })
    : [];

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search Product Type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border rounded-full outline-none focus:ring-2 focus:ring-blue-500 border-slate-300"
          />
        </div>

        {/* Action Button & Counter */}
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-blue-50 border border-blue-200 px-3 py-1.5 text-xs font-bold text-blue-700">
            Total Product Types : {filteredProductTypes.length}
          </span>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-[#0073b7] hover:bg-[#0867a0] px-4 py-2 text-sm font-semibold text-white shadow transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            ADD PRODUCT TYPE
          </button>
        </div>
      </div>

      {/* Product Type Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 font-semibold">S.No.</th>
              <th className="px-4 py-3 font-semibold">Type ID</th>
              <th className="px-4 py-3 font-semibold">Product Type</th>
              <th className="px-4 py-3 font-semibold text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td
                  colSpan="4"
                  className="text-center py-8 text-slate-400"
                >
                  Fetching product type data...
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td
                  colSpan="4"
                  className="text-center py-8 text-red-500"
                >
                  {error?.message || "Error loading product types."}
                </td>
              </tr>
            ) : filteredProductTypes.length > 0 ? (
              filteredProductTypes.map((pt, index) => (
                <tr
                  key={pt.id || index}
                  className="hover:bg-slate-50/80"
                >
                  <td className="px-4 py-3 font-medium text-slate-500">
                    {index + 1}
                  </td>
                  <td className="px-4 py-3 text-slate-600">#{pt.id}</td>
                  <td className="px-4 py-3 font-bold text-slate-800">
                    {/* Fallback chain guarantees value renders correctly */}
                    {pt.typeName || pt.productType || pt.name || "N/A"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleDeleteProductType(pt.id)}
                      disabled={deleteProductTypeMutation.isPending}
                      className="rounded p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 cursor-pointer disabled:opacity-50"
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
                  className="text-center py-12 text-slate-400"
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

      {/* Modal Component */}
      <ProductTypeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateProductType}
        isSubmitting={createProductTypeMutation.isPending}
      />
    </div>
  );
};

export default AddProductType;
