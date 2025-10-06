import React, { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import axios from "axios";

const DEFAULT_BASE = "http://180.60.2.35/APl/controller.php";
const Form_API_TOKEN =
  process.env.REACT_APP_IRLA_API_TOKEN ||
  "IVRSuiyeUnekIcnmEWxnmrostooUZxXYPibnvIVRS";

export default function Form16B({
  serviceNo,
  cat,
  baseUrl = DEFAULT_BASE,
  requestForm = "PANKH",
  startYear = 2014,
  endYear = 2024,
}) {
  // Build list of financial years (e.g. "2014-15")
  const years = useMemo(() => {
    const arr = [];
    for (let y = startYear; y <= endYear; y++) {
      const nextYY = (y + 1).toString().slice(-2).padStart(2, "0");
      arr.push(`${y}-${nextYY}`);
    }
    return arr;
  }, [startYear, endYear]);

  // default selected year -> most recent (endYear)
  const [selectedYear, setSelectedYear] = useState(years[years.length - 1]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);

  // use a ref for AbortController so we can cancel previous request when switching tabs
  const abortCtrlRef = useRef(null);

  // cleanup blob urls on unmount
  useEffect(() => {
    return () => {
      if (abortCtrlRef.current) abortCtrlRef.current.abort();
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    };
  }, [pdfBlobUrl]);

  // fetch whenever serviceNo, cat or selectedYear changes
  useEffect(() => {
    if (!serviceNo || !cat) return;
    fetchPdf(selectedYear);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceNo, cat, selectedYear]);

  async function fetchPdf(finYear) {
    setError(null);
    setLoading(true);

    // cancel previous
    if (abortCtrlRef.current) {
      try {
        abortCtrlRef.current.abort();
      } catch (e) {}
    }
    const controller = new AbortController();
    abortCtrlRef.current = controller;

    try {
      // Build query string - include both requestForm and encoded key with space to be tolerant
      const qs = `?apexApiForm16B&selSno=${encodeURIComponent(
        serviceNo
      )}&selCat=${encodeURIComponent(cat)}&finYear=${encodeURIComponent(
        finYear
      )}&requestForm=${encodeURIComponent(requestForm)}&request%20Form=${encodeURIComponent(
        requestForm
      )}`;

      const url = `${baseUrl}${qs}`;

      // token in x-www-form-urlencoded body as `api_token` (as you said you tested in Postman)
      const body = new URLSearchParams({ api_token: Form_API_TOKEN }).toString();

      const resp = await axios.post(url, body, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        responseType: "blob",
        signal: controller.signal,
        // If you need credentials/cookies uncomment below
        // withCredentials: true,
      });

      const contentType = (resp.headers && resp.headers["content-type"]) || "";

      if (contentType.includes("application/pdf")) {
        const blob = new Blob([resp.data], { type: "application/pdf" });
        const blobUrl = URL.createObjectURL(blob);
        // revoke previous
        setPdfBlobUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return blobUrl;
        });
      } else {
        // Not a PDF — try to read as text for helpful error
        let text = "(could not parse response)";
        try {
          const reader = new FileReader();
          const p = new Promise((resolve) => {
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => resolve(null);
          });
          reader.readAsText(resp.data);
          const txt = await p;
          text = txt ? txt.slice(0, 800) : text; // limit size
        } catch (e) {}
        throw new Error("Server did not return a PDF. Response starts with: " + text);
      }
    } catch (err) {
      // axios cancellation uses name 'CanceledError' in recent axios versions,
      // and AbortError for native AbortController — ignore those for user feedback
      if (err?.name === "CanceledError" || err?.name === "AbortError") {
        // aborted — do nothing
      } else {
        setError(err.message || String(err));
        // cleanup any existing pdf
        setPdfBlobUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return null;
        });
      }
    } finally {
      setLoading(false);
      abortCtrlRef.current = null;
    }
  }

  function handleDownload() {
    if (!pdfBlobUrl) return;
    const a = document.createElement("a");
    a.href = pdfBlobUrl;
    a.download = `Form16-${serviceNo}-${selectedYear}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  return (
    <div style={{ fontFamily: "system-ui, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0 }}>Form 16B — {serviceNo ?? "(no service number)"}</h3>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => fetchPdf(selectedYear)} disabled={loading || !serviceNo || !cat}>
            Refresh
          </button>
          <button onClick={handleDownload} disabled={!pdfBlobUrl}>
            Download PDF
          </button>
          {pdfBlobUrl && (
            <button
              onClick={() => window.open(pdfBlobUrl, "_blank")}
              title="Open PDF in new tab"
            >
              Open
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 6,
          marginTop: 12,
          marginBottom: 12,
          overflowX: "auto",
          paddingBottom: 6,
        }}
      >
        {years.map((y) => (
          <button
            key={y}
            onClick={() => setSelectedYear(y)}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: y === selectedYear ? "2px solid #0b76ef" : "1px solid #ddd",
              background: y === selectedYear ? "rgba(11,118,239,0.08)" : "white",
              cursor: "pointer",
            }}
          >
            {y}
          </button>
        ))}
      </div>

      {/* Status */}
      <div style={{ marginBottom: 12 }}>
        {loading && <div>Loading PDF for {selectedYear} ...</div>}
        {error && (
          <div style={{ color: "crimson", whiteSpace: "pre-wrap" }}>Error: {error}</div>
        )}
      </div>

      {/* PDF viewer */}
      <div style={{ minHeight: 300, border: "1px solid #eee" }}>
        {pdfBlobUrl ? (
          // Use <object> so pdf opens in browsers that support PDF plugin; <iframe> works too.
          <object
            data={pdfBlobUrl}
            type="application/pdf"
            width="100%"
            height={700}
            aria-label={`Form16 PDF for ${selectedYear}`}
          >
            <p>
              Your browser does not support inline PDFs. <a href={pdfBlobUrl}>Download PDF</a> to
              view.
            </p>
          </object>
        ) : (
          !loading && (
            <div style={{ padding: 24, color: "#666" }}>
              No PDF to display. Select a year tab to load the Form 16 PDF.
            </div>
          )
        )}
      </div>

      <div style={{ marginTop: 12, color: "#444" }}>
        <small>
          Note: this component sends the token in the request body as <code>api_token</code> using
          the x-www-form-urlencoded content type (this mirrors your Postman test). If your API
          requires the token in a different header or as a query parameter let me know and I will
          adapt. If the browser shows a CORS error, you will need to call this endpoint from a
          backend proxy or enable CORS on the server.
        </small>
      </div>
    </div>
  );
}

Form16B.propTypes = {
  serviceNo: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  cat: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  baseUrl: PropTypes.string,
  requestForm: PropTypes.string,
  startYear: PropTypes.number,
  endYear: PropTypes.number,
};
