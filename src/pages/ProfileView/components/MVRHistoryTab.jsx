import React, { useState, useEffect, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import axios from "axios";

const DEFAULT_BASE = "http://sampoorna.cao.local/afcao/ipas/ivrs/mvrHistory";

export default function MVRHistoryTab({ serviceNo, baseUrl = DEFAULT_BASE }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Pagination state
  const [meta, setMeta] = useState({ offset: 0, limit: 10, count: 0 });
  const [currentPage, setCurrentPage] = useState(1);

  // UI states
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Sorting
  const [sortBy, setSortBy] = useState("irla");
  const [sortDir, setSortDir] = useState("desc");

  const buildDefaultUrl = useCallback(
    (svc, offset = 0, limit = meta.limit) =>
      `${baseUrl}/${encodeURIComponent(svc)}?offset=${offset}&limit=${limit}`,
    [baseUrl, meta.limit]
  );

  const load = useCallback(
    async (page = 1) => {
      if (!serviceNo) {
        setItems([]);
        return;
      }

      const offset = (page - 1) * meta.limit;
      setLoading(true);
      setError(null);

      try {
        const url = buildDefaultUrl(serviceNo, offset, meta.limit);
        const resp = await axios.get(url);
        const data = resp.data || {};

        const newItems = Array.isArray(data.items) ? data.items : [];
        setItems(newItems);
        setMeta({
          offset: data.offset ?? offset,
          limit: data.limit ?? 10,
          count: data.count ?? newItems.length,
        });
        setCurrentPage(page);
      } catch (err) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to fetch MVR history.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [serviceNo, buildDefaultUrl, meta.limit]
  );

  useEffect(() => {
    load(1);
  }, [serviceNo, baseUrl]);

  // Debounce search input (300ms)
  useEffect(() => {
    const t = setTimeout(
      () => setDebouncedSearch(search.trim().toLowerCase()),
      300
    );
    return () => clearTimeout(t);
  }, [search]);

  // Helpers
  const parseDate = (iso) => {
    if (!iso) return null;
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const formatDate = (iso) => {
    const d = parseDate(iso);
    if (!d) return "-";
    return d.toLocaleDateString("en-GB", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Derived items: search + sort
  const displayedItems = useMemo(() => {
    const q = debouncedSearch;
    let list = Array.isArray(items) ? [...items] : [];

    if (q) {
      list = list.filter((it) => {
        const hay = `${it.description ?? ""} ${it.occ_id ?? ""} ${it.porno ?? ""} ${
          it.status ?? ""
        } ${it.src ?? ""} ${it.pers ?? ""}`.toLowerCase();
        return hay.includes(q);
      });
    }

    if (sortBy) {
      list.sort((a, b) => {
        const dir = sortDir === "asc" ? 1 : -1;
        if (sortBy === "irla") {
          const na = Number(a.irla ?? -Infinity);
          const nb = Number(b.irla ?? -Infinity);
          return na > nb ? dir : na < nb ? -dir : 0;
        }
        if (sortBy === "fmdt" || sortBy === "todt") {
          const da = parseDate(a[sortBy]);
          const db = parseDate(b[sortBy]);
          if (!da && !db) return 0;
          if (!da) return 1;
          if (!db) return -1;
          return da > db ? dir : da < db ? -dir : 0;
        }
        return 0;
      });
    }

    return list;
  }, [items, debouncedSearch, sortBy, sortDir]);

  const totalPages = Math.ceil((meta.count || 0) / meta.limit) || 1;

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDir("asc");
    }
  };

  const handleLimitChange = (e) => {
    const newLimit = Number(e.target.value);
    setMeta((m) => ({ ...m, limit: newLimit }));
    load(1);
  };

  if (!serviceNo) {
    return (
      <div className="mvr-empty">
        No service number provided. Pass <code>serviceNo</code> prop to fetch
        MVR history.
      </div>
    );
  }

  return (
    <div className="mvr-root" style={{ fontFamily: "system-ui, sans-serif" }}>
      <div className="mvr-header">
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <h3 style={{ margin: 0 }}>MVR History</h3>
          <div className="mvr-controls">
            <input
              className="mvr-search"
              placeholder="Search description, occ_id, por_no, status, src..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search MVR records"
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div className="mvr-meta">
            {meta.count > 0 ? `Total: ${meta.count}` : "No records"}
          </div>
          <button className="mvr-btn" onClick={() => load(currentPage)} disabled={loading}>
            Refresh
          </button>
        </div>
      </div>

      {loading && items.length === 0 && <div className="mvr-no-record">Loading...</div>}
      {error && <div style={{ color: "crimson", marginBottom: 8 }}>Error: {error}</div>}

      {items.length === 0 && !loading && !error && (
        <div className="mvr-no-record">No records found.</div>
      )}

      {items.length > 0 && (
        <>
          <div className="mvr-table-wrap">
            <table className="mvr-table" role="table">
              <thead>
                <tr>
                  <th style={{ textAlign: "left" }}>
                    <div className="mvr-sortable" onClick={() => toggleSort("irla")}>
                      IRLA
                      {sortBy === "irla" && (
                        <span className="mvr-sort-ind">{sortDir === "asc" ? "▲" : "▼"}</span>
                      )}
                    </div>
                  </th>
                  <th>occ_id</th>
                  <th>description</th>
                  <th>
                    <div className="mvr-sortable" onClick={() => toggleSort("fmdt")}>
                      from
                      {sortBy === "fmdt" && (
                        <span className="mvr-sort-ind">{sortDir === "asc" ? "▲" : "▼"}</span>
                      )}
                    </div>
                  </th>
                  <th>
                    <div className="mvr-sortable" onClick={() => toggleSort("todt")}>
                      to
                      {sortBy === "todt" && (
                        <span className="mvr-sort-ind">{sortDir === "asc" ? "▲" : "▼"}</span>
                      )}
                    </div>
                  </th>
                  <th style={{ textAlign: "right" }}>oldrate</th>
                  <th style={{ textAlign: "right" }}>newrate</th>
                  <th style={{ textAlign: "right" }}>amount</th>
                  <th>status</th>
                  <th>transtype</th>
                  <th>por_no</th>
                  <th>src</th>
                </tr>
              </thead>

              <tbody>
                {displayedItems.map((it, idx) => (
                  <tr key={`${it.occ_id ?? idx}-${idx}`}>
                    <td>{it.irla ?? "-"}</td>
                    <td>{it.occ_id ?? "-"}</td>
                    <td title={it.hashcheck ?? ""}>{it.description ?? "-"}</td>
                    <td>{formatDate(it.fmdt)}</td>
                    <td>{formatDate(it.todt)}</td>
                    <td style={{ textAlign: "right" }}>{it.oldrate ?? "-"}</td>
                    <td style={{ textAlign: "right" }}>{it.newrate ?? "-"}</td>
                    <td style={{ textAlign: "right" }}>{it.amount ?? "-"}</td>
                    <td>{it.status ?? "-"}</td>
                    <td>{it.transtype ?? "-"}</td>
                    <td>{it.porno ?? "-"}</td>
                    <td>{it.src ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mvr-footer">
            <div className="mvr-pagination">
              <button
                className="mvr-btn"
                onClick={() => load(currentPage - 1)}
                disabled={currentPage === 1 || loading}
              >
                Prev
              </button>
              <span className="mvr-page-info">
                Page {currentPage} of {totalPages}
              </span>
              <button
                className="mvr-btn"
                onClick={() => load(currentPage + 1)}
                disabled={currentPage >= totalPages || loading}
              >
                Next
              </button>
            </div>

            <div>
              <label style={{ marginRight: 8 }}>Rows per page:</label>
              <select
                className="mvr-select"
                value={meta.limit}
                onChange={handleLimitChange}
              >
                {[5, 10, 20, 50].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

MVRHistoryTab.propTypes = {
  serviceNo: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  baseUrl: PropTypes.string,
};
