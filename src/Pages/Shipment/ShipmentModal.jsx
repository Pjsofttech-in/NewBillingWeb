import {useEffect} from "react";
import {Controller, useForm, useWatch} from "react-hook-form";
import {Truck, X} from "lucide-react";
import Input from "../../Components/Form/Input";
import Select from "../../Components/Form/Select";
import SearchableSelect from "../../Components/Form/SearchableSelect";

const SHIPMENT_STATUSES = [
  "PREPARING",
  "SHIPPED",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
];

// Checked colour of each status pill (full class names so Tailwind can detect them).
const STATUS_PILLS = {
  PREPARING:
    "peer-checked:border-slate-600 peer-checked:bg-slate-600 peer-checked:text-white",
  SHIPPED:
    "peer-checked:border-blue-600 peer-checked:bg-blue-600 peer-checked:text-white",
  IN_TRANSIT:
    "peer-checked:border-indigo-600 peer-checked:bg-indigo-600 peer-checked:text-white",
  OUT_FOR_DELIVERY:
    "peer-checked:border-amber-500 peer-checked:bg-amber-500 peer-checked:text-white",
  DELIVERED:
    "peer-checked:border-emerald-600 peer-checked:bg-emerald-600 peer-checked:text-white",
  CANCELLED:
    "peer-checked:border-red-600 peer-checked:bg-red-600 peer-checked:text-white",
};

const buildAddress = (customer) =>
  [
    customer?.landmark,
    customer?.city,
    customer?.taluka,
    customer?.state,
    customer?.pincode,
  ]
    .filter(Boolean)
    .join(", ");

const orderLabel = (o) =>
  `#${o.id} — ${o.customer?.customerName || "N/A"} (₹${Number(
    o.totalAmount || 0,
  ).toFixed(2)})`;

const ShipmentModal = ({
  isOpen,
  onClose,
  onSubmit,
  orders = [],
  shippedByList = [],
  loadingShippedBy = false,
  selectedOrder,
  preselectedOrderId,
  loadingOrders = false,
  selectedOrderError = false,
  isSubmitting = false,
}) => {
  const {
    register,
    control,
    handleSubmit,
    getValues,
    reset,
    setValue,
    formState: {errors},
  } = useForm({
    defaultValues: {
      orderId: "",
      shipmentName: "",
      trackingId: "",
      shippedById: "",
      shipmentCost: "",
      employeeName: "",
      shipmentAddress: "",
      customerName: "",
      customerMobile: "",
      customerAddress: "",
      status: "PREPARING",
      shipmentDate: new Date().toISOString().split("T")[0],
    },
  });

  const selectedOrderId = useWatch({control, name: "orderId"});
  const lockedOrderId = preselectedOrderId || "";
  const effectiveOrder =
    selectedOrder ||
    orders.find((o) => String(o.id) === String(selectedOrderId));

  // Options for the searchable order dropdown. If the order opened from the
  // orders page is not in the list yet, it is added so its name still shows.
  const orderOptions = orders.map((o) => ({
    value: String(o.id),
    label: orderLabel(o),
  }));
  if (
    effectiveOrder &&
    !orders.some((o) => String(o.id) === String(effectiveOrder.id))
  ) {
    orderOptions.unshift({
      value: String(effectiveOrder.id),
      label: orderLabel(effectiveOrder),
    });
  }

  useEffect(() => {
    if (!isOpen) return;
    const orderId = preselectedOrderId || selectedOrderId;
    if (
      preselectedOrderId &&
      String(selectedOrderId) !== String(preselectedOrderId)
    ) {
      setValue("orderId", String(preselectedOrderId));
    }
    const order =
      selectedOrder || orders.find((o) => String(o.id) === String(orderId));
    if (order?.customer) {
      const address = buildAddress(order.customer);
      setValue("customerName", order.customer.customerName || "");
      setValue("customerMobile", order.customer.phone || "");
      setValue("customerAddress", address);
      setValue("shipmentAddress", address);
      if (!getValues("shipmentName"))
        setValue("shipmentName", `Order #${order.id} Shipment`);
    }
  }, [
    isOpen,
    preselectedOrderId,
    selectedOrderId,
    selectedOrder,
    orders,
    setValue,
    getValues,
  ]);

  useEffect(() => {
    if (!isOpen) reset();
  }, [isOpen, reset]);

  // Escape closes (not while saving) + lock page scroll while open.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape" && !isSubmitting) onClose?.();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const submit = async (data) => {
    await onSubmit({
      order: {id: Number(data.orderId)},
      shipmentName: data.shipmentName,
      trackingId: data.trackingId || undefined,
      shippedBy: data.shippedById ? {id: Number(data.shippedById)} : undefined,
      shipmentCost: Number(data.shipmentCost) || 0,
      employeeName: data.employeeName?.trim(),
      shipmentAddress: data.shipmentAddress,
      shipmentDate: data.shipmentDate || undefined,
      customerName: data.customerName,
      customerMobile: data.customerMobile,
      customerAddress: data.customerAddress,
      status: data.status,
    });
  };

  const orderLocked = Boolean(lockedOrderId) || loadingOrders;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-0 backdrop-blur-xs sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Create shipment"
        className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:max-h-[92vh] sm:rounded-2xl"
      >
        {/* ============ HEADER ============ */}
        <div className="flex shrink-0 items-center justify-between gap-3 bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-3 text-white sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-white/20 p-2">
              <Truck className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold sm:text-lg">Create shipment</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-blue-100 transition hover:bg-white/20 hover:text-white disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ============ FORM ============ */}
        <form
          onSubmit={handleSubmit(submit)}
          className="flex min-h-0 flex-1 flex-col"
        >
          {/* Scrollable body */}
          <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
            {selectedOrderError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                The selected order could not be loaded. Close this window and
                try again.
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Order: reusable searchable dropdown */}
              <div>
                <Controller
                  name="orderId"
                  control={control}
                  rules={{required: "Please select an order to ship"}}
                  render={({field}) => (
                    <div
                      className={
                        orderLocked ? "pointer-events-none opacity-60" : ""
                      }
                    >
                      <SearchableSelect
                        label={
                          <>
                            Order <span className="text-red-500">*</span>
                          </>
                        }
                        options={orderOptions}
                        value={field.value}
                        onChange={(val) =>
                          field.onChange(val === "" ? "" : String(val))
                        }
                        placeholder={
                          loadingOrders ? "Loading orders..." : "Search order"
                        }
                      />
                    </div>
                  )}
                />
                {errors.orderId && (
                  <p className="mt-1 text-xs font-medium text-red-600">
                    {errors.orderId.message}
                  </p>
                )}
              </div>

              <Input
                label="Shipment name"
                name="shipmentName"
                placeholder="e.g. Order dispatch"
                register={register}
                rules={{required: "Shipment name is required"}}
                error={errors.shipmentName}
                required
              />

              <Input
                label="Shipment date"
                name="shipmentDate"
                type="date"
                register={register}
                rules={{required: "Shipment date is required"}}
                error={errors.shipmentDate}
                required
              />

              <Select
                label="Courier / company name"
                name="shippedById"
                register={register}
                rules={{required: "Please select a courier / company"}}
                error={errors.shippedById}
                required
                disabled={loadingShippedBy}
                placeholder={
                  loadingShippedBy
                    ? "Loading couriers..."
                    : "Select courier / company"
                }
                options={shippedByList.map((item) => ({
                  value: item.id,
                  label: item.companyName,
                }))}
              />

              <Input
                label="Tracking ID (optional)"
                name="trackingId"
                placeholder="Auto-generated if left empty"
                register={register}
              />

              <Input
                label="Shipment cost (₹)"
                name="shipmentCost"
                type="number"
                placeholder="Cost to send the parcel"
                register={register}
                rules={{
                  required: "Shipment cost is required",
                  min: {
                    value: 0,
                    message: "Shipment cost cannot be negative",
                  },
                }}
                error={errors.shipmentCost}
                required
              />

              <Input
                label="Shipped by employee"
                name="employeeName"
                placeholder="Employee who shipped the parcel"
                register={register}
                rules={{required: "Employee name is required"}}
                error={errors.employeeName}
                required
              />

              <Input
                label="Customer name"
                name="customerName"
                placeholder="Customer name"
                register={register}
                rules={{required: "Customer name is required"}}
                error={errors.customerName}
                required
              />

              <Input
                label="Customer mobile"
                name="customerMobile"
                placeholder="9876543210"
                register={register}
                rules={{required: "Customer mobile is required"}}
                error={errors.customerMobile}
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                label="Customer address"
                name="customerAddress"
                placeholder="Full delivery address"
                register={register}
                rules={{required: "Customer address is required"}}
                error={errors.customerAddress}
                required
              />

              <Input
                label="Shipment address (dispatch to)"
                name="shipmentAddress"
                placeholder="Address the shipment is being sent to"
                register={register}
                rules={{required: "Shipment address is required"}}
                error={errors.shipmentAddress}
                required
              />
            </div>

            {/* Status (last field of the form) */}
            <div>
              <p className="mb-1.5 text-xs font-semibold text-slate-600">
                Status
              </p>
              <div
                role="radiogroup"
                aria-label="Shipment status"
                className="flex flex-wrap gap-2"
              >
                {SHIPMENT_STATUSES.map((s) => (
                  <label
                    key={s}
                    className="cursor-pointer"
                  >
                    <input
                      type="radio"
                      value={s}
                      className="peer sr-only"
                      {...register("status", {required: "Status is required"})}
                    />
                    <span
                      className={`inline-flex items-center rounded-full border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 peer-focus-visible:ring-2 peer-focus-visible:ring-blue-300 ${STATUS_PILLS[s]}`}
                    >
                      {s.replaceAll("_", " ")}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Fixed footer (always visible) */}
          <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-slate-200 bg-white px-4 py-3 sm:px-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-9 cursor-pointer rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 active:scale-95 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || selectedOrderError}
              className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:from-blue-600 hover:to-blue-700 hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Truck className="h-4 w-4" />
              {isSubmitting ? "Creating..." : "Create shipment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShipmentModal;
