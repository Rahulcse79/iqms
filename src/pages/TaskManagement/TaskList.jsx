import React, { useState, useEffect, useMemo } from "react";
import TaskDetails from "./TaskDetails";
import TaskUpdate from "./TaskUpdate"
import "./TaskList.css";

export default function TaskList() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showUpdate, setShowUpdate] = useState(false);

  // API configuration from environment variables
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const BEARER_TOKEN = process.env.REACT_APP_BEARER_TOKEN;

  // API payload
  const apiPayload = useMemo(
    () => ({
      currentPage: 0,
      pageSize: 10,
      sortDirection: "desc",
      sortBy: "createdOn",
      search: "",
      sortDataType: "integer",
      advancedFilters: [],
    }),
    []
  );

  // Normalize various backend shapes to an array
  const normalizeTasks = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.content)) return data.content;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.results)) return data.results;
    if (data == null) return [];
    if (typeof data === "object") return [data];
    return [];
  };

  // Robust date parsing for "YYYY-MM-DD HH:mm" -> replace space with T for Date()
  const formatDate = (value) => {
    if (!value) return "N/A";
    try {
      let v = value;
      if (typeof v === "string" && v.includes(" ") && !v.includes("T")) {
        v = v.replace(" ", "T");
      }
      const d = new Date(v);
      if (isNaN(d.getTime())) return String(value);
      return d.toLocaleDateString() + " " + d.toLocaleTimeString();
    } catch (_) {
      return String(value);
    }
  };

  // Fetch tasks from API
  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${API_BASE_URL}/services/api/v2/task/listAll`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${BEARER_TOKEN}`,
          },
          body: JSON.stringify(apiPayload),
        }
      );

      if (!response.ok) {
        const txt = await response.text();
        throw new Error(
          `HTTP ${response.status}: ${txt || response.statusText}`
        );
      }

      const result = await response.json();
      if (result?.status === "OK") {
        const arr = normalizeTasks(result?.data);
        setTasks(arr);
      } else {
        throw new Error(result?.message || "Failed to fetch tasks");
      }
    } catch (err) {
      console.error("Error fetching tasks:", err);
      setTasks([]); // ensure array to avoid map errors
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount
  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleViewTask = (task) => {
    setSelectedTask(task);
    setShowDetails(true);
  };

  const handleUpdateTask = (task) => {
    setSelectedTask(task);
    setShowUpdate(true);
  };
  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedTask(null);
  };
  const handleCloseupdate = () => {
    setShowUpdate(false);
    setSelectedTask(null);
  };

  const handleRefresh = () => {
    fetchTasks();
  };

  if (loading) {
    return <div className="task-list-container">Loading</div>;
  }

  if (error) {
    return (
      <div className="task-list-container">
        <div className="error-message">
          <h3>Error Loading Tasks</h3>
          <p>{error}</p>
          <button onClick={handleRefresh} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const safeTasks = Array.isArray(tasks) ? tasks : [];

  return (
    <div className="task-list-container">
      <div className="task-list-header">
        <h2>Interim Reply</h2>
        <button onClick={handleRefresh} className="refresh-button">
          Refresh
        </button>
      </div>

      {safeTasks.length === 0 ? (
        <div className="no-tasks">
          <p>No tasks found</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="tasks-table">
            <thead>
              <tr>
                <th>Doc ID</th>
                <th>Expected Completion</th>
                <th>Assigned User</th>
                <th>Remarks</th>
                <th>Assigned On</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {safeTasks.map((task, idx) => (
                <tr key={task?.id ?? `${task?.tasksName ?? "row"}-${idx}`}>
                  <td className="task-name">{task?.tasksName ?? "—"}</td>
                  <td className="completion-date">
                    {formatDate(task?.expectedCompletionDate)}
                  </td>
                  <td className="assigned-user">
                    {task?.assignedUser || "N/A"}
                  </td>
                  <td className="remarks">{task?.remarks || "N/A"}</td>
                  <td className="assigned-on">
                    {formatDate(task?.assignedOn)}
                  </td>
                  <td className="action">
                    <button
                      onClick={() => handleViewTask(task)}
                      className="view-button"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleUpdateTask(task)}
                      className="view-button"
                    >
                      Update
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showDetails && selectedTask && (
        <TaskDetails task={selectedTask} onClose={handleCloseDetails} />
      )}

      {showUpdate && selectedTask && (
        <TaskUpdate task={selectedTask} onClose={handleCloseupdate} />
      )}
    </div>
  );
}
