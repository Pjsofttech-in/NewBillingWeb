import {useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {
  IndianRupee,
  CalendarDays,
  CalendarRange,
  CalendarClock,
  Wallet,
  ShoppingCart,
  Boxes,
  AlertTriangle,
  TrendingUp,
  PackageSearch,
} from "lucide-react";

import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import {
  fetchDashboardSummary,
  fetchTopSellingProducts,
  fetchTopSellingCategories,
  fetchLowStockAlerts,
  fetchAnalytics,
  fetchPaymentStatusRevenue,
} from "../../api/dashboardApi";

const money = (v) =>
  `₹${Number(v || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const shortMoney = (value) => {
  const number = Number(value || 0);

  if (number >= 10000000) {
    return `₹${(number / 10000000).toFixed(1)}Cr`;
  }

  if (number >= 100000) {
    return `₹${(number / 100000).toFixed(1)}L`;
  }

  if (number >= 1000) {
    return `₹${(number / 1000).toFixed(1)}K`;
  }

  return `₹${number}`;
};

const Card = ({icon: Icon, label, value, loading}) => (
  <div className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-xs transition-shadow hover:shadow-sm">
    <div className="flex items-center gap-2.5">
      <div className="rounded-md bg-blue-50 p-2 shrink-0">
        <Icon className="h-4 w-4 text-blue-600" />
      </div>

      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </p>

        {loading ? (
          <div className="mt-1 h-5 w-20 animate-pulse rounded bg-slate-100" />
        ) : (
          <p className="mt-0.5 truncate text-base font-bold text-slate-800">
            {value}
          </p>
        )}
      </div>
    </div>
  </div>
);

const AnalyticsTooltip = ({active, payload, label, isRevenueMetric}) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div className="rounded border border-slate-200 bg-white p-2 shadow-md text-xs">
      <p className="mb-0.5 font-semibold text-slate-600">{label}</p>

      {payload.map((item) => (
        <p key={item.dataKey} className="font-semibold text-slate-800">
          {item.name}:{" "}
          {isRevenueMetric ? money(item.value) : `${item.value} units`}
        </p>
      ))}
    </div>
  );
};

const ChartCard = ({title, actions, children}) => (
  <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-xs">
    <div className="mb-2 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
      <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide">{title}</h2>

      {actions ? <div className="flex flex-wrap items-center gap-1">{actions}</div> : null}
    </div>

    <div className="h-[250px] w-full">{children}</div>
  </div>
);

const ToggleButton = ({active, onClick, children}) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded px-2 py-0.5 text-[11px] font-semibold transition-colors ${
      active
        ? "bg-blue-600 text-white shadow-xs"
        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
    }`}
  >
    {children}
  </button>
);

const RANGE_OPTIONS = [
  {value: "1D", label: "1D"},
  {value: "7D", label: "7D"},
  {value: "1M", label: "1M"},
  {value: "1Y", label: "1Y"},
];

export default function Dashboard() {
  const [range, setRange] = useState("7D");
  const [metric, setMetric] = useState("revenue"); // "revenue" | "sell"
  const [topSellingView, setTopSellingView] = useState("products"); // "products" | "categories"

  const lowStockThreshold = 5;

  // =========================
  // DASHBOARD SUMMARY
  // =========================

  const {data: summary, isLoading: summaryLoading} = useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: fetchDashboardSummary,
  });

  // =========================
  // TOP SELLING PRODUCTS
  // =========================

  const {data: topProducts = [], isLoading: topProductsLoading} = useQuery({
    queryKey: ["dashboard", "top-products"],
    queryFn: () => fetchTopSellingProducts(5),
    enabled: topSellingView === "products",
  });

  // =========================
  // TOP SELLING CATEGORIES / PRODUCT TYPE
  // Requires a new backend endpoint that groups sold quantity by
  // product category / product type (see note below).
  // =========================

  const {data: topCategories = [], isLoading: topCategoriesLoading} =
    useQuery({
      queryKey: ["dashboard", "top-categories"],
      queryFn: () => fetchTopSellingCategories(5),
      enabled: topSellingView === "categories",
    });

  // =========================
  // LOW STOCK
  // =========================

  const {data: lowStock = [], isLoading: lowStockLoading} = useQuery({
    queryKey: ["dashboard", "low-stock"],
    queryFn: () => fetchLowStockAlerts(lowStockThreshold),
  });

  // =========================
  // REVENUE / SELL ANALYTICS
  // =========================

  const {data: analytics = [], isLoading: analyticsLoading} = useQuery({
    queryKey: ["dashboard", "analytics", range],
    queryFn: () => fetchAnalytics(range),
  });

  // =========================
  // PAYMENT STATUS REVENUE
  // =========================

  const {data: paymentRevenue = [], isLoading: paymentRevenueLoading} =
    useQuery({
      queryKey: ["dashboard", "payment-revenue"],
      queryFn: fetchPaymentStatusRevenue,
    });

  // =========================
  // NORMALIZE ANALYTICS DATA (Revenue + Sell)
  // =========================

  const analyticsChartData = analytics.map((item) => ({
    label: item.label || item.date || item.orderDate || "Unknown",
    revenue: Number(item.revenue ?? item.amount ?? item.totalAmount ?? 0),
    unitsSold: Number(item.unitsSold ?? item.quantity ?? item.sell ?? 0),
  }));

  const isRevenueMetric = metric === "revenue";

  // =========================
  // PAYMENT DATA
  // =========================

  const paymentChartData = paymentRevenue.map((item) => ({
    name: item.label || item.status || item.paymentStatus || "Unknown",
    amount: Number(item.amount ?? item.totalAmount ?? item.revenue ?? 0),
  }));

  const PAYMENT_COLORS = [
    "#16a34a",
    "#f59e0b",
    "#ef4444",
    "#3b82f6",
    "#8b5cf6",
  ];

  // =========================
  // TOP PRODUCTS CHART DATA
  // =========================

  const topProductsChartData = topProducts.map((item) => ({
    name: item.productName || "Unknown",
    quantity: Number(item.totalQuantitySold || 0),
  }));

  // =========================
  // TOP CATEGORIES CHART DATA
  // =========================

  const topCategoriesChartData = topCategories.map((item) => ({
    name: item.categoryName || item.productType || item.label || "Unknown",
    quantity: Number(item.totalQuantitySold || 0),
  }));

  const isTopProductsView = topSellingView === "products";
  const topSellingChartData = isTopProductsView
    ? topProductsChartData
    : topCategoriesChartData;
  const topSellingLoading = isTopProductsView
    ? topProductsLoading
    : topCategoriesLoading;

  return (
    <div className="w-full space-y-2 px-1 sm:px-2 py-1">
      {/* REVENUE CARDS */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-5">
        <Card
          icon={CalendarDays}
          label="Today"
          value={money(summary?.todaysSales)}
          loading={summaryLoading}
        />

        <Card
          icon={CalendarRange}
          label="Last 7 Days"
          value={money(summary?.sevenDaysSales)}
          loading={summaryLoading}
        />

        <Card
          icon={CalendarClock}
          label="Last 30 Days"
          value={money(summary?.thirtyDaysSales)}
          loading={summaryLoading}
        />

        <Card
          icon={IndianRupee}
          label="Last 1 Year"
          value={money(summary?.oneYearSales)}
          loading={summaryLoading}
        />

        <Card
          icon={Wallet}
          label="Total Revenue"
          value={money(summary?.totalRevenue)}
          loading={summaryLoading}
        />
      </div>

      {/* ORDER / STOCK CARDS */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Card
          icon={ShoppingCart}
          label="Orders Today"
          value={summary?.totalOrdersToday ?? 0}
          loading={summaryLoading}
        />

        <Card
          icon={Boxes}
          label="Total Stock"
          value={summary?.totalStockQuantity ?? 0}
          loading={summaryLoading}
        />

        <Card
          icon={AlertTriangle}
          label="Low Stock"
          value={summary?.lowStockCount ?? 0}
          loading={summaryLoading}
        />
      </div>

      {/* REVENUE & SELL ANALYTICS (Order-wise Revenue chart removed) */}
      <div className="grid grid-cols-1 gap-2">
        <ChartCard
          title="Revenue & Sell Analytics"
          actions={
            <>
              <div className="flex items-center gap-0.5 rounded bg-slate-100 p-0.5">
                <ToggleButton
                  active={metric === "revenue"}
                  onClick={() => setMetric("revenue")}
                >
                  Revenue
                </ToggleButton>

                <ToggleButton
                  active={metric === "sell"}
                  onClick={() => setMetric("sell")}
                >
                  Sell
                </ToggleButton>
              </div>

              <div className="flex items-center gap-0.5 rounded bg-slate-100 p-0.5">
                {RANGE_OPTIONS.map((opt) => (
                  <ToggleButton
                    key={opt.value}
                    active={range === opt.value}
                    onClick={() => setRange(opt.value)}
                  >
                    {opt.label}
                  </ToggleButton>
                ))}
              </div>
            </>
          }
        >
          {analyticsLoading ? (
            <div className="flex h-full items-center justify-center text-xs text-slate-400">
              Loading chart...
            </div>
          ) : analyticsChartData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-xs text-slate-400">
              No {isRevenueMetric ? "revenue" : "sell"} data available.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={analyticsChartData}
                margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />

                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10 }}
                />

                <YAxis
                  tickFormatter={isRevenueMetric ? shortMoney : undefined}
                  allowDecimals={!isRevenueMetric ? false : undefined}
                  tick={{ fontSize: 10 }}
                />

                <Tooltip
                  content={
                    <AnalyticsTooltip isRevenueMetric={isRevenueMetric} />
                  }
                />

                {isRevenueMetric ? (
                  <Bar
                    dataKey="revenue"
                    name="Revenue"
                    fill="#0073b7"
                    radius={[4, 4, 0, 0]}
                  />
                ) : (
                  <Bar
                    dataKey="unitsSold"
                    name="Units Sold"
                    fill="#16a34a"
                    radius={[4, 4, 0, 0]}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* PAYMENT STATUS & TOP SELLING (Products / Categories) */}
      <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
        <ChartCard title="Revenue by Payment Status">
          {paymentRevenueLoading ? (
            <div className="flex h-full items-center justify-center text-xs text-slate-400">
              Loading chart...
            </div>
          ) : paymentChartData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-xs text-slate-400">
              No payment data available.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentChartData}
                  dataKey="amount"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  outerRadius={75}
                  label={({name, percent}) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {paymentChartData.map((entry, index) => (
                    <Cell
                      key={`${entry.name}-${index}`}
                      fill={PAYMENT_COLORS[index % PAYMENT_COLORS.length]}
                    />
                  ))}
                </Pie>

                <Tooltip formatter={(value) => money(value)} />

                <Legend verticalAlign="bottom" height={24} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title={
            isTopProductsView ? "Top Selling Products" : "Top Selling Category"
          }
          actions={
            <div className="flex items-center gap-0.5 rounded bg-slate-100 p-0.5">
              <ToggleButton
                active={isTopProductsView}
                onClick={() => setTopSellingView("products")}
              >
                Products
              </ToggleButton>

              <ToggleButton
                active={!isTopProductsView}
                onClick={() => setTopSellingView("categories")}
              >
                Category
              </ToggleButton>
            </div>
          }
        >
          {topSellingLoading ? (
            <div className="flex h-full items-center justify-center text-xs text-slate-400">
              Loading chart...
            </div>
          ) : topSellingChartData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-xs text-slate-400">
              {isTopProductsView
                ? "No sales data available."
                : "No category sales data available."}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topSellingChartData}
                layout="vertical"
                margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />

                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />

                <YAxis
                  type="category"
                  dataKey="name"
                  width={80}
                  tick={{ fontSize: 10 }}
                />

                <Tooltip formatter={(value) => `${value} sold`} />

                <Bar
                  dataKey="quantity"
                  name="Quantity Sold"
                  fill="#0073b7"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* LOW STOCK TABLE */}
      <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-xs">
        <div className="mb-2 flex items-center gap-2">
          <div className="rounded bg-red-50 p-1.5">
            <PackageSearch className="h-4 w-4 text-red-600" />
          </div>

          <div>
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Low Stock Alerts
            </h2>
            <p className="text-[11px] text-slate-400">
              Products with stock below {lowStockThreshold}
            </p>
          </div>
        </div>

        {lowStockLoading ? (
          <div className="py-4 text-center text-xs text-slate-400">
            Loading stock alerts...
          </div>
        ) : lowStock.length === 0 ? (
          <div className="py-4 text-center text-xs text-slate-400">
            No low stock products.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-slate-50 text-left text-[11px] uppercase text-slate-500">
                  <th className="px-2.5 py-1.5">Product</th>
                  <th className="px-2.5 py-1.5 text-right">Current Stock</th>
                  <th className="px-2.5 py-1.5 text-right">Status</th>
                </tr>
              </thead>

              <tbody>
                {lowStock.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-2.5 py-1.5 font-medium text-slate-700">
                      {product.productName}
                    </td>

                    <td className="px-2.5 py-1.5 text-right font-semibold text-red-600">
                      {product.stock}
                    </td>

                    <td className="px-2.5 py-1.5 text-right">
                      <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600">
                        Low Stock
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
