// CDR.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import "./CDR.css";
import {
  receivedCallListAPI,
  missedCallListAPI,
  dialedCallListAPI,
  application,
} from "../utils/endpoints";

const TABS = [
  {
    key: "received",
    label: "Received",
    badgeKey: "totalAnswered",
    badgeClass: "received",
    color: "#16a34a",
  },
  {
    key: "dialed",
    label: "Dialed",
    badgeKey: "totalDialed",
    badgeClass: "dialed",
    color: "#2563eb",
  },
  {
    key: "missed",
    label: "Missed",
    badgeKey: "totalNoAnswered",
    badgeClass: "missed",
    color: "#dc2626",
  },
  {
    key: "all",
    label: "All call",
    badgeKey: "totalOffered",
    badgeClass: "answered",
    color: "#f97316",
  },
];

const PAGE_SIZE = 10;

const safeParseDate = (s) => {
  if (!s) return null;
  const iso =
    typeof s === "string" && s.includes(" ") && !s.includes("T")
      ? s.replace(" ", "T")
      : s;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
};

const formatDate = (s) => {
  const d = safeParseDate(s);
  return d ? d.toLocaleString() : "-";
};

const normalizeResponse = (resp) => {
  if (!resp) return { items: [], meta: {} };
  const data = resp.data ?? resp;
  if (data.data && data.data.currentPageData) {
    return {
      items: data.data.currentPageData || [],
      meta: {
        currentPage: data.data.currentPage ?? 0,
        totalRecords: data.data.totalRecords ?? null,
        pageSize: data.data.pageSize ?? PAGE_SIZE,
      },
    };
  }
  if (data.items) {
    return {
      items: data.items || [],
      meta: {
        currentPage: data.currentPage ?? 0,
        totalRecords: data.totalRecords ?? null,
        pageSize: data.pageSize ?? PAGE_SIZE,
      },
    };
  }
  if (Array.isArray(data)) {
    return {
      items: data,
      meta: { currentPage: 0, totalRecords: data.length, pageSize: PAGE_SIZE },
    };
  }
  return { items: [], meta: {} };
};

const dedupeByUuid = (arr) => {
  const map = new Map();
  arr.forEach((item) => {
    const id =
      item.uuid ?? `${item.agentName}-${item.startTime}-${item.customerNumber}`;
    if (!map.has(id)) map.set(id, item);
  });
  return Array.from(map.values());
};

const CDR = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [page, setPage] = useState(0);
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(false);
  const [totals, setTotals] = useState({
    totalOffered: 0,
    totalAnswered: 0,
    totalNoAnswered: 0,
    totalDialed: 0,
  });
  const [error, setError] = useState(null);

  // request counter protects from race conditions when responses arrive out-of-order
  const reqCounterRef = useRef(0);

  const fetchTotals = useCallback(async () => {
    try {
      const payload = {
        currentPage: 0,
        pageSize: 10,
        sortDirection: "desc",
        sortBy: "callerId",
        search: "",
        sortDataType: "integer",
        advancedFilters: [],
      };

      const resp = await application.post("/callbackReport/list", {
        payload,
      });
      const data = resp?.data?.data ?? resp?.data ?? resp;
      if (data) {
        setTotals({
          totalOffered: data.totalOffered ?? 0,
          totalAnswered: data.totalAnswered ?? 0,
          totalNoAnswered: data.totalNoAnswered ?? 0,
          totalDialed: data.totalDialed ?? 0,
        });
      }
    } catch (err) {
      console.error("fetchTotals error:", err);
    }
  });

  const fetchDataForTab = useCallback(
    async (tabKey, pageIndex) => {
      const thisReq = ++reqCounterRef.current;
      setLoading(true);
      setError(null);

      try {
        // offset-based paging
        const offset = pageIndex * PAGE_SIZE;
        const payload = {
          offset,
          currentPage: pageIndex,
          pageSize: PAGE_SIZE,
          sortDirection: "desc",
          sortBy: "startTime",
          search: "",
        };

        if (tabKey === "all") {
          const [rRec, rMiss, rDial] = await Promise.allSettled([
            receivedCallListAPI(payload),
            missedCallListAPI(payload),
            dialedCallListAPI(payload),
          ]);

          if (thisReq !== reqCounterRef.current) return;

          const nr =
            rRec.status === "fulfilled"
              ? normalizeResponse(rRec.value)
              : { items: [], meta: {} };
          const nm =
            rMiss.status === "fulfilled"
              ? normalizeResponse(rMiss.value)
              : { items: [], meta: {} };
          const nd =
            rDial.status === "fulfilled"
              ? normalizeResponse(rDial.value)
              : { items: [], meta: {} };

          // map to unified shape and keep original raw for future use
          const unified = [...nr.items, ...nm.items, ...nd.items].map((it) => ({
            uuid: it.uuid,
            agentName: it.agentName,
            customerNumber: it.customerNumber,
            startTime: it.startTime,
            queue: it.queue,
            queueName: it.queueName,
            talkDuration: it.talkDuration,
            recordingFile: it.recordingFile,
            direction: it.direction,
            agentTalkedTo: it.agentTalkedTo,
            raw: it,
          }));

          // dedupe and sort by startTime desc
          const combinedUnique = dedupeByUuid(unified);
          combinedUnique.sort((a, b) => {
            const da = safeParseDate(a.startTime);
            const db = safeParseDate(b.startTime);
            if (!da && !db) return 0;
            if (!da) return 1;
            if (!db) return -1;
            return db - da;
          });

          // compute totalRecords as sum of available meta totals when present (fallback to combined length)
          const totalRecords =
            (nr.meta.totalRecords ?? 0) +
              (nm.meta.totalRecords ?? 0) +
              (nd.meta.totalRecords ?? 0) || combinedUnique.length;

          // slice the combined sorted array to the requested page
          const start = pageIndex * PAGE_SIZE;
          const pageItems = combinedUnique.slice(start, start + PAGE_SIZE);

          if (thisReq !== reqCounterRef.current) return;
          setItems(pageItems);
          setMeta({
            currentPage: pageIndex,
            totalRecords,
            pageSize: PAGE_SIZE,
          });
        } else {
          // per-type paging: request just PAGE_SIZE from the correct endpoint using offset
          let resp = null;
          const p = { ...payload }; // offset, pageSize etc.

          if (tabKey === "received") {
            resp = await receivedCallListAPI(p);
          } else if (tabKey === "missed") {
            resp = await missedCallListAPI(p);
          } else if (tabKey === "dialed") {
            resp = await dialedCallListAPI(p);
          } else {
            resp = { items: [] };
          }

          if (thisReq !== reqCounterRef.current) return;

          const { items: newItems, meta: newMeta } = normalizeResponse(resp);
          const safeItems = (newItems || []).map((it) => ({
            uuid: it.uuid,
            agentName: it.agentName,
            customerNumber: it.customerNumber,
            startTime: it.startTime,
            queue: it.queue,
            queueName: it.queueName,
            talkDuration: it.talkDuration,
            recordingFile: it.recordingFile,
            direction: it.direction,
            agentTalkedTo: it.agentTalkedTo,
            raw: it,
          }));

          if (thisReq !== reqCounterRef.current) return;
          setItems(safeItems);
          setMeta({
            currentPage: newMeta.currentPage ?? pageIndex,
            totalRecords: Number.isInteger(newMeta.totalRecords)
              ? newMeta.totalRecords
              : safeItems.length,
            pageSize: newMeta.pageSize ?? PAGE_SIZE,
          });
        }
      } catch (err) {
        if (thisReq !== reqCounterRef.current) return;
        console.error("fetchDataForTab error:", err);
        setError("Failed to load records.");
        setItems([]);
        setMeta({});
      } finally {
        if (thisReq === reqCounterRef.current) setLoading(false);
      }
    },
    [] // stable: uses only constants and imported functions
  );

  useEffect(() => {
    fetchTotals();
  }, [fetchTotals]);

  useEffect(() => {
    fetchDataForTab(activeTab, page);
  }, [activeTab, page, fetchDataForTab]);

  // compute hasNext using meta.totalRecords when available
  const hasNext =
    typeof meta.totalRecords === "number"
      ? (page + 1) * PAGE_SIZE < meta.totalRecords
      : items.length === PAGE_SIZE;

  const onTabClick = (key) => {
    setActiveTab(key);
    setPage(0);
  };

  return (
    <div className="cdr-container">
      <h1 className="cdr-title">Call Detail Records</h1>

      <div className="cdr-tabs" role="tablist" aria-label="Call types">
        {TABS.map((t) => {
          const badgeValue = totals[t.badgeKey] ?? 0;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={activeTab === t.key}
              className={`cdr-tab ${activeTab === t.key ? "active" : ""}`}
              onClick={() => onTabClick(t.key)}
            >
              <span>{t.label}</span>
              <span
                className={`cdr-badge ${t.badgeClass}`}
                style={{ backgroundColor: t.color }}
              >
                {badgeValue}
              </span>
            </button>
          );
        })}
      </div>

      <div className="cdr-table-wrapper">
        <table className="cdr-table">
          <thead>
            <tr>
              <th>S.no.</th>
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
              items.map((item, index) => {
                const key =
                  item.uuid ||
                  `${item.agentName}-${item.startTime}-${item.customerNumber}-${index}`;
                return (
                  <tr key={key}>
                    <td>{page * PAGE_SIZE + index + 1}</td>
                    <td>{item.agentName ?? "-"}</td>
                    <td>{item.customerNumber ?? "-"}</td>
                    <td>{formatDate(item.startTime)}</td>
                    <td>{item.queue ?? "-"}</td>
                    <td>{item.queueName ?? "-"}</td>
                    <td>{item.talkDuration ?? "-"}</td>
                    <td
                      className={`cdr-direction ${
                        item.direction ? item.direction.toLowerCase() : ""
                      }`}
                    >
                      {item.direction ?? "-"}
                    </td>
                    <td>{item.agentTalkedTo ?? "-"}</td>
                    <td>
                      {item.recordingFile ? (
                        <div className="cdr-recording-wrap">
                          <audio
                            controls
                            preload="none"
                            src={item.recordingFile}
                          >
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

      <div className="cdr-pagination" aria-label="Pagination controls">
        <button
          type="button"
          onClick={() => setPage(Math.max(0, page - 1))}
          disabled={page === 0 || loading}
          aria-label="Previous page"
        >
          Prev
        </button>
        <span>
          Page {page + 1}
          {meta.totalRecords
            ? ` of ${Math.max(1, Math.ceil(meta.totalRecords / PAGE_SIZE))}`
            : ""}
        </span>
        <button
          type="button"
          onClick={() => setPage(page + 1)}
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
