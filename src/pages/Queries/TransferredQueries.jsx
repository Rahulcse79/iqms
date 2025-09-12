import React, { useMemo, useState } from "react";
import QueriesTable from "../../components/QueriesTable";
import useTransferredQueries from "../../hooks/useTransferredQueries";

/**
 * TransferredQueries
 *
 * - Uses useTransferredQueries hook (offset-based pagination).
 * - Maps API fields to the QueriesTable shape.
 */

const roleDigitForTab = {
  creator: "1",
  approver: "2",
  verifier: "3",
};

const formatIso = (iso) => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
};

const TransferredQueries = ({
  cat = 1,
  deptPrefix = "U",
  personnelType = "A",
}) => {
  const [activeTab, setActiveTab] = useState("creator");

  const pendingWith = `${deptPrefix}${roleDigitForTab[activeTab]}${personnelType}`;

  const {
    data,
    loading,
    loadingMore,
    error,
    hasMore,
    fetchNextPage,
    refresh,
    loadAll,
  } = useTransferredQueries(cat, pendingWith);

  const tabTitle = `Transferred Queries — ${
    activeTab.charAt(0).toUpperCase() + activeTab.slice(1)
  }`;

  const tableData = useMemo(() => {
    const items = Array.isArray(data) ? data : [];
    return items.map((it, idx) => ({
      id: it.doc_id ?? `${it.sno ?? "no-sno"}-${idx}`,
      serviceNo: it.sno ?? it.pers ?? "",
      type:
        (it.querytype && String(it.querytype).replace(/_/g, " ")) ||
        it.doc_type ||
        it.subject ||
        "",
      queryId: it.doc_id
        ? String(it.doc_id)
        : it.imprno
        ? String(it.imprno)
        : `${it.sno}-${idx}`,
      date: formatIso(it.submit_date ?? it.last_action_dt ?? it.action_dt),
      cat: it?.cat !== undefined && it?.cat !== null ? it.cat : null,
      raw: it,
    }));
  }, [data]);

  // Wrap handlers like IncomingQueries
  const handleLoadAll = async () => {
    try {
      await loadAll({ maxIterations: 2000 });
    } catch (e) {
      console.error("loadAll failed", e);
    }
  };

  const handleRefresh = async () => {
    try {
      await refresh();
    } catch (e) {
      console.error("refresh failed", e);
    }
  };

  const handleFetchNext = async () => {
    try {
      await fetchNextPage();
    } catch (e) {
      console.error("fetchNextPage failed", e);
    }
  };

  return (
    <>
      <div className="tab-buttons">
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

      <div
        style={{
          margin: "8px 0",
          display: "flex",
          gap: 8,
          alignItems: "center",
        }}
      >
        <h3 style={{ margin: 0 }}>{tabTitle}</h3>

        <button
          onClick={handleRefresh}
          style={{ marginLeft: 8 }}
          disabled={loading}
        >
          Refresh
        </button>

        <div style={{ marginLeft: 8 }}>
          {loading && <small>Loading first page…</small>}
          {loadingMore && <small>Loading more…</small>}
          {!loading && !loadingMore && (
            <small>Loaded: {Array.isArray(data) ? data.length : 0}</small>
          )}
        </div>

        {error && (
          <small style={{ marginLeft: 8, color: "crimson" }}>
            Error: {error}
          </small>
        )}
      </div>

      <QueriesTable title={tabTitle} data={tableData} loading={loading} />

      <div
        style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}
      >
        {hasMore ? (
          <>
            <button
              onClick={handleFetchNext}
              disabled={loadingMore}
              className="show-more-btn"
            >
              {loadingMore ? "Loading more…" : "Show more"}
            </button>

            <button
              onClick={handleLoadAll}
              disabled={loading || loadingMore}
              className="load-all-btn"
            >
              Load all
            </button>

            <small style={{ marginLeft: 8 }}>
              {Array.isArray(data) ? data.length : 0} items loaded — more
              available.
            </small>
          </>
        ) : (
          <small style={{ color: "#444" }}>
            {Array.isArray(data) ? data.length : 0} items loaded — no more
            pages.
          </small>
        )}
      </div>
    </>
  );
};

export default TransferredQueries;
