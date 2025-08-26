import React, { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./SearchResults.css";

const dummyData = Array.from({ length: 45 }, (_, i) => ({
  queryId: `Q${1000 + i}`,
  particulars: `Particular ${i + 1}`,
  queryDate: `2025-08-${(i % 30) + 1}`,
  status: i % 2 === 0 ? "Open" : "Closed",
}));

export default function SearchResults() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const category = searchParams.get("category") || "";
  const type = searchParams.get("type") || "";
  const query = searchParams.get("q") || "";

  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const filteredData = useMemo(() => {
    return dummyData.filter(
      (item) =>
        item.queryId.toLowerCase().includes(search.toLowerCase()) ||
        item.particulars.toLowerCase().includes(search.toLowerCase()) ||
        item.status.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

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
    if (sortConfig.key === key && sortConfig.direction === "asc")
      direction = "desc";
    setSortConfig({ key, direction });
  };

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const handleView = (row) => {
    navigate(`/view/query/${encodeURIComponent(row.queryId)}`, {
      state: { row },
    });
  };

  const handleClose = () => {
    navigate(-1); // ✅ Go back to previous page
  };

  return (
    <div className="search-container">
      <div className="search-header">
        <h2>Search Results - {type}</h2>
        <button className="close-btn" onClick={handleClose}>✕</button>
      </div>

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

      <table className="styled-table">
        <thead>
          <tr>
            <th onClick={() => requestSort("queryId")}>Query ID</th>
            <th onClick={() => requestSort("particulars")}>Particulars</th>
            <th onClick={() => requestSort("queryDate")}>Query Date</th>
            <th onClick={() => requestSort("status")}>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {paginatedData.length > 0 ? (
            paginatedData.map((row, i) => (
              <tr key={i}>
                <td>{row.queryId}</td>
                <td>{row.particulars}</td>
                <td>{row.queryDate}</td>
                <td>
                  <span className={`status-badge ${row.status.toLowerCase()}`}>
                    {row.status}
                  </span>
                </td>
                <td>
                  <button className="action-btn" onClick={() => handleView(row)}>
                    View
                  </button>
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
          <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </button>
          <span>
            {page} / {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
