import API from "./axios";

export const createPayment = async (orderId, paymentData) => {
  const { data } = await API.post("/createPayment", paymentData, { params: { orderId } });
  return data;
};

export const fetchPaymentsByOrder = async (orderId) => {
  const { data } = await API.get(`/getPaymentsByOrder/${orderId}`);
  return data;
};

export const getOrderById = async (orderId) => {
  const { data } = await API.get(`/getOrderById/${orderId}`);
  return data;
};

export const fetchAllPayments = async () => {
  const { data } = await API.get("/getAllPayments");
  return data;
};

export const deletePayment = async (paymentId) => {
  const { data } = await API.delete(`/deletePayment/${paymentId}`);
  return data;
};
