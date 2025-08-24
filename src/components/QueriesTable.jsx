// src/components/QueriesTable.jsx
import React, { useState } from "react";
import DataTable from "react-data-table-component";
import jsPDF from "jspdf";

const QueriesTable = ({ title, data }) => {
  const [search, setSearch] = useState("");

  const columns = [
    { name: "S.No", selector: (row, index) => index + 1, width: "80px" },
    { name: "Service No (Pers)", selector: (row) => row.serviceNo, sortable: true },
    { name: "Query Type", selector: (row) => row.type, sortable: true },
    { name: "Query ID", selector: (row) => row.queryId, sortable: true },
    { name: "Query Received (AFCAAD Date)", selector: (row) => row.date, sortable: true },
    {
      name: "Action",
      cell: () => <button className="action-btn">View</button>,
      ignoreRowClick: true,
      allowOverflow: true,
      button: true
    }
  ];

  const filteredData = data.filter(
    (item) =>
      item.serviceNo.toLowerCase().includes(search.toLowerCase()) ||
      item.queryId.toLowerCase().includes(search.toLowerCase()) ||
      item.type.toLowerCase().includes(search.toLowerCase())
  );

  // Export Functions
  const CopyAction = () => {
    const text = filteredData
      .map((row, i) => `${i + 1}\t${row.serviceNo}\t${row.type}\t${row.queryId}\t${row.date}`)
      .join("\n");
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const CSVAction = () => {
    const header = ["S.No", "Service No", "Query Type", "Query ID", "Date"];
    const rows = filteredData.map((row, i) => [i + 1, row.serviceNo, row.type, row.queryId, row.date]);
    let csv = [header, ...rows].map((e) => e.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title}.csv`;
    link.click();
  };

  const PDFAction = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.text(`${title} Report`, 20, 20);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated at: ${new Date().toLocaleString()}`, 20, 40);
    doc.save(`${title}.pdf`);
  };

  const PrintAction = () => {
    const content = filteredData
      .map((row, i) => `${i + 1} | ${row.serviceNo} | ${row.type} | ${row.queryId} | ${row.date}`)
      .join("\n");
    const printWindow = window.open("", "", "width=800,height=600");
    printWindow.document.write("<pre>" + content + "</pre>");
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="view-queries-page">
      <h2>{title}</h2>

      <div className="export-buttons">
        <button onClick={CopyAction}>Copy</button>
        <button onClick={CSVAction}>CSV</button>
        <button onClick={PrintAction}>Print</button>
        <button onClick={PDFAction}>PDF</button>
      </div>

      <input
        type="text"
        placeholder="Search..."
        className="search-bar"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <DataTable
        columns={columns}
        data={filteredData}
        pagination
        highlightOnHover
        striped
        responsive
      />
    </div>
  );
};

export default QueriesTable;
