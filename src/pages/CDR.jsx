// src/components/CDR.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Cookies from "js-cookie";
import "./CDR.css";
import { opaqueServices } from "../utils/endpoints";
import { getCookieData } from "../utils/helpers";
import ExtensionDialog from "../components/ExtensionDialog";
import variables from "../utils/variables";
import { Dialog, DialogContent, DialogTitle, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const TABS = [
  { key: "received", label: "Received", color: "#16a34a" },
  { key: "dialed", label: "Dialed", color: "#2563eb" },
  { key: "missed", label: "Missed", color: "#dc2626" },
  { key: "all", label: "All", color: "#f97316" },
];

const PAGE_SIZE = 10;
const TAB_POLL_MS = 60000;

const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
const toDatetimeLocalValue = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;

const getDefaultLast30DaysFilter = () => {
  const now = new Date();
  const from = new Date(now);
  from.setDate(now.getDate() - 30);
  from.setHours(0, 0, 0, 0);
  return {
    from: toDatetimeLocalValue(from),
    to: toDatetimeLocalValue(now),
    search: "",
  };
};

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
  try {
    if (!resp) return { items: [], meta: {} };
    const dataRoot = resp?.data?.data ?? resp?.data ?? resp;
    if (!dataRoot) return { items: [], meta: {} };

    if (dataRoot.currentPageData) {
      return {
        items: Array.isArray(dataRoot.currentPageData)
          ? dataRoot.currentPageData
          : [],
      };
    }
    if (dataRoot.items) {
      return { items: Array.isArray(dataRoot.items) ? dataRoot.items : [] };
    }
    if (Array.isArray(dataRoot)) {
      return { items: dataRoot };
    }

    return { items: [] };
  } catch (err) {
    console.error("normalizeResponse error:", err);
    return { items: [] };
  }
};

const normalizeItem = (raw = {}) => {
  const directionRaw =
    raw.callDirection ?? raw.direction ?? raw.call_direction ?? "";
  const dirToken = String(directionRaw).toLowerCase().startsWith("in")
    ? "in"
    : String(directionRaw).toLowerCase().startsWith("out")
      ? "out"
      : (directionRaw || "").toString().toLowerCase();

  const recording =
    raw.recordingFile && raw.recordingFile.trim() !== ""
      ? raw.recordingFile
      : null;

  return {
    uuid: raw.uuid ?? raw.id ?? null,
    agentName:
      raw.agentFullName ?? raw.agentName ?? raw.ccAgent ?? raw.agent ?? "-",
    customerNumber: raw.customerNumber ?? raw.customer ?? raw.callerId ?? "-",
    startTime: raw.startTime ?? raw.start_time ?? null,
    queue: raw.queue ?? "-",
    queueName: raw.queueName ?? raw.queue_name ?? "-",
    talkDuration: raw.duration ?? raw.agentTalkTime ?? raw.talkDuration ?? "-",
    direction: directionRaw ?? "-",
    directionToken: dirToken,
    agentTalkedTo:
      raw.agentTalkedTo ?? raw.answeredByName ?? raw.answeredBy ?? "-",
    recordingFile: recording,
    isMissed: raw.isMissed ?? "-",
    __raw: raw,
  };
};

const CDR = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [page, setPage] = useState(0);
  const [items, setItems] = useState([]);
  const [allData, setAllData] = useState([]);
  const [meta, setMeta] = useState({ currentPage: 0, pageSize: PAGE_SIZE });
  const [filters, setFilters] = useState(() => getDefaultLast30DaysFilter());
  const [summaryTotals, setSummaryTotals] = useState({
    totalAnswered: 0,
    totalDialed: 0,
    totalNoAnswered: 0,
    totalAll: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({
    key: "startTime",
    direction: "desc",
  });
  const [userExtensionState, setUserExtensionState] = useState("");
  const [showExtensionDialog, setShowExtensionDialog] = useState(false);
  const [playingUuid, setPlayingUuid] = useState(null);

  const reqCounterRef = useRef(0);
  const apiUrl = useMemo(() => "agentCDR/list", []);

  // Load extension
  useEffect(() => {
    const cookieData = getCookieData();
    const ext = cookieData?.user?.userExtension;
    if (ext) setUserExtensionState(ext);
    else setShowExtensionDialog(true);
  }, []);

  // Fetch All Data
  const fetchDataForTab = useCallback(async () => {
    const thisReq = ++reqCounterRef.current;
    setLoading(true);
    setError(null);
    try {
      const payload = {
        currentPage: 0,
        pageSize: 1000000,
        sortDirection: "asc",
        sortBy: "agentName",
        search: userExtensionState || "",
        sortDataType: "string",
        advancedFilters: [],
      };
      const resp = await opaqueServices.post(apiUrl, payload);
      if (thisReq !== reqCounterRef.current) return;
      const normalized = normalizeResponse(resp);
      const normalizedItems = normalized.items.map(normalizeItem);
      setAllData(normalizedItems);
    } catch (err) {
      console.error("fetchDataForTab error:", err);
      if (thisReq === reqCounterRef.current) setError("Failed to load records.");
    } finally {
      setLoading(false);
    }
  }, [apiUrl, userExtensionState]);

  useEffect(() => {
    if (userExtensionState) fetchDataForTab();
  }, [userExtensionState, fetchDataForTab]);

  // 🔄 Auto-refresh
  useEffect(() => {
    if (!userExtensionState) return;
    const interval = setInterval(fetchDataForTab, TAB_POLL_MS);
    return () => clearInterval(interval);
  }, [userExtensionState, fetchDataForTab]);

  // 🧮 Filter, Sort & Update Summary Totals
  useEffect(() => {
    if (!allData.length) return;

    let filtered = [...allData];
    const fromDate = safeParseDate(filters.from);
    const toDate = safeParseDate(filters.to);

    filtered = filtered.filter((r) => {
      const start = safeParseDate(r.startTime);
      if (!start) return false;
      if (fromDate && start < fromDate) return false;
      if (toDate && start > toDate) return false;
      return true;
    });

    if (filters.search.trim() !== "") {
      const q = filters.search.trim().toLowerCase();

      filtered = filtered.filter((r) => {
        const fields = [
          r.agentName,
          r.customerNumber,
          r.direction,
          r.agentTalkedTo,
          r.isMissed, // e.g. "Answered", "Not Answered"
        ];

        // check if search string matches any of these fields
        return fields.some(
          (f) =>
            typeof f === "string" &&
            f.toLowerCase().includes(q)
        );
      });
    }


    // Compute totals dynamically based on filtered data
    const totalDialed = filtered.filter(
      (r) => r.__raw.callDirection === "OUT"
    ).length;
    const totalAnswered = filtered.filter(
      (r) => r.__raw.callDirection === "IN" && r.__raw.isMissed === "Answered"
    ).length;
    const totalMissed = filtered.filter(
      (r) =>
        r.__raw.callDirection === "IN" && r.__raw.isMissed === "Not Answered"
    ).length;
    const totalAll = filtered.length;

    setSummaryTotals({
      totalDialed,
      totalAnswered,
      totalNoAnswered: totalMissed,
      totalAll,
    });

    // Apply active tab filter
    let tabFiltered = filtered;
    if (activeTab === "received") {
      tabFiltered = filtered.filter(
        (r) => r.__raw.callDirection === "IN" && r.__raw.isMissed === "Answered"
      );
    } else if (activeTab === "missed") {
      tabFiltered = filtered.filter(
        (r) =>
          r.__raw.callDirection === "IN" && r.__raw.isMissed === "Not Answered"
      );
    } else if (activeTab === "dialed") {
      tabFiltered = filtered.filter((r) => r.__raw.callDirection === "OUT");
    }

    // Sort
    const { key, direction } = sortConfig;
    tabFiltered.sort((a, b) => {
      let valA = a[key];
      let valB = b[key];
      if (key === "startTime") {
        valA = safeParseDate(valA)?.getTime() || 0;
        valB = safeParseDate(valB)?.getTime() || 0;
      }
      return direction === "asc" ? valA - valB : valB - valA;
    });

    // Pagination
    const totalRecords = tabFiltered.length;
    const totalPages = Math.ceil(totalRecords / PAGE_SIZE);
    const startIdx = page * PAGE_SIZE;
    const endIdx = startIdx + PAGE_SIZE;
    setItems(tabFiltered.slice(startIdx, endIdx));
    setMeta({ currentPage: page, totalPages, totalRecords });
  }, [allData, filters, activeTab, sortConfig, page]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    setPage(0);
  };

  const onTabClick = (key) => {
    if (key === activeTab) return;
    setActiveTab(key);
    setPage(0);
  };

  const hasNext = page + 1 < (meta.totalPages || 1);

  const handleExtensionSubmit = (extension) => {
    try {
      const authData = Cookies.get("authData");
      if (authData) {
        const parsed = JSON.parse(authData);
        parsed.user.userExtension = extension;
        Cookies.set("authData", JSON.stringify(parsed), { path: "/" });
      }
      setUserExtensionState(extension);
      setShowExtensionDialog(false);
    } catch (err) {
      alert("Failed to save extension.");
    }
  };

  return (
    <div className="cdr-container">
      <h1 className="cdr-title">Call Detail Records</h1>

      {showExtensionDialog && (
        <ExtensionDialog
          onSubmit={handleExtensionSubmit}
          onClose={() => setShowExtensionDialog(false)}
        />
      )}

      {/* Filters */}
      <div className="cdr-filters">
        <label>
          From:
          <input
            type="datetime-local"
            name="from"
            value={filters.from}
            onChange={handleFilterChange}
          />
        </label>
        <label>
          To:
          <input
            type="datetime-local"
            name="to"
            value={filters.to}
            onChange={handleFilterChange}
          />
        </label>
        <label>
          Search:
          <input
            type="text"
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            placeholder="Agent / Number"
          />
        </label>
        <button onClick={applyFilters}>Apply</button>
      </div>

      {/* Tabs */}
      <div className="cdr-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`cdr-tab ${activeTab === t.key ? "active" : ""}`}
            onClick={() => onTabClick(t.key)}
            style={{
              borderBottom:
                activeTab === t.key ? `2px solid ${t.color}` : "none",
            }}
          >
            {t.label}
            <span
              className="cdr-badge"
              style={{ backgroundColor: t.color, marginLeft: "8px" }}
            >
              {t.key === "all"
                ? summaryTotals.totalAll
                : t.key === "received"
                  ? summaryTotals.totalAnswered
                  : t.key === "dialed"
                    ? summaryTotals.totalDialed
                    : summaryTotals.totalNoAnswered}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="cdr-table-wrapper">
        <table className="cdr-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Agent Name</th>
              <th>Number</th>
              <th>Start Time</th>
              <th>Duration</th>
              <th>Direction</th>
              <th>Agent Talked To</th>
              <th>Status</th>
              <th>Recording</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9">Loading...</td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan="9">No records found</td>
              </tr>
            ) : (
              items.map((item, i) => (
                <tr key={item.uuid || i}>
                  <td>{page * PAGE_SIZE + i + 1}</td>
                  <td>{item.agentName}</td>
                  <td>{item.customerNumber}</td>
                  <td>{formatDate(item.startTime)}</td>
                  <td>{item.talkDuration}</td>
                  <td>{item.direction}</td>
                  <td>{item.agentTalkedTo}</td>
                  <td>{item.isMissed}</td>
                  <td>
                    {item.recordingFile ? (
                      <button onClick={() => setPlayingUuid(item.uuid)}>
                        ▶ Play
                      </button>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Audio Player Dialog */}
      {playingUuid && (
        <Dialog open={true} onClose={() => setPlayingUuid(null)}>
          <DialogTitle>
            CDR Recording
            <IconButton
              onClick={() => setPlayingUuid(null)}
              sx={{ position: "absolute", right: "8px", top: "8px" }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <audio
              key={playingUuid}
              controls
              autoPlay
              onEnded={() => setPlayingUuid(null)}
              style={{ width: "100%" }}
            >
              <source
                src={`${variables.app.services}auth/downloadRecordingFile/agentCdr/${playingUuid}`}
                type="audio/mpeg"
              />
            </audio>
          </DialogContent>
        </Dialog>
      )}

      {/* Pagination */}
      <div className="cdr-pagination">
        <button
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
        >
          Prev
        </button>
        <span>
          Page {page + 1} of {meta.totalPages || 1}
        </span>
        <button onClick={() => setPage((p) => p + 1)} disabled={!hasNext}>
          Next
        </button>
      </div>
    </div>
  );
};

export default CDR;
