import {NavLink} from "react-router-dom";

const tabClass = ({isActive}) =>
  `flex-1 text-center py-1.5 sm:py-2 px-2 sm:px-4 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 whitespace-nowrap ${
    isActive
      ? "bg-white text-slate-800 shadow-sm border"
      : "text-white hover:bg-[#16508c] hover:text-white"
  }`;

const InquiryHeader = () => {
  return (
    <div className="p-2 sm:p-3 pb-0 w-full">
      <nav className="mx-auto flex w-full max-w-5xl items-center justify-between gap-1 sm:gap-2 rounded-full bg-[#1b68b3] p-1 sm:p-1.5 shadow-inner border overflow-x-auto">
        <NavLink
          to="/"
          className={tabClass}
        >
          Dashboard
        </NavLink>
        <NavLink
          to="/order"
          className={tabClass}
        >
          Order
        </NavLink>
        <NavLink
          to="/shipment"
          className={tabClass}
        >
          Shipment
        </NavLink>
        <NavLink
          to="/add"
          className={tabClass}
        >
          Product
        </NavLink>
        <NavLink
          to="/setting"
          className={tabClass}
        >
          Setting
        </NavLink>
      </nav>
    </div>
  );
};

export default InquiryHeader;
