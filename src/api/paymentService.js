import API from "./axios"; // तुमचा Axios instance फाईल पाथ जुळवा

export const createPayment = async (orderId, paymentData) => {
  const response = await API.post(
    `/createPayment?orderId=${orderId}`,
    paymentData,
  );
  return response.data;
};

export const getOrderById = async (orderId) => {
  const response = await API.get(`/getOrderById/${orderId}`);
  return response.data;
};
