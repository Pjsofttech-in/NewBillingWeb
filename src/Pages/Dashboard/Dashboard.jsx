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
  fetchLowStockAlerts,
  fetchDailyRevenue,
  fetchOrderWiseRevenue,
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
  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
    <div className="flex items-center gap-3">
      <div className="rounded-lg bg-blue-50 p-3">
        <Icon className="h-5 w-5 text-[#0073b7]" />
      </div>

      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {label}
        </p>

        {loading ? (
          <div className="mt-2 h-6 w-24 animate-pulse rounded bg-slate-100" />
        ) : (
          <p className="mt-1 truncate text-lg font-bold text-slate-800">
            {value}
          </p>
        )}
      </div>
    </div>
  </div>
);

const RevenueTooltip = ({active, payload, label}) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
      <p className="mb-1 text-xs font-semibold text-slate-600">{label}</p>

      {payload.map((item) => (
        <p
          key={item.dataKey}
          className="text-sm font-semibold text-slate-800"
        >
          {item.name}: {money(item.value)}
        </p>
      ))}
    </div>
  );
};

const ChartCard = ({title, children}) => (
  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
    <h2 className="mb-5 text-sm font-bold text-slate-800">{title}</h2>

    <div className="h-[320px] w-full">{children}</div>
  </div>
);

export default function Dashboard() {
  const [days, setDays] = useState(7);

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
  });

  // =========================
  // LOW STOCK
  // =========================

  const {data: lowStock = [], isLoading: lowStockLoading} = useQuery({
    queryKey: ["dashboard", "low-stock"],
    queryFn: () => fetchLowStockAlerts(lowStockThreshold),
  });

  // =========================
  // DAILY REVENUE
  // =========================

  const {data: daily = [], isLoading: dailyLoading} = useQuery({
    queryKey: ["dashboard", "daily-revenue", days],
    queryFn: () => fetchDailyRevenue(days),
  });

  // =========================
  // ORDER WISE REVENUE
  // =========================

  const {data: orderRevenue = [], isLoading: orderRevenueLoading} = useQuery({
    queryKey: ["dashboard", "order-revenue"],
    queryFn: () => fetchOrderWiseRevenue(10),
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
  // NORMALIZE DAILY DATA
  // =========================

  const dailyChartData = daily.map((item) => ({
    label: item.label || item.date || item.orderDate || "Unknown",

    amount: Number(item.amount ?? item.revenue ?? item.totalAmount ?? 0),
  }));

  // =========================
  // NORMALIZE ORDER DATA
  // =========================

  const orderChartData = orderRevenue.map((item, index) => ({
    label:
      item.label || item.orderNumber || `Order ${item.orderId || index + 1}`,

    totalAmount: Number(item.totalAmount ?? item.amount ?? item.revenue ?? 0),
  }));

  // =========================
  // PAYMENT DATA
  // =========================

  const paymentChartData = paymentRevenue.map((item) => ({
    name: item.label || item.status || item.paymentStatus || "Unknown",

    amount: Number(item.amount ?? item.totalAmount ?? item.revenue ?? 0),
  }));

  // Pie chart colors
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

  return (
    <div className="w-full space-y-5 p-3 sm:p-5">
      {/* =========================
          REVENUE CARDS
      ========================= */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
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

      {/* =========================
          ORDER / STOCK CARDS
      ========================= */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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

      {/* =========================
          REVENUE FILTER
      ========================= */}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-800">
            Revenue Analytics
          </h2>

          <p className="text-xs text-slate-500">
            View revenue performance by time period.
          </p>
        </div>

        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#0073b7] sm:w-auto"
        >
          <option value={7}>Last 7 Days</option>
          <option value={30}>Last 30 Days</option>
          <option value={365}>Last 1 Year</option>
        </select>
      </div>

      {/* =========================
          DAY WISE REVENUE
          ORDER WISE REVENUE
      ========================= */}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {/* DAY WISE REVENUE */}

        <ChartCard title="Day-wise Revenue">
          {dailyLoading ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              Loading chart...
            </div>
          ) : dailyChartData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              No revenue data available.
            </div>
          ) : (
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart
                data={dailyChartData}
                margin={{
                  top: 10,
                  right: 10,
                  left: 0,
                  bottom: 5,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis
                  dataKey="label"
                  tick={{
                    fontSize: 11,
                  }}
                />

                <YAxis
                  tickFormatter={shortMoney}
                  tick={{
                    fontSize: 11,
                  }}
                />

                <Tooltip content={<RevenueTooltip />} />

                <Bar
                  dataKey="amount"
                  name="Revenue"
                  fill="#0073b7"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* ORDER WISE REVENUE */}

        <ChartCard title="Order-wise Revenue">
          {orderRevenueLoading ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              Loading chart...
            </div>
          ) : orderChartData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              No order revenue data available.
            </div>
          ) : (
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart
                data={orderChartData}
                margin={{
                  top: 10,
                  right: 10,
                  left: 0,
                  bottom: 5,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis
                  dataKey="label"
                  tick={{
                    fontSize: 11,
                  }}
                />

                <YAxis
                  tickFormatter={shortMoney}
                  tick={{
                    fontSize: 11,
                  }}
                />

                <Tooltip content={<RevenueTooltip />} />

                <Bar
                  dataKey="totalAmount"
                  name="Order Amount"
                  fill="#0073b7"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* =========================
          PAYMENT STATUS
          TOP PRODUCTS
      ========================= */}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {/* PAYMENT STATUS */}

        <ChartCard title="Revenue by Payment Status">
          {paymentRevenueLoading ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              Loading chart...
            </div>
          ) : paymentChartData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              No payment data available.
            </div>
          ) : (
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <PieChart>
                <Pie
                  data={paymentChartData}
                  dataKey="amount"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  outerRadius={95}
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

                <Legend
                  verticalAlign="bottom"
                  height={36}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* TOP SELLING PRODUCTS */}

        <ChartCard title="Top Selling Products">
          {topProductsLoading ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              Loading chart...
            </div>
          ) : topProductsChartData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              No sales data available.
            </div>
          ) : (
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart
                data={topProductsChartData}
                layout="vertical"
                margin={{
                  top: 5,
                  right: 30,
                  left: 30,
                  bottom: 5,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                />

                <XAxis
                  type="number"
                  allowDecimals={false}
                />

                <YAxis
                  type="category"
                  dataKey="name"
                  width={100}
                  tick={{
                    fontSize: 11,
                  }}
                />

                <Tooltip formatter={(value) => `${value} sold`} />

                <Bar
                  dataKey="quantity"
                  name="Quantity Sold"
                  fill="#0073b7"
                  radius={[0, 6, 6, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* =========================
          LOW STOCK
      ========================= */}

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex items-center gap-2">
          <div className="rounded-lg bg-red-50 p-2">
            <PackageSearch className="h-5 w-5 text-red-600" />
          </div>

          <div>
            <h2 className="text-sm font-bold text-slate-800">
              Low Stock Alerts
            </h2>

            <p className="text-xs text-slate-400">
              Products with stock below {lowStockThreshold}
            </p>
          </div>
        </div>

        {lowStockLoading ? (
          <div className="py-8 text-center text-sm text-slate-400">
            Loading stock alerts...
          </div>
        ) : lowStock.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-400">
            No low stock products.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <th className="px-3 py-3">Product</th>

                  <th className="px-3 py-3 text-right">Current Stock</th>

                  <th className="px-3 py-3 text-right">Status</th>
                </tr>
              </thead>

              <tbody>
                {lowStock.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-3 py-3 font-medium text-slate-700">
                      {product.productName}
                    </td>

                    <td className="px-3 py-3 text-right font-semibold text-red-600">
                      {product.stock}
                    </td>

                    <td className="px-3 py-3 text-right">
                      <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
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
