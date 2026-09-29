import {useForm} from "react-hook-form";
import {X} from "lucide-react";
import Input from "../../../Components/Form/Input";

const BrandModal = ({isOpen, onClose, onSubmit, isSubmitting}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: {errors},
  } = useForm();

  if (!isOpen) return null;

  const handleFormSubmit = async (data) => {
    await onSubmit(data);
    reset();
    onClose();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3 mb-4">
          <h2 className="text-xl font-bold text-slate-800">Add New Brand</h2>
          <button
            onClick={handleClose}
            type="button"
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="space-y-4"
        >
          <Input
            label="Brand Name"
            name="brandName"
            placeholder="e.g. Nike, Samsung, Apple"
            register={register}
            required
            rules={{required: "Brand Name is required"}}
            error={errors.brandName}
          />

          {/* <Input
            label="Description / Details"
            name="description"
            placeholder="e.g. Footwear and Electronics supplier"
            register={register}
          /> */}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-300 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? "Saving..." : "Save Brand"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BrandModal;
