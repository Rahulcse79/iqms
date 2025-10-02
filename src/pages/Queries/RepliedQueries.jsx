// src/pages/RepliedQueries/RepliedQueries.jsx (NEW FILE)

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useActiveRole } from "../../hooks/useActiveRole";
import { refreshRepliedQueriesNew } from "../../actions/repliedQueryActionNew";
import QueriesTable from "../../components/QueriesTable";
import { getNewAPIParamsFromActiveRole } from "../../utils/helpers";

const STORAGE_KEY = "repliedQueries_v2_new";

const formatIso = (iso) => {
  if (!iso) return "N/A";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
};

const RepliedQueries = () => {
  const { activeRole } = useActiveRole();
  const dispatch = useDispatch();
  const [items, setItems] = useState([]); // Keep the state for items
  const [loading, setLoading] = useState(false);

  // Get data from Redux store (or localStorage directly)
  const repliedData = useSelector(
    (state) => state.replied_queries?.byKey?.[activeRole?.SUB_SECTION] || {}
  );

  const loadFromStorage = useCallback(() => {
    if (!activeRole?.SUB_SECTION) {
      setItems([]); // Corrected to setItems
      return;
    }
    const storageData = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    const dataForRole = storageData[activeRole.SUB_SECTION] || [];
    setItems(dataForRole); // Corrected to setItems
  }, [activeRole]);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    if (repliedData.items && repliedData.items.length > items.length) {
      setItems(repliedData.items); // Corrected to setItems
    }
  }, [repliedData, items.length]);

  const handleRefresh = async () => {
    if (!activeRole) return;
    setLoading(true);
    const { MODULE_CAT, SUB_SECTION, CELL } =
      getNewAPIParamsFromActiveRole(activeRole);
    await dispatch(
      refreshRepliedQueriesNew({
        moduleCat: MODULE_CAT,
        subSection: SUB_SECTION,
        cell: CELL,
      })
    );
    setLoading(false);
  };

  const tableData = useMemo(() => {
    return items.map((item, index) => ({ // Corrected to use items
      id: item.doc_id || `${item.sno}-${index}`,
      serviceNo: item.sno || "N/A",
      type: item.querytype?.replace(/_/g, " ") || item.doc_type || "N/A",
      queryId: String(item.doc_id || item.imprno || index),
      date: formatIso(item.submit_date || item.action_dt),
      subject: item.subject || "No Subject", // Add subject
      personnel: item.pers || "N/A", // Add personnel info
      raw: item,
    }));
  }, [items]); // Corrected to use items

  return (
    <div>
      <h2>Replied Queries</h2>
      <button onClick={handleRefresh} disabled={loading} className="refresh-btn">
        {loading ? "Refreshing..." : "Refresh"}
      </button>
      {/* Pass the mapped 'tableData' to the component */}
      <QueriesTable data={tableData} loading={loading} />
    </div>
  );
};

export default RepliedQueries;
