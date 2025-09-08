

/* ==================================================
   File: src/pages/TransferredQueries/TransferredQueries.jsx
   Purpose: Component that uses the above hook and renders
            the table + pagination controls.
   ==================================================*/

import React, { useMemo, useState } from "react";
import QueriesTable from "../../components/QueriesTable";
import useTransferredQueries from "../../hooks/useTransferredQueries";

const roleDigitForTab = {
  creator: "1",
  approver: "2",
  verifier: "3",
};

const defaultDeptPrefix = "U";
const defaultPersonnelType = "A";

const formatDate = (iso) => {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch (e) {
    return iso;
  }
};

export default function TransferredQueries({ cat = 1, deptPrefix = defaultDeptPrefix, personnelType = defaultPersonnelType }) {
  const [activeTab, setActiveTab] = useState("creator");

  const pendingWith = `${deptPrefix}${roleDigitForTab[activeTab]}${personnelType}`;

  const { data, loading, loadingMore, error, hasMore, fetchNextPage, refresh, loadAll } = useTransferredQueries(cat, pendingWith);

  const tabTitle = `Transferred — ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`;

  const tableData = useMemo(() => {
    return data.map((it, idx) => ({
      id: it.doc_id ?? `${it.sno ?? "no-sno"}-${idx}`,
      serviceNo: it.sno,
      unit: it.unitcd,
      subject: it.subject,
      submitDate: it.submit_date ?? it.submitDate ?? formatDate(it.submit_date),
      actionDate: it.last_action_dt ?? it.last_action_dt ?? formatDate(it.last_action_dt),
      pendingWith: it.pending_with ?? it.pendingWith,
      cell: it.cell,
      raw: it,
    }));
  }, [data]);

  return (
    <>
      <div className="tab-buttons">
        <button className={activeTab === "creator" ? "active" : ""} onClick={() => setActiveTab("creator")}>Creator</button>
        <button className={activeTab === "verifier" ? "active" : ""} onClick={() => setActiveTab("verifier")}>Verifier</button>
        <button className={activeTab === "approver" ? "active" : ""} onClick={() => setActiveTab("approver")}>Approver</button>
      </div>

      <div style={{ margin: "8px 0", display: "flex", gap: 8, alignItems: "center" }}>
        <h3 style={{ margin: 0 }}>{tabTitle}</h3>

        <button onClick={refresh} style={{ marginLeft: 8 }} disabled={loading}>
          Refresh
        </button>

        <div style={{ marginLeft: 8 }}>
          {loading && <small>Loading first page…</small>}
          {loadingMore && <small>Loading more…</small>}
          {!loading && !loadingMore && <small>Loaded: {data.length}</small>}
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

            <button onClick={() => loadAll()} disabled={loading || loadingMore} className="load-all-btn">
              Load all
            </button>

            <small style={{ marginLeft: 8 }}>{data.length} items loaded — more available.</small>
          </>
        ) : (
          <small style={{ color: "#444" }}>{data.length} items loaded — no more pages.</small>
        )}
      </div>
    </>
  );
}
