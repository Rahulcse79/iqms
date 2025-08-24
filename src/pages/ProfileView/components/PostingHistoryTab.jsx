import React from 'react';
import './PostingHistoryTab.css';

export default function PostingHistoryTab() {
  const postingData = [
    {
      sNo: 1,
      unit: 'Unit A',
      location: 'Location A',
      fromDate: '01-Jan-2020',
      toDate: '15-Mar-2021',
      docNo: 'DOC12345',
      docDate: '02-Jan-2020',
      authority: 'HQ',
    },
    {
      sNo: 2,
      unit: 'Unit B',
      location: 'Location B',
      fromDate: '16-Mar-2021',
      toDate: 'Present',
      docNo: 'DOC67890',
      docDate: '17-Mar-2021',
      authority: 'CO',
    }
  ];

  return (
    <div className="posting-history">
      <table className="posting-table">
        <thead>
          <tr>
            <th>S No</th>
            <th>Unit</th>
            <th>Location</th>
            <th>From Date</th>
            <th>To Date</th>
            <th>Document No</th>
            <th>Document Date</th>
            <th>Authority</th>
          </tr>
        </thead>
        <tbody>
          {postingData.map((row) => (
            <tr key={row.sNo}>
              <td>{row.sNo}</td>
              <td>{row.unit}</td>
              <td>{row.location}</td>
              <td>{row.fromDate}</td>
              <td>{row.toDate}</td>
              <td>{row.docNo}</td>
              <td>{row.docDate}</td>
              <td>{row.authority}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
