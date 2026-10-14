import {useState} from "react";
import {useForm} from "react-hook-form";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {Pencil, Trash2, Waypoints, X} from "lucide-react";

import {fetchProductTypes} from "../../../api/productTypeServiceApi";
import {
  createSubCategory,
  deleteSubCategory,
  fetchSubCategoriesByProductType,
  updateSubCategory,
} from "../../../api/subCategoryApi";
import Input from "../../../Components/Form/Input";
import Toast from "../../../Components/Toast";

const errorMessage = (err, fallback) => err.response?.data?.message || fallback;

export default function SubCategoryManager() {
  const queryClient = useQueryClient();
  const [productTypeId, setProductTypeId] = useState("");
  const [toast, setToast] = useState(null);
  const [editing, setEditing] = useState(null);
  const showToast = (message, type = "success") => setToast({message, type});

  const {data: productTypes = [], isLoading: loadingTypes} = useQuery({
    queryKey: ["productTypes"],
    queryFn: fetchProductTypes,
  });

  const listKey = ["subCategories", productTypeId];
  const {data: subCategories = [], isLoading} = useQuery({
    queryKey: listKey,
    queryFn: () => fetchSubCategoriesByProductType(productTypeId),
    enabled: Boolean(productTypeId),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: {errors},
  } = useForm({defaultValues: {subCategoryName: "", description: ""}});

  const refresh = () =>
    queryClient.invalidateQueries({queryKey: ["subCategories"]});

  const createMutation = useMutation({
    mutationFn: createSubCategory,
    onSuccess: () => {
      refresh();
      showToast("Sub category added");
      reset();
    },
    onError: (e) => showToast(errorMessage(e, "Failed to add sub category"), "error"),
  });

  const updateMutation = useMutation({
    mutationFn: updateSubCategory,
    onSuccess: () => {
      refresh();
      showToast("Sub category updated");
      setEditing(null);
      reset({subCategoryName: "", description: ""});
    },
    onError: (e) => showToast(errorMessage(e, "Failed to update sub category"), "error"),
  });

  const startEdit = (sc) => {
    setEditing(sc);
    reset({subCategoryName: sc.subCategoryName, description: sc.description || ""});
  };

  const cancelEdit = () => {
    setEditing(null);
    reset({subCategoryName: "", description: ""});
  };

  const deleteMutation = useMutation({
    mutationFn: deleteSubCategory,
    onSuccess: () => {
      refresh();
      showToast("Sub category deleted");
    },
    onError: (e) =>
      showToast(errorMessage(e, "Failed to delete sub category"), "error"),
  });

  const onSubmit = (data) => {
    const payload = {
      subCategoryName: data.subCategoryName.trim(),
      description: data.description?.trim() || undefined,
      productType: {id: Number(productTypeId)},
    };
    if (editing) updateMutation.mutate({id: editing.id, ...payload});
    else createMutation.mutate(payload);
  };
  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="flex items-center gap-2 border-b border-slate-200 pb-4">
        <Waypoints className="h-5 w-5 text-blue-600" />
        <h2 className="text-base font-bold text-slate-800">Sub Categories</h2>
      </div>

      <div className="w-full max-w-md">
        <label className="mb-1 block text-xs font-medium text-slate-700 sm:text-sm">
          Product Type
        </label>
        <select
          value={productTypeId}
          disabled={loadingTypes}
          onChange={(e) => {
            setProductTypeId(e.target.value);
            cancelEdit();
          }}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
        >
          <option value="">
            {loadingTypes ? "Loading..." : "Choose a product type"}
          </option>
          {productTypes.map((pt) => (
            <option key={pt.id} value={pt.id}>
              {pt.typeName || pt.name}
            </option>
          ))}
        </select>
      </div>

      {productTypeId && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-5"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-700">
                {editing ? "Edit Sub Category" : "Add Sub Category"}
              </h3>
              {editing && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  <X className="h-3.5 w-3.5" /> Cancel
                </button>
              )}
            </div>
            <Input
              label="Name"
              name="subCategoryName"
              placeholder="e.g. Mobiles, Laptops"
              register={register}
              rules={{required: "Name is required"}}
              error={errors.subCategoryName}
              required
            />
            <Input
              label="Description"
              name="description"
              placeholder="Optional"
              register={register}
            />
            <button
              type="submit"
              disabled={saving}
              className="cursor-pointer rounded-md bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : editing
                  ? "Save Changes"
                  : "Add Sub Category"}
            </button>
          </form>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="mb-3 text-sm font-bold text-slate-700">
              Existing Sub Categories
            </h3>
            {isLoading ? (
              <p className="text-sm text-slate-400">Loading...</p>
            ) : subCategories.length === 0 ? (
              <p className="text-sm text-slate-400">
                No sub categories for this product type yet.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {subCategories.map((sc) => (
                  <li
                    key={sc.id}
                    className="flex items-center justify-between gap-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {sc.subCategoryName}
                      </p>
                      {sc.description && (
                        <p className="truncate text-xs text-slate-500">
                          {sc.description}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center">
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
                        if (window.confirm(`Delete "${sc.subCategoryName}"?`))
                          deleteMutation.mutate(sc.id);
                      }}
                      className="cursor-pointer rounded-md p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
