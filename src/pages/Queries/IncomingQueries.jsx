// src/pages/IncomingQueries/IncomingQueries.jsx - FINAL WORKING VERSION

import React, { useMemo, useState, useEffect, useCallback } from "react";
import QueriesTable from "../../components/QueriesTable";
import { useDispatch } from "react-redux";
import "./IncomingQueries.css";
import {
  refreshPendingQueriesNew,
  generatePenWithCode,
  getAllPendingCountsForRole,
} from "../../actions/pendingQueryActionNew";
import { HiOutlineRefresh } from "react-icons/hi";

const STORAGE_KEY = "pendingQueries_v2_new";
const ACTIVE_ROLE_KEY = "activeRole_v1";

const formatIso = (iso) => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString();
  } catch (e) {
    return iso;
  }
};

const getLocalStorageData = (key) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.warn(`Failed to read from localStorage key: ${key}`, error);
    return null;
  }
};

const IncomingQueries = () => {
  const [activeTab, setActiveTab] = useState("creator");
  const [localData, setLocalData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [counts, setCounts] = useState({
    creator: 0,
    verifier: 0,
    approver: 0,
  });

  const dispatch = useDispatch();

  // ✅ Get active role directly from localStorage
  const activeRole = useMemo(() => getLocalStorageData(ACTIVE_ROLE_KEY), []);

  // ✅ CORRECTLY calculate penWith based on activeRole and tab
  const currentPenWith = useMemo(() => {
    if (!activeRole) return null;
    const levelMapping = { creator: "1", verifier: "2", approver: "3" };
    return generatePenWithCode(activeRole, levelMapping[activeTab] || "1");
  }, [activeRole, activeTab]);

  // Single effect for all data loading and live updates
  useEffect(() => {
    const updateDataAndCounts = () => {
      const role = getLocalStorageData(ACTIVE_ROLE_KEY);
      if (!role) {
        setLocalData([]);
        setCounts({ creator: 0, verifier: 0, approver: 0 });
        setLoading(false);
        return;
      }

      const allData = getLocalStorageData(STORAGE_KEY);

      // Update counts for all tabs
      const newCounts = getAllPendingCountsForRole(role);
      setCounts(newCounts);

      // Update data for the current tab
      const penWithForTab = generatePenWithCode(
        role,
        { creator: "1", verifier: "2", approver: "3" }[activeTab]
      );
      const dataForTab = allData?.[penWithForTab] || [];
      setLocalData(dataForTab);

      if (loading) setLoading(false);
    };

    updateDataAndCounts(); // Initial load

    const interval = setInterval(updateDataAndCounts, 2000); // Poll every 2 seconds

    return () => clearInterval(interval); // Cleanup
  }, [activeTab, loading]); // Re-run if activeTab changes

  const handleRefresh = async () => {
    if (!activeRole) return;
    setLoading(true);
    setError(null);
    try {
      const levelMapping = { creator: "1", verifier: "2", approver: "3" };
      const level = levelMapping[activeTab] || "1";
      await dispatch(refreshPendingQueriesNew({ activeRole, level }));
    } catch (err) {
      setError("Failed to refresh queries.");
    } finally {
      // The polling will handle the UI update, but we can turn off the loader
      setTimeout(() => setLoading(false), 500);
    }
  };

  const tableData = useMemo(() => {
    return (localData || []).map((it, idx) => ({
      id: it.doc_id ?? `${it.sno ?? "no-sno"}-${idx}`,
      serviceNo: it.sno ?? it.pers ?? "",
      type:
        (it.querytype && String(it.querytype).replace(/_/g, " ")) ||
        it.doc_type ||
        it.subject ||
        "",
      queryId: it.doc_id
        ? String(it.doc_id)
        : it.imprno
        ? String(it.imprno)
        : `${it.sno}-${idx}`,
      date: formatIso(it.submit_date ?? it.action_dt ?? it.last_action_dt),
      cat: it?.cat ?? null,
      raw: it,
    }));
  }, [localData]);

  const tabTitle = `Pending Queries - ${
    activeTab.charAt(0).toUpperCase() + activeTab.slice(1)
  }`;

  return (
    <div className="incoming-queries">
      <div className="header">
        <h2>{tabTitle}</h2>
        <div className="header-controls">
          {activeRole && (
            <small style={{ marginRight: "1rem", color: "var(--muted)" }}>
              {activeRole.PORTFOLIO_NAME} | Code: {currentPenWith || "N/A"}
            </small>
          )}
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="refresh-btn"
          >
            <HiOutlineRefresh className={loading ? "spinning" : ""} />
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="tabs">
        {Object.keys({ creator: "1", verifier: "2", approver: "3" }).map(
          (role) => (
            <button
              key={role}
              className={`tab ${activeTab === role ? "active" : ""}`}
              onClick={() => setActiveTab(role)}
            >
              {role.charAt(0).toUpperCase() + role.slice(1)}
              {counts[role] > 0 && (
                <span className="tab-count"> • {counts[role]}</span>
              )}
            </button>
          )
        )}
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      <div className="table-container">
        <QueriesTable data={tableData} loading={loading} />
      </div>
    </div>
  );
};

export default IncomingQueries;
