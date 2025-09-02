import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchRepliedQueries } from "../actions/allAction";
import Loader from "../components/Loader";

// --- CSS Styles ---
const styles = `
  .dashboard-section {
    padding: 2rem;
    background-color: #f4f6f9;
    font-family: sans-serif;
  }

  .dashboard-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 1.5rem;
  }

  .query-card {
    background-color: #ffffff;
    border-radius: 0.75rem;
    padding: 1.5rem;
    color: #313131ff;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    border: 1px solid #e5e7eb;
    border-top: 4px solid transparent;
    transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  }

  .query-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
  }

  .query-card.pending { border-top-color: #f63b3bff; }
  .query-card.transferred { border-top-color: #6366f1; }
  .query-card.replied { border-top-color: #22c55e; }

  .card-header {
    font-size: 1.125rem;
    font-weight: 600;
    margin-bottom: 1.5rem;
  }

  .pending .card-header { color: #f63b3bff; }
  .transferred .card-header { color: #6366f1; }
  .replied .card-header { color: #22c55e; }

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
    color: #4b5563;
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

  .pending .card-value-link { background-color: #fedbdbff; color: #af1e1eff; }
  .transferred .card-value-link { background-color: #e0e7ff; color: #3730a3; }
  .replied .card-value-link { background-color: #dcfce7; color: #166534; }

  .pending .card-value-link:hover { background-color: #febfbfff; }
  .transferred .card-value-link:hover { background-color: #c7d2fe; }
  .replied .card-value-link:hover { background-color: #bbf7d0; }
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
            {item.value !== "-" ? (
              <span className="card-value-link" onClick={() => navigate(link)}>
                {item.value}
              </span>
            ) : (
              <span>-</span>
            )}
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
