import React from 'react';
import { Link } from 'react-router-dom';

// --- CSS Styles ---
const styles = `
  .dashboard-section {
    padding: 2rem;
    background-color: #f4f6f9; /* A slightly cooler light gray background */
    font-family: sans-serif;
  }

  .dashboard-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 1.5rem;
  }

  .query-card {
    background-color: #ffffff;
    border-radius: 0.75rem; /* Slightly more rounded corners */
    padding: 1.5rem;
    color: #313131ff;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    border: 1px solid #e5e7eb;
    /* Add a top border that will be colored */
    border-top: 4px solid transparent;
    transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  }

  .query-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
  }

  /* Color variants for each card */
  .query-card.pending { border-top-color: #f6673bff; } /* Blue */
  .query-card.transferred { border-top-color: #6366f1; } /* Indigo */
  .query-card.replied { border-top-color: #22c55e; } /* Green */

  .card-header {
    font-size: 1.125rem;
    font-weight: 600;
    margin-bottom: 1.5rem; /* More space */
  }

  /* Match header text color to the border color */
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
    color: #4b5563; /* Darker gray for better contrast */
  }

  .card-value-link {
    font-weight: 700;
    text-decoration: none;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    transition: background-color 0.2s ease-in-out;
    display: inline-block;
  }

  /* Badge color variants */
  .pending .card-value-link { background-color: #fedbdbff; color: #af1e1eff; }
  .transferred .card-value-link { background-color: #e0e7ff; color: #3730a3; }
  .replied .card-value-link { background-color: #dcfce7; color: #166534; }

  .pending .card-value-link:hover { background-color: #febfbfff; }
  .transferred .card-value-link:hover { background-color: #c7d2fe; }
  .replied .card-value-link:hover { background-color: #bbf7d0; }
`;

// --- Data ---
const pendingQueriesData = [
  { label: 'Pending at Creator', value: 69 },
  { label: 'Pending at Verifier', value: 7 },
  { label: 'Pending at Approver', value: 22 },
  { label: 'Total Pending', value: 98 },
];

const transferredQueriesData = [
  { label: 'Creator', value: 5 },
  { label: 'Verifier', value: 1 },
  { label: 'Approver', value: 0 },
  { label: 'Total Transferred', value: 6 },
];

const repliedQueriesData = [
  { label: 'Replied Queries', value: 16558 },
{ label: '-' },
{ label: '-' },
{ label: '-' },
  

];

// --- Card Component ---
const QueryCard = ({ title, data, className }) => (
  <div className={`query-card ${className}`}>
    <h3 className="card-header">{title}</h3>
    <div className="card-body">
      {data.map((item, index) => (
        <div className="card-row" key={index}>
          <span className="card-label">{item.label}</span>
          <Link to="/view/queries/incoming" className="card-value-link">
            {item.value}
          </Link>
        </div>
      ))}
    </div>
  </div>
);

// --- Main Dashboard Component ---
const Dashboard = () => {
  return (
    <>
      <style>{styles}</style>
      <div className="dashboard-section">
        <div className="dashboard-grid">
          <QueryCard title="Pending Queries" data={pendingQueriesData} className="pending" />
          <QueryCard title="Transferred Queries from Other Sections" data={transferredQueriesData} className="transferred" />
          <QueryCard title="Replied Queries" data={repliedQueriesData} className="replied" />
        </div>
      </div>
    </>
  );
};

export default Dashboard;