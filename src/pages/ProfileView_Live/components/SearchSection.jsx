import React from "react";
import "./SearchSection.css"; // updated stylesheet

export default function SearchSection({
  serviceNo,
  setServiceNo,
  category,
  setCategory,
  handleSearch,
}) {
  return (
    <form className="search-section" onSubmit={handleSearch}>
      <div className="form-group">
        <label htmlFor="system">System</label>
        <select id="system" defaultValue="LIVE" className="form-select">
          <option>LIVE</option>
          <option>NC</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="category">Category</label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="form-select"
        >
          <option value="1">Airmen</option>
          <option value="0">Officer</option>
          <option value="2">Civilian</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="service-no">Enter Service Number</label>
        <input
          type="text"
          id="service-no"
          placeholder="e.g., 123456"
          value={serviceNo}
          onChange={(e) => setServiceNo(e.target.value)}
          className="form-input"
        />
      </div>

      <button type="submit" className="submit-btn">
        Submit
      </button>
    </form>
  );
}
