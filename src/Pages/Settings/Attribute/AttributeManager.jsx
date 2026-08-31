import {useState} from "react";
import {useForm} from "react-hook-form";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {ListPlus, Tags} from "lucide-react";

import {fetchProductTypes} from "../../../api/productTypeServiceApi";
import {
  createAttribute,
  fetchAttributesByProductType,
} from "../../../api/attributeApi";
import Input from "../../../Components/Form/Input";
import Toast from "../../../Components/Toast";

const AttributeManager = () => {
  const queryClient = useQueryClient();
  const [selectedProductTypeId, setSelectedProductTypeId] = useState("");
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => setToast({message, type});

  const {data: productTypes = [], isLoading: loadingProductTypes} = useQuery({
    queryKey: ["productTypes"],
    queryFn: fetchProductTypes,
  });

  const {
    data: attributes = [],
    isLoading: loadingAttributes,
    isFetching: fetchingAttributes,
  } = useQuery({
    queryKey: ["attributes", "by-product-type", selectedProductTypeId],
    queryFn: () => fetchAttributesByProductType(selectedProductTypeId),
    enabled: Boolean(selectedProductTypeId),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: {errors},
  } = useForm({defaultValues: {name: ""}});

  const createMutation = useMutation({
    mutationFn: createAttribute,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["attributes", "by-product-type", selectedProductTypeId],
      });
      showToast("Attribute added successfully!");
      reset();
    },
    onError: (err) =>
      showToast(
        err.response?.data?.message || "Failed to create attribute",
        "error",
      ),
  });

  const handleCreateAttribute = (data) => {
    if (!selectedProductTypeId) {
      showToast("Please select a product type first", "error");
      return;
    }
    createMutation.mutate({
      name: data.name,
      productType: {id: Number(selectedProductTypeId)},
    });
  };

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
        <Tags className="h-5 w-5 text-[#0073b7]" />
        <div>
          <h2 className="text-base font-bold text-slate-800">
            Product Type Attributes
          </h2>
          <p className="text-xs text-slate-500">
            Define custom attributes (e.g. Size, Color, Material) for each
            product type
          </p>
        </div>
      </div>

      {/* Product Type Picker */}
      <div className="w-full max-w-md">
        <label className="mb-1 block text-xs font-medium text-gray-700 sm:text-sm">
          Select Product Type
        </label>
        <select
          value={selectedProductTypeId}
          disabled={loadingProductTypes}
          onChange={(e) => setSelectedProductTypeId(e.target.value)}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 sm:text-base"
        >
          <option value="">
            {loadingProductTypes ? "Loading..." : "Choose a product type"}
          </option>
          {productTypes.map((pt) => (
            <option key={pt.id} value={pt.id}>
              {pt.typeName || pt.productType || pt.name}
            </option>
          ))}
        </select>
      </div>

      {selectedProductTypeId && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Add Attribute Form */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700">
              <ListPlus className="h-4 w-4" />
              Add New Attribute
            </h3>
            <form
              onSubmit={handleSubmit(handleCreateAttribute)}
              className="flex flex-col gap-3 sm:flex-row sm:items-end"
            >
              <div className="flex-1">
                <Input
                  label="Attribute Name"
                  name="name"
                  placeholder="e.g. Size, Color, Material"
                  register={register}
                  rules={{required: "Attribute name is required"}}
                  error={errors.name}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="h-[38px] cursor-pointer rounded-md bg-[#0073b7] px-5 text-sm font-semibold text-white shadow hover:bg-[#0867a0] disabled:opacity-50"
              >
                {createMutation.isPending ? "Adding..." : "Add Attribute"}
              </button>
            </form>
          </div>

          {/* Existing Attributes */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="mb-3 text-sm font-bold text-slate-700">
              Existing Attributes
            </h3>
            {loadingAttributes || fetchingAttributes ? (
              <p className="text-sm text-slate-400">Loading attributes...</p>
            ) : attributes.length === 0 ? (
              <p className="text-sm text-slate-400">
                No attributes defined for this product type yet.
              </p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {attributes.map((attr) => (
                  <li
                    key={attr.id}
                    className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700"
                  >
                    {attr.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AttributeManager;
