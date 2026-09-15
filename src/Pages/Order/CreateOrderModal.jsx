import {useEffect, useState} from "react";
import {useForm, useFieldArray, useWatch} from "react-hook-form";
import {X, Plus, Trash2, AlertCircle, Package} from "lucide-react";

import CustomerModal from "../Settings/Customer/CustomerModal";

import Input from "../../Components/Form/Input";
import Select from "../../Components/Form/Select";
import Radio from "../../Components/Form/Radio";

const DEFAULT_VALUES = {
  customerType: "existing",
  customerId: "",
  orderDate: new Date().toISOString().split("T")[0],
  paymentDueDate: "",
  status: "PENDING",
  orderItems: [
    {
      productId: "",
      quantity: 1,
      customerDiscountPercentage: 0,
    },
  ],
};

const CreateOrderModal = ({
  isOpen,
  onClose,
  onSubmitOrder,
  customers = [],
  products = [],
  loadingCustomers = false,
  loadingProducts = false,
  isSubmitting = false,
}) => {
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

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

  const customerType = useWatch({
    control,
    name: "customerType",
  });

  useEffect(() => {
    if (!isOpen) {
      reset(DEFAULT_VALUES);
      setErrorMessage("");
      setIsNewCustomerModalOpen(false);
    }
  }, [isOpen, reset]);

  const handleModalClose = () => {
    reset(DEFAULT_VALUES);
    setErrorMessage("");
    setIsNewCustomerModalOpen(false);
    onClose();
  };

  const validateStockBeforeSubmit = (items) => {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      const product = products.find(
        (p) => String(p.id) === String(item.productId),
      );

      const requestedQty = Number(item.quantity) || 0;

      if (!product) {
        setErrorMessage(`Select a product for item #${i + 1}`);
        return false;
      }

      const availableStock = Number(product.stock ?? 0);

      if (availableStock <= 0) {
        setErrorMessage(`"${product.productName}" is out of stock`);
        return false;
      }

      if (requestedQty <= 0) {
        setErrorMessage(`Enter a valid quantity for item #${i + 1}`);
        return false;
      }

      if (requestedQty > availableStock) {
        setErrorMessage(
          `Only ${availableStock} of "${product.productName}" left in stock`,
        );
        return false;
      }
    }

    return true;
  };

  const formatOrderItems = (rawItems) => {
    return rawItems.map((item) => ({
      product: {
        id: Number(item.productId),
      },

      quantity: Number(item.quantity),

      customerDiscountPercentage: Number(item.customerDiscountPercentage || 0),
    }));
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

      const quantity = Number(item.quantity || 0);
      const basePrice = Number(product.customerPrice || 0);
      const discountPercentage = Math.max(
        0,
        Math.min(100, Number(item.customerDiscountPercentage || 0)),
      );
      const itemSubtotal = basePrice * quantity;
      const itemDiscount = (itemSubtotal * discountPercentage) / 100;
      const taxable = Math.max(0, itemSubtotal - itemDiscount);
      const gstPercentage = product.gstApplicable
        ? Number(product.totalGstPercentage || 0)
        : 0;
      const itemGst = (taxable * gstPercentage) / 100;

      subtotal += itemSubtotal;
      totalDiscount += itemDiscount;
      totalGst += itemGst;
      grandTotal += taxable + itemGst;
    });

    return {subtotal, totalDiscount, totalGst, grandTotal};
  };

  const overallTotals = calculateOverallTotals();

  const handleExistingOrderSubmit = async (data) => {
    setErrorMessage("");

    if (!validateStockBeforeSubmit(data.orderItems)) {
      return;
    }

    if (!data.customerId) {
      setErrorMessage("Select a customer");
      return;
    }

    if (
      data.paymentDueDate &&
      data.orderDate &&
      data.paymentDueDate < data.orderDate
    ) {
      setErrorMessage("Payment due date cannot be before the order date");
      return;
    }

    const orderPayload = {
      orderDate: data.orderDate,
      paymentDueDate: data.paymentDueDate || null,
      status: data.status,
      customer: {
        id: Number(data.customerId),
      },
      orderItems: formatOrderItems(data.orderItems),
    };

    try {
      await onSubmitOrder(orderPayload, false, null);
    } catch (error) {
      setErrorMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to create order",
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
    };

    const orderPartialPayload = {
      orderDate: currentOrderData.orderDate,
      paymentDueDate: currentOrderData.paymentDueDate || null,
      status: currentOrderData.status,
      orderItems: formatOrderItems(currentOrderData.orderItems),
    };

    try {
      setIsNewCustomerModalOpen(false);

      await onSubmitOrder(orderPartialPayload, true, customerPayload);
    } catch (error) {
      setErrorMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to create order",
      );
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-900">Create Order</h3>

            <button
              type="button"
              onClick={handleModalClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />

              <span>{errorMessage}</span>
            </div>
          )}

          <form
            onSubmit={handleSubmit(handleExistingOrderSubmit)}
            className="overflow-y-auto p-6 space-y-5"
          >
            {/* Customer and Date */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2 space-y-3">
                <Radio
                  label="Customer Type"
                  name="customerType"
                  register={register}
                  error={errors.customerType}
                  options={[
                    {
                      label: "Existing Customer",
                      value: "existing",
                    },
                    {
                      label: "New Customer",
                      value: "new",
                    },
                  ]}
                  rules={{
                    required: "Please select customer type",
                    onChange: () => {
                      setErrorMessage("");
                    },
                  }}
                />

                {customerType === "existing" && (
                  <Select
                    name="customerId"
                    register={register}
                    error={errors.customerId}
                    disabled={loadingCustomers}
                    placeholder={
                      loadingCustomers
                        ? "Loading customers..."
                        : "Select Customer"
                    }
                    options={customers.map((customer) => ({
                      value: customer.id,
                      label: `${customer.customerName} (${
                        customer.city || customer.email || "No details"
                      })`,
                    }))}
                    rules={{
                      required: "Please select a customer",
                    }}
                  />
                )}
              </div>

              <Input
                label="Order Date"
                name="orderDate"
                type="date"
                register={register}
                error={errors.orderDate}
                required
                rules={{
                  required: "Order date is required",
                }}
              />

              <Input
                label="Payment Due Date"
                name="paymentDueDate"
                type="date"
                register={register}
                error={errors.paymentDueDate}
                rules={{
                  validate: (value, formValues) =>
                    !value ||
                    !formValues.orderDate ||
                    value >= formValues.orderDate ||
                    "Due date cannot be before order date",
                }}
              />
            </div>

            {/* Order Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-slate-800">
                    Order Items
                  </h4>

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
                    title="Add Item"
                    aria-label="Add Item"
                    className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md bg-blue-600 text-white transition hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {fields.map((field, index) => {
                const selectedProductId = watchedItems?.[index]?.productId;

                const selectedProduct = products.find(
                  (product) => String(product.id) === String(selectedProductId),
                );

                const quantity = Number(watchedItems?.[index]?.quantity || 1);

                const availableStock = Number(selectedProduct?.stock ?? 0);

                const isStockInsufficient =
                  selectedProduct && quantity > availableStock;

                const storePrice = Number(
                  selectedProduct?.customerPrice || selectedProduct?.price || 0,
                );

                const discountPercentage = Number(
                  watchedItems?.[index]?.customerDiscountPercentage || 0,
                );

                const gstPercentage = selectedProduct?.gstApplicable
                  ? Number(
                      selectedProduct?.totalGstPercentage ||
                        selectedProduct?.gstPercentage ||
                        0,
                    )
                  : 0;

                const lineSubtotal = storePrice * quantity;
                const lineDiscount = (lineSubtotal * discountPercentage) / 100;
                const taxableAmount = Math.max(0, lineSubtotal - lineDiscount);
                const lineGst = (taxableAmount * gstPercentage) / 100;
                const lineTotal = taxableAmount + lineGst;

                return (
                  <div
                    key={field.id}
                    className={`p-4 rounded-xl border space-y-3 ${
                      isStockInsufficient
                        ? "border-red-300 bg-red-50"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                      {/* Product */}
                      <div className="md:col-span-6">
                        <Select
                          name={`orderItems.${index}.productId`}
                          register={register}
                          error={errors.orderItems?.[index]?.productId}
                          disabled={loadingProducts}
                          placeholder={
                            loadingProducts
                              ? "Loading products..."
                              : "Select Product"
                          }
                          options={products.map((product) => ({
                            value: product.id,
                            label: `${product.productName} (${product.stock ?? 0} in stock)`,
                            disabled: Number(product.stock ?? 0) <= 0,
                          }))}
                          rules={{
                            required: "Please select a product",

                            onChange: (event) => {
                              const product = products.find(
                                (p) =>
                                  String(p.id) === String(event.target.value),
                              );

                              if (product) {
                                setValue(
                                  `orderItems.${index}.customerDiscountPercentage`,
                                  0,
                                );
                              }

                              setErrorMessage("");
                            },
                          }}
                        />
                      </div>

                      {/* Quantity */}
                      <div className="md:col-span-2">
                        <Input
                          name={`orderItems.${index}.quantity`}
                          type="number"
                          placeholder="Quantity"
                          register={register}
                          error={errors.orderItems?.[index]?.quantity}
                          className={
                            isStockInsufficient ? "border-red-500" : ""
                          }
                          rules={{
                            required: "Quantity is required",

                            min: {
                              value: 1,
                              message: "Minimum quantity is 1",
                            },

                            max:
                              availableStock > 0
                                ? {
                                    value: availableStock,
                                    message: `Only ${availableStock} available`,
                                  }
                                : undefined,
                          }}
                        />
                      </div>

                      {/* Discount */}
                      <div className="md:col-span-3">
                        <Input
                          name={`orderItems.${index}.customerDiscountPercentage`}
                          type="number"
                          placeholder="Discount %"
                          register={register}
                          error={
                            errors.orderItems?.[index]
                              ?.customerDiscountPercentage
                          }
                          rules={{
                            min: {
                              value: 0,
                              message: "Discount cannot be negative",
                            },

                            max: {
                              value: 100,
                              message: "Maximum discount is 100%",
                            },
                          }}
                        />
                      </div>

                      {/* Remove */}
                      <div className="md:col-span-1 flex justify-end">
                        {fields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Product Details */}
                    {selectedProduct && (
                      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-1 text-slate-500">
                          <Package className="w-3.5 h-3.5" />

                          <span>Available Stock: {availableStock}</span>
                          <span>•</span>
                          <span>
                            MRP: ₹
                            {Number(selectedProduct?.productMrp || 0).toFixed(
                              2,
                            )}
                          </span>
                          <span>•</span>

                          <span>Sell: ₹{storePrice.toFixed(2)}</span>

                          {gstPercentage > 0 && (
                            <>
                              <span>•</span>

                              <span>GST: {gstPercentage}%</span>
                            </>
                          )}
                        </div>

                        <div className="font-semibold text-slate-800">
                          Total: ₹
                          {lineTotal.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </div>
                      </div>
                    )}

                    {isStockInsufficient && (
                      <p className="text-xs text-red-600 font-medium">
                        Only {availableStock} units are available in stock.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Status */}
            <Select
              label="Order Status"
              name="status"
              register={register}
              error={errors.status}
              options={[
                {
                  label: "Pending",
                  value: "PENDING",
                },
                {
                  label: "Confirmed",
                  value: "CONFIRMED",
                },
                {
                  label: "Shipped",
                  value: "SHIPPED",
                },
                {
                  label: "Delivered",
                  value: "DELIVERED",
                },
                {
                  label: "Cancelled",
                  value: "CANCELLED",
                },
              ]}
            />

            {/* Order Summary */}
            <div className="bg-slate-900 text-white p-4 rounded-xl">
              <div className="flex flex-wrap justify-between gap-3 text-sm">
                <span className="text-slate-300">
                  Subtotal:{" "}
                  <b className="text-white">
                    ₹{overallTotals.subtotal.toFixed(2)}
                  </b>
                </span>

                <span className="text-slate-300">
                  Discount:{" "}
                  <b className="text-emerald-400">
                    -₹
                    {overallTotals.totalDiscount.toFixed(2)}
                  </b>
                </span>

                <span className="text-slate-300">
                  GST:{" "}
                  <b className="text-white">
                    +₹
                    {overallTotals.totalGst.toFixed(2)}
                  </b>
                </span>

                <span className="font-bold text-base">
                  Grand Total: ₹
                  {overallTotals.grandTotal.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleModalClose}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>

              {customerType === "existing" ? (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? "Creating..." : "Create Order"}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    const currentOrderData = getValues();

                    if (
                      validateStockBeforeSubmit(currentOrderData.orderItems)
                    ) {
                      setIsNewCustomerModalOpen(true);
                    }
                  }}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
                >
                  Continue
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* New Customer Modal */}
      <CustomerModal
        isOpen={isNewCustomerModalOpen}
        onClose={() => setIsNewCustomerModalOpen(false)}
        onSubmit={handleNewCustomerCreate} 
        isSubmitting={isSubmitting}
      />
    </>
  );
};

export default CreateOrderModal;
