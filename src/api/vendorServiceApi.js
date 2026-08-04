import API from "./axios";

export const fetchVendors = async () => {
  const {data} = await API.get("/getallVendor");
  return data;
};

export const fetchVendorById = async (id) => {
  const {data} = await API.get(`/getbyIdVendor/${id}`);
  return data;
};

export const createVendor = async (vendorData) => {
  const {data} = await API.post("/createVendor", vendorData);
  return data;
};

export const updateVendor = async ({id, vendorData}) => {
  const {data} = await API.put(`/updateVendor/${id}`, vendorData);
  return data;
};

export const deleteVendor = async (id) => {
  const {data} = await API.delete(`/deleteVendor/${id}`);
  return data;
};
