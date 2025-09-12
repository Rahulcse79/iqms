import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import axios from "axios";
import "./SearchResults.css";
import { UserRoleLabel } from "../../constants/Enum";

export default function SearchResults() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const type = searchParams.get("type") || "";
  const category = searchParams.get("category") || "";
  const queryValue = searchParams.get("q") || "";

  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // cache per query key -> items
  const cacheRef = useRef({});
  // fetch id to ignore stale responses
  const fetchIdRef = useRef(0);

  // origin to fallback to when no history
  const origin = location.state?.from || "/";

  // build a stable cache key
  const key = `${type}|${category}|${String(queryValue)}`;

  // fetchData supports silent background update when showLoading==false and cached exists
  const fetchData = useCallback(
    async ({ controller, showLoading = true, forceRefresh = false } = {}) => {
      if (!queryValue) return;

      // if cached and not forcing refresh, show cached immediately and do a silent refresh in background
      if (cacheRef.current[key] && !forceRefresh && !showLoading) {
        // background fetch (silent): do not change UI loading state, but update cache when done
        const backgroundId = ++fetchIdRef.current;
        try {
          let url = "";
          if (type === "Service") {
            // find numeric code by matching label with selected category
            const roleCode = Object.keys(UserRoleLabel).find(
              (key) =>
                UserRoleLabel[key].toLowerCase() === category.toLowerCase()
            );

            url = `http://sampoorna.cao.local/afcao/ipas/ivrs/searchQuery_SNO_CAT/${queryValue}/${
              roleCode
            }`;
          } else {
            url = `http://sampoorna.cao.local/afcao/ipas/ivrs/searchQuery_docId/${queryValue}`;
          }
          const res = await axios.get(url, { signal: controller.signal });
          if (fetchIdRef.current === backgroundId) {
            cacheRef.current[key] = res.data.items || [];
            // update displayed data only if the user is still viewing this query
            setData(cacheRef.current[key]);
          }
        } catch (err) {
          if (err.name !== "CanceledError") {
            // background failure: just log it (do not show error UI)
            console.error("Background refresh error:", err);
          }
        }
        return;
      }

      // normal path: show loader (unless showLoading false)
      const currentId = ++fetchIdRef.current;
      if (showLoading) {
        setLoading(true);
      }
      setError("");
      // if there is cached data and showLoading is true we still show cached quickly while setting loading true
      if (cacheRef.current[key] && showLoading) {
        setData(cacheRef.current[key]);
      } else if (!cacheRef.current[key]) {
        // clear previous data to avoid showing wrong results while a fresh fetch is in progress
        setData([]);
      }

      try {
        let url = "";
        if (type === "Service") {
          const roleCode = Object.keys(UserRoleLabel).find(
            (key) => 
              UserRoleLabel[key].toLowerCase() === category.toLowerCase()
          )
          url = `http://sampoorna.cao.local/afcao/ipas/ivrs/searchQuery_SNO_CAT/${queryValue}/${roleCode}`;
        } else {
          url = `http://sampoorna.cao.local/afcao/ipas/ivrs/searchQuery_docId/${queryValue}`;
        }
        const res = await axios.get(url, { signal: controller.signal });

        // ignore stale responses
        if (fetchIdRef.current !== currentId) return;

        const items = res.data.items || [];
        cacheRef.current[key] = items;
        setData(items);
      } catch (err) {
        if (err.name !== "CanceledError") {
          console.error("API error:", err);
          // unify error message and avoid duplicate lines
          setError(
            `Failed to fetch ${type} results for "${queryValue}" in ${category}.`
          );
          setData([]); // ensure empty on error
        }
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [key, type, queryValue, category]
  );

  // initial fetch on param change
  useEffect(() => {
    if (!queryValue) return;
    const controller = new AbortController();

    // If cached, show it immediately and run a silent background refresh
    if (cacheRef.current[key]) {
      setData(cacheRef.current[key]);
      fetchData({ controller, showLoading: false, forceRefresh: false }).catch(
        () => {}
      );
      return () => controller.abort();
    }

    // else show loading and fetch
    fetchData({ controller, showLoading: true }).catch(() => {});
    return () => controller.abort();
  }, [fetchData, key, queryValue]);

  // Search & Filter
  const filteredData = useMemo(() => {
    const q = search.toLowerCase();
    return data.filter(
      (item) =>
        String(item.doc_id || "")
          .toLowerCase()
          .includes(q) ||
        String(item.querytype || "")
          .toLowerCase()
          .includes(q) ||
        String(item.pending_with_dec || "")
          .toLowerCase()
          .includes(q)
    );
  }, [data, search]);

  // Pagination + Sorting
  const paginatedData = useMemo(() => {
    const startIndex = (page - 1) * rowsPerPage;
    let currentPageItems = filteredData.slice(
      startIndex,
      startIndex + rowsPerPage
    );

    if (sortConfig.key) {
      currentPageItems = [...currentPageItems].sort((a, b) => {
        const av = a[sortConfig.key];
        const bv = b[sortConfig.key];
        if (av < bv) return sortConfig.direction === "asc" ? -1 : 1;
        if (av > bv) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return currentPageItems;
  }, [filteredData, page, rowsPerPage, sortConfig]);

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc")
      direction = "desc";
    setSortConfig({ key, direction });
  };

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const handleView = (row) => {
    const key = `${type}|${category}|${String(queryValue)}`;
  
    navigate(
      `/view/query/${encodeURIComponent(row.doc_id)}?category=${encodeURIComponent(
        category
      )}&type=${encodeURIComponent(type)}&q=${encodeURIComponent(queryValue)}`,
      { state: { row, key } }
    );
  };

  // Close/back behavior:
  // If there's a previous history entry, go back one step (this handles stepping through earlier searches).
  // If no history index, fallback to origin (the page which opened the first search).
  const handleClose = () => {
    const idx = window.history?.state?.idx ?? -1;
    if (idx > 0) {
      navigate(-1);
    } else {
      navigate(origin, { replace: true });
    }
  };

  return (
    <div className="search-container">
      <div  style={{padding :"10px"}} className="search-header">
        <h2>
          Search Results for {type} Number - {queryValue}
        </h2>
        <button className="close-btn" onClick={handleClose}>
          ✕
        </button>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="loading-box">
          <p>
            🔍 Searching {type} for "{queryValue}" in {category}...
          </p>
        </div>
      ) : null}

      {/* Error */}
      {!loading && error ? (
        <div className="error-box">
          <p>{error}</p>
          <div style={{ marginTop: 8 }}>
            <button
              onClick={() =>
                fetchData({
                  controller: new AbortController(),
                  showLoading: true,
                })
              }
              disabled={loading}
            >
              Retry
            </button>
          </div>
        </div>
      ) : null}

      {/* No results (only shown when not loading and no error and empty) */}
      {!loading && !error && data.length === 0 ? (
        <div className="error-box">
          <p>
            No {type} results found for "{queryValue}" in {category}.
          </p>
        </div>
      ) : null}

      {/* Data table */}
      {!loading && !error && data.length > 0 ? (
        <>
          <div className="search-toolbar">
            <div className="export-buttons">
              <button className="btn export-btn" onClick={() => alert("Copy")}>
                Copy
              </button>
              <button className="btn export-btn" onClick={() => alert("CSV")}>
                CSV
              </button>
              <button className="btn export-btn" onClick={() => alert("Print")}>
                Print
              </button>
              <button className="btn export-btn" onClick={() => alert("PDF")}>
                PDF
              </button>
            </div>
            <div className="search-box">
              <input
                type="text"
                placeholder="Search in results..."
                className="search-bar"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>

          <table className="styled-table">
            <thead>
              <tr>
                <th onClick={() => requestSort("doc_id")}>Query ID</th>
                <th onClick={() => requestSort("querytype")}>Query Type</th>
                <th onClick={() => requestSort("submit_date")}>Submit Date</th>
                <th onClick={() => requestSort("pending_with_dec")}>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row, i) => (
                <tr key={i}>
                  <td>{row.doc_id}</td>
                  <td>{row.querytype}</td>
                  <td>
                    {row.submit_date
                      ? new Date(row.submit_date).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td>
                    <span
                      className={`status-badge ${String(
                        row.pending_with_dec || ""
                      ).toLowerCase()}`}
                    >
                      {row.pending_with_dec}
                    </span>
                  </td>
                  <td>
                    <button
                      className="action-btn"
                      onClick={() => handleView(row)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pagination">
            <label>
              Show
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setPage(1);
                }}
              >
                {[5, 10, 20].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              entries
            </label>

            <div className="pagination-buttons">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
              <span>
                {page} / {totalPages || 1}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
