// One summary-card design for the whole app (same as the Products page):
// rounded card, label on top, value below, both in the card's colour.

// Full class names are written out so Tailwind can detect them.
const TONES = {
  slate: {box: "bg-slate-50 border-slate-200", value: "text-slate-800"},
  blue: {box: "bg-blue-50 border-blue-200", value: "text-blue-700"},
  violet: {box: "bg-violet-50 border-violet-200", value: "text-violet-700"},
  amber: {box: "bg-amber-50 border-amber-200", value: "text-amber-700"},
  indigo: {box: "bg-indigo-50 border-indigo-200", value: "text-indigo-700"},
  emerald: {box: "bg-emerald-50 border-emerald-200", value: "text-emerald-700"},
  rose: {box: "bg-rose-50 border-rose-200", value: "text-rose-700"},
};

const StatCard = ({label, value, tone = "slate", loading = false}) => {
  const t = TONES[tone] || TONES.slate;

  return (
    <div
      className={`flex flex-row items-center justify-center gap-0.5 rounded-2xl border px-2 py-2 text-center shadow-sm transition hover:shadow-md ${t.box}`}
      title={loading ? label : `${label}: ${value}`}
    >
      <span className="w-full  text-xs font-medium text-slate-800">
        {label}
      </span>

      {loading ? (
        <span className="mt-1 h-5 w-20 animate-pulse rounded bg-white/80" />
      ) : (
        <span
          className={`w-full  text-sm font-semibold leading-tight ${t.value}`}
        >
          {value}
        </span>
      )}
    </div>
  );
};

export default StatCard;
