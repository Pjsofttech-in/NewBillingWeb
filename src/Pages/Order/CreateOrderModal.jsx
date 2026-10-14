import {useEffect, useState} from "react";
import {useForm, useFieldArray, useWatch} from "react-hook-form";
import {X, Plus, Trash2, AlertCircle, Package, UserPlus} from "lucide-react";

import CustomerModal from "../Settings/Customer/CustomerModal";

import Input from "../../Components/Form/Input";

import Select from "../../Components/Form/Select";
import Radio from "../../Components/Form/Radio";
import StatCard from "./StatCard";

const DEFAULT_VALUES = {
  customerType: "existing",
  customerId: "",
  orderDate: new Date().toISOString().split("T")[0],
  paymentStatus: "UNPAID", // UNPAID | PAID
  paymentDueDate: "", // used when UNPAID
  paymentPaidDate: "", // used when PAID
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
  editingOrder = null,
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

  const isEditMode = Boolean(editingOrder?.id);

  const customerType = useWatch({
    control,
    name: "customerType",
  });

  const paymentStatus = useWatch({
    control,
    name: "paymentStatus",
  });

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (prevIsOpen !== isOpen) {
    setPrevIsOpen(isOpen);
    if (!isOpen) {
      setErrorMessage("");
      setIsNewCustomerModalOpen(false);
    }
  }

  useEffect(() => {
    if (!isOpen) return;

    if (editingOrder?.id) {
      const isPaid =
        editingOrder.paymentStatus === "PAID" ||
        (editingOrder.pendingAmount !== undefined &&
          editingOrder.pendingAmount !== null &&
          Number(editingOrder.pendingAmount) <= 0.009 &&
          Number(editingOrder.paidAmount || 0) > 0);

      reset({
        customerType: "existing",
        customerId: editingOrder.customer?.id
          ? String(editingOrder.customer.id)
          : "",
        orderDate: String(editingOrder.orderDate || "").slice(0, 10),
        paymentStatus: isPaid ? "PAID" : "UNPAID",
        paymentDueDate: editingOrder.paymentDueDate
          ? String(editingOrder.paymentDueDate).slice(0, 10)
          : "",
        paymentPaidDate: editingOrder.paymentPaidDate
          ? String(editingOrder.paymentPaidDate).slice(0, 10)
          : "",
        status: editingOrder.status || "PENDING",
        orderItems: (editingOrder.orderItems || []).map((item) => ({
          productId: item.product?.id ? String(item.product.id) : "",
          quantity: Number(item.quantity || 1),
          customerDiscountPercentage: Number(
            item.customerDiscountPercentage || 0,
          ),
        })),
      });
    } else {
      reset(DEFAULT_VALUES);
    }
  }, [isOpen, editingOrder, reset]);

  const handleModalClose = () => {
    reset(DEFAULT_VALUES);
    setErrorMessage("");
    setIsNewCustomerModalOpen(false);
    onClose();
  };

  // Quantity of a product already inside the order being edited (0 when creating).
  // That quantity is returned to stock by the backend before the edit is applied,
  // so it must count as available here too.
  const getOriginalQuantity = (productId) =>
    isEditMode
      ? Number(
          (editingOrder?.orderItems || [])
            .filter(
              (oldItem) => String(oldItem.product?.id) === String(productId),
            )
            .reduce((sum, oldItem) => sum + Number(oldItem.quantity || 0), 0),
        )
      : 0;

  const getEffectiveStock = (product) =>
    product ? Number(product.stock ?? 0) + getOriginalQuantity(product.id) : 0;

  // Same product on several lines -> ONE line (quantities added, discount weighted by quantity).
  const mergeDuplicateItems = (rawItems = []) => {
    const merged = new Map();
    rawItems.forEach((item) => {
      const key = String(item.productId);
      const qty = Number(item.quantity) || 0;
      const discount = Number(item.customerDiscountPercentage) || 0;
      if (!item.productId || !merged.has(key)) {
        merged.set(item.productId ? key : `empty-${merged.size}`, {
          ...item,
          quantity: qty,
          customerDiscountPercentage: discount,
        });
        return;
      }
      const current = merged.get(key);
      const totalQty = current.quantity + qty;
      current.customerDiscountPercentage =
        totalQty > 0
          ? Math.round(
              ((current.customerDiscountPercentage * current.quantity +
                discount * qty) /
                totalQty) *
                100,
            ) / 100
          : 0;
      current.quantity = totalQty;
    });
    return Array.from(merged.values());
  };

  const validateStockBeforeSubmit = (
    items,
    {skipForCancellation = false} = {},
  ) => {
    if (skipForCancellation) return true;

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

      const availableStock = getEffectiveStock(product);

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

  // Payment fields sent to the API depending on Paid / Unpaid
  const buildPaymentFields = (data) => {
    if (data.paymentStatus === "PAID") {
      return {
        paymentStatus: "PAID",
        paymentPaidDate: data.paymentPaidDate || null,
        paymentDueDate: null,
      };
    }

    return {
      paymentStatus: "UNPAID",
      paymentDueDate: data.paymentDueDate || null,
      paymentPaidDate: null,
    };
  };

  const validatePaymentDates = (data) => {
    if (data.paymentStatus === "PAID") {
      if (!data.paymentPaidDate) {
        setErrorMessage("Select the payment paid date");
        return false;
      }

      if (data.orderDate && data.paymentPaidDate < data.orderDate) {
        setErrorMessage("Payment paid date cannot be before the order date");
        return false;
      }

      return true;
    }

    if (
      data.paymentDueDate &&
      data.orderDate &&
      data.paymentDueDate < data.orderDate
    ) {
      setErrorMessage("Payment due date cannot be before the order date");
      return false;
    }

    return true;
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

    const isCancellingEdit = isEditMode && data.status === "CANCELLED";
    data = {...data, orderItems: mergeDuplicateItems(data.orderItems)};

    if (
      !validateStockBeforeSubmit(data.orderItems, {
        skipForCancellation: isCancellingEdit,
      })
    ) {
      return;
    }

    if (customerType === "existing" && !data.customerId) {
      setErrorMessage("Select a customer");
      return;
    }

    if (!validatePaymentDates(data)) {
      return;
    }

    const orderPayload = {
      orderDate: data.orderDate,
      ...buildPaymentFields(data),
      status: data.status,
      customer: {
        id: Number(data.customerId),
      },
      orderItems: formatOrderItems(data.orderItems),
    };

    try {
      await onSubmitOrder(
        orderPayload,
        false,
        null,
        isEditMode ? editingOrder.id : null,
      );
    } catch (error) {
      setErrorMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to create order",
      );
    }
  };

  const handleNewCustomerCreate = async (newCustomerFormData) => {
    if (isEditMode) {
      setErrorMessage(
        "A new customer cannot be created while editing an order",
      );
      return;
    }

    setErrorMessage("");
    const currentOrderData = getValues();
    currentOrderData.orderItems = mergeDuplicateItems(
      currentOrderData.orderItems,
    );

    if (!validateStockBeforeSubmit(currentOrderData.orderItems)) {
      setIsNewCustomerModalOpen(false);
      return;
    }

    if (!validatePaymentDates(currentOrderData)) {
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
      ...buildPaymentFields(currentOrderData),
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

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
        <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-blue-600">
            <div>
              <h3 className="text-xl font-bold text-white">
                {isEditMode ? `Edit order #${editingOrder.id}` : "Create order"}
              </h3>
            </div>

            <button
              type="button"
              onClick={handleModalClose}
              title="Close"
              className="p-2 rounded-lg text-white/90 hover:text-white hover:bg-white/20 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form
            onSubmit={handleSubmit(handleExistingOrderSubmit)}
            className="overflow-y-auto p-6 space-y-6"
          >
            {/* Top Form Fields: Customer + Order Date */}
            <div>
              <h4 className="text-base font-bold text-slate-800">
                Customer &amp; date
              </h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end -mt-3">
              {/* Column 1: Customer Type & Selector */}
              <div className="space-y-2">
                <Radio
                  label="Customer type"
                  name="customerType"
                  register={register}
                  error={errors.customerType}
                  options={
                    isEditMode
                      ? [{label: "Existing customer", value: "existing"}]
                      : [
                          {label: "Existing customer", value: "existing"},
                          {label: "New customer", value: "new"},
                        ]
                  }
                  rules={{
                    required: "Please select customer type",
                    onChange: () => setErrorMessage(""),
                  }}
                />

                {customerType === "existing" ? (
                  <Select
                    name="customerId"
                    register={register}
                    error={errors.customerId}
                    disabled={loadingCustomers}
                    placeholder={
                      loadingCustomers
                        ? "Loading customers..."
                        : "Select customer"
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
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      const currentOrderData = getValues();
                      if (
                        validateStockBeforeSubmit(currentOrderData.orderItems)
                      ) {
                        setIsNewCustomerModalOpen(true);
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-emerald-500 bg-emerald-50 text-emerald-700 font-semibold text-sm hover:bg-emerald-100 transition cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    Add new customer details
                  </button>
                )}
              </div>

              {/* Column 2: Order Date */}
              <div>
                <Input
                  label="Order date"
                  name="orderDate"
                  type="date"
                  register={register}
                  error={errors.orderDate}
                  required
                  rules={{
                    required: "Order date is required",
                  }}
                />
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Order Items Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-bold text-slate-800">
                    Order items
                  </h4>
                </div>
              </div>

              {/* Column Labels */}
              <div className="hidden md:grid grid-cols-12 gap-3 px-4 text-[13px] font-semibold text-slate-600 items-center">
                <span className="col-span-6">Product</span>
                <span className="col-span-3">Quantity</span>
                <span className="col-span-2">Discount %</span>
                <span className="col-span-1 text-center">Remove</span>
              </div>

              {/* Order Items List */}
              {fields.map((field, index) => {
                const selectedProductId = watchedItems?.[index]?.productId;

                const selectedProduct = products.find(
                  (product) => String(product.id) === String(selectedProductId),
                );

                const quantity = Number(watchedItems?.[index]?.quantity || 1);
                const availableStock = getEffectiveStock(selectedProduct);

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
                    className={`p-4 rounded-xl border transition-all space-y-3 ${
                      isStockInsufficient
                        ? "border-red-300 bg-red-50/50"
                        : "border-slate-200 bg-white shadow-xs hover:border-slate-300"
                    }`}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                      {/* Product Select */}
                      <div className="md:col-span-6">
                        <Select
                          name={`orderItems.${index}.productId`}
                          register={register}
                          error={errors.orderItems?.[index]?.productId}
                          disabled={loadingProducts}
                          placeholder={
                            loadingProducts
                              ? "Loading products..."
                              : "Select product"
                          }
                          options={products.map((product) => ({
                            value: product.id,
                            label: `${product.productName} (${getEffectiveStock(
                              product,
                            )} in stock)`,
                            disabled: getEffectiveStock(product) <= 0,
                          }))}
                          rules={{
                            required: "Please select a product",
                            onChange: (event) => {
                              const product = products.find(
                                (p) =>
                                  String(p.id) === String(event.target.value),
                              );
                              if (product) {
                                const items = getValues("orderItems") || [];
                                const sameIndex = items.findIndex(
                                  (it, i) =>
                                    i !== index &&
                                    String(it.productId) === String(product.id),
                                );
                                if (sameIndex >= 0) {
                                  // Already in the order: add this line's quantity there.
                                  const addQty =
                                    Number(items[index]?.quantity) || 1;
                                  setValue(
                                    `orderItems.${sameIndex}.quantity`,
                                    (Number(items[sameIndex].quantity) || 0) +
                                      addQty,
                                  );
                                  // remove after RHF finishes handling this change event
                                  if (items.length > 1)
                                    setTimeout(() => remove(index), 0);
                                } else {
                                  setValue(
                                    `orderItems.${index}.customerDiscountPercentage`,
                                    0,
                                  );
                                }
                              }
                              setErrorMessage("");
                            },
                          }}
                        />
                      </div>

                      {/* Quantity Input */}
                      <div className="md:col-span-3">
                        <Input
                          name={`orderItems.${index}.quantity`}
                          type="number"
                          placeholder="Qty"
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

                      {/* Discount % Input */}
                      <div className="md:col-span-2">
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

                      {/* Line Item Remove Action */}
                      <div className="md:col-span-1 flex items-center justify-center">
                        {fields.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            title="Remove item"
                            className="flex h-9 w-9 items-center justify-center text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span
                            className="p-2 w-9 h-9"
                            aria-hidden="true"
                          />
                        )}
                      </div>
                    </div>

                    {/* Calculated Product Specs Bar */}
                    {selectedProduct && (
                      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-sm">
                        <div className="flex items-center gap-2 text-slate-500">
                          <Package className="w-3.5 h-3.5 text-blue-500" />
                          <span>Available: {availableStock}</span>
                          <span>•</span>
                          <span>
                            MRP: ₹
                            {Number(selectedProduct?.productMrp || 0).toFixed(
                              2,
                            )}
                          </span>
                          <span>•</span>
                          <span>Sell price: ₹{storePrice.toFixed(2)}</span>
                          {gstPercentage > 0 && (
                            <>
                              <span>•</span>
                              <span>GST: {gstPercentage}%</span>
                            </>
                          )}
                        </div>

                        <div className="font-bold text-blue-700 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full">
                          Line total: ₹
                          {lineTotal.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </div>
                      </div>
                    )}

                    {isStockInsufficient && (
                      <p className="text-sm text-red-600 font-medium">
                        Only {availableStock} units are available in stock.
                      </p>
                    )}
                  </div>
                );
              })}

              <button
                type="button"
                onClick={() =>
                  append({
                    productId: "",
                    quantity: 1,
                    customerDiscountPercentage: 0,
                  })
                }
                className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-blue-300 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Add another item
              </button>
            </div>

            <hr className="border-slate-100" />

            {/* Below Order Items: Paid / Unpaid, then Payment Date + Order Status on the same line */}
            <div className="space-y-4">
              <div>
                <h4 className="text-base font-bold text-slate-800">
                  Payment &amp; status
                </h4>
              </div>
              <Radio
                label="Payment"
                name="paymentStatus"
                register={register}
                error={errors.paymentStatus}
                options={[
                  {label: "Paid", value: "PAID"},
                  {label: "Unpaid", value: "UNPAID"},
                ]}
                rules={{
                  required: "Please select payment status",
                  onChange: () => {
                    // Clear the other date when switching
                    setValue("paymentDueDate", "");
                    setValue("paymentPaidDate", "");
                    setErrorMessage("");
                  },
                }}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {/* Left: Payment date (Paid Date / Due Date) */}
                <div>
                  {paymentStatus === "PAID" ? (
                    <Input
                      label="Paid date"
                      name="paymentPaidDate"
                      type="date"
                      register={register}
                      error={errors.paymentPaidDate}
                      required
                      rules={{
                        required: "Payment paid date is required",
                        validate: (value, formValues) =>
                          !value ||
                          !formValues.orderDate ||
                          value >= formValues.orderDate ||
                          "Paid date cannot be before order date",
                      }}
                    />
                  ) : (
                    <Input
                      label="Due date"
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
                  )}
                </div>

                {/* Right: Order Status */}
                <div>
                  <Select
                    label="Order status"
                    name="status"
                    register={register}
                    error={errors.status}
                    options={
                      isEditMode
                        ? [
                            {label: "Pending", value: "PENDING"},
                            {label: "Confirmed", value: "CONFIRMED"},
                            {label: "Cancelled", value: "CANCELLED"},
                          ]
                        : [
                            {label: "Pending", value: "PENDING"},
                            {label: "Confirmed", value: "CONFIRMED"},
                          ]
                    }
                  />
                </div>
              </div>
            </div>

            {/* Financial Summary (same card design as the list pages) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <StatCard
                label="Subtotal"
                value={`₹${overallTotals.subtotal.toFixed(2)}`}
                tone="slate"
              />
              <StatCard
                label="Discount"
                value={`-₹${overallTotals.totalDiscount.toFixed(2)}`}
                tone="emerald"
              />
              <StatCard
                label="GST"
                value={`+₹${overallTotals.totalGst.toFixed(2)}`}
                tone="violet"
              />
              <StatCard
                label="Grand total"
                value={`₹${overallTotals.grandTotal.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`}
                tone="blue"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleModalClose}
                disabled={isSubmitting}
                className="h-10 px-5 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50 transition cursor-pointer"
              >
                Cancel
              </button>

              {customerType === "existing" ? (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-10 px-6 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition cursor-pointer shadow-sm"
                >
                  {isSubmitting
                    ? isEditMode
                      ? "Updating..."
                      : "Creating..."
                    : isEditMode
                      ? "Update order"
                      : "Create order"}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    const currentOrderData = getValues();
                    if (
                      validateStockBeforeSubmit(currentOrderData.orderItems) &&
                      validatePaymentDates(currentOrderData)
                    ) {
                      setIsNewCustomerModalOpen(true);
                    }
                  }}
                  className="h-10 px-6 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition cursor-pointer shadow-sm"
                >
                  Continue to add customer
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
