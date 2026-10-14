import API from "./axios";

export const fetchProductTypes = async () => {
  const response = await API.get("/getAllProductTypes");
  const data = response.data;

  // Normalizes array return even if Spring wraps it inside content/data
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.data)) return data.data;

  return [];
};

export const createProductType = async (productTypeData) => {
  const {data} = await API.post("/createProductType", productTypeData);
  return data;
};

export const deleteProductType = async (id) => {
  const {data} = await API.delete(`/deleteProductType/${id}`);
  return data;
};
