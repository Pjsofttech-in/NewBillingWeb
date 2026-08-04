import {useState} from "react";
import {AuthContext} from "./AuthContext";

export const AuthProvider = ({children}) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [token, setToken] = useState(
    () => localStorage.getItem("token") || null,
  );

  const login = (loginData) => {
    // Standardizes handling if token string is passed directly or inside an object
    const tokenStr =
      typeof loginData === "string" ? loginData : loginData?.token;
    const userData = loginData?.data || {username: "admin"};

    if (tokenStr) {
      setToken(tokenStr);
      setUser(userData);

      localStorage.setItem("token", tokenStr);
      localStorage.setItem("user", JSON.stringify(userData));
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  const isAuthenticated = Boolean(token);

  return (
    <AuthContext.Provider value={{user, token, isAuthenticated, login, logout}}>
      {children}
    </AuthContext.Provider>
  );
};
