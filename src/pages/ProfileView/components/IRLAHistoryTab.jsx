import React, { useState, useCallback, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import MonthYearPicker from "./MonthYearPicker";
import axios from "axios";
import "./IRLAHistoryTab.css";

const IRLA_API_TOKEN = "IVRSuiyeUnekIcnmEWxnmrostooUZxXYPibnvIVRS"; 

export default function IRLAHistoryTab({ selSno, selCat }) {
  const [selected, setSelected] = useState({ month: "", year: "" });
  const [lastSearched, setLastSearched] = useState(null);
  const [pdfSrc, setPdfSrc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Validate month + year
  const isSelectionValid = useMemo(
    () => Boolean(selected.month && selected.year),
    [selected]
  );

  const handlePickerChange = useCallback((val) => {
    setSelected(val); // val = { month: "01", year: "2025" }
  }, []);

  const handleSearch = useCallback(async () => {
    if (!isSelectionValid) return;
    const { month, year } = selected;
    const selMon = month;
    const selYr = String(year);
    const fullMonth = `${selYr}${selMon}`; // e.g. 202509

    setLastSearched({ selMon, selYr });
    setLoading(true);
    setError(null);
    setPdfSrc(null);

    try {
      const body = new URLSearchParams({ api_token: IRLA_API_TOKEN });

      const response = await axios.post(
        `http://175.25.5.7/API/controller.php?apexApiPaySlip&selSno=${selSno}&selCat=${selCat}&selYr=${selYr}&selMon=${selMon}&month=${fullMonth}&section=FULL&request=PANKH`,
        body,
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          responseType: "blob",
          timeout: 20000,
        }
      );

      // Convert blob to object URL
      const pdfBlob = new Blob([response.data], { type: "application/pdf" });
      const objectUrl = URL.createObjectURL(pdfBlob);
      setPdfSrc(objectUrl);
    } catch (err) {
      console.error("IRLA fetch failed:", err);
      setError(err?.response?.data?.message || err.message || "Failed to fetch IRLA View");
    } finally {
      setLoading(false);
    }
  }, [isSelectionValid, selected, selSno, selCat]);

  const handleReset = useCallback(() => {
    setSelected({ month: "", year: "" });
    setLastSearched(null);
    setPdfSrc(null);
    setError(null);
  }, []);

  const handleDownload = useCallback(() => {
    if (!pdfSrc) return;
    window.open(pdfSrc, "_blank", "noopener,noreferrer");
  }, [pdfSrc]);

  return (
    <div className="irla-root" role="region" aria-label="IRLA History">
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
