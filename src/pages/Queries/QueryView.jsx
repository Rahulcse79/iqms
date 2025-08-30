// src/components/QueryView/QueryView.jsx
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./QueryView.css";
import Comparison from "../Comparison";
import ProfileView from "../ProfileView/ProfileView";
import PostingHistoryTab from "../ProfileView/components/PostingHistoryTab";

const QueryView = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const row = location.state?.row || null;

  const [activeTab, setActiveTab] = useState("details");
  const [queryType, setQueryType] = useState("Personal Data Issue");
  const [replyText, setReplyText] = useState("");
  const [forwardOption, setForwardOption] = useState("");
  const [transferSection, setTransferSection] = useState("");

  if (!row) {
    return (
      <div className="qview-container">
        <div className="qview-card">
          <h3>Query details not found</h3>
          <button className="btn" onClick={() => navigate(-1)}>
            Back
          </button>
        </div>
      </div>
    );
  }

  const handleClose = () => navigate(-1);

  const handleSubmit = () => {
    if (window.confirm("Are you sure you want to submit this reply?")) {
      alert(`
        Reply Submitted!
        Reply: ${replyText}
        Query Type: ${queryType}
        Forwarded To: ${forwardOption}
        Sub-Section: ${transferSection || ""}
      `);
      setReplyText("");
    }
  };

  const renderRightPanel = () => {
    switch (queryType) {
      case "Personal Data Issue":
        return <h2>Personal Data Issue Page</h2>;
      case "Pay Related Issue":
        return <h2>Pay Related Issue Page</h2>;
      case "Comparison Issue":
        return <Comparison />;
      case "Allowance Related Issue":
        return <h2>Allowance Related Issue Page</h2>;
      case "POR Issue":
        return <PostingHistoryTab />;
      case "Profile View":
        return <ProfileView />;
      default:
        return null;
    }
  };

  return (
    <div className="qview-container split-active">
      {/* Close Button */}
      <button className="close-btn" onClick={handleClose}>✕</button>

      {/* Left Panel */}
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
              <h2 className="subject">{row.subject}</h2>
              <span className="query-id">Query ID: {row.queryId}</span>
            </div>

            <div className="details-card">
              <div><strong>Query By:</strong> {row.pers}</div>
              <div><strong>Service No:</strong> {row.serviceNo}</div>
              <div><strong>Query Date:</strong> {row.date}</div>
              <div><strong>Query Type:</strong> {row.type}</div>
              <div><strong>Cell:</strong> {row.cell}</div>
              {row.queryRef && <div><strong>Query Reference(s):</strong> {row.queryRef}</div>}
              {row.porRef && <div><strong>POR Reference(s):</strong> {row.porRef}</div>}
              {row.porRelated && <div><strong>POR Related Queries:</strong> {row.porRelated}</div>}
              {row.particulars && <div><strong>Particulars:</strong> {row.particulars}</div>}
            </div>

            <div className="query-message">
              <h4>Query</h4>
              <p>{row.message}</p>
            </div>

            <div className="remarks-card">
              <h4>Remarks</h4>
              {row.remarks?.map((remark, index) => (
                <div key={index} className="remark-row">
                  <span className="remark-role">{remark.role}:</span>
                  <span className="remark-text">{remark.text}</span>
                  <span className="remark-date">{remark.date}</span>
                </div>
              ))}
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
                  <option value="Transfer to Supervisor">Transfer to Supervisor</option>
                  <option value="Transfer to Sub-Section">Transfer to Sub-Section</option>
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

        {activeTab === "history" && (
          <div className="query-history">
            <h3>Previous Replies</h3>
            {row.history?.map((h, i) => (
              <div key={i}>
                <strong>{h.date}:</strong> {h.text}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right Panel */}
      <div className="right-panel">
        <div className="form-group">
          <label>Type of Query</label>
          <select
            value={queryType}
            onChange={(e) => setQueryType(e.target.value)}
          >
            <option value="Personal Data Issue">Personal Data Issue</option>
            <option value="Pay Related Issue">Pay Related Issue</option>
            <option value="Comparison Issue">Comparison Issue</option>
            <option value="Allowance Related Issue">Allowance Related Issue</option>
            <option value="POR Issue">POR Issue</option>
            <option value="Profile View">Profile View</option>
          </select>
        </div>
        {renderRightPanel()}
      </div>
    </div>
  );
};

export default QueryView;
