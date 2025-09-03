import React, { useEffect, useState } from "react";
import axios from "axios";
import "./CopyQueryView.css";

const QueryView = ({ queryId, onBack }) => {
  const [activeTab, setActiveTab] = useState("details");
  const [replyText, setReplyText] = useState("");
  const [forwardOption, setForwardOption] = useState("");
  const [transferSection, setTransferSection] = useState("");

  const [loading, setLoading] = useState(false);
  const [item, setItem] = useState(null);
  const [error, setError] = useState(null);

  // Fetch data directly (no Redux, no global state)
  useEffect(() => {
    if (!queryId) return;

    const fetchQuery = async () => {
      try {
        setLoading(true);
        setError(null);

        const url = `http://sampoorna.cao.local/afcao/ipas/ivrs/searchQuery_docId/${queryId}`;
        console.log("Fetching:", url);

        const { data } = await axios.get(url);

        setItem(data.items && data.items.length > 0 ? data.items[0] : null);
      } catch (err) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchQuery();
  }, [queryId]);

  const handleSubmit = () => {
    if (window.confirm("Are you sure you want to submit this reply?")) {
      alert(`
        Reply Submitted!
        Reply: ${replyText}
        Forwarded To: ${forwardOption}
        Sub-Section: ${transferSection || ""}
      `);
      setReplyText("");
    }
  };

  if (loading) return <div className="qview-container">Loading...</div>;
  if (error)
    return (
      <div className="qview-container">
        <div className="qview-card">
          <h3>Error fetching query: {error}</h3>
          {onBack && (
            <button className="btn" onClick={onBack}>
              Back
            </button>
          )}
        </div>
      </div>
    );
  if (!item) return null;

  return (
    <div className="qview-container split-active">
      {onBack && (
        <button className="btn back-btn" onClick={onBack}>
          ← Back
        </button>
      )}

      <div className="left-panel">
        <h2 className="page-title">View Query Status</h2>

        {/* Tabs */}
        <div className="tab-header">
          <button
            className={`tab-btn ${activeTab === "details" ? "active" : ""}`}
            onClick={() => setActiveTab("details")}
          >
            Query Details
          </button>
          <button
            className={`tab-btn ${activeTab === "history" ? "active" : ""}`}
            onClick={() => setActiveTab("history")}
          >
            Query History
          </button>
        </div>

        {/* Query Details */}
        {activeTab === "details" && (
          <div className="query-details">
            <div className="header-card">
              <h2 className="subject">{item.subject || "N/A"}</h2>
              <span className="query-id">Query ID: {item.doc_id}</span>
            </div>

            <div className="details-card">
              <div>
                <strong>Query By:</strong> {item.pers}
              </div>
              <div>
                <strong>Service No:</strong> {item.serviceNo || "N/A"}
              </div>
              <div>
                <strong>Query Type:</strong> {item.querytype}
              </div>
              <div>
                <strong>Pending With:</strong> {item.pending_with_dec}
              </div>
              <div>
                <strong>Date:</strong>{" "}
                {new Date(item.submit_date).toLocaleDateString()}
              </div>
            </div>

            <div className="form-section">
              <div className="form-group">
                <label>Reply</label>
                <textarea
                  placeholder="Type your reply..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={6}
                />
              </div>

              <div className="form-group">
                <label>Reply / Forward To</label>
                <select
                  value={forwardOption}
                  onChange={(e) => setForwardOption(e.target.value)}
                >
                  <option value="">--Select--</option>
                  <option value="Transfer to Supervisor">
                    Transfer to Supervisor
                  </option>
                  <option value="Transfer to Sub-Section">
                    Transfer to Sub-Section
                  </option>
                </select>
              </div>

              {forwardOption === "Transfer to Sub-Section" && (
                <div className="form-group">
                  <label>Select Sub-Section</label>
                  <select
                    value={transferSection}
                    onChange={(e) => setTransferSection(e.target.value)}
                  >
                    <option value="">--Select Sub-Section--</option>
                    <option value="Section A">Section A</option>
                    <option value="Section B">Section B</option>
                    <option value="Section C">Section C</option>
                  </select>
                </div>
              )}

              <div className="form-actions">
                <button className="btn primary" onClick={handleSubmit}>
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <div className="query-history">
            <h3>Previous Replies</h3>
            {item.history?.length > 0 ? (
              item.history.map((h, i) => (
                <div key={i}>
                  <strong>{h.date}:</strong> {h.text}
                </div>
              ))
            ) : (
              <div>No history available</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QueryView;
