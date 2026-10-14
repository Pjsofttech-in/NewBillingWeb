import API from "./axios";
import {pickParams} from "../utils/queryParams";
import {downloadFile} from "../utils/downloadFile";

// Filters understood by the backend (/getAllOrders and /exportOrders).
const ORDER_FILTER_KEYS = [
  "search",
  "status",
  "paymentMethod",
  "fromDate",
  "toDate",
];

export const createOrder = async (orderPayload) => {
  const response = await API.post("/createOrder", orderPayload);
  return response.data;
};

export const updateOrder = async ({id, ...orderPayload}) => {
  const response = await API.put(`/updateOrder/${id}`, orderPayload);
  return response.data;
};

// filters (all optional): {search, status, paymentMethod, fromDate, toDate}
export const fetchOrders = async (filters = {}) => {
  const response = await API.get("/getAllOrders", {
    params: pickParams(filters, ORDER_FILTER_KEYS),
  });
  return response.data;
};

// Downloads the orders matching `filters` as "pdf" or "csv" (same filters as fetchOrders).
export const exportOrders = (format, filters = {}) =>
  downloadFile(
    "/exportOrders",
    {...pickParams(filters, ORDER_FILTER_KEYS), format},
    `orders.${format}`,
  );

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
