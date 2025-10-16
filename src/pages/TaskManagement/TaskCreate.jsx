import React, { useState, useEffect } from 'react';
import { application } from '../../utils/endpoints';
import './TaskCreate.css';

export default function CreateTask({ TaskName,onClose, onTaskCreated }) {
  // Form state
  const [formData, setFormData] = useState({
    tasksName: '',
    taskDescription: '',
    expectedCompletionDate: '', // stores value from <input type="datetime-local" /> (e.g., "2025-10-13T23:59")
    taskPriority: '',
    taskType: '',
  });

  // Dropdown data state
  const [dropdownData, setDropdownData] = useState({ priorities: [], types: [] });

  // UI state
  const [loading, setLoading] = useState(false);
  const [dropdownLoading, setDropdownLoading] = useState(true);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    fetchDropdownData();
  }, []);

  // Utilities: formatters
  const pad2 = (n) => String(n).padStart(2, '0');

  // Format current local time to "YYYY-MM-DD HH:mm"
  const nowToApi = () => {
    const d = new Date();
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  };

  // Convert <input type="datetime-local"> value like "YYYY-MM-DDTHH:mm" to "YYYY-MM-DD HH:mm"
  const localInputToApi = (value) => (value ? value.replace('T', ' ') : '');

  // Parse datetime-local string to Date for validation
  const localInputToDate = (value) => (value ? new Date(value) : null);

  // Fetch priorities and types from APIs
// Axios-based dropdown fetch using your application.post("endpoint") pattern
const fetchDropdownData = async () => {
  try {
    setDropdownLoading(true);
    setError(null);

    const [prioritiesRes, typesRes] = await Promise.all([
      application.post("taskPriority/listAll"),
      application.post("taskType/listAll"),
    ]);

    const prioritiesData = prioritiesRes?.data;
    const typesData = typesRes?.data;

    if (prioritiesData?.status === 'OK' && typesData?.status === 'OK') {
      setDropdownData({
        priorities: Array.isArray(prioritiesData.data) ? prioritiesData.data : [],
        types: Array.isArray(typesData.data) ? typesData.data : [],
      });
    } else {
      const msg = prioritiesData?.message || typesData?.message || 'Invalid response from dropdown APIs';
      throw new Error(msg);
    }
  } catch (err) {
    setError(`Error loading form data: ${err.message}`);
    // eslint-disable-next-line no-console
    console.error('Error fetching dropdown data:', err);
  } finally {
    setDropdownLoading(false);
  }
};


  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Validate form data
  const validateForm = () => {
    const errors = {};

    if (!formData.tasksName.trim()) {
      errors.tasksName = 'Task name is required';
    } else if (formData.tasksName.trim().length < 3) {
      errors.tasksName = 'Task name must be at least 3 characters';
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
    if (!formData.taskType) errors.taskType = 'Task type is required';

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit handler
const handleSubmit = async (e) => {
  e.preventDefault();
  if (!validateForm()) return;

  try {
    setLoading(true);
    setError(null);

    // Get LOGIN_SNO from userDetails in localStorage
    const userDetailsString = localStorage.getItem('userDetails');
    if (!userDetailsString) {
      throw new Error('User details not found. Please log in again.');
    }
    const userDetails = JSON.parse(userDetailsString);
    const assignedUser = userDetails?.LOGIN_SNO;

    if (!assignedUser) {
      throw new Error('LOGIN_SNO not found in user details. Please log in again.');
    }

    const payload = {
      tasksName: TaskName,
      assignedOn: nowToApi(), // current time at submit
      expectedCompletionDate: localInputToApi(formData.expectedCompletionDate), // exact format
      taskPriority: formData.taskPriority,
      taskType: formData.taskType,
      assignedTo: 2, // fixed
      assignedUser: String(assignedUser), // Use LOGIN_SNO from localStorage
      taskDescription: formData.taskDescription.trim(),
      currentStats: 'New', // always New
    };

    // Axios version using your application instance
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
    // eslint-disable-next-line no-console
    console.error('Error creating task:', err);
  } finally {
    setLoading(false);
  }
};


  // Min attribute for datetime-local (current local date-time, rounded to minutes)
  const getMinDateTimeLocal = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = pad2(d.getMonth() + 1);
    const dd = pad2(d.getDate());
    const hh = pad2(d.getHours());
    const mi = pad2(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
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
          <button onClick={onClose} type="button" className="close-button" aria-label="Close">×</button>
        </div>

        <form onSubmit={handleSubmit} className="create-task-form" noValidate>
          <div className="form-content">
            {/* Task Name */}
            <div className="form-group">
              <label htmlFor="tasksName" className="form-label">DOC ID <span className="required">*</span></label>
              <input
                type="text"
                id="tasksName"
                name="tasksName"
                value={TaskName}
                onChange={handleInputChange}
                className={`form-input ${validationErrors.TaskName ? 'error' : ''}`}
                placeholder="Enter Doc ID"
                maxLength={100}
                autoComplete="off"
              />
              
            </div>

            {/* Task Description */}
            <div className="form-group">
              <label htmlFor="taskDescription" className="form-label">Reply <span className="required">*</span></label>
              <textarea
                id="taskDescription"
                name="taskDescription"
                value={formData.taskDescription}
                onChange={handleInputChange}
                className={`form-textarea ${validationErrors.taskDescription ? 'error' : ''}`}
                placeholder="Enter Reply"
                rows={4}
                maxLength={500}
              />
              {validationErrors.taskDescription && <span className="error-message">{validationErrors.taskDescription}</span>}
              <div className="character-count">{formData.taskDescription.length}/500</div>
            </div>

            {/* Row: Type & Priority */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="taskType" className="form-label">Reply Type <span className="required">*</span></label>
                <select
                  id="taskType"
                  name="taskType"
                  value={formData.taskType}
                  onChange={handleInputChange}
                  className={`form-select ${validationErrors.taskType ? 'error' : ''}`}
                >
                  <option value="">Select Reply type</option>
                  {dropdownData.types.map((t) => (
                    <option key={t.id} value={t.taskType}>{t.taskType}</option>
                  ))}
                </select>
                {validationErrors.taskType && <span className="error-message">{validationErrors.taskType}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="taskPriority" className="form-label">Reply Priority <span className="required">*</span></label>
                <select
                  id="taskPriority"
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

            {/* Expected Completion (date + time) */}
            <div className="form-group">
              <label htmlFor="expectedCompletionDate" className="form-label">Expected Completion <span className="required">*</span></label>
              <input
                type="datetime-local"
                id="expectedCompletionDate"
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
              <div className="error-banner" role="alert">
                <strong>Error:</strong> {error}
              </div>
            )}
          </div>

          <div className="form-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading}>Cancel</button>
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
