import React, { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import { FaEye } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function IQMSdetailsTab({
  serviceNumber,
  serviceNo,
  category,
  type = "Service", // default if not passed
  queryValue = "", // default if not passed
}) {
  const svc = serviceNumber ?? serviceNo;
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    if (!svc || !category) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const url = `http://sampoorna.cao.local/afcao/ipas/ivrs/searchQuery_SNO_CAT/${encodeURIComponent(
          svc
        )}/${encodeURIComponent(category)}`;

        const res = await fetch(url);

        if (!res.ok) {
          throw new Error(`Failed to fetch data (${res.status})`);
        }

        const result = await res.json();
        setData(result.items || []);
      } catch (err) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [svc, category]);

  const decodeHtml = (html) => {
    if (!html) return "";
    try {
      const txt = document.createElement("textarea");
      txt.innerHTML = html;
      return txt.value;
    } catch (e) {
      return html;
    }
  };

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
        minHeight: "52px",
        "&:not(:last-of-type)": {
          borderBottom: "1px solid var(--border)",
        },
      },
      highlightOnHoverStyle: {
        backgroundColor: "var(--surface-accent)",
        color: "var(--primary)",
        transitionDuration: "0.25s",
        transitionProperty: "background-color,color",
        outline: "none",
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
      pageButtonsStyle: {
        borderRadius: "6px",
        height: "32px",
        width: "32px",
        padding: "4px",
        margin: "0 4px",
        cursor: "pointer",
        transition: "all 0.2s ease",
        color: "var(--text)",
        fill: "var(--text)",

        "&:hover": {
          backgroundColor: "var(--surface-accent)",
          color: "var(--primary)",
          fill: "var(--primary)",
        },

        "&:disabled": {
          cursor: "not-allowed",
          opacity: 0.5,
        },

        "&[aria-current='true']": {
          backgroundColor: "var(--primary)",
          color: "var(--on-primary)",
          fill: "var(--on-primary)",
        },
      },
    },
  };

  // Define columns for DataTable
  const columns = [
    {
      name: "Doc ID",
      selector: (row) => row.doc_id,
      sortable: true,
      width: "120px",
    },
    {
      name: "Query Type",
      selector: (row) => decodeHtml(row.querytype),
      sortable: true,
      wrap: true,
    },
    {
      name: "Pending With",
      selector: (row) => row.pending_with,
      sortable: true,
      width: "140px",
    },
    {
      name: "Pending Description",
      selector: (row) => row.pending_with_dec,
      wrap: true,
    },
    {
      name: "Submit Date",
      selector: (row) =>
        row.submit_date ? new Date(row.submit_date).toLocaleString() : "",
      sortable: true,
      width: "200px",
    },
    {
      name: "Action",
      button: true,
      width: "120px",
      cell: (row, index) => (
        <button
          className="button-text-color"
          onClick={() =>
            navigate(
              `/view/query/${encodeURIComponent(
                row.doc_id
              )}?category=${encodeURIComponent(
                category
              )}&type=${encodeURIComponent(type)}&q=${encodeURIComponent(
                queryValue || svc
              )}`,
              {
                state: {
                  row,
                  key: index,
                  serviceNumber: svc,
                  category,
                },
              }
            )
          }
        >
          <FaEye />
        </button>
      ),
    },
  ];

  return (
    <div>
      <h2>IQMS Details</h2>

      {!svc && (
        <p>Please enter Service Number and Category above and submit.</p>
      )}
      {error && <p style={{ color: "var(--red-text)" }}>{error}</p>}

      <div className="themed-data-table">
        <DataTable
          columns={columns}
          data={data}
          progressPending={loading}
          pagination
          highlightOnHover
          striped
          responsive
          persistTableHead
          customStyles={customStyles}
        />
      </div>
    </div>
  );
}
