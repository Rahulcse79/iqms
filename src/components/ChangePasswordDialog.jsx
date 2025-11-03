import React, { useState } from "react";
import "./ChangePasswordDialog.css";
import { application } from "../utils/endpoints";
import Loader from "./Loader";

const ChangePasswordDialog = ({ onClose, onPasswordChanged }) => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!oldPassword || !newPassword || !confirmPassword) {
      setError("All fields are required.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await application.post("/user/changePassword", {
        oldPassword,
        newPassword,
        confirmPassword,
      });
      if (response.status <= 399) {
        setSuccessMessage(response.message || "Password changed successfully!");
        setTimeout(() => {
          onPasswordChanged();
        }, 2000);
      } else {
        setError(
          response.messageDetail ||
            response.message ||
            "An unknown error occurred."
        );
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.messageDetail ||
        err.response?.data?.message ||
        err.message ||
        "Failed to change password. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cpd-dialog-overlay">
      <div className="cpd-dialog-card">
        <div className="cpd-dialog-header">
          <h2>Change Password</h2>
          <button onClick={onClose} className="cpd-close-button" title="Close">
            ✕
          </button>
        </div>
        <div className="cpd-dialog-body">
          {loading && <Loader text="Updating password..." />}
          {!loading && (
            <form onSubmit={handleSubmit}>
              {error && <div className="cpd-dialog-error">{error}</div>}
              {successMessage && (
                <div className="cpd-dialog-success">{successMessage}</div>
              )}

              <div className="cpd-form-group">
                <label htmlFor="oldPassword">Old Password</label>
                <input
                  type="password"
                  id="oldPassword"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  disabled={loading || successMessage}
                  required
                />
              </div>
              <div className="cpd-form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading || successMessage}
                  required
                />
              </div>
              <div className="cpd-form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading || successMessage}
                  required
                />
              </div>

              <div className="cpd-dialog-actions">
                <button
                  type="button"
                  className="cpd-btn cpd-btn-secondary"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="cpd-btn cpd-btn-primary"
                  disabled={loading || successMessage}
                >
                  Change Password
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordDialog;
