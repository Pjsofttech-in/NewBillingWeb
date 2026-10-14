import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ChartCard from "./ChartCard";
import ChartGradient from "./ChartGradient";
import ChartTooltip from "./ChartTooltip";
import ToggleGroup from "./ToggleGroup";
import {AXIS_TICK, GRID_STROKE, PALETTE, truncate} from "./dashboardUtils";

const VIEWS = [
  {value: "products", label: "Products"},
  {value: "categories", label: "Category"},
];

// Vertical columns: one coloured column per product / category.
export default function TopSellingChart({view, onViewChange, data, loading}) {
  const isProducts = view === "products";

  return (
    <ChartCard
      title={isProducts ? "Top Selling Products" : "Top Selling Category"}
      subtitle="Quantity sold"
      loading={loading}
      isEmpty={data.length === 0}
      emptyText={
        isProducts
          ? "No sales data available."
          : "No category sales data available."
      }
      actions={
        <ToggleGroup
          options={VIEWS}
          value={view}
          onChange={onViewChange}
        />
      }
    >
      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        <BarChart
          data={data}
          margin={{top: 22, right: 8, left: -12, bottom: 0}}
          barCategoryGap="24%"
        >
          <defs>
            {PALETTE.map(([from, to], i) => (
              <ChartGradient
                key={i}
                id={`topSelling-${i}`}
                from={from}
                to={to}
              />
            ))}
          </defs>
          <CartesianGrid
            strokeDasharray="4 4"
            stroke={GRID_STROKE}
            vertical={false}
          />
          <XAxis
            dataKey="name"
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
            interval={0}
            tickFormatter={(v) => truncate(v, 12)}
          />
          <YAxis
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{fill: "rgba(148,163,184,0.12)", radius: 6}}
            content={<ChartTooltip format={(v) => `${v} sold`} />}
          />
          <Bar
            dataKey="quantity"
            name="Quantity Sold"
            radius={[10, 10, 0, 0]}
            maxBarSize={56}
            animationDuration={700}
          >
            {data.map((entry, i) => (
              <Cell
                key={`${entry.name}-${i}`}
                fill={`url(#topSelling-${i % PALETTE.length})`}
              />
            ))}
            {/* number above each column */}
            <LabelList
              dataKey="quantity"
              position="top"
              style={{fontSize: 11, fontWeight: 700, fill: "#334155"}}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
