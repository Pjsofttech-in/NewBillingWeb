// One tooltip for all charts. Pass format(value, item) to control the text.
// colors: optional {dataKey: '#hex'} for the dot (gradient fills can't be used as a dot colour)
export default function ChartTooltip({active, payload, label, format, colors}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-xs shadow-lg backdrop-blur">
      {(label ?? payload[0]?.payload?.name) && (
        <p className="mb-1 font-semibold text-slate-500">
          {label ?? payload[0].payload.name}
        </p>
      )}
      {payload.map((item) => (
        <p
          key={item.dataKey}
          className="flex items-center gap-1.5 font-bold text-slate-800"
        >
          <span
            className="h-2 w-2 rounded-full"
            style={{
              background:
                colors?.[item.dataKey] || item.payload?.fill || item.color,
            }}
          />
          {item.name}: {format ? format(item.value, item) : item.value}
        </p>
      ))}
    </div>
  );
}
