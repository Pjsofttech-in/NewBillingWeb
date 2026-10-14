import API from "./axios";

// Customer pays the store (per order) and store pays a vendor (per vendor bill)
// share the same endpoint shape, so one factory builds both.
const createInstallmentApi = (base, scope) => ({
  fetchPlan: async (id) => (await API.get(`${base}/${scope}/${id}`)).data,
  // payload: AUTO {numberOfInstallments, firstDueDate, frequency}
  //       or CUSTOM {installments: [{dueAmount, dueDate}]}
  createPlan: async ({id, ...payload}) =>
    (await API.post(`${base}/${scope}/${id}`, payload)).data,
  deletePlan: async (id) => (await API.delete(`${base}/${scope}/${id}`)).data,
  // payload: {amount, paymentDate?, paymentMethod, receivingAccountId?, transactionReference?, notes?}
  payInstallment: async ({installmentId, ...payload}) =>
    (await API.post(`${base}/${installmentId}/pay`, payload)).data,
  fetchDue: async ({overdueOnly = false, days = 30} = {}) =>
    (await API.get(`${base}/due`, {params: {overdueOnly, days}})).data,
  fetchSummary: async () => (await API.get(`${base}/summary`)).data,
});

export const orderInstallmentApi = createInstallmentApi(
  "/api/order-installments",
  "order",
);
export const vendorBillInstallmentApi = createInstallmentApi(
  "/api/vendor-bill-installments",
  "bill",
);
