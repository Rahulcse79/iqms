import React from 'react';

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
    console.debug('[RankHistoryTab]', ...args);
  }
};

export default function RankHistoryTab({ items = [], loading, error }) {
  if (loading) return <p>Loading rank history...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;
  if (!items.length) return <p>No rank history available.</p>;

  const cleanedRows = items.map((row, index) => {
    devLog('Raw Rank Data:', row);
    return {
      sNo: index + 1,
      rank: row.rank_name || '-', // API key
      rankDate: formatDate(row.wef), // API key
      remarks: row.irla_action || '-', // API key
    };
  });

  return (
    <div style={{ padding: '20px' }}>
      <table
        border="1"
        cellPadding="10"
        cellSpacing="0"
        style={{ borderCollapse: 'collapse', width: '100%' }}
      >
        <thead>
          <tr style={{ backgroundColor: '#f0f0f0' }}>
            <th>S No</th>
            <th>Rank</th>
            <th>Rank Date</th>
            <th>Remarks</th>
          </tr>
        </thead>
        <tbody>
          {cleanedRows.map((item) => (
            <tr key={item.sNo}>
              <td>{item.sNo}</td>
              <td>{item.rank}</td>
              <td>{item.rankDate}</td>
              <td>{item.remarks}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
