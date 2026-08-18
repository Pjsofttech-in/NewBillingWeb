import {useState, useCallback} from "react";
import {useQuery, useMutation, useQueryClient} from "@tanstack/react-query";

// APIs
import {fetchOrders, createOrder, deleteOrder} from "../../api/orderApi";
import {fetchCustomers, createCustomer} from "../../api/customerApi";
import {fetchVendors} from "../../api/vendorServiceApi";
import {fetchAllProducts} from "../../api/productApi"; // 1. Imported correct API function

// UI Components
import OrderList from "./OrderList";
import CreateOrderModal from "./CreateOrderModal";
import PaymentModal from "../Payment/PaymentModal";
import InvoiceModal from "../Payment/InvoiceModal";

import Toast from "../../Components/Toast";

const OrderPage = () => {
  const queryClient = useQueryClient();

  // Modals States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  // Selected Order State for Modals
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Toast Notification State
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "success") => {
    setToast({message, type});
  }, []);

  // 1. React Queries for Page Data
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

  // 2. Updated to use fetchAllProducts from productApi.js
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

  const {data: vendors = []} = useQuery({
    queryKey: ["vendors"],
    queryFn: fetchVendors,
    retry: 1,
  });

  // 2. Mutations
  const createCustomerMutation = useMutation({
    mutationFn: createCustomer,
  });

  const createOrderMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["orders"]});
      queryClient.invalidateQueries({queryKey: ["customers"]});
      queryClient.invalidateQueries({queryKey: ["products"]});
      setIsModalOpen(false);
      showToast("Order Created Successfully!", "success");
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: deleteOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["orders"]});
      queryClient.invalidateQueries({queryKey: ["products"]});
      showToast("Order deleted successfully", "success");
    },
    onError: (err) => {
      showToast(
        "Error deleting order: " + (err.response?.data?.message || err.message),
        "error",
      );
    },
  });

  // 3. Handlers
  const handleOrderSubmit = async (
    orderPayload,
    isNewCustomer,
    customerPayload,
  ) => {
    let finalCustomerId = orderPayload.customer?.id;

    if (isNewCustomer && customerPayload) {
      const newCustomerRes =
        await createCustomerMutation.mutateAsync(customerPayload);
      finalCustomerId = newCustomerRes.id;
    }

    const finalOrderPayload = {
      ...orderPayload,
      customer: {
        id: finalCustomerId,
      },
    };

    await createOrderMutation.mutateAsync(finalOrderPayload);
  };

  const handleDelete = async (orderId) => {
    await deleteOrderMutation.mutateAsync(orderId);
  };

  // Action Button Handlers
  const handleOpenPayment = (order) => {
    setSelectedOrder(order);
    setIsPaymentOpen(true);
  };

  const handlePrintInvoice = (order) => {
    setSelectedOrder(order);
    setIsInvoiceOpen(true);
  };

  // Callback when payment or shipment succeeds
  const handleSuccessRefresh = () => {
    queryClient.invalidateQueries({queryKey: ["orders"]});
    queryClient.invalidateQueries({queryKey: ["products"]});
  };

  return (
    <>
      {/* Toast Notification */}
      {toast && (
        <div className="relative z-100">
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        </div>
      )}

      {/* Backend API Error Banner */}
      {isProductsError && (
        <div className="m-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
          <strong>Backend Error:</strong> Failed to load products (
          {productsError?.response?.status || 500} Internal Server Error).
          Please check your backend API at <code>/api/products</code>.
        </div>
      )}

      {/* Main Order List View */}
      <OrderList
        orders={orders}
        isLoading={loadingOrders}
        onOpenCreate={() => setIsModalOpen(true)}
        onDelete={handleDelete}
        onOpenPayment={handleOpenPayment}
        onPrintInvoice={handlePrintInvoice}
      />

      {/* 1. Create Order Modal */}
      <CreateOrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmitOrder={handleOrderSubmit}
        customers={customers}
        products={products}
        vendors={vendors}
        loadingCustomers={loadingCustomers}
        loadingProducts={loadingProducts}
        isSubmitting={
          createCustomerMutation.isPending || createOrderMutation.isPending
        }
      />

      {/* 2. Payment Modal */}
      <PaymentModal
        isOpen={isPaymentOpen}
        order={selectedOrder}
        onClose={() => setIsPaymentOpen(false)}
        onSuccess={handleSuccessRefresh}
        showToast={showToast}
      />

      {/* 3. Invoice View Modal */}
      <InvoiceModal
        isOpen={isInvoiceOpen}
        order={selectedOrder}
        onClose={() => setIsInvoiceOpen(false)}
      />
    </>
  );
};

export default OrderPage;