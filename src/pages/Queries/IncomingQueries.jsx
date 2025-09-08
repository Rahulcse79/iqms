// src/pages/IncomingQueries/IncomingQueries.jsx
import React, { useMemo, useState } from "react";
import QueriesTable from "../../components/QueriesTable";
import "./IncomingQueries.css";
import usePendingQueries from "../../hooks/usePendingQueries";

/**
 * IncomingQueries component
 *
 * - cat: 1 (officer) | 2 (civilian)
 * - deptPrefix: "U" by default
 * - personnelType: "A" by default
 */
const IncomingQueries = ({ cat = 1, deptPrefix = "U", personnelType = "A" }) => {
  const [activeTab, setActiveTab] = useState("incoming");

  // maps tab -> role digit (1=creator,2=approver,3=verifier)
  const roleDigitForTab = {
    creator: "1",
    approver: "2",
    verifier: "3",
  };

  const pendingWith =
    activeTab === "incoming"
      ? null
      : `${deptPrefix}${roleDigitForTab[activeTab]}${personnelType}`;

  const { data, loading, loadingMore, error, hasMore, offset, fetchNextPage, refresh } =
    usePendingQueries(cat, pendingWith);

  const sampleIncoming = [
    {
      id: 1,
      serviceNo: "12345",
      type: "Individual (CQC)",
      queryId: "Q001",
      date: "2025-08-20",
    },
    {
      id: 2,
      serviceNo: "67890",
      type: "Individual (CQC)",
      queryId: "Q003",
      date: "2025-08-21",
    },
  ];

  const tabTitle =
    activeTab === "incoming"
      ? "Incoming Queries"
      : `Pending at ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`;

  const tableData = useMemo(() => {
    if (activeTab === "incoming") return sampleIncoming;
    // API items shape: map fields for QueriesTable
    return data.map((it, idx) => ({
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
  }, [activeTab, data]);

  // Load all remaining pages (loops calling fetchNextPage until hasMore becomes false).
  // Note: this may be long depending on server. Errors are surfaced via hook.error
  const handleLoadAll = async () => {
    try {
      // call fetchNextPage repeatedly until it reports no more pages
      // fetchNextPage returns a boolean (hasMore after the fetch)
      let more = true;
      // if there is already no more, nothing to do
      while (more) {
        const result = await fetchNextPage();
        // fetchNextPage resolves to boolean hasMore (false if none left or on error)
        more = Boolean(result);
        if (!more) break;
        // loop continues
      }
    } catch (err) {
      // hook already sets error; keep silent here
      // but you could show a toast if desired
    }
  };

  return (
    <>
      <div className="tab-buttons">
        <button
          className={activeTab === "incoming" ? "active" : ""}
          onClick={() => setActiveTab("incoming")}
        >
          Incoming Queries
        </button>

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

        {activeTab !== "incoming" && (
          <>
            <button onClick={refresh} style={{ marginLeft: 8 }}>
              Refresh
            </button>

            <div style={{ marginLeft: 8 }}>
              {loading && <small>Loading first page…</small>}
              {loadingMore && <small>Loading more…</small>}
              {!loading && !loadingMore && <small>Loaded: {data.length}</small>}
            </div>

            {error && <small style={{ marginLeft: 8, color: "crimson" }}>Error: {error}</small>}
          </>
        )}
      </div>

      <QueriesTable title={tabTitle} data={tableData} loading={loading} />

      {/* Pagination controls for pending tabs */}
      {activeTab !== "incoming" && (
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
                {data.length} items loaded — more available.
              </small>
            </>
          ) : (
            <small style={{ color: "#444" }}>{data.length} items loaded — no more pages.</small>
          )}
        </div>
      )}
    </>
  );
};

export default IncomingQueries;
