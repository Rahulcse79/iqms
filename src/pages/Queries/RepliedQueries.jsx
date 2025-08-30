import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import QueriesTable from "../../components/QueriesTable";
import { fetchRepliedQueries } from "../../actions/allAction";

const RepliedQueries = () => {
  const dispatch = useDispatch();
  const { loading, items, error } = useSelector((state) => state.replied_queries);

  useEffect(() => {
    dispatch(fetchRepliedQueries());
  }, [dispatch]);

  if (loading) return <p>Loading replied queries...</p>;
  if (error) return <p style={{ color: "red" }}>Error: {error}</p>;

  // Transform items into table-friendly format
  const data = items.map((q, index) => ({
    id: index + 1,
    serviceNo: q?.sno ? String(q.sno) : "",  
    type: "Replied",
    queryId: q?.doc_id ?? "",
    date: q?.action_dt ?? "",
  }));

  return <QueriesTable title="Replied Queries" data={data} />;
};

export default RepliedQueries;
