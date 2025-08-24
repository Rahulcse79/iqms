import React from 'react';

export default function SearchSection({ serviceNo, setServiceNo, handleSearch }) {
  return (
    <form className="search-section" onSubmit={handleSearch}>
      <div className="form-group">
        <label htmlFor="system">System</label>
        <select id="system" defaultValue="LIVE">
          <option>LIVE</option>
          <option>NC</option>
        </select>
      </div>
      <div className="form-group">
        <label htmlFor="category">Category</label>
        <select id="category" defaultValue="Airmen">
          <option>Airmen</option>
          <option>Officer</option>
        </select>
      </div>
      <div className="form-group">
        <label htmlFor="service-no">Enter Service Number</label>
        <input
          type="text"
          id="service-no"
          placeholder="e.g., 789123-A"
          value={serviceNo}
          onChange={(e) => setServiceNo(e.target.value)}
        />
      </div>
      <button type="submit" className="submit-btn">Submit</button>
    </form>
  );
}
