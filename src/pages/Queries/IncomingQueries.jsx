// src/pages/IncomingQueries/IncomingQueries.jsx
import React, { useMemo, useState } from "react";
import QueriesTable from "../../components/QueriesTable";
import "./IncomingQueries.css";
import usePendingQueries from "../../hooks/usePendingQueries";

/**
 * IncomingQueries component
 *
 * Props (optional):
 *  - cat: 1 (officer) | 2 (civilian)  (default 1)
 *  - deptPrefix: department letter, e.g. "U" (default "U")
 *  - personnelType: "A" for Airmen or "C" for Civilian (default "A")
 *
 * NOTE: In your app, replace deptPrefix/personnelType with values from auth/session.
 */
const IncomingQueries = ({ cat = 1, deptPrefix = "U", personnelType = "A" }) => {
  const [activeTab, setActiveTab] = useState("incoming");

  // maps tab to role digit as you described: 1=creator, 2=approver, 3=verifier
  const roleDigitForTab = {
    creator: "1",
    approver: "2",
    verifier: "3",
  };

  // build pendingWith when a pending tab is selected
  const pendingWith =
    activeTab === "incoming"
      ? null
      : `${deptPrefix}${roleDigitForTab[activeTab]}${personnelType}`;

  // hook will fetch all pages until hasMore is false
  const { data, loading, error, refresh } = usePendingQueries(cat, pendingWith);

  // This is sample fallback content shown on Incoming Queries tab.
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

  // If you want to show a nice title for pending tabs:
  const tabTitle =
    activeTab === "incoming"
      ? "Incoming Queries"
      : `Pending at ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`;

  // Format remote items to shape your QueriesTable expects (optional)
  // If your QueriesTable already expects the API shape, remove this mapping.
  const tableData = useMemo(() => {
    if (activeTab === "incoming") return sampleIncoming;
    // map server items to table rows. adjust as per your QueriesTable props.
    return data.map((it, idx) => ({
      id: it.doc_id || `${it.sno}-${idx}`,
      serviceNo: it.sno,
      unit: it.unitcd,
      subject: it.subject,
      submitDate: it.submit_date,
      pendingWith: it.pending_with,
      cell: it.cell,
      raw: it, // keep original in case QueriesTable needs it
    }));
  }, [activeTab, data]);

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
            {loading && <small style={{ marginLeft: 8 }}>Loading…</small>}
            {error && <small style={{ marginLeft: 8, color: "crimson" }}>Error: {error}</small>}
          </>
        )}
      </div>

      <QueriesTable title={tabTitle} data={tableData} loading={loading} />
    </>
  );
};

export default IncomingQueries;
