import React from "react";
import QueriesTable from "../../components/QueriesTable";

const TransferredQueries = () => {
  const data = [
    { id: 1, serviceNo: "22222", type: "Transferred", queryId: "Q010", date: "2025-08-22" }
  ];

  return <QueriesTable title="Transferred Queries" data={data} />;
};

export default TransferredQueries;
