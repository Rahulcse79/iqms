import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { UserRole } from "../../../constants/Enum";
import axios from "axios";
import "./PORDataTable.css";

const IRLA_API_TOKEN = "IVRSuiyeUnekIcnmEWxnmrostooUZxXYPibnvIVRS"; 

export default function PORDataTable() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [porList, setPorList] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedRow, setSelectedRow] = useState(null);

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const sno = queryParams.get("q");
  const catStr = queryParams.get("category");
  const cat = UserRole[catStr] !== undefined ? UserRole[catStr] : null;

  useEffect(() => {
    const fetchPorData = async () => {
      if (!sno || cat === null) return;

      setLoading(true);
      setError(null);
      setPorList([]);

      try {
        const body = new URLSearchParams({ api_token: IRLA_API_TOKEN });

        const url = `http://175.25.5.7/API/controller.php?viewPor&sno=${sno}&cat=${cat}&porYear=${selectedYear}&requestFrom=PANKH`;

        const response = await axios.post(url, body, {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          timeout: 20000,
        });

        setPorList(response.data || []);
      } catch (err) {
        setError(err?.response?.data?.message || err.message || "Failed to fetch POR data");
      } finally {
        setLoading(false);
      }
    };

    fetchPorData();
  }, [sno, cat, selectedYear]);

  const records = Array.isArray(porList)
    ? porList.filter((item) => item.PORNO)
    : [];

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

      {loading && <p className="info-text" style={{ color: "var(--text)" }}>Loading POR data...</p>}
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
                  <button className="view-btn" onClick={() => setSelectedRow(row)}>
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
          <button className="back-btn" onClick={() => setSelectedRow(null)}>Back</button>
        </div>
      )}
    </div>
  );
}
