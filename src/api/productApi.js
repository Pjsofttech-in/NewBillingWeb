import API from "./axios";

export const fetchAllProducts = async (filters = {}) => {
  const params = new URLSearchParams();

  if (filters.productName) params.append("productName", filters.productName);
  if (filters.productTypeId)
    params.append("productTypeId", filters.productTypeId);
  if (filters.brandId) params.append("brandId", filters.brandId);
  if (filters.vendorId) params.append("vendorId", filters.vendorId);
  if (filters.unitTypeId) params.append("unitTypeId", filters.unitTypeId);

  const response = await API.get(`/api/products?${params.toString()}`);
  return response.data;
};

export const fetchProductById = async (id) => {
  const response = await API.get(`/api/products/${id}`);
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

export const getStockHistory = async (productId) => {
  const response = await API.get(`/api/products/${productId}/stock-history`);
  return response.data;
};
