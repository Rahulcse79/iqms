// src/context/AuthContext.js
import React, { createContext, useState, useEffect } from "react";
import Cookies from "js-cookie";
import { clearRepliedQueries } from "../utils/cache";

export const AuthContext = createContext();

/**
 * AuthProvider
 *
 * - Persists a minimal auth cookie: { token, user: { userId, username, fullName, roles } }
 * - Stores the large `userDetails` object (portfolios, etc.) in localStorage as "fullUserProfile"
 * - Uses isAuthLoading to indicate cookie/localStorage rehydration in progress
 */
export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const persistOptions = {
    expires: 7,
    path: "/",
    secure: window.location.protocol === "https:", // only set secure on https
    sameSite: "Lax",
  };

  /**
   * login(loginResponse)
   *
   * - Accepts the API loginResponse (same as before).
   * - Persists minimal cookie and writes the full userDetails to localStorage (if present).
   */
  const login = (loginResponse) => {
    try {
      // Build a minimal auth object for the cookie (keep it small)
      const minimalAuth = {
        token: loginResponse.data.token,
        user: {
          userId: loginResponse.data.userId,
          username: loginResponse.data.userName,
          fullName: loginResponse.data.fullName,
          roles: loginResponse.data.roles || [],
        },
      };

      // Save in memory
      setAuth(minimalAuth);

      // Persist cookie (minimal)
      Cookies.set("authData", JSON.stringify(minimalAuth), persistOptions);

      // If there is a large userDetails object, put it in localStorage
      if (loginResponse.data.userDetails) {
        try {
          localStorage.setItem(
            "userDetails",
            JSON.stringify(loginResponse.data.userDetails)
          );
          localStorage.setItem(
            "airForceUserDetails",
            JSON.stringify(loginResponse.data.airForceUserDetails)
          );
        } catch (err) {
          console.warn("Could not persist userDetails and airForceUserDetails to localStorage:", err);
        }
      }
    } catch (err) {
      console.error("login() failed:", err);
    }
  };

  const logout = () => {
    try {
      localStorage.clear();
    } catch (e) {
      // ignore
    }
    setAuth(null);
    Cookies.remove("authData", { path: "/" });
  };

  // Rehydrate auth from cookie/localStorage — robust with try/catch and a loading flag
  useEffect(() => {
    (async () => {
      try {
        const storedAuth = Cookies.get("authData");
        if (storedAuth) {
          try {
            const parsed = JSON.parse(storedAuth);
            setAuth(parsed);
          } catch (parseErr) {
            console.error("Failed to parse authData cookie:", parseErr);
            Cookies.remove("authData", { path: "/" });
            setAuth(null);
          }
        } else {
          // Optionally attempt a localStorage fallback if you previously used that
          const fallback = localStorage.getItem("persistedAuth");
          if (fallback) {
            try {
              setAuth(JSON.parse(fallback));
            } catch (e) {
              // ignore
            }
          } else {
            setAuth(null);
          }
        }
      } catch (err) {
        console.error("Error rehydrating auth:", err);
        setAuth(null);
      } finally {
        setIsAuthLoading(false);
      }
    })();
  }, []);

  return (
    <AuthContext.Provider value={{ auth, login, logout, isAuthLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
