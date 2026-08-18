import {Navigate, Route, Routes} from "react-router-dom";
import LoginPortal from "./Components/Login/Loginportal";
import InquiryLayout from "./Layout/InquiryLayout";
import {useAuth} from "./Context/AuthContext";
import SettingPage from "./Pages/Settings/SettingPage";
import Dashboard from "./Pages/Dashboard/Dashboard";
import ProtectedRoute from "./ProtectedRoutes/ProtectedRoutes";
import AddProduct from "./Pages/Produt/AddProduct";
import OrderPage from "./Pages/Order/OrderPage";
import Shipment from "./Pages/Shipment/Shipment";

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
          </Route>
        </Route>
      </Routes>
    </div>
  );
};

export default App;
