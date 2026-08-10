// import {useState} from "react";
// import {useForm, useFieldArray} from "react-hook-form";
// import {X, Plus, Trash2} from "lucide-react";
// import CustomerModal from "../Settings/Customer/CustomerModal";
// import Input from "../../Components/Form/Input";

// const CreateOrderModal = ({
//   isOpen,
//   onClose,
//   onSubmitOrder,
//   customers = [],
//   products = [],
//   vendors = [],
//   loadingCustomers = false,
//   loadingProducts = false,
//   isSubmitting = false,
// }) => {
//   const [customerType, setCustomerType] = useState("existing"); // "existing" or "new"
//   const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);

//   // React Hook Form for Order Setup
//   const {
//     register,
//     handleSubmit,
//     control,
//     watch,
//     formState: {errors},
//   } = useForm({
//     defaultValues: {
//       customerId: "",
//       orderDate: new Date().toISOString().split("T")[0],
//       status: "PENDING",
//       orderItems: [{productId: "", quantity: 1}],
//     },
//   });

//   const {fields, append, remove} = useFieldArray({
//     control,
//     name: "orderItems",
//   });

//   if (!isOpen) return null;

//   // 1. जेव्हा जुना (Existing) Customer सेलेक्ट करून फॉर्म सबमिट केला जाईल
//   const handleExistingOrderSubmit = (data) => {
//     const formattedItems = data.orderItems.map((item) => ({
//       product: {id: parseInt(item.productId, 10)},
//       quantity: parseInt(item.quantity, 10),
//     }));

//     const orderPayload = {
//       orderDate: data.orderDate,
//       status: data.status,
//       customer: {id: parseInt(data.customerId, 10)},
//       orderItems: formattedItems,
//     };

//     onSubmitOrder(orderPayload, false, null); // false = Existing Customer
//   };

//   // 2. जेव्हा "Fill Customer Details" बटणावर क्लिक करून New Customer Form भरला जाईल
//   const handleNewCustomerCreate = async (newCustomerFormData) => {
//     const currentOrderData = watch();
//     const formattedItems = currentOrderData.orderItems.map((item) => ({
//       product: {id: parseInt(item.productId, 10)},
//       quantity: parseInt(item.quantity, 10),
//     }));

//     const customerPayload = {
//       customerName: newCustomerFormData.customerName,
//       landmark: newCustomerFormData.landmark,
//       city: newCustomerFormData.city,
//       taluka: newCustomerFormData.taluka,
//       pincode: newCustomerFormData.pincode,
//       email: newCustomerFormData.email,
//       phone: newCustomerFormData.phone,
//       state: newCustomerFormData.state,
//       vendorId: parseInt(newCustomerFormData.vendorId, 10),
//     };

//     const orderPartialPayload = {
//       orderDate: currentOrderData.orderDate,
//       status: currentOrderData.status,
//       orderItems: formattedItems,
//     };

//     setIsNewCustomerModalOpen(false);
//     onSubmitOrder(orderPartialPayload, true, customerPayload); // true = New Customer
//   };

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
//       <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
//         {/* Header */}
//         <div className="flex justify-between items-center px-6 py-4 bg-slate-50 border-b border-slate-200">
//           <h3 className="text-lg font-bold text-gray-800">Create New Order</h3>
//           <button
//             type="button"
//             onClick={onClose}
//             className="text-gray-400 hover:text-gray-600 hover:bg-slate-200/60 p-1.5 rounded-lg transition-colors cursor-pointer"
//           >
//             <X className="w-5 h-5" />
//           </button>
//         </div>

//         <form
//           onSubmit={handleSubmit(handleExistingOrderSubmit)}
//           className="overflow-y-auto p-6 space-y-6"
//         >
//           {/* Step 1: Customer Type Switcher */}
//           <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
//             <label className="block text-sm font-semibold text-gray-700">
//               Select Customer Option
//             </label>

//             <div className="flex gap-6">
//               <label className="flex items-center gap-2 cursor-pointer">
//                 <input
//                   type="radio"
//                   name="custType"
//                   value="existing"
//                   checked={customerType === "existing"}
//                   onChange={() => setCustomerType("existing")} // 🔥 फक्त प्रकार बदलावा, फॉर्म उघडू नये
//                   className="w-4 h-4 text-blue-600"
//                 />
//                 <span className="text-sm font-medium text-gray-700">
//                   Existing Customer
//                 </span>
//               </label>

//               <label className="flex items-center gap-2 cursor-pointer">
//                 <input
//                   type="radio"
//                   name="custType"
//                   value="new"
//                   checked={customerType === "new"}
//                   onChange={() => setCustomerType("new")} // 🔥 फक्त प्रकार बदलावा, फॉर्म ऑटोमॅटिक उघडू नये
//                   className="w-4 h-4 text-blue-600"
//                 />
//                 <span className="text-sm font-medium text-gray-700">
//                   + Add New Customer
//                 </span>
//               </label>
//             </div>

//             {/* Dropdown for Existing Customer */}
//             {customerType === "existing" && (
//               <div className="pt-2">
//                 <label className="block mb-1 text-xs font-medium text-gray-600">
//                   Select Customer <span className="text-red-500">*</span>
//                 </label>
//                 <select
//                   {...register("customerId", {
//                     required:
//                       customerType === "existing"
//                         ? "Customer is required"
//                         : false,
//                   })}
//                   disabled={loadingCustomers}
//                   className="w-full px-3 py-2 border rounded-md text-sm border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
//                 >
//                   <option value="">
//                     {loadingCustomers
//                       ? "Loading customers..."
//                       : "-- Choose Customer --"}
//                   </option>
//                   {customers.map((c) => (
//                     <option
//                       key={c.id}
//                       value={c.id}
//                     >
//                       {c.customerName} ({c.phone || c.city})
//                     </option>
//                   ))}
//                 </select>
//                 {errors.customerId && (
//                   <p className="text-xs text-red-500 mt-1">
//                     {errors.customerId.message}
//                   </p>
//                 )}
//               </div>
//             )}

//             {/* Message Info for New Customer */}
//             {customerType === "new" && (
//               <div className="bg-blue-50 border border-blue-200 text-blue-700 p-3 rounded-lg text-xs">
//                 You have selected to add a new customer. After selecting order
//                 products below, click <b>"Fill Customer Details"</b> to enter
//                 customer information.
//               </div>
//             )}
//           </div>

//           {/* Step 2: Order Date & Status */}
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <Input
//               label="Order Date"
//               name="orderDate"
//               type="date"
//               register={register}
//               rules={{required: "Order date is required"}}
//               error={errors.orderDate}
//               required
//             />

//             <div>
//               <label className="block mb-1 text-xs sm:text-sm font-medium text-gray-700">
//                 Order Status
//               </label>
//               <select
//                 {...register("status")}
//                 className="w-full px-3 py-2 border rounded-md text-sm border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
//               >
//                 <option value="PENDING">PENDING</option>
//                 <option value="PROCESSING">PROCESSING</option>
//                 <option value="COMPLETED">COMPLETED</option>
//               </select>
//             </div>
//           </div>

//           {/* Step 3: Order Items */}
//           <div className="border border-slate-200 p-4 rounded-xl space-y-4">
//             <div className="flex justify-between items-center">
//               <h4 className="text-sm font-bold text-gray-700">
//                 Order Products
//               </h4>
//               <button
//                 type="button"
//                 onClick={() => append({productId: "", quantity: 1})}
//                 className="flex items-center gap-1 text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-md hover:bg-slate-200 cursor-pointer"
//               >
//                 <Plus className="w-3.5 h-3.5" /> Add Product
//               </button>
//             </div>

//             {fields.map((field, index) => (
//               <div
//                 key={field.id}
//                 className="flex gap-3 items-end bg-slate-50 p-3 rounded-lg border border-slate-100"
//               >
//                 <div className="flex-1">
//                   <label className="block mb-1 text-xs font-medium text-gray-600">
//                     Product
//                   </label>
//                   <select
//                     {...register(`orderItems.${index}.productId`, {
//                       required: "Product is required",
//                     })}
//                     className="w-full px-3 py-2 border rounded-md text-sm border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
//                   >
//                     <option value="">Select Product</option>
//                     {products.map((p) => (
//                       <option
//                         key={p.id}
//                         value={p.id}
//                       >
//                         {p.productName} - ₹{p.price}
//                       </option>
//                     ))}
//                   </select>
//                 </div>

//                 <div className="w-28">
//                   <label className="block mb-1 text-xs font-medium text-gray-600">
//                     Quantity
//                   </label>
//                   <input
//                     type="number"
//                     min="1"
//                     {...register(`orderItems.${index}.quantity`, {
//                       required: true,
//                       min: 1,
//                     })}
//                     className="w-full px-3 py-2 border rounded-md text-sm border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
//                   />
//                 </div>

//                 {fields.length > 1 && (
//                   <button
//                     type="button"
//                     onClick={() => remove(index)}
//                     className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
//                   >
//                     <Trash2 className="w-4 h-4" />
//                   </button>
//                 )}
//               </div>
//             ))}
//           </div>

//           {/* Action Buttons */}
//           <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
//             <button
//               type="button"
//               onClick={onClose}
//               className="px-4 py-2 text-sm bg-gray-100 text-gray-700 font-medium rounded-md hover:bg-gray-200 cursor-pointer"
//             >
//               Cancel
//             </button>

//             {/* 🔥 १. जर जुना Customer असेल तर थेट सबमिट बटण */}
//             {customerType === "existing" ? (
//               <button
//                 type="submit"
//                 disabled={isSubmitting}
//                 className="px-5 py-2 text-sm bg-[#0073b7] text-white font-semibold rounded-md hover:bg-[#0867a0] disabled:opacity-50 cursor-pointer"
//               >
//                 {isSubmitting ? "Creating Order..." : "Create Order"}
//               </button>
//             ) : (
//               /* 🔥 २. जर नवीन Customer निवडला असेल तर हे बटण दाबल्यावरच Customer Modal उघडेल */
//               <button
//                 type="button"
//                 onClick={() => setIsNewCustomerModalOpen(true)}
//                 className="px-5 py-2 text-sm bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 cursor-pointer"
//               >
//                 Fill Customer Details & Create Order
//               </button>
//             )}
//           </div>
//         </form>

//         {/* Customer Modal: फक्त जेव्हा setIsNewCustomerModalOpen(true) होईल तेव्हाच दिसेल */}
//         <CustomerModal
//           isOpen={isNewCustomerModalOpen}
//           onClose={() => setIsNewCustomerModalOpen(false)}
//           onSubmit={handleNewCustomerCreate}
//           vendors={vendors}
//           isSubmitting={isSubmitting}
//         />
//       </div>
//     </div>
//   );
// };

// export default CreateOrderModal;
import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { X, Plus, Trash2 } from "lucide-react";
import CustomerModal from "../Settings/Customer/CustomerModal";
import Input from "../../Components/Form/Input";

const CreateOrderModal = ({
  isOpen,
  onClose,
  onSubmitOrder,
  customers = [],
  products = [],
  vendors = [],
  loadingCustomers = false,
  loadingProducts = false,
  isSubmitting = false,
}) => {
  const [customerType, setCustomerType] = useState("existing");
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);

  // default initial values
  const defaultValues = {
    customerId: "",
    orderDate: new Date().toISOString().split("T")[0],
    status: "PENDING",
    orderItems: [{ productId: "", quantity: 1 }],
  };

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset, // 👈 1. इथे reset इंपोर्ट केले
    formState: { errors },
  } = useForm({
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "orderItems",
  });

  const watchedItems = watch("orderItems");

  // 👈 2. Modal बंद झाल्यास किंवा उघडल्यास फॉर्म क्लिअर / रीसेट करण्यासाठी useEffect
  useEffect(() => {
    if (!isOpen) {
      reset(defaultValues);
      setCustomerType("existing");
    }
  }, [isOpen, reset]);

  // Modal बंद करताना फॉर्म पूर्णपणे क्लिअर करणारे हँडलर
  const handleModalClose = () => {
    reset(defaultValues);
    setCustomerType("existing");
    onClose();
  };

  if (!isOpen) return null;

  const handleExistingOrderSubmit = (data) => {
    const formattedItems = data.orderItems.map((item) => ({
      product: { id: parseInt(item.productId, 10) },
      quantity: parseInt(item.quantity, 10),
    }));

    const orderPayload = {
      orderDate: data.orderDate,
      status: data.status,
      customer: { id: parseInt(data.customerId, 10) },
      orderItems: formattedItems,
    };

    onSubmitOrder(orderPayload, false, null);
  };

  const handleNewCustomerCreate = async (newCustomerFormData) => {
    const currentOrderData = watch();
    const formattedItems = currentOrderData.orderItems.map((item) => ({
      product: { id: parseInt(item.productId, 10) },
      quantity: parseInt(item.quantity, 10),
    }));

    const customerPayload = {
      customerName: newCustomerFormData.customerName,
      landmark: newCustomerFormData.landmark,
      city: newCustomerFormData.city,
      taluka: newCustomerFormData.taluka,
      pincode: newCustomerFormData.pincode,
      email: newCustomerFormData.email,
      phone: newCustomerFormData.phone,
      state: newCustomerFormData.state,
      vendorId: parseInt(newCustomerFormData.vendorId, 10),
    };

    const orderPartialPayload = {
      orderDate: currentOrderData.orderDate,
      status: currentOrderData.status,
      orderItems: formattedItems,
    };

    setIsNewCustomerModalOpen(false);
    onSubmitOrder(orderPartialPayload, true, customerPayload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 bg-slate-50 border-b border-slate-200">
          <h3 className="text-lg font-bold text-gray-800">Create New Order</h3>
          <button
            type="button"
            onClick={handleModalClose} // 👈 3. onClose ऐवजी handleModalClose वापरले
            className="text-gray-400 hover:text-gray-600 hover:bg-slate-200/60 p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit(handleExistingOrderSubmit)}
          className="overflow-y-auto p-6 space-y-6"
        >
          {/* Step 1: Customer Selection */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <label className="block text-sm font-semibold text-gray-700">
              Select Customer Option
            </label>

            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="custType"
                  value="existing"
                  checked={customerType === "existing"}
                  onChange={() => setCustomerType("existing")}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm font-medium text-gray-700">
                  Existing Customer
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="custType"
                  value="new"
                  checked={customerType === "new"}
                  onChange={() => setCustomerType("new")}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm font-medium text-gray-700">
                  + Add New Customer
                </span>
              </label>
            </div>

            {customerType === "existing" && (
              <div className="pt-2">
                <label className="block mb-1 text-xs font-medium text-gray-600">
                  Select Customer <span className="text-red-500">*</span>
                </label>
                <select
                  {...register("customerId", {
                    required:
                      customerType === "existing"
                        ? "Customer is required"
                        : false,
                  })}
                  disabled={loadingCustomers}
                  className="w-full px-3 py-2 border rounded-md text-sm border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
                >
                  <option value="">
                    {loadingCustomers
                      ? "Loading customers..."
                      : "-- Choose Customer --"}
                  </option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.customerName} ({c.phone || c.city})
                    </option>
                  ))}
                </select>
                {errors.customerId && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.customerId.message}
                  </p>
                )}
              </div>
            )}

            {customerType === "new" && (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 p-3 rounded-lg text-xs">
                You have selected to add a new customer. After selecting order
                products below, click <b>"Fill Customer Details"</b> to enter
                customer information.
              </div>
            )}
          </div>

          {/* Step 2: Order Date */}
          <div>
            <Input
              label="Order Date"
              name="orderDate"
              type="date"
              register={register}
              rules={{ required: "Order date is required" }}
              error={errors.orderDate}
              required
            />
          </div>

          {/* Step 3: Order Products */}
          <div className="border border-slate-200 p-4 rounded-xl space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-bold text-gray-700">
                Order Products
              </h4>
              <button
                type="button"
                onClick={() => append({ productId: "", quantity: 1 })}
                className="flex items-center gap-1 text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-md hover:bg-slate-200 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Product
              </button>
            </div>

            {fields.map((field, index) => {
              const selectedProductId = watchedItems?.[index]?.productId;
              const selectedProduct = products.find(
                (p) => String(p.id) === String(selectedProductId)
              );
              const quantity = Number(watchedItems?.[index]?.quantity || 1);

              const price = selectedProduct?.price || 0;
              const mrp = selectedProduct?.mrp || 0;
              const discount = mrp > price ? mrp - price : 0;
              const discountPercent =
                mrp > 0 && mrp > price
                  ? Math.round((discount / mrp) * 100)
                  : 0;

              return (
                <div
                  key={field.id}
                  className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2"
                >
                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <label className="block mb-1 text-xs font-medium text-gray-600">
                        Product
                      </label>
                      <select
                        {...register(`orderItems.${index}.productId`, {
                          required: "Product is required",
                        })}
                        className="w-full px-3 py-2 border rounded-md text-sm border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      >
                        <option value="">Select Product</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.productName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-28">
                      <label className="block mb-1 text-xs font-medium text-gray-600">
                        Quantity
                      </label>
                      <input
                        type="number"
                        min="1"
                        {...register(`orderItems.${index}.quantity`, {
                          required: true,
                          min: 1,
                        })}
                        className="w-full px-3 py-2 border rounded-md text-sm border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      />
                    </div>

                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {selectedProduct && (
                    <div className="flex items-center justify-between text-xs bg-white p-2 rounded border border-slate-200 text-gray-600">
                      <div>
                        <span>
                          Price: <b>₹{price}</b>{" "}
                        </span>
                        {mrp > price && (
                          <span className="line-through text-gray-400 ml-1">
                            ₹{mrp}
                          </span>
                        )}
                        {discountPercent > 0 && (
                          <span className="ml-2 font-semibold text-green-600">
                            ({discountPercent}% OFF)
                          </span>
                        )}
                      </div>
                      <div>
                        <span>
                          Subtotal:{" "}
                          <b>₹{(price * quantity).toLocaleString()}</b>
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Status Field */}
          <div>
            <label className="block mb-1 text-xs sm:text-sm font-medium text-gray-700">
              Order Status
            </label>
            <select
              {...register("status")}
              className="w-full px-3 py-2 border rounded-md text-sm border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="PENDING">PENDING</option>
              <option value="PROCESSING">PROCESSING</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleModalClose} // 👈 4. Cancel बटणावर handleModalClose कॉल केले
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 font-medium rounded-md hover:bg-gray-200 cursor-pointer"
            >
              Cancel
            </button>

            {customerType === "existing" ? (
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-sm bg-[#0073b7] text-white font-semibold rounded-md hover:bg-[#0867a0] disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? "Creating Order..." : "Create Order"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsNewCustomerModalOpen(true)}
                className="px-5 py-2 text-sm bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 cursor-pointer"
              >
                Fill Customer Details & Create Order
              </button>
            )}
          </div>
        </form>

        <CustomerModal
          isOpen={isNewCustomerModalOpen}
          onClose={() => setIsNewCustomerModalOpen(false)}
          onSubmit={handleNewCustomerCreate}
          vendors={vendors}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
};

export default CreateOrderModal;