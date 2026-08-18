import {useState} from "react";
import {useQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import {Plus, Search, Trash2, Tag} from "lucide-react";

import {
  fetchBrands,
  createBrand,
  deleteBrand,
} from "../../../api/brandServiceApi";
import Toast from "../../../Components/Toast";
import BrandModal from "./BrandModal";
import Pagination from "../../../Components/Pagination";
import DeleteConfirmModal from "../../../Components/DeleteConfirmModal";
import {usePagination} from "../../../hooks/usePagination";

const AddBrand = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [brandToDelete, setBrandToDelete] = useState(null);
  const [toast, setToast] = useState(null);

  const queryClient = useQueryClient();

  const showToast = (message, type = "success") => {
    setToast({message, type});
  };

  // 1. Fetch Brands using TanStack Query
  const {
    data: brands = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["brands"],
    queryFn: fetchBrands,
  });

  // Search Filter
  const filteredBrands = brands.filter((brand) =>
    brand.brandName?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Pagination hook
  const pagination = usePagination(filteredBrands, 10, searchTerm);

  // 2. Create Brand Mutation
  const createBrandMutation = useMutation({
    mutationFn: createBrand,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["brands"]});
      showToast("Brand created successfully!");
      setIsModalOpen(false);
    },
    onError: (err) => {
      showToast(
        err?.response?.data?.message || "Failed to create brand",
        "error",
      );
    },
  });

  // 3. Delete Brand Mutation
  const deleteBrandMutation = useMutation({
    mutationFn: deleteBrand,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["brands"]});
      showToast("Brand deleted successfully!");
      setBrandToDelete(null);
    },
    onError: (err) => {
      showToast(
        err?.response?.data?.message || "Failed to delete brand",
        "error",
      );
    },
  });

  // Action Triggers
  const handleCreateBrand = async (data) => {
    await createBrandMutation.mutateAsync(data);
  };

  const handleConfirmDelete = () => {
    if (brandToDelete) {
      deleteBrandMutation.mutate(brandToDelete.id);
    }
  };

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
            placeholder="Search Brand Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border rounded-full outline-none focus:ring-2 focus:ring-blue-500 border-slate-300"
          />
        </div>

        {/* Action Button & Counter */}
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-blue-50 border border-blue-200 px-3 py-1.5 text-xs font-bold text-blue-700">
            Total Brands : {brands.length}
          </span>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-[#0073b7] hover:bg-[#0867a0] px-4 py-2 text-sm font-semibold text-white shadow transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            ADD BRAND
          </button>
        </div>
      </div>

      {/* Brand Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 font-semibold">S.No.</th>
              <th className="px-4 py-3 font-semibold">Brand ID</th>
              <th className="px-4 py-3 font-semibold">Brand Name</th>
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
                  Fetching brand data...
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td
                  colSpan="4"
                  className="text-center py-8 text-red-500"
                >
                  {error?.message || "Error loading brands."}
                </td>
              </tr>
            ) : pagination.paginatedData.length > 0 ? (
              pagination.paginatedData.map((brand, index) => (
                <tr
                  key={brand.id || index}
                  className="hover:bg-slate-50/80"
                >
                  <td className="px-4 py-3 font-medium text-slate-500">
                    {pagination.startIndex + index + 1}
                  </td>
                  <td className="px-4 py-3 text-slate-600">#{brand.id}</td>
                  <td className="px-4 py-3 font-bold text-slate-800">
                    {brand.brandName}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => setBrandToDelete(brand)}
                      disabled={deleteBrandMutation.isPending}
                      className="rounded p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 cursor-pointer disabled:opacity-50"
                      title="Delete Brand"
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
                    <Tag className="h-10 w-10 stroke-1 text-slate-300" />
                    <p className="font-medium">No brands found</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {!isLoading && !isError && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          startIndex={pagination.startIndex}
          endIndex={pagination.endIndex}
          itemsPerPage={pagination.itemsPerPage}
          onPageChange={pagination.setCurrentPage}
          onItemsPerPageChange={pagination.setItemsPerPage}
          itemName="brands"
        />
      )}

      {/* Brand Modal */}
      <BrandModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateBrand}
        isSubmitting={createBrandMutation.isPending}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(brandToDelete)}
        itemName={brandToDelete?.brandName}
        onConfirm={handleConfirmDelete}
        onCancel={() => setBrandToDelete(null)}
        isLoading={deleteBrandMutation.isPending}
      />
    </div>
  );
};

export default AddBrand;
