import API from "./axios";

// POST /createProductTypeAttribute
// Body: { productType: { id }, attribute: { id } }
export const createProductTypeAttribute = async (payload) => {
  const {data} = await API.post("/createProductTypeAttribute", payload);
  return data;
};

export const fetchAllProductTypeAttributes = async () => {
  const {data} = await API.get("/getAllProductTypeAttribute");
  return data;
};

export const fetchProductTypeAttributeById = async (id) => {
  const {data} = await API.get(`/getByIdProductTypeAttribute/${id}`);
  return data;
};

export const deleteProductTypeAttribute = async (id) => {
  const {data} = await API.delete(`/deleteProductTypeAttribute/${id}`);
  return data;
};
