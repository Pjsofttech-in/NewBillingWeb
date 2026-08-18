import {useState, useEffect} from "react";
import {useForm, useFieldArray, useWatch} from "react-hook-form";
import {
  X,
  Plus,
  Trash2,
  AlertCircle,
  Tag,
  Calculator,
  Info,
} from "lucide-react";
import CustomerModal from "../Settings/Customer/CustomerModal";
import Input from "../../Components/Form/Input";

const DEFAULT_VALUES = {
  customerId: "",
  orderDate: new Date().toISOString().split("T")[0],
  status: "PENDING",
  orderItems: [
    {productId: "", quantity: 1, customerDiscountPercentage: 0, price: ""},
  ],
};

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
  const [errorMessage, setErrorMessage] = useState("");
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  const {
    register,
    handleSubmit,
    control,
    getValues,
    setValue,
    reset,
    formState: {errors},
  } = useForm({
    defaultValues: DEFAULT_VALUES,
  });

  const {fields, append, remove} = useFieldArray({
    control,
    name: "orderItems",
  });

  const watchedItems = useWatch({
    control,
    name: "orderItems",
  });

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (!isOpen) {
      setCustomerType("existing");
      setErrorMessage("");
    }
  }

  useEffect(() => {
    if (!isOpen) {
      reset(DEFAULT_VALUES);
    }
  }, [isOpen, reset]);

  const handleModalClose = () => {
    reset(DEFAULT_VALUES);
    setCustomerType("existing");
    setErrorMessage("");
    onClose();
  };

  const validateStockBeforeSubmit = (items) => {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const product = products.find(
        (p) => String(p.id) === String(item.productId),
      );
      const requestedQty = parseInt(item.quantity, 10) || 0;

      if (!product) {
        setErrorMessage(`Please select a valid product for item #${i + 1}`);
        return false;
      }

      const availableStock = product.stock ?? 0;

      if (availableStock <= 0) {
        setErrorMessage(`Product "${product.productName}" is Out of Stock!`);
        return false;
      }

      if (requestedQty > availableStock) {
        setErrorMessage(
          `Insufficient stock for "${product.productName}". Available: ${availableStock}, Requested: ${requestedQty}`,
        );
        return false;
      }
    }
    return true;
  };

  const formatOrderItems = (rawItems) => {
    return rawItems.map((item) => {
      const parsedDiscountPct = parseFloat(item.customerDiscountPercentage);
      const parsedPrice = parseFloat(item.price);

      const formatted = {
        productId: parseInt(item.productId, 10),
        product: {id: parseInt(item.productId, 10)},
        quantity: parseInt(item.quantity, 10),
      };

      if (!isNaN(parsedDiscountPct) && parsedDiscountPct > 0) {
        formatted.customerDiscountPercentage = parsedDiscountPct;
      }

      if (!isNaN(parsedPrice) && parsedPrice > 0) {
        formatted.price = parsedPrice;
      }

      return formatted;
    });
  };

  const calculateOverallTotals = () => {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalGst = 0;
    let grandTotal = 0;

    (watchedItems || []).forEach((item) => {
      const product = products.find(
        (p) => String(p.id) === String(item?.productId),
      );
      if (!product) return;

      const qty = Number(item.quantity || 1);
      const basePrice = Number(product.customerPrice || product.price || 0);
      const discountPct = Number(item.customerDiscountPercentage || 0);
      const customPrice = item.price !== "" ? Number(item.price) : null;

      let finalUnitPrice = basePrice;
      if (customPrice !== null && !isNaN(customPrice)) {
        finalUnitPrice = customPrice;
      } else if (discountPct > 0) {
        finalUnitPrice = basePrice - (basePrice * discountPct) / 100;
      }

      const itemSubtotal = basePrice * qty;
      const itemDiscount = (basePrice - finalUnitPrice) * qty;

      const gstPercentage = product.gstApplicable
        ? Number(product.totalGstPercentage || product.gstPercentage || 0)
        : 0;
      const itemGst = (finalUnitPrice * qty * gstPercentage) / 100;

      const itemTotal = finalUnitPrice * qty + itemGst;

      subtotal += itemSubtotal;
      totalDiscount += itemDiscount;
      totalGst += itemGst;
      grandTotal += itemTotal;
    });

    return {subtotal, totalDiscount, totalGst, grandTotal};
  };

  const overallTotals = calculateOverallTotals();

  const handleExistingOrderSubmit = async (data) => {
    setErrorMessage("");

    if (!validateStockBeforeSubmit(data.orderItems)) {
      return;
    }

    const orderPayload = {
      orderDate: data.orderDate,
      status: data.status,
      customer: {id: parseInt(data.customerId, 10)},
      orderItems: formatOrderItems(data.orderItems),
    };

    try {
      await onSubmitOrder(orderPayload, false, null);
    } catch (err) {
      setErrorMessage(
        err?.response?.data?.message || err.message || "Failed to create order",
      );
    }
  };

  const handleNewCustomerCreate = async (newCustomerFormData) => {
    setErrorMessage("");
    const currentOrderData = getValues();

    if (!validateStockBeforeSubmit(currentOrderData.orderItems)) {
      setIsNewCustomerModalOpen(false);
      return;
    }

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
      orderItems: formatOrderItems(currentOrderData.orderItems),
    };

    try {
      setIsNewCustomerModalOpen(false);
      await onSubmitOrder(orderPartialPayload, true, customerPayload);
    } catch (err) {
      setErrorMessage(
        err?.response?.data?.message || err.message || "Failed to create order",
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold">Create New Sales Order</h3>
            <p className="text-xs text-slate-400">
              Configure items, custom discounts, and pricing per line item
            </p>
          </div>
          <button
            type="button"
            onClick={handleModalClose}
            className="text-slate-400 hover:text-white hover:bg-slate-800 p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm font-medium">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form
          onSubmit={handleSubmit(handleExistingOrderSubmit)}
          className="overflow-y-auto p-6 space-y-6"
        >
          {/* Customer Selection & Date */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="md:col-span-2 space-y-3">
              <label className="block text-sm font-bold text-slate-800">
                Customer Option
              </label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-slate-700">
                  <input
                    type="radio"
                    name="custType"
                    value="existing"
                    checked={customerType === "existing"}
                    onChange={() => setCustomerType("existing")}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  Existing Customer
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-slate-700">
                  <input
                    type="radio"
                    name="custType"
                    value="new"
                    checked={customerType === "new"}
                    onChange={() => setCustomerType("new")}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  + Add New Customer
                </label>
              </div>

              {customerType === "existing" && (
                <div>
                  <select
                    {...register("customerId", {
                      required:
                        customerType === "existing"
                          ? "Customer selection is required"
                          : false,
                    })}
                    disabled={loadingCustomers}
                    className="w-full px-3 py-2 border rounded-lg text-sm border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-100 bg-white"
                  >
                    <option value="">
                      {loadingCustomers
                        ? "Loading customers..."
                        : "-- Choose Customer --"}
                    </option>
                    {customers.map((c) => (
                      <option
                        key={c.id}
                        value={c.id}
                      >
                        {c.customerName} ({c.phone || c.city || "No Contact"})
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
            </div>

            <div>
              {" "}
              <Input
                label="Order Date"
                name="orderDate"
                type="date"
                register={register}
                rules={{required: "Order date is required"}}
                error={errors.orderDate}
                required
              />
            </div>
          </div>

          {/* Order Items Section */}
          <div className="border border-slate-200 p-4 sm:p-5 rounded-xl space-y-4 bg-slate-50/50">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-blue-600" /> Order Items &
                  Pricing
                </h4>
                <p className="text-xs text-slate-500">
                  Select products, set quantities, and apply customer discounts
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  append({
                    productId: "",
                    quantity: 1,
                    customerDiscountPercentage: 0,
                    price: "",
                  })
                }
                className="flex items-center gap-1.5 text-xs bg-blue-600 text-white px-3 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" /> Add Item
              </button>
            </div>

            {fields.map((field, index) => {
              const selectedProductId = watchedItems?.[index]?.productId;
              const selectedProduct = products.find(
                (p) => String(p.id) === String(selectedProductId),
              );

              const quantity = Number(watchedItems?.[index]?.quantity || 1);
              const availableStock = selectedProduct?.stock ?? 0;
              const isStockInsufficient = quantity > availableStock;

              const storePrice = Number(
                selectedProduct?.customerPrice || selectedProduct?.price || 0,
              );
              const mrp = Number(selectedProduct?.mrp || storePrice);

              const discountInputPct =
                watchedItems?.[index]?.customerDiscountPercentage;
              const userEnteredPrice = watchedItems?.[index]?.price;

              let finalSellingPrice = storePrice;
              let discountPercent = Number(discountInputPct || 0);

              if (
                userEnteredPrice !== "" &&
                userEnteredPrice !== undefined &&
                !isNaN(Number(userEnteredPrice))
              ) {
                finalSellingPrice = Number(userEnteredPrice);
                if (storePrice > finalSellingPrice && storePrice > 0) {
                  discountPercent = Math.round(
                    ((storePrice - finalSellingPrice) / storePrice) * 100,
                  );
                }
              } else if (discountPercent > 0) {
                const discountPerUnit = (storePrice * discountPercent) / 100;
                finalSellingPrice = Math.max(0, storePrice - discountPerUnit);
              }

              const perUnitDiscountAmount = Math.max(
                0,
                storePrice - finalSellingPrice,
              );
              const totalDiscountSavings = perUnitDiscountAmount * quantity;

              const gstPct = selectedProduct?.gstApplicable
                ? Number(
                    selectedProduct?.totalGstPercentage ||
                      selectedProduct?.gstPercentage ||
                      0,
                  )
                : 0;

              const lineItemSubtotal = finalSellingPrice * quantity;
              const lineItemGst = (lineItemSubtotal * gstPct) / 100;
              const lineItemTotal = lineItemSubtotal + lineItemGst;

              return (
                <div
                  key={field.id}
                  className={`p-4 rounded-xl border space-y-3 transition-all ${
                    isStockInsufficient && selectedProduct
                      ? "bg-red-50/70 border-red-300"
                      : "bg-white border-slate-200 shadow-xs"
                  }`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                    {/* Product Selection */}
                    <div className="md:col-span-4">
                      <label className="block mb-1 text-xs font-semibold text-slate-700">
                        Product <span className="text-red-500">*</span>
                      </label>
                      <select
                        {...register(`orderItems.${index}.productId`, {
                          required: "Product selection is required",
                          onChange: (e) => {
                            const prod = products.find(
                              (p) => String(p.id) === String(e.target.value),
                            );
                            if (prod) {
                              const baseP = prod.customerPrice || prod.price;
                              if (baseP) {
                                setValue(
                                  `orderItems.${index}.price`,
                                  String(baseP),
                                );
                              }
                            }
                          },
                        })}
                        disabled={loadingProducts}
                        className="w-full px-3 py-2 border rounded-lg text-sm border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white disabled:bg-slate-100 font-medium"
                      >
                        <option value="">
                          {loadingProducts
                            ? "Loading inventory..."
                            : "-- Select Product --"}
                        </option>
                        {products.map((p) => (
                          <option
                            key={p.id}
                            value={p.id}
                            disabled={p.stock <= 0}
                          >
                            {p.productName} (Stock: {p.stock ?? 0})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity */}
                    <div className="md:col-span-2">
                      <label className="block mb-1 text-xs font-semibold text-slate-700">
                        Qty
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={availableStock > 0 ? availableStock : 1}
                        {...register(`orderItems.${index}.quantity`, {
                          required: true,
                          min: 1,
                        })}
                        className={`w-full px-3 py-2 border rounded-lg text-sm outline-none font-medium bg-white ${
                          isStockInsufficient
                            ? "border-red-500 focus:ring-red-500"
                            : "border-slate-300 focus:ring-blue-500"
                        }`}
                      />
                    </div>

                    {/* Discount % Input */}
                    <div className="md:col-span-2">
                      <label className="block mb-1 text-xs font-semibold text-slate-700">
                        Discount %
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        placeholder="0%"
                        {...register(
                          `orderItems.${index}.customerDiscountPercentage`,
                          {
                            onChange: (e) => {
                              const pct = parseFloat(e.target.value);
                              if (
                                !isNaN(pct) &&
                                pct >= 0 &&
                                pct <= 100 &&
                                storePrice > 0
                              ) {
                                const newPrice = (
                                  storePrice -
                                  (storePrice * pct) / 100
                                ).toFixed(2);
                                setValue(`orderItems.${index}.price`, newPrice);
                              }
                            },
                          },
                        )}
                        className="w-full px-3 py-2 border rounded-lg text-sm outline-none font-medium bg-white border-slate-300 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Custom Selling Price Input */}
                    <div className="md:col-span-3">
                      <label className="block mb-1 text-xs font-semibold text-slate-700">
                        Selling Price (₹)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder={
                          selectedProduct ? String(storePrice) : "Price"
                        }
                        {...register(`orderItems.${index}.price`, {
                          onChange: (e) => {
                            const val = parseFloat(e.target.value);
                            if (
                              !isNaN(val) &&
                              storePrice > 0 &&
                              val <= storePrice
                            ) {
                              const calcPct = (
                                ((storePrice - val) / storePrice) *
                                100
                              ).toFixed(2);
                              setValue(
                                `orderItems.${index}.customerDiscountPercentage`,
                                calcPct,
                              );
                            }
                          },
                        })}
                        className="w-full px-3 py-2 border rounded-lg text-sm outline-none font-semibold bg-white border-slate-300 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Delete Action */}
                    <div className="md:col-span-1 flex justify-end">
                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Remove Item"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Important Product Info Card */}
                  {selectedProduct && (
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1.5 text-slate-700">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-1.5">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 font-semibold text-slate-800">
                            <Info className="w-3.5 h-3.5 text-blue-600" />
                            {selectedProduct.productName}
                          </span>
                          <span>
                            Base: <b>₹{storePrice.toFixed(2)}</b>
                          </span>
                          {mrp > storePrice && (
                            <span className="text-slate-400 line-through">
                              MRP: ₹{mrp.toFixed(2)}
                            </span>
                          )}
                          <span>
                            GST: <b>{gstPct}%</b>
                          </span>
                        </div>
                        <div>
                          <span
                            className={`font-semibold px-2 py-0.5 rounded ${
                              availableStock <= 0
                                ? "bg-red-100 text-red-700"
                                : isStockInsufficient
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            Stock Available: {availableStock}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5 font-medium">
                        <div className="flex items-center gap-3">
                          {totalDiscountSavings > 0 ? (
                            <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              Savings ({discountPercent.toFixed(1)}% OFF): -₹
                              {totalDiscountSavings.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-slate-400">
                              Standard Price
                            </span>
                          )}
                        </div>
                        <span className="text-slate-900 font-bold text-sm">
                          Line Total: ₹
                          {lineItemTotal.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>
                  )}

                  {isStockInsufficient && selectedProduct && (
                    <p className="text-xs text-red-600 font-bold">
                      ⚠️ Requested quantity ({quantity}) exceeds available stock
                      ({availableStock}).
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Order Status Section (Moved to Bottom) */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider">
                Order Status
              </label>
              <p className="text-xs text-slate-500">
                Set initial fulfillment status for this sales order
              </p>
            </div>
            <select
              {...register("status")}
              className="w-full sm:w-52 px-3 py-2 border rounded-lg text-sm border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white font-semibold"
            >
              <option value="PENDING">PENDING</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="SHIPPED">SHIPPED</option>
              <option value="DELIVERED">DELIVERED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          {/* Grand Financial Summary */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-sm space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-emerald-400" /> Order
              Financial Summary
            </h5>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs sm:text-sm">
              <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                <span className="text-slate-400 text-xs block">
                  Base Subtotal
                </span>
                <span className="text-base font-semibold">
                  ₹{overallTotals.subtotal.toFixed(2)}
                </span>
              </div>
              <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                <span className="text-emerald-400 text-xs block">
                  Total Discount Savings
                </span>
                <span className="text-base font-semibold text-emerald-400">
                  -₹{overallTotals.totalDiscount.toFixed(2)}
                </span>
              </div>
              <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                <span className="text-slate-400 text-xs block">
                  Applied Taxes (GST)
                </span>
                <span className="text-base font-semibold">
                  +₹{overallTotals.totalGst.toFixed(2)}
                </span>
              </div>
              <div className="bg-blue-600 p-3 rounded-xl border border-blue-500">
                <span className="text-blue-100 text-xs block font-bold">
                  Grand Payable Total
                </span>
                <span className="text-lg font-bold text-white">
                  ₹{overallTotals.grandTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleModalClose}
              className="px-5 py-2.5 text-sm bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 cursor-pointer transition-colors"
            >
              Cancel
            </button>

            {customerType === "existing" ? (
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 text-sm bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 cursor-pointer transition-all shadow-md"
              >
                {isSubmitting ? "Creating Order..." : "Create Order"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  const currentOrderData = getValues();
                  if (validateStockBeforeSubmit(currentOrderData.orderItems)) {
                    setIsNewCustomerModalOpen(true);
                  }
                }}
                className="px-6 py-2.5 text-sm bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 cursor-pointer transition-all shadow-md"
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
