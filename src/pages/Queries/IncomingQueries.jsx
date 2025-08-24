import React from "react";
import QueriesTable from "../../components/QueriesTable";

const IncomingQueries = () => {
  const data = [
    { id: 1, serviceNo: "12345", type: "Individual (CQC)", queryId: "Q001", date: "2025-08-20" },
    { id: 2, serviceNo: "67890", type: "Individual (CQC)", queryId: "Q003", date: "2025-08-21" }
  ];

  return <QueriesTable title="Incoming Queries" data={data} />;
};

export default IncomingQueries;
