import {useState} from "react";
import {Layers, Ruler, Store, Tag, Truck  } from "lucide-react";

const sidebarItems = [
  {id: "vendor", label: "Add Vendor", icon: Store},
  {id: "shipment", label: "Shipment", icon: Truck},
  {id: "BrandName", label: "Add Brand Name", icon: Tag},
  {id: "UnitType", label: "Add Unit Type", icon: Ruler},
  {id: "productType", label: "Add Product Type", icon: Layers},
];

export default function SettingsSidebar({activeTab, onSelectTab}) {
  const [internalSelected, setInternalSelected] = useState("vendor");

  const selected = activeTab ?? internalSelected;

  const handleSelect = (id) => {
    if (onSelectTab) {
      onSelectTab(id);
    } else {
      setInternalSelected(id);
    }
  };

  return (
    <div className="group relative z-20 flex flex-col gap-1.5 w-16 hover:w-60 bg-[#0073b7] hover:bg-[#0867a0] p-3 rounded-3xl shadow-2xl transition-all duration-300 ease-in-out overflow-hidden border border-sky-400/20">
      {sidebarItems.map((item) => {
        const Icon = item.icon;
        const isActive = selected === item.id;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => handleSelect(item.id)}
            className={`flex items-center gap-3.5 px-3 py-3 rounded-2xl text-sm font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
              isActive
                ? "bg-white text-[#0073b7] shadow-md shadow-black/10 scale-[1.02]"
                : "text-white/90 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Icon className="h-5 w-5 shrink-0 stroke-[2.2]" />
            <span
              className={`transition-opacity duration-200 ${
                isActive ? "text-[#0073b7]" : "text-white"
              } opacity-0 group-hover:opacity-100 group-hover:block hidden`}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
