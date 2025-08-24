import React, { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import "./QueryView.css";

const QueryView = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const row = location.state?.row || null;

  const [activeTab, setActiveTab] = useState("details");
  const [queryType, setQueryType] = useState("General");
  const [replyText, setReplyText] = useState("");
  const [forwardOption, setForwardOption] = useState(""); // Reply / Forward to
  const [transferSection, setTransferSection] = useState(""); // Only if sub-section selected

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

  const handleSubmit = () => {
    if (window.confirm("Are you sure you want to submit this reply?")) {
      alert(`
        Reply Submitted!
        Reply: ${replyText}
        Query Type: ${queryType}
        Forwarded To: ${forwardOption}
        Sub-Section: ${transferSection || "N/A"}
      `);
      setReplyText("");
    }
  };

  return (
    <div className="qview-container">
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
          {/* Header */}
          <div className="header-card">
            <h2 className="subject">
              {row.subject || "Subject: Pay & Allowances"}
            </h2>
            <span className="query-id">Query ID: {row.queryId}</span>
          </div>

          {/* Info Section */}
          <div className="details-card">
            <div>
              <strong>Query By:</strong> {row.queryBy || "SGT RAJU RAU"}
            </div>
            <div>
              <strong>Service No:</strong> {row.serviceNo || "31267414"}
            </div>
            <div>
              <strong>Query Date:</strong> {row.date || "10 Aug 2023"}
            </div>
            <div>
              <strong>Particulars:</strong>{" "}
              {row.particulars || "Pay & Allowances"}
            </div>
            <div>
              <strong>Query Type:</strong> {row.type || "Financial"}
            </div>
            <div>
              <strong>POR Related Queries:</strong>{" "}
              {row.porRelated || "106847730"}
            </div>
            <div>
              <strong>Query Reference(s):</strong> {row.queryRef || "10J025"}
            </div>
            <div>
              <strong>POR Reference(s):</strong> {row.porRef || "None"}
            </div>
            <div>
              <strong>Cell:</strong> {row.cell || "Cal"}
            </div>
          </div>

          {/* Query Body */}
          <div className="query-message">
            <h4>Query</h4>
            <p>
              {row.message ||
                `I was enrolled in IAF on 01 Oct 2008 in Group 'X'. As per SAFI 1/S/2008 dated 18 Oct 2008, Section III Para 13 (a) my pay in pay band was fixed to Rs. 6460, But as por Section - III 13 (b) if emoluments in the pre-revised pay scale(s) (Basic pay plus Dearness pay plus Dearness Allowance applicable on the date of joining) exceeds the sum of pay fixed in the revised pay structure and applicable dearness allowance thereon, the difference shall be allowed as personal pay to be absorbed in future increments in pay. On 01 Oct 2008 my emoluments in pre-revised pay scale was basic pay Rs. 3675, Dearness Pay Rs. 1838 and Dearness allowance Rs. 2977 (DA @ 54% on date 01 Jul 2008) and total was Rs. 8490. As per Section - III Para 13 (a) my pay in pay band was fixed to Rs. 6460 and Dearness Allowance Rs. 1034 (DA @ 16% on date 01 Jul 2008) and total was Rs. Rs. 7490 (Rs. 7494 7494 round off to next multiple of 10). But difference Rs 8490-Rs 7490-Rs 1000 was never ver absorbed in my future increments. It is requested to look into this matter and do needful action as earliest.`}
            </p>
          </div>

          {/* Remarks */}
          <div className="remarks-card">
            <h4>Remarks</h4>

            <div className="remark-row">
              <span className="remark-role">Adjutant Reply:</span>
              <span className="remark-text">
                Forwarded for necessary action.
              </span>
              <span className="remark-date">Date: 12-Aug-2020</span>
            </div>

            <div className="remark-row">
              <span className="remark-role">SAO Reply:</span>
              <span className="remark-text">
                Forwarded for necessary action.
              </span>
              <span className="remark-date">Date: 12-Aug-2015 12:32:54</span>
            </div>
          </div>

          {/* Form Section */}
          <div className="form-section">
            {/* Query Type */}
            <div className="form-group">
              <label>Type of Query</label>
              <select
                value={queryType}
                onChange={(e) => setQueryType(e.target.value)}
              >
                <option value="General">General</option>
                <option value="Technical">Technical</option>
                <option value="Financial">Financial</option>
              </select>
            </div>

            {/* Reply Box */}
            <div className="form-group">
              <label>Reply</label>
              <textarea
                placeholder="Type your reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={6}
              />
            </div>

            {/* Reply/Forward Dropdown */}
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

            {/* Sub-Section Dropdown (Conditional) */}
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

            {/* Submit Button */}
            <div className="form-actions">
              <button className="btn primary" onClick={handleSubmit}>
                Submit
              </button>
              <button className="btn" onClick={() => navigate(-1)}>
                Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Query History */}
      {activeTab === "history" && (
        <div className="query-history">
          <h3>Previous Replies</h3>
          <ul>
            <li>
              <strong>12 Aug:</strong> Reply from Admin - "Please submit docs"
            </li>
            <li>
              <strong>14 Aug:</strong> Reply from User - "Docs submitted"
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default QueryView;
