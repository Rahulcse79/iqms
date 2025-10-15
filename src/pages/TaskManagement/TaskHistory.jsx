import React, { useEffect, useMemo, useState } from 'react';
import './TaskHistory.css';
import { application } from '../../utils/endpoints';

/**
 * TaskHistory – Popup modal timeline for a task's status changes
 * Namespaced styles with root .thistory to avoid global collisions
 *
 * Flexible props:
 * - task?: object with { id, tasksName }
 * - taskId?: string|number
 * - onClose?: () => void
 */
export default function TaskHistory({ task, taskId: taskIdProp, onClose }) {
  const taskId = task?.id ?? taskIdProp;
  const taskName = task?.tasksName ?? '';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const ENV_BASE = process.env.REACT_APP_API_BASE_URL;


  // Parse strings like "2025-10-13 17:12:11 pm"
  const parseWhen = (value) => {
    if (!value) return null;
    try {
      let v = String(value).trim();
      const m = v.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([ap]m)?/i);
      if (m) {
        const date = m[1];
        let hh = parseInt(m[2], 10);
        const mm = m[3];
        const ss = m[4] || '00';
        const ap = (m[5] || '').toLowerCase();
        if (ap === 'pm' && hh < 12) hh += 12;
        if (ap === 'am' && hh === 12) hh = 0;
        const hhStr = String(hh).padStart(2, '0');
        v = `${date}T${hhStr}:${mm}:${ss}`;
        const d = new Date(v);
        return isNaN(d.getTime()) ? null : d;
      }
      const alt = v.replace(' ', 'T');
      const d = new Date(alt);
      return isNaN(d.getTime()) ? null : d;
    } catch {
      return null;
    }
  };

  const formatWhen = (value) => {
    const d = parseWhen(value);
    if (!d) return 'N/A';
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
  };

  const normalizeArray = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.content)) return data.content;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.results)) return data.results;
    if (data == null) return [];
    if (typeof data === 'object') return [data];
    return [];
  };


  // Axios-based, correct endpoint and response handling
const fetchHistory = async () => {
  if (taskId === undefined || taskId === null || taskId === '') return;
  try {
    setLoading(true);
    setError(null);

    // Use correct endpoint ("listAll/:taskId"); avoid fetch-style res.ok/json()
    const res = await application.post(`taskDetails/listAll/${taskId}`);
    const data = res?.data;

    if (data?.status === 'OK') {
      const arr = normalizeArray(data.data);
      arr.sort((a, b) => {
        const da = parseWhen(a?.statusUpdatedOn)?.getTime() || 0;
        const db = parseWhen(b?.statusUpdatedOn)?.getTime() || 0;
        return db - da;
      });
      setItems(arr);
    } else {
      throw new Error(data?.message || 'Failed to fetch history');
    }
  } catch (err) {
    setError(err.message || 'Unknown error');
    setItems([]);
    // eslint-disable-next-line no-console
    console.error('History fetch error:', err);
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
    fetchHistory();
  }, [taskId], 5000);

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((it) =>
      (it?.taskStats || '').toLowerCase().includes(q) ||
      (it?.statusUpdatedBy || '').toLowerCase().includes(q) ||
      (it?.remarks || '').toLowerCase().includes(q)
    );
  }, [items, search]);

  return (
    <div className="thistory">
      <div className="th-overlay">
        <div className="th-modal">
          <div className="th-header">
            <div className="th-title">
              <h2>Task History</h2>
              {taskName ? (
                <span className="th-task-chip">{taskName}</span>
              ) : null}
              {taskId !== undefined && taskId !== null && taskId !== '' ? (
                <span className="th-sub th-mono"># {taskId}</span>
              ) : null}
            </div>
            <div className="th-actions">
              <div className="th-search-box">
                <span className="th-search-icon">🔎</span>
                <input
                  className="th-search-input"
                  placeholder="Search status, user, remarks"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button className="th-btn th-btn--ghost" onClick={fetchHistory}>Refresh</button>
              {onClose && (
                <button className="th-btn" onClick={onClose} aria-label="Close">Close</button>
              )}
            </div>
          </div>

          <div className="th-content">
            {taskId === undefined || taskId === null || taskId === '' ? (
              <div className="th-empty">No task selected</div>
            ) : loading ? (
              <div className="th-loading">
                <div className="th-skel" />
                <div className="th-skel" />
                <div className="th-skel" />
              </div>
            ) : error ? (
              <div className="th-error">
                <strong>Error:</strong> {error}
              </div>
            ) : filtered.length === 0 ? (
              <div className="th-empty">No history found</div>
            ) : (
              <div className="th-timeline">
                <ol className="th-tl">
                  {filtered.map((it) => {
                    const statusAttr = String(it?.taskStats || '').toLowerCase().replace(/\s+/g, '-');
                    const isDelay = it?.isDelay === true;
                    return (
                      <li key={it.id} className="th-tl-item">
                        <span className="th-dot" />
                        <div className="th-card">
                          <div className="th-row-top">
                            <span className="th-chip th-chip--status" data-status={statusAttr}>{it.taskStats || '—'}</span>
                            <span className="th-when">{formatWhen(it.statusUpdatedOn)}</span>
                          </div>
                          <div className="th-row-meta">
                            <span className="th-by">By: <span className="th-mono">{it.statusUpdatedBy || 'N/A'}</span></span>
                            {it.statusUpdatedByDesignation && (
                              <span className="th-desig">{it.statusUpdatedByDesignation}</span>
                            )}
                            {isDelay && (
                              <span className="th-chip th-chip--delay">Delayed</span>
                            )}
                            {isDelay && it.changedCompletionOn && (
                              <span className="th-cc">New completion: {formatWhen(it.changedCompletionOn)}</span>
                            )}
                          </div>
                          <div className="th-remarks">
                            <div className="th-remark-title">Remarks</div>
                            <div className="th-remark-body">{it.remarks || '—'}</div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}
          </div>
          {/* Optional footer */}
          {/* <div className="th-footer"><button className="th-btn" onClick={onClose}>Close</button></div> */}
        </div>
      </div>
    </div>
  );
}
