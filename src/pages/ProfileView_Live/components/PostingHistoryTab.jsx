import React, { useEffect, useState, useMemo } from "react";
import "./PostingHistoryTab.css";

export default function PostingHistoryTab({ serviceNo, category, baseUrl }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // pagination state
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const apiBase = baseUrl || "http://sampoorna.cao.local/afcao/ipas/ivrs/profileView/postingHist";

  useEffect(() => {
    if (!serviceNo || !category) return;

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetch(`${apiBase}/${serviceNo}/${category}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => {
        setData(Array.isArray(json.items) ? json.items : []);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setError(err.message || "Failed to load posting history");
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [serviceNo, category, apiBase]);

  const totalPages = Math.ceil(data.length / rowsPerPage) || 1;
  const pageData = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return data.slice(start, start + rowsPerPage);
  }, [data, page, rowsPerPage]);

  // format DD/MM/YYYY → DD Mon YYYY
  const formatDate = (d) => {
    if (!d) return "-";
    const [day, month, year] = d.split("/");
    if (!day || !month || !year) return d;
    try {
      return new Date(`${year}-${month}-${day}`).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return d;
    }
  };

  return (
    <div className="posting-history">
      {/* Controls */}
      <div className="ph-controls-row">
        <div className="ph-left-controls">
          <label className="ph-rows-label">
            Rows per page:
            <select
              className="ph-select"
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setPage(1);
              }}
            >
              {[5, 10, 20, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="ph-meta">Total records: {data.length}</div>
        <div className="ph-pager">
          <button
            className="ph-nav-btn"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            className="ph-nav-btn"
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="ph-table-wrap">
        {loading && <div className="ph-message ph-loading">Loading...</div>}
        {error && <div className="ph-message ph-error">{error}</div>}
        {!loading && !error && data.length === 0 && (
          <div className="ph-message ph-empty">No posting history found</div>
        )}

        {!loading && !error && data.length > 0 && (
          <table className="ph-table">
            <thead className="ph-thead">
              <tr>
                <th className="ph-th">Unit</th>
                <th className="ph-th">SORS Prev Unit</th>
                <th className="ph-th">SORS</th>
                <th className="ph-th">SORS Next Unit</th>
                <th className="ph-th">SOS</th>
                <th className="ph-th">TORS</th>
                <th className="ph-th">TOS</th>
              </tr>
            </thead>
            <tbody>
              {pageData.map((row, idx) => (
                <tr key={idx} className="ph-tr">
                  <td className="ph-td">{row.unit || "-"}</td>
                  <td className="ph-td">{formatDate(row.sors_prev_unit)}</td>
                  <td className="ph-td">{formatDate(row.sors)}</td>
                  <td className="ph-td">{formatDate(row.sors_next_unit)}</td>
                  <td className="ph-td">{formatDate(row.sos)}</td>
                  <td className="ph-td">{formatDate(row.tors)}</td>
                  <td className="ph-td">{formatDate(row.tos)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer */}
      <div className="ph-footer">
        <div className="ph-page-meta">
          Showing {(page - 1) * rowsPerPage + 1} -
          {Math.min(page * rowsPerPage, data.length)} of {data.length}
        </div>
        <div className="ph-page-controls">
          <label className="ph-goto-label">
            Go to page:
            <input
              type="number"
              className="ph-page-input"
              value={page}
              min={1}
              max={totalPages}
              onChange={(e) => {
                let val = Number(e.target.value);
                if (Number.isNaN(val)) return;
                if (val < 1) val = 1;
                if (val > totalPages) val = totalPages;
                setPage(val);
              }}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
