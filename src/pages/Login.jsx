import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "./login.css";
import Cookies from "js-cookie";
import logo from "../assets/Images/login-logo.png";
import { useDispatch, useSelector } from "react-redux";
import Loader from "../components/Loader";
import { UserRole, DepartmentMapping } from "../constants/Enum";
import { loginAPI } from "../utils/endpoints";
import { fetchAllUserQueriesNew, getDesignationFlags } from "../utils/helpers";
import CryptoJS from "crypto-js";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [initializing, setInitializing] = useState(false);
  const [initProgress, setInitProgress] = useState({
    step: "idle",
    current: 0,
    total: 0,
    taskName: "",
  });

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { loading } = useSelector((state) => state.replied_queries);

  useEffect(() => {
    localStorage.removeItem("queryDrafts_v2");
    const authData = Cookies.get("authData");
    if (authData) navigate("/");
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInitializing(true);
    setInitProgress({ step: "authenticating", current: 0, total: 1 });

    try {
      const encryptedUsername = encryptData(username);
      const encryptedPassword = encryptData(password);
      const response = await loginAPI(encryptedUsername, encryptedPassword);
      console.log("Login API response:", response.data);

      if (response.data.status !== "OK") {
        setInitializing(false);
        setError(response.data.messageDetail || "Invalid username or password");
        return;
      }
      // As per new API response structure
      const baseData = response.data.data;
      const serviceNo = baseData.userName;
      const categoryStr = baseData.designation;
      const categoryCode = UserRole[categoryStr?.toUpperCase()] ?? null;
      const userDept = baseData.department;
      const deptConfig = DepartmentMapping[userDept];

      if (!serviceNo || categoryCode === null) {
        setInitializing(false);
        setError("Invalid user details. Please contact admin.");
        return;
      }

      if (!deptConfig) {
        setInitializing(false);
        setError(`Unsupported department: ${userDept || "Unknown"}`);
        return;
      }

      console.log("User category code:", categoryCode);
      console.log("User department config:", deptConfig); 
      console.log("User Category string:" + categoryStr + "and user Category code is" + categoryCode);

      setInitProgress({ step: "fetching-user-details", current: 1, total: 4 });

      let userDetails = null;
      try {
        const res = await fetch(
          `http://sampoorna.cao.local/afcao/ipas/ivrs/getUserDetails/${serviceNo}/${categoryCode}`
        );

        if (!res.ok) throw new Error(`API failed with ${res.status}`);
        const data = await res.json();

        if (!data?.USER_DETAILS?.length) {
          throw new Error("No user details found");
        }

        const userObj = data.USER_DETAILS[0];
        if (!userObj.LOGIN_PORTFOLIO || userObj.LOGIN_PORTFOLIO.length === 0) {
          throw new Error("No roles assigned. Access denied.");
        }

        userDetails = userObj;
      } catch (err) {
        console.error("Error fetching user details:", err);
        setInitializing(false);
        setError("Unable to fetch user access roles. Please try again.");
        return;
      }

      // Enrich login response
      baseData.userDetails = userDetails;
      console.log("Fetched user base data :", baseData);

      // Save in context & cookies
      login({ data: baseData, status: response.status });

      setInitProgress({ step: "setting-active-role", current: 2, total: 4 });

      // Set the first portfolio as the default active role
      const firstRole = userDetails.LOGIN_PORTFOLIO[0];
      if (firstRole) {
        try {
          localStorage.setItem("activeRole_v1", JSON.stringify(firstRole));
          console.log("🎯 Default active role set:", firstRole.PORTFOLIO_NAME);

          // Dispatch custom event to notify useActiveRole hook
          window.dispatchEvent(
            new CustomEvent("activeRoleChanged", {
              detail: { newRole: firstRole },
            })
          );
        } catch (err) {
          console.warn("Failed to set default active role:", err);
        }
      }

      setInitProgress({ step: "fetching-designation", current: 3, total: 5 });
      let designationFlags = [];
      try {
        designationFlags = await getDesignationFlags(firstRole);
      } catch (flagError) {
        console.warn(
          "Could not fetch designation flags, transferred queries might be missing.",
          flagError
        );
        // Don't block login if this fails, just log it
      }

      setInitProgress({ step: "fetching-queries", current: 3, total: 4 });

      // Fetch queries using the first (default) active role
      try {
        console.log(
          "🚀 Fetching initial queries for role:",
          firstRole.PORTFOLIO_NAME
        );

        const fetchResult = await fetchAllUserQueriesNew(dispatch, {
          activeRole: firstRole,
          designationFlags: designationFlags, // Use the active role instead of cat/suffix
          onProgress: (progress) => {
            setInitProgress({
              step: "fetching-queries",
              current: progress.current || 0,
              total: progress.total || 0,
              taskName: progress.taskName || "",
              roleName: progress.activeRole || "",
              ...progress,
            });
          },
          onError: (error) => {
            console.warn("Non-critical query fetch error:", error);
          },
        });

        console.log("📊 Initial query fetch summary:", fetchResult);

        if (fetchResult.success) {
          console.log(
            `✅ Initial queries loaded: ${fetchResult.successful}/${fetchResult.total} successful for role: ${firstRole.PORTFOLIO_NAME}`
          );
        } else {
          console.warn(
            "⚠️ Some initial queries failed to fetch, but continuing..."
          );
        }
      } catch (err) {
        console.error("Error fetching initial queries (non-critical):", err);
      }

      setInitProgress({ step: "completed", current: 4, total: 4 });

      // Small delay to show completion
      setTimeout(() => {
        setInitializing(false);
        navigate("/");
      }, 500);
    } catch (err) {
      console.error("Login error:", err);
      setInitializing(false);

      if (err.response) {
        // Handle API errors (like 400 Bad Request)
        const apiError = err.response.data;
        setError(
          apiError.messageDetail ||
            apiError.message ||
            "Login failed. Please check your credentials."
        );
      } else if (err.request) {
        // Handle network errors (request made but no response received)
        setError("Network error. Please check your connection and try again.");
      } else {
        // Handle other errors
        setError("Something went wrong. Please try again.");
      }
    }
  };

  // Enhanced loading text based on progress
  const getLoadingText = () => {
    switch (initProgress.step) {
      case "authenticating":
        return "Authenticating user...";
      case "fetching-user-details":
        return "Fetching user permissions...";
      case "setting-active-role":
        return "Setting up user roles...";
      case "fetching-designation":
        return "Checking user designations...";
      case "fetching-queries":
        return initProgress.roleName
          ? `Loading data for ${initProgress.roleName} (${initProgress.current}/${initProgress.total})`
          : initProgress.taskName
          ? `Loading ${initProgress.taskName} (${initProgress.current}/${initProgress.total})`
          : "Loading queries and data...";
      case "completed":
        return "Setup complete! Redirecting...";
      default:
        return "Starting system... Please wait.";
    }
  };

  if (initializing || loading) {
    return (
      <Loader
        text={getLoadingText()}
        progress={
          initProgress.total > 0
            ? (initProgress.current / initProgress.total) * 100
            : undefined
        }
      />
    );
  }

  return (
    <>
      <div className="login-container-outer" aria-hidden="true"></div>

      <h1 className="ivrs-head" aria-hidden="true">
        INTERACTIVE VOICE RESPONSE SYSTEM (IVRS)
      </h1>

      <div className="login-container" role="main">
        <div className="login-box" role="region" aria-label="Login form">
          <div className="login-header">
            <img src={logo} alt="CRM Logo" className="login-logo" />
          </div>
          <h2 className="login-title">User Login</h2>

          {error && (
            <p className="error-text" role="alert" aria-live="assertive">
              {error}
            </p>
          )}

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="login-input"
                autoComplete="username"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="login-input"
                autoComplete="current-password"
                required
              />
            </div>

            <div className="login-actions">
              <button type="submit" className="login-btn" aria-label="Login">
                Login
              </button>
            </div>

            <div className="login-footer" aria-hidden="true">
              © {new Date().getFullYear()} IVRS — Secure access - Coral Telecom
              Ltd.
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

const encryptData = (data) => {
  const iv = CryptoJS.lib.WordArray.random(16);
  const ciphertext = CryptoJS.AES.encrypt(
    data,
    CryptoJS.enc.Utf8.parse(window.secretKey),
    {
      iv: iv,
      mode: CryptoJS.mode.CFB,
      padding: CryptoJS.pad.Pkcs7,
    }
  );

  return iv.concat(ciphertext.ciphertext).toString(CryptoJS.enc.Base64);
};

export default Login;
