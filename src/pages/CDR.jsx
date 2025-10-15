// CDR.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import "./CDR.css";
import { application } from "../utils/endpoints";
import { getCookieData } from "../utils/helpers";

/**
 * Notes:
 * - Default filter = last 30 days (local time) formatted for <input type="datetime-local" />
 * - Agent totals polled every AGENT_POLL_MS
 * - Active tab data polled every TAB_POLL_MS (only while that tab is active)
 * - Race conditions prevented via reqCounterRef
 * - Defensive error handling + cleanup
 */

const TABS = [
  { key: "received", label: "Received", badgeKey: "totalAnswered", color: "#16a34a" },
  { key: "dialed", label: "Dialed", badgeKey: "totalDialed", color: "#2563eb" },
  { key: "missed", label: "Missed", badgeKey: "totalNoAnswered", color: "#dc2626" },
  { key: "all", label: "All", badgeKey: "totalOffered", color: "#f97316" },
];

const PAGE_SIZE = 10;
const AGENT_POLL_MS = 5000; // 10s for totals
const TAB_POLL_MS = 5000; // 5s for active tab refresh (tunable)

/* ---------- utility date helpers ---------- */
const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
const toDatetimeLocalValue = (d) => {
  // returns "YYYY-MM-DDTHH:mm" suitable for datetime-local input
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
};

const getDefaultLast30DaysFilter = () => {
  const now = new Date();
  const from = new Date(now);
  from.setDate(now.getDate() - 30);
  // set from to start of day
  from.setHours(0, 0, 0, 0);
  // to remains now (use current time)
  return {
    from: toDatetimeLocalValue(from),
    to: toDatetimeLocalValue(now),
    search: "",
  };
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

/* ---------- normalize response from server ---------- */
const normalizeResponse = (resp) => {
  // handle multiple shapes defensively (your server: resp.data.data.currentPageData etc.)
  try {
    if (!resp) return { items: [], meta: {} };
    const dataRoot = resp?.data?.data ?? resp?.data ?? resp;
    if (!dataRoot) return { items: [], meta: {} };

    // server shape: { currentPage, pageSize, totalRecords, totalPages, currentPageData }
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

    // alternative shape: { items, currentPage, pageSize, totalRecords }
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

    // array fallback
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

/* ---------- main component ---------- */
const CDR = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [page, setPage] = useState(0);
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ currentPage: 0, pageSize: PAGE_SIZE, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [totals, setTotals] = useState({
    totalOffered: 0,
    totalAnswered: 0,
    totalNoAnswered: 0,
    totalDialed: 0,
  });

  // default last 30 days
  const [filters, setFilters] = useState(() => getDefaultLast30DaysFilter());

  // request counter to avoid out-of-order responses
  const reqCounterRef = useRef(0);

  // memoized API map
  const apiMap = useMemo(
    () => ({
      received: "/receivedCall/list",
      dialed: "/dialedCall/list",
      missed: "/missedCall/list",
    }),
    []
  );

  /* ---------- build server payload ---------- */
  const buildPayload = useCallback(
    (pageIndex) => {
      // ensure filter values exist and are valid strings
      const fromVal = filters.from ?? "";
      const toVal = filters.to ?? "";
      return {
        currentPage: pageIndex,
        pageSize: PAGE_SIZE,
        sortDirection: "desc",
        sortBy: "startTime",
        sortDataType: "integer",
        search: filters.search || "",
        advancedFilters: [
          {
            direction: "from",
            dataType: "date",
            fieldName: "startTime",
            value: fromVal,
          },
          {
            direction: "to",
            dataType: "date",
            fieldName: "startTime",
            value: toVal,
          },
        ],
      };
    },
    [filters]
  );

  /* ---------- fetch totals (agent API) ---------- */
  const fetchTotals = useCallback(async () => {
    const thisReq = ++reqCounterRef.current;
    try {
      const cookieData = getCookieData() || {};
      const username = cookieData?.user?.username ?? null;
      if (!username) {
        // no username - clear totals
        setTotals({
          totalOffered: 0,
          totalAnswered: 0,
          totalNoAnswered: 0,
          totalDialed: 0,
        });
        return;
      }

      const resp = await application.post(`agent/${username}`, { offset: 0 });
      if (thisReq !== reqCounterRef.current) return; // stale
      const data = resp?.data?.data ?? resp?.data ?? resp;
      setTotals({
        totalOffered: data?.totalOffered ?? 0,
        totalAnswered: data?.totalAnswered ?? 0,
        totalNoAnswered: data?.totalNoAnswered ?? 0,
        totalDialed: data?.totalDialed ?? 0,
      });
    } catch (err) {
      // Keep totals as-is on error but log
      console.error("fetchTotals error:", err);
    }
  }, []);

  /* ---------- fetch data for a tab (supports 'all') ---------- */
  const fetchDataForTab = useCallback(
    async (tabKey, pageIndex) => {
      const thisReq = ++reqCounterRef.current;
      setLoading(true);
      setError(null);

      try {
        const payload = buildPayload(pageIndex);

        if (tabKey === "all") {
          // fetch all three in parallel (settled)
          const [rRec, rDial, rMiss] = await Promise.allSettled([
            application.post(apiMap.received, payload),
            application.post(apiMap.dialed, payload),
            application.post(apiMap.missed, payload),
          ]);

          if (thisReq !== reqCounterRef.current) return;

          // collect all items from fulfilled responses
          const merged = [];
          const metas = [];
          for (const r of [rRec, rDial, rMiss]) {
            if (r.status === "fulfilled") {
              const normalized = normalizeResponse(r.value);
              merged.push(...(normalized.items || []));
              metas.push(normalized.meta);
            } else {
              // non-fatal: log rejected reason
              if (r.status === "rejected") console.warn("One of 'all' requests failed:", r.reason);
            }
          }

          // dedupe by uuid (fallback id using fields)
          const seen = new Map();
          for (const it of merged) {
            const id =
              it.uuid ??
              `${it.agentName ?? ""}-${it.startTime ?? ""}-${it.customerNumber ?? ""}`;
            if (!seen.has(id)) seen.set(id, it);
          }

          const combined = Array.from(seen.values());

          // sort by startTime desc (safe parse)
          combined.sort((a, b) => {
            const da = safeParseDate(a.startTime);
            const db = safeParseDate(b.startTime);
            if (!da && !db) return 0;
            if (!da) return 1;
            if (!db) return -1;
            return db - da;
          });

          // totalRecords: sum of available meta totals when present, otherwise combined length
          const totalFromMetas = metas.reduce((acc, m) => {
            return acc + (Number.isFinite(m?.totalRecords) ? m.totalRecords : 0);
          }, 0);
          const totalRecords = totalFromMetas > 0 ? totalFromMetas : combined.length;

          // page slice
          const start = pageIndex * PAGE_SIZE;
          const pageItems = combined.slice(start, start + PAGE_SIZE);

          if (thisReq !== reqCounterRef.current) return;
          setItems(pageItems);
          setMeta({
            currentPage: pageIndex,
            pageSize: PAGE_SIZE,
            totalRecords,
            totalPages: Math.max(1, Math.ceil(totalRecords / PAGE_SIZE)),
          });
        } else {
          // single-tab flow
          const endpoint = apiMap[tabKey];
          if (!endpoint) {
            setItems([]);
            setMeta({ currentPage: 0, pageSize: PAGE_SIZE, totalPages: 1, totalRecords: 0 });
            return;
          }

          const resp = await application.post(endpoint, payload);
          if (thisReq !== reqCounterRef.current) return;

          const normalized = normalizeResponse(resp);
          const safeItems = (normalized.items || []).map((it) => it);

          setItems(safeItems);
          setMeta({
            currentPage: Number.isFinite(normalized.meta.currentPage)
              ? normalized.meta.currentPage
              : pageIndex,
            pageSize: Number.isFinite(normalized.meta.pageSize) ? normalized.meta.pageSize : PAGE_SIZE,
            totalRecords:
              Number.isFinite(normalized.meta.totalRecords) ? normalized.meta.totalRecords : safeItems.length,
            totalPages: Number.isFinite(normalized.meta.totalPages)
              ? normalized.meta.totalPages
              : Math.max(1, Math.ceil((normalized.meta.totalRecords ?? safeItems.length) / PAGE_SIZE)),
          });
        }
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
    [apiMap, buildPayload]
  );

  /* ---------- Effect: poll agent totals (live numbers) ---------- */
  useEffect(() => {
    let mounted = true;
    let timer = null;

    const start = async () => {
      await fetchTotals();
      if (!mounted) return;
      timer = setInterval(() => {
        fetchTotals();
      }, AGENT_POLL_MS);
    };

    start().catch((err) => console.error("agent polling startup error:", err));

    return () => {
      mounted = false;
      if (timer) clearInterval(timer);
    };
  }, [fetchTotals]);

  /* ---------- Effect: fetch data when activeTab/page/filters change ---------- */
  useEffect(() => {
    // immediate fetch when dependencies change
    fetchDataForTab(activeTab, page);
    // We intentionally do not include fetchDataForTab in deps beyond its stable deps
    // because fetchDataForTab is memoized with buildPayload & apiMap
  }, [activeTab, page, filters, fetchDataForTab]);

  /* ---------- Effect: poll only the active tab to get near-realtime updates ---------- */
  useEffect(() => {
    let mounted = true;
    let intervalId = null;

    // do not poll if loading heavy or on 'all' you may want less frequency (we still poll)
    const startPolling = () => {
      // clear previous
      if (intervalId) clearInterval(intervalId);

      intervalId = setInterval(() => {
        // call fetch but keep page same
        // only poll when component still mounted
        if (!mounted) return;
        // refresh totals as well occasionally by calling fetchTotals (keeps badges fresh)
        fetchDataForTab(activeTab, page);
      }, TAB_POLL_MS);
    };

    // start one immediate fetch + start interval
    // only poll for recognized tabs (including 'all')
    startPolling();

    return () => {
      mounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [activeTab, page, fetchDataForTab]);

  /* ---------- handlers ---------- */
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    // ensure valid date range (from <= to)
    const fromDate = safeParseDate(filters.from);
    const toDate = safeParseDate(filters.to);
    if (fromDate && toDate && fromDate > toDate) {
      setError("Invalid date range: 'From' is after 'To'.");
      return;
    }
    setError(null);
    setPage(0);
    // fetchDataForTab will run due to filters change (effect), but call explicitly to be immediate
    fetchDataForTab(activeTab, 0);
  };

  const onTabClick = (key) => {
    if (key === activeTab) return;
    setActiveTab(key);
    setPage(0);
    setError(null);
  };

  const hasNext =
    Number.isFinite(meta.totalRecords) ? (page + 1) * PAGE_SIZE < meta.totalRecords : items.length === PAGE_SIZE;

  return (
    <div className="cdr-container">
      <h1 className="cdr-title">Call Detail Records</h1>

      {/* FILTER SECTION */}
      <div className="cdr-filters" aria-label="Filters">
        <label>
          From:
          <input
            type="datetime-local"
            name="from"
            value={filters.from}
            onChange={handleFilterChange}
            aria-label="From date"
          />
        </label>
        <label>
          To:
          <input
            type="datetime-local"
            name="to"
            value={filters.to}
            onChange={handleFilterChange}
            aria-label="To date"
          />
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
        <button onClick={applyFilters} disabled={loading}>
          Apply
        </button>
        <button
          onClick={() => {
            const def = getDefaultLast30DaysFilter();
            setFilters(def);
            setPage(0);
            fetchDataForTab(activeTab, 0);
          }}
          disabled={loading}
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
              {totals[t.badgeKey] ?? 0}
            </span>
          </button>
        ))}
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
                const key =
                  item.uuid ??
                  `${item.agentName ?? "na"}-${item.startTime ?? "na"}-${item.customerNumber ?? "na"}-${i}`;
                return (
                  <tr key={key}>
                    <td>{page * PAGE_SIZE + i + 1}</td>
                    <td>{item.agentName ?? "-"}</td>
                    <td>{item.customerNumber ?? "-"}</td>
                    <td>{formatDate(item.startTime)}</td>
                    <td>{item.queue ?? "-"}</td>
                    <td>{item.queueName ?? "-"}</td>
                    <td>{item.talkDuration ?? "-"}</td>
                    <td className={`cdr-direction ${item.direction ? item.direction.toLowerCase() : ""}`}>
                      {item.direction ?? "-"}
                    </td>
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
        <button
          type="button"
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0 || loading}
          aria-label="Previous page"
        >
          Prev
        </button>
        <span>
          Page {Number.isFinite(meta.currentPage) ? meta.currentPage + 1 : page + 1} of{" "}
          {meta.totalPages ?? 1}
        </span>
        <button
          type="button"
          onClick={() => setPage((p) => p + 1)}
          disabled={!hasNext || loading}
          aria-label="Next page"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default CDR;
