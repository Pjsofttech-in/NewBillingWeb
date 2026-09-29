import {useEffect} from "react";
import {useForm} from "react-hook-form";
import {X} from "lucide-react";
import Input from "../../../Components/Form/Input";
import Select from "../../../Components/Form/Select";
import {STATE_OPTIONS} from "../../../data/state";

const VendorModal = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  initialData = null,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: {errors},
  } = useForm();

  // Populate form with existing vendor details if initialData exists
  useEffect(() => {
    if (initialData) {
      reset(initialData);
    } else {
      reset({
        vendorName: "",
        companyName: "",
        gstNo: "",
        phone: "",
        email: "",
        landmark: "",
        city: "",
        taluka: "",
        state: "",
        pincode: "",
      });
    }
  }, [initialData, reset, isOpen]);

  if (!isOpen) return null;

  const handleFormSubmit = async (data) => {
    await onSubmit(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3 mb-4">
          <h2 className="text-xl font-bold text-slate-800">
            {initialData ? "Edit Vendor" : "Add New Vendor"}
          </h2>
          <button
            onClick={onClose}
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Vendor Name"
              name="vendorName"
              placeholder="e.g. XYZ Traders"
              register={register}
              required
              rules={{required: "Vendor Name is required"}}
              error={errors.vendorName}
            />
            <Input
              label="Company Name"
              name="companyName"
              placeholder="e.g. XYZ Pvt Ltd"
              register={register}
              required
              rules={{required: "Company Name is required"}}
              error={errors.companyName}
            />
            <Input
              label="GST Number"
              name="gstNo"
              placeholder="e.g. GST12342"
              register={register}
              required
              rules={{required: "GST Number is required"}}
              error={errors.gstNo}
            />
            <Input
              label="Phone Number"
              name="phone"
              type="tel"
              placeholder="e.g. 9876543220"
              register={register}
              required
              rules={{
                required: "Phone number is required",
                pattern: {
                  value: /^[0-9]{10}$/,
                  message: "Enter a valid 10-digit phone number",
                },
              }}
              error={errors.phone}
            />
            <Input
              label="Email Address"
              name="email"
              type="email"
              placeholder="e.g. xyz@gmail.com"
              register={register}
              required
              rules={{
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Enter a valid email",
                },
              }}
              error={errors.email}
            />
            <Input
              label="Landmark"
              name="landmark"
              placeholder="e.g. Near Bus Stop"
              register={register}
            />
            <Input
              label="City"
              name="city"
              placeholder="e.g. Pune"
              register={register}
              required
              rules={{required: "City is required"}}
              error={errors.city}
            />
            <Input
              label="Taluka"
              name="taluka"
              placeholder="e.g. Haveli"
              register={register}
            />
            <Select
              label="State"
              name="state"
              options={STATE_OPTIONS}
              register={register}
              required
              rules={{required: "State selection is required"}}
              error={errors.state}
            />
            <Input
              label="Pincode"
              name="pincode"
              placeholder="e.g. 411001"
              register={register}
              required
              rules={{required: "Pincode is required"}}
              error={errors.pincode}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-300 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting
                ? "Saving..."
                : initialData
                  ? "Update Vendor"
                  : "Save Vendor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VendorModal;
