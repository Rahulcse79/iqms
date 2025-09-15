// src/pages/IncomingQueries/IncomingQueries.jsx
import React, { useMemo, useState } from "react";
import QueriesTable from "../../components/QueriesTable";
import { useSelector, useDispatch } from "react-redux";
import "./IncomingQueries.css";
import { refreshPendingQueries } from "../../actions/pendingQueryAction";
import { HiOutlineRefresh } from "react-icons/hi";

/**
 * IncomingQueries (reads cache)
 *
 * - Data comes from Redux pending_queries.byKey[pendingWith]
 * - No Show more / Load all in UI: Refresh button triggers full fetch (refreshPendingQueries)
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

const IncomingQueries = ({ cat = 1, deptPrefix = "U", personnelType = "A" }) => {
  const [activeTab, setActiveTab] = useState("creator");
  const dispatch = useDispatch();

  const pendingWith = `${deptPrefix}${roleDigitForTab[activeTab]}${personnelType}`;

  const cachedEntry = useSelector((state) => state.pending_queries.byKey[pendingWith] || {});
  const items = Array.isArray(cachedEntry.items) ? cachedEntry.items : [];
  const loading = Boolean(cachedEntry.loading);
  const error = cachedEntry.error || null;
  const hasMore = Boolean(cachedEntry.hasMore); // may be undefined; used only for display

  const tabTitle = `Pending Queries - ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`;

  const tableData = useMemo(() => {
    return (items || []).map((it, idx) => ({
      id: it.doc_id ?? `${it.sno ?? "no-sno"}-${idx}`,
      serviceNo: it.sno ?? it.pers ?? "",
      type:
        (it.querytype && String(it.querytype).replace(/_/g, " ")) ||
        it.doc_type ||
        it.subject ||
        "",
      queryId: it.doc_id ? String(it.doc_id) : it.imprno ? String(it.imprno) : `${it.sno}-${idx}`,
      date: formatIso(it.submit_date ?? it.action_dt ?? it.last_action_dt),
      cat: it?.cat ?? null,
      raw: it,
    }));
  }, [items]);

  const handleRefresh = async () => {
    try {
      await dispatch(refreshPendingQueries({ cat, pendingWith }));
    } catch (err) {
      console.error("Refresh pending failed", err);
    }
  };

  return (
    <>
      <div className="tab-buttons">
        <button
          className={activeTab === "creator" ? "active" : ""}
          onClick={() => setActiveTab("creator")}
          disabled={loading}
        >
          Pending at Creator
        </button>

        <button
          className={activeTab === "verifier" ? "active" : ""}
          onClick={() => setActiveTab("verifier")}
          disabled={loading}
        >
          Pending at Verifier
        </button>

        <button
          className={activeTab === "approver" ? "active" : ""}
          onClick={() => setActiveTab("approver")}
          disabled={loading}
        >
          Pending at Approver
        </button>
      </div>

      <div style={{ margin: "8px 0", display: "flex", gap: 8, alignItems: "center" }}>
        <h3 style={{ margin: 0, color: "var(--text)" }}>{tabTitle}</h3>

        <button
          onClick={handleRefresh}
          style={{ marginLeft: 8, background: "var(--button-bg)" }}
          disabled={loading}
        >
                    {loading ? <HiOutlineRefresh /> : <HiOutlineRefresh />}
          
        </button>

        <div style={{ marginLeft: 8 }}>
          {loading && <small>Loading first page / refreshing…</small>}
          {!loading && <small style={{ color: "var(--text)" }}>Loaded: {items.length}</small>}
        </div>

        {error && <small style={{ marginLeft: 8, color: "crimson" }}>Error: {error}</small>}
      </div>

      <QueriesTable title={tabTitle} data={tableData} loading={loading} />

      {/* No show-more UI — refresh triggers full fetch */}
      <div style={{ marginTop: 12 }}>
        <small style={{ color: "var(--text)" }}>{items.length} items cached.</small>
      </div>
    </>
  );
};

export default IncomingQueries;
