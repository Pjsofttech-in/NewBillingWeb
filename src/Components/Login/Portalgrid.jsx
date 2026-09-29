import {LogIn} from "lucide-react";

const portals = [
  {label: "Academy Teacher", color: "bg-blue-500"},
  {label: "School Teacher", color: "bg-emerald-500"},
  {label: "Academy Student", color: "bg-amber-500"},
  {label: "School Student", color: "bg-rose-500"},
  {label: "Employee Portal", color: "bg-blue-600"},
  {label: "Project Leader", color: "bg-blue-500"},
  {label: "Project Member", color: "bg-blue-600"},
  {label: "StudyPoint User", color: "bg-red-500"},
];

export default function PortalGrid() {
  return (
    <div className="w-80 rounded-[28px] bg-white p-6 shadow-xl shadow-slate-200/70 border border-slate-100/80 flex flex-col justify-between">
      <div>
        {/* Header Title */}
        <div className="mb-5 flex items-center gap-2">
          <LogIn className="h-4 w-4 text-amber-600" />
          <h2 className="text-xs font-black tracking-wider text-amber-600 uppercase">
            APPLICATIONS &amp; PORTALS
          </h2>
        </div>

        {/* Tab Switcher */}
        <div className="mb-5 flex rounded-xl bg-slate-50 p-1 text-xs font-semibold">
          <button className="flex-1 rounded-lg bg-amber-600 py-2 text-white shadow-sm transition-all">
            Portals
          </button>
          <button className="flex-1 rounded-lg py-2 text-slate-400 cursor-not-allowed">
            Android
          </button>
          <button className="flex-1 rounded-lg py-2 text-slate-400 cursor-not-allowed">
            iOS
          </button>
        </div>

        {/* Portals Buttons Grid */}
        <div className="grid grid-cols-2 gap-3">
          {portals.map((p) => (
            <button
              key={p.label}
              type="button"
              className={`${p.color} flex h-20 flex-col items-center justify-center gap-1.5 rounded-2xl px-2 text-center text-[11px] font-bold leading-tight text-white shadow-sm transition-transform duration-200 hover:scale-[1.03] active:scale-95`}
            >
              <LogIn className="h-4 w-4 opacity-90 stroke-[2.5]" />
              <span>{p.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
