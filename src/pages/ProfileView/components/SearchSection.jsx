import React, { useState } from "react";
import "./SearchSection.css";

export default function SearchSection({
  serviceNo,
  setServiceNo,
  category,
  setCategory,
  handleSearch,
  defaultServiceNo = "",
  defaultCategory = "1",
}) {
  const hasServiceSetter = typeof setServiceNo === "function";
  const hasCategorySetter = typeof setCategory === "function";

  const [internalServiceNo, setInternalServiceNo] = useState(
    serviceNo ?? defaultServiceNo
  );
  const [internalCategory, setInternalCategory] = useState(
    category ?? defaultCategory
  );

  const currServiceNo = hasServiceSetter ? serviceNo : internalServiceNo;
  const currCategory = hasCategorySetter ? category : internalCategory;

  const changeServiceNo = (val) =>
    hasServiceSetter ? setServiceNo(val) : setInternalServiceNo(val);

  const changeCategory = (val) =>
    hasCategorySetter ? setCategory(val) : setInternalCategory(val);

  const onSubmit = (e) => {
    e.preventDefault();
    handleSearch?.(serviceNo, category);
  };

  return (
    <form className="search-section" onSubmit={onSubmit}>
      <div className="form-group">
        <label htmlFor="system">System</label>
        <select id="system" defaultValue="LIVE" className="form-select">
          <option>LIVE</option>
          <option>NE</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="category">Category</label>
        <select
          id="category"
          value={currCategory}
          onChange={(e) => changeCategory(e.target.value)}
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
          value={currServiceNo}
          onChange={(e) => changeServiceNo(e.target.value)}
          className="form-input"
        />
      </div>

      <button type="submit" className="submit-btn">
        Submit
      </button>
    </form>
  );
}
