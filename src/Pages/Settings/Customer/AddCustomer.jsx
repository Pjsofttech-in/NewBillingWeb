import {useState} from "react";
import {useQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import {
  fetchCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "../../../api/customerApi";
import {fetchVendors} from "../../../api/vendorServiceApi";
import CustomerList from "./CustomerList";
import CustomerModal from "./CustomerModal";

const AddCustomer = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const queryClient = useQueryClient();

  // Queries
  const {data: customers = [], isLoading: loadingCustomers} = useQuery({
    queryKey: ["customers"],
    queryFn: fetchCustomers,
  });

  const {data: vendors = [], isLoading: loadingVendors} = useQuery({
    queryKey: ["vendors"],
    queryFn: fetchVendors,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["customers"]});
      closeModal();
    },
    onError: (err) => {
      alert(
        "Error saving customer: " +
          (err.response?.data?.message || err.message),
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["customers"]});
      closeModal();
    },
    onError: (err) => {
      alert(
        "Error updating customer: " +
          (err.response?.data?.message || err.message),
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["customers"]});
    },
    onError: (err) => {
      alert("Error deleting customer: " + err.message);
    },
  });

  // Modal Handlers
  const openCreateModal = () => {
    setSelectedCustomer(null);
    setIsModalOpen(true);
  };

  const openEditModal = (customer) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCustomer(null);
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this customer?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleFormSubmit = (data) => {
    const payload = {
      customerName: data.customerName,
      landmark: data.landmark,
      city: data.city,
      taluka: data.taluka,
      pincode: data.pincode,
      email: data.email,
      phone: data.phone,
      state: data.state,
      vendorId: parseInt(data.vendorId, 10),
    };

    if (selectedCustomer) {
      updateMutation.mutate({id: selectedCustomer.id, customerData: payload});
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <>
      <CustomerList
        customers={customers}
        isLoading={loadingCustomers}
        onOpenCreate={openCreateModal}
        onEdit={openEditModal}
        onDelete={handleDelete}
      />

      <CustomerModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={handleFormSubmit}
        initialData={selectedCustomer}
        vendors={vendors}
        loadingVendors={loadingVendors}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />
    </>
  );
};

export default AddCustomer;
