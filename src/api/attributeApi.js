import API from "./axios";

// POST /createAttribute  Body: { name, productType: { id } }
export const createAttribute = async (attributeData) => {
  const {data} = await API.post("/createAttribute", attributeData);
  return data;
};

// GET /by-product-type/{id}
export const fetchAttributesByProductType = async (productTypeId) => {
  const {data} = await API.get(`/by-product-type/${productTypeId}`);
  return data;
};
