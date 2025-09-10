import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchRepliedQueries } from "../actions/allAction";
import Loader from "../components/Loader";

// --- CSS Styles ---
const styles = `
  .dashboard-section {
    padding: 2rem;
    background-color: var(--primary-0); /* Soft cozy background */
    font-family: var(--font-sans);
  }

  .dashboard-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 1.5rem;
  }

  .query-card {
    background-color: var(--surface-3); /* Card white */
    border-radius: var(--radius-lg);
    padding: 1.5rem;
    color: var(--text-primary);
    box-shadow: var(--shadow-1);
    border: 1px solid var(--border);
    border-top: 4px solid transparent;
    transition: transform var(--transition-fast), box-shadow var(--transition-fast);
  }

  .query-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-2);
  }

  .query-card.pending { border-top-color: var(--danger-500); }
  .query-card.transferred { border-top-color: var(--primary-500); }
  .query-card.replied { border-top-color: var(--success-500); }

  .card-header {
    font-size: var(--fs-lg);
    font-weight: var(--fw-semibold);
    margin-bottom: 1.5rem;
  }

  .pending .card-header { color: var(--danger-500); }
  .transferred .card-header { color: var(--primary-500); }
  .replied .card-header { color: var(--success-500); }

  .card-body {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .card-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: var(--fs-sm);
  }

  .card-label {
    color: var(--text-muted);
  }

  .card-value-link {
    font-weight: var(--fw-bold);
    text-decoration: none;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    transition: background-color var(--transition-fast);
    display: inline-block;
    cursor: pointer;
  }

  .pending .card-value-link {
    background-color: var(--accent-100);
    color: var(--danger-500);
  }
  .transferred .card-value-link {
    background-color: var(--primary-100);
    color: var(--primary-600);
  }
  .replied .card-value-link {
    background-color: var(--secondary-100);
    color: var(--success-500);
  }

  .pending .card-value-link:hover {
    background-color: var(--accent-300);
  }
  .transferred .card-value-link:hover {
    background-color: var(--primary-300);
  }
  .replied .card-value-link:hover {
    background-color: var(--secondary-300);
  }
`;


// --- Card Component ---
const QueryCard = ({ title, data, className, link }) => {
  const navigate = useNavigate();

  return (
    <div className={`query-card ${className}`}>
      <h3 className="card-header">{title}</h3>
      <div className="card-body">
        {data.map((item, index) => (
          <div className="card-row" key={index}>
            <span className="card-label">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Main Dashboard Component ---
const Dashboard = () => {
  const dispatch = useDispatch();
  const { loading, items, error } = useSelector(
    (state) => state.replied_queries
  );

  useEffect(() => {
    // Only fetch if not already loaded
    if (!items || items.length === 0) {
      dispatch(fetchRepliedQueries());
    }
  }, [dispatch, items]);

  // --- Data ---
  const pendingQueriesData = [
    { label: "Pending at Creator", value: 69 },
    { label: "Pending at Verifier", value: 7 },
    { label: "Pending at Approver", value: 22 },
    { label: "Total Pending", value: 98 },
  ];

  const transferredQueriesData = [
    { label: "Creator", value: 5 },
    { label: "Verifier", value: 1 },
    { label: "Approver", value: 0 },
    { label: "Total Transferred", value: 6 },
  ];

  const repliedQueriesData = [
    {
      label: "Replied Queries",
      value: loading ? "..." : error ? "ERR" : items.length,
    },
    { label: "-", value: "-" },
    { label: "-", value: "-" },
    { label: "-", value: "-" },
  ];

  return (
    <>
      <style>{styles}</style>
      {loading && <Loader text="Fetching Replied Queries..." />}
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
