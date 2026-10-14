import {User, LogOut, UserCircle} from "lucide-react";
import {Link, useNavigate} from "react-router-dom";
import {useAuth} from "../Context/AuthContext";

const Navbar = () => {
  const navigate = useNavigate();
  const {logout, user} = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login", {replace: true});
  };

  return (
    /* Height increased to h-18 */
    <header className="flex h-18 w-full items-center justify-between bg-blue-500 px-4 text-white shadow-md shadow-blue-900/20 sm:px-6 relative z-30">
      {/* Left Brand / Logo Section */}
      <div className="flex items-center gap-3">
        {/* Logo Container */}
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white/80 bg-blue-900 shadow-sm">
          {/* <img
            src={logo}
            alt="Sant Gadagebaba Progressive School Logo"
            className="h-full w-full object-cover rounded-full"
          /> */}
        </div>
        <h1 className="text-lg font-bold tracking-wide sm:text-2xl">
          {user.instituteName || "Sant Gadagebaba Progressive School"}
        </h1>
      </div>

      {/* Right Branch & Actions Section */}
      <div className="flex items-center gap-4">
        <span className="hidden text-base font-semibold text-white/90 md:inline">
          {user?.branchName || "Pune Branch"}
        </span>

        {/* Profile Avatar with Hover Dropdown */}
        <div className="relative group py-2">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-blue-500 shadow transition-transform group-hover:scale-105 cursor-pointer"
          >
            <User className="h-6 w-6" />
          </button>

          {/* Hover Dropdown Menu */}
          <div className="absolute right-0 top-full hidden w-44 rounded-xl border border-slate-100 bg-white p-1.5 shadow-xl shadow-slate-300/50 group-hover:block transition-all duration-200 z-50">
            <Link
              to="/profile"
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-blue-600"
            >
              <UserCircle className="h-4 w-4 text-slate-500" />
              Profile Page
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 cursor-pointer"
            >
              <LogOut className="h-4 w-4 text-red-500" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
