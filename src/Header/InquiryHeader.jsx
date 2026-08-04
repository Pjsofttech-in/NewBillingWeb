import {NavLink} from "react-router-dom";

const tabClass = ({isActive}) =>
  `flex-1 text-center py-2 px-4  rounded-full text-xs sm:text-sm font-bold transition-all duration-200  ${
    isActive
      ? "bg-white text-slate-800 shadow-sm border"
      : "text-white hover:bg-[#16508c] hover:text-white"
  }`;

const InquiryHeader = () => {
  return (
    <div className="p-4 sm:p-6 pb-0">
      <nav className="mx-auto flex w-full gap-2 max-w-5xl items-center rounded-full bg-[#1b68b3] p-1.5 shadow-inner  border">
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
          order
        </NavLink>
        <NavLink
          to="/add"
          className={tabClass}
        >
          Add Product{" "}
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
