import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchRepliedQueries } from "../actions/repliedQueryAction";
import Loader from "../components/Loader";

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
    cursor: pointer;
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
