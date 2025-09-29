import React, { useEffect, useMemo, useState } from "react";
import "./ConsolidatedQueries.css";
import API_CALL from "../utils/MISApiCall";
import "./IQMSMIS.css"

const ROLE_TYPE_MAP = {
  OFFICER: "IQMS_MIS_OPW",
  AIRMEN: "IQMS_MIS_APW",
  CIVILIAN: "IQMS_MIS_CPW",
};

const ENDPOINTS = {
  IQMS_MIS_APW: [
    { section: "CQC", id: 1 },
    { section: "AFG", id: 2 },
    { section: "CCS GOVADV", id: 3 },
    { section: "CCS-IT", id: 4 },
    { section: "CQC", id: 5 },
    { section: "CQC", id: 6 },
    { section: "CQC", id: 7 },
    { section: "CCS-PLI", id: 10 },
    { section: "CCS-IAFBA", id: 11 },
    { section: "CCS-AFGIS", id: 12 },
    { section: "SR JR", id: 13 },
    { section: "CQC", id: 14 },
    { section: "CQC", id: 18 },
    { section: "CQC", id: 19 },
  ],
  IQMS_MIS_OPW: [
    { section: "PAY GROUP", id: 1 },
    { section: "FUND GROUP", id: 2 },
    { section: "GOVADV", id: 3 },
    { section: "IT", id: 4 },
    { section: "PAY GROUP", id: 5 },
    { section: "PAY GROUP", id: 6 },
    { section: "PAY GROUP", id: 7 },
    { section: "IT", id: 10 },
    { section: "LE", id: 16 },
    { section: "PAY GROUP", id: 18 },
  ],
  IQMS_MIS_CPW: [
    { section: "PAY GROUP", id: 1 },
    { section: "PAY GROUP", id: 5 },
    { section: "PAY GROUP", id: 6 },
    { section: "PAY GROUP", id: 18 },
    { section: "FUND GROUP", id: 2 },
    { section: "CCS", id: 3 },
    { section: "IT", id: 4 },
    { section: "NE", id: 7 },
    { section: "NPS", id: 9 },
    { section: "CCS", id: 10 },
  ],
};

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString();
}

function formatNumber(n) {
  return n?.toLocaleString?.() ?? n;
}

const ConsolidatedQueries = ({ initialRole = "OFFICER" }) => {
  const [role, setRole] = useState(initialRole);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [expanded, setExpanded] = useState({});
  const [showAllPending, setShowAllPending] = useState(false);

  const [loading, setLoading] = useState(false);
  const [apiResults, setApiResults] = useState([]); // [{ section, id, data, error }]
  const [globalError, setGlobalError] = useState(null);

  const [selectedRow, setSelectedRow] = useState(null); // modal selected item

  const type = ROLE_TYPE_MAP[role] || ROLE_TYPE_MAP.OFFICER;

  useEffect(() => {
    let mounted = true;
    const endpoints = ENDPOINTS[type] || [];

    async function fetchAll() {
      setLoading(true);
      setGlobalError(null);
      setApiResults([]);
      try {
        const calls = endpoints.map((ep) =>
          API_CALL(type, ep.section, ep.id, 0, 25)
            .then((data) => ({ section: ep.section, id: ep.id, data }))
            .catch((err) => ({ section: ep.section, id: ep.id, error: err }))
        );

        const settled = await Promise.all(calls);
        if (!mounted) return;
        setApiResults(settled);
      } catch (e) {
        if (!mounted) return;
        setGlobalError(e.message || "Unexpected error while fetching endpoints");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchAll();
    return () => {
      mounted = false;
    };
  }, [type]);

  const summaryBySection = useMemo(() => {
    const map = {};
    apiResults.forEach((r) => {
      const key = r.section;
      if (!map[key]) map[key] = { received: 0, replied: 0, pending: 0, rows: [] };

      if (r.data && Array.isArray(r.data.items)) {
        const items = r.data.items;
        map[key].rows.push(...items);
        map[key].received += items.length;
        items.forEach((it) => {
          const pw = (it.pending_with || "").toString().toUpperCase();
          if (pw === "RPY" || (it.pending_with_cap || "").toLowerCase().includes("replied")) {
            map[key].replied += 1;
          } else {
            map[key].pending += 1;
          }
        });
      }
      // keep error entries too (no-op for counts)
    });
    return map;
  }, [apiResults]);

  // --- NEW: totals computed from summaryBySection
  const totals = useMemo(() => {
    let totalReceived = 0;
    let totalReplied = 0;
    let totalPending = 0;
    Object.values(summaryBySection).forEach((s) => {
      totalReceived += s.received || 0;
      totalReplied += s.replied || 0;
      totalPending += s.pending || 0;
    });
    return { totalReceived, totalReplied, totalPending };
  }, [summaryBySection]);

  const allItems = useMemo(() => {
    const arr = [];
    apiResults.forEach((r) => {
      if (r.data && Array.isArray(r.data.items)) {
        arr.push(...r.data.items.map((it) => ({ ...it, _section: r.section })));
      }
    });
    return arr;
  }, [apiResults]);

  const filteredPending = useMemo(() => {
    const list = allItems.slice();
    return list
      .filter((item) => {
        if (fromDate) {
          const fd = new Date(fromDate);
          const ts = new Date(item.submit_date || item.action_date || item.receivedDate || 0);
          if (ts < fd) return false;
        }
        if (toDate) {
          const td = new Date(toDate);
          const ts = new Date(item.submit_date || item.action_date || item.receivedDate || 0);
          if (ts > td) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(a.submit_date || a.action_date || 0) - new Date(b.submit_date || b.action_date || 0));
  }, [allItems, fromDate, toDate]);

  const oldestFive = filteredPending.slice(0, 5);
  const toggleExpand = (key) => setExpanded((p) => ({ ...p, [key]: !p[key] }));

  // helpers for CQC column grouping
  const firstDigitOfCell = (cell) => {
    if (cell === null || typeof cell === "undefined") return null;
    const s = String(cell).trim();
    if (s.length === 0) return null;
    const first = s[0];
    return /^[0-9]$/.test(first) ? first : null;
  };

  // Render modal with full row details
  const Modal = ({ item, onClose }) => {
    if (!item) return null;
    return (
      <div className="cq-modal-overlay" role="dialog" aria-modal="true">
        <div className="cq-modal">
          <div className="cq-modal-header">
            <strong>Query details: {item.doc_id || item.queryId}</strong>
            <button aria-label="Close" onClick={onClose} className="cq-modal-close">✕</button>
          </div>
          <div className="cq-modal-body">
            <table className="cq-modal-table">
              <tbody>
                {Object.entries(item).map(([k, v]) => (
                  <tr key={k}>
                    <td className="k">{k}</td>
                    <td className="v">{typeof v === "string" || typeof v === "number" ? String(v) : JSON.stringify(v)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="cq-modal-footer">
            <button onClick={onClose} className="btn">Close</button>
          </div>
        </div>
      </div>
    );
  };

  // Highlight matches: cell === 207 && apw_sub_section === 'CQC'
  const highlightedMatches = useMemo(
    () => allItems.filter((it) => Number(it.cell) === 207 && (it.apw_sub_section || "").toUpperCase() === "CQC"),
    [allItems]
  );

  return (
  <div className="consolidated-page">
    {/* Loading overlay */}
    {loading && (
      <div className="loading-overlay" aria-hidden={false}>
        <div className="loading-box" role="status" aria-live="polite">
          <div className="spinner" />
          <div className="loading-text">Loading data — please wait</div>
        </div>
      </div>
    )}

    {/* Controls */}
    <div className="consolidated-controls">
      <label>
        Role:
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="themed-select"
        >
          <option value="OFFICER">OFFICER</option>
          <option value="AIRMEN">AIRMEN</option>
          <option value="CIVILIAN">CIVILIAN</option>
        </select>
      </label>

      <label>
        From
        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="themed-input"
        />
      </label>

      <label>
        To
        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="themed-input"
        />
      </label>

      <button className="primary-btn" onClick={() => {/* optional refetch */}}>
        Refresh
      </button>
    </div>

    {/* Global error */}
    {globalError && <div className="error-banner">Error: {globalError}</div>}

    {/* Per-endpoint errors */}
    {apiResults.some((r) => r.error) && (
      <div className="error-list">
        <strong>Endpoint errors:</strong>
        <ul>
          {apiResults.map(
            (r, idx) =>
              r.error && (
                <li key={idx}>
                  {r.section}/{r.id}: {r.error.message}
                </li>
              )
          )}
        </ul>
      </div>
    )}

    {/* Summary table */}
    <div className="summary-table-wrap">
      <table className="summary-table" role="grid" aria-label="Summary table">
        <thead>
          <tr>
            <th>View</th>
            <th>Section</th>
            <th className="num">Total Received</th>
            <th className="num">Replied</th>
            <th className="num">Pending</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(summaryBySection).map(([section, s]) => (
            <React.Fragment key={section}>
              <tr className="main-row">
                <td className="view-col">
                  <button
                    className="expand-btn"
                    onClick={() => toggleExpand(section)}
                    aria-expanded={!!expanded[section]}
                  >
                    {expanded[section] ? "−" : "+"}
                  </button>
                </td>
                <td>{section}</td>
                <td className="num">{formatNumber(s.received)}</td>
                <td className="num">{formatNumber(s.replied)}</td>
                <td className="num pending">{formatNumber(s.pending)}</td>
              </tr>

              {expanded[section] && (
                <tr className="sub-row">
                  <td colSpan="5">
                    <div className="sub-table-wrap">
                      {String(section).toUpperCase().includes("CQC") ? (
                        <div
                          className="cqc-grid"
                          role="region"
                          aria-label={`${section} CQC grid`}
                        >
                          <div className="cqc-grid-header">
                            {Array.from({ length: 9 }).map((_, idx) => (
                              <div
                                key={idx}
                                className="cqc-grid-col-header"
                              >
                                {idx + 1}
                              </div>
                            ))}
                          </div>
                          <div className="cqc-grid-body">
                            {Array.from({ length: 9 }).map((_, idx) => {
                              const digit = String(idx + 1);
                              const rowsForCol = s.rows.filter(
                                (it) => firstDigitOfCell(it.cell) === digit
                              );

                              return (
                                <div
                                  key={idx}
                                  className="cqc-grid-col"
                                  aria-label={`Column ${digit}`}
                                >
                                  {rowsForCol.length === 0 ? (
                                    <div className="cqc-empty">—</div>
                                  ) : (
                                    rowsForCol.map((it) => {
                                      const isHighlight =
                                        Number(it.cell) === 207 &&
                                        (it.apw_sub_section || "").toUpperCase() === "CQC";
                                      return (
                                        <div
                                          key={it.doc_id || `${it._id || Math.random()}`}
                                          className={`cqc-item ${
                                            isHighlight ? "highlighted-row" : ""
                                          }`}
                                          onClick={() => setSelectedRow(it)}
                                          tabIndex={0}
                                          role="button"
                                          aria-pressed="false"
                                        >
                                          <div className="doc">{it.doc_id}</div>
                                          <div className="pers">
                                            {it.pers || it.persDetails}
                                          </div>
                                          <div className="cell">{it.cell}</div>
                                        </div>
                                      );
                                    })
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <table
                          className="sub-table"
                          role="table"
                          aria-label={`${section} details`}
                        >
                          <thead>
                            <tr>
                              <th>doc_id</th>
                              <th>pers</th>
                              <th>cell</th>
                              <th>submit_date</th>
                              <th>action_date</th>
                              <th>querytype</th>
                              <th>pending_with</th>
                              <th>apw_sub_section</th>
                            </tr>
                          </thead>
                          <tbody>
                            {s.rows.length ? (
                              s.rows.map((it) => {
                                const isHighlight =
                                  Number(it.cell) === 207 &&
                                  (it.apw_sub_section || "").toUpperCase() === "CQC";
                                return (
                                  <tr
                                    key={it.doc_id || Math.random()}
                                    onClick={() => setSelectedRow(it)}
                                    className={isHighlight ? "highlighted-row" : ""}
                                  >
                                    <td>{it.doc_id}</td>
                                    <td className="pers">
                                      {it.pers || it.persDetails}
                                    </td>
                                    <td>{it.cell}</td>
                                    <td>{formatDate(it.submit_date)}</td>
                                    <td>{formatDate(it.action_date)}</td>
                                    <td>{it.querytype}</td>
                                    <td>
                                      {it.pending_with_cap || it.pending_with}
                                    </td>
                                    <td>{it.apw_sub_section}</td>
                                  </tr>
                                );
                              })
                            ) : (
                              <tr>
                                <td colSpan="8" className="no-data">
                                  No data
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}

          {/* Totals row */}
          <tr  style={{background:"var('--bg')"}} className="total-row">
            <td />
            <td className="total-label">TOTAL COUNT</td>
            <td className="num">{formatNumber(totals.totalReceived)}</td>
            <td className="num">{formatNumber(totals.totalReplied)}</td>
            <td className="num pending">{formatNumber(totals.totalPending)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    {/* Highlighted matches */}
    {highlightedMatches.length > 0 && (
      <div className="summary-table-wrap highlight-box">
        <strong>Matched rows (cell = 207 & apw_sub_section = CQC)</strong>
        <div className="highlight-list">
          {highlightedMatches.map((it) => (
            <div key={it.doc_id} className="highlight-row">
              {it.doc_id} — {it.pers} — {it.cell} — {formatDate(it.submit_date)}
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Oldest / pending card */}
    <div className="oldest-card">
      <div className="oldest-header">
        <div>Oldest pending (showing for {type})</div>
        <div>
          <button
            className="secondary-btn"
            onClick={() => setShowAllPending((s) => !s)}
          >
            {showAllPending ? "Show Top 5" : "View All"}
          </button>
        </div>
      </div>

      <div className="oldest-table-wrap">
        <table style={{color:"var('--text')"}} className="oldest-table" role="table" aria-label="Oldest pending">
          <thead>
            <tr>
              <th>Sl. No.</th>
              <th>Query ID</th>
              <th>Pers Details</th>
              <th>Cell</th>
              <th>Submit Date</th>
              <th>Query Type</th>
              <th>Pending With</th>
              <th>Section</th>
            </tr>
          </thead>
          <tbody>
            {(showAllPending ? filteredPending : oldestFive).map((r, idx) => (
              <tr key={r.doc_id || r.queryId || idx}>
                <td>{idx + 1}</td>
                <td>{r.doc_id || r.queryId}</td>
                <td className="pers">{r.pers || r.persDetails}</td>
                <td>{r.cell}</td>
                <td>{formatDate(r.submit_date || r.receivedDate)}</td>
                <td>{r.querytype || r.queryType}</td>
                <td>{r.pending_with_cap || r.pending_with || r.pendingWith}</td>
                <td>{r._section}</td>
              </tr>
            ))}
            {!showAllPending && oldestFive.length === 0 && (
              <tr>
                <td colSpan="8" className="no-data">
                  No pending queries found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>

    {/* modal */}
    {selectedRow && (
      <Modal item={selectedRow} onClose={() => setSelectedRow(null)} />
    )}
  </div>
);
};

export default ConsolidatedQueries;
