import {useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {useForm} from "react-hook-form";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {ArrowLeft, Pencil, Plus, Trash2, X} from "lucide-react";

import {
  createSubCategory,
  deleteSubCategory,
  fetchSubCategoriesByProductType,
  updateSubCategory,
} from "../../../api/subCategoryApi";
import Toast from "../../../Components/Toast";

const errorMessage = (err, fallback) => err.response?.data?.message || fallback;

export default function SubCategoryManager() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const {productTypeId: routeProductTypeId} = useParams();

  const productTypeId = routeProductTypeId || "";

  const [toast, setToast] = useState(null);
  const [editing, setEditing] = useState(null);

  const showToast = (message, type = "success") => setToast({message, type});

  const {
    data: subCategories = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["subCategories", productTypeId],
    queryFn: () => fetchSubCategoriesByProductType(productTypeId),
    enabled: Boolean(productTypeId),
  });

  const {register, handleSubmit, reset} = useForm({
    defaultValues: {subCategoryName: ""},
  });

  const refresh = () =>
    queryClient.invalidateQueries({
      queryKey: ["subCategories"],
    });

  const createMutation = useMutation({
    mutationFn: createSubCategory,
    onSuccess: () => {
      refresh();
      showToast("Sub category added successfully");
      reset({subCategoryName: ""});
    },
    onError: (err) =>
      showToast(errorMessage(err, "Failed to add sub category"), "error"),
  });

  const updateMutation = useMutation({
    mutationFn: updateSubCategory,
    onSuccess: () => {
      refresh();
      showToast("Sub category updated successfully");
      setEditing(null);
      reset({subCategoryName: ""});
    },
    onError: (err) =>
      showToast(errorMessage(err, "Failed to update sub category"), "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSubCategory,
    onSuccess: () => {
      refresh();
      showToast("Sub category deleted successfully");
    },
    onError: (err) =>
      showToast(errorMessage(err, "Failed to delete sub category"), "error"),
  });

  const startEdit = (sc) => {
    setEditing(sc);
    reset({subCategoryName: sc.subCategoryName});
  };

  const cancelEdit = () => {
    setEditing(null);
    reset({subCategoryName: ""});
  };

  const onSubmit = (data) => {
    const name = data.subCategoryName.trim();

    if (!name || !productTypeId) return;

    const payload = {
      subCategoryName: name,
      productType: {id: Number(productTypeId)},
    };

    if (editing) {
      updateMutation.mutate({
        id: editing.id,
        ...payload,
      });
    } else {
      createMutation.mutate(payload);
    }
  };

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-3">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header: Back | Input | Add | Total */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <input
          placeholder="Sub category name *"
          required
          {...register("subCategoryName", {
            required: true,
            validate: (value) => Boolean(value.trim()) || "Name is required",
          })}
          className="h-9 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          type="submit"
          disabled={saving || !productTypeId}
          className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {editing ? (
            <Pencil className="h-4 w-4" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          {saving ? "Saving..." : editing ? "Save" : "Add"}
        </button>

        {editing && (
          <button
            type="button"
            onClick={cancelEdit}
            className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-1 rounded-lg px-2 text-sm text-slate-500 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
            Cancel
          </button>
        )}

        <span className="shrink-0 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
          Total: {subCategories.length}
        </span>
      </form>

      {/* Subcategory Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {isLoading ? (
          <p className="p-4 text-sm text-slate-500">Loading subcategories...</p>
        ) : isError ? (
          <p className="p-4 text-sm text-red-600">
            Failed to load subcategories. Please refresh and try again.
          </p>
        ) : subCategories.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">
            No subcategories found for this product type.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead className="bg-blue-400 text-sm text-slate-900">
                <tr>
                  <th className="w-20 px-4 py-3 font-semibold">S.No.</th>
                  <th className="px-4 py-3 font-semibold">Sub Category</th>
                  <th className="px-4 py-3 font-semibold">Description</th>
                  <th className="w-28 px-4 py-3 text-center font-semibold">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {subCategories.map((sc, index) => (
                  <tr
                    key={sc.id}
                    className="transition-colors hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {index + 1}
                    </td>

                    <td className="px-4 py-3 text-sm font-semibold text-slate-800">
                      {sc.subCategoryName}
                    </td>

                    <td className="px-4 py-3 text-sm text-slate-500">
                      {sc.description || "-"}
                    </td>

                    <td className="px-4 py-2">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          aria-label={`Edit ${sc.subCategoryName}`}
                          onClick={() => startEdit(sc)}
                          className="cursor-pointer rounded-md p-2 text-blue-600 hover:bg-blue-50"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          aria-label={`Delete ${sc.subCategoryName}`}
                          disabled={deleteMutation.isPending}
                          onClick={() => {
                            if (
                              window.confirm(`Delete "${sc.subCategoryName}"?`)
                            ) {
                              deleteMutation.mutate(sc.id);
                            }
                          }}
                          className="cursor-pointer rounded-md p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
