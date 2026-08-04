import API from "./axios";

export const fetchAllProducts = async () => {
  const response = await API.get("/getAllProducts");
  return response.data;
};

export const fetchProductById = async (id) => {
  const response = await API.get(`/getProductById/${id}`);
  return response.data;
};

export const createProduct = async (productData) => {
  const response = await API.post("/createProduct", productData);
  return response.data;
};

export const deleteProduct = async (id) => {
  const response = await API.delete(`/deleteProduct/${id}`);
  return response.data;
};
