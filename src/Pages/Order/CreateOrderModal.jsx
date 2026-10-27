import {useEffect, useState} from "react";
import {useForm, useFieldArray, useWatch} from "react-hook-form";
import {useQuery} from "@tanstack/react-query";
import {X, Plus, Trash2, AlertCircle, UserPlus} from "lucide-react";

import CustomerModal from "../Settings/Customer/CustomerModal";
import Input from "../../Components/Form/Input";
import Select from "../../Components/Form/Select";
import Radio from "../../Components/Form/Radio";
import StatCard from "./StatCard";
import {fetchPaymentReceivingAccounts} from "../../api/storeSettingsApi";

const calcLine = (product, qtyRaw, extraRaw) => {
  const qty = Math.max(0, Number(qtyRaw) || 0);
  const sell = Number(product?.customerPrice || product?.price || 0);
  const mrp = Number(product?.productMrp || 0);
  const extraPct = Math.max(0, Math.min(100, Number(extraRaw) || 0));
  const gstPct = product?.gstApplicable
    ? Number(product?.totalGstPercentage || product?.gstPercentage || 0)
    : 0;

  const sellTotal = sell * qty;
  const mrpTotal = Math.max(mrp, sell) * qty;
  const mrpDiscount = mrpTotal - sellTotal;
  const extraDiscount = (sellTotal * extraPct) / 100;
  const taxable = Math.max(0, sellTotal - extraDiscount);
  const gst = (taxable * gstPct) / 100;

  return {
    qty,
    sell,
    mrp,
    extraPct,
    gstPct,
    sellTotal,
    mrpTotal,
    mrpDiscount,
    extraDiscount,
    totalDiscount: mrpDiscount + extraDiscount,
    taxable,
    gst,
    total: taxable + gst,
  };
};

const rupees = (value, digits = 0) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`;

const DEFAULT_VALUES = {
  customerType: "existing",
  customerId: "",
  orderDate: new Date().toISOString().split("T")[0],
  paymentStatus: "INSTALLMENT",
  paymentDueDate: "",
  paymentPaidDate: "",
  paymentMethod: "CASH",
  receivingAccountId: "",
  transactionReference: "",
  status: "PENDING",
  orderItems: [
    {
      productId: "",
      quantity: 1,
      customerDiscountPercentage: 0,
    },
  ],
};

const PAYMENT_METHOD_OPTIONS = [
  {label: "Cash", value: "CASH"},
  {label: "UPI", value: "UPI"},
  {label: "Credit Card", value: "CREDIT_CARD"},
  {label: "Debit Card", value: "DEBIT_CARD"},
  {label: "Net Banking", value: "NET_BANKING"},
];

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
  } = useForm({defaultValues: DEFAULT_VALUES});

  const {fields, insert, remove} = useFieldArray({
    control,
    name: "orderItems",
  });

  const watchedItems = useWatch({control, name: "orderItems"});
  const isEditMode = Boolean(editingOrder?.id);
  const customerType = useWatch({control, name: "customerType"});
  const paymentStatus = useWatch({control, name: "paymentStatus"});
  const paymentMethod = useWatch({control, name: "paymentMethod"});
  const isCashPayment = paymentMethod === "CASH";

  const {data: receivingAccounts = []} = useQuery({
    queryKey: ["paymentReceivingAccounts"],
    queryFn: fetchPaymentReceivingAccounts,
    enabled: isOpen && !isCashPayment,
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
        (editingOrder.pendingAmount != null &&
          Number(editingOrder.pendingAmount) <= 0.009 &&
          Number(editingOrder.paidAmount || 0) > 0);

      reset({
        customerType: "existing",
        customerId: editingOrder.customer?.id
          ? String(editingOrder.customer.id)
          : "",
        orderDate: String(editingOrder.orderDate || "").slice(0, 10),
        paymentStatus: isPaid ? "COMPLETE" : "INSTALLMENT",
        paymentDueDate: editingOrder.paymentDueDate
          ? String(editingOrder.paymentDueDate).slice(0, 10)
          : "",
        paymentPaidDate: editingOrder.paymentPaidDate
          ? String(editingOrder.paymentPaidDate).slice(0, 10)
          : "",
        paymentMethod: "CASH",
        receivingAccountId: "",
        transactionReference: "",
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

  const getOriginalQuantity = (productId) =>
    isEditMode
      ? Number(
          (editingOrder?.orderItems || [])
            .filter((i) => String(i.product?.id) === String(productId))
            .reduce((s, i) => s + Number(i.quantity || 0), 0),
        )
      : 0;

  const getEffectiveStock = (product) =>
    product ? Number(product.stock ?? 0) + getOriginalQuantity(product.id) : 0;

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
      const qty = Number(item.quantity) || 0;
      if (!product) {
        setErrorMessage(`Select product for item #${i + 1}`);
        return false;
      }
      const stock = getEffectiveStock(product);
      if (stock <= 0) {
        setErrorMessage(`"${product.productName}" out of stock`);
        return false;
      }
      if (qty <= 0) {
        setErrorMessage(`Enter quantity for item #${i + 1}`);
        return false;
      }
      if (qty > stock) {
        setErrorMessage(`Only ${stock} left for "${product.productName}"`);
        return false;
      }
    }
    return true;
  };

  const formatOrderItems = (rawItems) =>
    rawItems.map((item) => ({
      product: {id: Number(item.productId)},
      quantity: Number(item.quantity),
      customerDiscountPercentage: Number(item.customerDiscountPercentage || 0),
    }));

  const resolveStatus = (data) => {
    if (isEditMode) return data.status;
    return data.paymentStatus === "COMPLETE" ? "CONFIRMED" : "PENDING";
  };

  const buildPaymentFields = (data) => ({
    paymentDueDate: data.paymentDueDate || null,
    installmentRequested: !isEditMode && data.paymentStatus === "INSTALLMENT",
  });

  const buildPaymentInfo = (data) => {
    if (isEditMode) return null;
    if (data.paymentStatus === "COMPLETE") {
      const isCash = data.paymentMethod === "CASH";
      return {
        mode: "PAID",
        paidDate: data.paymentPaidDate,
        method: data.paymentMethod,
        receivingAccountId: isCash ? null : data.receivingAccountId || null,
        transactionReference: isCash
          ? null
          : String(data.transactionReference || "").trim() || null,
      };
    }
    return {mode: "INSTALLMENT"};
  };

  const validatePaymentDates = (data) => {
    if (!isEditMode && data.paymentStatus === "COMPLETE") {
      if (!data.paymentMethod) {
        setErrorMessage("Select payment method");
        return false;
      }
      if (!data.paymentPaidDate) {
        setErrorMessage("Select paid date");
        return false;
      }
      if (data.orderDate && data.paymentPaidDate < data.orderDate) {
        setErrorMessage("Paid date cannot be before order date");
        return false;
      }
    }
    return true;
  };

  const calculateOverallTotals = () => {
    const totals = {
      mrpTotal: 0,
      mrpDiscount: 0,
      extraDiscount: 0,
      totalDiscount: 0,
      taxable: 0,
      totalGst: 0,
      grandTotal: 0,
    };

    (watchedItems || []).forEach((item) => {
      const product = products.find(
        (p) => String(p.id) === String(item?.productId),
      );
      if (!product) return;

      const line = calcLine(
        product,
        item.quantity,
        item.customerDiscountPercentage,
      );
      totals.mrpTotal += line.mrpTotal;
      totals.mrpDiscount += line.mrpDiscount;
      totals.extraDiscount += line.extraDiscount;
      totals.totalDiscount += line.totalDiscount;
      totals.taxable += line.taxable;
      totals.totalGst += line.gst;
      totals.grandTotal += line.total;
    });

    return totals;
  };

  const overallTotals = calculateOverallTotals();

  const handleExistingOrderSubmit = async (data) => {
    setErrorMessage("");
    const isCancelling = isEditMode && data.status === "CANCELLED";
    data = {...data, orderItems: mergeDuplicateItems(data.orderItems)};

    if (
      !validateStockBeforeSubmit(data.orderItems, {
        skipForCancellation: isCancelling,
      })
    )
      return;
    if (customerType === "existing" && !data.customerId) {
      setErrorMessage("Select a customer");
      return;
    }
    if (!validatePaymentDates(data)) return;

    try {
      await onSubmitOrder(
        {
          orderDate: data.orderDate,
          ...buildPaymentFields(data),
          status: resolveStatus(data),
          customer: {id: Number(data.customerId)},
          orderItems: formatOrderItems(data.orderItems),
        },
        false,
        null,
        isEditMode ? editingOrder.id : null,
        buildPaymentInfo(data),
      );
    } catch (error) {
      setErrorMessage(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to create order",
      );
    }
  };

  const handleNewCustomerCreate = async (formData) => {
    if (isEditMode) {
      setErrorMessage("Cannot add new customer while editing");
      return;
    }
    setErrorMessage("");
    const current = getValues();
    current.orderItems = mergeDuplicateItems(current.orderItems);

    if (!validateStockBeforeSubmit(current.orderItems)) {
      setIsNewCustomerModalOpen(false);
      return;
    }
    if (!validatePaymentDates(current)) {
      setIsNewCustomerModalOpen(false);
      return;
    }

    try {
      setIsNewCustomerModalOpen(false);
      await onSubmitOrder(
        {
          orderDate: current.orderDate,
          ...buildPaymentFields(current),
          status: resolveStatus(current),
          orderItems: formatOrderItems(current.orderItems),
        },
        true,
        {
          customerName: formData.customerName,
          landmark: formData.landmark,
          city: formData.city,
          taluka: formData.taluka,
          pincode: formData.pincode,
          email: formData.email,
          phone: formData.phone,
          state: formData.state,
        },
        null,
        buildPaymentInfo(current),
      );
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3">
        <div className="flex max-h-[95vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between bg-blue-600 px-5 py-3">
            <h2 className="text-lg font-semibold text-white">
              {isEditMode ? `Edit Order #${editingOrder.id}` : "Create Order"}
            </h2>
            <button
              type="button"
              onClick={handleModalClose}
              className="rounded-full p-1 text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {errorMessage && (
            <div className="mx-5 mt-3 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="h-4 w-4" />
              {errorMessage}
            </div>
          )}

          <form
            onSubmit={handleSubmit(handleExistingOrderSubmit)}
            className="flex-1 space-y-5 overflow-y-auto p-5"
          >
            {/* ========== Customer + Order Date (same line) ========== */}
            <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-12">
              {/* Customer Type + Select */}
              <div className="md:col-span-8">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <div className="sm:w-40">
                    <Radio
                      label="Customer"
                      name="customerType"
                      register={register}
                      error={errors.customerType}
                      options={
                        isEditMode
                          ? [{label: "Existing", value: "existing"}]
                          : [
                              {label: "Existing", value: "existing"},
                              {label: "New", value: "new"},
                            ]
                      }
                      rules={{
                        required: "Required",
                        onChange: () => setErrorMessage(""),
                      }}
                    />
                  </div>

                  <div className="flex-1">
                    {customerType === "existing" ? (
                      <Select
                        name="customerId"
                        register={register}
                        error={errors.customerId}
                        disabled={loadingCustomers}
                        placeholder={
                          loadingCustomers ? "Loading..." : "Select customer"
                        }
                        options={customers.map((c) => ({
                          value: c.id,
                          label: `${c.customerName}${c.city ? ` (${c.city})` : ""}`,
                        }))}
                        rules={{required: "Select customer"}}
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            validateStockBeforeSubmit(getValues().orderItems)
                          ) {
                            setIsNewCustomerModalOpen(true);
                          }
                        }}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-emerald-400 bg-emerald-50 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
                      >
                        <UserPlus className="h-4 w-4" />
                        Add New Customer
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Date – same line */}
              <div className="md:col-span-4">
                <Input
                  label="Order Date"
                  name="orderDate"
                  type="date"
                  register={register}
                  error={errors.orderDate}
                  required
                  rules={{required: "Required"}}
                />
              </div>
            </div>

            {/* ========== PRODUCTS ========== */}
            <div className="rounded-xl border border-slate-200">
              {/* Column headers */}
              <div className="hidden grid-cols-12 gap-2 border-b bg-slate-50 px-4 py-2.5 text-[11px] font-semibold uppercase text-slate-500 md:grid">
                <div className="col-span-1 text-center">Sr</div>
                <div className="col-span-3">Product</div>
                <div className="col-span-1 text-center">Qty</div>
                <div className="col-span-1 text-center">MRP</div>
                <div className="col-span-1 text-center">Sell</div>
                <div className="col-span-1 text-center">Extra %</div>
                <div className="col-span-2 text-center">Total</div>
                <div className="col-span-2 text-center">Action</div>
              </div>

              {/* Products list */}
              <div className="divide-y divide-slate-100">
                {fields.map((field, index) => {
                  const pid = watchedItems?.[index]?.productId;
                  const product = products.find(
                    (p) => String(p.id) === String(pid),
                  );
                  const qty = Number(watchedItems?.[index]?.quantity || 1);
                  const stock = getEffectiveStock(product);
                  const lowStock = product && qty > stock;

                  const line = calcLine(
                    product,
                    qty,
                    watchedItems?.[index]?.customerDiscountPercentage,
                  );
                  const {
                    sell,
                    mrp,
                    extraPct,
                    gstPct,
                    mrpDiscount,
                    extraDiscount: extraAmt,
                    totalDiscount: totalSave,
                    total,
                  } = line;
                  const mrpOff = product ? Math.max(0, mrp - sell) : 0; // per unit
                  const mrpOffPct = mrp > 0 ? (mrpOff / mrp) * 100 : 0;
                  const totalSavePct =
                    line.mrpTotal > 0 ? (totalSave / line.mrpTotal) * 100 : 0;

                  return (
                    <div
                      key={field.id}
                      className={`px-4 py-3 ${lowStock ? "bg-red-50/40" : ""}`}
                    >
                      <div className="grid grid-cols-1 items-center gap-2 md:grid-cols-12">
                        {/* Sr No */}
                        <div className="md:col-span-1">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-700">
                            {index + 1}
                          </div>
                        </div>

                        {/* Product */}
                        <div className="md:col-span-3">
                          <Select
                            name={`orderItems.${index}.productId`}
                            register={register}
                            error={errors.orderItems?.[index]?.productId}
                            disabled={loadingProducts}
                            placeholder={
                              loadingProducts ? "Loading..." : "Select product"
                            }
                            options={products.map((p) => ({
                              value: p.id,
                              label: p.productName,
                              disabled: getEffectiveStock(p) <= 0,
                            }))}
                            rules={{
                              required: "Required",
                              onChange: (e) => {
                                const p = products.find(
                                  (x) =>
                                    String(x.id) === String(e.target.value),
                                );
                                if (p) {
                                  const items = getValues("orderItems") || [];
                                  const same = items.findIndex(
                                    (it, i) =>
                                      i !== index &&
                                      String(it.productId) === String(p.id),
                                  );
                                  if (same >= 0) {
                                    const add =
                                      Number(items[index]?.quantity) || 1;
                                    setValue(
                                      `orderItems.${same}.quantity`,
                                      (Number(items[same].quantity) || 0) + add,
                                    );
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

                        {/* Qty */}
                        <div className="md:col-span-1">
                          <Input
                            name={`orderItems.${index}.quantity`}
                            type="number"
                            register={register}
                            error={errors.orderItems?.[index]?.quantity}
                            className={lowStock ? "border-red-400" : ""}
                            rules={{
                              required: "Req",
                              min: {value: 1, message: "Min 1"},
                              max:
                                stock > 0
                                  ? {value: stock, message: `Max ${stock}`}
                                  : undefined,
                            }}
                          />
                        </div>

                        {/* MRP */}
                        <div className="md:col-span-1">
                          <div className="rounded border border-slate-200 bg-slate-50 px-2 py-1.5 text-center text-sm">
                            {product ? `₹${mrp.toFixed(0)}` : "—"}
                          </div>
                        </div>

                        {/* Sell */}
                        <div className="md:col-span-1">
                          <div className="rounded border border-slate-200 bg-slate-50 px-2 py-1.5 text-center text-sm">
                            {product ? `₹${sell.toFixed(0)}` : "—"}
                          </div>
                        </div>

                        {/* Extra % */}
                        <div className="md:col-span-1">
                          <Input
                            name={`orderItems.${index}.customerDiscountPercentage`}
                            type="number"
                            register={register}
                            error={
                              errors.orderItems?.[index]
                                ?.customerDiscountPercentage
                            }
                            rules={{
                              min: {value: 0, message: "0"},
                              max: {value: 100, message: "100"},
                            }}
                          />
                        </div>

                        {/* Total */}
                        <div className="md:col-span-2">
                          <div className="rounded border border-blue-200 bg-blue-50 px-2 py-1.5 text-center text-sm font-bold text-blue-700">
                            {product
                              ? `₹${total.toLocaleString("en-IN", {
                                  maximumFractionDigits: 0,
                                })}`
                              : "—"}
                          </div>
                        </div>

                        {/* Action = Delete + Add */}
                        <div className="flex items-center justify-center gap-1 md:col-span-2">
                          {fields.length > 1 && (
                            <button
                              type="button"
                              onClick={() => remove(index)}
                              className="rounded-lg bg-red-50 p-2 text-red-500 hover:bg-red-100"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              insert(index + 1, {
                                productId: "",
                                quantity: 1,
                                customerDiscountPercentage: 0,
                              })
                            }
                            className="rounded-lg bg-blue-50 p-2 text-blue-600 hover:bg-blue-100"
                            title="Add product"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Info line */}
                      {product && (
                        <div className="mt-1.5 flex flex-wrap gap-x-4 pl-10 text-[11px] text-slate-500">
                          <span>
                            Stock: <b>{stock}</b>
                          </span>
                          {mrpDiscount > 0 && (
                            <span className="text-emerald-600">
                              MRP off {rupees(mrpOff)}/unit ={" "}
                              {rupees(mrpDiscount)} ({mrpOffPct.toFixed(1)}%)
                            </span>
                          )}
                          {extraAmt > 0 && (
                            <span className="text-amber-600">
                              Extra {extraPct}% = {rupees(extraAmt)}
                            </span>
                          )}
                          {totalSave > 0 && (
                            <span className="font-semibold text-emerald-700">
                              Total discount {rupees(totalSave)} (
                              {totalSavePct.toFixed(1)}%)
                            </span>
                          )}
                          {gstPct > 0 && <span>GST {gstPct}%</span>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ========== CALCULATIONS ========== */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              <StatCard
                label="MRP Total"
                value={rupees(overallTotals.mrpTotal)}
                tone="slate"
              />
              <StatCard
                label="MRP Discount"
                value={`-${rupees(overallTotals.mrpDiscount)}`}
                tone="emerald"
              />
              <StatCard
                label="Extra Discount"
                value={`-${rupees(overallTotals.extraDiscount)}`}
                tone="amber"
              />
              <StatCard
                label="Total Discount"
                value={`-${rupees(overallTotals.totalDiscount)}${
                  overallTotals.mrpTotal > 0
                    ? ` (${(
                        (overallTotals.totalDiscount / overallTotals.mrpTotal) *
                        100
                      ).toFixed(1)}%)`
                    : ""
                }`}
                tone="rose"
              />
              <StatCard
                label="GST"
                value={`+${rupees(overallTotals.totalGst)}`}
                tone="violet"
              />
              <StatCard
                label="Grand Total"
                value={rupees(overallTotals.grandTotal)}
                tone="blue"
              />
            </div>

            {/* ========== PAYMENT ========== */}
            <div className="rounded-xl border border-slate-200 p-4">
              <h3 className="mb-3 text-sm font-semibold text-slate-700">
                Payment
              </h3>

              <div
                className={`grid grid-cols-1 gap-3 ${
                  !isEditMode && paymentStatus === "COMPLETE"
                    ? "sm:grid-cols-2 lg:grid-cols-4"
                    : "sm:grid-cols-2"
                }`}
              >
                {!isEditMode && (
                  <Select
                    label="Payment Status"
                    name="paymentStatus"
                    register={register}
                    error={errors.paymentStatus}
                    options={[
                      {label: "Complete", value: "COMPLETE"},
                      {label: "Installment", value: "INSTALLMENT"},
                    ]}
                    rules={{
                      required: "Required",
                      onChange: () => {
                        setValue("paymentPaidDate", "");
                        setValue("paymentMethod", "CASH");
                        setValue("receivingAccountId", "");
                        setValue("transactionReference", "");
                        setErrorMessage("");
                      },
                    }}
                  />
                )}

                {!isEditMode && paymentStatus === "COMPLETE" && (
                  <>
                    <Input
                      label="Paid Date"
                      name="paymentPaidDate"
                      type="date"
                      register={register}
                      error={errors.paymentPaidDate}
                      required
                      rules={{
                        required: "Required",
                        validate: (v, f) =>
                          !v ||
                          !f.orderDate ||
                          v >= f.orderDate ||
                          "Before order date",
                      }}
                    />
                    <Select
                      label="Method"
                      name="paymentMethod"
                      register={register}
                      error={errors.paymentMethod}
                      options={PAYMENT_METHOD_OPTIONS}
                      rules={{
                        required: "Required",
                        onChange: (e) => {
                          if (e.target.value === "CASH") {
                            setValue("receivingAccountId", "");
                            setValue("transactionReference", "");
                          }
                          setErrorMessage("");
                        },
                      }}
                    />
                    {!isCashPayment && (
                      <Select
                        label="Account"
                        name="receivingAccountId"
                        register={register}
                        error={errors.receivingAccountId}
                        allowEmpty
                        placeholder="Optional"
                        options={receivingAccounts.map((a) => ({
                          value: a.id,
                          label: a.accountName || a.bankName,
                        }))}
                      />
                    )}
                  </>
                )}

                {isEditMode && (
                  <Select
                    label="Status"
                    name="status"
                    register={register}
                    error={errors.status}
                    options={[
                      {label: "Pending", value: "PENDING"},
                      {label: "Confirmed", value: "CONFIRMED"},
                      {label: "Cancelled", value: "CANCELLED"},
                    ]}
                  />
                )}
              </div>

              {!isEditMode &&
                paymentStatus === "COMPLETE" &&
                !isCashPayment && (
                  <div className="mt-3 max-w-sm">
                    <Input
                      label="Transaction ID"
                      name="transactionReference"
                      placeholder="UTR / Cheque"
                      register={register}
                      error={errors.transactionReference}
                    />
                  </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 border-t pt-4">
              <button
                type="button"
                onClick={handleModalClose}
                disabled={isSubmitting}
                className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              {customerType === "existing" ? (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting
                    ? isEditMode
                      ? "Updating..."
                      : "Creating..."
                    : isEditMode
                      ? "Update Order"
                      : "Create Order"}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    const d = getValues();
                    if (
                      validateStockBeforeSubmit(d.orderItems) &&
                      validatePaymentDates(d)
                    ) {
                      setIsNewCustomerModalOpen(true);
                    }
                  }}
                  className="rounded-lg bg-emerald-600 px-6 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  Continue
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

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
