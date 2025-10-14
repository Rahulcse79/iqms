import React, { useState, useEffect, useMemo } from "react";
import TaskDetails from "./TaskDetails";
import TaskUpdate from "./TaskUpdate";
import { IoEyeSharp } from "react-icons/io5";
import { IoIosBook } from "react-icons/io";
import { FaPen, FaSearch, FaFilter, FaCalendarAlt } from "react-icons/fa";
import TaskHistory from "./TaskHistory";
import "./TaskList.css";

export default function TaskList() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showUpdate, setShowUpdate] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Filter and search states
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all"); // all, critical, urgent, normal
  const [userFilter, setUserFilter] = useState("all");
  const [dateRangeFilter, setDateRangeFilter] = useState("all"); // all, today, week, month, overdue

  // API configuration from environment variables
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const BEARER_TOKEN = process.env.REACT_APP_BEARER_TOKEN;

  // API payload
  const apiPayload = useMemo(
    () => ({
      currentPage: 0,
      pageSize: 100, // Increased to get more tasks for better sorting
      sortDirection: "desc",
      sortBy: "createdOn",
      search: "",
      sortDataType: "integer",
      advancedFilters: [],
    }),
    []
  );

  // Calculate business days between two dates (excluding weekends)
  const getBusinessDaysDifference = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    let businessDays = 0;
    let currentDate = new Date(start);

    while (currentDate <= end) {
      const dayOfWeek = currentDate.getDay();
      // 0 = Sunday, 6 = Saturday
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        businessDays++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return businessDays;
  };

  // Get priority level and color for a task based on expected completion date
  const getTaskPriority = (expectedCompletionDate) => {
    if (!expectedCompletionDate) {
      return { priority: "unknown", color: "#666666", label: "No Date", urgencyScore: 999 };
    }

    try {
      let dateStr = expectedCompletionDate;
      if (typeof dateStr === "string" && dateStr.includes(" ") && !dateStr.includes("T")) {
        dateStr = dateStr.replace(" ", "T");
      }

      const expectedDate = new Date(dateStr);
      const currentDate = new Date();
      const today = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
      const expectedDateOnly = new Date(expectedDate.getFullYear(), expectedDate.getMonth(), expectedDate.getDate());

      // Calculate business days difference
      const businessDaysLeft = getBusinessDaysDifference(today, expectedDateOnly);
      const totalDaysLeft = Math.ceil((expectedDateOnly - today) / (1000 * 60 * 60 * 24));

      // If the expected date has passed
      if (totalDaysLeft < 0) {
        return { priority: "overdue", color: "#DC2626", label: "Overdue", urgencyScore: 0 };
      }

      // Critical: Due today or business days <= 1
      if (totalDaysLeft === 0 || businessDaysLeft <= 1) {
        return { priority: "critical", color: "#DC2626", label: "Critical", urgencyScore: 1 };
      }

      // Urgent: Due within 1 week (7 days) or business days <= 5
      if (totalDaysLeft <= 7 || businessDaysLeft <= 5) {
        return { priority: "urgent", color: "#F59E0B", label: "Urgent", urgencyScore: 2 };
      }

      // Normal: More than 1 week
      return { priority: "normal", color: "#10B981", label: "Normal", urgencyScore: 3 };

    } catch (error) {
      console.error("Error parsing date:", expectedCompletionDate, error);
      return { priority: "unknown", color: "#666666", label: "Invalid Date", urgencyScore: 999 };
    }
  };

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
      return d.toLocaleDateString() + " " + d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    } catch (_) {
      return String(value);
    }
  };

  // Enhanced date formatting for expected completion with relative time
  const formatExpectedDate = (value) => {
    if (!value) return "N/A";
    try {
      let v = value;
      if (typeof v === "string" && v.includes(" ") && !v.includes("T")) {
        v = v.replace(" ", "T");
      }
      const d = new Date(v);
      if (isNaN(d.getTime())) return String(value);

      const today = new Date();
      const diffTime = d - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const formattedDate = d.toLocaleDateString();

      if (diffDays < 0) {
        return `${formattedDate} (${Math.abs(diffDays)} days overdue)`;
      } else if (diffDays === 0) {
        return `${formattedDate} (Today)`;
      } else if (diffDays === 1) {
        return `${formattedDate} (Tomorrow)`;
      } else if (diffDays <= 7) {
        return `${formattedDate} (${diffDays} days)`;
      } else {
        return formattedDate;
      }
    } catch (_) {
      return String(value);
    }
  };

  // Get unique users for filter dropdown
  const uniqueUsers = useMemo(() => {
    const users = [...new Set(tasks.map(task => task.assignedUser).filter(Boolean))];
    return users.sort();
  }, [tasks]);

  // Filter and sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks;

    // Search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(task => 
        (task.tasksName?.toLowerCase().includes(search)) ||
        (task.assignedUser?.toLowerCase().includes(search)) ||
        (task.remarks?.toLowerCase().includes(search))
      );
    }

    // Priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter(task => {
        const priority = getTaskPriority(task.expectedCompletionDate);
        return priority.priority === priorityFilter;
      });
    }

    // User filter
    if (userFilter !== "all") {
      filtered = filtered.filter(task => task.assignedUser === userFilter);
    }

    // Date range filter
    if (dateRangeFilter !== "all") {
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

      filtered = filtered.filter(task => {
        if (!task.expectedCompletionDate) return dateRangeFilter === "all";

        try {
          let dateStr = task.expectedCompletionDate;
          if (typeof dateStr === "string" && dateStr.includes(" ") && !dateStr.includes("T")) {
            dateStr = dateStr.replace(" ", "T");
          }
          const taskDate = new Date(dateStr);
          const taskDateOnly = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate());

          switch (dateRangeFilter) {
            case "today":
              return taskDateOnly.getTime() === todayStart.getTime();
            case "week":
              const weekEnd = new Date(todayStart);
              weekEnd.setDate(weekEnd.getDate() + 7);
              return taskDateOnly >= todayStart && taskDateOnly <= weekEnd;
            case "month":
              const monthEnd = new Date(todayStart);
              monthEnd.setMonth(monthEnd.getMonth() + 1);
              return taskDateOnly >= todayStart && taskDateOnly <= monthEnd;
            case "overdue":
              return taskDateOnly < todayStart;
            default:
              return true;
          }
        } catch {
          return false;
        }
      });
    }

    // Sort by priority (most urgent first), then by expected completion date
    filtered.sort((a, b) => {
      const priorityA = getTaskPriority(a.expectedCompletionDate);
      const priorityB = getTaskPriority(b.expectedCompletionDate);

      // First sort by urgency score (lower score = more urgent)
      if (priorityA.urgencyScore !== priorityB.urgencyScore) {
        return priorityA.urgencyScore - priorityB.urgencyScore;
      }

      // If same urgency, sort by date (earlier dates first)
      if (a.expectedCompletionDate && b.expectedCompletionDate) {
        const dateA = new Date(a.expectedCompletionDate.replace(" ", "T"));
        const dateB = new Date(b.expectedCompletionDate.replace(" ", "T"));
        return dateA - dateB;
      }

      return 0;
    });

    return filtered;
  }, [tasks, searchTerm, priorityFilter, userFilter, dateRangeFilter]);

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

  const handleHistoryTask = (task) => {
    setSelectedTask(task);
    setShowHistory(true);
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedTask(null);
  };

  const handleCloseUpdate = () => {
    setShowUpdate(false);
    setSelectedTask(null);
  };

  const handleCloseHistory = () => {
    setShowHistory(false);
    setSelectedTask(null);
  };

  const handleRefresh = () => {
    fetchTasks();
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setPriorityFilter("all");
    setUserFilter("all");
    setDateRangeFilter("all");
  };

  // Priority statistics
  const priorityStats = useMemo(() => {
    const stats = { overdue: 0, critical: 0, urgent: 0, normal: 0, unknown: 0 };
    tasks.forEach(task => {
      const priority = getTaskPriority(task.expectedCompletionDate);
      stats[priority.priority]++;
    });
    return stats;
  }, [tasks]);

  if (loading) {
    return (
      <div className="task-list-container">

          <p>Loading tasks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="task-list-container">
        <div className="error-message">
          <h3>Error loading tasks</h3>
          <p>{error}</p>
          <button className="retry-button" onClick={handleRefresh}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="task-list-container">
      {/* Header */}
      <div className="task-list-header">
        <div>
          <h2>Interim Reply</h2>
          <div className="priority-stats">
            <span className="stat overdue">Overdue: {priorityStats.overdue}</span>
            <span className="stat critical">Critical: {priorityStats.critical}</span>
            <span className="stat urgent">Urgent: {priorityStats.urgent}</span>
            <span className="stat normal">Normal: {priorityStats.normal}</span>
          </div>
        </div>
        <div className="header-actions">
          <button className="refresh-button" onClick={handleRefresh}>
            Refresh
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="table-toolbar">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search tasks, users, or remarks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="toolbar-actions">
          <select 
            className="filter-select"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="all">All Priorities</option>
            <option value="overdue">Overdue</option>
            <option value="critical">Critical</option>
            <option value="urgent">Urgent</option>
            <option value="normal">Normal</option>
          </select>

          <select 
            className="filter-select"
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
          >
            <option value="all">All Users</option>
            {uniqueUsers.map(user => (
              <option key={user} value={user}>{user}</option>
            ))}
          </select>

          <select 
            className="filter-select"
            value={dateRangeFilter}
            onChange={(e) => setDateRangeFilter(e.target.value)}
          >
            <option value="all">All Dates</option>
            <option value="overdue">Overdue</option>
            <option value="today">Due Today</option>
            <option value="week">Due This Week</option>
            <option value="month">Due This Month</option>
          </select>

          <button className="clear-filters-button" onClick={clearAllFilters}>
            Clear Filters
          </button>
        </div>
      </div>

      {/* Results Summary */}
      <div className="results-summary">
        Showing {filteredAndSortedTasks.length} of {tasks.length} tasks
      </div>

      {/* Table */}
      <div className="table-container">
        {filteredAndSortedTasks.length === 0 ? (
          <div className="no-tasks">
            <p>No tasks found matching your criteria</p>
          </div>
        ) : (
          <table className="tasks-table">
            <thead>
              <tr>
                <th>Priority</th>
                <th>Task Name</th>
                <th>Expected Completion</th>
                <th>Assigned User</th>
                <th>Remarks</th>
                <th>Assigned On</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedTasks.map((task, index) => {
                const priority = getTaskPriority(task.expectedCompletionDate);
                return (
                  <tr key={task.id || index} className={`priority-${priority.priority}`}>
                    <td>
                      <div className="priority-indicator">
                        <div 
                          className="priority-dot" 
                          style={{ backgroundColor: priority.color }}
                          title={`${priority.label} Priority`}
                        ></div>
                        <span className="priority-label">{priority.label}</span>
                      </div>
                    </td>
                    <td className="task-name">{task?.tasksName ?? "—"}</td>
                    <td className="completion-date">
                      {formatExpectedDate(task?.expectedCompletionDate)}
                    </td>
                    <td className="assigned-user">{task?.assignedUser || "N/A"}</td>
                    <td className="remarks" title={task?.remarks || "N/A"}>
                      {task?.remarks || "N/A"}
                    </td>
                    <td className="assigned-on">{formatDate(task?.assignedOn)}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="view-button"
                          onClick={() => handleViewTask(task)}
                          title="View Details"
                        >
                          <IoEyeSharp />
                        </button>
                        <button
                          className="view-button"
                          onClick={() => handleUpdateTask(task)}
                          title="Update Task"
                        >
                          <FaPen />
                        </button>
                        <button
                          className="view-button"
                          onClick={() => handleHistoryTask(task)}
                          title="View History"
                        >
                          <IoIosBook />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
      {showDetails && selectedTask && (
        <TaskDetails task={selectedTask} onClose={handleCloseDetails} />
      )}
      {showUpdate && selectedTask && (
        <TaskUpdate 
          task={selectedTask} 
          onClose={handleCloseUpdate}
          onRefresh={handleRefresh}
        />
      )}
      {showHistory && selectedTask && (
        <TaskHistory task={selectedTask} onClose={handleCloseHistory} />
      )}
    </div>
  );
}