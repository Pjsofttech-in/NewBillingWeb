import {useEffect} from "react";
import {useForm} from "react-hook-form";
import {Package, Truck, X} from "lucide-react";
import Input from "../../Components/Form/Input";
import Select from "../../Components/Form/Select";

const SHIPMENT_STATUSES = [
  "PREPARING",
  "SHIPPED",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
];

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
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: {errors},
  } = useForm({
    defaultValues: {
      orderId: "",
      shipmentName: "",
      trackingId: "",
      shippedById: "",
      trackingLink: "",
      shipmentAddress: "",
      companyName: "",
      customerName: "",
      customerMobile: "",
      customerAddress: "",
      status: "PREPARING",
      shipmentDate: new Date().toISOString().split("T")[0],
    },
  });

  const selectedOrderId = watch("orderId");
  const selectedShippedById = watch("shippedById");
  const lockedOrderId = preselectedOrderId || "";
  const effectiveOrder =
    selectedOrder ||
    orders.find((o) => String(o.id) === String(selectedOrderId));

  // Dynamically fetch Courier / Company Name + Tracking Link from the selected "Shipped By"
  useEffect(() => {
    if (!selectedShippedById) return;
    const shippedBy = shippedByList.find(
      (item) => String(item.id) === String(selectedShippedById),
    );
    if (shippedBy) {
      setValue("companyName", shippedBy.companyName || "");
      setValue("trackingLink", shippedBy.trackingLink || "");
    }
  }, [selectedShippedById, shippedByList, setValue]);

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
      if (!watch("shipmentName"))
        setValue("shipmentName", `Order #${order.id} Shipment`);
    }
  }, [
    isOpen,
    preselectedOrderId,
    selectedOrderId,
    selectedOrder,
    orders,
    setValue,
  ]);

  useEffect(() => {
    if (!isOpen) reset();
  }, [isOpen, reset]);

  if (!isOpen) return null;

  const submit = async (data) => {
    await onSubmit({
      order: {id: Number(data.orderId)},
      shipmentName: data.shipmentName,
      trackingId: data.trackingId || undefined,
      shippedBy: data.shippedById ? {id: Number(data.shippedById)} : undefined,
      trackingLink: data.trackingLink || undefined,
      shipmentAddress: data.shipmentAddress,
      shipmentDate: data.shipmentDate || undefined,
      companyName: data.companyName || undefined,
      customerName: data.customerName,
      customerMobile: data.customerMobile,
      customerAddress: data.customerAddress,
      status: data.status,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 backdrop-blur-xs">
      {/* Modal Container with increased max-width */}
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Blue Header */}
        <div className="flex items-center justify-between bg-blue-600 px-6 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-white/20 p-2 text-white">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold leading-tight">
                Create Shipment
              </h3>
              <p className="text-xs text-blue-100">
                Dispatch and manage order shipping details
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-blue-100 transition hover:bg-white/20 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit(submit)}
          className="flex-1 space-y-5 overflow-y-auto p-6"
        >
          <input
            type="hidden"
            {...register("companyName")}
          />

          {selectedOrderError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-medium text-red-700">
              The selected order could not be loaded. Please try again.
            </div>
          )}

          {/* Selected Order Summary Banner */}
          {effectiveOrder && (
            <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4">
              <div className="mb-2 flex items-center gap-2 text-blue-900">
                <Package className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-bold uppercase tracking-wide">
                  Order Summary #{effectiveOrder.id}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2 text-xs text-slate-700 sm:grid-cols-3">
                <div className="rounded-md bg-white p-2 border border-blue-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                    Customer
                  </span>
                  <span className="font-semibold text-slate-800">
                    {effectiveOrder.customer?.customerName || "N/A"}
                  </span>
                </div>
                <div className="rounded-md bg-white p-2 border border-blue-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                    Phone
                  </span>
                  <span className="font-semibold text-slate-800">
                    {effectiveOrder.customer?.phone || "N/A"}
                  </span>
                </div>
                <div className="rounded-md bg-white p-2 border border-blue-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                    Total Amount
                  </span>
                  <span className="font-bold text-blue-700">
                    ₹{Number(effectiveOrder.totalAmount || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 3 Columns Layout Grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Select
              label="Order"
              name="orderId"
              register={register}
              rules={{required: "Please select an order to ship"}}
              error={errors.orderId}
              required
              disabled={Boolean(lockedOrderId) || loadingOrders}
              placeholder={
                loadingOrders ? "Loading orders..." : "Select an order"
              }
              options={orders.map((o) => ({
                value: o.id,
                label: `#${o.id} — ${o.customer?.customerName || "N/A"} (₹${Number(
                  o.totalAmount || 0,
                ).toFixed(2)})`,
              }))}
            />

            <Select
              label="Shipment Status"
              name="status"
              register={register}
              rules={{required: "Status is required"}}
              error={errors.status}
              required
              options={SHIPMENT_STATUSES.map((s) => ({
                value: s,
                label: s.replace("_", " "),
              }))}
            />

            <Input
              label="Shipment Date"
              name="shipmentDate"
              type="date"
              register={register}
              rules={{required: "Shipment date is required"}}
              error={errors.shipmentDate}
              required
            />

            <Input
              label="Shipment Name"
              name="shipmentName"
              placeholder="e.g. Order dispatch"
              register={register}
              rules={{required: "Shipment name is required"}}
              error={errors.shipmentName}
              required
            />

            <Select
              label="Courier / Company Name"
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
              label="Tracking ID"
              name="trackingId"
              placeholder="e.g. TRK123456789"
              register={register}
            />

            <Input
              label="Tracking Link"
              name="trackingLink"
              placeholder="Auto-filled from courier"
              register={register}
              disabled
              className="bg-slate-50 text-slate-500"
            />

            <Input
              label="Customer Name"
              name="customerName"
              placeholder="Customer name"
              register={register}
              rules={{required: "Customer name is required"}}
              error={errors.customerName}
              required
            />

            <Input
              label="Customer Mobile"
              name="customerMobile"
              placeholder="9876543210"
              register={register}
              rules={{required: "Customer mobile is required"}}
              error={errors.customerMobile}
              required
            />
          </div>

          {/* Addresses - Full width or 2 column split */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Customer Address"
              name="customerAddress"
              placeholder="Full delivery address"
              register={register}
              rules={{required: "Customer address is required"}}
              error={errors.customerAddress}
              required
            />

            <Input
              label="Shipment Address (Dispatch To)"
              name="shipmentAddress"
              placeholder="Address the shipment is being sent to"
              register={register}
              rules={{required: "Shipment address is required"}}
              error={errors.shipmentAddress}
              required
            />
          </div>

          {/* Modal Footer Actions */}
          <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || selectedOrderError}
              className="rounded-lg bg-blue-600 px-6 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Create Shipment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShipmentModal;
