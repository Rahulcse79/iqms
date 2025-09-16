import React, { useState, useContext, useMemo, useEffect } from "react";
import { RiMenuFill } from "react-icons/ri";
import { useNavigate, useLocation } from "react-router-dom";
import { GrRefresh } from "react-icons/gr";
import useTheme from "../hooks/useTheme";
import "./Topbar.css";
import { useDataRefresher } from "../hooks/useDataRefresher";

const Topbar = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshing, refreshData } = useDataRefresher();
  const [errorPlaceholder, setErrorPlaceholder] = useState("");
  const [isError, setIsError] = useState(false);
  const [fullProfile, setFullProfile] = useState(null);
  const [airForceProfile, setAirForceProfile] = useState(null);

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

  const categories = airForceProfile?.categoryQuery || [
    "AIRMEN, OFFICER, CIVILIAN",
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
    // 🔜 Later: trigger redux update or API calls based on this portfolio
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

  return (
    <header className="topbar">
      <div className="topbar-content">
        {/* Left: Sidebar + Portfolio */}
        <div className="topbar-left">
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            <RiMenuFill />
          </button>
          <label htmlFor="portfolioDropdown">Portfolio: </label>
          <select
            id="portfolioDropdown"
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

        {/* Middle: Refresh + Search */}
        <div className="refresh-container">
          <GrRefresh
            className={`refresh-button-api ${refreshing ? "spinning" : ""}`}
            onClick={handleRefreshScreen}
          />
        </div>

        <div className="topbar-center">
          <select
            value={searchCategory}
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
          >
            <option value="Service">Service No.</option>
            <option value="Query">Query</option>
          </select>
          <input
            type="text"
            placeholder={
              errorPlaceholder ||
              (searchType === "Query" ? "Enter Query ID" : "Enter Service No.")
            }
            value={searchValue}
            onChange={handleSearchInputChange}
            className={isError ? "input-error" : ""}
          />
          <button onClick={handleSearch}>Search</button>
        </div>

        {/* Right: User + Theme */}
        <div className="topbar-right">
          <div
            className="theme-toggle"
            onClick={toggleTheme}
            role="button"
            aria-label="Toggle theme"
            title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          >
            {theme === "dark" ? "🌙 Dark" : "🌤 Light"}
          </div>

          <div
            className="user-card"
            title={fullProfile?.LOGIN_NAME || "Unknown"}
          >
            <span className="user-primary">
              {fullProfile?.LOGIN_NAME || "No Name"}
            </span>
            {selectedPortfolio && (
              <div className="user-meta">
                <span className="badge badge-role">
                  {selectedPortfolio.USER_ROLE}
                </span>
                <span className="dot">•</span>
                <span className="badge badge-module">
                  {selectedPortfolio.SUB_SECTION}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
