import {useState} from "react";
import SettingsSidebar from "./SettingsSidebar";

import AddCustomer from "./Customer/AddCustomer"; // Adjust path as needed
import AddProductType from "./product/AddProductType";
import AddUnitType from "./Unit/AddUnitType";
import AddBrand from "./Brand/AddBrand";
import AddVendor from "./util/AddVendor";

const SettingPage = () => {
  const [activeTab, setActiveTab] = useState("vendor");

  return (
    <div className="flex gap-6 items-start w-full">
      {/* 1. Sidebar */}
      <div className="shrink-0">
        <SettingsSidebar
          activeTab={activeTab}
          onSelectTab={(tabId) => setActiveTab(tabId)}
        />
      </div>

      {/* 2. Main Content Container */}
      <div className="flex-1 rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
        {activeTab === "vendor" && <AddVendor />}

        {activeTab === "customer" && <AddCustomer />}

        {activeTab === "BrandName" && <AddBrand />}

        {activeTab === "UnitType" && <AddUnitType />}

        {activeTab === "productType" && <AddProductType />}
      </div>
    </div>
  );
};

export default SettingPage;
