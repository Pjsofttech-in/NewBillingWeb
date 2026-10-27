import API from "./axios";
export const fetchDashboardSummary = async () =>
  (await API.get("/dashboard/summary")).data;
export const fetchTopSellingProducts = async (limit = 5) =>
  (await API.get("/dashboard/top-selling", {params: {limit}})).data;
export const fetchTopSellingCategories = async (limit = 5) =>
  (await API.get("/dashboard/top-selling-categories", {params: {limit}})).data;
export const fetchLowStockAlerts = async (threshold = 5) =>
  (await API.get("/dashboard/low-stock", {params: {threshold}})).data;
export const fetchPaymentStatusRevenue = async () =>
  (await API.get("/dashboard/payment-status-revenue")).data;
export const fetchAnalytics = async (range = "7D") =>
  (await API.get("/dashboard/analytics", {params: {range}})).data;
export const fetchPendingOrders = async () =>
  (await API.get("/dashboard/pending-orders")).data;
export const fetchDailyRevenue = async (days = 7) =>
  (await API.get("/dashboard/daily-revenue", {params: {days}})).data;
export const fetchOrderWiseRevenue = async (limit = 10) =>
  (await API.get("/dashboard/order-wise-revenue", {params: {limit}})).data;
