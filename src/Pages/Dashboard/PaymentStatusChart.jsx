import {Cell, Pie, PieChart, ResponsiveContainer, Tooltip} from "recharts";
import ChartCard from "./ChartCard";
import ChartGradient from "./ChartGradient";
import ChartTooltip from "./ChartTooltip";
import {money, shortMoney} from "./dashboardUtils";

// Colours chosen by meaning, with a fallback palette for other statuses
const STATUS_COLORS = {
  PAID: ["#4ade80", "#15803d"],
  PARTIAL: ["#fbbf24", "#d97706"],
  PENDING: ["#fb7185", "#be123c"],
  UNPAID: ["#fb7185", "#be123c"],
};
const FALLBACK = [
  ["#60a5fa", "#1d4ed8"],
  ["#a78bfa", "#6d28d9"],
  ["#2dd4bf", "#0f766e"],
];

const colorFor = (name, index) =>
  STATUS_COLORS[String(name).toUpperCase()] ||
  FALLBACK[index % FALLBACK.length];

// Donut with the total in the middle and a legend underneath
export default function PaymentStatusChart({data, loading}) {
  const total = data.reduce((sum, d) => sum + d.amount, 0);

  return (
    <ChartCard
      title="Revenue by Payment Status"
      subtitle="Share of revenue by payment state"
      loading={loading}
      isEmpty={data.length === 0}
      emptyText="No payment data available."
      heightClass="h-80"
    >
      <div className="flex h-full flex-col">
        <div className="relative min-h-0 flex-1">
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <PieChart>
              <defs>
                {data.map((d, i) => {
                  const [from, to] = colorFor(d.name, i);
                  return (
                    <ChartGradient
                      key={d.name}
                      id={`pay-${i}`}
                      from={from}
                      to={to}
                    />
                  );
                })}
              </defs>
              <Pie
                data={data}
                dataKey="amount"
                nameKey="name"
                innerRadius="62%"
                outerRadius="88%"
                paddingAngle={3}
                cornerRadius={8}
                stroke="none"
                animationDuration={700}
              >
                {data.map((d, i) => (
                  <Cell
                    key={d.name}
                    fill={`url(#pay-${i})`}
                  />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip format={(v) => money(v)} />} />
            </PieChart>
          </ResponsiveContainer>

          {/* total in the donut hole */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[11px] font-medium text-slate-400">
              Total
            </span>
            <span className="text-lg font-bold text-slate-800">
              {shortMoney(total)}
            </span>
          </div>
        </div>

        <ul className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          {data.map((d, i) => {
            const [, dark] = colorFor(d.name, i);
            const pct = total > 0 ? ((d.amount / total) * 100).toFixed(0) : 0;
            return (
              <li
                key={d.name}
                className="flex items-center gap-1.5 text-xs text-slate-600"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{background: dark}}
                />
                <span className="font-medium">{d.name}</span>
                <span className="text-slate-400">{pct}%</span>
              </li>
            );
          })}
        </ul>
      </div>
    </ChartCard>
  );
}
