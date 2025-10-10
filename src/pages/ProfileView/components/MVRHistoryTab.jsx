import React, { useState, useEffect, useMemo, useRef } from 'react';
import './MVRHistoryTab.css';

const PAGE_SIZE = 10;

const MvrHistoryTable = ({ sno }) => {
  const [data, setData] = useState([]);               // grows as background pages load
  const [loading, setLoading] = useState(false);      // initial page loading only
  const [error, setError] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({
    key: 'irla',
    direction: 'desc'
  });

  // Ensures stale background fetches do not overwrite new results after sno changes
  const fetchIdRef = useRef(0);

  // Fetch first page immediately; then stream remaining pages in background
  const fetchAllData = async () => {
    const fetchId = ++fetchIdRef.current;
    setLoading(true);
    setError(null);
    setCurrentPage(1);
    setData([]);

    let offset = 0;

    try {
      // 1) Fetch the first page (10 records) and show immediately
      const firstUrl = `http://sampoorna.cao.local/afcao/ipas/ivrs/mvrHistory/${sno}?offset=${offset}&limit=${PAGE_SIZE}`;
      const firstRes = await fetch(firstUrl);
      if (!firstRes.ok) {
        throw new Error(`HTTP error! status: ${firstRes.status}`);
      }
      const firstJson = await firstRes.json();

      // Ignore if a newer fetch started (sno changed)
      if (fetchId !== fetchIdRef.current) return;

      const firstItems = Array.isArray(firstJson.items) ? firstJson.items : [];
      setData(firstItems);
      setLoading(false); // UI becomes interactive right after first page

      // 2) Stream the rest in background while user can see the first page
      let hasMore = !!firstJson.hasMore;
      // Prefer server-provided offset/limit if present
      offset = (typeof firstJson.offset === 'number' ? firstJson.offset : offset) +
               (typeof firstJson.limit === 'number' ? firstJson.limit : PAGE_SIZE);

      while (hasMore) {
        const url = `http://sampoorna.cao.local/afcao/ipas/ivrs/mvrHistory/${sno}?offset=${offset}&limit=${PAGE_SIZE}`;
        const res = await fetch(url);
        if (!res.ok) {
          // Background error: do not disrupt shown data; break streaming
          // Optionally log to console for diagnostics
          console.error('Background fetch failed:', res.status);
          break;
        }
        const json = await res.json();

        if (fetchId !== fetchIdRef.current) {
          // A newer fetch has started; stop appending
          return;
        }

        const nextItems = Array.isArray(json.items) ? json.items : [];
        if (nextItems.length) {
          setData(prev => [...prev, ...nextItems]);
        }

        hasMore = !!json.hasMore;
        const serverLimit = typeof json.limit === 'number' ? json.limit : PAGE_SIZE;
        const serverOffset = typeof json.offset === 'number' ? json.offset : offset;
        offset = serverOffset + serverLimit;
      }
    } catch (err) {
      // If first page fails, show error; if it fails during streaming, it will be caught above
      console.error('Error fetching MVR History:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sno) {
      fetchAllData();
    }
  }, [sno]);

  // Lock scroll and enable ESC to close when popup is open
  useEffect(() => {
    if (!isPopupOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e) => {
      if (e.key === 'Escape') setIsPopupOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isPopupOpen]);

  // Sorting logic
  const sortedData = useMemo(() => {
    let sortableData = [...data];
    if (sortConfig.key) {
      sortableData.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle date sorting
        if (sortConfig.key === 'fmdt' || sortConfig.key === 'todt') {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
        }

        // Handle numeric sorting
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }

        // Handle string/date sorting
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableData;
  }, [data, sortConfig]);

  // Pagination logic
  const itemsPerPage = 10;
  const totalPages = Math.ceil(sortedData.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);

  // Handle sorting
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Handle row click - open centered popup with overlay
  const handleRowClick = (row) => {
    setSelectedRow(row);
    setIsPopupOpen(true);
  };

  // Handle pagination
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Get sort icon
  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return '↕️';
    }
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  // Generate pagination numbers
  const getPaginationNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  if (loading) {
    return (
      <div className="mvr-loading">
        <div className="loading-spinner"></div>
        <p>Loading MVR History...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mvr-error">
        <h3>Error Loading Data</h3>
        <p>{error}</p>
        <button onClick={fetchAllData} className="retry-btn">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="mvr-history-container">
      <div className="mvr-header">
        <h2>MVR History - Service No: {sno}</h2>
        <div className="mvr-stats">
          <span>Total Records: {data.length}</span>
          <span>Page {currentPage} of {totalPages}</span>
        </div>
      </div>

      <div className="mvr-table-container">
        <table className="mvr-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('irla')} className="sortable">
                IRLA {getSortIcon('irla')}
              </th>
              <th>OCC ID</th>
              <th>Description</th>
              <th onClick={() => handleSort('fmdt')} className="sortable">
                From {getSortIcon('fmdt')}
              </th>
              <th onClick={() => handleSort('todt')} className="sortable">
                To {getSortIcon('todt')}
              </th>
              <th>Old Rate</th>
              <th>New Rate</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, index) => (
              <tr
                key={`${row.occ_id}-${index}`}
                onClick={() => handleRowClick(row)}
                className="mvr-row"
              >
                <td className="irla-cell">{row.irla}</td>
                <td>{row.occ_id}</td>
                <td className="description-cell">{row.description}</td>
                <td>{(row.fmdt)}</td>
                <td>{(row.todt)}</td>
                <td className="rate-cell">₹{row.oldrate?.toLocaleString('en-IN')}</td>
                <td className="rate-cell">₹{row.newrate?.toLocaleString('en-IN')}</td>
                <td className="status-cell">
                  <span className={`status-badge ${row.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
            {paginatedData.length === 0 && (
              <tr>
                <td colSpan={8} className="mvr-no-record">No records found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mvr-pagination">
        <button
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
          className="pagination-btn"
        >
          First
        </button>

        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="pagination-btn"
        >
          Previous
        </button>

        {getPaginationNumbers().map(page => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="pagination-btn"
        >
          Next
        </button>

        <button
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="pagination-btn"
        >
          Last
        </button>
      </div>

      {/* Centered Popup with blurred overlay */}
      {isPopupOpen && selectedRow && (
        <div className="mvr-overlay" role="dialog" aria-modal="true" onClick={() => setIsPopupOpen(false)}>
          <div className="mvr-popup" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">
              <h3>MVR Details</h3>
              <button
                className="popup-close"
                onClick={() => setIsPopupOpen(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="popup-content">
              <div className="popup-section">
                <div className="popup-section-title">Personal Information</div>
                <div className="popup-row">
                  <span className="popup-label">Service Number:</span>
                  <span className="popup-value">{selectedRow.sno}</span>
                </div>
                <div className="popup-row">
                  <span className="popup-label">Personnel:</span>
                  <span className="popup-value">{selectedRow.pers}</span>
                </div>
                <div className="popup-row">
                  <span className="popup-label">Category:</span>
                  <span className="popup-value">{selectedRow.cat}</span>
                </div>
                <div className="popup-row">
                  <span className="popup-label">OPPS Flag:</span>
                  <span className="popup-value">{selectedRow.opps_flag}</span>
                </div>
              </div>

              <div className="popup-section">
                <div className="popup-section-title">Transaction Details</div>
                <div className="popup-row">
                  <span className="popup-label">IRLA:</span>
                  <span className="popup-value">{selectedRow.irla}</span>
                </div>
                <div className="popup-row">
                  <span className="popup-label">OCC ID:</span>
                  <span className="popup-value">{selectedRow.occ_id}</span>
                </div>
                <div className="popup-row">
                  <span className="popup-label">Description:</span>
                  <span className="popup-value">{selectedRow.description}</span>
                </div>
                <div className="popup-row">
                  <span className="popup-label">Transaction Type:</span>
                  <span className="popup-value">{selectedRow.transtype}</span>
                </div>
              </div>

              <div className="popup-section">
                <div className="popup-section-title">Financial Details</div>
                <div className="popup-row">
                  <span className="popup-label">From Date:</span>
                  <span className="popup-value">{(selectedRow.fmdt)}</span>
                </div>
                <div className="popup-row">
                  <span className="popup-label">To Date:</span>
                  <span className="popup-value">{(selectedRow.todt)}</span>
                </div>
                <div className="popup-row">
                  <span className="popup-label">Old Rate:</span>
                  <span className="popup-value">₹{selectedRow.oldrate?.toLocaleString('en-IN')}</span>
                </div>
                <div className="popup-row">
                  <span className="popup-label">New Rate:</span>
                  <span className="popup-value">₹{selectedRow.newrate?.toLocaleString('en-IN')}</span>
                </div>
                <div className="popup-row highlight">
                  <span className="popup-label">Amount:</span>
                  <span className="popup-value amount-highlight">₹{selectedRow.amount?.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="popup-section">
                <div className="popup-section-title">System Information</div>
                <div className="popup-row">
                  <span className="popup-label">Status:</span>
                  <span className={`popup-value status-badge ${selectedRow.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                    {selectedRow.status}
                  </span>
                </div>
                <div className="popup-row">
                  <span className="popup-label">POR Number:</span>
                  <span className="popup-value">{selectedRow.porno}</span>
                </div>
                <div className="popup-row">
                  <span className="popup-label">Promotion Type:</span>
                  <span className="popup-value">{selectedRow.prom_type}</span>
                </div>
                <div className="popup-row">
                  <span className="popup-label">System Type:</span>
                  <span className="popup-value">{selectedRow.system_type}</span>
                </div>
                <div className="popup-row">
                  <span className="popup-label">Source:</span>
                  <span className="popup-value">{selectedRow.src}</span>
                </div>
                <div className="popup-row full-width">
                  <span className="popup-label">Hash Check:</span>
                  <span className="popup-value hash-check">{selectedRow.hashcheck}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MvrHistoryTable;
