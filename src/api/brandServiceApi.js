import API from "./axios";


export const fetchBrands = async () => {
  const {data} = await API.get("/getAllBrands");
  return data;
};

export const createBrand = async (brandData) => {
  const {data} = await API.post("/createBrand", brandData);
  return data;
};

export const deleteBrand = async (id) => {
  const {data} = await API.delete(`/deleteBrand/${id}`);
  return data;
};
