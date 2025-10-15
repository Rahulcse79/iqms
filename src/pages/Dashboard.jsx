// src/pages/Dashboard/Dashboard.jsx - FINAL WORKING VERSION

import React, { useEffect, useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Loader from "../components/Loader";
import { getAllPendingCountsForRole } from "../actions/pendingQueryActionNew";
import { getAllTransferredCountsForRole } from "../actions/transferredQueryActionNew";
import { getDesignationFlags } from "../utils/helpers";
import { getAgentStatus } from "../utils/endpoints";
// --- CSS Styles (can remain the same) ---
const styles = `
    .dashboard-section { padding: 2rem; background-color: var(--bg); font-family: var(--font-family, sans-serif); color: var(--text); }
    .dashboard-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem; }
    .query-card { background-color: var(--surface); border-radius: 0.75rem; padding: 1.5rem; color: var(--text); box-shadow: var(--shadow); border: 1px solid var(--border); border-top: 4px solid transparent; transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out; cursor: pointer; }
    .query-card:hover { transform: translateY(-4px); box-shadow: var(--shadow); }
    .query-card.pending { border-top-color: var(--red); }
    .query-card.transferred { border-top-color: var(--blue); }
    .query-card.replied { border-top-color: var(--green); }
    .card-header { font-size: 1.125rem; font-weight: 600; margin-bottom: 1.5rem; }
    .pending .card-header { color: var(--red); }
    .transferred .card-header { color: var(--blue); }
    .replied .card-header { color: var(--green); }
    .card-body { display: flex; flex-direction: column; gap: 1rem; }
    .card-row { display: flex; justify-content: space-between; align-items: center; font-size: 0.95rem; flex-wrap: wrap; gap: 6px; }
    .card-label { color: var(--muted); }
    .card-value-link { font-weight: 700; text-decoration: none; padding: 0.25rem 0.75rem; border-radius: 9999px; transition: background-color 0.2s ease-in-out; display: inline-block; color: inherit; }
    .pending .card-value-link { background-color: var(--red-bg); color: var(--red-text); }
    .transferred .card-value-link { background-color: var(--blue-bg); color: var(--blue-text); }
    .replied .card-value-link { background-color: var(--green-bg); color: var(--green-text); }
    .pending .card-value-link:hover { background-color: var(--red-hover); }
    .transferred .card-value-link:hover { background-color: var(--blue-hover); }
    .replied .card-value-link:hover { background-color: var(--green-hover); }
    @media (max-width: 1024px) { .dashboard-section { padding: 1.5rem; } .dashboard-grid { gap: 1.25rem; } }
    @media (max-width: 768px) { .dashboard-section { padding: 1rem; } .dashboard-grid { grid-template-columns: 1fr; } .query-card { padding: 1.25rem; } .card-header { font-size: 1rem; } }
    @media (max-width: 480px) { .dashboard-section { padding: 0.75rem; } .query-card { padding: 1rem; } .card-header { font-size: 0.95rem; } .card-row { flex-direction: column; align-items: flex-start; gap: 4px; } .card-value-link { font-size: 0.85rem; padding: 0.2rem 0.6rem; } }
`;

// Helper to safely parse JSON from localStorage
const parseJSON = (key) => {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : null;
  } catch {
    return null;
  }
};

// QueryCard component can remain the same
const QueryCard = React.memo(({ title, data, className, link }) => {
  const navigate = useNavigate();
  return (
    <div className={`query-card ${className}`} onClick={() => navigate(link)}>
      <h3 className="card-header">{title}</h3>
      <div className="card-body">
        {data.map((item, index) => (
          <div className="card-row" key={`${title}-${item.label}-${index}`}>
            <span className="card-label">{item.label}</span>
            <span className="card-value-link">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

const Dashboard = () => {
  const [counts, setCounts] = useState({
    pending: { creator: 0, verifier: 0, approver: 0, total: 0 },
    transferred: { creator: 0, verifier: 0, approver: 0, total: 0 },
    replied: 0,
  });
  const [loading, setLoading] = useState(true);
  const { error: repliedError } = useSelector((state) => state.replied_queries);

  // Single effect for all updates using polling
  useEffect(() => {
    const updateAllCounts = async () => {
      try {
        const activeRole = parseJSON("activeRole_v1");
        if (!activeRole) {
          console.log("Dashboard: No active role found in localStorage.");
          setCounts({
            pending: { creator: 0, verifier: 0, approver: 0, total: 0 },
            transferred: { creator: 0, verifier: 0, approver: 0, total: 0 },
            replied: 0,
          });
          return;
        }

        // 1. Get Pending Counts
        const pendingCounts = getAllPendingCountsForRole(activeRole);

        // 2. Get Transferred Counts (which requires async designation flags)
        let transferredCounts = {
          creator: 0,
          verifier: 0,
          approver: 0,
          total: 0,
        };
        try {
          let designationFlags;
          const storedFlags = localStorage.getItem(
            "activeRoleDesignationFlags"
          );

          if (storedFlags) {
            designationFlags = JSON.parse(storedFlags);
          } else {
            designationFlags = await getDesignationFlags(activeRole);
          }

          transferredCounts = getAllTransferredCountsForRole(
            activeRole,
            designationFlags
          );
        } catch (error) {
          console.warn("Dashboard: Could not get transferred counts.", error);
        }

        // 3. Get Replied Count
        const repliedData = parseJSON("repliedQueries_v2_new");
        const repliedCount = repliedData?.[activeRole.SUB_SECTION]?.length || 0;

        // 4. Update state once with all new counts
        setCounts({
          pending: pendingCounts,
          transferred: transferredCounts,
          replied: repliedCount,
        });
      } catch (error) {
        console.error("Dashboard: Error updating counts.", error);
      } finally {
        if (loading) setLoading(false); // Turn off initial loader
      }
    };

    // Run once immediately
    updateAllCounts();

    // Then poll every 2 seconds for any changes
    const interval = setInterval(updateAllCounts, 2000);

    // Cleanup on component unmount
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    getAgentStatus();
  });

  const pendingQueriesData = useMemo(
    () => [
      { label: "Pending at Creator", value: counts.pending.creator },
      { label: "Pending at Verifier", value: counts.pending.verifier },
      { label: "Pending at Approver", value: counts.pending.approver },
      { label: "Total Pending", value: counts.pending.total },
    ],
    [counts.pending]
  );

  const transferredQueriesData = useMemo(
    () => [
      { label: "Creator", value: counts.transferred.creator },
      { label: "Verifier", value: counts.transferred.verifier },
      { label: "Approver", value: counts.transferred.approver },
      { label: "Total Transferred", value: counts.transferred.total },
    ],
    [counts.transferred]
  );

  const repliedQueriesData = useMemo(
    () => [
      {
        label: "Replied Queries",
        value: repliedError ? "ERR" : counts.replied,
      },
    ],
    [repliedError, counts.replied]
  );

  if (loading) {
    return <Loader text="Loading Dashboard..." />;
  }

  return (
    <>
      <style>{styles}</style>
      <div className="dashboard-section">
        <div className="dashboard-grid">
          <QueryCard
            title="Pending Queries"
            data={pendingQueriesData}
            className="pending"
            link="/view/queries/incoming"
          />
          <QueryCard
            title="Transferred Queries from Other Sections"
            data={transferredQueriesData}
            className="transferred"
            link="/view/queries/transferred"
          />
          <QueryCard
            title="Replied Queries"
            data={repliedQueriesData}
            className="replied"
            link="/view/queries/replied"
          />
        </div>
      </div>
    </>
  );
};

export default Dashboard;
