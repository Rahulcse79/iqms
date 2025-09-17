import React, { useState, useCallback, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
import MonthYearPicker from "./MonthYearPicker";
import { fetchIrlaView } from "../../../actions/ProfileAction";
import "./IRLAHistoryTab.css";

/**
 * IRLAHistoryTab
 * - Search-driven (manual fetch on click)
 * - Shows loader, error, or PDF preview
 * - Download / open PDF in new tab
 */
export default function IRLAHistoryTab({ selSno, selCat }) {
  const dispatch = useDispatch();
  const { loading, pdfUrl, error } = useSelector((s) => s.irlaView || {});

  const [selected, setSelected] = useState({ month: "", year: "" });
  const [lastSearched, setLastSearched] = useState(null);
  const [pdfSrc, setPdfSrc] = useState(null);

  // Sync pdfUrl -> pdfSrc (string URL, data URI, or Blob)
  useEffect(() => {
    let objectUrl;

    if (!pdfUrl) {
      setPdfSrc(null);
      return;
    }

    if (typeof pdfUrl === "string") {
      setPdfSrc(pdfUrl);
      return;
    }

    try {
      if (pdfUrl instanceof Blob) {
        objectUrl = URL.createObjectURL(pdfUrl);
        setPdfSrc(objectUrl);
      } else {
        setPdfSrc(null);
      }
    } catch (err) {
      console.error("Failed to handle pdfUrl:", err);
      setPdfSrc(null);
    }

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [pdfUrl]);

  // Validate month + year
  const isSelectionValid = useMemo(
    () => Boolean(selected.month && selected.year),
    [selected]
  );

  const handlePickerChange = useCallback((val) => {
    // val = { month: '01', year: '2025' }
    setSelected(val);
  }, []);

  const handleSearch = useCallback(async () => {
    if (!isSelectionValid) return;
    const { month, year } = selected;
    const selMon = month;
    const selYr = String(year);
    const fullMonth = `${selYr}${selMon}`; // e.g. 202509
    setLastSearched({ selMon, selYr });

    try {
      const result = dispatch(
        fetchIrlaView({ selSno, selCat, selYr, selMon, month: fullMonth })
      );
      if (result && typeof result.then === "function") {
        await result;
      }
    } catch (err) {
      console.error("IRLA fetch failed:", err);
    }
  }, [dispatch, selected, isSelectionValid, selSno, selCat]);

  const handleReset = useCallback(() => {
    setSelected({ month: "", year: "" });
    setLastSearched(null);
    setPdfSrc(null);
    // Optionally clear Redux state as well
  }, []);

  const handleDownload = useCallback(() => {
    if (!pdfSrc) return;
    window.open(pdfSrc, "_blank", "noopener,noreferrer");
  }, [pdfSrc]);

  return (
    <div className="irla-root" role="region" aria-label="IRLA History">
      <div className="irla-header">
        <h2 className="irla-title">IRLA History</h2>
      </div>

      <div className="irla-controls">
        <MonthYearPicker onChange={handlePickerChange} yearsBack={5} />
        <div className="irla-actions">
          <button
            className="irla-btn irla-btn--primary"
            type="button"
            onClick={handleSearch}
            disabled={!isSelectionValid || loading}
            aria-disabled={!isSelectionValid || loading}
          >
            {loading ? "Searching…" : "Search"}
          </button>
          <button
            className="irla-btn irla-btn--secondary"
            type="button"
            onClick={handleReset}
            aria-label="Reset selection"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="irla-status">
        {lastSearched && !loading && !error && (
          <div className="irla-meta">
            Results for: {lastSearched.selYr}-{lastSearched.selMon}
          </div>
        )}
        {error && (
          <div role="alert" className="irla-error">
            Error: {String(error)}
          </div>
        )}
      </div>

      <div className="irla-preview">
        {loading && (
          <div className="irla-loading" aria-live="polite">
            <div className="irla-spinner" /> Loading PDF…
          </div>
        )}

        {!loading && !pdfSrc && lastSearched && !error && (
          <div className="irla-empty">
            No PDF available for the selected month.
          </div>
        )}

        {pdfSrc && (
          <div className="irla-iframe-wrap">
            <div className="irla-iframe-actions">
              <button
                className="irla-btn irla-btn--primary"
                onClick={handleDownload}
              >
                Open / Download
              </button>
            </div>
            <iframe
              title="IRLA Payslip PDF"
              src={pdfSrc}
              width="100%"
              height="720"
              className="irla-iframe"
            />
          </div>
        )}
      </div>
    </div>
  );
}

IRLAHistoryTab.propTypes = {
  selSno: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  selCat: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};
