// ConfirmDialog.jsx - Theme Compatible with Screen Center & Full App Blocking

import React from "react";
import ReactDOM from "react-dom";
import PropTypes from "prop-types";
import "./ConfirmDialog.css";

const ConfirmDialog = ({ 
  open, 
  onConfirm, 
  onCancel,
  loading = false,
  error = null,
  title = "Confirm Submission",
  children,
  disabled = false
}) => {
  // Don't render if not open
  if (!open) return null;

  // Create portal to render at body level (ensures screen center positioning)
  const dialogContent = (
    <div className="dialog-overlay" onClick={(e) => {
      // Only close if clicking the overlay itself, not the dialog
      if (e.target === e.currentTarget && !loading) {
        onCancel?.();
      }
    }}>
      <div 
        className={`dialog-container ${loading ? 'dialog-loading' : ''}`}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside dialog
      >
        {/* Header */}
        <div className="dialog-header">
          <h3 className="dialog-title">
            {loading && (
              <span className="loading-spinner" style={{ marginRight: '8px' }}></span>
            )}
            {title}
          </h3>
        </div>
        
        {/* Content */}
        <div className="dialog-content">
          {error ? (
            <div className="dialog-error">
              <div className="error-icon">⚠️</div>
              <div className="error-message">{error}</div>
            </div>
          ) : (
            <div className="dialog-message">
              {children || "Do you want to submit the query?"}
            </div>
          )}
        </div>
        
        {/* Actions */}
        <div className="dialog-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={loading}
          >
            {loading ? "Please wait..." : "Cancel"}
          </button>
          
          {!error && onConfirm && (
            <button
              type="button"
              className={`btn btn-primary ${loading ? 'btn-loading' : ''}`}
              onClick={onConfirm}
              disabled={loading || disabled}
            >
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  Submitting...
                </>
              ) : (
                "Confirm"
              )}
            </button>
          )}
        </div>
        
        {/* Progress indicator when loading */}
        {loading && (
          <div className="dialog-progress">
            <div className="progress-bar">
              <div className="progress-fill"></div>
            </div>
            <small className="progress-text">Processing your request...</small>
          </div>
        )}
      </div>
    </div>
  );

  // Use React Portal to render at document.body level
  // This ensures the dialog appears at screen center, not relative to parent container
  return ReactDOM.createPortal(
    dialogContent,
    document.body
  );
};

ConfirmDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onConfirm: PropTypes.func,
  onCancel: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  error: PropTypes.string,
  title: PropTypes.string,
  children: PropTypes.node,
  disabled: PropTypes.bool
};

export default ConfirmDialog;