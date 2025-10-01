import React, { useMemo, useState, useCallback, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import "./PORDataTable.css";

const IRLA_API_TOKEN =
  process.env.REACT_APP_IRLA_API_TOKEN || "IVRSuiyeUnekIcnmEWxnmrostooUZxXYPibnvIVRS";

export default function PORDataTable({ sno, cat }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [porList, setPorList] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [lastSearched, setLastSearched] = useState(null);

  // Popup state
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupContent, setPopupContent] = useState("");
  const [popupLoading, setPopupLoading] = useState(false);
  const [popupError, setPopupError] = useState(null);

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
    if (!isYearValid || !sno || cat == null) return;

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
        err?.response?.data?.message || err.message || "Failed to fetch POR data"
      );
    } finally {
      setLoading(false);
    }
  }, [sno, cat, selectedYear, isYearValid]);

  // Records to display
  const records = useMemo(() => {
    if (!Array.isArray(porList)) return [];
    return porList.filter(
      (item) => item && (item.PORNO || item.PORYEAR) && !item.RESULT
    );
  }, [porList]);

  // Action: Fetch detailed HTML and open popup
  const handleViewDetails = useCallback(
    async (row) => {
      if (!row?.OCC_ID) return;

      setPopupOpen(true);
      setPopupLoading(true);
      setPopupError(null);
      setPopupContent("");

      try {
        const body = new URLSearchParams({ api_token: IRLA_API_TOKEN });

        const url = `http://175.25.5.7/API/controller.php?viewPorDet&requestFrom=IVRS&occ_det=${row.OCC_ID}&promType=ONLINE&sno=${sno}&cat=${cat}&print=true`;

        const response = await axios.post(url, body, {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          timeout: 10000,
        });

        // Response is HTML string
        setPopupContent(
          typeof response.data === "string" ? response.data : JSON.stringify(response.data)
        );
      } catch (err) {
        setPopupError(
          err?.response?.data?.message || err.message || "Failed to fetch POR details"
        );
      } finally {
        setPopupLoading(false);
      }
    },
    [sno, cat]
  );

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
            disabled={!isYearValid || loading || !sno || cat == null}
            aria-disabled={!isYearValid || loading || !sno || cat == null}
          >
            {loading ? "Searching…" : "Search"}
          </button>
          <button
            type="button"
            className="por-dt-btn por-dt-btn--secondary"
            onClick={() => {
              setSelectedYear(new Date().getFullYear());
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

      {records.length > 0 && (
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
                <tr key={row.SER_NO ?? row.PORNO ?? index}>
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
                      onClick={() => handleViewDetails(row)}
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

      {/* Popup Modal */}
      {popupOpen && (
        <div className="por-dt-popup-overlay" role="dialog" aria-modal="true">
          <div className="por-dt-popup">
            <div className="por-dt-popup-header">
              <h2>POR Details</h2>
              <button
                className="por-dt-btn por-dt-btn--close"
                onClick={() => setPopupOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="por-dt-popup-body">
              {popupLoading && <div>Loading details…</div>}
              {popupError && <div className="por-dt-error">{popupError}</div>}
              {!popupLoading && !popupError && popupContent && (
                <div
                  className="por-dt-popup-content"
                  dangerouslySetInnerHTML={{ __html: popupContent }}
                />
              )}
            </div>
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
