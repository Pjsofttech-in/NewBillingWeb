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

export const fetchProductsPaged = async ({
  page = 0,
  size = 10,
  sortBy = "productName",
  sortDir = "asc",
} = {}) => {
  const { data } = await API.get("/api/products/paged", {
    params: { page, size, sortBy, sortDir },
  });
  return data;
};

export const getProductBatches = async (productId, activeOnly = false) => {
  const endpoint = activeOnly
    ? `/api/stock-batches/product/${productId}/active`
    : `/api/stock-batches/product/${productId}`;
  const response = await API.get(endpoint);
  return response.data;
};

export const purchaseStockBatch = async (payload) => {
  const response = await API.post("/api/stock-batches/purchase", payload);
  return response.data;
};
