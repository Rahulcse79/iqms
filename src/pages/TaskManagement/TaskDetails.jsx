import React from 'react';
import './TaskDetails.css';

export default function TaskDetails({ task, onClose }) {
  if (!task) return null;

  // Safer date formatter (supports "YYYY-MM-DD HH:mm")
  const formatDate = (value) => {
    if (!value) return 'N/A';
    try {
      let v = value;
      if (typeof v === 'string' && v.includes(' ') && !v.includes('T')) {
        v = v.replace(' ', 'T');
      }
      const d = new Date(v);
      if (isNaN(d.getTime())) return String(value);
      return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
    } catch {
      return String(value);
    }
  };

  const priorityAttr = (task.taskPriority || '').toLowerCase();
  const statusAttr = (task.currentStats || '').toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="task-details-overlay">
      <div className="task-details-modal">
        <div className="task-details-header">
          <div className="task-hero">
            <div className="hero-left">
              <h2 className="task-title">
                <span className="task-id mono">#{task.id}</span>
                <span className="task-name-hero">{task.tasksName || 'Untitled Task'}</span>
              </h2>
              <div className="hero-chips">
                <span className="chip" data-chip="type">{task.taskType || 'N/A'}</span>
                <span className="chip" data-chip="priority" data-priority={priorityAttr}>{task.taskPriority || 'N/A'}</span>
              </div>
            </div>
            <div className="hero-right">
              <span className="status-large" data-status={statusAttr}>{task.currentStats || 'N/A'}</span>
            </div>
          </div>
          <button onClick={onClose} className="close-button" aria-label="Close">×</button>
        </div>

        <div className="task-details-content">
          <div className="content-grid">
            {/* Overview */}
            <section className="panel overview">
              <header className="panel-header"><span className="hdr-dot"/>Overview</header>
              <div className="kv">
                <div className="kv-row"><div className="kv-label">Description</div><div className="kv-value">{task.taskDescription || 'N/A'}</div></div>
                <div className="kv-row"><div className="kv-label">Assigned User</div><div className="kv-value">{task.assignedUser || 'N/A'}</div></div>
                <div className="kv-row"><div className="kv-label">Assigned Group</div><div className="kv-value">{task.assignedGroup || 'N/A'}</div></div>
                <div className="kv-row"><div className="kv-label">Reviewer</div><div className="kv-value">{task.reviewer || 'N/A'}</div></div>
              </div>
            </section>

            {/* Assignment */}
            <section className="panel assignment">
              <header className="panel-header"><span className="hdr-dot"/>Assignment</header>
              <div className="kv">
                <div className="kv-row"><div className="kv-label">Assigned To (ID)</div><div className="kv-value">{task.assignedTo ?? 'N/A'}</div></div>
                <div className="kv-row"><div className="kv-label">Assigned On</div><div className="kv-value">{formatDate(task.assignedOn)}</div></div>
                <div className="kv-row"><div className="kv-label">User Designation</div><div className="kv-value">{task.assignedUserDesignation || 'N/A'}</div></div>
                <div className="kv-row"><div className="kv-label">Reviewer Designation</div><div className="kv-value">{task.reviewerDesignation || 'N/A'}</div></div>
              </div>
            </section>

            {/* Creation & Update */}
            <section className="panel creation">
              <header className="panel-header"><span className="hdr-dot"/>Creation & Update</header>
              <div className="kv">
                <div className="kv-row"><div className="kv-label">Created By</div><div className="kv-value">{task.createdBy || 'N/A'}</div></div>
                <div className="kv-row"><div className="kv-label">Created On</div><div className="kv-value">{formatDate(task.createdOn)}</div></div>
                <div className="kv-row"><div className="kv-label">Updated By</div><div className="kv-value">{task.updatedBy || 'N/A'}</div></div>
                <div className="kv-row"><div className="kv-label">Updated On</div><div className="kv-value">{formatDate(task.updatedOn)}</div></div>
              </div>
            </section>

            {/* Timeline (right rail) */}
            <aside className="panel timeline">
              <header className="panel-header"><span className="hdr-dot"/>Timeline</header>
              <ol className="tl">
                <li>
                  <span className="dot"/>
                  <div className="tl-row"><div className="tl-label">Expected Completion</div><div className="tl-value">{formatDate(task.expectedCompletionDate)}</div></div>
                </li>
                <li>
                  <span className="dot"/>
                  <div className="tl-row"><div className="tl-label">Due Date</div><div className="tl-value">{formatDate(task.dueDate)}</div></div>
                </li>
                <li>
                  <span className="dot"/>
                  <div className="tl-row"><div className="tl-label">Completed</div><div className="tl-value">{task.isTaskCompleted ? 'Yes' : 'No'}</div></div>
                </li>
                <li>
                  <span className="dot"/>
                  <div className="tl-row"><div className="tl-label">Completed On</div><div className="tl-value">{formatDate(task.taskCompletedOn)}</div></div>
                </li>
                <li>
                  <span className="dot"/>
                  <div className="tl-row"><div className="tl-label">Changed Completion</div><div className="tl-value">{formatDate(task.changedCompletionOn)}</div></div>
                </li>
                <li>
                  <span className="dot"/>
                  <div className="tl-row">
                    <div className="tl-label">Delay</div>
                    <div className={`tl-value ${task.isDelay ? 'warn' : ''}`}>{task.isDelay === null ? 'N/A' : task.isDelay ? 'Yes' : 'No'}</div>
                  </div>
                </li>
              </ol>
            </aside>

            {/* Additional (full width) */}
            <section className="panel additional full">
              <header className="panel-header"><span className="hdr-dot"/>Additional</header>
              <div className="note-block">
                <div className="note-title">Remarks</div>
                <div className="note-body">{task.remarks || 'No remarks provided.'}</div>
              </div>
              <div className="chips-row">
                <span className="chip ghost" data-chip="file">{task.filePath || 'No file'}</span>
                <span className="chip ghost" data-chip="closed-by">Closed By: {task.taskClosedBy || 'N/A'}</span>
              </div>
            </section>
          </div>
        </div>

        <div className="task-details-footer">
          <button onClick={onClose} className="close-details-button">Close</button>
        </div>
      </div>
    </div>
  );
}
