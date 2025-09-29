// src/pages/IncomingQueries/IncomingQueries.jsx
import React, { useMemo, useState, useEffect } from "react";
import QueriesTable from "../../components/QueriesTable";
import { useSelector, useDispatch } from "react-redux";
import "./IncomingQueries.css";
import { refreshPendingQueries } from "../../actions/pendingQueryAction";
import { HiOutlineRefresh } from "react-icons/hi";

/**
 * IncomingQueries (reads from localStorage directly)
 * 
 * - Primary data source: localStorage with key "pendingQueries_v1"
 * - Fallback: Redux state if localStorage is empty
 * - Refresh button triggers full fetch and updates localStorage
 */

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

const IncomingQueries = ({ 
  cat = 1, 
  deptPrefix = "U", 
  personnelType = "A" 
}) => {
  const [activeTab, setActiveTab] = useState("creator");
  const [localData, setLocalData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const dispatch = useDispatch();
  
  const pendingWith = `${deptPrefix}${roleDigitForTab[activeTab]}${personnelType}`;
  
  // Redux fallback data
  const cachedEntry = useSelector(
    (state) => state.pending_queries?.byKey?.[pendingWith] || {}
  );

  // Load data from localStorage on component mount and tab change
  useEffect(() => {
    const loadDataFromStorage = () => {
      try {
        setLoading(true);
        setError(null);
        
        // Read from localStorage first
        const storageData = getLocalStorageData("pendingQueries_v1");
        
        if (storageData && storageData[pendingWith]) {
          console.log(`Loading pending queries for ${pendingWith} from localStorage:`, storageData[pendingWith]);
          setLocalData(storageData[pendingWith]);
        } else {
          console.log(`No data found in localStorage for ${pendingWith}, checking Redux...`);
          // Fallback to Redux if localStorage is empty
          const reduxItems = Array.isArray(cachedEntry.items) ? cachedEntry.items : [];
          setLocalData(reduxItems);
          
          // If Redux is also empty, try to fetch fresh data
          if (reduxItems.length === 0) {
            console.log("No data in Redux either, triggering refresh...");
            handleRefresh();
          }
        }
      } catch (err) {
        console.error("Error loading data from storage:", err);
        setError("Failed to load queries from storage");
        setLocalData([]);
      } finally {
        setLoading(false);
      }
    };

    loadDataFromStorage();
  }, [activeTab, pendingWith]);

  // Listen for localStorage changes (when data is updated by API calls)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "pendingQueries_v1") {
        console.log("localStorage updated, reloading data...");
        const storageData = getLocalStorageData("pendingQueries_v1");
        if (storageData && storageData[pendingWith]) {
          setLocalData(storageData[pendingWith]);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events (in case data is updated in same tab)
    const handleCustomUpdate = () => {
      const storageData = getLocalStorageData("pendingQueries_v1");
      if (storageData && storageData[pendingWith]) {
        setLocalData(storageData[pendingWith]);
      }
    };

    window.addEventListener('pendingQueriesUpdated', handleCustomUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('pendingQueriesUpdated', handleCustomUpdate);
    };
  }, [pendingWith]);

  // Use local data as primary source
  const items = Array.isArray(localData) ? localData : [];
  
  const tabTitle = `Pending Queries - ${
    activeTab.charAt(0).toUpperCase() + activeTab.slice(1)
  }`;

  const tableData = useMemo(() => {
    return (items || []).map((it, idx) => ({
      id: it.doc_id ?? `${it.sno ?? "no-sno"}-${idx}`,
      serviceNo: it.sno ?? it.pers ?? "",
      type: (it.querytype && String(it.querytype).replace(/_/g, " ")) || 
            it.doc_type || it.subject || "",
      queryId: it.doc_id ? String(it.doc_id) : 
               it.imprno ? String(it.imprno) : `${it.sno}-${idx}`,
      date: formatIso(it.submit_date ?? it.action_dt ?? it.last_action_dt),
      cat: it?.cat ?? null,
      raw: it,
    }));
  }, [items]);

  const handleRefresh = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`Refreshing pending queries for ${pendingWith}...`);
      
      // Dispatch Redux action to fetch fresh data
      await dispatch(refreshPendingQueries({ cat, pendingWith }));
      
      // After API call, read updated data from localStorage
      setTimeout(() => {
        const updatedData = getLocalStorageData("pendingQueries_v1");
        if (updatedData && updatedData[pendingWith]) {
          console.log("Data refreshed, updating local state:", updatedData[pendingWith]);
          setLocalData(updatedData[pendingWith]);
        }
      }, 500); // Small delay to ensure localStorage is updated
      
    } catch (err) {
      console.error("Refresh pending failed", err);
      setError("Failed to refresh queries");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="incoming-queries">
        <div className="header">
          <h2>{tabTitle}</h2>
          <div className="header-controls">
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
          {Object.keys(roleDigitForTab).map((role) => (
            <button
              key={role}
              className={`tab ${activeTab === role ? "active" : ""}`}
              onClick={() => setActiveTab(role)}
            >
              {role.charAt(0).toUpperCase() + role.slice(1)}
              {/* Show count if data is available */}
              {(() => {
                const roleKey = `${deptPrefix}${roleDigitForTab[role]}${personnelType}`;
                const storageData = getLocalStorageData("pendingQueries_v1");
                const count = storageData?.[roleKey]?.length || 0;
                return count > 0 ? ` (${count})` : '';
              })()}
            </button>
          ))}
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
              // Handle row click navigation
            }}
          />
        </div>

        <div className="footer-info">
          <p>
            Total queries: {items.length} | 
            Active tab: {pendingWith} |
            Data source: {items.length > 0 ? 'localStorage' : 'empty'}
          </p>
        </div>
      </div>
    </>
  );
};

export default IncomingQueries;
