import {useEffect, useRef, useState} from "react";
import {User, LogOut, UserCircle} from "lucide-react";
import {Link, useNavigate} from "react-router-dom";
import {useAuth} from "../Context/AuthContext";

const Navbar = () => {
  const navigate = useNavigate();
  const {logout, user} = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close the profile menu on an outside tap / click and on Escape
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onPointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate("/login", {replace: true});
  };

  return (
    <header className="relative z-30 flex h-14 w-full shrink-0 items-center justify-between gap-2 bg-blue-500 px-3 text-white shadow-md shadow-blue-900/20 sm:h-16 sm:px-6 lg:h-18">
      {/* Brand / logo: small on phones, full size from sm up */}
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white/80 bg-blue-900 shadow-sm sm:h-12 sm:w-12 lg:h-16 lg:w-16" />
        <h1 className="truncate text-sm font-bold tracking-wide sm:text-lg lg:text-2xl">
          {user?.instituteName || "Sant Gadagebaba Progressive School"}
        </h1>
      </div>

      <div className="flex shrink-0 items-center gap-3 sm:gap-4">
        <span className="hidden text-base font-semibold text-white/90 md:inline">
          {user?.branchName || "Pune Branch"}
        </span>

        {/* Profile menu: opens on tap / click */}
        <div
          className="relative"
          ref={menuRef}
        >
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Profile menu"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white text-blue-500 shadow transition-transform hover:scale-105 sm:h-10 sm:w-10"
          >
            <User className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full z-50 mt-2 w-44 rounded-xl border border-slate-100 bg-white p-1.5 shadow-xl shadow-slate-300/50"
            >
              <Link
                to="/profile"
                role="menuitem"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-blue-600"
              >
                <UserCircle className="h-4 w-4 text-slate-500" />
                Profile Page
              </Link>

              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 text-red-500" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
