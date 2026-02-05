// src/components/QueriesTable.jsx
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DataTable from "react-data-table-component";
import jsPDF from "jspdf";
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Stack,
} from "@mui/material";
import { styled, useTheme } from "@mui/material/styles";
import { getUserRoleLabel } from "../constants/Enum";

// Styled components
const QueriesContainer = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  padding: theme.spacing(2.5),
  margin: theme.spacing(2.5, 'auto'),
  borderRadius: theme.shape.borderRadius * 1.5,
  boxShadow: theme.shadows[2],
  maxWidth: 1200,
  color: theme.palette.text.primary,
  border: `1px solid ${theme.palette.divider}`,
}));

const QueriesHeader = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(2.5),
}));

const QueriesToolbar = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing(2),
  flexWrap: 'wrap',
  gap: theme.spacing(1.25),
}));

const ExportButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  padding: theme.spacing(1, 1.75),
  borderRadius: theme.shape.borderRadius,
  fontSize: 14,
  fontWeight: 500,
  textTransform: 'none',
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
  },
}));

const ActionButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.success.main,
  color: theme.palette.success.contrastText,
  padding: theme.spacing(0.75, 1.5),
  fontSize: 13,
  borderRadius: theme.shape.borderRadius,
  textTransform: 'none',
  minWidth: 'auto',
  '&:hover': {
    backgroundColor: theme.palette.success.dark,
  },
}));

const SearchField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    backgroundColor: theme.palette.mode === 'dark' 
      ? theme.palette.background.default 
      : theme.palette.grey[50],
    borderRadius: theme.shape.borderRadius,
    '& fieldset': {
      borderColor: theme.palette.divider,
    },
    '&:hover fieldset': {
      borderColor: theme.palette.primary.main,
    },
  },
  '& .MuiInputBase-input': {
    fontSize: 14,
    padding: theme.spacing(1, 1.75),
    minWidth: 250,
  },
}));

const QueriesTable = ({ title, data = [] }) => {
  const theme = useTheme();
  
  // Custom styles for react-data-table-component using MUI theme
  const customStyles = {
    table: {
      style: {
        backgroundColor: theme.palette.background.paper,
        borderRadius: theme.shape.borderRadius * 1.5,
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
        backgroundColor: theme.palette.mode === 'dark' 
          ? theme.palette.background.default 
          : theme.palette.grey[50],
        borderBottom: `1px solid ${theme.palette.divider}`,
        minHeight: "48px",
      },
    },
    headCells: {
      style: {
        color: theme.palette.text.primary,
        fontSize: "14px",
        fontWeight: "600",
        paddingLeft: "12px",
        paddingRight: "12px",
      },
    },
    rows: {
      style: {
        backgroundColor: theme.palette.background.paper,
        minHeight: "52px",
        '&:hover': {
          backgroundColor: theme.palette.action.hover,
        },
      },
      highlightOnHoverStyle: {
        backgroundColor: theme.palette.action.hover,
        color: theme.palette.text.primary,
      },
    },
    cells: {
      style: {
        paddingLeft: "12px",
        paddingRight: "12px",
        color: theme.palette.text.primary,
        fontSize: "14px",
      },
    },
    pagination: {
      style: {
        padding: "8px",
        color: theme.palette.text.primary,
        backgroundColor: "transparent",
      },
      pageButtonsStyle: {
        borderRadius: "8px",
        height: "32px",
        width: "32px",
        padding: "4px",
        margin: "0 4px",
        cursor: "pointer",
        transition: "all 0.2s ease",
        color: theme.palette.text.primary,
        fill: theme.palette.text.primary,
        '&:disabled': {
          cursor: 'default',
          color: theme.palette.text.disabled,
          fill: theme.palette.text.disabled,
        },
      },
    },
  };

  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // Return the raw API value as-is if it is a string; otherwise JSON-stringify to preserve payload shape without formatting
  const getDisplayDate = (row) => {
    const raw =
      (row && (row.afcaadDate ?? row.date ?? row.dateString ?? row.apiDate)) ??
      "";
    if (typeof raw === "string") return raw;
    try {
      return JSON.stringify(raw);
    } catch {
      return String(raw ?? "");
    }
  };

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
      { state: { row, from: location.pathname + location.search } }
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
      selector: (row) => row.serviceNo ?? "",
      sortable: true,
    },
    { name: "Query Type", selector: (row) => row.type ?? "", sortable: true },
    { name: "Query ID", selector: (row) => row.queryId ?? "", sortable: true },
    {
      name: "Query Received (AFCAAD Date)",
      selector: (row) => getDisplayDate(row),
      sortable: true,
    },
    {
      name: "Action",
      cell: (row) => (
        <ActionButton onClick={() => handleView(row)} size="small">
          View
        </ActionButton>
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
          `${i + 1}\t${row.serviceNo}\t${row.type}\t${
            row.queryId
          }\t${getDisplayDate(row)}`
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
      getDisplayDate(row),
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
        `${i + 1}. ${row.serviceNo} | ${row.type} | ${
          row.queryId
        } | ${getDisplayDate(row)}`,
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
          `${i + 1} | ${row.serviceNo} | ${row.type} | ${
            row.queryId
          } | ${getDisplayDate(row)}`
      )
      .join("\n");
    const printWindow = window.open("", "", "width=800,height=600");
    printWindow.document.write("<pre>" + content + "</pre>");
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <QueriesContainer elevation={2}>
      <QueriesHeader>
        <Typography variant="h5" fontWeight={600}>
          {title}
        </Typography>
      </QueriesHeader>

      <QueriesToolbar>
        <Stack direction="row" spacing={1.25}>
          <ExportButton onClick={CopyAction} size="small">
            Copy
          </ExportButton>
          <ExportButton onClick={CSVAction} size="small">
            CSV
          </ExportButton>
          <ExportButton onClick={PrintAction} size="small">
            Print
          </ExportButton>
          <ExportButton onClick={PDFAction} size="small">
            PDF
          </ExportButton>
        </Stack>

        <SearchField
          size="small"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </QueriesToolbar>

      <DataTable
        columns={columns}
        data={filteredData}
        pagination
        highlightOnHover
        responsive
        customStyles={customStyles}
      />
    </QueriesContainer>
  );
};

export default QueriesTable;
