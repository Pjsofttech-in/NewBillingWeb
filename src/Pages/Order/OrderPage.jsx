import {useState, useCallback} from "react";
import {useNavigate} from "react-router-dom";
import {useQuery, useMutation, useQueryClient} from "@tanstack/react-query";

import {fetchOrders, createOrder, updateOrder, deleteOrder} from "../../api/orderApi";
import {fetchCustomers, createCustomer} from "../../api/customerApi";
import {fetchAllProducts} from "../../api/productApi";

import OrderList from "./OrderList";
import CreateOrderModal from "./CreateOrderModal";
import PaymentModal from "../Payment/PaymentModal";
import InvoiceModal from "../Payment/InvoiceModal";
import Toast from "../../Components/Toast";

const OrderPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "success") => {
    setToast({message, type});
  }, []);

  const {data: orders = [], isLoading: loadingOrders} = useQuery({
    queryKey: ["orders"],
    queryFn: fetchOrders,
    retry: 1,
  });

  const {data: customers = [], isLoading: loadingCustomers} = useQuery({
    queryKey: ["customers"],
    queryFn: fetchCustomers,
    retry: 1,
  });

  const {
    data: products = [],
    isLoading: loadingProducts,
    isError: isProductsError,
    error: productsError,
  } = useQuery({
    queryKey: ["products"],
    queryFn: fetchAllProducts,
    retry: 1,
  });

  const createCustomerMutation = useMutation({mutationFn: createCustomer});

  const createOrderMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["orders"]});
      queryClient.invalidateQueries({queryKey: ["orders-gst-summary"]});
      queryClient.invalidateQueries({queryKey: ["customers"]});
      queryClient.invalidateQueries({queryKey: ["products"]});
      setIsModalOpen(false);
      showToast("Order Created Successfully!", "success");
    },
    onError: (err) => showToast(err.response?.data?.message || err.message || "Unable to create order", "error"),
  });

  const updateOrderMutation = useMutation({
    mutationFn: updateOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["orders"]});
      queryClient.invalidateQueries({queryKey: ["orders-gst-summary"]});
      queryClient.invalidateQueries({queryKey: ["customers"]});
      queryClient.invalidateQueries({queryKey: ["products"]});
      setEditingOrder(null);
      showToast("Order Updated Successfully!", "success");
    },
    onError: (err) =>
      showToast(
        err.response?.data?.message || err.message || "Unable to update order",
        "error",
      ),
  });

  const deleteOrderMutation = useMutation({
    mutationFn: deleteOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["orders"]});
      queryClient.invalidateQueries({queryKey: ["orders-gst-summary"]});
      queryClient.invalidateQueries({queryKey: ["products"]});
      showToast("Order deleted successfully", "success");
    },
    onError: (err) => showToast("Error deleting order: " + (err.response?.data?.message || err.message), "error"),
  });

  const handleOrderSubmit = async (
    orderPayload,
    isNewCustomer,
    customerPayload,
    editOrderId = null,
  ) => {
    let finalCustomerId = orderPayload.customer?.id;

    if (isNewCustomer && customerPayload) {
      const newCustomerRes = await createCustomerMutation.mutateAsync(customerPayload);
      finalCustomerId = newCustomerRes.id;
    }

    if (editOrderId) {
      await updateOrderMutation.mutateAsync({
        id: editOrderId,
        customerId: finalCustomerId,
        orderDate: orderPayload.orderDate,
        paymentDueDate: orderPayload.paymentDueDate || null,
        status: orderPayload.status,
        orderItems: (orderPayload.orderItems || []).map((item) => ({
          productId: item.product?.id,
          quantity: item.quantity,
          customerDiscountPercentage: item.customerDiscountPercentage,
        })),
      });
      return;
    }

    await createOrderMutation.mutateAsync({
      ...orderPayload,
      customer: {id: finalCustomerId},
    });
  };

  const handleDelete = async (orderId) => deleteOrderMutation.mutateAsync(orderId);
  const handleOpenEdit = (order) => setEditingOrder(order);
  const handleOpenPayment = (order) => { setSelectedOrder(order); setIsPaymentOpen(true); };
  const handlePrintInvoice = (order) => { setSelectedOrder(order); setIsInvoiceOpen(true); };

  const handleCreateShipment = (order) => {
    navigate(`/shipment?orderId=${encodeURIComponent(order.id)}`);
  };

  const handleSuccessRefresh = () => {
    queryClient.invalidateQueries({queryKey: ["orders"]});
    queryClient.invalidateQueries({queryKey: ["orders-gst-summary"]});
    queryClient.invalidateQueries({queryKey: ["products"]});
  };

  return (
    <div className="w-full px-1 sm:px-2 py-1 space-y-1.5">
      {toast && (
        <div className="relative z-100">
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        </div>
      )}

      {isProductsError && (
        <div className="p-2.5 rounded-md border border-red-200 bg-red-50 text-xs text-red-700">
          <strong>Backend Error:</strong> Failed to load products ({productsError?.response?.status || 500}).
        </div>
      )}

      <OrderList
        orders={orders}
        isLoading={loadingOrders}
        onOpenCreate={() => {
          setEditingOrder(null);
          setIsModalOpen(true);
        }}
        onOpenEdit={handleOpenEdit}
        onDelete={handleDelete}
        onOpenPayment={handleOpenPayment}
        onPrintInvoice={handlePrintInvoice}
        onCreateShipment={handleCreateShipment}
      />

      <CreateOrderModal
        isOpen={isModalOpen || Boolean(editingOrder)}
        onClose={() => {
          setIsModalOpen(false);
          setEditingOrder(null);
        }}
        onSubmitOrder={handleOrderSubmit}
        customers={customers}
        products={products}
        loadingCustomers={loadingCustomers}
        loadingProducts={loadingProducts}
        isSubmitting={
          createCustomerMutation.isPending ||
          createOrderMutation.isPending ||
          updateOrderMutation.isPending
        }
        editingOrder={editingOrder}
      />

      <PaymentModal
        isOpen={isPaymentOpen}
        order={selectedOrder}
        onClose={() => setIsPaymentOpen(false)}
        onSuccess={handleSuccessRefresh}
        showToast={showToast}
      />

      <InvoiceModal
        isOpen={isInvoiceOpen}
        order={selectedOrder}
        onClose={() => setIsInvoiceOpen(false)}
      />
    </div>
  );
};

export default OrderPage;