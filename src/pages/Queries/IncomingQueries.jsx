// src/pages/IncomingQueries/IncomingQueries.jsx
import React, { useMemo, useState } from "react";
import QueriesTable from "../../components/QueriesTable";
import "./IncomingQueries.css";
import usePendingQueries from "../../hooks/usePendingQueries";

/**
 * IncomingQueries
 *
 * - default tab: creator
 * - uses usePendingQueries hook for Creator, Verifier, Approver tabs
 * - maps incoming items into QueriesTable shape
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

  // compute pendingWith string (memo not strictly necessary)
  const pendingWith = `${deptPrefix}${roleDigitForTab[activeTab]}${personnelType}`;

  const {
    data,
    loading,
    loadingMore,
    error,
    hasMore,
    fetchNextPage,
    refresh,
    loadAll,
  } = usePendingQueries(cat, pendingWith);

  const tabTitle = `Pending Queries - ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`;

  const tableData = useMemo(() => {
    const items = Array.isArray(data) ? data : [];
    return items.map((it, idx) => ({
      id: it.doc_id ?? `${it.sno ?? "no-sno"}-${idx}`,
      serviceNo: it.sno ?? it.pers ?? "",
      type:
        (it.querytype && String(it.querytype).replace(/_/g, " ")) ||
        it.doc_type ||
        it.subject ||
        "",
      queryId: it.doc_id ? String(it.doc_id) : it.imprno ? String(it.imprno) : `${it.sno}-${idx}`,
      date: formatIso(it.submit_date ?? it.action_dt ?? it.last_action_dt),
      raw: it,
    }));
  }, [data]);

  // handler wrappers with basic error handling
  const handleLoadAll = async () => {
    try {
      await loadAll({ maxIterations: 2000 });
    } catch (e) {
      console.error("loadAll failed", e);
    }
  };

  const handleRefresh = async () => {
    try {
      await refresh();
    } catch (e) {
      console.error("refresh failed", e);
    }
  };

  const handleFetchNext = async () => {
    try {
      await fetchNextPage();
    } catch (e) {
      console.error("fetchNextPage failed", e);
    }
  };

  return (
    <>
      <div className="tab-buttons">
        <button
          className={activeTab === "creator" ? "active" : ""}
          onClick={() => setActiveTab("creator")}
          disabled={loading || loadingMore}
        >
          Pending at Creator
        </button>

        <button
          className={activeTab === "verifier" ? "active" : ""}
          onClick={() => setActiveTab("verifier")}
          disabled={loading || loadingMore}
        >
          Pending at Verifier
        </button>

        <button
          className={activeTab === "approver" ? "active" : ""}
          onClick={() => setActiveTab("approver")}
          disabled={loading || loadingMore}
        >
          Pending at Approver
        </button>
      </div>

      <div style={{ margin: "8px 0", display: "flex", gap: 8, alignItems: "center" }}>
        <h3 style={{ margin: 0, color: "var(--text)" }}>{tabTitle}</h3>

        <button onClick={handleRefresh} style={{ marginLeft: 8 }} disabled={loading}>
          Refresh
        </button>

        <div style={{ marginLeft: 8 }}>
          {loading && <small>Loading first page…</small>}
          {loadingMore && <small>Loading more…</small>}
          {!loading && !loadingMore && <small style={{color: "var(--text)"}}>Loaded: {Array.isArray(data) ? data.length : 0}</small>}
        </div>

        {error && <small style={{ marginLeft: 8, color: "var(--text)" }}>Error: {error}</small>}
      </div>

      <QueriesTable title={tabTitle} data={tableData} loading={loading} />

      <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
        {hasMore ? (
          <>
            <button onClick={handleFetchNext} disabled={loadingMore} className="show-more-btn">
              {loadingMore ? "Loading more…" : "Show more"}
            </button>

            <button onClick={handleLoadAll} disabled={loading || loadingMore} className="load-all-btn">
              Load all
            </button>

            <small style={{ marginLeft: 8 }}>
              {(Array.isArray(data) ? data.length : 0)} items loaded — more available.
            </small>
          </>
        ) : (
          <small style={{ color: "var(--text)" }}>
            {(Array.isArray(data) ? data.length : 0)} items loaded — no more pages.
          </small>
        )}
      </div>
    </>
  );
};

export default IncomingQueries;
