import React, { useState, useMemo, useEffect, useRef } from "react";
import { RiMenuFill } from "react-icons/ri";
import { FaUserCircle } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import { GrRefresh } from "react-icons/gr";
import useTheme from "../hooks/useTheme";
import { useActiveRole } from "../hooks/useActiveRole";
import "./Topbar.css";
import { useDataRefresher } from "../hooks/useDataRefresherNew";
import { getUserRoleLabel } from "../constants/Enum";
import {
  getDesignationFlags,
  fetchQueriesForRoleNew,
} from "../utils/helpers";
import { useDispatch } from "react-redux";

/**
 * Topbar with Enhanced Active Role Management
 *
 * - Manages active role switching with automatic query fetching
 * - Fetches queries whenever role changes
 * - Shows loading states during role switches
 */
const Topbar = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { refreshing, refreshData } = useDataRefresher();
  const [errorPlaceholder, setErrorPlaceholder] = useState("");
  const [isError, setIsError] = useState(false);

  // Role switching states
  const [switchingRole, setSwitchingRole] = useState(false);
  const [switchProgress, setSwitchProgress] = useState({});

  // Use the active role hook
  const {
    activeRole,
    userDetails: fullProfile,
    portfolioOptions: portfolios,
    roleInfo,
    loading: roleLoading,
    error: roleError,
    setActiveRole,
  } = useActiveRole();

  const [airForceProfile, setAirForceProfile] = useState(null);

  // Profile popup state & refs
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileButtonRef = useRef(null);
  const profilePopupRef = useRef(null);

  useEffect(() => {
    try {
      const storedAFUser = localStorage.getItem("airForceUserDetails");
      if (storedAFUser) setAirForceProfile(JSON.parse(storedAFUser));
    } catch (err) {
      console.warn("Failed to load air force user profile:", err);
    }
  }, []);

  // Close profile popup when route changes
  useEffect(() => {
    setIsProfileOpen(false);
  }, [location.pathname, location.search]);

  // Outside click closes the popup
  useEffect(() => {
    function handleClickOutside(e) {
      const target = e.target;
      if (
        isProfileOpen &&
        profilePopupRef.current &&
        profileButtonRef.current &&
        !profilePopupRef.current.contains(target) &&
        !profileButtonRef.current.contains(target)
      ) {
        setIsProfileOpen(false);
      }
    }
    function handleKeyDown(e) {
      if (e.key === "Escape" && isProfileOpen) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isProfileOpen]);

  const categories = airForceProfile?.categoryQuery || [
    "AIRMEN",
    "OFFICER",
    "CIVILIAN",
  ];
  const [searchCategory, setSearchCategory] = useState(categories[0] || "");

  /** 🔄 Manual Refresh */
  const handleRefreshScreen = async () => {
    navigate("/");
    await refreshData();
  };

  /** 🔄 Enhanced Portfolio Change - Now fetches queries for new role */
  const handlePortfolioChange = async (e) => {
    const portfolioName = e.target.value;
    const selected = portfolios.find((p) => p.PORTFOLIO_NAME === portfolioName);

    if (!selected || selected.PORTFOLIO_NAME === activeRole?.PORTFOLIO_NAME) {
      return; // No change needed
    }

    console.log("🔄 Switching role to:", selected.PORTFOLIO_NAME);
    setSwitchingRole(true);
    setSwitchProgress({ step: "switching", roleName: selected.PORTFOLIO_NAME });
    localStorage.removeItem("pendingQueries_v1");
    localStorage.removeItem("transferredQueries_v1");
    navigate("/");

    try {
      // Set the new active role
      const success = setActiveRole(selected);
      if (!success) {
        throw new Error("Failed to set active role");
      }

      console.log("✅ Active role updated successfully");
      setSwitchProgress({
        step: "fetching",
        roleName: selected.PORTFOLIO_NAME,
      });

      console.log("Fetching designation flags for new role...");
      const flags = await getDesignationFlags(selected);

      // Fetch queries for the new role
      const fetchResult = await fetchQueriesForRoleNew(
        dispatch,
        selected,
        flags,
        (progress) => {
          setSwitchProgress({
            step: "fetching",
            roleName: selected.PORTFOLIO_NAME,
            current: progress.current || 0,
            total: progress.total || 0,
            taskName: progress.taskName || "",
            ...progress,
          });
        },
        (error) => {
          console.warn("Non-critical error during role switch:", error);
        }
      );

      console.log(`🎯 Role switch completed:`, fetchResult);

      if (fetchResult.success) {
        console.log(
          `✅ Queries loaded for ${selected.PORTFOLIO_NAME}: ${fetchResult.successful}/${fetchResult.total} successful`
        );

        // Optional: Show success notification
        setSwitchProgress({
          step: "completed",
          roleName: selected.PORTFOLIO_NAME,
          successful: fetchResult.successful,
          total: fetchResult.total,
        });

        window.dispatchEvent(
          new CustomEvent("activeRoleChanged", {
            detail: { newRole: selected },
          })
        );
      } else {
        console.warn(
          `⚠️ Some queries failed for ${selected.PORTFOLIO_NAME}, but role switched successfully`
        );
      }

      // Small delay to show completion
      setTimeout(() => {
        setSwitchingRole(false);
        setSwitchProgress({});
      }, 1000);

      window.dispatchEvent(
        new CustomEvent("activeRoleChanged", {
          detail: { newRole: selected },
        })
      );
    } catch (error) {
      console.error("❌ Error during role switch:", error);
      setSwitchProgress({ step: "error", error: error.message });

      // Reset after showing error
      setTimeout(() => {
        setSwitchingRole(false);
        setSwitchProgress({});
      }, 3000);

      window.dispatchEvent(
        new CustomEvent("activeRoleChanged", {
          detail: { newRole: selected },
        })
      );
    }
  };

  /** 🔍 Search Logic */
  const [searchValue, setSearchValue] = useState("");
  const [searchType, setSearchType] = useState("Service");

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
      setIsError(true);
      setErrorPlaceholder("No input value");
      setSearchValue("");

      setTimeout(() => {
        setIsError(false);
        setErrorPlaceholder("");
      }, 2000);

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

  /** 🌓 Theme */
  const { theme, toggleTheme } = useTheme();

  // Get role switching status text
  const getRoleSwitchingText = () => {
    switch (switchProgress.step) {
      case "switching":
        return `Switching to ${switchProgress.roleName}...`;
      case "fetching":
        return switchProgress.taskName
          ? `Loading ${switchProgress.taskName} (${switchProgress.current}/${switchProgress.total})`
          : `Loading data for ${switchProgress.roleName}...`;
      case "completed":
        return `✅ ${switchProgress.roleName} loaded (${switchProgress.successful}/${switchProgress.total})`;
      case "error":
        return `❌ Error: ${switchProgress.error}`;
      default:
        return "";
    }
  };

  // Small helper to render a profile row if value exists
  const ProfileRow = ({ label, value }) =>
    !value ? null : (
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
          alignItems: "center",
          fontSize: 13,
        }}
      >
        <div style={{ color: "var(--muted)", marginRight: 8 }}>{label}</div>
        <div
          style={{ color: "var(--text)", fontWeight: 600, textAlign: "right" }}
        >
          {value}
        </div>
      </div>
    );

  // Show loading state if role is loading
  if (roleLoading) {
    return (
      <header className="topbar">
        <div className="topbar-content">
          <div style={{ padding: "10px", textAlign: "center" }}>
            Loading user roles...
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="topbar">
      <div className="topbar-content">
        {/* Left: Sidebar + Portfolio */}
        <div className="topbar-left controls-group">
          <button
            className="sidebar-toggle control"
            onClick={toggleSidebar}
            title="Toggle sidebar"
          >
            <RiMenuFill />
          </button>

          <label
            htmlFor="portfolioDropdown"
            className="control"
            style={{ whiteSpace: "nowrap" }}
          >
            Portfolio:
          </label>

          <select
            id="portfolioDropdown"
            className={`control portfolio-dropdown ${
              switchingRole ? "switching" : ""
            }`}
            value={activeRole?.PORTFOLIO_NAME || ""}
            onChange={handlePortfolioChange}
            disabled={portfolios.length === 0 || switchingRole}
            title={switchingRole ? getRoleSwitchingText() : "Select portfolio"}
          >
            {portfolios.length > 0 ? (
              portfolios.map((p, idx) => (
                <option key={idx} value={p.PORTFOLIO_NAME}>
                  {p.PORTFOLIO_NAME} ({p.USER_ROLE})
                </option>
              ))
            ) : (
              <option disabled>No portfolios available</option>
            )}
          </select>

          {/* Role switching indicator */}
          {switchingRole && (
            <div
              className="role-switch-indicator"
              style={{
                fontSize: "11px",
                color: "var(--primary)",
                marginLeft: "8px",
                maxWidth: "200px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
              title={getRoleSwitchingText()}
            >
              {switchProgress.step === "fetching" && "🔄"}{" "}
              {getRoleSwitchingText()}
            </div>
          )}

          {/* Show error if role error exists */}
          {roleError && (
            <div
              style={{
                color: "var(--error)",
                fontSize: "12px",
                marginLeft: "8px",
              }}
              title={roleError}
            >
              ⚠️
            </div>
          )}
        </div>

        {/* Refresh Button */}
        {/* <div className="refresh-container">
          <GrRefresh
            className={`refresh-button-api control ${
              refreshing || switchingRole ? "spinning" : ""
            }`}
            onClick={handleRefreshScreen}
            title={
              switchingRole ? "Role switching in progress..." : "Refresh data"
            }
            aria-label="Refresh"
            style={{
              opacity: switchingRole ? 0.6 : 1,
              cursor: switchingRole ? "not-allowed" : "pointer",
            }}
          />
        </div> */}

        {/* Center: Category + Search */}
        <div className="topbar-center controls-group">
          <select
            value={searchCategory}
            className="control"
            onChange={(e) => setSearchCategory(e.target.value)}
            disabled={categories.length === 0}
          >
            {categories.length > 0 ? (
              categories.map((cat, idx) => (
                <option key={idx} value={cat}>
                  {cat}
                </option>
              ))
            ) : (
              <option disabled>No categories available</option>
            )}
          </select>

          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
            className="control"
          >
            <option value="Service">Service No.</option>
            <option value="Query">Query</option>
          </select>

          <input
            type="text"
            className={`control control--grow ${isError ? "input-error" : ""}`}
            placeholder={
              errorPlaceholder ||
              (searchType === "Query" ? "Enter Query ID" : "Enter Service No.")
            }
            value={searchValue}
            onChange={handleSearchInputChange}
          />

          <button className="control" onClick={handleSearch}>
            Search
          </button>
        </div>

        {/* Right: Theme + Profile Icon */}
        <div
          className="topbar-right controls-group"
          style={{ alignItems: "center" }}
        >
          <div
            className="theme-toggle control"
            onClick={toggleTheme}
            role="button"
            aria-label="Toggle theme"
            title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            style={{ cursor: "pointer", userSelect: "none" }}
          >
            {theme === "dark" ? "🌙 Dark" : "🌤 Light"}
          </div>

          {/* Profile icon + popup */}
          <div
            className="profile-wrapper control"
            style={{ position: "relative", display: "inline-block" }}
            ref={profileButtonRef}
          >
            <button
              className="profile-button"
              onClick={() => setIsProfileOpen((s) => !s)}
              aria-haspopup="dialog"
              aria-expanded={isProfileOpen}
              title="Open profile"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 6,
                borderRadius: "50%",
                border: "1px solid var(--border)",
                background: "transparent",
                cursor: "pointer",
              }}
            >
              <FaUserCircle style={{ fontSize: 28, color: "var(--text)" }} />
            </button>

            {isProfileOpen && (
              <div
                ref={profilePopupRef}
                role="dialog"
                aria-label="User profile"
                className="user-popup user-card"
                style={{
                  position: "absolute",
                  right: 0,
                  top: "calc(100% + 8px)",
                  background: "var(--surface)",
                  color: "var(--text)",
                  border: "1px solid var(--border)",
                  boxShadow: "var(--shadow)",
                  padding: 12,
                  borderRadius: 10,
                  minWidth: 320,
                  zIndex: 2000,
                }}
              >
                {/* Popup header */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{ display: "flex", gap: 8, alignItems: "center" }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "100%",
                        background:
                          "color-mix(in srgb, var(--primary) 10%, transparent)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--primary)",
                        fontWeight: 700,
                      }}
                    >
                      {(fullProfile?.LOGIN_NAME && fullProfile.LOGIN_NAME[0]) ||
                        "U"}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: "var(--text)",
                        }}
                      >
                        {fullProfile?.LOGIN_NAME || "No Name"}
                      </div>
                    </div>
                  </div>

                  {/* Small close button */}
                  <button
                    onClick={() => setIsProfileOpen(false)}
                    aria-label="Close profile"
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--muted)",
                      padding: 6,
                    }}
                    title="Close"
                  >
                    ✕
                  </button>
                </div>

                {/* User Details */}
                <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
                  <ProfileRow
                    label="Service No."
                    value={fullProfile?.LOGIN_SNO}
                  />
                  <ProfileRow
                    label="Rank"
                    value={
                      fullProfile?.RANK ||
                      fullProfile?.RANK_NAME ||
                      fullProfile?.RANK_AND_NAME ||
                      ""
                    }
                  />
                  <ProfileRow label="Dept." value={fullProfile?.MODULE || ""} />
                  <ProfileRow
                    label="Category"
                    value={getUserRoleLabel(fullProfile?.LOGIN_CAT)}
                  />
                </div>

                {/* Active Role Details */}
                {activeRole && (
                  <>
                    <div
                      style={{
                        borderTop: "1px solid var(--border)",
                        paddingTop: 8,
                        marginTop: 8,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: "var(--primary)",
                          marginBottom: 8,
                        }}
                      >
                        Active Role{" "}
                        {switchingRole && (
                          <span style={{ color: "var(--warning)" }}>🔄</span>
                        )}
                      </div>
                      <div style={{ display: "grid", gap: 6 }}>
                        <ProfileRow
                          label="Portfolio"
                          value={activeRole.PORTFOLIO_NAME}
                        />
                        <ProfileRow label="Role" value={activeRole.USER_ROLE} />
                        <ProfileRow
                          label="Sub Section"
                          value={activeRole.SUB_SECTION}
                        />
                        <ProfileRow label="Module" value={activeRole.MODULE} />
                        <ProfileRow
                          label="Level"
                          value={activeRole.PORTFOLIO_LEVEL}
                        />
                        {roleInfo?.cellsAlloted &&
                          roleInfo.cellsAlloted.length > 0 && (
                            <ProfileRow
                              label="Cells"
                              value={`${roleInfo.cellsAlloted.length} assigned`}
                            />
                          )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
