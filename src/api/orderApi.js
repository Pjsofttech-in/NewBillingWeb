import API from "./axios";

// Order Create करण्यासाठी API Call
export const createOrder = async (orderPayload) => {
  const response = await API.post("/createOrder", orderPayload);
  return response.data;
};

// All Orders Fetch करण्यासाठी
export const fetchOrders = async () => {
  const response = await API.get("/getAllOrders");
  return response.data;
};

// Fetch Order By Id
export const fetchOrderById = async (id) => {
  const response = await API.get(`/getOrderById/${id}`);
  return response.data;
};

// Delete Order
export const deleteOrder = async (id) => {
  const response = await API.delete(`/deleteOrder/${id}`);
  return response.data;
};
