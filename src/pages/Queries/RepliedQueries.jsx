import React from "react";
import QueriesTable from "../../components/QueriesTable";

const RepliedQueries = () => {
  const data = [
    { id: 1, serviceNo: "33333", type: "Replied", queryId: "Q020", date: "2025-08-23" }
  ];

  return <QueriesTable title="Replied Queries" data={data} />;
};

export default RepliedQueries;
