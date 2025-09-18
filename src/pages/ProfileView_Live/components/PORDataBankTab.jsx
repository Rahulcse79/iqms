import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { fetchPorData } from "../../../actions/ProfileAction";
import { UserRole } from "../../../constants/Enum"; 
import "./PORDataTable.css";

export default function PORDataTable() {
  const dispatch = useDispatch();
  const { loading, error, porList } = useSelector((state) => state.porData);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedRow, setSelectedRow] = useState(null);

  // Extract query params from URL
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const sno = queryParams.get("q");
  const catStr = queryParams.get("category");
  const cat = UserRole[catStr] !== undefined ? UserRole[catStr] : null;

  useEffect(() => {
    if (sno && cat !== null) {
      dispatch(fetchPorData({ sno, cat, porYear: selectedYear }));
    }
  }, [dispatch, sno, cat, selectedYear]);

  const records = Array.isArray(porList)
    ? porList.filter((item) => item.PORNO)
    : [];

  const handleBack = () => setSelectedRow(null);

  return (
    <div className="por-container">
      <div className="year-picker">
        <label>Select Year: </label>
        <input
          type="number"
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          min="2000"
          max={new Date().getFullYear()}
        />
      </div>

      {loading && <p className="info-text" style={{color:"var(--text)"}}>Loading POR data...</p>}
      {error && <p className="error-text">Error: {error}</p>}
      {!loading && records.length === 0 && (
        <p className="info-text">No POR records found for {selectedYear}.</p>
      )}

      {!selectedRow && records.length > 0 && (
        <table className="por-table">
          <thead>
            <tr>
              <th>PORYEAR</th>
              <th>PORNO</th>
              <th>POROCC</th>
              <th>POR_DETAILS</th>
              <th>POR_CODE</th>
              <th>OCC_NAME</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {records.map((row, index) => (
              <tr key={index}>
                <td>{row.PORYEAR}</td>
                <td>{row.PORNO}</td>
                <td>{row.POROCC}</td>
                <td>{row.POR_DETAILS}</td>
                <td>{row.POR_CODE}</td>
                <td>{row.OCC_NAME}</td>
                <td>
                  <button
                    className="view-btn"
                    onClick={() => setSelectedRow(row)}
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {selectedRow && (
        <div className="details-view">
          <h2>POR Details</h2>
          <table>
            <tbody>
              {Object.entries(selectedRow).map(([key, value]) => (
                <tr key={key}>
                  <td className="key">{key}</td>
                  <td className="value">{value !== null ? value : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="back-btn" onClick={handleBack}>
            Back
          </button>
        </div>
      )}
    </div>
  );
}
