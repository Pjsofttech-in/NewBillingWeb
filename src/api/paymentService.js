import API from "./axios";

export const createPayment = async (orderId, paymentData) => {
  const { data } = await API.post("/createPayment", paymentData, { params: { orderId } });
  return data;
};

export const fetchPaymentsByOrder = async (orderId) => {
  const { data } = await API.get(`/getPaymentsByOrder/${orderId}`);
  return data;
};

export const fetchPayments = async () => {
  const { data } = await API.get("/getAllPayments");
  return data;
};

export const fetchPaymentById = async (id) => {
  const { data } = await API.get(`/getPaymentById/${id}`);
  return data;
};

export const deletePayment = async (id) => {
  const { data } = await API.delete(`/deletePayment/${id}`);
  return data;
};

export const getOrderById = async (orderId) => {
  const { data } = await API.get(`/getOrderById/${orderId}`);
  return data;
};
