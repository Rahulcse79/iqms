import React, { useEffect, useState, useMemo } from "react";
import "./PostingHistoryTab.css";

const SORT_ICONS = {
  asc: "▲",
  desc: "▼",
  none: "↕",
};

// Helper: parse common date formats (tries DD/MM/YYYY first, then ISO)
// Returns Date or null
const parseDateFlexible = (val) => {
  if (!val && val !== 0) return null;
  if (val instanceof Date && !Number.isNaN(val.getTime())) return val;
  if (typeof val !== "string") {
    try {
      const d = new Date(val);
      return Number.isNaN(d.getTime()) ? null : d;
    } catch {
      return null;
    }
  }

  const s = val.trim();
  // Try DD/MM/YYYY or D/M/YYYY
  const dm = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (dm) {
    const day = Number(dm[1]);
    const month = Number(dm[2]) - 1;
    let year = Number(dm[3]);
    // handle two-digit year (assume 20xx for simplicity)
    if (year < 100) year += year >= 70 ? 1900 : 2000;
    const d = new Date(year, month, day);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  // Try ISO-ish parse (YYYY-MM-DD or full ISO)
  try {
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
};

// Reuse your display formatting (DD Mon YYYY)
const formatDate = (d) => {
  if (!d && d !== 0) return "-";
  // If already a Date
  if (d instanceof Date && !Number.isNaN(d.getTime())) {
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }
  // If string in DD/MM/YYYY
  if (typeof d === "string") {
    const [day, month, year] = d.split("/");
    if (day && month && year) {
      try {
        return new Date(`${year}-${month}-${day}`).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      } catch {
        // continue
      }
    }
  }
  // fallback to parsing flexible
  const parsed = parseDateFlexible(d);
  if (parsed) {
    return parsed.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }
  return String(d);
};

export default function PostingHistoryTab({ serviceNo, category, baseUrl }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // pagination state
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Sorting state:
  // default to show desc on sors_prev_unit as requested
  const [sortColumn, setSortColumn] = useState("sors_prev_unit");
  const [sortDir, setSortDir] = useState("desc"); // 'asc' | 'desc' | null (none)

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
        // preserve original index for stable sort / "none" ordering
        const items = Array.isArray(json.items) ? json.items : [];
        setData(items.map((it, idx) => ({ ...it, _origIdx: idx })));
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setError(err.message || "Failed to load posting history");
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [serviceNo, category, apiBase]);

  // Columns that should be treated as date columns.
  const DATE_COLS = new Set([
    "sors_prev_unit",
    "sors",
    "sors_next_unit",
    "sos",
    "tors",
    "tos",
  ]);

  // Toggle behavior:
  // - If clicking same column: cycle desc -> asc -> none -> desc ...
  // - If clicking different column: set that column and default to 'desc'
  const onHeaderClick = (col) => {
    if (col === sortColumn) {
      if (sortDir === "desc") setSortDir("asc");
      else if (sortDir === "asc") setSortDir(null);
      else setSortDir("desc");
    } else {
      setSortColumn(col);
      setSortDir("desc");
    }
    setPage(1); // reset page when sorting changes
  };

  const onHeaderKey = (e, col) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onHeaderClick(col);
    }
  };

  // Compute sorted data (memoized)
  const sortedData = useMemo(() => {
    // include original index
    const mapped = (data || []).map((row) => ({ ...row }));
    if (!sortDir) {
      // none => return original ordering (by _origIdx if present)
      return mapped.slice().sort((a, b) => (a._origIdx ?? 0) - (b._origIdx ?? 0));
    }

    const dirFactor = sortDir === "asc" ? 1 : -1;

    mapped.sort((a, b) => {
      const aa = a?.[sortColumn];
      const bb = b?.[sortColumn];

      // Dates
      if (DATE_COLS.has(sortColumn)) {
        const da = parseDateFlexible(aa);
        const db = parseDateFlexible(bb);

        if (!da && !db) {
          // tie-breaker to keep stable ordering
          return (a._origIdx ?? 0) - (b._origIdx ?? 0);
        }
        if (!da) return 1; // push unknown dates to end
        if (!db) return -1;
        // compare times, dirFactor applied to flip asc/desc
        return (da.getTime() - db.getTime()) * dirFactor;
      }

      // String/number fallback:
      const sa = aa == null ? "" : String(aa).toLowerCase();
      const sb = bb == null ? "" : String(bb).toLowerCase();
      if (sa === sb) {
        return (a._origIdx ?? 0) - (b._origIdx ?? 0);
      }
      return sa.localeCompare(sb) * dirFactor;
    });

    return mapped;
  }, [data, sortColumn, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / rowsPerPage));

  useEffect(() => {
    // ensure page within bounds
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  // reset page when rowsPerPage changes
  useEffect(() => {
    setPage(1);
  }, [rowsPerPage]);

  const pageData = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return sortedData.slice(start, start + rowsPerPage);
  }, [sortedData, page, rowsPerPage]);

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
                {/* Make headers interactive for sorting. */}
                <th
                  className="ph-th ph-th-sortable"
                  role="button"
                  tabIndex={0}
                  aria-sort={
                    sortColumn === "unit" ? (sortDir ? (sortDir === "asc" ? "ascending" : "descending") : "none") : "none"
                  }
                  onClick={() => onHeaderClick("unit")}
                  onKeyDown={(e) => onHeaderKey(e, "unit")}
                  title="Sort by Unit (click to cycle desc → asc → none)"
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span>Unit</span>
                    <span style={{ fontSize: 12, color: "#666" }}>
                      {sortColumn === "unit" ? SORT_ICONS[sortDir ?? "none"] : SORT_ICONS.none}
                    </span>
                  </span>
                </th>

                <th
                  className="ph-th ph-th-sortable"
                  role="button"
                  tabIndex={0}
                  aria-sort={sortColumn === "sors_prev_unit" ? (sortDir ? (sortDir === "asc" ? "ascending" : "descending") : "none") : "none"}
                  onClick={() => onHeaderClick("sors_prev_unit")}
                  onKeyDown={(e) => onHeaderKey(e, "sors_prev_unit")}
                  title="Sort by SORS Prev Unit (click to cycle desc → asc → none)"
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span>SORS Prev Unit</span>
                    <span style={{ fontSize: 12, color: "#666" }}>
                      {sortColumn === "sors_prev_unit" ? SORT_ICONS[sortDir ?? "none"] : SORT_ICONS.none}
                    </span>
                  </span>
                </th>

                <th
                  className="ph-th ph-th-sortable"
                  role="button"
                  tabIndex={0}
                  aria-sort={sortColumn === "sors" ? (sortDir ? (sortDir === "asc" ? "ascending" : "descending") : "none") : "none"}
                  onClick={() => onHeaderClick("sors")}
                  onKeyDown={(e) => onHeaderKey(e, "sors")}
                  title="Sort by SORS (click to cycle desc → asc → none)"
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span>SORS</span>
                    <span style={{ fontSize: 12, color: "#666" }}>
                      {sortColumn === "sors" ? SORT_ICONS[sortDir ?? "none"] : SORT_ICONS.none}
                    </span>
                  </span>
                </th>

                <th
                  className="ph-th ph-th-sortable"
                  role="button"
                  tabIndex={0}
                  aria-sort={sortColumn === "sors_next_unit" ? (sortDir ? (sortDir === "asc" ? "ascending" : "descending") : "none") : "none"}
                  onClick={() => onHeaderClick("sors_next_unit")}
                  onKeyDown={(e) => onHeaderKey(e, "sors_next_unit")}
                  title="Sort by SORS Next Unit (click to cycle desc → asc → none)"
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span>SORS Next Unit</span>
                    <span style={{ fontSize: 12, color: "#666" }}>
                      {sortColumn === "sors_next_unit" ? SORT_ICONS[sortDir ?? "none"] : SORT_ICONS.none}
                    </span>
                  </span>
                </th>

                <th
                  className="ph-th ph-th-sortable"
                  role="button"
                  tabIndex={0}
                  aria-sort={sortColumn === "sos" ? (sortDir ? (sortDir === "asc" ? "ascending" : "descending") : "none") : "none"}
                  onClick={() => onHeaderClick("sos")}
                  onKeyDown={(e) => onHeaderKey(e, "sos")}
                  title="Sort by SOS (click to cycle desc → asc → none)"
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span>SOS</span>
                    <span style={{ fontSize: 12, color: "#666" }}>
                      {sortColumn === "sos" ? SORT_ICONS[sortDir ?? "none"] : SORT_ICONS.none}
                    </span>
                  </span>
                </th>

                <th
                  className="ph-th ph-th-sortable"
                  role="button"
                  tabIndex={0}
                  aria-sort={sortColumn === "tors" ? (sortDir ? (sortDir === "asc" ? "ascending" : "descending") : "none") : "none"}
                  onClick={() => onHeaderClick("tors")}
                  onKeyDown={(e) => onHeaderKey(e, "tors")}
                  title="Sort by TORS (click to cycle desc → asc → none)"
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span>TORS</span>
                    <span style={{ fontSize: 12, color: "#666" }}>
                      {sortColumn === "tors" ? SORT_ICONS[sortDir ?? "none"] : SORT_ICONS.none}
                    </span>
                  </span>
                </th>

                <th
                  className="ph-th ph-th-sortable"
                  role="button"
                  tabIndex={0}
                  aria-sort={sortColumn === "tos" ? (sortDir ? (sortDir === "asc" ? "ascending" : "descending") : "none") : "none"}
                  onClick={() => onHeaderClick("tos")}
                  onKeyDown={(e) => onHeaderKey(e, "tos")}
                  title="Sort by TOS (click to cycle desc → asc → none)"
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span>TOS</span>
                    <span style={{ fontSize: 12, color: "#666" }}>
                      {sortColumn === "tos" ? SORT_ICONS[sortDir ?? "none"] : SORT_ICONS.none}
                    </span>
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {pageData.map((row, idx) => (
                <tr key={row._origIdx ?? idx} className="ph-tr">
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
          {Math.min(page * rowsPerPage, sortedData.length)} of {sortedData.length}
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
