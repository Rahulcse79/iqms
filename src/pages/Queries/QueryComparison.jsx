import React, { useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { searchByServiceNoAndCategory } from "../../actions/queryActions";
import "./QueryComparison.css";
import DataTable from "react-data-table-component";
import jsPDF from "jspdf";
import QueryDetails from "./QueryDetails";

const ALLOWED_CATEGORIES = ["Airmen", "Officer"];
const NUM_SLOTS = 3;

const normalize = (v = "") => v.trim();

const Comparison = () => {
  const dispatch = useDispatch();

  // Inputs
  const [inputs, setInputs] = useState(
    Array.from({ length: NUM_SLOTS }, () => ({
      serviceNo: "",
      category: "Airmen",
    }))
  );

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

  const [panelData, setPanelData] = useState(
    Array.from({ length: NUM_SLOTS }, () => [])
  );
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [touched, setTouched] = useState(false);
  const [fieldErrors, setFieldErrors] = useState(
    Array.from({ length: NUM_SLOTS }, () => "")
  );
  const [search, setSearch] = useState("");

  const [activeQueryId1, setActiveQueryId1] = useState(null);
  const [activeQueryId2, setActiveQueryId2] = useState(null);
  const [activeQueryId3, setActiveQueryId3] = useState(null);

  const handleView = (row, callName) => {
    if (callName === 1) {
      setActiveQueryId1(row.queryId);
    } else if (callName === 2) {
      setActiveQueryId2(row.queryId);
    } else if (callName === 3) {
      setActiveQueryId3(row.queryId);
    }
  };

  const handleBack1 = () => {
    setActiveQueryId1(null);
  };

  const handleBack2 = () => {
    setActiveQueryId2(null);
  };

  const handleBack3 = () => {
    setActiveQueryId3(null);
  };

  const setInputField = (index, field, value) => {
    setInputs((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
    setFieldErrors((prev) => {
      const next = [...prev];
      next[index] = "";
      return next;
    });
  };

  const activeSlots = useMemo(
    () =>
      inputs
        .map((inp, idx) => ({
          ...inp,
          index: idx,
          serviceNo: normalize(inp.serviceNo),
        }))
        .filter((x) => x.serviceNo),
    [inputs]
  );

  const validate = () => {
    const perField = Array.from({ length: NUM_SLOTS }, () => "");
    let error = null;

    const entries = inputs.map((i) => ({
      serviceNo: normalize(i.serviceNo),
      category: i.category,
    }));

    if (entries.every((e) => !e.serviceNo)) {
      error = "Please enter at least one Service Number.";
    }

    entries.forEach((e, idx) => {
      if (!e.serviceNo) return;
      if (!/^\d+$/.test(e.serviceNo)) {
        perField[idx] = "Only digits are allowed.";
      } else if (e.serviceNo.length < 5 || e.serviceNo.length > 12) {
        perField[idx] = "Length must be 5–12 digits.";
      }
      if (!ALLOWED_CATEGORIES.includes(e.category)) {
        perField[idx] = "Invalid category.";
      }
    });

    const nos = entries.map((e) => e.serviceNo).filter(Boolean);
    if (new Set(nos).size !== nos.length) {
      error = "Please enter different Service Numbers to compare.";
    }

    const firstFieldErr = perField.find((msg) => msg);
    if (!error && firstFieldErr) error = "Please fix the highlighted fields.";

    setFieldErrors(perField);
    setFormError(error);
    return !error;
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setTouched(true);

    if (!validate()) return;

    setLoading(true);
    setFormError(null);

    const nextData = Array.from({ length: NUM_SLOTS }, () => []);

    try {
      await Promise.all(
        activeSlots.map(async ({ serviceNo, category, index }) => {
          try {
            const data = await dispatch(
              searchByServiceNoAndCategory(serviceNo, category, index + 1)
            );

            const items = (data?.items || []).map((item) => ({
              queryId: item.doc_id,
              type: item.querytype,
              serviceNo,
              pendingWith: item.pending_with_dec,
              date: new Date(item.submit_date).toLocaleDateString(),
            }));

            nextData[index] = items;
          } catch (err) {
            console.error(`Error fetching slot ${index + 1}`, err);
          }
        })
      );
      setPanelData(nextData);
    } catch (err) {
      console.error("Unexpected error:", err);
      setFormError(err?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setInputs(
      Array.from({ length: NUM_SLOTS }, () => ({
        serviceNo: "",
        category: "Airmen",
      }))
    );
    setPanelData(Array.from({ length: NUM_SLOTS }, () => []));
    setFieldErrors(Array.from({ length: NUM_SLOTS }, () => ""));
    setFormError(null);
    setTouched(false);
    setActiveQueryId1(null);
    setActiveQueryId2(null);
    setActiveQueryId3(null);
    setSearch("");
  };

  const panels = useMemo(() => {
    if (!touched) return [];
    return activeSlots.map(({ index, serviceNo, category }) => ({
      index,
      serviceNo,
      category,
      data: panelData[index] || [],
    }));
  }, [touched, activeSlots, panelData]);

  const gridColumns = Math.max(1, panels.length || 1);

  // ----------------- Export Functions -----------------
  const copyAction = (data) => {
    const text = data
      .map(
        (row, i) =>
          `${i + 1}\t${row.serviceNo}\t${row.type}\t${row.queryId}\t${row.date}`
      )
      .join("\n");
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const csvAction = (data) => {
    const header = ["S.No", "Service No", "Query Type", "Query ID", "Date"];
    const rows = data.map((row, i) => [
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
    link.download = `Report.csv`;
    link.click();
  };

  const pdfAction = (data) => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.text(`Report`, 20, 20);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated at: ${new Date().toLocaleString()}`, 20, 40);
    data.forEach((row, i) => {
      const y = 50 + i * 10;
      doc.text(
        `${i + 1}. ${row.serviceNo} | ${row.type} | ${row.queryId} | ${
          row.date
        }`,
        20,
        y
      );
    });
    doc.save(`Report.pdf`);
  };

  const printAction = (data) => {
    const content = data
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

  // ----------------- Column Factory (fix for callName) -----------------
  const getColumns = (callName) => [
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
          {/* pass the callName for this panel */}
          <button
            className="action-btn"
            onClick={() => handleView(row, callName)}
          >
            View
          </button>
        </div>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
    },
  ];

  // ----------------- Render -----------------
  return (
    <div className="comparison-wrapper">
      <div className="comparison-container">
        <h2 style={{ color: "var(--text)" }}>Query Comparison</h2>

        <form className="comparison-form" onSubmit={handleSearch} noValidate>
          <div className="service-numbers-row">
            {inputs.map((inp, i) => (
              <div key={i} className="input-block">
                <label htmlFor={`sn-${i}`}>Service Number {i + 1}</label>
                <input
                  id={`sn-${i}`}
                  type="text"
                  inputMode="numeric"
                  placeholder={`Enter number ${i + 1}`}
                  value={inp.serviceNo}
                  className={fieldErrors[i] ? "invalid" : ""}
                  onChange={(e) =>
                    setInputField(i, "serviceNo", e.target.value)
                  }
                />
                <select
                  id={`cat-${i}`}
                  value={inp.category}
                  onChange={(e) => setInputField(i, "category", e.target.value)}
                >
                  {ALLOWED_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                {fieldErrors[i] && (
                  <div className="field-error">{fieldErrors[i]}</div>
                )}
              </div>
            ))}
          </div>

          <div className="actions-row">
            <button
              type="submit"
              style={{ backgroundColor: "var(--button-bg)", color: "var(--button-text)" }}
              disabled={loading}
            >
              {loading ? "Searching…" : "Search"}
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={loading}
              style={{ backgroundColor: "var(--button-bg)",  color: "var(--button-text)" }}
            >
              Reset
            </button>
          </div>

          {formError && <div className="form-error">{formError}</div>}
        </form>

        {touched && (
          <div
            className="results-grid"
            style={{
              gridTemplateColumns: `repeat(${gridColumns}, minmax(320px, 1fr))`,
            }}
          >
            {panels.map((p) => (
              <section key={p.index} className="result-card">
                <header className="card-header">
                  <div className="card-title">
                    <span className="badge">{p.category}</span>
                    <h3 style={{ color: "var(--text)" }}>{p.serviceNo}</h3>
                  </div>
                  <div style={{ color: "var(--text)" }}>
                    {p.data.length > 0
                      ? `${p.data.length} queries`
                      : "No queries found"}
                  </div>
                </header>

                <div className="card-body">
                  {p.data.length > 0 ? (
                    <>
                      <div className="queries-toolbar">
                        <div className="export-buttons">
                          <button
                            onClick={() => copyAction(p.data)}
                            className="btn export-btn"
                          >
                            Copy
                          </button>
                          <button
                            onClick={() => csvAction(p.data)}
                            className="btn export-btn"
                          >
                            CSV
                          </button>
                          <button
                            onClick={() => printAction(p.data)}
                            className="btn export-btn"
                          >
                            Print
                          </button>
                          <button
                            onClick={() => pdfAction(p.data)}
                            className="btn export-btn"
                          >
                            PDF
                          </button>
                        </div>
                      </div>

                      <DataTable
                        // IMPORTANT: use columns for this specific panel, pass callName = p.index + 1
                        columns={getColumns(p.index + 1)}
                        data={p.data.filter((item) => {
                          const term = search.toLowerCase();
                          return (
                            item.serviceNo?.toLowerCase().includes(term) ||
                            item.queryId
                              ?.toString()
                              .toLowerCase()
                              .includes(term) ||
                            item.type?.toLowerCase().includes(term)
                          );
                        })}
                        pagination
                        highlightOnHover
                        striped
                        responsive
                        customStyles={customStyles}
                        className="themed-data-table"
                      />
                    </>
                  ) : (
                    <div className="panel-empty">
                      No queries for this service number.
                    </div>
                  )}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
      <div className="results-grid2">
        {activeQueryId1 && (
          <div className="query-view-panel">
            <QueryDetails queryId={activeQueryId1} onBack={handleBack1} />
          </div>
        )}
        {activeQueryId2 && (
          <div className="query-view-panel">
            <QueryDetails queryId={activeQueryId2} onBack={handleBack2} />
          </div>
        )}
        {activeQueryId3 && (
          <div className="query-view-panel">
            <QueryDetails queryId={activeQueryId3} onBack={handleBack3} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Comparison;
