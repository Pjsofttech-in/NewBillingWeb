import {useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Waypoints,
  Loader2,
  AlertCircle,
} from "lucide-react";

import {fetchProductTypes} from "../../../api/productTypeServiceApi";
import {
  createSubCategory,
  deleteSubCategory,
  fetchSubCategoriesByProductType,
} from "../../../api/subCategoryApi";
import Toast from "../../../Components/Toast";
import Pagination from "../../../Components/Pagination";

const messageOf = (e, fallback) =>
  e?.response?.data?.message || e?.message || fallback;

export default function SubCategoryPage() {
  const {productTypeId} = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [toast, setToast] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const showToast = (message, type = "success") => setToast({message, type});

  // Product type (for the heading) - uses the same cached query as the list page
  const {data: productTypes = []} = useQuery({
    queryKey: ["productTypes"],
    queryFn: fetchProductTypes,
  });
  const productType = Array.isArray(productTypes)
    ? productTypes.find((pt) => String(pt.id) === String(productTypeId))
    : null;
  const typeName =
    productType?.typeName ||
    productType?.productType ||
    productType?.name ||
    "";

  const {
    data: subCategories = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["subCategories", String(productTypeId)],
    queryFn: () => fetchSubCategoriesByProductType(productTypeId),
    enabled: Boolean(productTypeId),
  });

  const refresh = () =>
    queryClient.invalidateQueries({queryKey: ["subCategories"]});

  const addMutation = useMutation({
    mutationFn: createSubCategory,
    onSuccess: () => {
      refresh();
      setName("");
      setDescription("");
      setCurrentPage(1);
      showToast("Sub category added successfully");
    },
    onError: (e) =>
      showToast(messageOf(e, "Failed to add sub category"), "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSubCategory,
    onSuccess: () => {
      refresh();
      setDeletingId(null);
      showToast("Sub category deleted successfully");
    },
    onError: (e) => {
      setDeletingId(null);
      showToast(messageOf(e, "Failed to delete sub category"), "error");
    },
  });

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    addMutation.mutate({
      subCategoryName: name.trim(),
      description: description.trim() || undefined,
      productType: {id: Number(productTypeId)},
    });
  };

  // Pagination logic
  const totalItems = subCategories.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * itemsPerPage;
  const paginated = subCategories.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="w-full space-y-4 px-2 py-2 sm:px-4 sm:py-4">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-200/50 bg-blue-100/60 text-blue-600">
              <Waypoints className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight text-slate-900">
                Sub Categories
              </h1>
              <p className="text-xs text-slate-500">
                Product Type:{" "}
                <span className="font-semibold text-blue-600">{typeName}</span>
              </p>
            </div>
          </div>
        </div>

        <span className="w-fit rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
          Total : {totalItems}
        </span>
      </div>

      {/* Add form */}
      <form
        onSubmit={submit}
        className="space-y-2.5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          <Plus className="h-3.5 w-3.5 text-blue-600" /> Add New Sub Category
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Sub category name *"
            className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
          <button
            type="submit"
            disabled={addMutation.isPending}
            className="flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 disabled:opacity-50"
          >
            {addMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {addMutation.isPending ? "Adding..." : "Add"}
          </button>
        </div>
      </form>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-150 text-xs text-slate-700 sm:text-sm">
            <thead className="bg-slate-100 text-[11px] font-bold uppercase tracking-wider text-black">
              <tr>
                <th className="px-4 py-3 text-left">S.No.</th>
                <th className="px-4 py-3 text-left">Sub Category</th>
                <th className="px-4 py-3 text-left">Description</th>
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
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      Loading sub categories...
                    </span>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td
                    colSpan="4"
                    className="py-12 text-center text-sm text-red-500"
                  >
                    {error?.message || "Error loading sub categories."}
                  </td>
                </tr>
              ) : paginated.length > 0 ? (
                paginated.map((sc, index) => (
                  <tr
                    key={sc.id}
                    className="transition-colors hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 font-medium text-slate-500">
                      {startIndex + index + 1}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-800">
                      {sc.subCategoryName}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {sc.description || (
                        <span className="text-xs italic text-slate-400">
                          No description provided
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        aria-label={`Delete ${sc.subCategoryName}`}
                        title="Delete sub category"
                        disabled={
                          deleteMutation.isPending && deletingId === sc.id
                        }
                        onClick={() => {
                          if (
                            window.confirm(
                              `Are you sure you want to delete "${sc.subCategoryName}"?`,
                            )
                          ) {
                            setDeletingId(sc.id);
                            deleteMutation.mutate(sc.id);
                          }
                        }}
                        className="cursor-pointer rounded-lg border border-rose-200 bg-rose-50 p-1.5 text-rose-600 transition-colors hover:bg-rose-100 disabled:opacity-50"
                      >
                        {deleteMutation.isPending && deletingId === sc.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="4"
                    className="py-16 text-center text-slate-400"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="h-10 w-10 stroke-1 text-slate-300" />
                      <p className="font-medium text-slate-600">
                        No sub categories yet
                      </p>
                      <p className="text-xs text-slate-400">
                        Use the form above to add the first one.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalItems > 0 && (
        <div className="px-1 py-1">
          <Pagination
            currentPage={safePage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
            pageSizeOptions={[10, 25, 50, 100]}
          />
        </div>
      )}
    </div>
  );
}
