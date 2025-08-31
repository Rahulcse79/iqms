import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import "./SearchResults.css";

export default function SearchResults() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

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

  // 🔹 Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      if (!queryValue) return;
      setLoading(true);
      setError("");

      try {
        let url = "";
        if (type === "Service") {
          url = `/afcao/ipas/ivrs/searchQuery_SNO_CAT/${queryValue}/${category}`;
        } else if (type === "Query") {
          url = `/afcao/ipas/ivrs/searchQuery_docId/${queryValue}`;
        }

        const { data } = await axios.get(url);
        setData(data.items || []);
      } catch (err) {
        setError("Failed to fetch results. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [type, category, queryValue]);

  // 🔹 Search & Filter
  const filteredData = useMemo(() => {
    return data.filter(
      (item) =>
        item.doc_id.toString().includes(search.toLowerCase()) ||
        (item.querytype || "").toLowerCase().includes(search.toLowerCase()) ||
        (item.pending_with_dec || "").toLowerCase().includes(search.toLowerCase())
    );
  }, [data, search]);

  // 🔹 Pagination + Sorting
  const paginatedData = useMemo(() => {
    const startIndex = (page - 1) * rowsPerPage;
    let currentPageItems = filteredData.slice(startIndex, startIndex + rowsPerPage);

    if (sortConfig.key) {
      currentPageItems = [...currentPageItems].sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key])
          return sortConfig.direction === "asc" ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key])
          return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return currentPageItems;
  }, [filteredData, page, rowsPerPage, sortConfig]);

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
    setSortConfig({ key, direction });
  };

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const handleView = (row) => {
    navigate(`/view/query/${encodeURIComponent(row.doc_id)}`, { state: { row } });
  };

  const handleClose = () => navigate(-1);

  return (
    <div className="search-container">
      <div className="search-header">
        <h2>Search Results - {type}</h2>
        <button className="close-btn" onClick={handleClose}>✕</button>
      </div>

      {loading ? (
        <p>Loading results...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : (
        <>
          {/* 🔹 Toolbar */}
          <div className="search-toolbar">
            <div className="export-buttons">
              <button className="btn export-btn" onClick={() => alert("Copy")}>Copy</button>
              <button className="btn export-btn" onClick={() => alert("CSV")}>CSV</button>
              <button className="btn export-btn" onClick={() => alert("Print")}>Print</button>
              <button className="btn export-btn" onClick={() => alert("PDF")}>PDF</button>
            </div>
            <div className="search-box">
              <input
                type="text"
                placeholder="Search..."
                className="search-bar"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* 🔹 Table */}
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
              {paginatedData.length > 0 ? (
                paginatedData.map((row, i) => (
                  <tr key={i}>
                    <td>{row.doc_id}</td>
                    <td>{row.querytype}</td>
                    <td>{new Date(row.submit_date).toLocaleDateString()}</td>
                    <td>
                      <span className={`status-badge ${row.pending_with_dec?.toLowerCase()}`}>
                        {row.pending_with_dec}
                      </span>
                    </td>
                    <td>
                      <button className="action-btn" onClick={() => handleView(row)}>View</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5">No results found</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* 🔹 Pagination */}
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
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              entries
            </label>

            <div className="pagination-buttons">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
              <span>{page} / {totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
