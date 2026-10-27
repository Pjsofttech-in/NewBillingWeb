import {money} from "../../utils/format";
export {money};

// Shared helpers + chart theme for the dashboard


export const shortMoney = (value) => {
  const n = Number(value || 0);
  if (n >= 10000000) return `${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return `${n}`;
};

// Cut long names so they fit under a column
export const truncate = (text = "", max = 10) =>
  text.length > max ? `${text.slice(0, max - 1)}…` : text;

// Card colour tones
export const TONES = {
  // ---- general tones ----
  blue: {
    box: "bg-blue-100 border-blue-300",
    icon: "text-blue-700 bg-blue-200",
    value: "text-blue-800",
  },
  sky: {
    box: "bg-sky-100 border-sky-300",
    icon: "text-sky-700 bg-sky-200",
    value: "text-sky-800",
  },
  indigo: {
    box: "bg-indigo-100 border-indigo-300",
    icon: "text-indigo-700 bg-indigo-200",
    value: "text-indigo-800",
  },
  violet: {
    box: "bg-violet-100 border-violet-300",
    icon: "text-violet-700 bg-violet-200",
    value: "text-violet-800",
  },
  emerald: {
    box: "bg-emerald-100 border-emerald-300",
    icon: "text-emerald-700 bg-emerald-200",
    value: "text-emerald-800",
  },
  slate: {
    box: "bg-slate-100 border-slate-300",
    icon: "text-slate-700 bg-slate-200",
    value: "text-slate-800",
  },
  rose: {
    box: "bg-rose-100 border-rose-300",
    icon: "text-rose-700 bg-rose-200",
    value: "text-rose-800",
  },

  // ---- stronger tones for inventory cards (these also have a `value` colour) ----
  stock: {
    box: "bg-blue-100 border-blue-300",
    icon: "text-blue-700 bg-blue-200",
    value: "text-blue-800",
  },
  available: {
    box: "bg-emerald-100 border-emerald-300",
    icon: "text-emerald-700 bg-emerald-200",
    value: "text-emerald-800",
  },
  lowStock: {
    box: "bg-amber-100 border-amber-300",
    icon: "text-amber-700 bg-amber-200",
    value: "text-amber-800",
  },
  sold: {
    box: "bg-violet-100 border-violet-300",
    icon: "text-violet-700 bg-violet-200",
    value: "text-violet-800",
  },
  purchase: {
    box: "bg-sky-100 border-sky-300",
    icon: "text-sky-700 bg-sky-200",
    value: "text-sky-800",
  },
  inactive: {
    box: "bg-slate-100 border-slate-300",
    icon: "text-slate-700 bg-slate-200",
    value: "text-slate-800",
  },
  danger: {
    box: "bg-rose-100 border-rose-300",
    icon: "text-rose-700 bg-rose-200",
    value: "text-rose-800",
  },
};

const FALLBACK_TONE = {
  box: "bg-slate-50 border-slate-200",
  icon: "text-slate-700 bg-slate-100",
};

// Safe lookup: always returns a tone object, even for an unknown name
export const getTone = (name) => TONES[name] || TONES.blue || FALLBACK_TONE;

// Chart theme
export const CHART_COLORS = {
  blue: ["#60a5fa", "#0073b7"],
  green: ["#4ade80", "#15803d"],
  amber: ["#fbbf24", "#d97706"],
};

// [light, dark] pairs used for gradient columns / donut slices
export const PALETTE = [
  ["#60a5fa", "#1d4ed8"],
  ["#2dd4bf", "#0f766e"],
  ["#a78bfa", "#6d28d9"],
  ["#fbbf24", "#d97706"],
  ["#fb7185", "#be123c"],
];

export const AXIS_TICK = {fontSize: 11, fill: "#64748b"};
export const GRID_STROKE = "#e2e8f0";
