import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { USERS } from "../utils/constants";
import { AuthContext } from "../context/AuthContext";
import "./login.css";
import logo from "../assets/Images/login-logo.png";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    const foundUser = USERS.find(
      (u) => u.username === username && u.password === password
    );
    if (foundUser) {
      login(foundUser);
      navigate("/");
    } else {
      setError("Invalid username or password");
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
          <button type="submit" className="login-btn">Login</button>
        </form>
      </div>
    </div>
  );
};

export default Login;
