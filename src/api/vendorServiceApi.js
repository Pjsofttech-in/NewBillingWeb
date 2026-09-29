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

export const fetchVendorBills = async () => {
  const {data} = await API.get("/api/vendor-bills");
  return data;
};

export const fetchVendorBillsByVendor = async (vendorId) => {
  const {data} = await API.get(`/api/vendor-bills/vendor/${vendorId}`);
  return data;
};

export const fetchVendorBillById = async (id) => {
  const {data} = await API.get(`/api/vendor-bills/${id}`);
  return data;
};

export const fetchVendorBillPayments = async (billId) => {
  const {data} = await API.get(`/api/vendor-bills/${billId}/payments`);
  return data;
};

export const addVendorBillPayment = async ({billId, paymentData}) => {
  const {data} = await API.post(`/api/vendor-bills/${billId}/payments`, paymentData);
  return data;
};

export const markVendorBillPaymentDone = async (billId) => {
  const {data} = await API.post(`/api/vendor-bills/${billId}/mark-paid`);
  return data;
};
