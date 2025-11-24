import React, { useState, useEffect } from 'react';
import { application } from '../../utils/endpoints';
import './TaskCreate.css';


export default function FeedbackCreate({ onClose, onTaskCreated }) {
  // Form state
  const [formData, setFormData] = useState({
    tasksName: '',
    taskDescription: '',
    taskType: '',
  });


 
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});


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


    // Validate tasksName from formData (user input)
    if (!formData.tasksName.trim()) {
      errors.tasksName = 'Task name (DOC ID) is required';
    }


    if (!formData.taskDescription.trim()) {
      errors.taskDescription = 'Task description is required';
    } else if (formData.taskDescription.trim().length < 10) {
      errors.taskDescription = 'Task description must be at least 10 characters';
    }


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
        tasksName: formData.tasksName.trim(), // Use form data instead of prop
        assignedOn: nowToApi(),
        taskType: "Feedback",
        assignedTo: 2,
        assignedUser: String(assignedUser),
        taskDescription: formData.taskDescription.trim(),
        currentStats: 'New',
      };


      // Axios version using your application instance
      const res = await application.post("task/create", payload);
      const data = res?.data;


      if (data?.status === 'OK') {
        onTaskCreated && onTaskCreated(data);
        setFormData({
          tasksName: '',
          taskDescription: '',
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


  return (
    <div className="create-task-overlay">
      <div className="create-task-modal">
        <div className="create-task-header">
          <h2>Create Feedback</h2>
          <button onClick={onClose} type="button" className="close-button" aria-label="Close">×</button>
        </div>


        <form onSubmit={handleSubmit} className="create-task-form" noValidate>
          <div className="form-content">
            {/* Task Name */}
            <div className="form-group">
              <label htmlFor="tasksName" className="form-label">Feedback Heading <span className="required">*</span></label>
              <input
                type="text"
                id="tasksName"
                name="tasksName"
                value={formData.tasksName}
                onChange={handleInputChange}
                className={`form-input ${validationErrors.tasksName ? 'error' : ''}`}
                placeholder="Enter Feedback Name"
                autoComplete="off"
              />
              {validationErrors.tasksName && <span className="error-message">{validationErrors.tasksName}</span>}
            </div>


            {/* Task Description */}
            <div className="form-group">
              <label htmlFor="taskDescription" className="form-label">Feedback Description <span className="required">*</span></label>
              <textarea
                id="taskDescription"
                name="taskDescription"
                value={formData.taskDescription}
                onChange={handleInputChange}
                className={`form-textarea ${validationErrors.taskDescription ? 'error' : ''}`}
                placeholder="Enter Feedback Description"
                rows={4}
                maxLength={500}
              />
              {validationErrors.taskDescription && <span className="error-message">{validationErrors.taskDescription}</span>}
              <div className="character-count">{formData.taskDescription.length}/500</div>
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
                'Create Feedback'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
