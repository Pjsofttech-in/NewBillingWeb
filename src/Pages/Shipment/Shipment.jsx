import {useState, useCallback} from "react";
import {Download, FileText, X} from "lucide-react";
import {useSearchParams} from "react-router-dom";
import {useQuery, useMutation, useQueryClient} from "@tanstack/react-query";

import {
  fetchShipments,
  fetchShipmentsSummary,
  createShipment,
  deleteShipment,
  openShipmentReceipt,
  downloadShipmentReceipt,
} from "../../api/shipmentApi";

import {fetchOrders, fetchOrderById} from "../../api/orderApi";
import {fetchShippedBy} from "../../api/shippedByServiceApi";

import ShipmentList from "./ShipmentList";
import ShipmentModal from "./ShipmentModal";
import Toast from "../../Components/Toast";

const Shipment = () => {
  const queryClient = useQueryClient();

  const [searchParams, setSearchParams] = useSearchParams();
  const requestedOrderId = searchParams.get("orderId");

  const [isModalOpen, setIsModalOpen] = useState(Boolean(requestedOrderId));
  const [toast, setToast] = useState(null);
  const [createdShipment, setCreatedShipment] = useState(null); // offered a receipt right after create

  const showToast = useCallback((message, type = "success") => {
    setToast({message, type});
  }, []);

  const {data: shipments = [], isLoading: loadingShipments} = useQuery({
    queryKey: ["shipments"],
    queryFn: fetchShipments,
    retry: 1,
  });

  const {data: shipmentsSummary, isLoading: loadingSummary} = useQuery({
    queryKey: ["shipments-summary"],
    queryFn: fetchShipmentsSummary,
    retry: 1,
  });

  const {data: orders = [], isLoading: loadingOrders} = useQuery({
    queryKey: ["orders"],
    queryFn: () => fetchOrders(),
    retry: 1,
  });

  const {data: shippedByList = [], isLoading: loadingShippedBy} = useQuery({
    queryKey: ["shippedBy"],
    queryFn: fetchShippedBy,
    retry: 1,
  });

  const {
    data: selectedOrder,
    isLoading: loadingSelectedOrder,
    isError: selectedOrderError,
  } = useQuery({
    queryKey: ["order", requestedOrderId],
    queryFn: () => fetchOrderById(requestedOrderId),
    enabled: Boolean(requestedOrderId),
    retry: 1,
  });

  const [prevRequestedOrderId, setPrevRequestedOrderId] = useState(requestedOrderId);
  if (prevRequestedOrderId !== requestedOrderId) {
    setPrevRequestedOrderId(requestedOrderId);
    if (requestedOrderId) {
      setIsModalOpen(true);
    }
  }

  const closeModal = () => {
    setIsModalOpen(false);

    if (requestedOrderId) {
      setSearchParams({});
    }
  };

  const createShipmentMutation = useMutation({
    mutationFn: createShipment,
    onSuccess: (created) => {
      queryClient.invalidateQueries({queryKey: ["shipments"]});
      queryClient.invalidateQueries({queryKey: ["shipments-summary"]});
      closeModal();
      showToast("Shipment created successfully!", "success");
      if (created?.id) setCreatedShipment(created);
    },
    onError: (err) => {
      showToast(
        err.response?.data?.message ||
          err.message ||
          "Unable to create shipment",
        "error",
      );
    },
  });

  const deleteShipmentMutation = useMutation({
    mutationFn: deleteShipment,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["shipments"]});
      queryClient.invalidateQueries({queryKey: ["shipments-summary"]});
      showToast("Shipment deleted successfully!", "success");
    },
    onError: (err) => {
      showToast(
        err.response?.data?.message ||
          err.message ||
          "Unable to delete shipment",
        "error",
      );
    },
  });

  const handleDeleteShipment = async (shipmentId) => {
    await deleteShipmentMutation.mutateAsync(shipmentId);
  };

  return (
    <div className="w-full px-1 sm:px-2 py-1 space-y-1.5">
      {toast && (
        <div className="relative z-100">
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        </div>
      )}

      <ShipmentList
        shipments={shipments}
        summary={shipmentsSummary}
        loadingSummary={loadingSummary}
        isLoading={loadingShipments}
        onOpenCreate={() => setIsModalOpen(true)}
        onDelete={handleDeleteShipment}
        onNotify={showToast}
      />

      {createdShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800">Shipment created</h3>
              <button type="button" onClick={() => setCreatedShipment(null)} aria-label="Close" className="cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-slate-600">
              Tracking ID: <b>{createdShipment.trackingId || "-"}</b>
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() =>
                  openShipmentReceipt(createdShipment.id).catch((e) =>
                    showToast(e.response?.data?.message || "Could not open the receipt", "error"),
                  )
                }
                className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <FileText className="h-4 w-4" /> View receipt
              </button>
              <button
                type="button"
                onClick={() =>
                  downloadShipmentReceipt(createdShipment.id).catch((e) =>
                    showToast(e.message || "Could not download the receipt", "error"),
                  )
                }
                className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Download className="h-4 w-4" /> Download
              </button>
            </div>
          </div>
        </div>
      )}

      <ShipmentModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={(payload) => createShipmentMutation.mutateAsync(payload)}
        orders={orders}
        shippedByList={shippedByList}
        loadingShippedBy={loadingShippedBy}
        selectedOrder={selectedOrder}
        preselectedOrderId={requestedOrderId}
        loadingOrders={loadingOrders || loadingSelectedOrder}
        selectedOrderError={selectedOrderError}
        isSubmitting={createShipmentMutation.isPending}
      />
    </div>
  );
};

export default Shipment;
