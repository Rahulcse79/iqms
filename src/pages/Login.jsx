import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { USERS } from "../utils/constants";
import { AuthContext } from "../context/AuthContext";
import "./login.css";
import Cookies from "js-cookie";
import logo from "../assets/Images/login-logo.png";
import { useDispatch, useSelector } from "react-redux";
import { fetchRepliedQueries } from "../actions/allAction";
import { userRoleOptions, UserRoleLabel } from "../constants/Enum";
import Loader from "../components/Loader";

const Login = () => {
  const [category, setCategory] = useState("Civilian");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [initializing, setInitializing] = useState(false); // 🔹 new state
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { loading } = useSelector((state) => state.replied_queries); // optional check

  useEffect(() => {
    const authUser = Cookies.get("authUser");
    if (authUser) {
      navigate("/app2");
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const foundUser = USERS.find(
        (u) => u.username === username && u.password === password
      );

      if (foundUser) {
        setInitializing(true); // 🔹 show loader
        await login(foundUser);

        // fetch all initial APIs here
        await dispatch(fetchRepliedQueries());

        setInitializing(false); // 🔹 hide loader
        navigate("/");
      } else {
        setError("Invalid username or password");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Something went wrong. Please try again.");
      setInitializing(false);
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
            <div className="form-group">
              <label htmlFor="category">Select Category</label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(Number(e.target.value))} // store as number
                className="login-select"
              >
                <option value="">-- Select --</option>
                {userRoleOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
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

export default Login;
