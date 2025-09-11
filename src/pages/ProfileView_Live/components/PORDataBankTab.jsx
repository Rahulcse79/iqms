import React from 'react';

export default function PORDataTable() {
  const tableData = [
    {
      date: '2025-02-19 08:05',
      id: '12345',
      code: 'C001',
      service: 'SRT',
      remarks: 'Checked Email Letters',
      status: 'DUE'
    },
    {
      date: '2025-02-18 11:12',
      id: '12346',
      code: 'C002',
      service: 'SRT',
      remarks: 'Follow up for pending case',
      status: 'DUE'
    }
  ];

  return (
    <div style={{ padding: '20px' }}>
      <table border="1" cellPadding="8" cellSpacing="0" style={{ width: '100%', textAlign: 'left' }}>
        <thead style={{ backgroundColor: '#f2f2f2' }}>
          <tr>
            <th>Date</th>
            <th>ID</th>
            <th>Code</th>
            <th>Service</th>
            <th>Remarks</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {tableData.map((row, index) => (
            <tr key={index}>
              <td>{row.date}</td>
              <td>{row.id}</td>
              <td>{row.code}</td>
              <td>{row.service}</td>
              <td>{row.remarks}</td>
              <td>{row.status}</td>
              <td>
                <button style={{ padding: '5px 10px' }}>View Details</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
