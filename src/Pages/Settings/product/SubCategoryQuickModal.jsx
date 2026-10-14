import {useState} from "react";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {
  Plus,
  Trash2,
  Waypoints,
  X,
  Layers,
  AlertCircle,
  Loader2,
} from "lucide-react";

import {
  createSubCategory,
  deleteSubCategory,
  fetchSubCategoriesByProductType,
} from "../../../api/subCategoryApi";

const messageOf = (e, fallback) =>
  e?.response?.data?.message || e?.message || fallback;

export default function SubCategoryQuickModal({
  productType,
  onClose,
  onNotify,
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const typeName =
    productType?.typeName || productType?.productType || productType?.name;

  const {data: subCategories = [], isLoading} = useQuery({
    queryKey: ["subCategories", String(productType?.id)],
    queryFn: () => fetchSubCategoriesByProductType(productType.id),
    enabled: Boolean(productType?.id),
  });

  const refresh = () =>
    queryClient.invalidateQueries({queryKey: ["subCategories"]});

  const addMutation = useMutation({
    mutationFn: createSubCategory,
    onSuccess: () => {
      refresh();
      setName("");
      setDescription("");
      onNotify?.("Sub category added successfully", "success");
    },
    onError: (e) =>
      onNotify?.(messageOf(e, "Failed to add sub category"), "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSubCategory,
    onSuccess: () => {
      refresh();
      setDeletingId(null);
      onNotify?.("Sub category deleted successfully", "success");
    },
    onError: (e) => {
      setDeletingId(null);
      onNotify?.(messageOf(e, "Failed to delete sub category"), "error");
    },
  });

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    addMutation.mutate({
      subCategoryName: name.trim(),
      description: description.trim() || undefined,
      productType: {id: Number(productType.id)},
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100/60 text-blue-600 border border-blue-200/50">
              <Waypoints className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">
                Sub Categories
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Product Type:{" "}
                <span className="font-semibold text-blue-600">{typeName}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 cursor-pointer transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="space-y-4 overflow-y-auto p-5">
          {/* Add SubCategory Form */}
          <form
            onSubmit={submit}
            className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 space-y-2.5"
          >
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Plus className="h-3.5 w-3.5 text-blue-600" /> Add New Sub
              Category
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Sub category name *"
                className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (optional)"
                className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
              <button
                type="submit"
                disabled={addMutation.isPending}
                className="h-9 flex cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50 transition-all"
              >
                {addMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
                {addMutation.isPending ? "Adding..." : "Add"}
              </button>
            </div>
          </form>

          {/* SubCategories List Section */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-0.5">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-slate-500" /> Active Sub
                Categories
              </h4>
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700 border border-blue-100">
                {subCategories.length}{" "}
                {subCategories.length === 1 ? "Item" : "Items"}
              </span>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-10 text-xs text-slate-400 gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />{" "}
                Loading sub categories...
              </div>
            ) : subCategories.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/50 py-8 text-center">
                <AlertCircle className="h-7 w-7 text-slate-300 mb-1.5" />
                <p className="text-xs font-semibold text-slate-600">
                  No sub categories yet
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Fill out the fields above to add the first one.
                </p>
              </div>
            ) : (
              <div className="max-h-[240px] overflow-y-auto space-y-2 pr-1">
                {subCategories.map((sc) => (
                  <div
                    key={sc.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white p-3 shadow-2xs transition-all hover:border-slate-300 hover:bg-slate-50/50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-slate-800">
                        {sc.subCategoryName}
                      </p>
                      {sc.description ? (
                        <p className="truncate text-[11px] text-slate-500 mt-0.5">
                          {sc.description}
                        </p>
                      ) : (
                        <p className="text-[10px] italic text-slate-400 mt-0.5">
                          No description provided
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      aria-label={`Delete ${sc.subCategoryName}`}
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
                      className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 disabled:opacity-50 transition-colors"
                      title="Delete sub category"
                    >
                      {deleteMutation.isPending && deletingId === sc.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-200 bg-slate-50/80 px-5 py-2.5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-100 cursor-pointer transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
