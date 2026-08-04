import {useState} from "react";
import {useQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import {Plus, Search, Trash2, Edit, Store} from "lucide-react";

import {
  fetchVendors,
  createVendor,
  updateVendor,
  deleteVendor,
} from "../../../api/vendorServiceApi";
import Toast from "../../../Components/Toast";
import VendorModal from "./VendorModal";

const AddVendor = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [toast, setToast] = useState(null);

  const queryClient = useQueryClient();

  const showToast = (message, type = "success") => {
    setToast({message, type});
  };

  // 1. Fetch Vendors using TanStack Query
  const {
    data: vendors = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["vendors"],
    queryFn: fetchVendors,
  });

  // 2. Create Vendor Mutation
  const createVendorMutation = useMutation({
    mutationFn: createVendor,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["vendors"]});
      showToast("Vendor created successfully!");
      handleCloseModal();
    },
    onError: (err) => {
      showToast(
        err?.response?.data?.message || "Failed to create vendor",
        "error",
      );
    },
  });

  // 3. Update Vendor Mutation
  const updateVendorMutation = useMutation({
    mutationFn: updateVendor,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["vendors"]});
      showToast("Vendor updated successfully!");
      handleCloseModal();
    },
    onError: (err) => {
      showToast(
        err?.response?.data?.message || "Failed to update vendor",
        "error",
      );
    },
  });

  // 4. Delete Vendor Mutation
  const deleteVendorMutation = useMutation({
    mutationFn: deleteVendor,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["vendors"]});
      showToast("Vendor deleted successfully!");
    },
    onError: (err) => {
      showToast(
        err?.response?.data?.message || "Failed to delete vendor",
        "error",
      );
    },
  });

  // Open Modal for Editing
  const handleEditClick = (vendor) => {
    setSelectedVendor(vendor);
    setIsModalOpen(true);
  };

  // Open Modal for Creating
  const handleAddNewClick = () => {
    setSelectedVendor(null);
    setIsModalOpen(true);
  };

  // Close Modal and Reset Selected
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedVendor(null);
  };

  // Submit Handler for Form (Creates or Updates depending on selectedVendor)
  const handleFormSubmit = async (formData) => {
    if (selectedVendor?.id) {
      await updateVendorMutation.mutateAsync({
        id: selectedVendor.id,
        vendorData: formData,
      });
    } else {
      await createVendorMutation.mutateAsync(formData);
    }
  };

  const handleDeleteVendor = (id) => {
    if (window.confirm("Are you sure you want to delete this vendor?")) {
      deleteVendorMutation.mutate(id);
    }
  };

  // Search Filter
  const filteredVendors = vendors.filter((v) => {
    const term = searchTerm.toLowerCase();
    return (
      v.vendorName?.toLowerCase().includes(term) ||
      v.companyName?.toLowerCase().includes(term) ||
      v.city?.toLowerCase().includes(term) ||
      v.phone?.includes(term)
    );
  });

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

      {/* Top Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search Vendor Name, Company, City..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border rounded-full outline-none focus:ring-2 focus:ring-blue-500 border-slate-300"
          />
        </div>

        {/* Action Buttons & Counter */}
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-blue-50 border border-blue-200 px-3 py-1.5 text-xs font-bold text-blue-700">
            Total Vendors : {vendors.length}
          </span>

          <button
            type="button"
            onClick={handleAddNewClick}
            className="flex items-center gap-2 rounded-lg bg-[#0073b7] hover:bg-[#0867a0] px-4 py-2 text-sm font-semibold text-white shadow transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            ADD VENDOR
          </button>
        </div>
      </div>

      {/* Vendor Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 font-semibold">S.No.</th>
              <th className="px-4 py-3 font-semibold">Vendor Name</th>
              <th className="px-4 py-3 font-semibold">Company Name</th>
              <th className="px-4 py-3 font-semibold">Contact Info</th>
              <th className="px-4 py-3 font-semibold">Location</th>
              <th className="px-4 py-3 font-semibold text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td
                  colSpan="6"
                  className="text-center py-8 text-slate-400"
                >
                  Fetching vendor data...
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td
                  colSpan="6"
                  className="text-center py-8 text-red-500"
                >
                  {error?.message || "Error loading vendors."}
                </td>
              </tr>
            ) : filteredVendors.length > 0 ? (
              filteredVendors.map((vendor, index) => (
                <tr
                  key={vendor.id || index}
                  className="hover:bg-slate-50/80"
                >
                  <td className="px-4 py-3 font-medium text-slate-500">
                    {index + 1}
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-800">
                    {vendor.vendorName}
                  </td>
                  <td className="px-4 py-3">{vendor.companyName || "-"}</td>
                  <td className="px-4 py-3">
                    <div className="text-xs">
                      <p className="font-semibold text-slate-700">
                        {vendor.phone}
                      </p>
                      <p className="text-slate-400">{vendor.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {vendor.city ? `${vendor.city}, ${vendor.state}` : "-"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEditClick(vendor)}
                        className="rounded p-1.5 text-blue-600 hover:bg-blue-50 hover:text-blue-800 cursor-pointer"
                        title="Edit Vendor"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteVendor(vendor.id)}
                        disabled={deleteVendorMutation.isPending}
                        className="rounded p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 cursor-pointer disabled:opacity-50"
                        title="Delete Vendor"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="6"
                  className="text-center py-12 text-slate-400"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Store className="h-10 w-10 stroke-1 text-slate-300" />
                    <p className="font-medium">No vendors found</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Dialog Form */}
      <VendorModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleFormSubmit}
        initialData={selectedVendor}
        isSubmitting={
          createVendorMutation.isPending || updateVendorMutation.isPending
        }
      />
    </div>
  );
};

export default AddVendor;
