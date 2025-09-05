// QueryView.jsx
import React, { useState } from "react";
import {
  FiSearch,
  FiPlus,
  FiDownload,
  FiEye,
  FiX,
  FiRefreshCcw,
  FiCopy,
  FiDownload as FiDL,
} from "react-icons/fi";

import NewQuery from "./NewQuery";
import "./QueryView.css";

import {
  getServiceByNo,
  getQueriesByService,
  getRemarksByQueryNo,
  createQuery,
  queries as queriesApi, // API-shaped store (raw JSON objects)
} from "./data";

function StatusBadge({ status }) {
  const s = (status || "").toLowerCase();
  const cls = `status-badge ${s || "unknown"}`;
  return <span className={cls}>{status || "-"}</span>;
}

export default function QueryView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [displayList, setDisplayList] = useState([]);
  const [formData, setFormData] = useState(null);

  // modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalRemarks, setModalRemarks] = useState([]);
  const [replyText, setReplyText] = useState("");

  // raw API object for the selected query
  const [modalRawQuery, setModalRawQuery] = useState(null);
  const [showRawJson, setShowRawJson] = useState(false);

  const [newQueryOpen, setNewQueryOpen] = useState(false);
  const [searchError, setSearchError] = useState("");

  // Search a service (uses data.js -> returns UI-shaped service)
  function handleSearch() {
    const svc = (searchQuery || "").trim();
    setSearchError("");
    if (!svc) {
      setSearchError("Please enter a service number to search.");
      return;
    }

    const svcObj = getServiceByNo(svc);
    if (!svcObj) {
      setSearchError(`Service number "${svc}" not found.`);
      setHasSearched(false);
      setFormData(null);
      setDisplayList([]);
      return;
    }

    const list = getQueriesByService(svcObj.serviceNo);
    setFormData(svcObj);
    setDisplayList(list);
    setHasSearched(true);
    // reset modal info
    setModalOpen(false);
    setModalRemarks([]);
    setModalRawQuery(null);
    setShowRawJson(false);
  }

  // Reset page state WITHOUT reload (preserves app cache)
  function handleReset() {
    setSearchQuery("");
    setHasSearched(false);
    setDisplayList([]);
    setFormData(null);
    setModalOpen(false);
    setModalRemarks([]);
    setReplyText("");
    setNewQueryOpen(false);
    setSearchError("");
    setModalRawQuery(null);
    setShowRawJson(false);
  }

  // View remarks for a query (data.js will synthesize timeline) and show full API data
  function handleViewFromTable(q) {
    const remarks = getRemarksByQueryNo(q.queryNo);
    const out =
      remarks && remarks.length
        ? remarks
        : [
            {
              id: 1,
              sender: "User",
              text: `Initial message: Request regarding ${q.subject}.`,
              date: q.date + " 09:12",
            },
            {
              id: 2,
              sender: "Officer",
              text: "Acknowledged. Forwarded to Admin section.",
              date: q.date + " 11:05",
            },
          ];

    // Find raw API object by queryNo in queriesApi store
    const raw =
      queriesApi.find(
        (item) =>
          String(item.queryNo) === String(q.queryNo) ||
          String(item.queryPk) === String(q.id)
      ) || null;

    setModalTitle(`${q.queryNo} — ${q.subject}`);
    setModalRemarks(out);
    setModalRawQuery(raw);
    setModalOpen(true);
    setShowRawJson(false);
  }

  function closeModal() {
    setModalOpen(false);
    setModalRemarks([]);
    setReplyText("");
    setModalRawQuery(null);
    setShowRawJson(false);
  }

  function exportCSV() {
    if (!displayList.length) {
      alert("No queries to export.");
      return;
    }
    const headers = ["QueryNo", "Subject", "Status", "Date", "Priority"];
    const rows = displayList.map((q) => [
      q.queryNo,
      q.subject,
      q.status,
      q.date,
      q.priority,
    ]);
    const csv = [headers, ...rows]
      .map((r) =>
        r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `queries_${formData ? formData.serviceNo : "export"}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function sendReply() {
    if (!replyText.trim()) {
      alert("Write a reply before sending.");
      return;
    }
    // In a real app you'd call an API; here we simulate submission
    alert("Reply submitted (simulation)");
    setReplyText("");
  }

  /**
   * handleCreateQuery(payload)
   * - Called by NewQuery (child). Persists via createQuery (mock) and refreshes UI list.
   * - Returns the created UI-shaped object (so NewQuery can show a created summary).
   */
  function handleCreateQuery(payload) {
    try {
      const savedApi = createQuery(payload); // API-shaped object in data.js
      // refresh UI-shaped list for this service
      const updatedList = getQueriesByService(savedApi.serviceNo);
      setDisplayList(updatedList);
      // locate created UI item and return it
      const createdUI =
        updatedList.find((item) => item.queryNo === savedApi.queryNo) ||
        updatedList[0];
      return createdUI;
    } catch (err) {
      console.error("Failed to create query:", err);
      throw err;
    }
  }

  // Copy raw JSON to clipboard
  function copyRawJson() {
    if (!modalRawQuery) return;
    const text = JSON.stringify(modalRawQuery, null, 2);
    navigator.clipboard
      ?.writeText(text)
      .then(() => alert("Raw JSON copied to clipboard"))
      .catch(() =>
        alert("Copy failed — your browser may not allow clipboard access")
      );
  }

  // Download raw JSON
  function downloadRawJson() {
    if (!modalRawQuery) return;
    const blob = new Blob([JSON.stringify(modalRawQuery, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${modalRawQuery.queryNo || "query"}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // Format some common values safely
  function safe(v) {
    if (v === null || v === undefined) return "-";
    if (typeof v === "boolean") return v ? "Yes" : "No";
    return String(v);
  }

  // Render grouped detail rows using available API fields
  function renderDetailRows(api) {
    if (!api)
      return (
        <div className="no-data">No API details found for this query.</div>
      );

    // We'll show the most relevant fields first, then the rest as key-value pairs
    const mainLeft = [
      ["Query No", safe(api.queryNo)],
      ["Query PK", safe(api.queryPk)],
      [
        "Query Date",
        safe(api.queryDate && api.queryDate.slice(0, 19).replace("T", " ")),
      ],
      ["Case Type", safe(api.caseType)],
      ["Service No", safe(api.serviceNo)],
      ["Rank", safe(api.rankName)],
      [
        "Name",
        `${safe(api.fname)} ${api.mname ? api.mname + " " : ""}${safe(
          api.lname
        )}`.trim(),
      ],
      ["Mobile", `+${safe(api.isdName)} ${safe(api.mobileNo)}`],
      ["Email", safe(api.emailId)],
    ];

    const mainRight = [
      ["Category", safe(api.queryCategoryName)],
      ["Sub-category", safe(api.subCategoryName)],
      ["Mode", safe(api.queryModeName)],
      ["Priority", safe(api.queryPriotriyName)],
      ["Status", safe(api.forwardStatusName || api.queryStatus)],
      ["Forwarded Section", safe(api.forwardSectionName)],
      [
        "Forward Date",
        safe(api.forwardDate && api.forwardDate.slice(0, 19).replace("T", " ")),
      ],
      ["Section Reply", safe(api.secReplyMessage)],
    ];

    // Build fallback list of other fields to show
    const extras = [
      "forwardStatus",
      "satisfyn",
      "feedBackRemark",
      "insReplyMessage",
      "updFileName",
      "secReplyBy",
      "secReplyDate",
      "addressLine1",
      "addressLine2",
      "countryName",
      "stateName",
      "districtName",
      "pinCode",
      "ppoNo",
    ];
    const extrasRows = extras.map((k) => [k, safe(api[k])]);

    return (
      <div className="modal-detail-grid">
        <div className="modal-detail-col">
          {mainLeft.map(([k, v]) => (
            <div className="detail-row" key={k}>
              <div className="detail-k">{k}</div>
              <div className="detail-v">{v}</div>
            </div>
          ))}
        </div>

        <div className="modal-detail-col">
          {mainRight.map(([k, v]) => (
            <div className="detail-row" key={k}>
              <div className="detail-k">{k}</div>
              <div className="detail-v">{v}</div>
            </div>
          ))}
        </div>

        <div className="modal-detail-extras">
          <h4>Other fields</h4>
          {extrasRows.map(([k, v]) => (
            <div className="detail-row small" key={k}>
              <div className="detail-k">{k}</div>
              <div className="detail-v mono">{v}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="query-container">
      <header className="header">
        <div className="header-left">
          <h1 className="title">Query Management</h1>
          <div className="subtitle">
            {hasSearched ? (
              <>
                Viewing queries for <strong>{formData.serviceNo}</strong>
              </>
            ) : (
              <>Search a service number to get started</>
            )}
          </div>
        </div>

        <div className="header-right">
          <div className="search-bar">
            <FiSearch className="search-icon" />
            <input
              placeholder="Enter Service Number (e.g. 701662)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <button className="btn btn-primary" onClick={handleSearch}>
              <FiSearch /> Search
            </button>
            {hasSearched && (
              <button className="btn btn-secondary" onClick={handleReset}>
                <FiRefreshCcw /> Reset
              </button>
            )}
          </div>

          {hasSearched && (
            <>
              <button className="btn btn-secondary" onClick={exportCSV}>
                <FiDownload /> Export
              </button>
              <button
                className="btn btn-primary"
                onClick={() => setNewQueryOpen(true)}
              >
                <FiPlus /> New Query
              </button>
            </>
          )}
        </div>
      </header>

      {searchError && (
        <div
          className="search-error"
          style={{ maxWidth: 1200, margin: "8px auto", color: "#b91c1c" }}
        >
          {searchError}
        </div>
      )}

      {!hasSearched ? (
        <></>
      ) : (
        <>
          <main className="layout">
            <div className="details">
              <article className="card query-details">
                <div className="details-top">
                  <div className="avatar">
                    {(formData.firstName || "U").charAt(0)}
                  </div>
                  <div className="main-meta">
                    <div className="name">
                      {formData.firstName} {formData.middleName}{" "}
                      {formData.lastName}
                    </div>
                    <div className="meta">
                      <strong>
                        {formData.rank} • {formData.region}
                      </strong>
                    </div>
                    <div className="meta small">
                      <strong>
                        {formData.address1} • +{formData.isdCode}{" "}
                        {formData.mobile}
                      </strong>
                    </div>
                    <div className="meta small">
                      <strong>{formData.email}</strong>
                    </div>
                    <div className="meta small">
                      Service No: <strong>{formData.serviceNo}</strong>
                    </div>
                  </div>
                  <div className="actions-meta">
                    <div className="small-row">
                      <div className="chip">Retired</div>
                      <StatusBadge status="Open" />
                    </div>
                    <div className="meta small">
                      Active Queries: <strong>{displayList.length}</strong>
                    </div>
                  </div>
                </div>

                <div className="details-grid">
                  <div className="detail-card">
                    <div className="label">Country</div>
                    <div className="value">
                      {formData.countryName || "India"}
                    </div>
                  </div>
                  <div className="detail-card">
                    <div className="label">State</div>
                    <div className="value">{formData.state}</div>
                  </div>
                  <div className="detail-card">
                    <div className="label">Pincode</div>
                    <div className="value">{formData.pincode}</div>
                  </div>
                  <div className="detail-card">
                    <div className="label">Forwarded Section</div>
                    <div className="value">{formData.forwardSectionName}</div>
                  </div>
                </div>
              </article>
            </div>

            <aside className="list">
              <div className="card">
                <div className="list-header">
                  <h3>Your Queries</h3>
                  <div className="result-count">
                    {displayList.length} results
                  </div>
                </div>

                <div className="table-wrap">
                  <table className="query-table">
                    <thead>
                      <tr>
                        <th>Query No</th>
                        <th>Subject</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayList.map((q) => (
                        <tr key={q.id}>
                          <td className="mono">{q.queryNo}</td>
                          <td>{q.subject}</td>
                          <td>
                            <StatusBadge status={q.status} />
                          </td>
                          <td>{q.date}</td>
                          <td>
                            <button
                              className="btn btn-ghost small"
                              onClick={() => handleViewFromTable(q)}
                              title="View"
                            >
                              <FiEye />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {displayList.length === 0 && (
                        <tr>
                          <td
                            colSpan={5}
                            style={{ textAlign: "center", padding: 20 }}
                          >
                            No queries found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="list-footer">
                  <div>
                    Showing 1 to {Math.max(displayList.length, 0)} of{" "}
                    {displayList.length}
                  </div>
                  <div className="pagination">
                    <button className="btn btn-ghost small">Prev</button>
                    <button className="btn btn-primary small">1</button>
                    <button className="btn btn-ghost small">Next</button>
                  </div>
                </div>
              </div>
            </aside>
          </main>

          {/* Remarks + Details Modal */}
          {modalOpen && (
            <div className="modal-root">
              <div className="modal-overlay" onClick={closeModal}></div>
              <div className="modal-card large" role="dialog" aria-modal="true">
                <div className="modal-header">
                  <div className="modal-title">{modalTitle}</div>
                  <div
                    style={{ display: "flex", gap: 8, alignItems: "center" }}
                  >
                    <button
                      className="btn btn-ghost small"
                      onClick={copyRawJson}
                      title="Copy raw JSON"
                    >
                      <FiCopy />
                    </button>
                    <button
                      className="btn btn-ghost small"
                      onClick={downloadRawJson}
                      title="Download raw JSON"
                    >
                      <FiDL />
                    </button>
                    <button className="modal-close" onClick={closeModal}>
                      <FiX />
                    </button>
                  </div>
                </div>

                <div className="modal-body split">
                  {/* Left: remarks timeline */}
                  <div className="modal-left">
                    <h4>Conversation / Remarks</h4>
                    <div className="remarks-list">
                      {modalRemarks.map((r) => (
                        <div key={r.id} className="remark">
                          <div className="r-left">
                            <div className="r-avatar">
                              {r.sender?.charAt(0) || "?"}
                            </div>
                          </div>
                          <div className="r-right">
                            <div className="r-meta">
                              <strong>{r.sender}</strong>{" "}
                              <span className="r-date">{r.date}</span>
                            </div>
                            <div className="r-text">{r.text}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right: full API details */}
                  <div className="modal-right">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <h4>Query Details (API)</h4>
                      <button
                        className="btn btn-ghost small"
                        onClick={() => setShowRawJson((v) => !v)}
                      >
                        {showRawJson ? "Hide JSON" : "Show Raw JSON"}
                      </button>
                    </div>

                    <div className="modal-details-scroll">
                      {renderDetailRows(modalRawQuery)}
                    </div>

                    {showRawJson && (
                      <div className="raw-json-block">
                        <pre className="mono">
                          {modalRawQuery
                            ? JSON.stringify(modalRawQuery, null, 2)
                            : "No raw JSON available"}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>

                <div className="modal-footer">
                  <textarea
                    placeholder="Add a remark..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  />
                  <div className="modal-actions">
                    <button className="btn btn-secondary" onClick={closeModal}>
                      Close
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        sendReply();
                        closeModal();
                      }}
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* New Query modal */}
          {newQueryOpen && (
            <div className="modal-root">
              <div
                className="modal-overlay"
                onClick={() => setNewQueryOpen(false)}
              ></div>
              <div className="modal-card large" role="dialog" aria-modal="true">
                <div className="modal-header">
                  <div className="modal-title">Create New Query</div>
                  <button
                    className="modal-close"
                    onClick={() => setNewQueryOpen(false)}
                  >
                    <FiX />
                  </button>
                </div>
                <div className="modal-body">
                  <NewQuery
                    service={formData}
                    onClose={() => setNewQueryOpen(false)}
                    onCreate={handleCreateQuery}
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
