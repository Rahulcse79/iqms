import React, { useState } from "react";
import { RiMenuFill } from "react-icons/ri";
import "./Topbar.css";

const Topbar = ({ toggleSidebar }) => {
  const [selectedRole, setSelectedRole] = useState("Admin");
  const [searchValue, setSearchValue] = useState("");

  // State for the first dropdown
  const [searchCategory, setSearchCategory] = useState("Airmen");
  // State for the second dropdown (Service No. vs Query)
  const [searchType, setSearchType] = useState("Service");

  const roles = [
    "Admin",
    "Manager",
    "Operator",
    "Viewer",
    "Supervisor",
    "Coordinator",
    "Technician",
    "Guest",
  ];
  const userInfo = {
    name: "John Doe",
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
    console.log(
      `Searching for ${searchType}: "${searchValue}" in Category: ${searchCategory}`
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

        {/* Center: Search */}
        <div className="topbar-center">
          <select
            value={searchCategory}
            onChange={(e) => setSearchCategory(e.target.value)}
          >
            <option value="Airmen">Airmen</option>
            {/* Add other categories here if needed */}
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
            // The placeholder is now dynamic based on the 'searchType' state
            placeholder={
              searchType === "Query" ? "Enter Query ID" : "Enter Service No."
            }
            value={searchValue}
            onChange={handleSearchInputChange}
          />
          <button onClick={handleSearch}>Search</button>
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
