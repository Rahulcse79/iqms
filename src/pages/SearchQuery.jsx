import React, { useState } from "react";

const SearchQuery = () => {
  const [activeTab, setActiveTab] = useState("serviceNumber");

  return (
    <div style={{ padding: "20px" }}>
        
      <div style={{ display: "flex", marginBottom: "20px" }}>
        <button
          onClick={() => setActiveTab("serviceNumber")}
          style={{
            flex: 1,
            padding: "10px",
            backgroundColor: activeTab === "serviceNumber" ? "#007bff" : "#f1f1f1",
            color: activeTab === "serviceNumber" ? "#fff" : "#000",
            border: "1px solid #ccc",
            cursor: "pointer",
          }}
        >
          Search by Service Number
        </button>
        <button
          onClick={() => setActiveTab("queryID")}
          style={{
            flex: 1,
            padding: "10px",
            backgroundColor: activeTab === "queryID" ? "#007bff" : "#f1f1f1",
            color: activeTab === "queryID" ? "#fff" : "#000",
            border: "1px solid #ccc",
            cursor: "pointer",
          }}
        >
          Search by Query ID
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "serviceNumber" && (
        <div>
          <h3>Search by Service Number</h3>
          <form>
            <label>
              Category:
              <select>
                <option value="airmen">Airmen</option>
                <option value="ncs">NCS(E)</option>
              </select>
            </label>
            <br />
            <label>
              Service Number:
              <input type="text" placeholder="Enter Service Number" />
            </label>
            <br />
            <button type="submit">Search</button>
          </form>
        </div>
      )}

      {activeTab === "queryID" && (
        <div>
          <h3>Search by Query ID</h3>
          <form>
            <label>
              Query ID:
              <input type="text" placeholder="Enter Query ID" />
            </label>
            <br />
            <button type="submit">Search</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default SearchQuery;