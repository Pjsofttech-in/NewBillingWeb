import API from "./axios";
const BASE="/api/v1/store-settings";
export const fetchStoreProfile=async()=> (await API.get(`${BASE}/profile`)).data;
export const updateStoreProfile=async(d)=>(await API.put(`${BASE}/profile`,d)).data;
// Legacy single-account APIs kept for old data compatibility.
export const fetchBankAccounts=async()=> (await API.get(`${BASE}/bank-accounts`)).data;
export const fetchPaymentReceivingAccounts=async()=> (await API.get(`${BASE}/bank-accounts/payment-receiving`)).data;
export const createBankAccount=async(d)=>(await API.post(`${BASE}/bank-accounts`,d)).data;
export const updateBankAccount=async({id,...d})=>(await API.put(`${BASE}/bank-accounts/${id}`,d)).data;
export const deleteBankAccount=async(id)=> API.delete(`${BASE}/bank-accounts/${id}`);
export const fetchTermsAndConditions=async()=> (await API.get(`${BASE}/terms-and-conditions`)).data;
export const updateTermsAndConditions=async(d)=>(await API.put(`${BASE}/terms-and-conditions`,d)).data;
// Legacy single bank-details record (kept for old data; the UI uses bank accounts).
export const fetchBankDetails=async()=> (await API.get(`${BASE}/bank-details`)).data;
export const updateBankDetails=async(d)=>(await API.put(`${BASE}/bank-details`,d)).data;
