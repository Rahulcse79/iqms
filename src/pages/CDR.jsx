// src/components/CDR.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import "./CDR.css";
import { application } from "../utils/endpoints";
import { getCookieData } from "../utils/helpers";
import ExtensionDialog from "../components/ExtensionDialog";

const TABS = [
  { key: "received", label: "Received", badgeKey: "totalAnswered", color: "#16a34a" },
  { key: "dialed", label: "Dialed", badgeKey: "totalDialed", color: "#2563eb" },
  { key: "missed", label: "Missed", badgeKey: "totalNoAnswered", color: "#dc2626" },
  { key: "all", label: "All", badgeKey: "totalOffered", color: "#f97316" },
];

const PAGE_SIZE = 10; 
const TAB_POLL_MS = 60000;
const cookieData = getCookieData();
const initialExtension = cookieData?.user?.userExtension || "";


const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
const toDatetimeLocalValue = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

const getDefaultLast30DaysFilter = () => {
  const now = new Date();
  const from = new Date(now);
  from.setDate(now.getDate() - 30);
  from.setHours(0, 0, 0, 0);
  return { from: toDatetimeLocalValue(from), to: toDatetimeLocalValue(now), search: "" };
};

const safeParseDate = (s) => {
  if (!s) return null;
  const iso = typeof s === "string" && s.includes(" ") && !s.includes("T") ? s.replace(" ", "T") : s;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
};

const formatDate = (s) => {
  const d = safeParseDate(s);
  return d ? d.toLocaleString() : "-";
};

const normalizeResponse = (resp) => {
  try {
    if (!resp) return { items: [], meta: {} };
    const dataRoot = resp?.data?.data ?? resp?.data ?? resp;
    if (!dataRoot) return { items: [], meta: {} };

    if (dataRoot.currentPageData) {
      return {
        items: Array.isArray(dataRoot.currentPageData) ? dataRoot.currentPageData : [],
        meta: {
          currentPage: Number.isFinite(dataRoot.currentPage) ? dataRoot.currentPage : 0,
          pageSize: Number.isFinite(dataRoot.pageSize) ? dataRoot.pageSize : PAGE_SIZE,
          totalRecords: Number.isFinite(dataRoot.totalRecords) ? dataRoot.totalRecords : null,
          totalPages: Number.isFinite(dataRoot.totalPages) ? dataRoot.totalPages : 1,
        },
      };
    }

    if (dataRoot.items) {
      return {
        items: Array.isArray(dataRoot.items) ? dataRoot.items : [],
        meta: {
          currentPage: Number.isFinite(dataRoot.currentPage) ? dataRoot.currentPage : 0,
          pageSize: Number.isFinite(dataRoot.pageSize) ? dataRoot.pageSize : PAGE_SIZE,
          totalRecords: Number.isFinite(dataRoot.totalRecords) ? dataRoot.totalRecords : null,
          totalPages: Number.isFinite(dataRoot.totalPages) ? dataRoot.totalPages : 1,
        },
      };
    }

    if (Array.isArray(dataRoot)) {
      return {
        items: dataRoot,
        meta: { currentPage: 0, pageSize: PAGE_SIZE, totalRecords: dataRoot.length, totalPages: 1 },
      };
    }

    return { items: [], meta: {} };
  } catch (err) {
    console.error("normalizeResponse error:", err);
    return { items: [], meta: {} };
  }
};

const normalizeItem = (raw = {}) => {
  const directionRaw = raw.callDirection ?? raw.direction ?? raw.call_direction ?? "";
  const dirToken = String(directionRaw).toLowerCase().startsWith("in")
    ? "in"
    : String(directionRaw).toLowerCase().startsWith("out")
    ? "out"
    : (directionRaw || "").toString().toLowerCase();

  const recording = raw.recordingFile && raw.recordingFile.trim() !== "" ? raw.recordingFile : null;

  return {
    uuid: raw.uuid ?? raw.id ?? null,
    agentName: raw.agentFullName ?? raw.agentName ?? raw.ccAgent ?? raw.agent ?? "-",
    customerNumber: raw.customerNumber ?? raw.customer ?? raw.callerId ?? "-",
    startTime: raw.startTime ?? raw.start_time ?? null,
    queue: raw.queue ?? "-",
    queueName: raw.queueName ?? raw.queue_name ?? "-",
    talkDuration: raw.duration ?? raw.agentTalkTime ?? raw.talkDuration ?? "-",
    direction: directionRaw ?? "-",
    directionToken: dirToken,
    agentTalkedTo: raw.agentTalkedTo ?? raw.answeredByName ?? raw.answeredBy ?? "-",
    recordingFile: recording,
    __raw: raw,
  };
};

/* ---------- helper heuristics ---------- */
const isDialedRaw = (r) => {
  const dir = String(r.callDirection ?? r.direction ?? "").toLowerCase();
  if (dir.startsWith("out")) return true;
  if (String(r.queue ?? "").toLowerCase().includes("dial")) return true;
  return false;
};
const isAnsweredRaw = (r) => {
  const status = String(r.status ?? "").toLowerCase();
  if (status.includes("answered")) return true;
  if (r.answerTime && r.answerTime !== "") return true;
  if (r.answeredBy || r.answeredByName) return true;
  return false;
};
const isMissedRaw = (r) => {
  const isMissed = String(r.isMissed ?? "").toLowerCase();
  const status = String(r.status ?? "").toLowerCase();
  const answerTimeEmpty = !r.answerTime || r.answerTime === "";
  if (isMissed && (isMissed.includes("not") || isMissed.includes("miss"))) return true;
  if (status && (status.includes("not") || status.includes("not contacted") || status.includes("abandoned") || status.includes("abd"))) return true;
  if (answerTimeEmpty && !isDialedRaw(r)) return true;
  return false;
};

/* ---------- main component ---------- */
const CDR = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [page, setPage] = useState(0);
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ currentPage: 0, pageSize: PAGE_SIZE, totalPages: 1, totalRecords: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [totals, setTotals] = useState({
    totalOffered: 0,
    totalAnswered: 0,
    totalNoAnswered: 0,
    totalDialed: 0,
    approximate: false,
  });

  const [filters, setFilters] = useState(() => getDefaultLast30DaysFilter());
  const reqCounterRef = useRef(0);
  // extension handling
  const [userExtensionState, setUserExtensionState] = useState(initialExtension);
  const [showExtensionDialog, setShowExtensionDialog] = useState(!initialExtension);

  const apiUrl = useMemo(() => "agentCDR/list", []);

  const buildPayload = useCallback(
    (pageIndex, pageSize = PAGE_SIZE, tabKey = "all") => {
      const fromVal = filters.from ?? "";
      const toVal = filters.to ?? "";
      // base advanced filters for date range
      const adv = [
        { direction: "from", dataType: "date", fieldName: "startTime", value: fromVal },
        { direction: "to", dataType: "date", fieldName: "startTime", value: toVal },
      ];

      // Tab-specific server-side filter (preferred if backend supports it).
      // We use direction filter as equality — change 'direction: "eq"' to whatever your backend expects.
      if (tabKey === "received") {
        adv.push({ direction: "eq", dataType: "string", fieldName: "callDirection", value: "IN" });
      } else if (tabKey === "dialed") {
        adv.push({ direction: "eq", dataType: "string", fieldName: "callDirection", value: "OUT" });
      } else if (tabKey === "missed") {
        // if backend supports isMissed flag
        adv.push({ direction: "eq", dataType: "string", fieldName: "isMissed", value: "Not Answered" });
      }

      return {
        currentPage: pageIndex,
        pageSize,
        sortDirection: "asc",
        sortBy: "agentName",
        search: userExtensionState || "",
        sortDataType: "string",
        advancedFilters: adv,
      };
    },
    [filters, userExtensionState]
  );

  const fetchDataForTab = useCallback(
    async (tabKey, pageIndex = 0) => {
      const thisReq = ++reqCounterRef.current;
      setLoading(true);
      setError(null);

      try {
        const payload = buildPayload(pageIndex, PAGE_SIZE, tabKey);
        // single call per fetch
        const resp = await application.post(apiUrl, payload);
        if (thisReq !== reqCounterRef.current) return; // stale

        const normalized = normalizeResponse(resp);
        const rawItems = normalized.items || [];
        const serverMeta = normalized.meta || {};

        // Use server-side pagination meta when present
        const totalRecords = Number.isFinite(serverMeta.totalRecords) ? serverMeta.totalRecords : rawItems.length;
        const pageSize = Number.isFinite(serverMeta.pageSize) ? serverMeta.pageSize : PAGE_SIZE;
        const totalPages = Number.isFinite(serverMeta.totalPages)
          ? serverMeta.totalPages
          : Math.max(1, Math.ceil(totalRecords / pageSize));

        // compute totals lightly:
        // - totalOffered = server-provided totalRecords (if available)
        // - totalAnswered/dialed/missed computed from current page (approximation if dataset is large)
        let dial = 0,
          answered = 0,
          missed = 0;
        for (const r of rawItems) {
          if (isDialedRaw(r)) dial++;
          if (isAnsweredRaw(r)) answered++;
          if (isMissedRaw(r)) missed++;
        }
        const approx = totalRecords > rawItems.length;
        setTotals({
          totalOffered: totalRecords,
          totalAnswered: answered,
          totalNoAnswered: missed,
          totalDialed: dial,
          approximate: approx,
        });

        // normalize each item for UI
        const pageItems = (rawItems || []).map(normalizeItem);

        setItems(pageItems);
        setMeta({
          currentPage: pageIndex,
          pageSize,
          totalRecords,
          totalPages,
        });
      } catch (err) {
        console.error("fetchDataForTab error:", err);
        if (thisReq === reqCounterRef.current) {
          setError("Failed to load records. Please try again.");
          setItems([]);
          setMeta({ currentPage: 0, pageSize: PAGE_SIZE, totalPages: 1, totalRecords: 0 });
        }
      } finally {
        if (thisReq === reqCounterRef.current) setLoading(false);
      }
    },
    [apiUrl, buildPayload]
  );

  // initial fetch (only after extension is known)
  useEffect(() => {
    if (!userExtensionState) return;
    fetchDataForTab(activeTab, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userExtensionState]); // intentionally only when extension becomes available

  // fetch on tab/page/filter changes (extension must exist)
  useEffect(() => {
    if (!userExtensionState) return;
    fetchDataForTab(activeTab, page);
  }, [activeTab, page, filters, fetchDataForTab, userExtensionState]);

  // poll active tab only (requires extension)
  useEffect(() => {
    if (!userExtensionState) return;
    let mounted = true;
    let intervalId = null;

    const startPolling = () => {
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(() => {
        if (!mounted) return;
        fetchDataForTab(activeTab, page);
      }, TAB_POLL_MS);
    };

    startPolling();
    return () => {
      mounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [activeTab, page, fetchDataForTab, userExtensionState]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    const fromDate = safeParseDate(filters.from);
    const toDate = safeParseDate(filters.to);
    if (fromDate && toDate && fromDate > toDate) {
      setError("Invalid date range: 'From' is after 'To'.");
      return;
    }
    setError(null);
    setPage(0);
    fetchDataForTab(activeTab, 0);
  };

  const onTabClick = (key) => {
    if (key === activeTab) return;
    setActiveTab(key);
    setPage(0);
    setError(null);
  };

  const hasNext = Number.isFinite(meta.totalPages) ? page + 1 < meta.totalPages : items.length === PAGE_SIZE;

  // extension dialog submit handler
  const handleExtensionSubmit = (ext) => {
    // save to localStorage or cookies if desired
    try {
      localStorage.setItem("userExtension", ext);
    } catch (e) {
      // ignore localStorage errors
    }
    setUserExtensionState(ext);
    setShowExtensionDialog(false);
    // fetch will be triggered by effect that watches userExtensionState
  };

  return (
    <div className="cdr-container">
      <h1 className="cdr-title">Call Detail Records</h1>

      {showExtensionDialog && <ExtensionDialog onSubmit={handleExtensionSubmit} onClose={() => setShowExtensionDialog(false)} />}

      {/* FILTER SECTION */}
      <div className="cdr-filters" aria-label="Filters">
        <label>
          From:
          <input type="datetime-local" name="from" value={filters.from} onChange={handleFilterChange} aria-label="From date" />
        </label>
        <label>
          To:
          <input type="datetime-local" name="to" value={filters.to} onChange={handleFilterChange} aria-label="To date" />
        </label>
        <label>
          Search:
          <input
            type="text"
            name="search"
            placeholder="Agent / Number"
            value={filters.search}
            onChange={handleFilterChange}
            aria-label="Search"
          />
        </label>
        <button onClick={applyFilters} disabled={loading || !userExtensionState}>
          Apply
        </button>
        <button
          onClick={() => {
            const def = getDefaultLast30DaysFilter();
            setFilters(def);
            setPage(0);
            if (userExtensionState) fetchDataForTab(activeTab, 0);
          }}
          disabled={loading || !userExtensionState}
          title="Reset to last 30 days"
        >
          Reset (30d)
        </button>
      </div>

      {/* TABS */}
      <div className="cdr-tabs" role="tablist" aria-label="Call types">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={activeTab === t.key}
            className={`cdr-tab ${activeTab === t.key ? "active" : ""}`}
            onClick={() => onTabClick(t.key)}
            style={{ borderBottom: activeTab === t.key ? `2px solid ${t.color}` : "none" }}
          >
            <span>{t.label}</span>
            <span className="cdr-badge" style={{ backgroundColor: t.color }}>
              {t.key === "all"
                ? totals.totalOffered
                : t.key === "received"
                ? totals.totalAnswered
                : t.key === "dialed"
                ? totals.totalDialed
                : totals.totalNoAnswered}
            </span>
          </button>
        ))}
        {totals.approximate && <div className="cdr-totals-note">Totals approximate (large dataset)</div>}
      </div>

      {/* TABLE */}
      <div className="cdr-table-wrapper" role="region" aria-live="polite">
        <table className="cdr-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Agent Name</th>
              <th>Number</th>
              <th>Start Time</th>
              <th>Queue</th>
              <th>Queue Name</th>
              <th>Duration</th>
              <th>Direction</th>
              <th>Agent Talked To</th>
              <th>Recording</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="10" className="cdr-loading">
                  Loading...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="10" className="cdr-error">
                  {error}
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan="10" className="cdr-no-data">
                  No records found
                </td>
              </tr>
            ) : (
              items.map((item, i) => {
                const key = item.uuid ?? `${item.agentName}-${item.startTime}-${item.customerNumber}-${i}`;
                return (
                  <tr key={key}>
                    <td>{page * PAGE_SIZE + i + 1}</td>
                    <td>{item.agentName ?? "-"}</td>
                    <td>{item.customerNumber ?? "-"}</td>
                    <td>{formatDate(item.startTime)}</td>
                    <td>{item.queue ?? "-"}</td>
                    <td>{item.queueName ?? "-"}</td>
                    <td>{item.talkDuration ?? "-"}</td>
                    <td className={`cdr-direction ${item.directionToken ?? ""}`}>{item.direction ?? "-"}</td>
                    <td>{item.agentTalkedTo ?? "-"}</td>
                    <td>
                      {item.recordingFile ? (
                        <div className="cdr-recording-wrap">
                          <audio controls preload="none" src={item.recordingFile}>
                            Your browser does not support the audio element.
                          </audio>
                        </div>
                      ) : (
                        <span className="cdr-no-record">-</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="cdr-pagination" aria-label="Pagination controls">
        <button type="button" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0 || loading} aria-label="Previous page">
          Prev
        </button>
        <span>
          Page {Number.isFinite(meta.currentPage) ? meta.currentPage + 1 : page + 1} of {meta.totalPages ?? 1}
        </span>
        <button type="button" onClick={() => setPage((p) => p + 1)} disabled={!hasNext || loading} aria-label="Next page">
          Next
        </button>
      </div>
    </div>
  );
};

export default CDR;
