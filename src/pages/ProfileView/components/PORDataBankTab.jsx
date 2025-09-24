import React, { useMemo, useState, useCallback } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import "./PORDataTable.css";

const IRLA_API_TOKEN =
  process.env.REACT_APP_IRLA_API_TOKEN || "IVRSuiyeUnekIcnmEWxnmrostooUZxXYPibnvIVRS";

/**
 * PORDataTable
 *
 * - Does NOT auto-fetch on mount or year change.
 * - User must click Search to fetch data.
 * - Unique classnames: prefix `por-dt-` to prevent clashes.
 */
export default function PORDataTable({ sno, cat }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [porList, setPorList] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedRow, setSelectedRow] = useState(null);
  const [lastSearched, setLastSearched] = useState(null);

  // Input change handler (keep year numeric only)
  const handleYearChange = useCallback((e) => {
    const val = e.target.value.replace(/[^\d]/g, "");
    setSelectedYear(val === "" ? "" : Number(val));
  }, []);

  // Validate year before API call
  const isYearValid = useMemo(() => {
    const y = Number(selectedYear);
    const current = new Date().getFullYear();
    return Number.isInteger(y) && y >= 2000 && y <= current;
  }, [selectedYear]);

  // Search button handler — fetch only when user clicks Search
  const handleSearch = useCallback(async () => {
    if (!isYearValid || !sno || cat === null) return;

    setSelectedRow(null);
    setLastSearched({ sno, cat, porYear: selectedYear });
    setLoading(true);
    setError(null);
    setPorList([]);

    try {
      const body = new URLSearchParams({ api_token: IRLA_API_TOKEN });

      const url = `http://175.25.5.7/API/controller.php?viewPor&sno=${sno}&cat=${cat}&porYear=${selectedYear}&requestFrom=PANKH`;

      const response = await axios.post(url, body, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: 10000,
      });

      setPorList(response.data || []);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Failed to fetch POR data"
      );
    } finally {
      setLoading(false);
    }
  }, [sno, cat, selectedYear, isYearValid]);

  const records = useMemo(() => {
    if (!Array.isArray(porList)) return [];
    return porList.filter(
      (item) => item && (item.PORNO || item.PORYEAR) && !item.RESULT
    );
  }, [porList]);

  const handleBack = useCallback(() => setSelectedRow(null), []);

  const formatKey = (k) =>
    (k || "")
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="por-dt-root" role="region" aria-label="POR Data Table">
      <div className="por-dt-controls">
        <div className="por-dt-year">
          <label htmlFor="por-dt-year-input" className="por-dt-label">
            Select Year
          </label>
          <input
            id="por-dt-year-input"
            inputMode="numeric"
            type="text"
            className="por-dt-input"
            value={selectedYear}
            onChange={handleYearChange}
            placeholder={String(new Date().getFullYear())}
            aria-invalid={!isYearValid}
            aria-describedby="por-dt-year-help"
            maxLength={4}
          />
          <select
            className="por-dt-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            {Array.from({ length: new Date().getFullYear() - 1999 }, (_, i) => {
              const year = new Date().getFullYear() - i;
              return (
                <option key={year} value={year}>
                  {year}
                </option>
              );
            })}
          </select>
          <div id="por-dt-year-help" className="por-dt-help">
            Year between 2000 and {new Date().getFullYear()}
          </div>
        </div>

        <div className="por-dt-actions">
          <button
            type="button"
            className="por-dt-btn por-dt-btn--primary"
            onClick={handleSearch}
            disabled={!isYearValid || loading}
            aria-disabled={!isYearValid || loading}
          >
            {loading ? "Searching…" : "Search"}
          </button>
          <button
            type="button"
            className="por-dt-btn por-dt-btn--secondary"
            onClick={() => {
              setSelectedYear(new Date().getFullYear());
              setSelectedRow(null);
              setPorList([]);
              setError(null);
              setLastSearched(null);
            }}
            aria-label="Reset year and view"
          >
            Reset
          </button>
        </div>
      </div>

      {lastSearched && !loading && !error && (
        <div className="por-dt-meta">
          Showing results for {lastSearched.porYear}
        </div>
      )}

      {error && <div className="por-dt-error">Error: {String(error)}</div>}

      {!loading && records.length === 0 && lastSearched && !error && (
        <div className="por-dt-empty">
          No POR records found for {lastSearched.porYear}.
        </div>
      )}

      {loading && <div className="por-dt-loading">Loading POR data…</div>}

      {!selectedRow && records.length > 0 && (
        <div className="por-dt-table-wrapper">
          <table className="por-dt-table" role="table" aria-label="POR records">
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
                <tr key={`${row.SER_NO || row.OCC_ID || index}-${index}`}>
                  <td>{row.PORYEAR ?? "-"}</td>
                  <td>{row.PORNO ?? "-"}</td>
                  <td>{row.POROCC ?? "-"}</td>
                  <td>{row.POR_DETAILS ?? "-"}</td>
                  <td>{row.POR_CODE ?? "-"}</td>
                  <td>{row.OCC_NAME ?? "-"}</td>
                  <td>
                    <button
                      type="button"
                      className="por-dt-btn por-dt-btn--view"
                      onClick={() => setSelectedRow(row)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedRow && (
        <div className="por-dt-details" role="region" aria-label="POR Details">
          <h2 className="por-dt-details__title">POR Details</h2>
          <div className="por-dt-details__table-wrapper">
            <table className="por-dt-details__table">
              <tbody>
                {Object.entries(selectedRow).map(([key, value]) => (
                  <tr key={key}>
                    <td className="por-dt-details__key">{formatKey(key)}</td>
                    <td className="por-dt-details__value">
                      {value !== null && value !== "" ? String(value) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="por-dt-details__actions">
            <button
              type="button"
              className="por-dt-btn por-dt-btn--primary"
              onClick={handleBack}
            >
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

PORDataTable.propTypes = {
  sno: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  cat: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};
