import {useState} from "react";
import SettingsSidebar from "./SettingsSidebar";

import AddProductType from "./product/AddProductType";
import AddUnitType from "./Unit/AddUnitType";
import AddBrand from "./Brand/AddBrand";
import AddVendor from "./util/AddVendor";
import AddCustomer from "./Customer/AddCustomer";
import StoreSettings from "./Store/StoreSettings";
import AttributeManager from "./Attribute/AttributeManager";

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
      <div className="flex-1 rounded-2xl bg-white p-6 shadow-sm border border-slate-200 min-w-0">
        {activeTab === "vendor" && <AddVendor />}

        {activeTab === "customer" && <AddCustomer />}

        {activeTab === "BrandName" && <AddBrand />}

        {activeTab === "UnitType" && <AddUnitType />}

        {activeTab === "productType" && <AddProductType />}

        {activeTab === "attributes" && <AttributeManager />}

        {activeTab === "storeSettings" && <StoreSettings />}
      </div>
    </div>
  );
};

export default SettingPage;
