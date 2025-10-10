import React, { useMemo, useState, useCallback, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import { createPortal } from "react-dom";
import "./PORDataTable.css";

const IRLA_API_TOKEN =
  process.env.REACT_APP_IRLA_API_TOKEN || "IVRSuiyeUnekIcnmEWxnmrostooUZxXYPibnvIVRS";

export default function PORDataTable({ sno, cat }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [porList, setPorList] = useState([]);
  const [selectedYear, setSelectedYear] = useState("ALL");
  const [lastSearched, setLastSearched] = useState(null);
  const [searchText, setSearchText] = useState("");

  // Popup state
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupContent, setPopupContent] = useState("");
  const [popupLoading, setPopupLoading] = useState(false);
  const [popupError, setPopupError] = useState(null);

  // Focus and trap refs
  const modalPanelRef = useRef(null);
  const lastActiveRef = useRef(null);

  // Handle year input change
  const handleYearChange = useCallback((e) => {
    const val = e.target.value.replace(/[^\d]/g, "");
    setSelectedYear(val === "" ? "" : Number(val));
  }, []);

  const isYearValid = useMemo(() => {
    if (selectedYear === "ALL") return true;
    const y = Number(selectedYear);
    const current = new Date().getFullYear();
    return Number.isInteger(y) && y >= 2000 && y <= current;
  }, [selectedYear]);

  const handleSearch = useCallback(async () => {
    if (!isYearValid || !sno || cat == null) return;

    setLastSearched({ sno, cat, porYear: selectedYear });
    setLoading(true);
    setError(null);
    setPorList([]);

    try {
      const body = new URLSearchParams({ api_token: IRLA_API_TOKEN });

      let url = `http://175.25.5.7/API/controller.php?viewPor&sno=${sno}&cat=${cat}&requestFrom=PANKH`;
      // let url = `http://localhost:80/API/controller.php?viewPor&sno=${sno}&cat=${cat}&requestFrom=PANKH`;
      if (selectedYear !== "ALL") {
        url += `&porYear=${selectedYear}`;
      }

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

  const records = useMemo(() => {
    if (!Array.isArray(porList)) return [];
    return porList.filter(
      (item) => item && (item.PORNO || item.PORYEAR) && !item.RESULT
    );
  }, [porList]);

  // Table search filter
  const filteredRecords = useMemo(() => {
    if (!searchText.trim()) return records;
    const lower = searchText.toLowerCase();
    return records.filter((row) =>
      Object.values(row).some(
        (val) => val && String(val).toLowerCase().includes(lower)
      )
    );
  }, [records, searchText]);

  const handleViewDetails = useCallback(
    async (row) => {
      if (!row?.OCC_ID) return;

      // record previously focused element
      lastActiveRef.current = document.activeElement;

      setPopupOpen(true);
      setPopupLoading(true);
      setPopupError(null);
      setPopupContent("");

      try {
        const body = new URLSearchParams({ api_token: IRLA_API_TOKEN });

        // const url = `http://localhost:80/API/controller.php?viewPorDet&requestFrom=IVRS&occ_det=${row.OCC_ID}&promType=ONLINE&sno=${sno}&cat=${cat}&print=true`;
        const url = `http://175.25.5.7/API/controller.php?viewPorDet&requestFrom=IVRS&occ_det=${row.OCC_ID}&promType=ONLINE&sno=${sno}&cat=${cat}&print=true`;

        const response = await axios.post(url, body, {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          timeout: 10000,
        });

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

  // Focus trap + Escape + scroll lock + inert background
  useEffect(() => {
    if (!popupOpen) return;

    // Prevent body scroll
    document.body.classList.add("por-dt-modal-open");

    // Try to mark app root inert (optional but improves AT behavior)
    const appRoot = document.getElementById("root");
    if (appRoot) {
      appRoot.setAttribute("aria-hidden", "true"); // conservative fallback when inert not available
      try {
        appRoot.setAttribute("inert", ""); // modern browsers remove from tab order and AT tree
      } catch {}
    }

    // Move focus into the modal panel
    const panel = modalPanelRef.current;
    if (panel) {
      // Find first focusable
      const focusable = panel.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstFocusable = focusable[0] || panel;
      if (firstFocusable instanceof HTMLElement) firstFocusable.focus();
    }

    const onKeyDown = (e) => {
      if (!panel) return;

      if (e.key === "Escape") {
        e.preventDefault();
        setPopupOpen(false);
        return;
      }
      if (e.key === "Tab") {
        const focusables = panel.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const list = Array.from(focusables).filter(
          (el) => !el.hasAttribute("disabled") && !el.getAttribute("aria-hidden")
        );
        if (list.length === 0) {
          e.preventDefault();
          panel.focus();
          return;
        }
        const first = list[0];
        const last = list[list.length - 1];
        const current = document.activeElement;

        if (e.shiftKey) {
          if (current === first || !panel.contains(current)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (current === last || !panel.contains(current)) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("por-dt-modal-open");

      // Restore focus to opener if possible
      if (lastActiveRef.current && lastActiveRef.current.focus) {
        try {
          lastActiveRef.current.focus();
        } catch {}
      }

      // Remove inert/aria-hidden
      const root = document.getElementById("root");
      if (root) {
        root.removeAttribute("inert");
        root.removeAttribute("aria-hidden");
      }
    };
  }, [popupOpen]);

  return (
    <div className="por-dt-root" role="region" aria-label="POR Data Table">
      <div className="por-dt-controls">
        <div className="por-dt-year">
          <label htmlFor="por-dt-year-input" className="por-dt-label">
            Select Year
          </label>
          <select
            id="por-dt-year-input"
            className="por-dt-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value === "ALL" ? "ALL" : Number(e.target.value))}
            aria-describedby="por-dt-year-help"
          >
            <option value="ALL">ALL</option>
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
            Year between 2000 and {new Date().getFullYear()} or select ALL
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
              setSearchText("");
            }}
            aria-label="Reset year and view"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Table search */}
      {records.length > 0 && (
        <div className="por-dt-search">
          <input
            type="text"
            className="por-dt-input"
            placeholder="Search in table..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
      )}

      {lastSearched && !loading && !error && (
        <div className="por-dt-meta">
          Showing results for {lastSearched.porYear}
        </div>
      )}

      {error && <div className="por-dt-error">Error: {String(error)}</div>}

      {!loading && filteredRecords.length === 0 && lastSearched && !error && (
        <div className="por-dt-empty">
          No POR records found for {lastSearched.porYear}.
        </div>
      )}

      {loading && <div className="por-dt-loading">Loading POR data…</div>}

      {filteredRecords.length > 0 && (
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
              {filteredRecords.map((row, index) => (
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

      {/* Centered modal in a portal */}
      {popupOpen &&
        createPortal(
          <div className="por-dt-modal" data-open="true" role="presentation">
            <div
              className="por-dt-modal__backdrop"
              aria-hidden="true"
            />
            <div
              className="por-dt-modal__panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="por-dt-modal-title"
              ref={modalPanelRef}
              tabIndex={-1}
            >
              <div className="por-dt-modal__header">
                <h2 id="por-dt-modal-title" className="por-dt-modal__title">
                  POR Details
                </h2>
                <button
                  type="button"
                  className="por-dt-modal__close"
                  aria-label="Close dialog"
                  onClick={() => setPopupOpen(false)}
                >
                  ✕
                </button>
              </div>
              <div className="por-dt-modal__body">
                {popupLoading && <div>Loading details…</div>}
                {popupError && <div className="por-dt-error">{popupError}</div>}
                {!popupLoading && !popupError && popupContent && (
                  <div
                    className="por-dt-popup-content"
                    dangerouslySetInnerHTML={{ __html: popupContent }}
                  />
                )}
              </div>
              <div className="por-dt-modal__footer">
                <button
                  type="button"
                  className="por-dt-btn por-dt-btn--secondary"
                  onClick={() => setPopupOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

PORDataTable.propTypes = {
  sno: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  cat: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};
