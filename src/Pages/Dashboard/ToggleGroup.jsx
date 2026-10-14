// Small segmented control: <ToggleGroup options={[{value,label}]} value onChange />
export default function ToggleGroup({options, value, onChange}) {
  return (
    <div className="flex items-center gap-0.5 rounded-lg bg-slate-100 p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-all ${
            value === opt.value
              ? "bg-white text-blue-700 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
