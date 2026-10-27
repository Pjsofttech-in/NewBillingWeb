import {useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {ArrowLeft, Plus, Loader2, AlertCircle} from "lucide-react";

import {fetchProductTypes} from "../../../api/productTypeServiceApi";
import {
  createAttribute,
  fetchAttributesByProductType,
} from "../../../api/attributeApi";
import Toast from "../../../Components/Toast";
import Pagination from "../../../Components/Pagination";

const messageOf = (e, fallback) =>
  e?.response?.data?.message || e?.message || fallback;

export default function AttributePage() {
  const {productTypeId} = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [toast, setToast] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const showToast = (message, type = "success") => setToast({message, type});

  const {data: productTypes = []} = useQuery({
    queryKey: ["productTypes"],
    queryFn: fetchProductTypes,
  });
  const productType = Array.isArray(productTypes)
    ? productTypes.find((pt) => String(pt.id) === String(productTypeId))
    : null;
  // eslint-disable-next-line no-unused-vars
  const typeName =
    productType?.typeName ||
    productType?.productType ||
    productType?.name ||
    "";

  const {
    data: attributes = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["attributes", "by-product-type", String(productTypeId)],
    queryFn: () => fetchAttributesByProductType(productTypeId),
    enabled: Boolean(productTypeId),
  });

  const addMutation = useMutation({
    mutationFn: createAttribute,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["attributes"]});
      setName("");
      setCurrentPage(1);
      showToast("Attribute added successfully");
    },
    onError: (e) => showToast(messageOf(e, "Failed to add attribute"), "error"),
  });

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    addMutation.mutate({
      name: name.trim(),
      productType: {id: Number(productTypeId)},
    });
  };

  // Pagination logic
  const totalItems = attributes.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * itemsPerPage;
  const paginated = attributes.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="w-full space-y-2 px-2 py-2 sm:px-4 sm:py-1">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* One-line header: Back | Input | Add | Count */}
      <form
        onSubmit={submit}
        className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Attribute name (e.g. Size, Color) *"
          className="h-9 min-w-48 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
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
          {addMutation.isPending ? "Adding..." : "Add Attribute"}
        </button>

        <span className="rounded-full border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700">
          Total : {totalItems}
        </span>
      </form>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-100 text-xs text-slate-700 sm:text-sm">
            <thead className="text-[11px] font-bold uppercase tracking-wider bg-blue-400 text-white">
              <tr>
                <th className="px-4 py-3 text-left">S.No.</th>
                <th className="px-4 py-3 text-left">Attribute Name</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td
                    colSpan="2"
                    className="py-12 text-center text-sm text-slate-400"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                      Loading attributes...
                    </span>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td
                    colSpan="2"
                    className="py-12 text-center text-sm text-red-500"
                  >
                    {error?.message || "Error loading attributes."}
                  </td>
                </tr>
              ) : paginated.length > 0 ? (
                paginated.map((attr, index) => (
                  <tr
                    key={attr.id}
                    className="transition-colors hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 font-medium text-slate-500">
                      {startIndex + index + 1}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-800">
                      {attr.name}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="2"
                    className="py-16 text-center text-slate-400"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="h-10 w-10 stroke-1 text-slate-300" />
                      <p className="font-medium text-slate-600">
                        No attributes yet
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
