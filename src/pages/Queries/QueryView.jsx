// src/components/QueryView/QueryView.jsx
import React, { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import "./QueryView.css";
import Comparison from "../Comparison";
import ProfileView from "../ProfileView/ProfileView";
import PostingHistoryTab from "../ProfileView/components/PostingHistoryTab";
import QueryDetails from "./QueryDetails";

const QueryView = ({ onBack }) => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const row = location.state?.row || null;

  const [queryType, setQueryType] = useState("Personal Data Issue");

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
      <button className="close-btn" onClick={handleClose}>
        ✕
      </button>

      {/* Left Panel (Reusable Component) */}
      <div className="left-panel">
        <QueryDetails queryId={id} onBack={onBack} />
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
            <option value="Allowance Related Issue">
              Allowance Related Issue
            </option>
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
