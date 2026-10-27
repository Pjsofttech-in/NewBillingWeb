import {lazy} from "react";
import {Navigate, Route, Routes} from "react-router-dom";
import LoginPortal from "./Components/Login/Loginportal";
import InquiryLayout from "./Layout/InquiryLayout";
import {useAuth} from "./Context/AuthContext";
const SettingPage = lazy(() => import("./Pages/Settings/SettingPage"));
const Dashboard = lazy(() => import("./Pages/Dashboard/Dashboard"));
import ProtectedRoute from "./ProtectedRoutes/ProtectedRoutes";

import AttributePage from "./Pages/Settings/Attribute/Attributepage";
import SubCategoryManager from "./Pages/Settings/SubCategory/SubCategoryManager";
const AddProduct = lazy(() => import("./Pages/Produt/AddProduct"));
const OrderPage = lazy(() => import("./Pages/Order/OrderPage"));
const Shipment = lazy(() => import("./Pages/Shipment/Shipment"));
const VendorBillPage = lazy(() => import("./Pages/VendorBill/VendorBillPage"));
const DuesPage = lazy(() => import("./Pages/Dues/DuesPage"));

const App = () => {
  const {isAuthenticated} = useAuth();
  return (
    <div className="min-h-screen w-full bg-slate-100 text-slate-900 antialiased">
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate
                to="/"
                replace
              />
            ) : (
              <LoginPortal />
            )
          }
        />

        <Route element={<ProtectedRoute />}>
          <Route
            path="/"
            element={<InquiryLayout />}
          >
            <Route
              index
              element={<Dashboard />}
            />
            <Route
              path="setting"
              element={<SettingPage />}
            />
            <Route
              path="add"
              element={<AddProduct />}
            />
            <Route
              path="order"
              element={<OrderPage />}
            />
            <Route
              path="shipment"
              element={<Shipment />}
            />
            <Route
              path="vendor-bills"
              element={<VendorBillPage />}
            />
            <Route
              path="dues"
              element={<DuesPage />}
            />
            <Route
              path="/product-types/:productTypeId/sub-categories"
              element={<SubCategoryManager />}
            />
            <Route
              path="/product-types/:productTypeId/attributes"
              element={<AttributePage />}
            />
            {/* the navbar "Profile Page" link: store profile lives in Settings */}
            <Route
              path="profile"
              element={
                <Navigate
                  to="/setting"
                  replace
                />
              }
            />
            <Route
              path="*"
              element={
                <Navigate
                  to="/"
                  replace
                />
              }
            />
          </Route>
        </Route>
      </Routes>
    </div>
  );
};

export default App;
