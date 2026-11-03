// Small helpers shared by the installment window and its forms.

export const METHODS = ["CASH", "UPI", "CREDIT_CARD", "DEBIT_CARD", "NET_BANKING"];
export const METHOD_OPTIONS = [
  {value: "CASH", label: "Cash"},
  {value: "UPI", label: "UPI"},
  {value: "CREDIT_CARD", label: "Credit Card"},
  {value: "DEBIT_CARD", label: "Debit Card"},
  {value: "NET_BANKING", label: "Net Banking"},
];
export const STATUS_OPTIONS = [
  {value: "PENDING", label: "Pending"},
  {value: "PAID", label: "Paid"},
];
export const FREQUENCIES = ["DAILY", "WEEKLY", "FORTNIGHTLY", "MONTHLY"];

const pad = (n) => String(n).padStart(2, "0");
// Local date (not UTC) so "today" is right early in the morning in India too.
export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
export const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// Same rule as the backend (InstallmentFrequency.dueDate) - used for the preview only.
export const dueDateFor = (firstIso, frequency, index) => {
  const [y, m, d] = firstIso.split("-").map(Number);
  if (frequency === "MONTHLY") {
    const total = m - 1 + index;
    const year = y + Math.floor(total / 12);
    const month = ((total % 12) + 12) % 12;
    const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    return `${year}-${pad(month + 1)}-${pad(Math.min(d, lastDay))}`;
  }
  const step = {DAILY: 1, WEEKLY: 7, FORTNIGHTLY: 14}[frequency] || 1;
  return new Date(Date.UTC(y, m - 1, d + step * index))
    .toISOString()
    .slice(0, 10);
};

// Equal parts in paise, the last one takes the rounding (same as the backend).
export const equalParts = (amount, count) => {
  const cents = Math.round(Number(amount) * 100);
  const n = Math.max(1, Number(count) || 1);
  const part = Math.floor(cents / n);
  return Array.from({length: n}, (_, i) =>
    i === n - 1 ? (cents - part * (n - 1)) / 100 : part / 100,
  );
};


export const inputCls =
  "w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm";
// Same look as the reusable Select, for the plain text / number / date fields next to it
export const fieldCls =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100 sm:text-base";
export const fieldLabelCls =
  "mb-1 block text-xs font-medium text-slate-700 sm:text-sm";
export const labelCls = "text-xs font-semibold uppercase text-slate-600";

export const messageOf = (e, fallback) =>
  e.response?.data?.message || e.message || fallback;
