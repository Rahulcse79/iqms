import React from "react";
import PropTypes from "prop-types";
import "./FeedbackDialog.css";

const FeedbackDialog = ({ open, onClose }) => {
  if (!open) return null;

  const handleFeedbackClick = () => {
    window.open("https://example.com/feedback", "_blank", "noopener,noreferrer");
  };

  return (
    <div className="fd-overlay" role="dialog" aria-modal="true" aria-labelledby="fd-title">
      <div className="fd-container">
        <h3 id="fd-title" className="fd-title">
          Thank You!
        </h3>
        <p className="fd-message">
          Thank you for replying to this query. Please visit the link below to submit your feedback.
        </p>
        <div className="fd-actions">
          <button className="fd-btn primary" onClick={handleFeedbackClick}>
            Give Feedback
          </button>
          <button className="fd-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

FeedbackDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default FeedbackDialog;