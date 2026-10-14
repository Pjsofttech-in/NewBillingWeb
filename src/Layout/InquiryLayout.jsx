import {Suspense} from "react";
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

      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar />

        <div className="flex flex-1 flex-col overflow-y-auto w-full min-w-0">
          {!isProfilePage && <InquiryHeader />}

          <main className="flex-1 p-2 sm:p-4 w-full">
            <Suspense
              fallback={
                <div className="flex items-center justify-center py-16">
                  <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-blue-600" />
                </div>
              }
            >
              <Outlet />
            </Suspense>
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default InquiryLayout;
