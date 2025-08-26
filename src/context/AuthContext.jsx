import React, { createContext, useState, useEffect } from "react";
import Cookies from "js-cookie";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = Cookies.get("authUser");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const login = (userData) => {
    setUser(userData);
    Cookies.set("authUser", JSON.stringify(userData), { expires: 7, path: "/" });
  };

  const logout = () => {
    setUser(null);
    Cookies.remove("authUser", { path: "/" });
  };

  // Keep React state synced with cookie changes (e.g., if user manually clears cookies)
  useEffect(() => {
    const syncUser = () => {
      const storedUser = Cookies.get("authUser");
      setUser(storedUser ? JSON.parse(storedUser) : null);
    };

    window.addEventListener("storage", syncUser); 
    return () => window.removeEventListener("storage", syncUser);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
