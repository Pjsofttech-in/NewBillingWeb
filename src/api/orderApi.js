import API from "./axios";

export const createOrder = async (orderPayload) => {
  const response = await API.post("/createOrder", orderPayload);
  return response.data;
};

export const fetchOrders = async () => {
  const response = await API.get("/getAllOrders");
  return response.data;
};

export const fetchOrderById = async (id) => {
  const response = await API.get(`/getOrderById/${id}`);
  return response.data;
};

export const deleteOrder = async (id) => {
  const response = await API.delete(`/deleteOrder/${id}`);
  return response.data;
};

// Grand totals used by the Orders page.
export const fetchOrdersGstSummary = async () => {
  const response = await API.get("/getOrdersGstSummary");
  return response.data;
};
