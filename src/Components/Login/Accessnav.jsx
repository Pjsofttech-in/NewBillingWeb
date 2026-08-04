export default function AccessNav({ tabs, activeTab, onSelect }) {
  return (
    <nav className="flex w-full flex-col space-y-1">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelect(tab.id)}
            className={`group relative flex items-center gap-3.5 px-6 py-3.5 text-left text-sm font-semibold transition-all ${
              isActive
                ? "text-[#f28c00]"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {/* Left border indicator */}
            <span
              className={`absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full transition-all ${
                isActive ? "bg-[#f28c00]" : "bg-transparent"
              }`}
            />

            <Icon
              className={`h-4 w-4 transition-colors ${
                isActive
                  ? "text-[#f28c00]"
                  : "text-slate-400 group-hover:text-slate-500"
              }`}
            />
            
            <span className="flex-1">{tab.label}</span>

            {/* Right Active Dot */}
            {isActive && (
              <span className="h-1.5 w-1.5 rounded-full bg-[#f28c00]" />
            )}
          </button>
        );
      })}
    </nav>
  );
}