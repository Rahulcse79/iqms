import React, { useEffect, useMemo, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchFrqQueryCount, clearFrqQryResults } from "../actions/queryActions"; // adjust path if needed
import { userRoleOptions, getUserRoleLabel } from "../constants/Enum"; // adjust path if needed
import { useNavigate } from "react-router-dom";
import "./FreqQuery.css";

const DEFAULT_PAGE_SIZE = 10;

/* small helper to produce stable bucket key used by reducer/actions */
function bucketKeyForRole(roleCode) {
  return `role${roleCode}`;
}

function trimPers(persValue) {
  if (!persValue) return "";
  return String(persValue).trim();
}


/* small utility to build compact page range with ellipses */
function buildPageRange(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = [];
  pages.push(1);
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push("...");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push("...");
  pages.push(total);
  return pages;
}

function downloadCSV(filename, rows) {
  if (!rows || rows.length === 0) return;
  const columns = Object.keys(rows[0]);
  const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [columns.join(",")]
    .concat(rows.map((r) => columns.map((c) => escape(r[c])).join(",")))
    .join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export default function FreqQuery() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // selected role default -> first option (or 0)
  const defaultRole =
    (userRoleOptions && userRoleOptions[0] && userRoleOptions[0].value) ?? 0;
  const [selectedRole, setSelectedRole] = useState(defaultRole);

  // local interaction state
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [localItems, setLocalItems] = useState([]);
  const [localError, setLocalError] = useState(null);
  const [loading, setLoading] = useState(false);

  // ref to hold pending promise so we can cancel on unmount or new requests
  const pendingPromiseRef = useRef(null);

  // derive bucket key
  const bucketKey = useMemo(() => bucketKeyForRole(selectedRole), [selectedRole]);

  // read reducer bucket safely (support common mount names)
  const bucket = useSelector((state) => {
    // prefer state.frqQry / frqQryReducer / fallback root
    const roots = state?.frqQry ?? state?.frqQryReducer ?? state;
    return roots?.byKey?.[bucketKey] ?? null;
  });

  // derive data & metadata from bucket
  const reduxItems = bucket?.items ?? null;
  const reduxError = bucket?.error ?? null;
  const reduxLoading = !!bucket?.loading;
  const lastFetched = bucket?.lastFetched ?? bucket?.requestedAt ?? null;

  // keep local items in sync with redux items (so we can filter & paginate locally)
  useEffect(() => {
    if (Array.isArray(reduxItems)) {
      setLocalItems(reduxItems);
      setLocalError(null);
    }
    if (reduxError) {
      const message =
        (reduxError && reduxError.message) || reduxError || "Error loading data";
      setLocalError(message);
    }
    // when role changes, reset pagination and search
    setCurrentPage(1);
    setSearchTerm("");
  }, [reduxItems, reduxError, selectedRole]);

  // initial fetch on mount and whenever selectedRole changes
  useEffect(() => {
    // fetch cached or remote via action
    const doFetch = async (force = false) => {
      setLoading(true);
      setLocalError(null);
      try {
        const p = dispatch(
          fetchFrqQueryCount(selectedRole, { key: bucketKey, force })
        );
        pendingPromiseRef.current = p;
        const data = await p;
        setLocalItems(Array.isArray(data?.items) ? data.items : []);
      } catch (err) {
        const msg = err?.message || "Unable to fetch data";
        setLocalError(msg);
      } finally {
        setLoading(false);
      }
    };

    doFetch(false);

    return () => {
      // cancel pending call if component unmounts or role changes
      try {
        if (
          pendingPromiseRef.current &&
          typeof pendingPromiseRef.current.cancel === "function"
        ) {
          pendingPromiseRef.current.cancel();
        }
      } catch (e) {
        // ignore
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, selectedRole]); // intentionally not including bucketKey since derived from selectedRole

  // filtered items according to searchTerm
  const filteredItems = useMemo(() => {
    if (!searchTerm) return localItems || [];
    const q = searchTerm.trim().toLowerCase();
    return (localItems || []).filter((it) => {
      const pers = trimPers(it.pers || "");
      const count = String(it.total_frq_count || "");
      return pers.toLowerCase().includes(q) || count.includes(q);
    });
  }, [localItems, searchTerm]);

  // pagination
  const totalItems = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  useEffect(() => {
    // clamp current page
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  const pageSlice = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  // actions
  const handleRefresh = async () => {
    try {
      // cancel any pending
      if (
        pendingPromiseRef.current &&
        typeof pendingPromiseRef.current.cancel === "function"
      ) {
        pendingPromiseRef.current.cancel();
      }
    } catch (e) {}
    setLoading(true);
    setLocalError(null);
    try {
      const p = dispatch(
        fetchFrqQueryCount(selectedRole, { key: bucketKey, force: true })
      );
      pendingPromiseRef.current = p;
      const data = await p;
      setLocalItems(Array.isArray(data?.items) ? data.items : []);
      setCurrentPage(1);
    } catch (err) {
      setLocalError(err?.message || "Refresh failed");
    } finally {
      setLoading(false);
    }
  };

  const handleFreqView = (row) => {
    const categoryRaw = getUserRoleLabel(selectedRole);
    const category = String(categoryRaw ?? "").trim().toUpperCase() || String(selectedRole);
    const search = `?category=${encodeURIComponent(category)}&type=${encodeURIComponent(
      "Service"
    )}&q=${encodeURIComponent(row?.sno)}`;
    // Navigate to: /search-results?category=<CATEGORY>&type=Service&q=<SERVICE_NUMBER>
    navigate({ pathname: "/search-results", search });
  };

  const handleClearCache = () => {
    dispatch(clearFrqQryResults());
    setLocalItems([]);
    setLocalError(null);
  };

  const handleExportCSV = () => {
    const rows = (filteredItems || []).map((r, idx) => ({
      sno: idx + 1,
      pers: trimPers(r.pers),
      total_frq_count: r.total_frq_count ?? "",
    }));
    downloadCSV(`freq-query-role-${selectedRole}.csv`, rows);
  };

  // rendering
  return (
    <div className="freq-page" aria-live="polite">
      <header className="freq-header">
        <h2 className="freq-title">Frequent Query Count</h2>
        <p className="freq-sub">
          Select a role to view total frequent-query counts. Data is cached per role.
        </p>
      </header>

      <div className="freq-controls">
        <label htmlFor="role-select" className="freq-label">
          Role
        </label>
        <select
          id="role-select"
          className="freq-select"
          value={selectedRole}
          onChange={(e) => {
            setSelectedRole(Number(e.target.value));
            setCurrentPage(1);
          }}
        >
          {userRoleOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <div className="freq-actions">
          <button
            className="freq-btn freq-btn-primary"
            onClick={handleRefresh}
            disabled={loading}
            aria-disabled={loading}
          >
            {loading ? "Loading…" : "Refresh"}
          </button>

          <button
            className="freq-btn"
            onClick={() => {
              setSearchTerm("");
              setCurrentPage(1);
            }}
          >
            Clear Filter
          </button>

          <button
            className="freq-btn"
            onClick={handleExportCSV}
            disabled={totalItems === 0}
          >
            Export CSV
          </button>

          <button className="freq-btn freq-btn-danger" onClick={handleClearCache}>
            Clear Cache
          </button>
        </div>

        <div className="freq-meta">
          <span className="freq-meta-item">
            Role: <strong>{getUserRoleLabel(selectedRole)}</strong>
          </span>
          {lastFetched && (
            <span className="freq-meta-item">
              Last fetched:{" "}
              <time dateTime={lastFetched}>
                {new Date(lastFetched).toLocaleString()}
              </time>
            </span>
          )}
          <span className="freq-meta-item">
            Total: <strong>{totalItems}</strong>
          </span>
        </div>

        <div className="freq-filter">
          <input
            className="freq-search"
            placeholder="Search by name or count..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Search"
          />
        </div>
      </div>

      <div className="freq-panel">
        {localError ? (
          <div className="freq-error">
            <div className="freq-error-text">{localError}</div>
            <div>
              <button className="freq-btn freq-btn-primary" onClick={handleRefresh}>
                Retry
              </button>
            </div>
          </div>
        ) : loading && (!reduxItems || reduxItems.length === 0) ? (
          <div className="freq-loading">Loading…</div>
        ) : totalItems === 0 ? (
          <div className="freq-empty">No results found.</div>
        ) : (
          <>
            <table
              className="freq-table"
              role="table"
              aria-label="Frequent Query Count table"
            >
              <thead>
                <tr>
                  <th style={{ width: 60 }}>S.No</th>
                  <th>Name / Person</th>
                  <th style={{ width: 140 }}>Total FRQ Count</th>
                  <th style={{ width: 140 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {pageSlice.map((row, idx) => (
                  <tr key={`${trimPers(row.pers)}-${row.total_frq_count}-${idx}`}>
                    <td>{(currentPage - 1) * pageSize + idx + 1}</td>
                    <td className="freq-pers">{trimPers(row.pers)}</td>
                    <td className="freq-count">{row.total_frq_count ?? "-"}</td>
                    <td>
                      <button
                        onClick={() => handleFreqView(row)}
                        aria-label={`View details for ${trimPers(row.pers)}`}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="freq-pagination-wrap">
              <div className="freq-pagination-meta">
                Showing {(currentPage - 1) * pageSize + 1}–
                {Math.min(currentPage * pageSize, totalItems)} of {totalItems}
              </div>

              <div
                className="freq-pagination"
                role="navigation"
                aria-label="Table pagination"
              >
                <button
                  className="freq-page-btn"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  aria-disabled={currentPage === 1}
                >
                  Prev
                </button>

                {buildPageRange(currentPage, totalPages).map((p, i) =>
                  p === "..." ? (
                    <span key={`ell-${i}`} className="pagination-ellipsis" aria-hidden>
                      &hellip;
                    </span>
                  ) : (
                    <button
                      key={p}
                      className={`freq-page-btn ${p === currentPage ? "active" : ""}`}
                      onClick={() => setCurrentPage(p)}
                      aria-current={p === currentPage ? "page" : undefined}
                    >
                      {p}
                    </button>
                  )
                )}

                <button
                  className="freq-page-btn"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  aria-disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>

              <div className="freq-pagesize">
                <label htmlFor="pagesize" className="sr-only">
                  Page size
                </label>
                <select
                  id="pagesize"
                  className="freq-pagesize-select"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  <option value={5}>5 / page</option>
                  <option value={10}>10 / page</option>
                  <option value={20}>20 / page</option>
                </select>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
