import React, { createContext, useState, useEffect } from "react";
import Cookies from "js-cookie";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(() => {
    const storedAuth = Cookies.get("authData");
    return storedAuth ? JSON.parse(storedAuth) : null;
  });

  const login = (loginResponse) => {
    const authData = {
      token: loginResponse.data.token,
      refreshToken: loginResponse.data.refreshToken,
      user: {
        userId: loginResponse.data.userId,
        username: loginResponse.data.userName,
        fullName: loginResponse.data.fullName,
        roles: loginResponse.data.roles,
        roleId: loginResponse.data.roleId,
        extension: loginResponse.data.extension,
        airForceUserDetails: loginResponse.data.airForceUserDetails,
        permissions: loginResponse.data.sipPhoneButton, // 👈 store feature flags
      },
    };

    setAuth(authData);
    Cookies.set("authData", JSON.stringify(authData), {
      expires: 7,
      path: "/",
      secure: true, // only over https
      sameSite: "Strict",
    });
  };

  const logout = () => {
    setAuth(null);
    Cookies.remove("authData", { path: "/" });
  };

  useEffect(() => {
    const syncAuth = () => {
      const storedAuth = Cookies.get("authData");
      setAuth(storedAuth ? JSON.parse(storedAuth) : null);
    };
    window.addEventListener("storage", syncAuth);
    return () => window.removeEventListener("storage", syncAuth);
  }, []);

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
