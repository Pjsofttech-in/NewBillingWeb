import { useState } from "react";
import { useForm } from "react-hook-form";
import PortalGrid from "./PortalGrid";
import AccessNav from "./AccessNav";
import BrandMark from "./BrandMark";
import LoginPanel from "./Loginpanel";
import { authTabs } from "../../data/AuthTabs";
import { useNavigate } from "react-router-dom";
import { loginUserApi } from "../../api/authApi";
import { useAuth } from "../../Context/AuthContext";

export default function LoginPortal() {
  const [activeId, setActiveId] = useState(authTabs[0].id);
  const activeTab = authTabs.find((t) => t.id === activeId) ?? authTabs[0];

  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const handleFormSubmit = async (data) => {
    setIsLoading(true);
    try {
      const response = await loginUserApi({
        portal: activeTab.id,
        credentials: data,
      });

      if (response?.token) {
        login(response);
        reset();
        navigate("/", { replace: true });
      } else {
        alert("Login Failed! Invalid credentials.");
      }
    } catch (error) {
      alert(
        error?.message === "Invalid Credentials"
          ? "Invalid Credentials! Please check your username and password."
          : error?.response?.data || "Login failed! Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-50 p-6 font-sans">
      {/* Background Grid Pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-100"
        style={{
          backgroundImage: `
            linear-gradient(to right, #EEF1F8 1px, transparent 1px),
            linear-gradient(to bottom, #EEF1F8 1px, transparent 1px)
          `,
          backgroundSize: "44px 44px",
        }}
      />

      <div className="relative z-10 flex flex-col items-center justify-center gap-6 md:flex-row md:items-stretch">
        {/* Left Side: Application Portals Grid */}
        <div className="flex">
          <PortalGrid />
        </div>

        {/* Right Side Card */}
        <div className="flex w-full md:w-195 overflow-hidden rounded-[28px] bg-white shadow-xl shadow-slate-200/70 border border-slate-100/80">
          {/* Left Navigation Sidebar */}
          <div className="flex w-55 shrink-0 flex-col justify-between border-r border-slate-200 py-6 bg-slate-50">
            <div className="flex flex-col gap-4 w-full">
              <div className="px-6 py-2 border-b border-slate-200">
                <BrandMark />
              </div>

              <AccessNav
                tabs={authTabs}
                activeTab={activeTab}
                onSelect={setActiveId}
              />
            </div>

            <div className="px-6 pt-4 border-t border-slate-200">
              <p className="text-[10px] font-medium tracking-wide text-slate-400">
                © 2026 PJSOFTTECH PVT. LTD.
              </p>
            </div>
          </div>

          {/* Right Login Panel Container */}
          <div className="flex flex-1 items-center justify-center bg-white p-10">
            <LoginPanel
              tab={activeTab}
              register={register}
              errors={errors}
              onSubmit={handleSubmit(handleFormSubmit)}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}