import React, { useState } from "react";
import QueriesTable from "../../components/QueriesTable";
import "./IncomingQueries.css";

const IncomingQueries = () => {
  const [activeTab, setActiveTab] = useState("incoming");

  const data = [
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

      <QueriesTable title="Incoming Queries" data={data} />
    </>
  );
};

export default IncomingQueries;
