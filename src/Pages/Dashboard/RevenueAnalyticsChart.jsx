import {useState} from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ChartCard from "./ChartCard";
import ChartGradient from "./ChartGradient";
import ChartTooltip from "./ChartTooltip";
import ToggleGroup from "./ToggleGroup";
import {
  AXIS_TICK,
  CHART_COLORS,
  GRID_STROKE,
  money,
  shortMoney,
} from "./dashboardUtils";

const METRICS = [
  {value: "orders", label: "Orders"},
  {value: "sell", label: "Sell"},
];
const RANGES = ["1D", "7D", "1M", "1Y"].map((r) => ({value: r, label: r}));

// What each tab draws. "sell" shows three bars per period:
// total order amount, paid amount and pending amount.
const SERIES = {
  orders: [{key: "ordersCount", name: "Orders", colors: CHART_COLORS.blue}],
  sell: [
    {key: "orderAmount", name: "Total Order Amount", colors: CHART_COLORS.blue},
    {key: "paidAmount", name: "Total Paid Amount", colors: CHART_COLORS.green},
    {
      key: "pendingAmount",
      name: "Total Pending Amount",
      colors: CHART_COLORS.amber,
    },
  ],
};

const SUBTITLES = {
  orders: "Number of orders placed in the selected period",
  sell: "Order, paid and pending amount in the selected period",
};

// `range` is controlled by the parent because it drives the API request.
export default function RevenueAnalyticsChart({
  data,
  loading,
  error,
  range,
  onRangeChange,
}) {
  const [metric, setMetric] = useState("orders");
  const isCount = metric === "orders";
  const series = SERIES[metric];

  // solid colour per series for tooltip dots + legend
  const solidColors = Object.fromEntries(
    series.map((s) => [s.key, s.colors[1]]),
  );

  return (
    <ChartCard
      title="Orders & Sell Analytics"
      subtitle={SUBTITLES[metric]}
      loading={loading}
      error={error}
      isEmpty={data.length === 0}
      emptyText={`No ${isCount ? "order" : "sell"} data available.`}
      heightClass={metric === "sell" ? "h-80" : "h-72"}
      actions={
        <>
          <ToggleGroup
            options={METRICS}
            value={metric}
            onChange={setMetric}
          />
          <ToggleGroup
            options={RANGES}
            value={range}
            onChange={onRangeChange}
          />
        </>
      }
    >
      <div className="flex h-full flex-col">
        {series.length > 1 && (
          <ul className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1">
            {series.map((s) => (
              <li
                key={s.key}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-600"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{background: solidColors[s.key]}}
                />
                {s.name}
              </li>
            ))}
          </ul>
        )}

        <div className="min-h-0 flex-1">
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <BarChart
              data={data}
              margin={{top: 10, right: 8, left: -8, bottom: 0}}
              barCategoryGap="22%"
              barGap={3}
            >
              <defs>
                {series.map((s) => (
                  <ChartGradient
                    key={s.key}
                    id={`analytics-${s.key}`}
                    from={s.colors[0]}
                    to={s.colors[1]}
                  />
                ))}
              </defs>
              <CartesianGrid
                strokeDasharray="4 4"
                stroke={GRID_STROKE}
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={AXIS_TICK}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={AXIS_TICK}
                axisLine={false}
                tickLine={false}
                allowDecimals={!isCount}
                tickFormatter={isCount ? undefined : shortMoney}
              />
              <Tooltip
                cursor={{fill: "rgba(148,163,184,0.12)", radius: 6}}
                content={
                  <ChartTooltip
                    format={(v) => (isCount ? `${v} orders` : money(v))}
                    colors={solidColors}
                  />
                }
              />
              {series.map((s) => (
                <Bar
                  key={s.key}
                  dataKey={s.key}
                  name={s.name}
                  fill={`url(#analytics-${s.key})`}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={series.length > 1 ? 22 : 44}
                  animationDuration={700}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </ChartCard>
  );
}