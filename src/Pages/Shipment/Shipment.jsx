import {useState, useCallback, useEffect} from "react";
import {useSearchParams} from "react-router-dom";
import {useQuery, useMutation, useQueryClient} from "@tanstack/react-query";

import {
  fetchShipments,
  createShipment,
  deleteShipment,
} from "../../api/shipmentApi";

import {fetchOrders, fetchOrderById} from "../../api/orderApi";

import ShipmentList from "./ShipmentList";
import ShipmentModal from "./ShipmentModal";
import Toast from "../../Components/Toast";

const Shipment = () => {
  const queryClient = useQueryClient();

  const [searchParams, setSearchParams] = useSearchParams();
  const requestedOrderId = searchParams.get("orderId");

  const [isModalOpen, setIsModalOpen] = useState(Boolean(requestedOrderId));

  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "success") => {
    setToast({message, type});
  }, []);

  const {data: shipments = [], isLoading: loadingShipments} = useQuery({
    queryKey: ["shipments"],
    queryFn: fetchShipments,
    retry: 1,
  });

  const {data: orders = [], isLoading: loadingOrders} = useQuery({
    queryKey: ["orders"],
    queryFn: fetchOrders,
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

  useEffect(() => {
    if (requestedOrderId) {
      setIsModalOpen(true);
    }
  }, [requestedOrderId]);

  const closeModal = () => {
    setIsModalOpen(false);

    if (requestedOrderId) {
      setSearchParams({});
    }
  };

  const createShipmentMutation = useMutation({
    mutationFn: createShipment,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["shipments"],
      });

      closeModal();

      showToast("Shipment created successfully!", "success");
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
      queryClient.invalidateQueries({
        queryKey: ["shipments"],
      });

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
    <div className="p-1 sm:p-2">
      {toast && (
        <div className="relative z-[100]">
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        </div>
      )}

      <ShipmentList
        shipments={shipments}
        isLoading={loadingShipments}
        onOpenCreate={() => setIsModalOpen(true)}
        onDelete={handleDeleteShipment}
      />

      <ShipmentModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={(payload) => createShipmentMutation.mutateAsync(payload)}
        orders={orders}
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
