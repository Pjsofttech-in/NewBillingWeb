import API from "./axios";

// POST /createProductAttributeValue
// Body: { product: { id }, attribute: { id }, value }
export const createProductAttributeValue = async (payload) => {
  const {data} = await API.post("/createProductAttributeValue", payload);
  return data;
};
