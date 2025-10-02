import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Loader from "../components/Loader";
import { getAllPendingCountsForRole } from "../actions/pendingQueryActionNew";
import { useActiveRole } from "../hooks/useActiveRole";
import { debounce } from "../utils/helpers";

// --- CSS Styles ---
const styles = `
    .dashboard-section {
      padding: 2rem;
      background-color: var(--bg);
      font-family: var(--font-family, sans-serif);
      color: var(--text);
    }
    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 1.5rem;
    }
    .query-card {
      background-color: var(--surface);
      border-radius: 0.75rem;
      padding: 1.5rem;
      color: var(--text);
      box-shadow: var(--shadow);
      border: 1px solid var(--border);
      border-top: 4px solid transparent;
      transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
      cursor: pointer;
    }
    .query-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow);
    }
    /* Status border colors */
    .query-card.pending { border-top-color: var(--red); }
    .query-card.transferred { border-top-color: var(--blue); }
    .query-card.replied { border-top-color: var(--green); }
    .card-header {
      font-size: 1.125rem;
      font-weight: 600;
      margin-bottom: 1.5rem;
    }
    .pending .card-header { color: var(--red); }
    .transferred .card-header { color: var(--blue); }
    .replied .card-header { color: var(--green); }
    .card-body {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .card-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.95rem;
      flex-wrap: wrap;
      gap: 6px;
    }
    .card-label {
      color: var(--muted);
    }
    .card-value-link {
      font-weight: 700;
      text-decoration: none;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      transition: background-color 0.2s ease-in-out;
      display: inline-block;
      color: inherit;
    }
    .pending .card-value-link {
      background-color: var(--red-bg);
      color: var(--red-text);
    }
    .transferred .card-value-link {
      background-color: var(--blue-bg);
      color: var(--blue-text);
    }
    .replied .card-value-link {
      background-color: var(--green-bg);
      color: var(--green-text);
    }
    .pending .card-value-link:hover { background-color: var(--red-hover); }
    .transferred .card-value-link:hover { background-color: var(--blue-hover); }
    .replied .card-value-link:hover { background-color: var(--green-hover); }
    @media (max-width: 1024px) {
      .dashboard-section {
        padding: 1.5rem;
      }
      .dashboard-grid {
        gap: 1.25rem;
      }
    }
    @media (max-width: 768px) {
      .dashboard-section {
        padding: 1rem;
      }
      .dashboard-grid {
        grid-template-columns: 1fr;
      }
      .query-card {
        padding: 1.25rem;
      }
      .card-header {
        font-size: 1rem;
      }
    }
    @media (max-width: 480px) {
      .dashboard-section {
        padding: 0.75rem;
      }
      .query-card {
        padding: 1rem;
      }
      .card-header {
        font-size: 0.95rem;
      }
      .card-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
      }
      .card-value-link {
        font-size: 0.85rem;
        padding: 0.2rem 0.6rem;
      }
    }
`;

// Helper to parse JSON from localStorage safely
const parseJSON = (key) => {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : null;
  } catch {
    return null;
  }
};

// Get pending counts filtered by active role
const getPendingCountsFromStorage = (activeRole) => {
  if (!activeRole) return { creator: 0, verifier: 0, approver: 0, total: 0 };
  return getAllPendingCountsForRole(activeRole);
};

// Get transferred counts from localStorage
const getTransferredCounts = () => {
  const data = parseJSON("transferredQueries_v2_new");
  if (!data) return { creator: 0, verifier: 0, approver: 0, total: 0 };
  let creator = 0,
    verifier = 0,
    approver = 0;
  Object.keys(data).forEach((unit) => {
    const num = parseInt(unit.replace(/\D/g, ""), 10);
    const count = data[unit]?.length || 0;
    if (num === 1) creator += count;
    else if (num === 2) verifier += count;
    else if (num === 3) approver += count;
  });
  return { creator, verifier, approver, total: creator + verifier + approver };
};

// Get replied count filtered by active role subsection
const getRepliedCount = (activeRole) => {
  const data = parseJSON("repliedQueries_v2_new");
  if (!data || !activeRole) return 0;
  const subSection = activeRole.SUB_SECTION || "DEFAULT";
  const items = data[subSection] || [];
  return Array.isArray(items) ? items.length : 0;
};

// Query card component
const QueryCard = ({ title, data, className, link }) => {
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
};

// Main Dashboard component
const Dashboard = () => {
  const { activeRole } = useActiveRole();
  const { error: repliedError } = useSelector((state) => state.replied_queries);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({
    pending: { creator: 0, verifier: 0, approver: 0, total: 0 },
    transferred: { creator: 0, verifier: 0, approver: 0, total: 0 },
    replied: 0,
  });

  const updateAllCounts = useCallback(() => {
    if (!activeRole) {
      console.log("Dashboard: Waiting for active role...");
      setLoading(false);
      return;
    }
    console.log(
      "🔄 Updating dashboard counts for role:",
      activeRole?.PORTFOLIO_NAME
    );
    setLoading(true);
    setCounts({
      pending: getPendingCountsFromStorage(activeRole),
      transferred: getTransferredCounts(),
      replied: getRepliedCount(activeRole),
    });
  }, [activeRole]);

  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [counts, loading]);

  useEffect(() => {
    const debouncedUpdate = debounce(() => updateAllCounts(), 300);
    // Listen to storage updates
    const onStorageChange = () => debouncedUpdate();
    window.addEventListener("pendingQueriesUpdated", onStorageChange);
    window.addEventListener("storage", onStorageChange);

    return () => {
      window.removeEventListener("pendingQueriesUpdated", onStorageChange);
      window.removeEventListener("storage", onStorageChange);
    };
  }, [updateAllCounts]);

  useEffect(() => {
    if (activeRole) {
      updateAllCounts();
    }
  }, [activeRole, updateAllCounts]);

  useEffect(() => {
    const onActiveRoleChanged = (e) => {
      if (e.detail?.newRole) {
        console.log("Active role changed event received:", e.detail.newRole);
        updateAllCounts();
      }
    };

    window.addEventListener("activeRoleChanged", onActiveRoleChanged);

    return () => {
      window.removeEventListener("activeRoleChanged", onActiveRoleChanged);
    };
  }, [updateAllCounts]);

  useEffect(() => {
    // Initial update
    updateAllCounts();

    const handleDataChange = () => {
      console.log("📢 Data change detected, refreshing dashboard...");
      updateAllCounts();
    };

    window.addEventListener("pendingQueriesUpdated", handleDataChange);
    window.addEventListener("storage", handleDataChange);

    return () => {
      window.removeEventListener("pendingQueriesUpdated", handleDataChange);
      window.removeEventListener("storage", handleDataChange);
    };
  }, [updateAllCounts]);

  const pendingQueriesData = [
    { label: "Pending at Creator", value: counts.pending.creator },
    { label: "Pending at Verifier", value: counts.pending.verifier },
    { label: "Pending at Approver", value: counts.pending.approver },
    { label: "Total Pending", value: counts.pending.total },
  ];

  const transferredQueriesData = [
    { label: "Creator", value: counts.transferred.creator },
    { label: "Verifier", value: counts.transferred.verifier },
    { label: "Approver", value: counts.transferred.approver },
    { label: "Total Transferred", value: counts.transferred.total },
  ];

  const repliedQueriesData = [
    { label: "Replied Queries", value: repliedError ? "ERR" : counts.replied },
  ];

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
