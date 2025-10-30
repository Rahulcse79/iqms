// src/components/ExtensionDialog.jsx
import React, { useState } from "react";
import PropTypes from "prop-types";
import "./ExtensionDialog.css";

const ExtensionDialog = ({ onSubmit }) => {
  const [extension, setExtension] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = extension.trim();

    if (!trimmed) {
      setError("Extension number cannot be empty");
      return;
    }
    if (!/^\d+$/.test(trimmed)) {
      setError("Extension number must be numeric only");
      return;
    }

    setError("");
    onSubmit(trimmed);
  };

  return (
    <div className="extension-dialog-overlay" role="dialog" aria-modal="true">
      <div className="extension-dialog-box">
        <h2 className="extension-dialog-title">Enter Your Extension Number</h2>
        <p className="extension-dialog-desc">
          Please enter the extension number you are currently working on.
        </p>

        <form onSubmit={handleSubmit} className="extension-dialog-form">
          <input
            type="text"
            value={extension}
            onChange={(e) => setExtension(e.target.value)}
            className="extension-dialog-input"
            placeholder="e.g. 1023"
            inputMode="numeric"
            pattern="[0-9]*"
            required
          />
          {error && <p className="extension-dialog-error">{error}</p>}

          <button type="submit" className="extension-dialog-btn">
            Continue
          </button>
        </form>
      </div>
    </div>
  );
};

ExtensionDialog.propTypes = {
  onSubmit: PropTypes.func.isRequired,
};

export default ExtensionDialog;
