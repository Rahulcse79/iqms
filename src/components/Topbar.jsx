import React, { useState, useMemo, useEffect, useRef } from "react";
import { RiMenuFill } from "react-icons/ri";
import { FaUserCircle } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import { GrRefresh } from "react-icons/gr";
import useTheme from "../hooks/useTheme";
import "./Topbar.css";
import { useDataRefresher } from "../hooks/useDataRefresher";
import { getUserRoleLabel } from "../constants/Enum";

/**
 * Topbar
 *
 * - preserves all existing functionality (search, portfolio, refresh, theme).
 * - replaces the visible username with a profile icon which opens a small popup
 *   containing the user details and portfolio info.
 */
const Topbar = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshing, refreshData } = useDataRefresher();
  const [errorPlaceholder, setErrorPlaceholder] = useState("");
  const [isError, setIsError] = useState(false);
  const [fullProfile, setFullProfile] = useState(null);
  const [airForceProfile, setAirForceProfile] = useState(null);

  // Profile popup state & refs
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileButtonRef = useRef(null);
  const profilePopupRef = useRef(null);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("userDetails");
      const storedAFUser = localStorage.getItem("airForceUserDetails");

      if (storedUser) setFullProfile(JSON.parse(storedUser));
      if (storedAFUser) setAirForceProfile(JSON.parse(storedAFUser));
    } catch (err) {
      console.warn("Failed to load extended user profile:", err);
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

  /** ✅ Extract portfolios directly from normalized userDetails */
  const portfolios = useMemo(() => {
    if (!fullProfile) return [];
    return fullProfile.LOGIN_PORTFOLIO || [];
  }, [fullProfile]);

  const [selectedPortfolio, setSelectedPortfolio] = useState(
    portfolios.length > 0 ? portfolios[0] : null
  );

  /** 🔄 Manual Refresh */
  const handleRefreshScreen = async () => {
    navigate("/");
    await refreshData();
  };

  /** 🔄 Portfolio Change */
  const handlePortfolioChange = (e) => {
    const selected = portfolios.find(
      (p) => p.PORTFOLIO_NAME === e.target.value
    );
    setSelectedPortfolio(selected || null);
    console.log("Switched to portfolio:", selected);
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
            className="control portfolio-dropdown"
            value={selectedPortfolio?.PORTFOLIO_NAME || ""}
            onChange={handlePortfolioChange}
            disabled={portfolios.length === 0}
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
        </div>

        {/* Refresh Button */}
        <div className="refresh-container">
          <GrRefresh
            className={`refresh-button-api control ${
              refreshing ? "spinning" : ""
            }`}
            onClick={handleRefreshScreen}
            title="Refresh data"
            aria-label="Refresh"
          />
        </div>

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
                  minWidth: 280,
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
                    marginBottom: 8,
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

                <div style={{ display: "grid", gap: 8, marginBottom: 6 }}>
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
                    label="Module"
                    value={selectedPortfolio?.SUB_SECTION || ""}
                  />
                  <ProfileRow
                    label="Portfolio"
                    value={selectedPortfolio?.PORTFOLIO_NAME || ""}
                  />
                  <ProfileRow
                    label="Category"
                    value={getUserRoleLabel(fullProfile.LOGIN_CAT)}
                  />{" "}
                  {/* ✅ Enum mapping */}
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    justifyContent: "flex-end",
                    marginTop: 6,
                  }}
                ></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
