// src/pages/TransferredQueries/TransferredQueries.jsx - FINAL WORKING VERSION

import React, { useMemo, useState, useEffect, useCallback } from "react";
import QueriesTable from "../../components/QueriesTable";
import { useDispatch } from "react-redux";
import "./IncomingQueries.css";
import { HiOutlineRefresh } from "react-icons/hi";
import { getDesignationFlags } from "../../utils/helpers";
import {
  refreshAllTransferredQueriesForRole,
  generateTransferredPenWithCode,
} from "../../actions/transferredQueryActionNew";

const STORAGE_KEY = "transferredQueries_v2_new";
const ACTIVE_ROLE_KEY = "activeRole_v1";

const getLocalStorageData = (key) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.warn(`Failed to read from localStorage key: ${key}`, error);
    return null;
  }
};

const formatIso = (iso) => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
};

const TransferredQueries = () => {
  const [activeTab, setActiveTab] = useState("creator");
  const [localData, setLocalData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [designationFlag, setDesignationFlag] = useState(null);

  const dispatch = useDispatch();

  // ✅ Get active role directly from localStorage
  const activeRole = useMemo(() => getLocalStorageData(ACTIVE_ROLE_KEY), []);

  // Fetch designation flag when the component mounts or activeRole changes
  useEffect(() => {
    const fetchFlag = async () => {
      if (activeRole) {
        setLoading(true);
        try {
          const flags = await getDesignationFlags(activeRole);
          if (flags && flags.length > 0) {
            setDesignationFlag(flags[0]);
          } else {
            console.warn("[Transferred] No designation flags found.");
            setDesignationFlag(null);
          }
        } catch (err) {
          console.error("[Transferred] Failed to get designation flags", err);
          setError("Failed to get designation flags.");
        } finally {
          setLoading(false);
        }
      }
    };
    fetchFlag();
  }, [activeRole]);

  // ✅ CORRECTLY calculate pendingWith based on designationFlag
  const pendingWith = useMemo(() => {
    if (!designationFlag) return null;
    const roleMap = { creator: "1", verifier: "2", approver: "3" };
    return generateTransferredPenWithCode(designationFlag, roleMap[activeTab]);
  }, [activeTab, designationFlag]);

  // Function to load data from localStorage
  const loadDataFromStorage = useCallback(() => {
    if (!pendingWith) {
      setLocalData([]);
      return;
    }
    const allData = getLocalStorageData(STORAGE_KEY);
    const dataForTab = allData?.[pendingWith] || [];
    setLocalData(dataForTab);
  }, [pendingWith]);

  // Initial data load and live updates
  useEffect(() => {
    loadDataFromStorage();

    const handleStorageUpdate = () => {
      loadDataFromStorage();
    };

    window.addEventListener("storage", handleStorageUpdate);
    window.addEventListener("transferredQueriesUpdated", handleStorageUpdate);

    return () => {
      window.removeEventListener("storage", handleStorageUpdate);
      window.removeEventListener("transferredQueriesUpdated", handleStorageUpdate);
    };
  }, [loadDataFromStorage]);

  const handleRefresh = async () => {
    if (!activeRole || !designationFlag) return;
    setLoading(true);
    setError(null);
    try {
      await dispatch(refreshAllTransferredQueriesForRole(activeRole, [designationFlag]));
    } catch (err) {
      setError("Failed to refresh queries.");
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  const tableData = useMemo(() => {
    return (localData || []).map((it, idx) => ({
        id: it.doc_id ?? `${it.sno ?? "no-sno"}-${idx}`,
        serviceNo: it.sno ?? it.pers ?? "",
        type: (it.querytype && String(it.querytype).replace(/_/g, " ")) || it.doc_type || it.subject || "",
        queryId: it.doc_id ? String(it.doc_id) : it.imprno ? String(it.imprno) : `${it.sno}-${idx}`,
        date: formatIso(it.submit_date ?? it.action_dt ?? it.last_action_dt),
        cat: it?.cat ?? null,
        raw: it,
    }));
  }, [localData]);

  const tabTitle = `Transferred Queries - ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`;

  return (
    <div className="transferred-queries">
      <div className="header">
        <h2>{tabTitle}</h2>
        <div className="header-controls">
          {activeRole && (
            <small style={{ marginRight: "1rem", color: "var(--muted)" }}>
              Role: {activeRole.PORTFOLIO_NAME} | Code: {pendingWith || "N/A"}
            </small>
          )}
          <button onClick={handleRefresh} disabled={loading} className="refresh-btn">
            <HiOutlineRefresh className={loading ? "spinning" : ""} />
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="tabs">
        {["creator", "verifier", "approver"].map((role) => {
          const roleMap = { creator: "1", verifier: "2", approver: "3" };
          const code = designationFlag ? generateTransferredPenWithCode(designationFlag, roleMap[role]) : null;
          const allData = getLocalStorageData(STORAGE_KEY);
          const count = code ? allData?.[code]?.length || 0 : 0;

          return (
            <button key={role} className={`tab ${activeTab === role ? "active" : ""}`} onClick={() => setActiveTab(role)}>
              {role.charAt(0).toUpperCase() + role.slice(1)}
              {code && <span className="tab-code">({code})</span>}
              {count > 0 && <span className="tab-count"> • {count}</span>}
            </button>
          );
        })}
      </div>

      {error && <div className="error-message"><p>{error}</p></div>}

      <div className="table-container">
        <QueriesTable data={tableData} loading={loading} />
      </div>
    </div>
  );
};

export default TransferredQueries;
