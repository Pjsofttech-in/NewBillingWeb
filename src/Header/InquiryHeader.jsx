


import {NavLink} from "react-router-dom";

const tabClass = ({isActive}) =>
  `flex-1 text-center py-1 sm:py-1.5 px-2 sm:px-3 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 whitespace-nowrap ${
    isActive
      ? "bg-white text-slate-800 shadow-sm border"
      : "text-white hover:bg-blue-800 hover:text-white"
  }`;

const InquiryHeader = () => {
  return (
    <div className="p-0 px-1 sm:px-2 pt-1 w-full">
      <nav className="mx-auto flex w-full max-w-full items-center justify-between gap-1 rounded-full bg-blue-500 p-1 shadow-inner border overflow-x-auto">
        <NavLink to="/" className={tabClass}>
          Dashboard
        </NavLink>
        <NavLink to="/order" className={tabClass}>
          Order
        </NavLink>
        <NavLink to="/shipment" className={tabClass}>
          Shipment
        </NavLink>
        <NavLink to="/add" className={tabClass}>
          Product
        </NavLink>
        <NavLink to="/vendor-bills" className={tabClass}>
          Vendor Bills
        </NavLink>
        <NavLink to="/dues" className={tabClass}>
          Dues
        </NavLink>
        <NavLink to="/setting" className={tabClass}>
          Setting
        </NavLink>
      </nav>
    </div>
  );
};

export default InquiryHeader;