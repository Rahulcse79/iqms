import React, { useState, useEffect, useMemo } from "react";
import TaskDetails from "./TaskDetails";
import TaskUpdate from "./TaskUpdate";
import { IoEyeSharp } from "react-icons/io5";
import { IoIosBook } from "react-icons/io";
import { FaPen, FaSearch, FaFilter, FaCalendarAlt } from "react-icons/fa";
import TaskHistory from "./TaskHistory";
import { application } from "../../utils/endpoints";
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

  const isDelayedTask = (t) => t?.isDelay === true;

  const getExpectedCompletionDisplay = (t) =>
    isDelayedTask(t)
      ? t.changedCompletionOn ?? t.expectedCompletionDate
      : t.expectedCompletionDate;

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
/**
 * Compute priority from expected completion, with delay-aware swap.
 * Backward-compatible:
 * - Pass a task object: getTaskPriority(task)
 * - Or pass a date string/Date: getTaskPriority(expectedCompletionDate)
 * - Or pass a date with explicit options: getTaskPriority(date, { isDelay, changedCompletionOn, expectedCompletionDate })
 */
const getTaskPriority = (input, opts = {}) => {
  // Normalize/parse expected date with swap logic
  const pickExpected = () => {
    // Case 1: input is a task-like object
    if (input && typeof input === "object" && (
        "expectedCompletionDate" in input ||
        "changedCompletionOn" in input ||
        "isDelay" in input
      )) {
      const delayed = input?.isDelay === true;
      return delayed
        ? (input.changedCompletionOn ?? input.expectedCompletionDate)
        : input.expectedCompletionDate;
    }

    // Case 2: input is a primitive/date, but opts provided for swap hints
    if (opts && (
        "isDelay" in opts ||
        "changedCompletionOn" in opts ||
        "expectedCompletionDate" in opts
      )) {
      const delayed = opts?.isDelay === true;
      return delayed
        ? (opts.changedCompletionOn ?? opts.expectedCompletionDate ?? input)
        : (opts.expectedCompletionDate ?? input);
    }

    // Case 3: legacy behavior (input is a date)
    return input;
  };

  const expectedRaw = pickExpected();

  if (!expectedRaw) {
    return {
      priority: "unknown",
      color: "#666666",
      label: "No Date",
      urgencyScore: 999,
    };
  }

  try {
    // Robust parse: normalize "YYYY-MM-DD HH:mm" -> "YYYY-MM-DDTHH:mm"
    const toDate = (v) => {
      let s = v;
      if (typeof s === "string" && s.includes(" ") && !s.includes("T")) {
        s = s.replace(" ", "T");
      }
      return new Date(s);
    };

    const expectedDate = toDate(expectedRaw);
    if (isNaN(expectedDate.getTime())) {
      // Parsing failed
      return {
        priority: "unknown",
        color: "#666666",
        label: "Invalid Date",
        urgencyScore: 999,
      };
    }

    // Compare using date-only precision
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const expectedDateOnly = new Date(
      expectedDate.getFullYear(),
      expectedDate.getMonth(),
      expectedDate.getDate()
    );

    // Business days helper assumed available in your file
    const businessDaysLeft = getBusinessDaysDifference(today, expectedDateOnly);

    const msPerDay = 24 * 60 * 60 * 1000;
    const totalDaysLeft = Math.ceil((expectedDateOnly - today) / msPerDay);

    // Overdue
    if (totalDaysLeft < 0) {
      return {
        priority: "overdue",
        color: "#DC2626",
        label: "Overdue",
        urgencyScore: 0,
      };
    }

    // Critical: due today OR <= 1 business day remaining
    if (totalDaysLeft === 0 || businessDaysLeft <= 1) {
      return {
        priority: "critical",
        color: "#DC2626",
        label: "Critical",
        urgencyScore: 1,
      };
    }

    // Urgent: due within 7 days OR <= 5 business days remaining
    if (totalDaysLeft <= 7 || businessDaysLeft <= 5) {
      return {
        priority: "urgent",
        color: "#F59E0B",
        label: "Urgent",
        urgencyScore: 2,
      };
    }

    // Normal
    return {
      priority: "normal",
      color: "#10B981",
      label: "Normal",
      urgencyScore: 3,
    };
  } catch (error) {
    console.error("Error parsing date:", input, error);
    return {
      priority: "unknown",
      color: "#666666",
      label: "Invalid Date",
      urgencyScore: 999,
    };
  }
};


  // Robust date parsing for "YYYY-MM-DD HH:mm" -> replace space with T for Date()
  const formatDate = (value) => {
    if (!value) return "N/A";
    try {
      let v = value;
      // Support "YYYY-MM-DD HH:mm" by normalizing the separator
      if (typeof v === "string" && v.includes(" ") && !v.includes("T")) {
        v = v.replace(" ", "T");
      }

      const d = new Date(v);
      if (isNaN(d.getTime())) return String(value);

      // Build dd/Month/yyyy using Intl for reliable month names
      const parts = new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).formatToParts(d);

      const dd =
        parts.find((p) => p.type === "day")?.value ??
        String(d.getDate()).padStart(2, "0");
      const month =
        parts.find((p) => p.type === "month")?.value ??
        d.toLocaleString("en-GB", { month: "long" });
      const yyyy =
        parts.find((p) => p.type === "year")?.value ?? String(d.getFullYear());

      const dateStr = `${dd}/${month}/${yyyy}`;
      const timeStr = d.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      return `${dateStr} ${timeStr}`;
    } catch (_) {
      return String(value);
    }
  };

  // Enhanced date formatting for expected completion with relative time
  const formatExpectedDate = (value) => {
    if (!value) return "N/A";
    try {
      let v = value;
      // Normalize "YYYY-MM-DD HH:mm" -> "YYYY-MM-DDTHH:mm" for safe parsing
      if (typeof v === "string" && v.includes(" ") && !v.includes("T")) {
        v = v.replace(" ", "T");
      }

      const d = new Date(v);
      if (isNaN(d.getTime())) return String(value);

      // Build dd/Month/yyyy
      const MONTHS = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      const dd = String(d.getDate()).padStart(2, "0");
      const month = MONTHS[d.getMonth()];
      const yyyy = d.getFullYear();
      const formattedDate = `${dd}/${month}/${yyyy}`;

      // Compare calendar days (normalize both to local midnight)
      const startOf = (dt) =>
        new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
      const todayStart = startOf(new Date());
      const targetStart = startOf(d);

      // Use rounding to be resilient to DST (23/25-hour days)
      const msPerDay = 24 * 60 * 60 * 1000;
      const diffDays = Math.round((targetStart - todayStart) / msPerDay);

      if (diffDays < 0) {
        const days = Math.abs(diffDays);
        return `${formattedDate} (${days} day${days !== 1 ? "s" : ""} overdue)`;
      } else if (diffDays === 0) {
        return `${formattedDate} (Today)`;
      } else if (diffDays === 1) {
        return `${formattedDate} (Tomorrow)`;
      } else if (diffDays <= 7) {
        return `${formattedDate} (${diffDays} days)`;
      } else {
        return formattedDate;
      }
    } catch {
      return String(value);
    }
  };

  // Get unique users for filter dropdown
  const uniqueUsers = useMemo(() => {
    const users = [
      ...new Set(tasks.map((task) => task.assignedUser).filter(Boolean)),
    ];
    return users.sort();
  }, [tasks]);

  // Filter and sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks;

    // Search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (task) =>
          task.tasksName?.toLowerCase().includes(search) ||
          task.assignedUser?.toLowerCase().includes(search) ||
          task.remarks?.toLowerCase().includes(search)
      );
    }

    // Priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter((task) => {
        // Wherever you compute priority (e.g., filtered.sort or rendering):
        const priority = getTaskPriority(getExpectedCompletionDisplay(task));
        return priority.priority === priorityFilter;
      });
    }

    // User filter
    if (userFilter !== "all") {
      filtered = filtered.filter((task) => task.assignedUser === userFilter);
    }

    // Date range filter
    if (dateRangeFilter !== "all") {
      const today = new Date();
      const todayStart = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );

      // Inside the dateRangeFilter block:
      filtered = filtered.filter((task) => {
        const exp = getExpectedCompletionDisplay(task);
        if (!exp) return dateRangeFilter === "all";
        try {
          const v =
            typeof exp === "string" && exp.includes(" ") && !exp.includes("T")
              ? exp.replace(" ", "T")
              : exp;
          const taskDate = new Date(v);
          const today = new Date();
          const todayStart = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate()
          );
          const taskDateOnly = new Date(
            taskDate.getFullYear(),
            taskDate.getMonth(),
            taskDate.getDate()
          );

          switch (dateRangeFilter) {
            case "today":
              return taskDateOnly.getTime() === todayStart.getTime();
            case "week": {
              const weekEnd = new Date(todayStart);
              weekEnd.setDate(weekEnd.getDate() + 7);
              return taskDateOnly >= todayStart && taskDateOnly <= weekEnd;
            }
            case "month": {
              const monthEnd = new Date(todayStart);
              monthEnd.setMonth(monthEnd.getMonth() + 1);
              return taskDateOnly >= todayStart && taskDateOnly <= monthEnd;
            }
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
      // 1) urgency score using derived expected dates
      const priorityA = getTaskPriority(getExpectedCompletionDisplay(a));
      const priorityB = getTaskPriority(getExpectedCompletionDisplay(b));
      if (priorityA.urgencyScore !== priorityB.urgencyScore) {
        return priorityA.urgencyScore - priorityB.urgencyScore;
      }

      // 2) fallback sort by derived expected date (earlier first)
      const ea = getExpectedCompletionDisplay(a);
      const eb = getExpectedCompletionDisplay(b);
      if (ea && eb) {
        const da = new Date(String(ea).replace(" ", "T"));
        const db = new Date(String(eb).replace(" ", "T"));
        return da - db;
      }
      return 0;
    });

    return filtered;
  }, [tasks, searchTerm, priorityFilter, userFilter, dateRangeFilter]);

  // Normalize various backend shapes to an array
  const normalizeTasks = (data) => {
    // Handle null/undefined
    if (data == null) return [];

    // New paginated shape
    if (Array.isArray(data.currentPageData)) return data.currentPageData;

    // Legacy shapes
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.content)) return data.content;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.results)) return data.results;

    // Single object fallback
    if (typeof data === "object") return [data];

    return [];
  };

  // Fetch tasks from API
  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await application.post("/task/list", apiPayload);

      if (response.data?.status === "OK") {
        const arr = normalizeTasks(response.data?.data);
        setTasks(arr); // still an array in both old and new formats
      } else {
        throw new Error(response.data?.message || "Failed to fetch tasks");
      }
    } catch (err) {
      console.error("Error fetching tasks:", err);
      setTasks([]); // ensure array to avoid map errors
      if (err.response) {
        setError(err.response.data.message || "An error occurred");
      } else {
        setError(err.message || "An unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount
  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [5000]);

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

  // Swap-aware helpers (per task)

  const getChangedCompletionDisplay = (t) =>
    isDelayedTask(t) ? t.expectedCompletionDate : t.changedCompletionOn;

  // Priority statistics
  const priorityStats = useMemo(() => {
    const stats = { overdue: 0, critical: 0, urgent: 0, normal: 0, unknown: 0 };
    tasks.forEach((task) => {
      const priority = getTaskPriority(task);

      stats[priority.priority]++;
    });
    return stats;
  }, [tasks]);

  if (loading) {
    return (
      <div className="task-list-container">
        <p>Loading Interim Replys...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="task-list-container">
        <div className="error-message">
          <h3>Error loading Interim Replys</h3>
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
            <span className="stat overdue">
              Overdue: {priorityStats.overdue}
            </span>
            <span className="stat critical">
              Critical: {priorityStats.critical}
            </span>
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
            {uniqueUsers.map((user) => (
              <option key={user} value={user}>
                {user}
              </option>
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
                <th>Doc Id</th>
                <th>Expected Completion</th>
                <th>Reply</th>
                <th>Assigned On</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedTasks.map((task, index) => {
                const priority = getTaskPriority(task);

                return (
                  <tr
                    key={task.id || index}
                    className={`priority-${priority.priority}`}
                  >
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
                      {formatExpectedDate
                        ? formatExpectedDate(getExpectedCompletionDisplay(task))
                        : formatDate(getExpectedCompletionDisplay(task))}
                    </td>
                    <td className="remarks" title={task?.taskDescription || "N/A"}>
                      {task?.taskDescription || "N/A"}
                    </td>
                    <td className="assigned-on">
                      {formatDate(task?.assignedOn)}
                    </td>
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
