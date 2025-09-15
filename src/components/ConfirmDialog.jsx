// src/components/ConfirmDialog.jsx
import React from "react";
import PropTypes from "prop-types";
import "./ConfirmDialog.css";

const ConfirmDialog = ({ open, onConfirm, onCancel }) => {
  if (!open) return null;

  return (
    <div className="cd-overlay" role="dialog" aria-modal="true" aria-labelledby="cd-title">
      <div className="cd-container">
        <h3 id="cd-title" className="cd-title">
          Confirmation
        </h3>
        <p className="cd-message">Do you want to submit the query?</p>
        <div className="cd-actions">
          <button className="cd-btn primary button-text-color" onClick={onConfirm}>
            Confirm
          </button>
          <button className="cd-btn" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

ConfirmDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default ConfirmDialog;
