import {useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {
  AlertTriangle,
  Boxes,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  IndianRupee,
  ShoppingCart,
  Wallet,
} from "lucide-react";

import {
  fetchAnalytics,
  fetchDashboardSummary,
  fetchLowStockAlerts,
  fetchPaymentStatusRevenue,
  fetchTopSellingCategories,
  fetchTopSellingProducts,
} from "../../api/dashboardApi";

import RevenueOrderCard from "./RevenueOrderCard";
import StatCard from "./StatCard";
import RevenueAnalyticsChart from "./RevenueAnalyticsChart";
import TopSellingChart from "./TopSellingChart";
import PaymentStatusChart from "./PaymentStatusChart";
import LowStockTable from "./LowStockTable";

const LOW_STOCK_THRESHOLD = 5;

export default function Dashboard() {
  const [range, setRange] = useState("7D");
  const [topSellingView, setTopSellingView] = useState("products");
  const isProductsView = topSellingView === "products";

  const {data: summary, isLoading: summaryLoading} = useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: fetchDashboardSummary,
  });

  const {data: topProducts = [], isLoading: topProductsLoading} = useQuery({
    queryKey: ["dashboard", "top-products"],
    queryFn: () => fetchTopSellingProducts(5),
    enabled: isProductsView,
  });

  const {data: topCategories = [], isLoading: topCategoriesLoading} = useQuery({
    queryKey: ["dashboard", "top-categories"],
    queryFn: () => fetchTopSellingCategories(5),
    enabled: !isProductsView,
  });

  const {data: lowStock = [], isLoading: lowStockLoading} = useQuery({
    queryKey: ["dashboard", "low-stock"],
    queryFn: () => fetchLowStockAlerts(LOW_STOCK_THRESHOLD),
  });

  const {
    data: analytics = [],
    isLoading: analyticsLoading,
    error: analyticsError,
  } = useQuery({
    queryKey: ["dashboard", "analytics", range],
    queryFn: () => fetchAnalytics(range),
  });

  const {data: paymentRevenue = [], isLoading: paymentLoading} = useQuery({
    queryKey: ["dashboard", "payment-revenue"],
    queryFn: fetchPaymentStatusRevenue,
  });

  // Pending (unpaid) amount per period = sum of pendingAmount of the analytics
  // points of that period (the same numbers the analytics chart uses).
  const sumPending = (points = []) =>
    points.reduce((sum, p) => sum + Number(p.pendingAmount || 0), 0);
  const usePendingFor = (r) =>
    useQuery({
      queryKey: ["dashboard", "analytics", r],
      queryFn: () => fetchAnalytics(r),
    });
  const pendingToday = usePendingFor("1D");
  const pending7d = usePendingFor("7D");
  const pending30d = usePendingFor("1M");
  const pending1y = usePendingFor("1Y");

  // ---- shape API data for the charts ----
  const analyticsData = analytics.map((item) => ({
    label: item.label || item.date || item.orderDate || "Unknown",
    ordersCount: Number(item.ordersCount ?? 0),
    orderAmount: Number(item.orderAmount ?? item.revenue ?? 0),
    paidAmount: Number(item.paidAmount ?? 0),
    pendingAmount: Number(item.pendingAmount ?? 0),
  }));

  const paymentData = paymentRevenue.map((item) => ({
    name: item.label || item.status || item.paymentStatus || "Unknown",
    amount: Number(item.amount ?? item.totalAmount ?? item.revenue ?? 0),
  }));

  const topSellingData = isProductsView
    ? topProducts.map((item) => ({
        name: item.productName || "Unknown",
        quantity: Number(item.totalQuantitySold || 0),
      }))
    : topCategories.map((item) => ({
        name: item.categoryName || item.productType || item.label || "Unknown",
        quantity: Number(item.totalQuantitySold || 0),
      }));

  return (
    <div className="w-full space-y-3 px-1 py-1 sm:px-2">
      {/* Revenue & orders per period */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <RevenueOrderCard
          tone="blue"
          icon={CalendarDays}
          label="Today"
          pending={
            summary?.pendingOrders?.pendingToday ??
            (pendingToday.data ? sumPending(pendingToday.data) : undefined)
          }
          revenue={summary?.todaysSales}
          orders={summary?.todaysOrdersCount ?? summary?.totalOrdersToday}
          loading={summaryLoading}
        />
        <RevenueOrderCard
          tone="sky"
          icon={CalendarRange}
          label="Last 7 Days"
          pending={pending7d.data ? sumPending(pending7d.data) : undefined}
          revenue={summary?.sevenDaysSales}
          orders={summary?.sevenDaysOrdersCount}
          loading={summaryLoading}
        />
        <RevenueOrderCard
          tone="indigo"
          icon={CalendarClock}
          label="Last 30 Days"
          pending={pending30d.data ? sumPending(pending30d.data) : undefined}
          revenue={summary?.thirtyDaysSales}
          orders={summary?.thirtyDaysOrdersCount}
          loading={summaryLoading}
        />
        <RevenueOrderCard
          tone="violet"
          icon={IndianRupee}
          label="Last Year"
          pending={pending1y.data ? sumPending(pending1y.data) : undefined}
          revenue={summary?.oneYearSales}
          orders={summary?.oneYearOrdersCount}
          loading={summaryLoading}
        />
        <RevenueOrderCard
          tone="emerald"
          icon={Wallet}
          label="Total Revenue"
          pending={
            summary?.pendingOrders?.totalPendingAmount ?? summary?.pendingRevenue
          }
          revenue={summary?.totalRevenue}
          orders={summary?.totalOrdersCount}
          loading={summaryLoading}
        />
      </div>

      {/* Stock / order cards */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <StatCard
          tone="blue"
          icon={ShoppingCart}
          label="Orders Today"
          value={summary?.totalOrdersToday ?? 0}
          loading={summaryLoading}
        />
        <StatCard
          tone="slate"
          icon={Boxes}
          label="Total Stock Quantity"
          value={summary?.totalStockQuantity ?? 0}
          loading={summaryLoading}
        />
        <StatCard
          tone="rose"
          icon={AlertTriangle}
          label="Low Stock Items"
          value={summary?.lowStockCount ?? 0}
          loading={summaryLoading}
        />
      </div>

      <RevenueAnalyticsChart
        data={analyticsData}
        loading={analyticsLoading}
        error={
          analyticsError
            ? analyticsError.response?.data?.message ||
              analyticsError.message ||
              "Request failed"
            : null
        }
        range={range}
        onRangeChange={setRange}
      />

      <TopSellingChart
        view={topSellingView}
        onViewChange={setTopSellingView}
        data={topSellingData}
        loading={isProductsView ? topProductsLoading : topCategoriesLoading}
      />

      <PaymentStatusChart
        data={paymentData}
        loading={paymentLoading}
      />

      <LowStockTable
        products={lowStock}
        loading={lowStockLoading}
        threshold={LOW_STOCK_THRESHOLD}
      />
    </div>
  );
} 