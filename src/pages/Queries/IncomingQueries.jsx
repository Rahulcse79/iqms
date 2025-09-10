import React, { useMemo, useState } from "react";
import QueriesTable from "../../components/QueriesTable";
import "./IncomingQueries.css";
import usePendingQueries from "../../hooks/usePendingQueries";

/**
 * IncomingQueries
 *
 * - Default tab: "Pending at Creator"
 * - Removed "Incoming" tab entirely
 * - Uses usePendingQueries hook for Creator, Verifier, Approver tabs
 *
 * Mapping to QueriesTable fields:
 *   serviceNo -> sno
 *   type      -> querytype (fallback to doc_type/subject)
 *   queryId   -> doc_id (string)
 *   date      -> submit_date (human readable)
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
  // default tab set to "creator"
  const [activeTab, setActiveTab] = useState("creator");

  const pendingWith = `${deptPrefix}${roleDigitForTab[activeTab]}${personnelType}`;

  const { data, loading, loadingMore, error, hasMore, fetchNextPage, refresh, loadAll } =
    usePendingQueries(cat, pendingWith);

  const tabTitle = `Pending at ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`;

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
      queryId: it.doc_id
        ? String(it.doc_id)
        : it.imprno
        ? String(it.imprno)
        : `${it.sno}-${idx}`,
      date: formatIso(it.submit_date ?? it.action_dt ?? it.last_action_dt),
      raw: it,
    }));
  }, [data]);

  const handleLoadAll = async () => {
    // loadAll is implemented inside the hook; it's safe but may be heavy for very large result sets
    await loadAll();
  };

  return (
    <>
      <div className="tab-buttons">
        <button
          className={activeTab === "creator" ? "active" : ""}
          onClick={() => setActiveTab("creator")}
        >
          Pending at Creator
        </button>

        <button
          className={activeTab === "verifier" ? "active" : ""}
          onClick={() => setActiveTab("verifier")}
        >
          Pending at Verifier
        </button>

        <button
          className={activeTab === "approver" ? "active" : ""}
          onClick={() => setActiveTab("approver")}
        >
          Pending at Approver
        </button>
      </div>

      <div style={{ margin: "8px 0", display: "flex", gap: 8, alignItems: "center" }}>
        <h3 style={{ margin: 0 }}>{tabTitle}</h3>

        <button onClick={refresh} style={{ marginLeft: 8 }} disabled={loading}>
          Refresh
        </button>

        <div style={{ marginLeft: 8 }}>
          {loading && <small>Loading first page…</small>}
          {loadingMore && <small>Loading more…</small>}
          {!loading && !loadingMore && (
            <small>Loaded: {Array.isArray(data) ? data.length : 0}</small>
          )}
        </div>

        {error && <small style={{ marginLeft: 8, color: "crimson" }}>Error: {error}</small>}
      </div>

      <QueriesTable title={tabTitle} data={tableData} loading={loading} />

      <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
        {hasMore ? (
          <>
            <button onClick={fetchNextPage} disabled={loadingMore} className="show-more-btn">
              {loadingMore ? "Loading more…" : "Show more"}
            </button>

            <button
              onClick={handleLoadAll}
              disabled={loading || loadingMore}
              className="load-all-btn"
            >
              Load all
            </button>

            <small style={{ marginLeft: 8 }}>
              {(Array.isArray(data) ? data.length : 0)} items loaded — more available.
            </small>
          </>
        ) : (
          <small style={{ color: "#444" }}>
            {(Array.isArray(data) ? data.length : 0)} items loaded — no more pages.
          </small>
        )}
      </div>
    </>
  );
};

export default IncomingQueries;
