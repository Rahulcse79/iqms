// src/components/CDR.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Cookies from "js-cookie";
import { styled } from "@mui/material/styles";
import { Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from "@mui/material";
import { application, opaqueServices } from "../utils/endpoints";
import { getCookieData } from "../utils/helpers";
import ExtensionDialog from "../components/ExtensionDialog";
import variables from "../utils/variables";
import { Dialog, DialogContent, DialogTitle, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

// Styled Components
const CdrContainer = styled(Box)(({ theme }) => ({
  minHeight: "100vh",
  width: "100%",
  padding: "1.5rem",
  background: theme.palette.background.default,
  fontFamily: '"Inter", system-ui, sans-serif',
  color: theme.palette.text.primary,
  borderRadius: "8px",
  boxShadow: "0 6px 18px rgba(0, 0, 0, 0.06)",
}));

const CdrTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.primary,
  textAlign: "center",
  fontSize: "1.6rem",
  fontWeight: 700,
  letterSpacing: "0.02em",
  marginBottom: "1.25rem",
}));

const CdrFilters = styled(Box)(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  gap: "1rem",
  alignItems: "flex-end",
  justifyContent: "center",
  background: theme.palette.background.default,
  border: `1px solid ${theme.palette.divider}`,
  padding: "1rem 1.25rem",
  borderRadius: "10px",
  boxShadow: "0 3px 10px rgba(0, 0, 0, 0.05)",
  marginBottom: "1.5rem",
  "& label": {
    display: "flex",
    flexDirection: "column",
    fontSize: "0.9rem",
    color: theme.palette.text.primary,
    fontWeight: 500,
  },
  "& input": {
    marginTop: "0.35rem",
    padding: "0.45rem 0.6rem",
    borderRadius: "6px",
    border: "1px solid #d1d5db",
    background: theme.palette.background.default,
    fontSize: "0.9rem",
    minWidth: "200px",
    color: theme.palette.text.primary,
    transition: "all 0.2s ease",
    "&:focus": {
      borderColor: "#0ea5a4",
      boxShadow: "0 0 0 3px rgba(14, 165, 164, 0.15)",
      outline: "none",
    },
  },
  "& button": {
    background: "#0ea5a4",
    color: "#fff",
    fontWeight: 600,
    border: "none",
    borderRadius: "6px",
    padding: "0.55rem 1rem",
    cursor: "pointer",
    fontSize: "0.9rem",
    transition: "background 0.25s ease, transform 0.1s ease",
    "&:hover:not(:disabled)": {
      background: "#0b8b8b",
      transform: "translateY(-1px)",
    },
    "&:disabled": {
      opacity: 0.6,
      cursor: "not-allowed",
    },
  },
  [theme.breakpoints.down("sm")]: {
    flexDirection: "column",
    alignItems: "stretch",
    "& label": { width: "100%" },
    "& input": { width: "100%" },
    "& button": { width: "100%" },
  },
}));

const CdrTabs = styled(Box)(({ theme }) => ({
  color: theme.palette.text.primary,
  display: "flex",
  justifyContent: "center",
  flexWrap: "wrap",
  gap: "0.5rem",
  marginBottom: "1.5rem",
}));

const CdrTab = styled(Button, {
  shouldForwardProp: (prop) => prop !== "isActive",
})(({ theme, isActive }) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: "0.5rem",
  padding: "0.45rem 0.65rem",
  borderRadius: "999px",
  border: "1px solid transparent",
  background: isActive ? "#0ea5a4" : theme.palette.background.default,
  cursor: "pointer",
  fontWeight: 600,
  fontSize: "0.9rem",
  transition: "all 0.25s ease",
  color: isActive ? "#fff" : theme.palette.text.primary,
  boxShadow: isActive ? "0 2px 8px rgba(0, 0, 0, 0.04)" : "none",
  textTransform: "none",
}));

const CdrBadge = styled("span")({
  display: "inline-block",
  minWidth: "28px",
  padding: "0.15rem 0.4rem",
  borderRadius: "12px",
  fontSize: "0.85rem",
  fontWeight: 600,
  textAlign: "center",
  marginLeft: "0.35rem",
  color: "#fff",
});

const CdrTableWrapper = styled(TableContainer)(({ theme }) => ({
  overflowX: "auto",
  background: theme.palette.background.default,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: "0.75rem",
  boxShadow: "0 2px 6px rgba(0, 0, 0, 0.04)",
}));

const StyledTable = styled(Table)(({ theme }) => ({
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "0.92rem",
  minWidth: "700px",
  "& th, & td": {
    padding: "0.55rem 0.6rem",
    borderBottom: "1px solid #f0f0f0",
    textAlign: "left",
    color: theme.palette.text.primary,
  },
  "& thead th": {
    background: theme.palette.background.default,
    fontWeight: 700,
    position: "sticky",
    top: 0,
    zIndex: 2,
    textTransform: "uppercase",
    fontSize: "0.85rem",
    letterSpacing: "0.02em",
  },
  "& tbody tr:nth-of-type(even)": {
    background: theme.palette.background.default,
  },
  "& tbody tr:hover": {
    background: theme.palette.action.hover,
    cursor: "pointer",
    transition: "background 0.2s ease",
  },
}));

const CdrPagination = styled(Box)({
  display: "flex",
  gap: "0.75rem",
  alignItems: "center",
  justifyContent: "center",
  padding: "0.8rem 0",
  "& button": {
    padding: "0.45rem 0.7rem",
    borderRadius: "6px",
    border: "1px solid #ccc",
    background: "#f6f6f6",
    cursor: "pointer",
    fontWeight: 600,
    color: "black",
    "&:disabled": {
      opacity: 0.5,
      cursor: "not-allowed",
    },
  },
});

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
  const apiUrl = useMemo(() => "agentCDR/listFilter", []);

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
      const resp = await application.post(apiUrl, payload);
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
    <CdrContainer>
      <CdrTitle variant="h1">Call Detail Records</CdrTitle>

      {showExtensionDialog && (
        <ExtensionDialog
          onSubmit={handleExtensionSubmit}
          onClose={() => setShowExtensionDialog(false)}
        />
      )}

      {/* Filters */}
      <CdrFilters>
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
      </CdrFilters>

      {/* Tabs */}
      <CdrTabs>
        {TABS.map((t) => (
          <CdrTab
            key={t.key}
            isActive={activeTab === t.key}
            onClick={() => onTabClick(t.key)}
            style={{
              borderBottom:
                activeTab === t.key ? `2px solid ${t.color}` : "none",
            }}
          >
            {t.label}
            <CdrBadge
              style={{ backgroundColor: t.color, marginLeft: "8px" }}
            >
              {t.key === "all"
                ? summaryTotals.totalAll
                : t.key === "received"
                  ? summaryTotals.totalAnswered
                  : t.key === "dialed"
                    ? summaryTotals.totalDialed
                    : summaryTotals.totalNoAnswered}
            </CdrBadge>
          </CdrTab>
        ))}
      </CdrTabs>

      {/* Table */}
      <CdrTableWrapper component={Paper}>
        <StyledTable>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Agent Name</TableCell>
              <TableCell>Number</TableCell>
              <TableCell>Start Time</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Direction</TableCell>
              <TableCell>Agent Talked To</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Recording</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9}>Loading...</TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9}>No records found</TableCell>
              </TableRow>
            ) : (
              items.map((item, i) => (
                <TableRow key={item.uuid || i}>
                  <TableCell>{page * PAGE_SIZE + i + 1}</TableCell>
                  <TableCell>{item.agentName}</TableCell>
                  <TableCell>{item.customerNumber}</TableCell>
                  <TableCell>{formatDate(item.startTime)}</TableCell>
                  <TableCell>{item.talkDuration}</TableCell>
                  <TableCell>{item.direction}</TableCell>
                  <TableCell>{item.agentTalkedTo}</TableCell>
                  <TableCell>{item.isMissed}</TableCell>
                  <TableCell>
                    {item.recordingFile ? (
                      <Button size="small" onClick={() => setPlayingUuid(item.uuid)}>
                        ▶ Play
                      </Button>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </StyledTable>
      </CdrTableWrapper>

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
      <CdrPagination>
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
      </CdrPagination>
    </CdrContainer>
  );
};

export default CDR;
