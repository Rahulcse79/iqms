import React, { useEffect, useState } from "react";
import "./TaskUpdate.css";
import { application } from "../../utils/endpoints";

/**
 * TaskUpdate component - accepts full task object
 * Usage: <TaskUpdate task={selectedTask} onClose={...} onUpdated={...} />
 * Notes:
 * - Task name is not editable; shown in header and a read-only field.
 * - Status is always visible and required.
 * - When "Mark as Delayed" is ON, both Completion Date & Time and Remarks appear and are required.
 */
export default function TaskUpdate({ task, onClose, onUpdated }) {
  // helpers
  const toLocalInput = (value) =>
    value ? String(value).replace(" ", "T") : "";
  // Keep ISO "T" for backend parsing; do NOT replace with space
  const fromLocalInputToApi = (value) =>
    value ? String(value) : "";
  // Normalize any task props that may have " " to ISO "T"
  const toIsoDateTime = (value) =>
    value ? String(value).replace(" ", "T") : "";

  // initial form data from task object
  const [formData, setFormData] = useState({
    id: task?.id || "",
    tasksName: task?.tasksName || "",
    currentStats: task?.currentStats || "",
    remarks: task?.remarks || "",
    changedCompletionOn: toLocalInput(task?.changedCompletionOn || ""),
    isDelay: !!task?.isDelay,
  });

  const [statusOptions, setStatusOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dropdownLoading, setDropdownLoading] = useState(true);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    // hydrate when task prop changes
    setFormData({
      id: task?.id || "",
      tasksName: task?.tasksName || "",
      currentStats: task?.currentStats || "",
      remarks: task?.remarks || "",
      changedCompletionOn: toLocalInput(task?.changedCompletionOn || ""),
      isDelay: !!task?.isDelay,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?.id]);

  const fetchStatuses = async () => {
    try {
      setDropdownLoading(true);
      setError(null);

      // Axios automatically parses JSON and returns response.data
      const res = await application.post("taskStatus/listAll");

      console.log("Axios Response:", res.data); // Debug log

      // With axios, the parsed JSON is in res.data
      if (res.data?.status === "OK") {
        setStatusOptions(Array.isArray(res.data.data) ? res.data.data : []);
      } else {
        throw new Error(res.data?.message || "Failed to load statuses");
      }
    } catch (err) {
      setError(`Error loading statuses: ${err.message}`);
      console.error("Status dropdown error:", err);
    } finally {
      setDropdownLoading(false);
    }
  };

  // fetch statuses
  useEffect(() => {
    fetchStatuses();
  }, [, ]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : value;
    setFormData((prev) => ({ ...prev, [name]: val }));
    if (validationErrors[name])
      setValidationErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.tasksName.trim())
      errs.tasksName = "Task name missing from context";
    if (!formData.currentStats) errs.currentStats = "Status is required";
    if (formData.isDelay) {
      if (!formData.changedCompletionOn)
        errs.changedCompletionOn = "Completion date & time is required";
      if (!formData.remarks.trim()) errs.remarks = "Remarks are required";
    }
    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);
      setError(null);

      // include task id in payload; coerce to number if numeric
      const idValue = formData.id;

      // Default unchanged fields from incoming `task` prop but normalize date-times to ISO "T"
      const base = task || {};

      const payload = {
        // Always include id and name from formData
        id: idValue,
        tasksName: formData.tasksName.trim(),

        // Defaults from the original task (unchanged fields), normalized to ISO "T"
        assignedOn: toIsoDateTime(base.assignedOn || ""),
        expectedCompletionDate: toIsoDateTime(base.expectedCompletionDate || ""),
        taskPriority: base.taskPriority || "",
        taskType: base.taskType || "",
        assignedTo: base.assignedTo ?? "",
        assignedUser: base.assignedUser ?? "",
        reviewer: base.reviewer ?? "",
        taskDescription: base.taskDescription || "",
        filePath: base.filePath ?? "",
        taskCompletedOn: toIsoDateTime(base.taskCompletedOn ?? ""),

        // Editable fields from the form
        currentStats: formData.currentStats || "",
        isDelay: !!formData.isDelay,
        changedCompletionOn:
          fromLocalInputToApi(formData.changedCompletionOn) || "",
        remarks: formData.remarks?.trim() || "Status Updated",
      };

      console.log("submitting payload", payload);

      // Axios: parsed body is in res.data
      const res = await application.post("taskDetails/update", payload);
      const data = res?.data;

      if (data?.status === "OK") {
        onUpdated && onUpdated(data);
        onClose && onClose();
      } else {
        throw new Error(data?.message || "Update failed");
      }
    } catch (err) {
      setError(`Error updating task: ${err.message}`);
      console.error("Update error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (dropdownLoading) {
    return (
      <div className="update-task-overlay">
        <div className="update-task-modal">
          <div className="loading-container">
            <div className="spinner" />
            <p className="muted">Loading statuses…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="update-task-overlay">
      <div className="update-task-modal">
        <div className="update-task-header">
          <h2>
            Updating{" "}
            <span className="upd-name mono">
              “{formData.tasksName || "N/A"}”
            </span>
          </h2>
          <button
            type="button"
            className="close-button"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="update-task-form" noValidate>
          <div className="form-content">
            {/* Read-only Task Name field to reflect context */}
            <div className="form-group readonly">
              <label className="form-label">Task Name</label>
              <input
                className="form-input"
                value={formData.tasksName}
                readOnly
              />
              {validationErrors.tasksName && (
                <span className="error-message">
                  {validationErrors.tasksName}
                </span>
              )}
            </div>

            {/* Delay toggle always visible */}
            <div className="form-group inline">
              <label htmlFor="isDelay" className="form-label">
                Mark as Delayed
              </label>
              <label className="switch">
                <input
                  type="checkbox"
                  id="isDelay"
                  name="isDelay"
                  checked={formData.isDelay}
                  onChange={handleChange}
                />
                <span className="slider" />
              </label>
            </div>

            {/* Status is always visible */}
            <div className="form-group">
              <label htmlFor="currentStats" className="form-label">
                Status <span className="required">*</span>
              </label>
              <select
                id="currentStats"
                name="currentStats"
                value={formData.currentStats}
                onChange={handleChange}
                className={`form-select ${
                  validationErrors.currentStats ? "error" : ""
                }`}
              >
                <option value="">Select status</option>
                {statusOptions.map((s) => (
                  <option key={s.id} value={s.taskStatus}>
                    {s.taskStatus}
                  </option>
                ))}
              </select>
              {validationErrors.currentStats && (
                <span className="error-message">
                  {validationErrors.currentStats}
                </span>
              )}
            </div>

            {/* When delayed, show required Completion & Remarks */}
            {formData.isDelay && (
              <>
                <div className="form-group">
                  <label htmlFor="changedCompletionOn" className="form-label">
                    Completion Date & Time <span className="required">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    id="changedCompletionOn"
                    name="changedCompletionOn"
                    value={formData.changedCompletionOn}
                    onChange={handleChange}
                    className={`form-input ${
                      validationErrors.changedCompletionOn ? "error" : ""
                    }`}
                  />
                  {validationErrors.changedCompletionOn && (
                    <span className="error-message">
                      {validationErrors.changedCompletionOn}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="remarks" className="form-label">
                    Remarks <span className="required">*</span>
                  </label>
                  <textarea
                    id="remarks"
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleChange}
                    className={`form-textarea ${
                      validationErrors.remarks ? "error" : ""
                    }`}
                    rows={4}
                    maxLength={500}
                    placeholder="Enter reason for delay and any notes"
                  />
                  {validationErrors.remarks && (
                    <span className="error-message">
                      {validationErrors.remarks}
                    </span>
                  )}
                  <div className="character-count">
                    {formData.remarks.length}/500
                  </div>
                </div>
              </>
            )}

            {/* Error banner */}
            {error && (
              <div className="error-banner" role="alert">
                <strong>Error:</strong> {error}
              </div>
            )}
          </div>

          <div className="form-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="button-spinner" />
                  Updating…
                </>
              ) : (
                "Update Task"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
