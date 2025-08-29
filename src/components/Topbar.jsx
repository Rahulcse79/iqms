import React, { useState } from "react";
import { RiMenuFill } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import "./Topbar.css";
import { useCall } from "../context/CallContext";

const Topbar = ({ toggleSidebar }) => {
  const navigate = useNavigate();
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

  const handleRoleChange = (e) => {
    setSelectedRole(e.target.value);
    console.log("Switched to role:", e.target.value);
  };

  // This function now contains the auto-detection logic
  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchValue(value);

    // Use regex to check for exactly 6 or 8 digits
    if (/^\d{6}$/.test(value)) {
      setSearchType("Service"); // It's a 6-digit Service Number
    } else if (/^\d{8}$/.test(value)) {
      setSearchType("Query"); // It's an 8-digit Query Number
    }
  };

  const handleSearch = () => {
    if (!searchValue.trim()) {
      alert("Please enter a value to search");
      return;
    }
    navigate(
      `/search-results?category=${searchCategory}&type=${searchType}&q=${searchValue}`
    );
  };

  return (
    <header className="topbar">
      <div className="topbar-content">
        {/* Left: Toggle Sidebar & Title */}
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

        {/* Center */}
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
            onChange={(e) => setSearchValue(e.target.value)}
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
