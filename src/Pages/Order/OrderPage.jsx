import {useState} from "react";
import {useQuery, useMutation, useQueryClient} from "@tanstack/react-query";

// APIs
import {fetchOrders, createOrder, deleteOrder} from "../../api/orderApi";
import {fetchCustomers, createCustomer} from "../../api/customerApi";
import {fetchVendors} from "../../api/vendorServiceApi";

// UI Components
import OrderList from "./OrderList";
import CreateOrderModal from "./CreateOrderModal";
import API from "../../api/axios";

const fetchProducts = async () => {
  const response = await API.get("/getAllProducts");
  return response.data;
};

const OrderPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();

  // 1. React Queries for Page Data
  const {data: orders = [], isLoading: loadingOrders} = useQuery({
    queryKey: ["orders"],
    queryFn: fetchOrders,
  });

  const {data: customers = [], isLoading: loadingCustomers} = useQuery({
    queryKey: ["customers"],
    queryFn: fetchCustomers,
  });

  const {data: products = [], isLoading: loadingProducts} = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  const {data: vendors = []} = useQuery({
    queryKey: ["vendors"],
    queryFn: fetchVendors,
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
      setIsModalOpen(false);
      alert("Order Created Successfully!");
    },
    onError: (err) => {
      alert(
        "Error creating order: " + (err.response?.data?.message || err.message),
      );
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: deleteOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["orders"]});
    },
  });

  // 3. MAIN LOGIC: Handlers
  const handleOrderSubmit = async (
    orderPayload,
    isNewCustomer,
    customerPayload,
  ) => {
    try {
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

      createOrderMutation.mutate(finalOrderPayload);
    } catch (err) {
      alert(
        "Error in Order Process: " +
          (err.response?.data?.message || err.message),
      );
    }
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this order?")) {
      deleteOrderMutation.mutate(id);
    }
  };

  return (
    <>
      <OrderList
        orders={orders}
        isLoading={loadingOrders}
        onOpenCreate={() => setIsModalOpen(true)}
        onDelete={handleDelete}
      />

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
    </>
  );
};

export default OrderPage;
