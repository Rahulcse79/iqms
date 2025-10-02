// src/pages/IncomingQueries/IncomingQueries.jsx - FULLY FIXED VERSION
import React, { useMemo, useState, useEffect, useCallback } from "react";
import QueriesTable from "../../components/QueriesTable";
import { useSelector, useDispatch } from "react-redux";
import "./IncomingQueries.css";
import {
  refreshPendingQueriesNew,
  generatePenWithCode,
  getAllPendingCountsForRole,
} from "../../actions/pendingQueryActionNew";
import { HiOutlineRefresh } from "react-icons/hi";
import { useActiveRole } from "../../hooks/useActiveRole";
import { getAllRoleLevelCodesForPending } from "../../constants/Enum";
import { getNewAPIParamsFromActiveRole } from "../../utils/helpers";

/**
 * IncomingQueries with FULL Live Updates - COMPLETELY FIXED VERSION
 * - Live role changes with proper code updates
 * - Live localStorage changes detection
 * - Background data updates without refresh
 */

const STORAGE_KEY = "pendingQueries_v2_new";

const roleDigitForTab = {
  creator: "1",
  approver: "2",
  verifier: "3",
};

const formatIso = (iso) => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString();
  } catch (e) {
    return iso;
  }
};

// Function to read data directly from localStorage
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [forceRefresh, setForceRefresh] = useState(0);
  const [storageData, setStorageData] = useState(null); // Track localStorage state

  const dispatch = useDispatch();

  // Use active role hook
  const { activeRole } = useActiveRole();

  // Generate PEN_WITH code for current tab and active role
  const currentPenWith = useMemo(() => {
    if (!activeRole) return "U1A"; // fallback

    const levelMapping = {
      creator: "1",
      verifier: "2",
      approver: "3",
    };

    const level = levelMapping[activeTab] || "1";
    const penWith = generatePenWithCode(activeRole, level);

    console.log(`🎯 Current PEN_WITH for tab ${activeTab}: ${penWith}`);
    return penWith;
  }, [activeRole, activeTab]);

  // Get pending counts for all tabs
  const pendingCounts = useMemo(() => {
    if (!activeRole) return { creator: 0, verifier: 0, approver: 0, total: 0 };

    return getAllPendingCountsForRole(activeRole);
  }, [activeRole, forceRefresh, storageData]);

  // Generate all role codes for active role (for tab display)
  const allRoleCodes = useMemo(() => {
    if (!activeRole) return [];

    try {
      console.log(
        "🔍 Generating codes for activeRole:",
        activeRole.SUB_SECTION,
        activeRole.MODULE
      );
      const codes = getAllRoleLevelCodesForPending(
        activeRole.SUB_SECTION,
        activeRole.MODULE
      );
      console.log("📋 Generated codes:", codes);
      return codes;
    } catch (error) {
      console.error("Error generating all role codes:", error);
      return [];
    }
  }, [activeRole, forceRefresh]);

  // Generate pending codes based on active role and current tab
  const { pendingWith, cat } = useMemo(() => {
    if (!activeRole) {
      return { pendingWith: "U1A", cat: 1 }; // fallback
    }

    try {
      console.log("🎯 Calculating pendingWith for:", {
        activeTab,
        allRoleCodes: allRoleCodes.length,
        activeRole: activeRole.SUB_SECTION,
        module: activeRole.MODULE,
      });

      // Find the code for current tab
      const roleDigitMapping = { creator: "1", approver: "2", verifier: "3" };
      const targetRoleLevel = roleDigitMapping[activeTab];

      // Map digits to role levels
      const digitToRole = { 1: "CREATOR", 2: "VERIFIER", 3: "APPROVER" };
      const targetRole = digitToRole[targetRoleLevel];

      const matchingCode = allRoleCodes.find(
        (code) => code.roleLevel === targetRole && code.isValid
      );

      const result = {
        pendingWith: matchingCode?.apiCode || "U1A",
        cat: activeRole.MODULE_CAT || 1,
      };

      console.log("✅ Calculated pendingWith:", result);
      return result;
    } catch (error) {
      console.error("Error generating pending codes:", error);
      return { pendingWith: "U1A", cat: 1 };
    }
  }, [activeRole, activeTab, allRoleCodes, forceRefresh]);

  // Redux fallback data
  const cachedEntry = useSelector(
    (state) => state.pending_queries?.byKey?.[currentPenWith] || {}
  );

  // Function to load data from localStorage
  const loadDataFromStorage = useCallback(() => {
    try {
      console.log(`🔍 Loading data for PEN_WITH: ${currentPenWith}`);
      setLoading(true);
      setError(null);

      const currentStorageData = getLocalStorageData(STORAGE_KEY);
      console.log(
        "📂 localStorage keys:",
        currentStorageData ? Object.keys(currentStorageData) : "no data"
      );

      // Update storage data state for live updates
      setStorageData(currentStorageData);

      if (currentStorageData && currentStorageData[currentPenWith]) {
        console.log(
          `✅ Found data for ${currentPenWith}:`,
          currentStorageData[currentPenWith].length,
          "items"
        );
        setLocalData(currentStorageData[currentPenWith]);
      } else {
        console.log(
          `❌ No data found in localStorage for ${currentPenWith}, checking Redux...`
        );

        // Fallback to Redux if localStorage is empty
        const reduxItems = Array.isArray(cachedEntry.items)
          ? cachedEntry.items
          : [];
        setLocalData(reduxItems);

        if (reduxItems.length === 0) {
          console.log("❌ No data in Redux either");
        }
      }
    } catch (err) {
      console.error("❌ Error loading data from storage:", err);
      setError("Failed to load queries from storage");
      setLocalData([]);
    } finally {
      setLoading(false);
    }
  }, [currentPenWith, cachedEntry.items]);

  // ENHANCED: Polling mechanism for live localStorage updates
  useEffect(() => {
    let pollingInterval;

    const checkForStorageChanges = () => {
      const currentStorage = getLocalStorageData(STORAGE_KEY);

      if (JSON.stringify(currentStorage) !== JSON.stringify(storageData)) {
        console.log("🔄 localStorage data changed, updating...");
        loadDataFromStorage();
      }
    };

    // Poll every 2 seconds for localStorage changes
    pollingInterval = setInterval(checkForStorageChanges, 2000);

    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [storageData, loadDataFromStorage]);

  // Load data when dependencies change
  useEffect(() => {
    console.log("🔄 Dependencies changed, loading data...", {
      currentPenWith,
      activeRole: !!activeRole,
    });

    if (currentPenWith && activeRole) {
      loadDataFromStorage();
    }
  }, [loadDataFromStorage, currentPenWith, activeRole]);

  // Listen for localStorage changes (cross-tab)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === STORAGE_KEY) {
        console.log(
          "📢 localStorage updated from another tab, reloading data..."
        );
        setTimeout(loadDataFromStorage, 100);
      }
    };

    const handleCustomUpdate = () => {
      console.log("📢 Custom localStorage update event, reloading data...");
      setTimeout(loadDataFromStorage, 100);
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("pendingQueriesUpdated", handleCustomUpdate);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("pendingQueriesUpdated", handleCustomUpdate);
    };
  }, [loadDataFromStorage]);

  // ENHANCED: Active role change listener with immediate UI updates
  useEffect(() => {
    const handleActiveRoleChange = (event) => {
      const newRole = event.detail?.newRole;
      if (newRole) {
        console.log("🔄 Active role changed to:", newRole.PORTFOLIO_NAME);
        console.log("🔄 Forcing immediate UI refresh...");

        // Force complete refresh of all calculations IMMEDIATELY
        setForceRefresh((prev) => prev + 1);

        // Reset current data to show loading state
        setLocalData([]);
        setLoading(true);

        // Multiple attempts with increasing delays
        setTimeout(() => {
          console.log("📂 Attempt 1: Loading data for new role...");
          loadDataFromStorage();
        }, 50); // Much faster first attempt

        setTimeout(() => {
          console.log("📂 Attempt 2: Loading data for new role...");
          loadDataFromStorage();
        }, 300);

        setTimeout(() => {
          console.log("📂 Attempt 3: Loading data for new role...");
          loadDataFromStorage();
        }, 800);
      }
    };

    window.addEventListener("activeRoleChanged", handleActiveRoleChange);
    return () =>
      window.removeEventListener("activeRoleChanged", handleActiveRoleChange);
  }, [loadDataFromStorage]);

  // Use local data as primary source
  const items = Array.isArray(localData) ? localData : [];
  const tabTitle = `Pending Queries - ${
    activeTab.charAt(0).toUpperCase() + activeTab.slice(1)
  }`;

  const tableData = useMemo(() => {
    return (items || []).map((it, idx) => ({
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
  }, [items]);

  const handleRefresh = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log(
        `🔄 Refreshing pending queries (NEW API) for ${currentPenWith}...`
      );

      const levelMapping = {
        creator: "1",
        verifier: "2",
        approver: "3",
      };

      const level = levelMapping[activeTab] || "1";

      await dispatch(
        refreshPendingQueriesNew({
          activeRole,
          level,
        })
      );

      setTimeout(() => {
        loadDataFromStorage();
      }, 500);
    } catch (err) {
      console.error("❌ Refresh pending failed (NEW API)", err);
      setError("Failed to refresh queries");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="incoming-queries">
      <div className="header">
        <h2>{tabTitle}</h2>
        <div className="header-controls">
          {/* FIXED: Live updating role info */}
          {activeRole && (
            <small
              style={{ marginRight: "1rem", color: "var(--muted)" }}
              key={`${activeRole.SUB_SECTION}-${activeRole.MODULE}-${pendingWith}`}
            >
              {activeRole.SUB_SECTION} | {activeRole.MODULE} | Code:{" "}
              {pendingWith} | Items: {items.length}
            </small>
          )}
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="refresh-btn"
            title="Refresh queries"
          >
            <HiOutlineRefresh className={loading ? "spinning" : ""} />
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="tabs">
        {Object.keys(roleDigitForTab).map((role) => {
          const roleDigit = roleDigitForTab[role];
          const digitToRole = { 1: "CREATOR", 2: "VERIFIER", 3: "APPROVER" };
          const roleLevel = digitToRole[roleDigit];

          // FIXED: Find role code using current active role (not stale data)
          const roleCode = allRoleCodes.find(
            (code) => code.roleLevel === roleLevel && code.isValid
          );

          // FIXED: Get count from current storage data state (live updates)
          const currentStorageData =
            storageData || getLocalStorageData(STORAGE_KEY);
          const count = currentStorageData?.[roleCode?.apiCode]?.length || 0;

          return (
            <button
              key={`${role}-${roleCode?.apiCode}-${forceRefresh}`} // Force re-render on role change
              className={`tab ${activeTab === role ? "active" : ""}`}
              onClick={() => setActiveTab(role)}
            >
              {role.charAt(0).toUpperCase() + role.slice(1)}
              {roleCode && (
                <span className="tab-code">({roleCode.apiCode})</span>
              )}
              {count > 0 && <span className="tab-count"> • {count}</span>}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={handleRefresh}>Try Again</button>
        </div>
      )}

      <div className="table-container">
        <QueriesTable
          data={tableData}
          loading={loading}
          onRowClick={(row) => {
            console.log("Row clicked:", row);
          }}
        />
      </div>

      <div className="footer-info">
        <p>
          Total queries: {items.length} | Active tab: {currentPenWith} | Data
          source: {items.length > 0 ? "localStorage" : "empty"}
          {activeRole && ` | Role: ${activeRole.PORTFOLIO_NAME}`}
        </p>
      </div>
    </div>
  );
};

export default IncomingQueries;
