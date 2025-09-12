import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import QueriesTable from "../../components/QueriesTable";
import { fetchRepliedQueries } from "../../actions/allAction";
import Loader from "../../components/Loader";

const RepliedQueries = () => {
  const dispatch = useDispatch();
  const { loading, items, error } = useSelector(
    (state) => state.replied_queries
  );

  useEffect(() => {
    // Fetch only if data not present
    if (!items || items.length === 0) {
      dispatch(fetchRepliedQueries());
    }
  }, [dispatch, items]);

  if (loading) return <Loader text="Loading Replied Queries..." />;

  if (error) {
    return <p style={{ color: "red" }}>Error fetching queries: {error}</p>;
  }

  const safeItems = Array.isArray(items) ? items : [];
  const data = safeItems.map((q, index) => {
    return {
      id: index + 1,
      serviceNo: q?.sno ? String(q.sno) : "",
      type: "Replied",
      queryId: q?.doc_id ?? "",
      cat: q?.cat !== undefined && q?.cat !== null ? q.cat : null,
      date: q?.action_dt ? new Date(q.action_dt).toLocaleDateString() : "N/A",
      subject: q?.subject ?? "",
      pers: q?.pers ?? "",
      queryType: q?.querytype ?? "",
      pendingWith: q?.pending_with ?? "",
      cell: q?.cell ?? "",
      docStatus: q?.doc_status ?? "",
    };
  });

  return <QueriesTable title="Replied Queries" data={data} />;
};

export default RepliedQueries;
