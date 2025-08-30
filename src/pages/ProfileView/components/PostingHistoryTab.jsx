import React from 'react';
import './PostingHistoryTab.css';

const formatDate = (iso) => {
  if (!iso) return '-';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '-';
  }
};

const devLog = (...args) => {
  if (process.env.NODE_ENV !== 'production') {
    console.debug('[PostingHistoryTab]', ...args);
  }
};

export default function PostingHistoryTab({ items = [], loading, error }) {
  if (loading) return <p>Loading posting history...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;
  if (!items.length) return <p>No posting history available.</p>;

  const cleanedRows = items.map((row, index) => {
    devLog('Raw Posting Data:', row);

    return {
      sNo: index + 1,
      unit: row.abc ?? row.unit ?? '-',
      fromDate: formatDate(row.wef),
      rate: row.rate ?? '-',
      occId: row.occ_id ?? '-',
      irla: row.irla ?? '-',
      remarks: row.remarks ?? '-',
    };
  });

  return (
    <div className="posting-history">
      <table className="posting-table">
        <thead>
          <tr>
            <th>S No</th>
            <th>Unit</th>
            <th>From Date</th>
            <th>Rate</th>
            <th>Occ ID</th>
            <th>IRLA</th>
            <th>Remarks</th>
          </tr>
        </thead>
        <tbody>
          {cleanedRows.map((row) => (
            <tr key={row.sNo}>
              <td>{row.sNo}</td>
              <td>{row.unit}</td>
              <td>{row.fromDate}</td>
              <td>{row.rate}</td>
              <td>{row.occId}</td>
              <td>{row.irla}</td>
              <td>{row.remarks}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
