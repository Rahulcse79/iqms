import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "./login.css";
import Cookies from "js-cookie";
import logo from "../assets/Images/login-logo.png";
import { useDispatch, useSelector } from "react-redux";
import { fetchRepliedQueries } from "../actions/repliedQueryAction";
import { fetchPendingQueries } from "../actions/pendingQueryAction";
import { fetchTransferredQueries } from "../actions/transferredQueryAction";
import Loader from "../components/Loader";
import { UserRole } from "../constants/Enum";
import users from "../utils/users.json";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [initializing, setInitializing] = useState(false);
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
    try {
      const response = await fakeLoginAPI(username, password);
      if (response.status === "OK") {
        console.log("Login successfull : ", response);
        const baseUser = response.data.airForceUserDetails;
        const serviceNo = baseUser.airForceServiceNumber;
        const categoryStr = baseUser.airForceCategory; // AIRMEN/OFFICER/CIVILIAN
        const categoryCode = UserRole[categoryStr?.toUpperCase()] ?? null;

        let personalData = null;
        try {
          if (serviceNo && categoryCode !== null) {
            const res = await fetch(
              `http://sampoorna.cao.local/afcao/ipas/ivrs/fetch_pers_data/${serviceNo}/${categoryCode}`
            );
            const data = await res.json();
            if (data?.items?.length > 0) {
              personalData = data.items[0];
            }
          }
        } catch (err) {
          console.error("Error fetching personalData at login:", err);
        }
        response.data.personalData = personalData;

        login(response);

        await dispatch(fetchRepliedQueries());
        const deptPrefix = "U";
        const personnelType = "A";
        const roleDigitForTab = { creator: "1", approver: "2", verifier: "3" };
        const pendingTabs = Object.values(roleDigitForTab).map(
          (digit) => `${deptPrefix}${digit}${personnelType}`
        );
        const tasks = [
          dispatch(fetchRepliedQueries()),
          ...pendingTabs.map((pw) =>
            dispatch(fetchPendingQueries({ cat: 1, pendingWith: pw }))
          ),
          ...pendingTabs.map((pw) =>
            dispatch(fetchTransferredQueries({ cat: 1, pendingWith: pw }))
          ),
        ];
        await Promise.all(tasks);

        setInitializing(false);
        navigate("/");
      } else {
        setInitializing(false);
        console.error("Login error:", response.message);
        setError("Invalid username or password");
      }
    } catch (err) {
      console.error("Login error:", err);
      setInitializing(false);
      setError("Something went wrong. Please try again.");
    }
  };

  if (initializing || loading) {
    return <Loader text="Starting system... Fetching all data, please wait." />;
  }

  return (
    // at top of file (if not already)

    // inside your component render (exactly replace the portion you showed)
    <>
      <div className="login-container-outer" aria-hidden="true"></div>

      {/* Heading with one-time sweep animation — uses CSS only */}
      <h1 className="ivrs-head" aria-hidden="true">
        INTERACTIVE VOICE RESPONSE SYSTEM (IVRS)
      </h1>

      <div className="login-container" role="main">
        {/* Optional left column: subtle illustration / message — keep empty if you want */}

        {/* Login card (kept functionality intact) */}
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
              {/* kept intentionally simple — add "forgot" or "help" buttons here if needed */}
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

async function fakeLoginAPI(username, password) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const user = users.find(
        (u) => u.username === username && u.password === password
      );

      if (user) {
        resolve(user);
      } else {
        resolve({ status: "ERROR", message: "Invalid credentials" });
      }
    }, 1000);
  });
}

export default Login;
