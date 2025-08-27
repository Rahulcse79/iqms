import React, { useState, useContext , useEffect} from "react";
import { useNavigate } from "react-router-dom";
import { USERS } from "../utils/constants";
import { AuthContext } from "../context/AuthContext";
import "./login.css";
import Cookies from "js-cookie"; 
import logo from "../assets/Images/login-logo.png";

const Login = () => {
  
  const [category, setCategory] = useState("Civilian");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const authUser = Cookies.get("authUser"); 
    if (authUser) {
      navigate("/"); 
      window.location.reload()
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const foundUser = USERS.find(
        (u) => u.username === username && u.password === password
      );
      if (foundUser) {
        await login(foundUser);
        navigate("/");
        window.location.reload();
      } else {
        setError("Invalid username or password");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Something went wrong. Please try again.");
    }
  };


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
                onChange={(e) => setCategory(e.target.value)}
                className="login-select"
              >
                <option value="Civilian">Civilian</option>
                <option value="Officer">Officer</option>
                <option value="Airmen">Airmen/ NCS(E)</option>
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
