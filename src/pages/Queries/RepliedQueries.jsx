// src/pages/RepliedQueries/RepliedQueries.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useDispatch } from "react-redux";
import {
  refreshRepliedQueriesNew,
  hydrateRepliedQueriesFromStorage,
} from "../../actions/repliedQueryActionNew";
import QueriesTable from "../../components/QueriesTable";
import { HiOutlineRefresh } from "react-icons/hi";

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
  if (!iso) return "N/A";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
};

const RepliedQueries = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();

  const activeRole = useMemo(() => getLocalStorageData(ACTIVE_ROLE_KEY), []);

  // Hydrate from IndexedDB on mount
  useEffect(() => {
    async function hydrate() {
      if (!activeRole?.SUB_SECTION) {
        setItems([]);
        setLoading(false);
        return;
      }

      try {
        const data = await dispatch(
          hydrateRepliedQueriesFromStorage(activeRole.SUB_SECTION)
        );
        setItems(data || []);
      } catch (error) {
        console.error("Failed to hydrate:", error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    }

    hydrate();
  }, [activeRole, dispatch]);

  const handleRefresh = async () => {
    if (!activeRole) return;

    setLoading(true);
    try {
      const result = await dispatch(
        refreshRepliedQueriesNew({
          moduleCat: activeRole?.MODULE_CAT,
          subSection: activeRole?.SUB_SECTION,
          cell: activeRole?.CELL_ALLOTED,
          activeRole: activeRole,
        })
      );

      // Update local state with fresh data
      if (result?.items) {
        setItems(result.items);
      }
    } catch (error) {
      console.error("Failed to refresh replied queries", error);
    } finally {
      setLoading(false);
    }
  };

  const tableData = useMemo(() => {
    return (items || []).map((it, idx) => ({
      id: it.DOC_ID ?? `${it.SNO ?? "no-sno"}-${idx}`,
      serviceNo: it.SNO ?? it.PERS ?? "",
      type:
        (it.QUERYTYPE && String(it.QUERYTYPE).replace(/_/g, " ")) ||
        it.DOC_TYPE ||
        "N/A",
      queryId: String(it.DOC_ID || it.IMPRNO || idx),
      date: formatIso(it.SUBMIT_DATE || it.ACTION_DT),
      subject: it.SUBJECT || "No Subject",
      personnel: it.PERS || "N/A",
      raw: it,
    }));
  }, [items]);

  return (
    <div className="replied-queries-container">
      <div className="queries-header">
        <h2>Replied Queries</h2>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="refresh-btn"
        >
          <HiOutlineRefresh className={loading ? "spinning" : ""} />
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <QueriesTable data={tableData} loading={loading} />
    </div>
  );
};

export default RepliedQueries;
