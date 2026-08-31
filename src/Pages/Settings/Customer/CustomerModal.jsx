import {useEffect} from "react";
import {useForm} from "react-hook-form";
import {X} from "lucide-react";
import Input from "../../../Components/Form/Input";

const INDIAN_STATES = [
  "MAHARASHTRA",
  "DELHI",
  "GUJARAT",
  "KARNATAKA",
  "TAMIL_NADU",
  "UTTAR_PRADESH",
  "WEST_BENGAL",
  "PUNJAB",
  "RAJASTHAN",
  "KERALA",
];

const CustomerModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isSubmitting = false,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: {errors},
  } = useForm({
    defaultValues: {
      customerName: "",
      landmark: "",
      city: "",
      taluka: "",
      pincode: "",
      email: "",
      phone: "",
      state: "MAHARASHTRA",
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        customerName: initialData.customerName || "",
        landmark: initialData.landmark || "",
        city: initialData.city || "",
        taluka: initialData.taluka || "",
        pincode: initialData.pincode || "",
        email: initialData.email || "",
        phone: initialData.phone || "",
        state: initialData.state || "MAHARASHTRA",
      });
    } else {
      reset({
        customerName: "",
        landmark: "",
        city: "",
        taluka: "",
        pincode: "",
        email: "",
        phone: "",
        state: "MAHARASHTRA",
      });
    }
  }, [initialData, reset, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-4 bg-slate-50 border-b border-slate-200">
          <h3 className="text-lg font-bold text-gray-800">
            {initialData ? "Edit Customer Details" : "Create New Customer"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-slate-200/60 p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="overflow-y-auto p-6 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Customer Name"
              name="customerName"
              placeholder="e.g. Rahul Patil"
              register={register}
              rules={{required: "Customer name is required"}}
              error={errors.customerName}
              required
            />

            <Input
              label="Phone"
              name="phone"
              type="tel"
              placeholder="9876543210"
              register={register}
              rules={{
                required: "Phone is required",
                pattern: {
                  value: /^[0-9]{10}$/,
                  message: "Must be a 10-digit number",
                },
              }}
              error={errors.phone}
              required
            />

            <Input
              label="Email"
              name="email"
              type="email"
              placeholder="rahul@gmail.com"
              register={register}
              rules={{required: "Email is required"}}
              error={errors.email}
              required
            />

            <Input
              label="Landmark"
              name="landmark"
              placeholder="Near Temple"
              register={register}
            />

            <Input
              label="City"
              name="city"
              placeholder="Pune"
              register={register}
              rules={{required: "City is required"}}
              error={errors.city}
              required
            />

            <Input
              label="Taluka"
              name="taluka"
              placeholder="Haveli"
              register={register}
            />

            <Input
              label="Pincode"
              name="pincode"
              placeholder="411001"
              register={register}
              rules={{required: "Pincode is required"}}
              error={errors.pincode}
              required
            />

            {/* State Select Dropdown */}
            <div className="w-full">
              <label className="block mb-1 text-xs sm:text-sm font-medium text-gray-700">
                State <span className="text-red-500">*</span>
              </label>
              <select
                {...register("state", {required: "State is required"})}
                className="w-full px-3 py-2 border rounded-md text-sm border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {INDIAN_STATES.map((st) => (
                  <option
                    key={st}
                    value={st}
                  >
                    {st}
                  </option>
                ))}
              </select>
              {errors.state && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.state.message}
                </p>
              )}
            </div>

          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 font-medium rounded-md hover:bg-gray-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm bg-[#0073b7] text-white font-semibold rounded-md hover:bg-[#0867a0] disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
            >
              {isSubmitting
                ? "Saving..."
                : initialData
                  ? "Update Customer"
                  : "Save Customer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerModal;
