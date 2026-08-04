import {Outlet, useLocation} from "react-router-dom";
import Navbar from "../Components/Navbar";
import Sidebar from "../Components/Sidebar";
import InquiryHeader from "../Header/InquiryHeader";
import Footer from "../Components/Footer";

const InquiryLayout = () => {
  const location = useLocation();

  const isProfilePage = location.pathname === "/profile";

  return (
    <div className="flex h-screen w-full flex-col bg-slate-100 font-sans overflow-hidden">
      {/* Top Main Navbar */}
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <div className="flex flex-1 flex-col overflow-y-auto">
          {!isProfilePage && <InquiryHeader />}

          <main className="flex-1 p-4 sm:p-6">
            <Outlet />
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default InquiryLayout;
