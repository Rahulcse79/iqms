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

const STATIC_SUBSECTION_MAP = {
  // keep empty unless you want static hardcoded subsections
};

function formatNumber(n) {
  return n?.toLocaleString?.() ?? n;
}

// make ids safe for HTML id attributes and aria-controls
const safeId = (s) =>
  String(s || "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^A-Za-z0-9_\-:]/g, "")
    .slice(0, 80);

// convert arbitrary date string to yyyy-mm-dd (date-only) or null
const toDateOnly = (dateLike) => {
  if (!dateLike) return null;
  const d = new Date(dateLike);
  if (isNaN(d)) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
};

const ConsolidatedQueries = ({ initialRole = "OFFICER" }) => {
  const [role, setRole] = useState(initialRole);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [applyFilter, setApplyFilter] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [expandedSub, setExpandedSub] = useState({});
  const [expandedGroups, setExpandedGroups] = useState({}); 
  const [loading, setLoading] = useState(false);
  const [apiResults, setApiResults] = useState([]);
  const [globalError, setGlobalError] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const navigate = useNavigate();
  const type = ROLE_TYPE_MAP[role] || ROLE_TYPE_MAP.OFFICER;

  const toggleGroup = useCallback((groupKey) => {
    setExpandedGroups((p) => ({ ...p, [groupKey]: !(p[groupKey] === undefined ? true : !!p[groupKey]) }));
  }, []);

  const handleDocClick = useCallback(
    (docId) => {
      if (!docId) return;
      const q = encodeURIComponent(String(docId));
      navigate(`/search-results?category=${encodeURIComponent(role)}&type=Query&q=${q}`);
    },
    [navigate, role]
  );

  useEffect(() => {
    let mounted = true;
    const endpoints = ENDPOINTS[type] || [];

    async function fetchAll() {
      setLoading(true);
      setGlobalError(null);
      setApiResults([]);
      try {
        const calls = endpoints.map((ep) =>
          API_CALL(type, ep.section, ep.id, 0)
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

  const handleApplyFilter = useCallback(() => setApplyFilter(true), []);

  // map pending_with to category per your updated rules
  const mapPendingToCategory = useCallback((it) => {
    const pw = String(it?.pending_with ?? "").trim().toUpperCase();
    if (!pw) return "Replied";
    if (pw === "RPY") return "Replied";
    // precedence: 2 -> 1 -> 3 (as requested earlier)
    if (pw.includes("2")) return "Verifier";
    if (pw.includes("1")) return "Creator";
    if (pw.includes("3")) return "Approver";
    return "Replied";
  }, []);

  // date-only filtering: compare yyyy-mm-dd strings to avoid timezone issues
  const filteredResults = useMemo(() => {
    if (!applyFilter) return apiResults;
    const fd = fromDate || null; // already yyyy-mm-dd
    const td = toDate || null;

    return apiResults.map((r) => {
      if (!r?.data?.items || !Array.isArray(r.data.items)) return r;
      const filteredItems = r.data.items.filter((item) => {
        const dateStr = item.action_date || item.submit_date;
        if (!dateStr) return false;
        const dOnly = toDateOnly(dateStr);
        if (!dOnly) return false;
        if (fd && dOnly < fd) return false;
        if (td && dOnly > td) return false;
        return true;
      });
      return { ...r, data: { ...r.data, items: filteredItems } };
    });
  }, [apiResults, fromDate, toDate, applyFilter]);

  // build dynamic subsection map based on filteredResults (numerical ranges)
  const dynamicSubsectionMap = useMemo(() => {
    const getNumericCell = (it) => {
      if (!it) return NaN;
      const raw = it.cell ?? it.apw_sub_section ?? it.cpw_sub_section ?? "";
      const s = String(raw).trim();
      const n = Number(s);
      return Number.isFinite(n) ? Math.floor(n) : NaN;
    };

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
      const nums = items
        .map(getNumericCell)
        .filter((n) => !Number.isNaN(n) && n !== null && n !== undefined);

      if (!nums.length) return;

      const min = Math.min(...nums);
      const max = Math.max(...nums);

      const bucketSize = 100;
      const startHundred = Math.floor(min / bucketSize) * bucketSize;
      const endHundred = Math.floor(max / bucketSize) * bucketSize;

      const ranges = [];
      for (let h = startHundred; h <= endHundred; h += bucketSize) {
        const idx = Math.floor(h / bucketSize) - Math.floor(startHundred / bucketSize) + 1;
        ranges.push({
          name: `${norm} ${idx}`,
          from: h,
          to: h + bucketSize - 1,
        });
      }
      if (ranges.length) result[norm] = ranges;
    });

    return result;
  }, [filteredResults]);

  const getSubsectionName = useCallback(
    (sectionNormalized, cellValue) => {
      if (cellValue === undefined || cellValue === null) return "Unassigned";
      const num = Number(cellValue);
      if (Number.isNaN(num)) return "Unassigned";
      const dynamicMap = dynamicSubsectionMap[sectionNormalized];
      const staticMap = STATIC_SUBSECTION_MAP[sectionNormalized];
      const mapToCheck = dynamicMap ?? staticMap;
      if (!mapToCheck) return "Other";
      const found = mapToCheck.find((r) => num >= r.from && num <= r.to);
      return found ? found.name : "Other";
    },
    [dynamicSubsectionMap]
  );

  // Build summaryBySection in a single pass (normalized keys for lookup)
  const summaryBySection = useMemo(() => {
    const map = {};

    filteredResults.forEach((r) => {
      const sectionRaw = (r?.section ?? "UNKNOWN").toString().trim();
      const sectionKey = sectionRaw; // keep original-case for display
      const sectionNorm = sectionRaw.toUpperCase();

      if (!map[sectionKey]) {
        const configured = dynamicSubsectionMap[sectionNorm] ?? STATIC_SUBSECTION_MAP[sectionNorm] ?? [];
        const subsections = {};
        configured.forEach((s) => {
          subsections[s.name] = { name: s.name, rows: [], received: 0, replied: 0, pending: 0 };
        });
        subsections["Other"] = { name: "Other", rows: [], received: 0, replied: 0, pending: 0 };
        subsections["Unassigned"] = { name: "Unassigned", rows: [], received: 0, replied: 0, pending: 0 };

        map[sectionKey] = { received: 0, replied: 0, pending: 0, rows: [], subsections, fetchErrors: 0 };
      }

      if (r?.error) {
        map[sectionKey].fetchErrors = (map[sectionKey].fetchErrors || 0) + 1;
      }

      if (r?.data && Array.isArray(r.data.items)) {
        const items = r.data.items;
        map[sectionKey].rows.push(...items);
        map[sectionKey].received += items.length;

        items.forEach((it) => {
          const pw = String(it.pending_with || "").trim().toUpperCase();
          const isReplied = pw === "RPY";
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

  // Modal component (focus trap, escape, overlay click, prevent background scroll)
  const Modal = ({ item, onClose }) => {
    const closeBtnRef = useRef(null);
    const previousActive = useRef(null);
    const modalRef = useRef(null);

    useEffect(() => {
      previousActive.current = document.activeElement;

      const onKey = (e) => {
        if (e.key === "Escape") onClose();
        if (e.key === "Tab" && modalRef.current) {
          const focusable = modalRef.current.querySelectorAll(
            'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
          );
          if (focusable.length === 0) return;
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      };

      document.addEventListener("keydown", onKey);
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      setTimeout(() => closeBtnRef.current?.focus?.(), 0);

      return () => {
        document.removeEventListener("keydown", onKey);
        document.body.style.overflow = prevOverflow || "";
        try {
          previousActive.current?.focus?.();
        } catch (e) {}
      };
    }, [onClose]);

    if (!item) return null;
    return (
      <div
        className="cq-modal-overlay"
        role="dialog"
        aria-modal="true"
        aria-label="Row details"
        onMouseDown={(e) => {
          // close on backdrop click (but not when clicking inside modal)
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="cq-modal" role="document" ref={modalRef}>
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
            <table className="cq-modal-table" role="table">
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
        <div className="loading-overlay" role="status" aria-live="polite">
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
              <th scope="col">View</th>
              <th scope="col">Section</th>
              <th scope="col" className="num">Total Received</th>
              <th scope="col" className="num">Replied</th>
              <th scope="col" className="num">Pending</th>
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
                      aria-controls={`section-${safeId(section)}`}
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
                  <tr id={`section-${safeId(section)}`}>
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
                                          aria-controls={`sub-${safeId(subKey)}`}
                                        >
                                          {expandedSub[subKey] ? "−" : "+"}
                                        </button>
                                      </td>
                                      <td>{sub.name}</td>
                                      <td className="num">{formatNumber(sub.received)}</td>
                                      <td className="num">{formatNumber(sub.replied)}</td>
                                      <td className="num pending">{formatNumber(sub.pending)}</td>
                                    </tr>

                                    {/* --- grouped vertical layout with per-group toggles --- */}
                                    {expandedSub[subKey] && (
                                      <tr id={`sub-${subKey}`}>
                                        <td colSpan="5">
                                          <div className="sub-sub-grid-wrap">
                                            {(() => {
                                              const groups = { Creator: [], Verifier: [], Approver: [], Replied: [] };
                                              (sub.rows || []).forEach((it) => {
                                                const cat = mapPendingToCategory(it);
                                                groups[cat] = groups[cat] || [];
                                                groups[cat].push(it);
                                              });
                                              const order = ["Creator", "Verifier", "Approver", "Replied"];

                                              return (
                                                <div className="four-column-grid">
                                                  {order.map((cat) => {
                                                    const groupKey = `${subKey}__${cat}`;
                                                    // default open: true if not set (change if you want closed by default)
                                                    const isOpen = expandedGroups[groupKey] === undefined ? true : !!expandedGroups[groupKey];
                                                    return (
                                                      <div
                                                        key={`${subKey}__grp__${cat}`}
                                                        className={`group-col group-${cat.toLowerCase()}`}
                                                      >
                                                        <div className="group-header">
                                                          <div className="group-title-wrap">
                                                            <button
                                                              className={`group-toggle ${!isOpen ? "open" : "closed"}`}
                                                              aria-expanded={!isOpen}
                                                              aria-controls={`grp-body-${groupKey}`}
                                                              onClick={() => toggleGroup(groupKey)}
                                                              title={!isOpen ? `Collapse ${cat}` : `Expand ${cat}`}
                                                            >
                                                              <span className="chev" aria-hidden="true">{!isOpen ? "-" : "+"}</span>
                                                            </button>
                                                            <span className="group-title">{cat}</span>
                                                          </div>
                                                          <span className="group-count">({groups[cat]?.length ?? 0})</span>
                                                        </div>

                                                        <div
                                                          id={`grp-body-${groupKey}`}
                                                          className={`group-body ${!isOpen ? "expanded" : "collapsed"}`}
                                                          role="region"
                                                          aria-hidden={!isOpen}
                                                        >
                                                          {groups[cat] && groups[cat].length ? (
                                                            <table className="group-table">
                                                              <thead>
                                                                <tr>
                                                                  <th>doc_id</th>
                                                                  <th>pers</th>
                                                                  <th>cell</th>
                                                                  <th>submit</th>
                                                                  <th>action</th>
                                                                  <th>Action</th>
                                                                </tr>
                                                              </thead>
                                                              <tbody>
                                                                {groups[cat].map((it) => {
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
                                                                })}
                                                              </tbody>
                                                            </table>
                                                          ) : (
                                                            <div className="no-data small">No rows</div>
                                                          )}
                                                        </div>
                                                      </div>
                                                    );
                                                  })}
                                                </div>
                                              );
                                            })()}
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
