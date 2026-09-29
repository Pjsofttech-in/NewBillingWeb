import {useState} from "react";
import {NavLink, useLocation} from "react-router-dom";
import {Boxes, ChevronLeft, ChevronRight} from "lucide-react";

const navItems = [
  {
    to: "/",
    label: "Inventory Management",
    icon: Boxes,
  },
];

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const location = useLocation();

  return (
    /* Hidden on mobile screens (below md) */
    <aside
      className={`
        relative hidden md:flex flex-col justify-between border-r border-blue-400/30
        bg-blue-500 text-white transition-all duration-300 ease-in-out
        ${isOpen ? "w-60" : "w-20"}
      `}
    >
      <div className="py-4">
        <nav className="space-y-1.5 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
           
            const isActive =
              item.to === "/"
                ? location.pathname === "/" ||
                  location.pathname.startsWith("/add") ||
                  location.pathname.startsWith("/list") ||
                  location.pathname.startsWith("/setting")
                : location.pathname.startsWith(item.to);

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-white text-slate-800 shadow-md"
                    : "text-white/90 hover:bg-white/15 hover:text-white"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {isOpen && (
                  <span className="truncate tracking-wide">{item.label}</span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      
      <button
        type="button"
        aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
        onClick={() => setIsOpen((prev) => !prev)}
        className="absolute -right-3.5 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-800 shadow-lg transition-transform hover:scale-110 z-20 cursor-pointer"
      >
        {isOpen ? (
          <ChevronLeft className="h-4 w-4 stroke-[2.5]" />
        ) : (
          <ChevronRight className="h-4 w-4 stroke-[2.5]" />
        )}
      </button>
    </aside>
  );
};

export default Sidebar;
