import React, { useState, useEffect } from 'react';
import { application } from '../../utils/endpoints';
import './TaskCreate.css';

export default function CreateTask({ TaskName, onClose, onTaskCreated }) {

  const [formData, setFormData] = useState({
    tasksName: '',
    taskDescription: '',
    expectedCompletionDate: '',
    taskPriority: '',
    taskType: '', // unused, but keeping for safety
  });

  const [dropdownData, setDropdownData] = useState({ priorities: [] });

  const [loading, setLoading] = useState(false);
  const [dropdownLoading, setDropdownLoading] = useState(true);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    fetchDropdownData();
  }, []);

  useEffect(() => {
    if (TaskName) {
      setFormData((prev) => ({ ...prev, tasksName: TaskName }));
    }
  }, [TaskName]);

  const pad2 = (n) => String(n).padStart(2, '0');

  const nowToApi = () => {
    const d = new Date();
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  };

  const localInputToApi = (value) => (value ? value.replace('T', ' ') : '');
  const localInputToDate = (value) => (value ? new Date(value) : null);

  // ⛔ REMOVED taskType API — only priority is fetched now
  const fetchDropdownData = async () => {
    try {
      setDropdownLoading(true);
      setError(null);

      const prioritiesRes = await application.post("taskPriority/listAll");

      const prioritiesData = prioritiesRes?.data;

      if (prioritiesData?.status === 'OK') {
        setDropdownData({
          priorities: Array.isArray(prioritiesData.data) ? prioritiesData.data : []
        });
      } else {
        throw new Error(prioritiesData?.message || 'Invalid response from priority API');
      }
    } catch (err) {
      setError(`Error loading form data: ${err.message}`);
      console.error('Error fetching dropdown data:', err);
    } finally {
      setDropdownLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (TaskName == null || String(TaskName).trim() === '') {
      errors.tasksName = 'Task name (DOC ID) is required';
    }

    if (!formData.taskDescription.trim()) {
      errors.taskDescription = 'Task description is required';
    } else if (formData.taskDescription.trim().length < 10) {
      errors.taskDescription = 'Task description must be at least 10 characters';
    }

    if (!formData.expectedCompletionDate) {
      errors.expectedCompletionDate = 'Expected completion date & time is required';
    } else {
      const selected = localInputToDate(formData.expectedCompletionDate);
      const now = new Date();
      if (selected && selected < now) {
        errors.expectedCompletionDate = 'Expected completion cannot be in the past';
      }
    }

    if (!formData.taskPriority) errors.taskPriority = 'Task priority is required';

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError(null);

      const userDetailsString = localStorage.getItem('userDetails');
      if (!userDetailsString) throw new Error('User details not found. Please log in again.');

      const userDetails = JSON.parse(userDetailsString);
      const assignedUser = userDetails?.LOGIN_SNO;
      if (!assignedUser) throw new Error('LOGIN_SNO not found in user details.');

      const payload = {
        tasksName: TaskName,
        assignedOn: nowToApi(),
        expectedCompletionDate: localInputToApi(formData.expectedCompletionDate),
        taskPriority: formData.taskPriority,
        taskType: "Interim Reply", // hardcoded
        assignedTo: 2,
        assignedUser: String(assignedUser),
        taskDescription: formData.taskDescription.trim(),
        currentStats: 'New',
      };

      const res = await application.post("task/create", payload);
      const data = res?.data;

      if (data?.status === 'OK') {
        onTaskCreated && onTaskCreated(data);

        setFormData({
          tasksName: '',
          taskDescription: '',
          expectedCompletionDate: '',
          taskPriority: '',
          taskType: ''
        });

        onClose && onClose();
      } else {
        throw new Error(data?.message || 'Failed to create task');
      }

    } catch (err) {
      setError(`Error creating task: ${err.message}`);
      console.error('Error creating task:', err);
    } finally {
      setLoading(false);
    }
  };

  const getMinDateTimeLocal = () => {
    const d = new Date();
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  };

  if (dropdownLoading) {
    return (
      <div className="create-task-overlay">
        <div className="create-task-modal">
          <div className="loading-container">
            <div className="spinner" />
            <p className="muted">Loading form data…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="create-task-overlay">
      <div className="create-task-modal">
        <div className="create-task-header">
          <h2>Create Interim Reply</h2>
          <button onClick={onClose} type="button" className="close-button">×</button>
        </div>

        <form onSubmit={handleSubmit} className="create-task-form" noValidate>
          <div className="form-content">

            <div className="form-group">
              <label>DОC ID <span className="required">*</span></label>
              <input
                type="text"
                value={TaskName || ''}
                readOnly
                className={`form-input ${validationErrors.tasksName ? 'error' : ''}`}
              />
              {validationErrors.tasksName && <span className="error-message">{validationErrors.tasksName}</span>}
            </div>

            <div className="form-group">
              <label>Reply <span className="required">*</span></label>
              <textarea
                name="taskDescription"
                value={formData.taskDescription}
                onChange={handleInputChange}
                className={`form-textarea ${validationErrors.taskDescription ? 'error' : ''}`}
                rows={4}
                maxLength={500}
                placeholder="Enter Reply"
              />
              {validationErrors.taskDescription && <span className="error-message">{validationErrors.taskDescription}</span>}
              <div className="character-count">{formData.taskDescription.length}/500</div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Reply Priority <span className="required">*</span></label>
                <select
                  name="taskPriority"
                  value={formData.taskPriority}
                  onChange={handleInputChange}
                  className={`form-select ${validationErrors.taskPriority ? 'error' : ''}`}
                >
                  <option value="">Select priority</option>
                  {dropdownData.priorities.map((p) => (
                    <option key={p.id} value={p.taskPriority}>{p.taskPriority}</option>
                  ))}
                </select>
                {validationErrors.taskPriority && <span className="error-message">{validationErrors.taskPriority}</span>}
              </div>
            </div>

            <div className="form-group">
              <label>Expected Completion <span className="required">*</span></label>
              <input
                type="datetime-local"
                name="expectedCompletionDate"
                value={formData.expectedCompletionDate}
                onChange={handleInputChange}
                className={`form-input ${validationErrors.expectedCompletionDate ? 'error' : ''}`}
                min={getMinDateTimeLocal()}
              />
              {validationErrors.expectedCompletionDate && (
                <span className="error-message">{validationErrors.expectedCompletionDate}</span>
              )}
            </div>

            {error && (
              <div className="error-banner">
                <strong>Error:</strong> {error}
              </div>
            )}

          </div>

          <div className="form-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading}>
              Cancel
            </button>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <div className="button-spinner" />
                  Creating…
                </>
              ) : (
                'Create Reply'
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
