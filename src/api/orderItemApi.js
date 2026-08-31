import API from "./axios";

// POST /createOrderItem?orderId=&productId=&quantity=
export const createOrderItem = async ({orderId, productId, quantity}) => {
  const {data} = await API.post("/createOrderItem", null, {
    params: {orderId, productId, quantity},
  });
  return data;
};

export const fetchAllOrderItems = async () => {
  const {data} = await API.get("/getAllOrderItems");
  return data;
};

export const fetchOrderItemById = async (id) => {
  const {data} = await API.get(`/getOrderItemById/${id}`);
  return data;
};

export const deleteOrderItem = async (id) => {
  const {data} = await API.delete(`/deleteOrderItem/${id}`);
  return data;
};
