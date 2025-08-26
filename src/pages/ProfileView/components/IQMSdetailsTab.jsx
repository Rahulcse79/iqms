import React from "react";
import { useNavigate } from "react-router-dom";

const IQMSdetailsTab = () => {
  const navigate = useNavigate();

  const tableData = [
    {
      slNo: 1,
      queryId: "106847736",
      queryType: "Pay & Allowances",
      querySubmitDate: "10-JUL-25",
      status: "Cell Clerk - APV",
    },
    {
      slNo: 2,
      queryId: "106757686",
      queryType: "Pay & Allowances",
      querySubmitDate: "11-AUG-25",
      status: "Query Replied",
    },
  ];

  const handleViewClick = () => {
    navigate("/view/query/Q001");
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: "10px",
        }}
      >
        <thead>
          <tr style={{ backgroundColor: "#f5f5f5" }}>
            <th style={thStyle}>Sl No</th>
            <th style={thStyle}>Query ID</th>
            <th style={thStyle}>Query Type</th>
            <th style={thStyle}>Query Submit Date</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>View</th>
          </tr>
        </thead>
        <tbody>
          {tableData.map((row, index) => (
            <tr key={index} style={{ textAlign: "center" }}>
              <td style={tdStyle}>{row.slNo}</td>
              <td style={tdStyle}>{row.queryId}</td>
              <td style={tdStyle}>{row.queryType}</td>
              <td style={tdStyle}>{row.querySubmitDate}</td>
              <td style={tdStyle}>{row.status}</td>
              <td style={tdStyle}>
                <button
                  style={viewButtonStyle}
                  onClick={handleViewClick}
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ marginTop: "10px" }}>
        Showing 1 to {tableData.length} of {tableData.length} entries
      </p>
    </div>
  );
};

const thStyle = {
  border: "1px solid #ddd",
  padding: "8px",
  fontWeight: "bold",
};

const tdStyle = {
  border: "1px solid #ddd",
  padding: "8px",
};

const viewButtonStyle = {
  padding: "5px 10px",
  backgroundColor: "#3f51b5",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
};

export default IQMSdetailsTab;
