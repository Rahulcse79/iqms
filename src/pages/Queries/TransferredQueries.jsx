import React, {useState} from "react";
import QueriesTable from "../../components/QueriesTable";

const TransferredQueries = () => {
    const [activeTab, setActiveTab] = useState("transferred");
  

  const data = [
    { id: 1, serviceNo: "22222", type: "Transferred", queryId: "Q010", date: "2025-08-22" }
  ];

  return( 
    <>
          <div className="tab-buttons">
        <button
          className={activeTab === "transferred" ? "active" : ""}
          onClick={() => setActiveTab("transferred")}
        >
          Transfered Queries
        </button>

        <button
          className={activeTab === "creator" ? "active" : ""}
          onClick={() => setActiveTab("creator")}
        >
          Creator
        </button>

        <button
          className={activeTab === "verifier" ? "active" : ""}
          onClick={() => setActiveTab("verifier")}
        >
          Verifier
        </button>

        <button
          className={activeTab === "approver" ? "active" : ""}
          onClick={() => setActiveTab("approver")}
        >
          Approver
        </button>
      </div>
      <QueriesTable title="Transferred Queries" data={data} />
    </>
)};

export default TransferredQueries;
