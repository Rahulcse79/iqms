// src/components/QueriesTable.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import DataTable from "react-data-table-component";
import jsPDF from "jspdf";
import "./QueriesTable.css";
import { getUserRoleLabel } from "../constants/Enum";

const QueriesTable = ({ title, data = [] }) => {
  // Put this near your component (or in a helpers file)
  const customStyles = {
    table: {
      style: {
        backgroundColor: "var(--surface)",
        borderRadius: "12px",
        overflow: "hidden",
      },
    },
    header: {
      style: {
        minHeight: "56px",
        paddingLeft: "16px",
        paddingRight: "8px",
      },
    },
    headRow: {
      style: {
        backgroundColor: "var(--surface-accent)",
        borderBottom: "1px solid var(--border)",
        minHeight: "48px",
      },
    },
    headCells: {
      style: {
        color: "var(--text)",
        fontSize: "14px",
        fontWeight: "600",
        paddingLeft: "12px",
        paddingRight: "12px",
      },
    },
    rows: {
      style: {
        backgroundColor: "var(--surface)",
        minHeight: "52px", // overrides row height
      },
    },
    cells: {
      style: {
        paddingLeft: "12px",
        paddingRight: "12px",
        color: "var(--text)",
        fontSize: "14px",
      },
    },
    pagination: {
      style: {
        padding: "8px",
        color: "var(--text)",
        backgroundColor: "transparent",
      },
    },
  };

  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const handleView = (row) => {
    const category = getUserRoleLabel(row.cat);
    const queryParams = new URLSearchParams({
      category: category,
      type: "Service",
      q: row.serviceNo,
    });
    navigate(
      `/view/query/${encodeURIComponent(
        row.queryId
      )}?${queryParams.toString()}`,
      { state: { row } }
    );
  };

  const columns = [
    {
      name: "S.No",
      selector: (row, index) => index + 1,
      width: "80px",
      sortable: true,
    },
    {
      name: "Service No (Pers)",
      selector: (row) => row.serviceNo || "",
      sortable: true,
    },
    { name: "Query Type", selector: (row) => row.type || "", sortable: true },
    { name: "Query ID", selector: (row) => row.queryId || "", sortable: true },
    {
      name: "Query Received (AFCAAD Date)",
      selector: (row) => row.date || "",
      sortable: true,
    },
    {
      name: "Action",
      cell: (row) => (
        <div style={{ display: "flex", gap: 8 }}>
          <button className="action-btn" onClick={() => handleView(row)}>
            View
          </button>
        </div>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
    },
  ];

  const filteredData = (data || []).filter((item) => {
    const serviceNo = item.serviceNo?.toString().toLowerCase() || "";
    const queryId = item.queryId?.toString().toLowerCase() || "";
    const type = item.type?.toLowerCase() || "";
    const term = search.toLowerCase();
    return (
      serviceNo.includes(term) || queryId.includes(term) || type.includes(term)
    );
  });

  const CopyAction = () => {
    const text = filteredData
      .map(
        (row, i) =>
          `${i + 1}\t${row.serviceNo}\t${row.type}\t${row.queryId}\t${row.date}`
      )
      .join("\n");
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const CSVAction = () => {
    const header = ["S.No", "Service No", "Query Type", "Query ID", "Date"];
    const rows = filteredData.map((row, i) => [
      i + 1,
      row.serviceNo,
      row.type,
      row.queryId,
      row.date,
    ]);
    const csv = [header, ...rows].map((e) => e.join(",")).join("\n");
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

    filteredData.forEach((row, i) => {
      const y = 50 + i * 10;
      doc.text(
        `${i + 1}. ${row.serviceNo} | ${row.type} | ${row.queryId} | ${
          row.date
        }`,
        20,
        y
      );
    });

    doc.save(`${title}.pdf`);
  };

  const PrintAction = () => {
    const content = filteredData
      .map(
        (row, i) =>
          `${i + 1} | ${row.serviceNo} | ${row.type} | ${row.queryId} | ${
            row.date
          }`
      )
      .join("\n");
    const printWindow = window.open("", "", "width=800,height=600");
    printWindow.document.write("<pre>" + content + "</pre>");
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="queries-container">
      <div className="queries-header">
        <h2>{title}</h2>
      </div>

      <div className="queries-toolbar">
        <div className="export-buttons">
          <button onClick={CopyAction} className="btn export-btn">
            Copy
          </button>
          <button onClick={CSVAction} className="btn export-btn">
            CSV
          </button>
          <button onClick={PrintAction} className="btn export-btn">
            Print
          </button>
          <button onClick={PDFAction} className="btn export-btn">
            PDF
          </button>
        </div>

        <div className="search-box">
          <input
            type="text"
            placeholder="Search..."
            className="search-bar"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredData}
        pagination
        highlightOnHover
        responsive
        customStyles={customStyles}
        className="themed-data-table"
      />
    </div>
  );
};

export default QueriesTable;
