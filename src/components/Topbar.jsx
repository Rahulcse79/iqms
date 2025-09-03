import React, { useState } from "react";
import { RiMenuFill } from "react-icons/ri";
import { useNavigate, useLocation } from "react-router-dom";
import "./Topbar.css";
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

  // Auto-detect Service/Query number based on digits
  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchValue(value);

    if (/^\d{6}$/.test(value)) {
      setSearchType("Service"); // 6-digit → Service Number
    } else if (/^\d{8}$/.test(value)) {
      setSearchType("Query"); // 8-digit → Query Number
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

    // Avoid pushing identical URL repeatedly
    if (
      location.pathname + location.search ===
      "/search-results" + targetPath.slice("/search-results".length)
    ) {
      // Already on same search result URL — do nothing
      return;
    }

    // Determine origin (only set `from` when we are not currently on search-results)
    const state = {};
    if (!location.pathname.startsWith("/search-results")) {
      state.from = location.pathname + location.search;
    }

    // Push new entry (not replace) so user can go back through search entries
    navigate(targetPath, { state });
  };

  return (
    <header className="topbar">
      <div className="topbar-content">
        {/* Left: Sidebar Toggle & Role Switch */}
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

        {/* Refresh */}
        <div className="refresh-container">
          <GrRefresh
            className="refresh-button-api"
            onClick={handleRefreshScreen}
          />
        </div>

        {/* Center: Search */}
        <div className="topbar-center">
          <select
            value={searchCategory}
            onChange={(e) => setSearchCategory(e.target.value)}
          >
            <option value="Airmen">Airmen</option>
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

        {/* Right: User Info */}
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
