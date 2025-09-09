import React, { useState, useContext } from "react";
import { RiMenuFill } from "react-icons/ri";
import { useNavigate, useLocation } from "react-router-dom";
import "./Topbar.css";
import { fetchRepliedQueries } from "../actions/allAction";
import { GrRefresh } from "react-icons/gr";
import { useDispatch } from "react-redux";
import { AuthContext } from "../context/AuthContext";

const Topbar = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { auth } = useContext(AuthContext);
  const dispatch = useDispatch();
  const [refreshing, setRefreshing] = useState(false);

  // 🟢 Extract roles & categories directly from login data
  const roles = auth?.user?.airForceUserDetails?.airForceRole_Access || [];
  const categories = auth?.user?.airForceUserDetails?.categoryQuery || [];

  const [selectedRole, setSelectedRole] = useState(roles[0] || "");
  const [searchValue, setSearchValue] = useState("");
  const [searchCategory, setSearchCategory] = useState(categories[0] || "");
  const [searchType, setSearchType] = useState("Service");

  // 🟢 Use already stored personal data from login phase
  const personalData = auth?.user?.personalData || null;

  // Pieces for the pretty line
  const svcPart = personalData
    ? `${personalData.sno}-${personalData.cs}`
    : null;
  const rankNamePart = personalData
    ? `${personalData.rankcd} ${personalData.p_name} ${personalData.trdcd}`
    : null;

  // Fallback if no personalData yet
  const formattedName = personalData
    ? `${svcPart} ${rankNamePart}`
    : auth?.user?.fullName || "Unknown";

  const department =
    auth?.user?.airForceUserDetails?.airForceDepartment?.join(", ") ||
    personalData?.unitcd ||
    "N/A";

  const level = auth?.user?.airForceUserDetails?.airForceLevel?.[0] || "N/A";

  const handleRefreshScreen = async () => {
    setRefreshing(true);
    try {
      // force a fresh fetch from server (this will dispatch REPLIED_QUERY_SUCCESS on success)
      await dispatch(fetchRepliedQueries());
    } catch (err) {
      console.error("Manual refresh failed", err);
    } finally {
      setRefreshing(false);
    }
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

    const state = {};
    if (!location.pathname.startsWith("/search-results")) {
      state.from = location.pathname + location.search;
    }

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
            <option value="">Select Category</option>
            {categories.map((cat, idx) => (
              <option key={idx} value={cat}>
                {cat}
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
        </div>

        {/* ✅ Right-aligned user info card */}
        <div className="topbar-right">
          <div
            className="user-card"
            title={`${formattedName}\n${level}\nDept: ${department}`}
          >
            {personalData ? (
              <div className="user-primary">
                <span className="svcno">{svcPart}</span>
                <span className="rankname">{rankNamePart}</span>
              </div>
            ) : (
              <span className="user-primary">{formattedName}</span>
            )}

            <div className="user-meta">
              <span className="badge badge-level">{level}</span>
              <span className="dot">•</span>
              <span className="badge badge-dept">{department}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
