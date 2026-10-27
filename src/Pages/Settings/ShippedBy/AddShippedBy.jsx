import {useState} from "react";
import {useQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import {Plus, Search, Trash2, Truck, ExternalLink} from "lucide-react";

import {
  fetchShippedBy,
  createShippedBy,
  deleteShippedBy,
} from "../../../api/shippedByServiceApi";
import Toast from "../../../Components/Toast";
import ShippedByModal from "./ShippedByModal";
import Pagination from "../../../Components/Pagination";
import DeleteConfirmModal from "../../../Components/DeleteConfirmModal";
import {usePagination} from "../../../Hooks/usePagination";

const AddShippedBy = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [shippedByToDelete, setShippedByToDelete] = useState(null);
  const [toast, setToast] = useState(null);

  const queryClient = useQueryClient();

  const showToast = (message, type = "success") => {
    setToast({message, type});
  };

  // 1. Fetch Shipped By list using TanStack Query
  const {
    data: shippedByList = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["shippedBy"],
    queryFn: fetchShippedBy,
  });

  // Search Filter
  const filteredShippedBy = shippedByList.filter(
    (item) =>
      item.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.trackingLink?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Pagination hook
  const pagination = usePagination(filteredShippedBy, 25, searchTerm);

  // 2. Create Mutation
  const createShippedByMutation = useMutation({
    mutationFn: createShippedBy,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["shippedBy"]});
      showToast("Shipped By created successfully!");
      setIsModalOpen(false);
    },
    onError: (err) => {
      showToast(
        err?.response?.data?.message || "Failed to create Shipped By",
        "error",
      );
    },
  });

  // 3. Delete Mutation
  const deleteShippedByMutation = useMutation({
    mutationFn: deleteShippedBy,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["shippedBy"]});
      showToast("Shipped By deleted successfully!");
      setShippedByToDelete(null);
    },
    onError: (err) => {
      showToast(
        err?.response?.data?.message || "Failed to delete Shipped By",
        "error",
      );
    },
  });

  // Action Triggers
  const handleCreateShippedBy = async (data) => {
    await createShippedByMutation.mutateAsync(data);
  };

  const handleConfirmDelete = () => {
    if (shippedByToDelete) {
      deleteShippedByMutation.mutate(shippedByToDelete.id);
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
            placeholder="Search Courier / Company Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border rounded-full outline-none focus:ring-2 focus:ring-blue-500 border-slate-300"
          />
        </div>

        {/* Action Button & Counter */}
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-blue-50 border border-blue-200 px-3 py-1.5 text-xs font-bold text-blue-700">
            Total : {shippedByList.length}
          </span>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            ADD SHIPPED BY
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="text-xs border-b border-slate-200 bg-blue-400 text-white">
            <tr>
              <th className="px-4 py-3 font-semibold">S.No.</th>
              <th className="px-4 py-3 font-semibold">ID</th>
              <th className="px-4 py-3 font-semibold">Courier / company name</th>
              <th className="px-4 py-3 font-semibold">Tracking link</th>
              <th className="px-4 py-3 font-semibold text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td
                  colSpan="5"
                  className="text-center py-8 text-slate-400"
                >
                  Fetching shipped by list...
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td
                  colSpan="5"
                  className="text-center py-8 text-red-500"
                >
                  {error?.message || "Error loading shipped by list."}
                </td>
              </tr>
            ) : pagination.paginatedData.length > 0 ? (
              pagination.paginatedData.map((item, index) => (
                <tr
                  key={item.id || index}
                  className="hover:bg-slate-50/80"
                >
                  <td className="px-4 py-3 font-medium text-slate-500">
                    {pagination.startIndex + index + 1}
                  </td>
                  <td className="px-4 py-3 text-slate-600">#{item.id}</td>
                  <td className="px-4 py-3 font-bold text-slate-800">
                    {item.companyName}
                  </td>
                  <td className="px-4 py-3 text-blue-600">
                    <a
                      href={item.trackingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 hover:underline break-all"
                    >
                      {item.trackingLink}
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    </a>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => setShippedByToDelete(item)}
                      disabled={deleteShippedByMutation.isPending}
                      className="rounded p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 cursor-pointer disabled:opacity-50"
                      title="Delete Shipped By"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="5"
                  className="text-center py-12 text-slate-400"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Truck className="h-10 w-10 stroke-1 text-slate-300" />
                    <p className="font-medium">No shipped by entries found</p>
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
          itemsPerPage={pagination.itemsPerPage}
          onPageChange={pagination.setCurrentPage}
          onItemsPerPageChange={pagination.setItemsPerPage}
        />
      )}

      {/* Shipped By Modal */}
      <ShippedByModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateShippedBy}
        isSubmitting={createShippedByMutation.isPending}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(shippedByToDelete)}
        itemName={shippedByToDelete?.companyName}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShippedByToDelete(null)}
        isLoading={deleteShippedByMutation.isPending}
      />
    </div>
  );
};

export default AddShippedBy;
