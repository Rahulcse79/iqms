import React, { useState } from "react";
import axios from "axios";
import "./QueryDetails.css";
import { useQuery } from "@tanstack/react-query";
import FeedbackDialog from "../../components/FeedbackDialog"; // adjust path if needed

const fetchQueryDetails = async (queryId) => {
  const url = `http://sampoorna.cao.local/afcao/ipas/ivrs/searchQuery_docId/${queryId}`;
  const { data } = await axios.get(url);
  return data.items && data.items.length > 0 ? data.items[0] : null;
};

const QueryDetails = ({ queryId, onBack }) => {
  const [activeTab, setActiveTab] = useState("details");
  const [replyText, setReplyText] = useState("");
  const [forwardOption, setForwardOption] = useState("");
  const [transferSection, setTransferSection] = useState("");
  const [formError, setFormError] = useState("");
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);

  
  const { data: item, isLoading, isError, error } = useQuery({
    queryKey: ["query", queryId], // ✅ cached by ID
    queryFn: () => fetchQueryDetails(queryId),
    enabled: !!queryId, // only run when queryId exists
    retry: 2,           // auto-retry failed requests
    staleTime: 1000 * 60 * 5, // cache for 5 min
  });

  const handleSubmit = () => {
    if (!replyText.trim()) {
      setFormError("Reply cannot be empty.");
      return;
    }
    if (!forwardOption) {
      setFormError("Please select an option from 'Reply / Forward To'.");
      return;
    }
    if (forwardOption === "Transfer to Sub-Section" && !transferSection) {
      setFormError("Please select a sub-section.");
      return;
    }

    setFormError("");
    console.log("Submitted:", { replyText, forwardOption, transferSection });

    setReplyText("");
    setForwardOption("");
    setTransferSection("");
    setShowFeedbackDialog(true);
  };

  if (isLoading) return <div className="qdetails-container">Loading...</div>;
  if (isError)
    return (
      <div className="qdetails-container">
        <div className="qdetails-card">
          <h3>Error fetching query: {error.message}</h3>
          {onBack && (
            <button className="btn" onClick={onBack}>
              Back
            </button>
          )}
        </div>
      </div>
    );
  if (!item) return <div className="qdetails-container">No data found.</div>;

  return (
    <div className="qdetails-container split-active">
      {onBack && (
        <button className="btn back-btn" onClick={onBack}>
          ← Back
        </button>
      )}

      <div className="query-details-page">
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
                {formError && <div className="form-error">{formError}</div>}
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

      {/* Feedback Dialog */}
      <FeedbackDialog
        open={showFeedbackDialog}
        onClose={() => setShowFeedbackDialog(false)}
      />
    </div>
  );
};

export default QueryDetails;
