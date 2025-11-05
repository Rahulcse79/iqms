import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./SearchQuery.css";
import { AuthContext } from "../context/AuthContext";

const SearchQuery = () => {
  const [activeTab, setActiveTab] = useState("serviceNumber");
  const [serviceNumber, setServiceNumber] = useState("");
  const [queryID, setQueryID] = useState("");
  const [error, setError] = useState("");
  const [airForceProfile, setAirForceProfile] = useState(null);

  useEffect(() => {
    try {
      const storedAFUser = localStorage.getItem("airForceUserDetails");

      if (storedAFUser) setAirForceProfile(JSON.parse(storedAFUser));
    } catch (err) {
      console.warn("Failed to load extended user profile:", err);
    }
  }, []);

  const categories = airForceProfile?.categoryQuery || [
    "AIRMEN",
    "OFFICER",
    "CIVILIAN",
  ];
  const [category, setCategory] = useState(categories[0] || "");

  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    setError("");

    if (activeTab === "serviceNumber") {
      if (!serviceNumber.trim()) {
        setError("Please enter a Service Number");
        return;
      }
      navigate(
        `/search-results?type=Service&category=${encodeURIComponent(
          category
        )}&q=${serviceNumber}`
      );
    } else if (activeTab === "queryID") {
      if (!queryID.trim()) {
        setError("Please enter a Query ID");
        return;
      }
      navigate(`/search-results?type=Query&q=${queryID}`);
    }
  };

  return (
    <div className="search-query-container">
      <div className="tab-buttons">
        <button
          onClick={() => {
            setActiveTab("serviceNumber");
            setError("");
          }}
          className={`tab-button ${
            activeTab === "serviceNumber" ? "active" : ""
          }`}
        >
          Search by Service Number
        </button>
        <button
          onClick={() => {
            setActiveTab("queryID");
            setError("");
          }}
          className={`tab-button ${activeTab === "queryID" ? "active" : ""}`}
        >
          Search by Query ID
        </button>
      </div>

      {activeTab === "serviceNumber" && (
        <div className="tab-content">
          <h3 style={{ color: "var(--text)" }}>Search by Service Number</h3>
          <form className="search-form" onSubmit={handleSearch}>
            <label>
              Category:
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
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
            </label>
            <label>
              Service Number:
              <input
                type="text"
                placeholder="Enter Service Number"
                value={serviceNumber}
                onChange={(e) => setServiceNumber(e.target.value)}
              />
            </label>
            {error && <span className="error-message">{error}</span>}
            <button type="submit" className="search-btn">
              Search
            </button>
          </form>
        </div>
      )}

      {activeTab === "queryID" && (
        <div className="tab-content">
          <h3 style={{ color: "var(--text)" }}>Search by Query ID</h3>
          <form className="search-form" onSubmit={handleSearch}>
            <label>
              Query ID:
              <input
                type="text"
                placeholder="Enter Query ID"
                value={queryID}
                onChange={(e) => setQueryID(e.target.value)}
              />
            </label>
            {error && <span className="error-message">{error}</span>}
            <button type="submit" className="search-btn">
              Search
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default SearchQuery;
