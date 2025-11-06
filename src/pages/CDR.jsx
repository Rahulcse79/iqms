// src/components/CDR.jsx
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import Cookies from "js-cookie";
import "./CDR.css";
import { opaqueServices } from "../utils/endpoints";
import { getCookieData } from "../utils/helpers";
import ExtensionDialog from "../components/ExtensionDialog";
import variables from "../utils/variables";
import ReactPlayer from "react-player";
import { Dialog, DialogContent, DialogTitle } from "@mui/material";
import { IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const TABS = [
  {
    key: "received",
    label: "Received",
    badgeKey: "totalAnswered",
    color: "#16a34a",
  },
  { key: "dialed", label: "Dialed", badgeKey: "totalDialed", color: "#2563eb" },
  {
    key: "missed",
    label: "Missed",
    badgeKey: "totalNoAnswered",
    color: "#dc2626",
  },
  { key: "all", label: "All", badgeKey: "totalOffered", color: "#f97316" },
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
        meta: {
          currentPage: Number.isFinite(dataRoot.currentPage)
            ? dataRoot.currentPage
            : 0,
          pageSize: Number.isFinite(dataRoot.pageSize)
            ? dataRoot.pageSize
            : PAGE_SIZE,
          totalRecords: Number.isFinite(dataRoot.totalRecords)
            ? dataRoot.totalRecords
            : null,
          totalPages: Number.isFinite(dataRoot.totalPages)
            ? dataRoot.totalPages
            : 1,
        },
      };
    }

    if (dataRoot.items) {
      return {
        items: Array.isArray(dataRoot.items) ? dataRoot.items : [],
        meta: {
          currentPage: Number.isFinite(dataRoot.currentPage)
            ? dataRoot.currentPage
            : 0,
          pageSize: Number.isFinite(dataRoot.pageSize)
            ? dataRoot.pageSize
            : PAGE_SIZE,
          totalRecords: Number.isFinite(dataRoot.totalRecords)
            ? dataRoot.totalRecords
            : null,
          totalPages: Number.isFinite(dataRoot.totalPages)
            ? dataRoot.totalPages
            : 1,
        },
      };
    }

    if (Array.isArray(dataRoot)) {
      return {
        items: dataRoot,
        meta: {
          currentPage: 0,
          pageSize: PAGE_SIZE,
          totalRecords: dataRoot.length,
          totalPages: 1,
        },
      };
    }

    return { items: [], meta: {} };
  } catch (err) {
    console.error("normalizeResponse error:", err);
    return { items: [], meta: {} };
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

/* ---------- main component ---------- */
const CDR = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [page, setPage] = useState(0);
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({
    currentPage: 0,
    pageSize: PAGE_SIZE,
    totalPages: 1,
    totalRecords: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [sortConfig, setSortConfig] = useState({
    key: "startTime",
    direction: "desc", // default descending by start time
  });

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        // toggle direction
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      } else {
        return { key, direction: "asc" };
      }
    });
  };

  const [allData, setAllData] = useState([]);

  const [summaryTotals, setSummaryTotals] = useState({
    totalOffered: 0,
    totalAnswered: 0,
    totalDialed: 0,
    totalNoAnswered: 0,
    totalAll: 0,
  });

  const [filters, setFilters] = useState(() => getDefaultLast30DaysFilter());
  const reqCounterRef = useRef(0);

  // extension handling
  const [userExtensionState, setUserExtensionState] = useState("");
  const [showExtensionDialog, setShowExtensionDialog] = useState(false);
  const [playingUuid, setPlayingUuid] = useState(null);

  // Load userExtension from cookie after mount
  useEffect(() => {
    const cookieData = getCookieData();
    const ext = cookieData?.user?.userExtension;
    if (ext) {
      console.log("Found userExtension in cookie:", ext);
      setUserExtensionState(ext);
      setShowExtensionDialog(false);
    } else {
      console.log("No userExtension found — showing dialog");
      setShowExtensionDialog(true);
    }
  }, []);

  const apiUrl = useMemo(() => "agentCDR/list", []);

  const fetchDataForTab = useCallback(async () => {
    const thisReq = ++reqCounterRef.current;
    setLoading(true);
    setError(null);

    try {
      // Fetch ALL data in one go
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
      const rawItems = normalized.items || [];
      const normalizedItems = rawItems.map(normalizeItem);

      // Save everything for frontend filtering
      setAllData(normalizedItems);

      const totalDialed = normalizedItems.filter(
        (r) => r.__raw.callDirection === "OUT"
      ).length;
      const totalReceivedAnswered = normalizedItems.filter(
        (r) => r.__raw.callDirection === "IN" && r.__raw.isMissed === "Answered"
      ).length;
      const totalMissed = normalizedItems.filter(
        (r) =>
          r.__raw.callDirection === "IN" && r.__raw.isMissed === "Not Answered"
      ).length;
      const totalReceived = totalReceivedAnswered + totalMissed;
      const totalAll = totalDialed + totalReceived;

      setSummaryTotals({
        totalDialed,
        totalAnswered: totalReceivedAnswered,
        totalNoAnswered: totalMissed,
        totalOffered: totalReceived,
        totalAll,
      });

      setLoading(false);
    } catch (err) {
      console.error("fetchDataForTab error:", err);
      if (thisReq === reqCounterRef.current) {
        setError("Failed to load records. Please try again.");
        setItems([]);
        setMeta({
          currentPage: 0,
          pageSize: PAGE_SIZE,
          totalPages: 1,
          totalRecords: 0,
        });
      }
      setLoading(false);
    }
  }, [apiUrl, userExtensionState]);

  useEffect(() => {
    if (!allData.length) return;

    let filtered = [...allData];

    if (activeTab === "received") {
      filtered = filtered.filter(
        (r) => r.__raw.callDirection === "IN" && r.__raw.isMissed === "Answered"
      );
    } else if (activeTab === "missed") {
      filtered = filtered.filter(
        (r) =>
          r.__raw.callDirection === "IN" && r.__raw.isMissed === "Not Answered"
      );
    } else if (activeTab === "dialed") {
      filtered = filtered.filter((r) => r.__raw.callDirection === "OUT");
    }

    // Search filter
    if (filters.search.trim() !== "") {
      const q = filters.search.trim().toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.agentName.toLowerCase().includes(q) ||
          r.customerNumber.toLowerCase().includes(q)
      );
    }

    // Date filter
    const fromDate = safeParseDate(filters.from);
    const toDate = safeParseDate(filters.to);
    if (fromDate || toDate) {
      filtered = filtered.filter((r) => {
        const start = safeParseDate(r.startTime);
        if (!start) return false;
        if (fromDate && start < fromDate) return false;
        if (toDate && start > toDate) return false;
        return true;
      });
    }

    const totalRecords = filtered.length;
    const totalPages = Math.ceil(totalRecords / PAGE_SIZE);
    const startIdx = page * PAGE_SIZE;
    const endIdx = startIdx + PAGE_SIZE;
    const pageItems = filtered.slice(startIdx, endIdx);

    setItems(pageItems);
    setMeta({
      currentPage: page,
      pageSize: PAGE_SIZE,
      totalRecords,
      totalPages,
    });
  }, [allData, activeTab, page, filters, sortConfig]);

  useEffect(() => {
    if (!userExtensionState) return;
    fetchDataForTab(); // fetch all data once
  }, [userExtensionState]);

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

  // Sort data whenever allData, filters, activeTab, or sortConfig change
  useEffect(() => {
    if (!allData.length) return;

    let filtered = [...allData];

    if (activeTab === "received") {
      filtered = filtered.filter(
        (r) => r.__raw.callDirection === "IN" && r.__raw.isMissed === "Answered"
      );
    } else if (activeTab === "missed") {
      filtered = filtered.filter(
        (r) =>
          r.__raw.callDirection === "IN" && r.__raw.isMissed === "Not Answered"
      );
    } else if (activeTab === "dialed") {
      filtered = filtered.filter((r) => r.__raw.callDirection === "OUT");
    }

    if (filters.search.trim() !== "") {
      const q = filters.search.trim().toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.agentName.toLowerCase().includes(q) ||
          r.customerNumber.toLowerCase().includes(q)
      );
    }

    const fromDate = safeParseDate(filters.from);
    const toDate = safeParseDate(filters.to);
    if (fromDate || toDate) {
      filtered = filtered.filter((r) => {
        const start = safeParseDate(r.startTime);
        if (!start) return false;
        if (fromDate && start < fromDate) return false;
        if (toDate && start > toDate) return false;
        return true;
      });
    }

    // 🔹 Apply sorting
    filtered.sort((a, b) => {
      const { key, direction } = sortConfig;
      let valA = a[key];
      let valB = b[key];

      if (key === "startTime") {
        valA = safeParseDate(valA)?.getTime() || 0;
        valB = safeParseDate(valB)?.getTime() || 0;
      } else if (key === "talkDuration") {
        const parseDuration = (d) => {
          if (!d || typeof d !== "string") return 0;
          const parts = d.split(":").map(Number).reverse(); // seconds, minutes, hours
          let total = 0;
          if (parts[0]) total += parts[0]; // seconds
          if (parts[1]) total += parts[1] * 60; // minutes
          if (parts[2]) total += parts[2] * 3600; // hours
          return total;
        };
        valA = parseDuration(valA);
        valB = parseDuration(valB);
      }

      if (valA < valB) return direction === "asc" ? -1 : 1;
      if (valA > valB) return direction === "asc" ? 1 : -1;
      return 0;
    });

    const totalRecords = filtered.length;
    const totalPages = Math.ceil(totalRecords / PAGE_SIZE);
    const startIdx = page * PAGE_SIZE;
    const endIdx = startIdx + PAGE_SIZE;
    const pageItems = filtered.slice(startIdx, endIdx);

    setItems(pageItems);
    setMeta({
      currentPage: page,
      pageSize: PAGE_SIZE,
      totalRecords,
      totalPages,
    });
  }, [allData, activeTab, page, filters, sortConfig]);

  useEffect(() => {
    if (!userExtensionState) return;

    const interval = setInterval(() => {
      console.log("🔁 Auto-refreshing CDR data...");
      fetchDataForTab();
    }, TAB_POLL_MS);

    return () => clearInterval(interval);
  }, [userExtensionState, fetchDataForTab]);

  const onTabClick = (key) => {
    if (key === activeTab) return;
    setActiveTab(key);
    setPage(0);
    setError(null);
  };

  const hasNext = Number.isFinite(meta.totalPages)
    ? page + 1 < meta.totalPages
    : items.length === PAGE_SIZE;

  const handleExtensionSubmit = (extension) => {
    try {
      // Update cookie also includes new userExtension
      const authData = Cookies.get("authData");
      if (authData) {
        const parsed = JSON.parse(authData);
        parsed.user.userExtension = extension;
        Cookies.set("authData", JSON.stringify(parsed), {
          expires: new Date(new Date().getTime() + 8 * 60 * 60 * 1000),
          path: "/",
          secure: window.location.protocol === "https:",
          sameSite: "Lax",
        });
      }

      // Optional: also store in localStorage for internal logic
      const baseData = JSON.parse(localStorage.getItem("baseUserData") || "{}");
      baseData.userExtension = extension;
      localStorage.setItem("baseUserData", JSON.stringify(baseData));

      setShowExtensionDialog(false);
    } catch (err) {
      console.error("Error saving extension:", err);
      alert("Failed to save extension. Please retry.");
    }
    setUserExtensionState(extension);
    setShowExtensionDialog(false);
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

      {/* FILTER SECTION */}
      <div className="cdr-filters" aria-label="Filters">
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
            placeholder="Agent / Number"
            value={filters.search}
            onChange={handleFilterChange}
          />
        </label>
        <button
          onClick={applyFilters}
          disabled={loading || !userExtensionState}
        >
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
            style={{
              borderBottom:
                activeTab === t.key ? `2px solid ${t.color}` : "none",
            }}
          >
            <span>{t.label}</span>
            <span className="cdr-badge" style={{ backgroundColor: t.color }}>
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

      {/* TABLE */}
      <div className="cdr-table-wrapper" role="region" aria-live="polite">
        <table className="cdr-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Agent Name</th>
              <th>Number</th>
              <th
                onClick={() => handleSort("startTime")}
                style={{ cursor: "pointer" }}
              >
                Start Time{" "}
                {sortConfig.key === "startTime"
                  ? sortConfig.direction === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
              </th>
              <th
                onClick={() => handleSort("talkDuration")}
                style={{ cursor: "pointer" }}
              >
                Duration{" "}
                {sortConfig.key === "talkDuration"
                  ? sortConfig.direction === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
              </th>
              <th>Direction</th>
              <th>Agent Talked To</th>
              <th> Status </th>
              <th>Recording</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="cdr-loading">
                  Loading...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="8" className="cdr-error">
                  {error}
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan="8" className="cdr-no-data">
                  No records found
                </td>
              </tr>
            ) : (
              items.map((item, i) => {
                const key =
                  item.uuid ??
                  `${item.agentName}-${item.startTime}-${item.customerNumber}-${i}`;
                return (
                  <tr key={key}>
                    <td>{page * PAGE_SIZE + i + 1}</td>
                    <td>{item.agentName ?? "-"}</td>
                    <td>{item.customerNumber ?? "-"}</td>
                    <td>{formatDate(item.startTime)}</td>
                    <td>{item.talkDuration ?? "-"}</td>
                    <td
                      className={`cdr-direction ${item.directionToken ?? ""}`}
                    >
                      {item.direction ?? "-"}
                    </td>
                    <td>{item.agentTalkedTo ?? "-"}</td>
                    <td>{item.isMissed ?? "-"}</td>
                    <td>
                      {item.recordingFile ? (
                        <div className="cdr-recording-actions">
                          <button
                            className="cdr-btn cdr-btn-play"
                            onClick={() => setPlayingUuid(item.uuid)}
                          >
                            ▶ Play
                          </button>
                          <button
                            className="cdr-btn cdr-btn-download"
                            onClick={async () => {
                              try {
                                const resp = await fetch(
                                  variables.app.services +
                                    `auth/downloadRecordingFile/agentCdr/${item.uuid}`
                                );
                                if (!resp.ok)
                                  throw new Error(
                                    `Failed to download (${resp.status})`
                                  );
                                const blob = await resp.blob();
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement("a");
                                a.href = url;
                                a.download = `${
                                  item.agentName || "recording"
                                }-${item.uuid}.mp3`;
                                document.body.appendChild(a);
                                a.click();
                                a.remove();
                                window.URL.revokeObjectURL(url);
                              } catch (err) {
                                console.error("Download error:", err);
                                alert(
                                  "Unable to download recording. Please try again later."
                                );
                              }
                            }}
                          >
                            ⬇ Download
                          </button>
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

      {/* Audio Player Dialog */}
      {playingUuid && (
        <Dialog
          open={true}
          onClose={() => setPlayingUuid(null)}
          sx={(theme) => ({
            "& .MuiPaper-root": {
              backgroundColor:
                theme.palette.mode === "dark" ? "#1e1e1e" : "#fefefe",
              color: theme.palette.mode === "dark" ? "#fff" : "#000",
              borderRadius: "8px",
              width: "520px",
            },
          })}
        >
          <DialogTitle>
            CDR Audio Recording
            <IconButton
              color="error"
              aria-label="close"
              onClick={() => setPlayingUuid(null)}
              sx={{
                position: "absolute",
                right: "8px",
                top: "8px",
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent>
            <audio
              key={playingUuid} // ensures React re-creates player fresh each time
              controls
              autoPlay
              style={{ width: "100%" }}
              onError={(e) => {
                console.error("Audio playback error:", e);
                alert("Unable to play this recording. Please try again later.");
                setPlayingUuid(null);
              }}
              onEnded={() => setPlayingUuid(null)}
            >
              <source
                src={`${variables.app.services}auth/downloadRecordingFile/agentCdr/${playingUuid}`}
                type="audio/mpeg"
              />
              Your browser does not support the audio element.
            </audio>
          </DialogContent>
        </Dialog>
      )}

      {/* PAGINATION */}
      <div className="cdr-pagination" aria-label="Pagination controls">
        <button
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0 || loading}
        >
          Prev
        </button>
        <span>
          Page{" "}
          {Number.isFinite(meta.currentPage) ? meta.currentPage + 1 : page + 1}{" "}
          of {meta.totalPages ?? 1}
        </span>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={!hasNext || loading}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default CDR;
