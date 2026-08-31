import {useEffect} from "react";
import {useForm} from "react-hook-form";
import {Package, Truck, X} from "lucide-react";
import Input from "../../Components/Form/Input";
import Select from "../../Components/Form/Select";

const SHIPMENT_STATUSES = ["PREPARING", "SHIPPED", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];

const buildAddress = (customer) => [
  customer?.landmark,
  customer?.city,
  customer?.taluka,
  customer?.state,
  customer?.pincode,
].filter(Boolean).join(", ");

const ShipmentModal = ({
  isOpen,
  onClose,
  onSubmit,
  orders = [],
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
  const lockedOrderId = preselectedOrderId || "";
  const effectiveOrder = selectedOrder || orders.find((o) => String(o.id) === String(selectedOrderId));

  useEffect(() => {
    if (!isOpen) return;
    const orderId = preselectedOrderId || selectedOrderId;
    if (preselectedOrderId && String(selectedOrderId) !== String(preselectedOrderId)) {
      setValue("orderId", String(preselectedOrderId));
    }
    const order = selectedOrder || orders.find((o) => String(o.id) === String(orderId));
    if (order?.customer) {
      const address = buildAddress(order.customer);
      setValue("customerName", order.customer.customerName || "");
      setValue("customerMobile", order.customer.phone || "");
      setValue("customerAddress", address);
      setValue("shipmentAddress", address);
      if (!watch("shipmentName")) setValue("shipmentName", `Order #${order.id} Shipment`);
    }
  }, [isOpen, preselectedOrderId, selectedOrderId, selectedOrder, orders, setValue]);

  useEffect(() => {
    if (!isOpen) reset();
  }, [isOpen, reset]);

  if (!isOpen) return null;

  const submit = async (data) => {
    await onSubmit({
      order: {id: Number(data.orderId)},
      shipmentName: data.shipmentName,
      trackingId: data.trackingId || undefined,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-2"><Truck className="h-5 w-5 text-[#0073b7]" /><h3 className="text-lg font-bold text-gray-800">Create Shipment</h3></div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-slate-200/60 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>

        <form onSubmit={handleSubmit(submit)} className="space-y-4 overflow-y-auto p-6">
          {selectedOrderError && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">The selected order could not be loaded.</div>}

          {effectiveOrder && (
            <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-indigo-800"><Package className="h-4 w-4" /><span className="font-bold">Shipping Order #{effectiveOrder.id}</span></div>
              <div className="grid grid-cols-1 gap-1 text-xs text-slate-700 sm:grid-cols-3">
                <span><b>Customer:</b> {effectiveOrder.customer?.customerName || "N/A"}</span>
                <span><b>Phone:</b> {effectiveOrder.customer?.phone || "N/A"}</span>
                <span><b>Total:</b> ₹{Number(effectiveOrder.totalAmount || 0).toFixed(2)}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Order"
              name="orderId"
              register={register}
              rules={{required: "Please select an order to ship"}}
              error={errors.orderId}
              required
              disabled={Boolean(lockedOrderId) || loadingOrders}
              placeholder={loadingOrders ? "Loading orders..." : "Select an order"}
              options={orders.map((o) => ({value: o.id, label: `#${o.id} — ${o.customer?.customerName || "N/A"} (₹${Number(o.totalAmount || 0).toFixed(2)})`}))}
            />
            <Select label="Shipment Status" name="status" register={register} rules={{required: "Status is required"}} error={errors.status} required options={SHIPMENT_STATUSES.map((s) => ({value: s, label: s}))} />
            <Input label="Shipment Date" name="shipmentDate" type="date" register={register} rules={{required: "Shipment date is required"}} error={errors.shipmentDate} required />
            <Input label="Shipment Name" name="shipmentName" placeholder="e.g. Order dispatch" register={register} rules={{required: "Shipment name is required"}} error={errors.shipmentName} required />
            <Input label="Courier / Company Name" name="companyName" placeholder="e.g. BlueDart, Delhivery" register={register} />
            <Input label="Tracking ID" name="trackingId" placeholder="e.g. TRK123456789" register={register} />
            <Input label="Tracking Link" name="trackingLink" placeholder="https://track.courier.com/..." register={register} />
            <Input label="Customer Name" name="customerName" placeholder="Customer name" register={register} rules={{required: "Customer name is required"}} error={errors.customerName} required />
            <Input label="Customer Mobile" name="customerMobile" placeholder="9876543210" register={register} rules={{required: "Customer mobile is required"}} error={errors.customerMobile} required />
          </div>
          <Input label="Customer Address" name="customerAddress" placeholder="Full delivery address" register={register} rules={{required: "Customer address is required"}} error={errors.customerAddress} required />
          <Input label="Shipment Address (Dispatch To)" name="shipmentAddress" placeholder="Address the shipment is being sent to" register={register} rules={{required: "Shipment address is required"}} error={errors.shipmentAddress} required />

          <div className="mt-4 flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button type="button" onClick={onClose} className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">Cancel</button>
            <button type="submit" disabled={isSubmitting || selectedOrderError} className="rounded-md bg-[#0073b7] px-5 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-50">{isSubmitting ? "Creating..." : "Create Shipment"}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShipmentModal;
