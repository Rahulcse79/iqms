import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "./login.css";
import Cookies from "js-cookie";
import logo from "../assets/Images/login-logo.png";
import { useDispatch, useSelector } from "react-redux";
import { fetchRepliedQueries } from "../actions/allAction";
import Loader from "../components/Loader";

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
    const authUser = Cookies.get("authUser");
    localStorage.removeItem("queryDrafts_v2");
    if (authUser) {
      navigate("/app2");
    }
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
        login(response);
        await dispatch(fetchRepliedQueries());
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
    <div className="login-container">
      <div className="login-header">
        <img src={logo} alt="CRM Logo" className="login-logo" />
      </div>
      <div className="login-box">
        <h2 className="login-title">IQMS Login</h2>
        {error && <p className="error-text">{error}</p>}
        <form className="login-form" onSubmit={handleSubmit}>
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
          <button type="submit" className="login-btn">
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

async function fakeLoginAPI(username, password) {
  return new Promise((resolve) =>
    setTimeout(() => {
      if (username === "916369" && password === "Sri@v.369") {
        resolve({
          status: "OK",
          message: "Authenticated",
          data: {
            token: "abc123",
            refreshToken: "refresh123",
            userId: 139,
            userName: "916369",
            fullName: "Srikanth Vrutti",
            roles: ["ROLE_AGENT"],
            roleId: [34],
            extension: "4000",
            airForceUserDetails: {
              airForceServiceNumber: "916369",
              airForceCategory: "AIRMEN",
              airForceDepartment: ["CQC"],
              airForceLevel: ["CLERK"],
              airForceRole_Access: [
                "ASP-I",
                "ASP-II",
                "ASP-III",
                "ASP-IV",
                "ASP-V",
                "ASP-VI",
                "ASP-VII",
                "ASP-VIII",
              ],
              categoryQuery: ["OFFICER", "CIVILIAN", "AIRMEN"],
            },
            sipPhoneButton: {
              mute: true,
              hold: true,
              crm: true,
            },
          },
        });
      } else {
        resolve({ status: "ERROR", message: "Invalid credentials" });
      }
    }, 1000)
  );
}

export default Login;
