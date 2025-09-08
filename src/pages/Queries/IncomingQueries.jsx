// src/pages/IncomingQueries/IncomingQueries.jsx
import React, { useMemo, useState } from "react";
import QueriesTable from "../../components/QueriesTable";
import "./IncomingQueries.css";
import usePendingQueries from "../../hooks/usePendingQueries";

/**
 * IncomingQueries component (tabs: Creator, Verifier, Approver only)
 *
 * - cat: 1 (officer) | 2 (civilian)
 * - deptPrefix: "U" by default
 * - personnelType: "A" by default
 */
const IncomingQueries = ({ cat = 1, deptPrefix = "U", personnelType = "A" }) => {
  // default tab is Creator (no "incoming" tab anymore)
  const [activeTab, setActiveTab] = useState("creator");

  // maps tab -> role digit (1=creator,2=approver,3=verifier)
  const roleDigitForTab = {
    creator: "1",
    approver: "2",
    verifier: "3",
  };

  // Build pendingWith for the selected tab
  const pendingWith = `${deptPrefix}${roleDigitForTab[activeTab]}${personnelType}`;

  const { data, loading, loadingMore, error, hasMore, fetchNextPage, refresh } =
    usePendingQueries(cat, pendingWith);

  const tabTitle = `Pending at ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`;

  // Map API items shape -> QueriesTable rows
  const tableData = useMemo(() => {
    const items = Array.isArray(data) ? data : [];
    return items.map((it, idx) => ({
      id: it.doc_id || `${it.sno}-${idx}`,
      serviceNo: it.sno,
      unit: it.unitcd,
      subject: it.subject,
      submitDate: it.submit_date,
      actionDate: it.action_dt,
      pendingWith: it.pending_with,
      cell: it.cell,
      raw: it,
    }));
  }, [data]);

  // Load all remaining pages (loops calling fetchNextPage until hasMore becomes false)
  const handleLoadAll = async () => {
    try {
      let more = true;
      while (more) {
        const result = await fetchNextPage();
        more = Boolean(result);
        if (!more) break;
      }
    } catch (err) {
      // error surfaced via hook.error; optionally show a toast here
    }
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

        <button onClick={refresh} style={{ marginLeft: 8 }}>
          Refresh
        </button>

        <div style={{ marginLeft: 8 }}>
          {loading && <small>Loading first page…</small>}
          {loadingMore && <small>Loading more…</small>}
          {!loading && !loadingMore && <small>Loaded: {Array.isArray(data) ? data.length : 0}</small>}
        </div>

        {error && <small style={{ marginLeft: 8, color: "crimson" }}>Error: {error}</small>}
      </div>

      <QueriesTable title={tabTitle} data={tableData} loading={loading} />

      {/* Pagination controls */}
      <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
        <div />
        {hasMore ? (
          <>
            <button onClick={fetchNextPage} disabled={loadingMore} className="show-more-btn">
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
          <small style={{ color: "#444" }}>
            {(Array.isArray(data) ? data.length : 0)} items loaded — no more pages.
          </small>
        )}
      </div>
    </>
  );
};

export default IncomingQueries;
