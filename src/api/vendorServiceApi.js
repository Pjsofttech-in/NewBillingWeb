import API from "./axios";

export const fetchVendors = async () => {
  const {data} = await API.get("/getallVendor");
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

export const markVendorBillPaymentDone = async (billId) => {
  const {data} = await API.post(`/api/vendor-bills/${billId}/mark-paid`);
  return data;
};

// Vendor totals + all bills + installment history for one vendor
export const fetchVendorBillDetail = async (vendorId) => {
  const {data} = await API.get(`/api/vendor-bills/vendor/${vendorId}/detail`);
  return data;
};

export const fetchVendorBills = async () => {
  const {data} = await API.get("/api/vendor-bills");
  return data;
};

export const fetchVendorBillById = async (billId) => {
  const {data} = await API.get(`/api/vendor-bills/${billId}`);
  return data;
};

export const fetchVendorBillsByVendor = async (vendorId) => {
  const {data} = await API.get(`/api/vendor-bills/vendor/${vendorId}`);
  return data;
};

export const fetchVendorBillPayments = async (billId) => {
  const {data} = await API.get(`/api/vendor-bills/${billId}/payments`);
  return data;
};

// payload: {amountPaid, paymentMethod, transactionReference?, notes?, paymentDate?}
// Refused by the backend while the bill has an installment plan.
export const addVendorBillPayment = async ({billId, ...payload}) => {
  const {data} = await API.post(`/api/vendor-bills/${billId}/payments`, payload);
  return data;
};
