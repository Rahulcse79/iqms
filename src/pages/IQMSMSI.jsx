import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./ConsolidatedQueries.css";
import API_CALL from "../utils/MISApiCall";
import "./IQMSMIS.css";
import { useNavigate } from "react-router-dom";

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

/**
 * STATIC_SUBSECTION_MAP:
 * keep as an optional fallback if you want to hardcode ranges for some sections.
 * Leave empty if you want everything built dynamically.
 */
const STATIC_SUBSECTION_MAP = {
  // Example (kept empty to prefer dynamic building)
  // CQC: [
  //   { name: "CQC 1", from: 100, to: 199 },
  //   { name: "CQC 2", from: 200, to: 299 },
  // ],
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
  const [expandedSub, setExpandedSub] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiResults, setApiResults] = useState([]); // entries: { section, id, data } or { section, id, error }
  const [globalError, setGlobalError] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const navigate = useNavigate();
  const type = ROLE_TYPE_MAP[role] || ROLE_TYPE_MAP.OFFICER;

  // navigate to search-results for a doc
  const handleDocClick = useCallback(
    (docId) => {
      if (!docId) return;
      const q = encodeURIComponent(String(docId));
      navigate(`/search-results?category=${encodeURIComponent(role)}&type=Query&q=${q}`);
    },
    [navigate, role]
  );

  // Fetch
  useEffect(() => {
    let mounted = true;
    const endpoints = ENDPOINTS[type] || [];

    async function fetchAll() {
      setLoading(true);
      setGlobalError(null);
      setApiResults([]);
      try {
        const calls = endpoints.map((ep) =>
          API_CALL(type, ep.section, ep.id, 0, 100)
            .then((data) => ({ section: ep.section, id: ep.id, data }))
            .catch((err) => ({ section: ep.section, id: ep.id, error: err }))
        );

        const settled = await Promise.all(calls);
        if (!mounted) return;
        setApiResults(settled);
      } catch (e) {
        if (!mounted) return;
        setGlobalError(e?.message || "Unexpected error while fetching endpoints");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchAll();
    return () => {
      mounted = false;
    };
  }, [type]);

  // Apply filter handler
  const handleApplyFilter = useCallback(() => setApplyFilter(true), []);

  // Date filter memo — toDate is inclusive (end of day)
  const filteredResults = useMemo(() => {
    if (!applyFilter) return apiResults;
    const fd = fromDate ? new Date(fromDate) : null;
    let td = null;
    if (toDate) {
      td = new Date(toDate);
      td.setHours(23, 59, 59, 999); // inclusive
    }

    // If fd/td are invalid, treat them as null
    const fdValid = fd && !isNaN(fd) ? fd : null;
    const tdValid = td && !isNaN(td) ? td : null;

    return apiResults.map((r) => {
      if (!r?.data?.items) return r;
      const filteredItems = r.data.items.filter((item) => {
        const dateStr = item.action_date || item.submit_date;
        if (!dateStr) return false;
        const d = new Date(dateStr);
        if (isNaN(d)) return false;
        if (fdValid && d < fdValid) return false;
        if (tdValid && d > tdValid) return false;
        return true;
      });
      return { ...r, data: { ...r.data, items: filteredItems } };
    });
  }, [apiResults, fromDate, toDate, applyFilter]);

  /**
   * Build a dynamic subsection map from the filteredResults.
   * For each SECTION (normalized uppercase), we look at numeric `cell` values across all rows
   * and create 100-wide buckets:
   *  start..start+99, next 100.., etc. Each bucket gets a name like "SECTION 1", "SECTION 2"...
   */
  const dynamicSubsectionMap = useMemo(() => {
    // helper to get numeric cell from a row
    const getNumericCell = (it) => {
      if (!it) return NaN;
      // prefer it.cell; fallback to apw_sub_section / cpw_sub_section if they store numeric codes
      const raw = it.cell ?? it.apw_sub_section ?? it.cpw_sub_section ?? "";
      const s = String(raw).trim();
      const n = Number(s);
      return Number.isFinite(n) ? Math.floor(n) : NaN;
    };

    // aggregate items per normalized section
    const sectionItems = {};
    filteredResults.forEach((r) => {
      const rawSection = (r?.section ?? "UNKNOWN").toString().trim();
      const norm = rawSection.toUpperCase();
      if (!sectionItems[norm]) sectionItems[norm] = [];
      if (r?.data?.items && Array.isArray(r.data.items)) {
        sectionItems[norm].push(...r.data.items);
      }
    });

    const result = {};
    Object.entries(sectionItems).forEach(([norm, items]) => {
      // extract numeric cells
      const nums = items
        .map(getNumericCell)
        .filter((n) => !Number.isNaN(n) && n !== null && n !== undefined);

      if (!nums.length) {
        // no numeric cells - no dynamic subsections for this section
        return;
      }

      const min = Math.min(...nums);
      const max = Math.max(...nums);

      // bucket by 100 ranges, starting at floor(min / 100) * 100
      const bucketSize = 100;
      const startHundred = Math.floor(min / bucketSize) * bucketSize;
      const endHundred = Math.floor(max / bucketSize) * bucketSize;

      const ranges = [];
      for (let h = startHundred; h <= endHundred; h += bucketSize) {
        // label index relative to startHundred so first bucket is "SECTION 1"
        const idx = Math.floor(h / bucketSize) - Math.floor(startHundred / bucketSize) + 1;
        ranges.push({
          name: `${norm} ${idx}`,
          from: h,
          to: h + bucketSize - 1,
        });
      }

      // attach ranges only if found
      if (ranges.length) result[norm] = ranges;
    });

    return result;
  }, [filteredResults]);

  // Helper: map cell to subsection name (uses dynamicSubsectionMap first, then STATIC_SUBSECTION_MAP)
  const getSubsectionName = useCallback(
    (sectionNormalized, cellValue) => {
      if (cellValue === undefined || cellValue === null) return "Unassigned";
      const num = Number(cellValue);
      if (Number.isNaN(num)) return "Unassigned";

      const dynamicMap = dynamicSubsectionMap[sectionNormalized];
      const staticMap = STATIC_SUBSECTION_MAP[sectionNormalized];

      const mapToCheck = dynamicMap ?? staticMap;
      if (!mapToCheck) return null; // no configured subsections for this section

      const found = mapToCheck.find((r) => num >= r.from && num <= r.to);
      return found ? found.name : "Other";
    },
    [dynamicSubsectionMap]
  );

  // Build summary: grouped by section and subsection
  const summaryBySection = useMemo(() => {
    const map = {};

    // Pre-seed sections from fetched endpoints (keeps consistent keys)
    filteredResults.forEach((r) => {
      const rawSection = (r?.section ?? "UNKNOWN").toString().trim();
      const sectionKey = rawSection;
      if (!map[sectionKey]) {
        const norm = sectionKey.toUpperCase();
        const subsections = {};

        // prefer dynamic map when available, else fallback to static config
        const configured = dynamicSubsectionMap[norm] ?? STATIC_SUBSECTION_MAP[norm] ?? [];
        configured.forEach((s) => {
          subsections[s.name] = { name: s.name, rows: [], received: 0, replied: 0, pending: 0 };
        });

        // always include Other + Unassigned
        subsections["Other"] = { name: "Other", rows: [], received: 0, replied: 0, pending: 0 };
        subsections["Unassigned"] = { name: "Unassigned", rows: [], received: 0, replied: 0, pending: 0 };

        map[sectionKey] = { received: 0, replied: 0, pending: 0, rows: [], subsections, fetchErrors: 0 };
      }
    });

    // Fill counts and rows
    filteredResults.forEach((r) => {
      const sectionKey = (r?.section ?? "UNKNOWN").toString().trim();
      const sectionNorm = sectionKey.toUpperCase();
      if (!map[sectionKey]) {
        // create entry if somehow missed above
        const subsections = {};
        const configured = dynamicSubsectionMap[sectionNorm] ?? STATIC_SUBSECTION_MAP[sectionNorm] ?? [];
        configured.forEach((s) => {
          subsections[s.name] = { name: s.name, rows: [], received: 0, replied: 0, pending: 0 };
        });
        subsections["Other"] = { name: "Other", rows: [], received: 0, replied: 0, pending: 0 };
        subsections["Unassigned"] = { name: "Unassigned", rows: [], received: 0, replied: 0, pending: 0 };
        map[sectionKey] = { received: 0, replied: 0, pending: 0, rows: [], subsections, fetchErrors: 0 };
      }

      // Mark if this endpoint had error
      if (r?.error) {
        map[sectionKey].fetchErrors = (map[sectionKey].fetchErrors || 0) + 1;
      }

      if (r?.data && Array.isArray(r.data.items)) {
        const items = r.data.items;
        map[sectionKey].rows.push(...items);
        map[sectionKey].received += items.length;

        items.forEach((it) => {
          const pw = String(it.pending_with || "").trim().toUpperCase();
          const pendingWithCap = String(it.pending_with_cap || "").trim().toLowerCase();
          const isReplied = pw === "RPY" || pendingWithCap.includes("replied");
          if (isReplied) map[sectionKey].replied += 1;
          else map[sectionKey].pending += 1;

          const subName = getSubsectionName(sectionNorm, it.cell) ?? "Other";
          if (!map[sectionKey].subsections[subName]) {
            map[sectionKey].subsections[subName] = { name: subName, rows: [], received: 0, replied: 0, pending: 0 };
          }
          const sub = map[sectionKey].subsections[subName];
          sub.rows.push(it);
          sub.received += 1;
          if (isReplied) sub.replied += 1;
          else sub.pending += 1;
        });
      }
    });

    return map;
  }, [filteredResults, getSubsectionName, dynamicSubsectionMap]);

  const totals = useMemo(() => {
    let totalReceived = 0,
      totalReplied = 0,
      totalPending = 0;
    Object.values(summaryBySection).forEach((s) => {
      totalReceived += s.received || 0;
      totalReplied += s.replied || 0;
      totalPending += s.pending || 0;
    });
    return { totalReceived, totalReplied, totalPending };
  }, [summaryBySection]);

  const toggleExpand = useCallback((key) => setExpanded((p) => ({ ...p, [key]: !p[key] })), []);
  const toggleSub = useCallback((section, subName) =>
    setExpandedSub((p) => {
      const k = `${section}__${subName}`;
      return { ...p, [k]: !p[k] };
    }), []);

  // Modal component for showing full details of a row
  const Modal = ({ item, onClose }) => {
    const closeBtnRef = useRef(null);
    const previousActive = useRef(null);

    useEffect(() => {
      previousActive.current = document.activeElement;
      const onKey = (e) => {
        if (e.key === "Escape") onClose();
      };
      document.addEventListener("keydown", onKey);
      // focus close button when modal opens
      setTimeout(() => closeBtnRef.current?.focus?.(), 0);
      return () => {
        document.removeEventListener("keydown", onKey);
        // return focus
        try {
          previousActive.current?.focus?.();
        } catch (e) {}
      };
    }, [onClose]);

    if (!item) return null;
    return (
      <div className="cq-modal-overlay" role="dialog" aria-modal="true" aria-label="Row details">
        <div className="cq-modal" role="document">
          <div className="cq-modal-header">
            <strong style={{ color: "var(--text)" }}>Query details: {item.doc_id || item.queryId}</strong>
            <button
              ref={closeBtnRef}
              aria-label="Close"
              onClick={onClose}
              className="cq-modal-close"
            >
              ✕
            </button>
          </div>
          <div className="cq-modal-body">
            <table className="cq-modal-table">
              <tbody>
                {Object.entries(item).map(([k, v]) => (
                  <tr key={k}>
                    <td className="k" style={{ verticalAlign: "top", paddingRight: 10, whiteSpace: "nowrap" }}>{k}</td>
                    <td className="v">
                      {typeof v === "string" || typeof v === "number" ? String(v) : JSON.stringify(v, null, 2)}
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
        <button
          className="secondary-btn"
          onClick={() => {
            setFromDate("");
            setToDate("");
            setApplyFilter(false);
          }}
          style={{ marginLeft: 8 }}
        >
          Reset
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
                    <button
                      className="expand-btn"
                      onClick={() => toggleExpand(section)}
                      aria-expanded={!!expanded[section]}
                      aria-controls={`section-${section}`}
                    >
                      {expanded[section] ? "−" : "+"}
                    </button>
                  </td>
                  <td>
                    {section}
                    {s.fetchErrors > 0 && <span className="fetch-error"> (fetch failed)</span>}
                  </td>
                  <td className="num">{formatNumber(s.received)}</td>
                  <td className="num">{formatNumber(s.replied)}</td>
                  <td className="num pending">{formatNumber(s.pending)}</td>
                </tr>

                {expanded[section] && (
                  <tr id={`section-${section}`}>
                    <td colSpan="5">
                      <div className="sub-table-wrap">
                        <table className="sub-table">
                          <thead>
                            <tr>
                              <th></th>
                              <th>Sub-section</th>
                              <th className="num">Total</th>
                              <th className="num">Replied</th>
                              <th className="num">Pending</th>
                            </tr>
                          </thead>
                          <tbody>
                            {/* Show subsections: keep the configured order if available, else object order */}
                            {(() => {
                              const norm = section.toUpperCase();
                              const configured = (dynamicSubsectionMap[norm] ?? STATIC_SUBSECTION_MAP[norm] ?? []);
                              const orderedNames = [
                                ...configured.map((c) => c.name),
                                ...Object.keys(s.subsections).filter((k) => !configured.find((c) => c.name === k)),
                              ];
                              return orderedNames.map((subName) => {
                                const sub = s.subsections[subName];
                                if (!sub) return null;
                                const subKey = `${section}__${subName}`;
                                return (
                                  <React.Fragment key={subKey}>
                                    <tr className="sub-summary-row">
                                      <td>
                                        <button
                                          className="expand-btn"
                                          onClick={() => toggleSub(section, subName)}
                                          aria-expanded={!!expandedSub[subKey]}
                                          aria-controls={`sub-${subKey}`}
                                        >
                                          {expandedSub[subKey] ? "−" : "+"}
                                        </button>
                                      </td>
                                      <td>{sub.name}</td>
                                      <td className="num">{formatNumber(sub.received)}</td>
                                      <td className="num">{formatNumber(sub.replied)}</td>
                                      <td className="num pending">{formatNumber(sub.pending)}</td>
                                    </tr>

                                    {expandedSub[subKey] && (
                                      <tr id={`sub-${subKey}`}>
                                        <td colSpan="5">
                                          <div className="sub-sub-table-wrap">
                                            <table className="sub-sub-table">
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
                                                  <th>Action</th>
                                                </tr>
                                              </thead>
                                              <tbody>
                                                {sub.rows.length ? (
                                                  sub.rows.map((it) => {
                                                    const rowKey = it.doc_id ?? `${section}-${sub.name}-${it.sno ?? "no-sno"}`;
                                                    return (
                                                      <tr key={rowKey}>
                                                        <td
                                                          className="cursor-pointer"
                                                          onClick={() => handleDocClick(it.doc_id)}
                                                          style={{ textDecoration: "underline", color: "var(--link)" }}
                                                        >
                                                          {it.doc_id}
                                                        </td>
                                                        <td>{it.pers}</td>
                                                        <td>{it.cell}</td>
                                                        <td>{it.submit_date}</td>
                                                        <td>{it.action_date}</td>
                                                        <td>{it.querytype}</td>
                                                        <td>{it.pending_with_cap || it.pending_with}</td>
                                                        <td>{it.apw_sub_section || it.cpw_sub_section}</td>
                                                        <td>
                                                          <button
                                                            className="secondary-btn"
                                                            onClick={() => setSelectedRow(it)}
                                                            aria-label={`View details for ${it.doc_id}`}
                                                          >
                                                            View
                                                          </button>
                                                        </td>
                                                      </tr>
                                                    );
                                                  })
                                                ) : (
                                                  <tr>
                                                    <td colSpan="9" className="no-data">
                                                      No data in this sub-section
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
                                );
                              });
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}

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
