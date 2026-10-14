import API from "./axios"; // Adjust import path to match your axios instance file

export const fetchCustomers = async () => {
  const response = await API.get("/getAllCustomers");
  return response.data;
};

export const createCustomer = async (customerData) => {
  const response = await API.post("/createCustomer", customerData);
  return response.data;
};

export const updateCustomer = async ({id, customerData}) => {
  const response = await API.put(`/updateCustomer/${id}`, customerData);
  return response.data;
};

export const deleteCustomer = async (id) => {
  const response = await API.delete(`/deleteCustomer/${id}`);
  return response.data;
};
