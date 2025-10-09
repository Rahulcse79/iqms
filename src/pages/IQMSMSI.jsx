import React, { useEffect, useMemo, useState } from "react";
import "./ConsolidatedQueries.css";
import API_CALL from "../utils/MISApiCall";
import "./IQMSMIS.css";

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

function formatNumber(n) {
  return n?.toLocaleString?.() ?? n;
}

const ConsolidatedQueries = ({ initialRole = "OFFICER" }) => {
  const [role, setRole] = useState(initialRole);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [applyFilter, setApplyFilter] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiResults, setApiResults] = useState([]);
  const [globalError, setGlobalError] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);

  const type = ROLE_TYPE_MAP[role] || ROLE_TYPE_MAP.OFFICER;

  // ---- Fetch Data
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

  // ---- Handle Apply Filter
  const handleApplyFilter = () => {
    setApplyFilter(true);
  };

  // ---- Apply date range filter globally
  const filteredResults = useMemo(() => {
    if (!applyFilter) return apiResults;

    const fd = fromDate ? new Date(fromDate) : null;
    const td = toDate ? new Date(toDate) : null;

    return apiResults.map((r) => {
      if (!r.data?.items) return r;
      const filteredItems = r.data.items.filter((item) => {
        const dateStr = item.submit_date || item.action_date;
        if (!dateStr) return false;
        const d = new Date(dateStr);
        if (fd && d < fd) return false;
        if (td && d > td) return false;
        return true;
      });
      return { ...r, data: { ...r.data, items: filteredItems } };
    });
  }, [apiResults, fromDate, toDate, applyFilter]);

  // ---- Compute summary per section
  const summaryBySection = useMemo(() => {
    const map = {};
    filteredResults.forEach((r) => {
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
    });
    return map;
  }, [filteredResults]);

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

  const toggleExpand = (key) => setExpanded((p) => ({ ...p, [key]: !p[key] }));

  // ---- Modal for row details
  const Modal = ({ item, onClose }) => {
    if (!item) return null;
    return (
      <div className="cq-modal-overlay" role="dialog" aria-modal="true">
        <div className="cq-modal">
          <div className="cq-modal-header">
            <strong style={{color:"var(--text)"}}>Query details: {item.doc_id || item.queryId}</strong>
            <button aria-label="Close" onClick={onClose} className="cq-modal-close">
              ✕
            </button>
          </div>
          <div className="cq-modal-body">
            <table className="cq-modal-table">
              <tbody>
                {Object.entries(item).map(([k, v]) => (
                  <tr key={k}>
                    <td className="k">{k}</td>
                    <td className="v">
                      {typeof v === "string" || typeof v === "number" ? String(v) : JSON.stringify(v)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="consolidated-page">
      {loading && (
        <div className="loading-overlay">
          <div className="loading-box">
            <div className="spinner" />
            <div className="loading-text">Loading data — please wait</div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="consolidated-controls">
        <label>
          Role:
          <select value={role} onChange={(e) => setRole(e.target.value)} className="themed-select">
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

        <button className="primary-btn" onClick={handleApplyFilter}>
          Apply
        </button>
      </div>

      {globalError && <div className="error-banner">Error: {globalError}</div>}

      <div className="summary-table-wrap">
        <table className="summary-table">
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
                  <td>
                    <button className="expand-btn" onClick={() => toggleExpand(section)}>
                      {expanded[section] ? "−" : "+"}
                    </button>
                  </td>
                  <td>{section}</td>
                  <td className="num">{formatNumber(s.received)}</td>
                  <td className="num">{formatNumber(s.replied)}</td>
                  <td className="num pending">{formatNumber(s.pending)}</td>
                </tr>

                {expanded[section] && (
                  <tr>
                    <td colSpan="5">
                      <div className="sub-table-wrap">
                        <table className="sub-table">
                          <thead>
                            <tr>
                              <th>doc_id</th>
                              <th>pers</th>
                              <th>cell</th>
                              <th>submit_date</th>
                              <th>action_date</th>
                              <th>querytype</th>
                              <th>pending_with</th>
                              <th>apw_sub_section / cpw_sub_section</th>
                            </tr>
                          </thead>
                          <tbody>
                            {s.rows.length ? (
                              s.rows.map((it) => (
                                <tr
                                  key={it.doc_id || Math.random()}
                                  onClick={() => setSelectedRow(it)}
                                >
                                  <td>{it.doc_id}</td>
                                  <td>{it.pers}</td>
                                  <td>{it.cell}</td>
                                  <td>{it.submit_date}</td>
                                  <td>{it.action_date}</td>
                                  <td>{it.querytype}</td>
                                  <td>{it.pending_with_cap || it.pending_with}</td>
                                  <td>{it.apw_sub_section || it.cpw_sub_section}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="8" className="no-data">
                                  No data in range
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}

            {/* Totals row */}
            <tr className="total-row">
              <td />
              <td className="total-label">TOTAL COUNT</td>
              <td className="num">{formatNumber(totals.totalReceived)}</td>
              <td className="num">{formatNumber(totals.totalReplied)}</td>
              <td className="num pending">{formatNumber(totals.totalPending)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {selectedRow && <Modal item={selectedRow} onClose={() => setSelectedRow(null)} />}
    </div>
  );
};

export default ConsolidatedQueries;
