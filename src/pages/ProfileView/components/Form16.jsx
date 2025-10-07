import React, { useState, useEffect, useRef } from "react";
import "./Form16.css"

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
  const years = generateYears(2015, 2024); // 2015-16 .. 2024-25 (10 tabs)
  const defaultStart = Math.max(...years);

  const [selectedStart, setSelectedStart] = useState(defaultStart);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
      .then((res) => {
        if (!res.ok)
          throw new Error(`Server returned ${res.status} ${res.statusText}`);
        return res.blob();
      })
      .then((blob) => {
        if (!blob || blob.size === 0)
          throw new Error("Received empty response (no PDF).");
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
  }, [selSno, selCat, selectedStart, baseUrl, apiToken]);

  const finYear = finYearLabel(selectedStart);

  return (
    <div className="p-4">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Form 16</h2>
          <div className="text-sm">Selected: {finYear}</div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {years.map((y) => {
            const label = finYearLabel(y);
            const active = y === selectedStart;
            return (
              <button
                key={y}
                onClick={() => setSelectedStart(y)}
                className={`year-btn ${active ? "active" : ""}`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="border rounded p-2">
        {loading && (
          <div className="py-8 text-center">Loading PDF for {finYear}...</div>
        )}
        {error && <div className="text-red-600 py-2">{error}</div>}

        {!loading && !error && pdfUrl && (
          <div>
            <div className="mb-2 flex gap-2 items-center">
              <a
                className="underline text-sm"
                href={pdfUrl}
                target="_blank"
                rel="noreferrer"
              >
                Open in new tab
              </a>
              <a
                className="underline text-sm"
                href={pdfUrl}
                download={`Form16_${selSno}_${finYear}.pdf`}
              >
                Download
              </a>
            </div>
            <iframe
              title={`Form16-${selSno}-${finYear}`}
              src={pdfUrl}
              className="w-full h-[700px] border rounded"
            />
          </div>
        )}

        {!loading && !error && !pdfUrl && (
          <div className="py-8 text-center text-slate-500">
            No PDF loaded — click a year to fetch.
          </div>
        )}
      </div>
    </div>
  );
}
