// === QueryView.jsx ===
import React, { useState } from 'react';
import { FiSearch, FiPlus, FiDownload, FiEye, FiX, FiRefreshCcw } from 'react-icons/fi';

import NewQuery from './NewQuery';
import './QueryView.css';

// import the mock data layer
import {
  getServiceByNo,
  getQueriesByService,
  getRemarksByQueryNo,
  createQuery,
} from './data';

function StatusBadge({ status }) {
  const s = (status || '').toLowerCase();
  const cls = `status-badge ${s || 'unknown'}`;
  return <span className={cls}>{status || '-'}</span>;
}

export default function QueryView() {
  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [displayList, setDisplayList] = useState([]);
  const [formData, setFormData] = useState(null);

  // modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalRemarks, setModalRemarks] = useState([]);
  const [replyText, setReplyText] = useState('');

  const [newQueryOpen, setNewQueryOpen] = useState(false);

  const [searchError, setSearchError] = useState('');

  // search service and load queries (uses data.js)
  function handleSearch() {
    const svc = (searchQuery || '').trim();
    setSearchError('');
    if (!svc) {
      setSearchError('Please enter a service number to search.');
      return;
    }

    const svcObj = getServiceByNo(svc);
    if (!svcObj) {
      setSearchError(`Service number "${svc}" not found.`);
      setHasSearched(false);
      setFormData(null);
      setDisplayList([]);
      return;
    }

    const list = getQueriesByService(svcObj.serviceNo);
    setFormData(svcObj);
    setDisplayList(list);
    setHasSearched(true);
    setModalOpen(false);
    setModalRemarks([]);
  }

  // Reset the page without reload
  function handleReset() {
    setSearchQuery('');
    setHasSearched(false);
    setDisplayList([]);
    setFormData(null);
    setModalOpen(false);
    setModalRemarks([]);
    setReplyText('');
    setNewQueryOpen(false);
    setSearchError('');
  }

  function handleViewFromTable(q) {
    // try to fetch remarks from data layer (if any)
    const remarks = getRemarksByQueryNo(q.queryNo);
    // fallback sample if none
    const out = (remarks && remarks.length) ? remarks : [
      { id: 1, sender: 'User', text: `Initial message: Request regarding ${q.subject}.`, date: q.date + ' 09:12' },
      { id: 2, sender: 'Officer', text: 'Acknowledged. Forwarded to Admin section.', date: q.date + ' 11:05' },
    ];

    setModalTitle(`${q.queryNo} — ${q.subject}`);
    setModalRemarks(out);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setModalRemarks([]);
    setReplyText('');
  }

  function exportCSV() {
    if (!displayList.length) {
      alert('No queries to export.');
      return;
    }
    const headers = ['QueryNo', 'Subject', 'Status', 'Date', 'Priority'];
    const rows = displayList.map(q => [q.queryNo, q.subject, q.status, q.date, q.priority]);
    const csv = [headers, ...rows]
      .map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `queries_${formData ? formData.serviceNo : 'export'}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function sendReply() {
    if (!replyText.trim()) { alert('Write a reply before sending.'); return; }
    // In a real app you'd call API to save remark — here we simulate
    alert('Reply submitted (simulation)');
    setReplyText('');
  }

  // Handler passed to NewQuery. It receives the payload built by NewQuery and persists it via data.createQuery
  function handleCreateQuery(payload) {
    try {
      // persist in mock DB
      const saved = createQuery(payload);
      // update the UI list (prepend)
      setDisplayList(prev => [saved, ...prev]);
      // close the modal
      setNewQueryOpen(false);
    } catch (err) {
      // basic error handling
      console.error("Failed to create query:", err);
      alert("Failed to create query (mock). See console.");
    }
  }

  return (
    <div className="query-container">
      <header className="header">
        <div className="header-left">
          <h1 className="title">Query Management</h1>
          <div className="subtitle">
            {hasSearched ? (
              <>Viewing queries for <strong>{formData.serviceNo}</strong></>
            ) : (
              <>Search a service number to get started</>
            )}
          </div>
        </div>

        <div className="header-right">
          <div className="search-bar">
            <FiSearch className="search-icon" />
            <input
              placeholder="Enter Service Number (e.g. SVC1001)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button className="btn btn-primary" onClick={handleSearch}><FiSearch /> Search</button>
            {hasSearched && (
              <button className="btn btn-secondary" onClick={handleReset}><FiRefreshCcw /> Reset</button>
            )}
          </div>

          {hasSearched && (
            <>
              <button className="btn btn-secondary" onClick={exportCSV}><FiDownload /> Export</button>
              <button className="btn btn-primary" onClick={() => setNewQueryOpen(true)}><FiPlus /> New Query</button>
            </>
          )}
        </div>
      </header>

      {/* optional search error */}
      {searchError && <div className="search-error" style={{ maxWidth: 960, margin: '8px auto', color: '#b91c1c' }}>{searchError}</div>}

      {!hasSearched ? (
        <div className="search-help big">Enter the service number to load personal data and queries.</div>
      ) : (
        <>
          <main className="layout">
            <div className="details">
              <article className="card query-details">
                <div className="details-top">
                  <div className="avatar">{(formData.firstName || 'U').charAt(0)}</div>
                  <div className="main-meta">
                    <div className="name">{formData.firstName} {formData.middleName} {formData.lastName}</div>
                    <div className="meta"><strong>{formData.rank} • {formData.region}</strong></div>
                    <div className="meta small"><strong>{formData.address1} • +{formData.isdCode} {formData.mobile}</strong></div>
                    <div className="meta small"><strong>{formData.email}</strong></div>
                    <div className="meta small">Service No: <strong>{formData.serviceNo}</strong></div>
                  </div>
                  <div className="actions-meta">
                    <div className="small-row">
                      <div className="chip">Retired</div>
                      <StatusBadge status="Open" />
                    </div>
                    <div className="meta small">Active Queries: <strong>{displayList.length}</strong></div>
                  </div>
                </div>

                <div className="details-grid">
                  <div className="detail-card"><div className="label">Country</div><div className="value">India</div></div>
                  <div className="detail-card"><div className="label">State</div><div className="value">{formData.state}</div></div>
                  <div className="detail-card"><div className="label">Pincode</div><div className="value">{formData.pincode}</div></div>
                  <div className="detail-card"><div className="label">Forwarded Section</div><div className="value">{formData.forwardedSection}</div></div>
                </div>
              </article>
            </div>

            <aside className="list">
              <div className="card">
                <div className="list-header">
                  <h3>Your Queries</h3>
                  <div className="result-count">{displayList.length} results</div>
                </div>

                <div className="table-wrap">
                  <table className="query-table">
                    <thead>
                      <tr>
                        <th>Query No</th>
                        <th>Subject</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayList.map(q => (
                        <tr key={q.id}>
                          <td className="mono">{q.queryNo}</td>
                          <td>{q.subject}</td>
                          <td><StatusBadge status={q.status} /></td>
                          <td>{q.date}</td>
                          <td>
                            <button className="btn btn-ghost small" onClick={() => handleViewFromTable(q)} title="View"><FiEye /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="list-footer">
                  <div>Showing 1 to {displayList.length} of {displayList.length}</div>
                  <div className="pagination">
                    <button className="btn btn-ghost small">Prev</button>
                    <button className="btn btn-primary small">1</button>
                    <button className="btn btn-ghost small">Next</button>
                  </div>
                </div>
              </div>
            </aside>
          </main>

          {/* Remarks modal */}
          {modalOpen && (
            <div className="modal-root">
              <div className="modal-overlay" onClick={closeModal}></div>
              <div className="modal-card" role="dialog" aria-modal="true">
                <div className="modal-header">
                  <div className="modal-title">{modalTitle}</div>
                  <button className="modal-close" onClick={closeModal}><FiX /></button>
                </div>
                <div className="modal-body">
                  <div className="remarks-list">
                    {modalRemarks.map(r => (
                      <div key={r.id} className="remark">
                        <div className="r-left"><div className="r-avatar">{r.sender.charAt(0)}</div></div>
                        <div className="r-right">
                          <div className="r-meta"><strong>{r.sender}</strong> <span className="r-date">{r.date}</span></div>
                          <div className="r-text">{r.text}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="modal-footer">
                  <textarea placeholder="Add a remark..." value={replyText} onChange={(e) => setReplyText(e.target.value)} />
                  <div className="modal-actions">
                    <button className="btn btn-secondary" onClick={closeModal}>Close</button>
                    <button className="btn btn-primary" onClick={() => { sendReply(); closeModal(); }}>Send</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* New Query modal */}
          {newQueryOpen && (
            <div className="modal-root">
              <div className="modal-overlay" onClick={() => setNewQueryOpen(false)}></div>
              <div className="modal-card large" role="dialog" aria-modal="true">
                <div className="modal-header">
                  <div className="modal-title">Create New Query</div>
                  <button className="modal-close" onClick={() => setNewQueryOpen(false)}><FiX /></button>
                </div>
                <div className="modal-body">
                  <NewQuery
                    service={formData}
                    onClose={() => setNewQueryOpen(false)}
                    onCreate={(payload) => handleCreateQuery(payload)}
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
