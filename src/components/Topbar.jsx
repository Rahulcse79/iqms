// src/components/Topbar.jsx
import React, { useState } from "react";
import { RiMenuFill } from "react-icons/ri";
import { useNavigate, useLocation } from "react-router-dom";
import "./Topbar.css";
import { userRoleOptions } from "../constants/Enum";
import { useCall } from "../context/CallContext";
import { GrRefresh } from "react-icons/gr";

const Topbar = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedRole, setSelectedRole] = useState("Admin");
  const [searchValue, setSearchValue] = useState("");
  const [searchCategory, setSearchCategory] = useState("Airmen");
  const [searchType, setSearchType] = useState("Service");
  const { api } = useCall();

  const roles = [
    "ASP - I",
    "ASP - II",
    "ASP - III",
    "ASP - IV",
    "ASP - V",
    "ASP - VI",
    "ASP - VII",
    "ASP - VIII",
  ];

  const userInfo = {
    name: "Admin",
    designation: "System Admin",
    email: "123456",
  };

  const handleRefreshScreen = () => {
    navigate("/", { replace: true });
    window.location.reload();
  };

  const handleRoleChange = (e) => {
    setSelectedRole(e.target.value);
    console.log("Switched to role:", e.target.value);
  };

  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchValue(value);

    if (/^\d{6}$/.test(value)) {
      setSearchType("Service");
    } else if (/^\d{8}$/.test(value)) {
      setSearchType("Query");
    }
  };

  const handleSearch = () => {
    if (!searchValue.trim()) {
      alert("Please enter a value to search");
      return;
    }

    const targetPath = `/search-results?category=${encodeURIComponent(
      searchCategory
    )}&type=${encodeURIComponent(searchType)}&q=${encodeURIComponent(
      searchValue.trim()
    )}`;

    if (
      location.pathname + location.search ===
      "/search-results" + targetPath.slice("/search-results".length)
    ) {
      return;
    }

    // Pass caching info through state
    const state = { from: location.pathname + location.search, enableCache: true };

    navigate(targetPath, { state });
  };

  return (
    <header className="topbar">
      <div className="topbar-content">
        <div className="topbar-left">
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            <RiMenuFill />
          </button>
          <label htmlFor="roleDropdown">Switch Role: </label>
          <select
            id="roleDropdown"
            value={selectedRole}
            onChange={handleRoleChange}
          >
            {roles.map((role, index) => (
              <option key={index} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>

        <div className="refresh-container">
          <GrRefresh
            className="refresh-button-api"
            onClick={handleRefreshScreen}
          />
        </div>

        <div className="topbar-center">
          <select
            value={searchCategory}
            onChange={(e) => setSearchCategory(e.target.value)}
          >
            <option value="">Select Role</option>
            {userRoleOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
          >
            <option value="Service">Service No.</option>
            <option value="Query">Query</option>
          </select>
          <input
            type="text"
            placeholder={
              searchType === "Query" ? "Enter Query ID" : "Enter Service No."
            }
            value={searchValue}
            onChange={handleSearchInputChange}
          />
          <button onClick={handleSearch}>Search</button>
          <button onClick={() => api.simulateIncoming()}>Call Trigger</button>
        </div>

        <div className="topbar-right">
          <div className="user-info">
            <span className="user-name">{userInfo.name}</span>
            <span className="user-designation">{userInfo.designation}</span>
            <span className="user-id">{userInfo.email}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
