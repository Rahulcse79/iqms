import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./SearchQuery.css";

const SearchQuery = () => {
  const [activeTab, setActiveTab] = useState("serviceNumber");
  const [serviceNumber, setServiceNumber] = useState("");
  const [queryID, setQueryID] = useState("");
  const [category, setCategory] = useState("1"); // default category
  const navigate = useNavigate();

  // 🔹 Function to handle search
  const handleSearch = (e) => {
    e.preventDefault();

    if (activeTab === "serviceNumber" && serviceNumber.trim()) {
      navigate(
        `/search-results?type=Service&category=${category}&q=${serviceNumber}`
      );
    } else if (activeTab === "queryID" && queryID.trim()) {
      navigate(`/search-results?type=Query&q=${queryID}`);
    } else {
      alert("Please enter a valid input");
    }
  };

  return (
    <div className="search-query-container">
      <div className="tab-buttons">
        <button
          onClick={() => setActiveTab("serviceNumber")}
          className={`tab-button ${
            activeTab === "serviceNumber" ? "active" : ""
          }`}
        >
          Search by Service Number
        </button>
        <button
          onClick={() => setActiveTab("queryID")}
          className={`tab-button ${activeTab === "queryID" ? "active" : ""}`}
        >
          Search by Query ID
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "serviceNumber" && (
        <div className="tab-content">
          <h3>Search by Service Number</h3>
          <form className="search-form" onSubmit={handleSearch}>
            <label>
              Category:
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="1">Airmen/ NCS(E)</option>
                {/* Add more categories if available */}
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
            <button type="submit" className="search-btn">
              Search
            </button>
          </form>
        </div>
      )}

      {activeTab === "queryID" && (
        <div className="tab-content">
          <h3>Search by Query ID</h3>
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
