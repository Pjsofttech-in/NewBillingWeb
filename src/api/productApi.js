import API from "./axios";
import {pickParams} from "../utils/queryParams";
import {downloadFile} from "../utils/downloadFile";

const PRODUCT_FILTER_KEYS = [
  "productName",
  "productTypeId",
  "brandId",
  "vendorId",
  "unitTypeId",
  "subCategoryId",
];

export const fetchAllProducts = async (filters = {}) => {
  const response = await API.get("/api/products", {
    params: pickParams(filters, PRODUCT_FILTER_KEYS),
  });
  return response.data;
};

export const createProduct = async (productData) => {
  const response = await API.post("/api/products", productData);
  return response.data;
};

export const deleteProduct = async (id) => {
  const response = await API.delete(`/api/products/${id}`);
  return response.data;
};

export const updateProductStock = async ({id, ...payload}) => {
  const response = await API.put(`/api/products/${id}/add-stock`, payload);
  return response.data;
};

export const getProductBatches = async (productId, activeOnly = false) => {
  const endpoint = activeOnly
    ? `/api/stock-batches/product/${productId}/active`
    : `/api/stock-batches/product/${productId}`;
  const response = await API.get(endpoint);
  return response.data;
};

// Grand totals of all product columns (stock, remaining, sold, buy amount, stock amount, sold amount).
export const fetchProductsSummary = async () => {
  const response = await API.get("/api/products/summary");
  return response.data;
};

export const fetchProductById = async (id) => {
  const response = await API.get(`/api/products/${id}`);
  return response.data;
};

// Every stock movement of a product (INITIAL_STOCK, RESTOCK, ORDER_DEDUCTION, ...).
export const fetchStockHistory = async (productId) => {
  const response = await API.get(`/api/products/${productId}/stock-history`);
  return response.data;
};

// Downloads the products matching `filters` (same filters as fetchAllProducts) as "pdf" or "csv".
export const exportProducts = (format, filters = {}) =>
  downloadFile(
    "/api/products/export",
    {...pickParams(filters, PRODUCT_FILTER_KEYS), format},
    `products.${format}`,
  );
