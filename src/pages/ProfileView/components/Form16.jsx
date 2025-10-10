import React, { useState, useEffect, useRef } from "react";
import "./Form16.css";

const DEFAULT_API_BASE = "http://175.25.5.7/API/controller.php";
const Form_API_TOKEN =
  process.env.REACT_APP_IRLA_API_TOKEN ||
  "IVRSuiyeUnekIcnmEWxnmrostooUZxXYPibnvIVRS";

function generateYears(start = 2015, end = 2024) {
  const arr = [];
  for (let y = start; y <= end; y++) arr.push(y);
  return arr;
}

function finYearLabel(start) {
  // format yyyy-yy e.g. 2024-25
  const endShort = String((start + 1) % 100).padStart(2, "0");
  return `${start}-${endShort}`;
}

export default function Form16({
  selSno,
  selCat,
  baseUrl = DEFAULT_API_BASE,
  apiToken = Form_API_TOKEN,
}) {
  const years = generateYears(2015, 2024); // 2015-16 .. 2024-25
  const defaultStart = Math.max(...years);

  const [selectedStart, setSelectedStart] = useState(defaultStart);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const objectUrlRef = useRef(null);
  const abortControllerRef = useRef(null);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  useEffect(() => {
    if (!selSno || !selCat) {
      setError("selSno and selCat props are required.");
      setPdfUrl(null);
      return;
    }

    const finYear = finYearLabel(selectedStart);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    const url = `${baseUrl}?apexApiForm16B=1&selSno=${encodeURIComponent(
      selSno
    )}&selCat=${encodeURIComponent(selCat)}&finYear=${encodeURIComponent(
      finYear
    )}&requestForm=PANKH`;

    const body = new URLSearchParams({ api_token: apiToken }).toString();

    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Server returned ${res.status} ${res.statusText}`);
        }
        // Verify Content-Type is a PDF before reading blob
        const ct = res.headers.get("Content-Type") || res.headers.get("content-type") || "";
        if (!ct.toLowerCase().includes("application/pdf")) {
          const txt = await res.text().catch(() => "");
          throw new Error(
            txt?.trim()
              ? `Unexpected response: ${txt.slice(0, 500)}`
              : "Unexpected response (not a PDF)."
          );
        }
        return res.blob();
      })
      .then((blob) => {
        if (!blob || blob.size === 0) throw new Error("Received empty response (no PDF).");
        const objectUrl = URL.createObjectURL(blob);
        objectUrlRef.current = objectUrl;
        setPdfUrl(objectUrl);
      })
      .catch((err) => {
        if (err.name === "AbortError") return; // ignore aborts
        setError(err.message || "Failed to fetch PDF.");
        setPdfUrl(null);
      })
      .finally(() => setLoading(false));

    // cleanup for this effect run
    return () => controller.abort();
  }, [selSno, selCat, selectedStart, baseUrl, apiToken, refreshTick]);

  const finYear = finYearLabel(selectedStart);

  const handlePrint = () => {
    if (!pdfUrl) return;
    // Hidden iframe print to reliably trigger the PDF print dialog
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.onload = () => {
      try {
        // Focus and print the iframe contents
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } finally {
        // Remove after a short delay to allow print dialog to initialize
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }
    };
    iframe.src = pdfUrl;
    document.body.appendChild(iframe);
  };

  const handleRefresh = () => setRefreshTick((x) => x + 1);

  return (
    <div className="form16-root">
      <div className="form16-header">
        <div className="form16-header-top">
          <h2 className="form16-title">Form 16</h2>
          <div className="form16-selected">Selected: {finYear}</div>
        </div>

        <div className="form16-year-strip">
          {years.map((y) => {
            const label = finYearLabel(y);
            const active = y === selectedStart;
            return (
              <button
                key={y}
                onClick={() => setSelectedStart(y)}
                className={`year-btn ${active ? "active" : ""}`}
                aria-pressed={active}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="form16-viewer-panel">
        {/* Toolbar */}
        <div className="form16-toolbar">
          <button
            type="button"
            className="btn"
            onClick={handleRefresh}
            disabled={loading}
            title="Refresh PDF"
          >
            Refresh
          </button>

          <div className="spacer" />

          <a
            className="btn"
            href={pdfUrl || "#"}
            target="_blank"
            rel="noreferrer"
            aria-disabled={!pdfUrl}
            onClick={(e) => {
              if (!pdfUrl) e.preventDefault();
            }}
            title="Open in new tab"
          >
            Open
          </a>

          <a
            className="btn"
            href={pdfUrl || "#"}
            download={pdfUrl ? `Form16_${selSno}_${finYear}.pdf` : undefined}
            aria-disabled={!pdfUrl}
            onClick={(e) => {
              if (!pdfUrl) e.preventDefault();
            }}
            title="Download PDF"
          >
            Download
          </a>

          <button
            type="button"
            className="btn"
            onClick={handlePrint}
            disabled={!pdfUrl}
            title="Print PDF"
          >
            Print
          </button>
        </div>

        {/* Content */}
        <div className="form16-content">
          {loading && (
            <div className="form16-status">Loading PDF for {finYear}...</div>
          )}

          {error && <div className="form16-error">{error}</div>}

          {!loading && !error && pdfUrl && (
            <div className="form16-pdf-wrap">
              {/* Use <object> with type application/pdf for native viewer/controls */}
              <object
                data={pdfUrl}
                type="application/pdf"
                className="pdf-object"
                aria-label={`Form16 PDF ${finYear}`}
              >
                <p className="fallback">
                  This browser cannot display embedded PDFs; use Open to view in a new tab or Download to save locally. 
                </p>
              </object>
            </div>
          )}

          {!loading && !error && !pdfUrl && (
            <div className="form16-status muted">
              No PDF loaded — select a year and use Refresh if needed.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
