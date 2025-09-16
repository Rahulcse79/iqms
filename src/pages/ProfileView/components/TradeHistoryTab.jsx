// TradeHistoryTab.jsx
import React, { useState, useMemo, useEffect } from 'react';

/* ---------------- Utilities ---------------- */
const formatDate = (iso) => {
  if (!iso) return '-';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '-';
  }
};

const devLog = (...args) => {
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.debug('[TradeHistoryTab]', ...args);
  }
};

/* ---------------- Theme-aware Styles (JS objects) ----------------
   These use CSS variables (with fallbacks) so the UI follows whichever
   theme (.theme-light/.theme-dark) you apply globally.
*/
const styles = {
  container: {
    padding: 20,
    fontFamily:
      "var(--font-family, 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial)",
    color: 'var(--text, #111827)',
    background: 'transparent',
  },
  controlsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  leftControls: {
    display: 'flex',
    gap: 12,
    alignItems: 'center',
  },
  rowsSelect: {
    padding: '6px 8px',
    borderRadius: 6,
    border: '1px solid var(--border, #d1d5db)',
    background: 'var(--surface, #fff)',
    color: 'var(--text, #111827)',
  },
  sortButton: {
    padding: '6px 10px',
    borderRadius: 6,
    border: '1px solid var(--border, #d1d5db)',
    background: 'var(--surface-accent, #f8fafc)',
    cursor: 'pointer',
    color: 'var(--text, #111827)',
  },
  tableWrap: {
    overflowX: 'auto',
    borderRadius: 8,
    boxShadow: 'var(--shadow, 0 1px 2px rgba(15,23,42,0.05))',
    border: '1px solid var(--border, #e6eaea)',
    background: 'var(--surface, #fff)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: 720,
    color: 'var(--text, #111827)',
    fontSize: 14,
  },
  thead: {
    background: 'var(--surface-accent, #f8fafc)',
    color: 'var(--text, #0f172a)',
    fontSize: 14,
    textAlign: 'left',
  },
  th: {
    padding: '12px 14px',
    borderBottom: '1px solid var(--border, #e6eaea)',
    fontWeight: 600,
    verticalAlign: 'middle',
  },
  thSortable: {
    cursor: 'pointer',
    userSelect: 'none',
  },
  tbodyRow: {
    background: 'var(--surface, #ffffff)',
  },
  tbodyRowAlt: {
    background: 'color-mix(in srgb, var(--surface, #ffffff) 92%, var(--glass, rgba(0,0,0,0.02)) 8%)',
  },
  td: {
    padding: '12px 14px',
    borderBottom: '1px solid color-mix(in srgb, var(--border, #f1f5f9) 80%, transparent 20%)',
    verticalAlign: 'middle',
    fontSize: 14,
    color: 'var(--text, #111827)',
    background: 'transparent',
  },
  footer: {
    marginTop: 12,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  navButton: {
    padding: '6px 10px',
    borderRadius: 6,
    border: '1px solid var(--border, #e2e8f0)',
    background: 'var(--surface, #fff)',
    cursor: 'pointer',
    color: 'var(--text, #111827)',
  },
  pageInput: {
    width: 72,
    padding: '6px 8px',
    borderRadius: 6,
    border: '1px solid var(--border, #d1d5db)',
    background: 'var(--surface, #fff)',
    color: 'var(--text, #111827)',
  },
  metaText: {
    fontSize: 13,
    color: 'var(--muted, #374151)',
  },
};

/* ---------------- Component (unchanged behavior) ---------------- */
export default function TradeHistoryTab({ items = [], loading, error }) {
  /* ---------------- Hooks (always at top) ---------------- */
  const [pageSize, setPageSize] = useState(10); // 10, 20, 50
  const [page, setPage] = useState(1);
  const [sortDir, setSortDir] = useState(null); // null | 'asc' | 'desc'

  /* ---------------- Data cleaning (stable via useMemo) ---------------- */
  const cleanedRows = useMemo(() => {
    if (!Array.isArray(items)) return [];
    return items.map((row, idx) => {
      devLog('Raw Trade Data:', row);
      const wefRaw = row.wef ? new Date(row.wef) : null;
      return {
        _idx: idx,
        branch: row.branch ?? '-',
        occId: row.occ_id ?? row.occId ?? '-',
        wefRaw: wefRaw && !Number.isNaN(wefRaw.getTime()) ? wefRaw : null,
        wefFormatted: formatDate(row.wef),
        irla: row.irla ?? row.irla_action ?? '-',
        __raw: row,
      };
    });
  }, [items]);

  /* ---------------- Sorting (wef column only) ---------------- */
  const sortedRows = useMemo(() => {
    if (!sortDir) return cleanedRows;
    const rows = [...cleanedRows];
    rows.sort((a, b) => {
      // missing dates are pushed to the end
      if (!a.wefRaw && !b.wefRaw) return 0;
      if (!a.wefRaw) return 1;
      if (!b.wefRaw) return -1;
      const diff = a.wefRaw.getTime() - b.wefRaw.getTime();
      return sortDir === 'asc' ? diff : -diff;
    });
    return rows;
  }, [cleanedRows, sortDir]);

  /* ---------------- Pagination ---------------- */
  const total = sortedRows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // keep page valid when pageSize/total changes
  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  // reset to first page on major changes (predictable behavior)
  useEffect(() => {
    setPage(1);
  }, [items, pageSize, sortDir]);

  const startIndex = (page - 1) * pageSize;
  const pageRows = sortedRows.slice(startIndex, startIndex + pageSize);

  /* ---------------- Handlers ---------------- */
  const toggleSort = () => setSortDir((d) => (d === null ? 'asc' : d === 'asc' ? 'desc' : null));

  const onHeaderKey = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleSort();
    }
  };

  /* ---------------- Early UI states (after hooks) ---------------- */
  if (loading) return <p style={{ padding: 20 }}>Loading trade history...</p>;
  if (error) return <p style={{ padding: 20, color: 'var(--danger, red)' }}>Error: {String(error)}</p>;
  if (!Array.isArray(items) || items.length === 0) return <p style={{ padding: 20 }}>No trade history available.</p>;

  /* ---------------- Render ---------------- */
  const sortIcon = sortDir === 'asc' ? '▲' : sortDir === 'desc' ? '▼' : '↕';

  return (
    <div style={styles.container} className="trade-history-container">
      {/* Small embedded CSS for responsive/polish (keeps file self-contained) */}
      <style>{`
        .trade-table tbody tr:hover {
          background: color-mix(in srgb, var(--surface-accent, #f8fafc) 85%, transparent 15%);
          transition: background 140ms ease;
        }

        @media (max-width: 720px) {
          .trade-table td, .trade-table th {
            padding: 8px 10px !important;
            font-size: 13px !important;
          }
          .trade-table { min-width: 0 !important; }
        }
      `}</style>

      {/* Controls */}
      <div style={styles.controlsRow}>
        <div style={styles.leftControls}>
          <label style={{ fontSize: 14, color: 'var(--muted, #374151)' }}>
            Rows per page:{' '}
            <select
              aria-label="Rows per page"
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              style={styles.rowsSelect}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </label>

          <div style={styles.metaText}>
            Showing <strong>{Math.min(total, startIndex + 1)}</strong> - <strong>{Math.min(total, startIndex + pageRows.length)}</strong> of <strong>{total}</strong>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setPage(1)}
            disabled={page === 1}
            style={{
              ...styles.navButton,
              opacity: page === 1 ? 0.6 : 1,
              cursor: page === 1 ? 'not-allowed' : 'pointer',
            }}
            aria-label="First page"
            title="First page"
          >
            ⏮
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              ...styles.navButton,
              opacity: page === 1 ? 0.6 : 1,
              cursor: page === 1 ? 'not-allowed' : 'pointer',
            }}
            aria-label="Previous page"
            title="Previous page"
          >
            ◀ Prev
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{
              ...styles.navButton,
              opacity: page === totalPages ? 0.6 : 1,
              cursor: page === totalPages ? 'not-allowed' : 'pointer',
            }}
            aria-label="Next page"
            title="Next page"
          >
            Next ▶
          </button>
          <button
            type="button"
            onClick={() => setPage(totalPages)}
            disabled={page === totalPages}
            style={{
              ...styles.navButton,
              opacity: page === totalPages ? 0.6 : 1,
              cursor: page === totalPages ? 'not-allowed' : 'pointer',
            }}
            aria-label="Last page"
            title="Last page"
          >
            ⏭
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={styles.tableWrap} className="trade-table-wrap" aria-live="polite">
        <table style={styles.table} role="table" aria-label="Trade history table" className="trade-table">
          <thead style={styles.thead}>
            <tr>
              <th style={{ ...styles.th, width: 80 }}>S No</th>
              <th style={styles.th}>Branch</th>
              <th style={styles.th}>OCC ID</th>

              {/* Sortable header */}
              <th
                style={{ ...styles.th, ...styles.thSortable }}
                role="button"
                tabIndex={0}
                aria-sort={sortDir ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                onClick={toggleSort}
                onKeyDown={onHeaderKey}
                title="Toggle sort: none → ascending → descending"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>With Effect From</span>
                  <span style={{ fontSize: 12, color: 'var(--muted, #6b7280)' }}>{sortIcon}</span>
                </div>
              </th>

              <th style={styles.th}>IRLA Action</th>
            </tr>
          </thead>

          <tbody>
            {pageRows.map((row, idx) => {
              const isAlt = (startIndex + idx) % 2 === 1;
              return (
                <tr
                  key={`${row.occId ?? row._idx}-${startIndex + idx}`}
                  style={isAlt ? styles.tbodyRowAlt : styles.tbodyRow}
                >
                  <td style={styles.td}>{startIndex + idx + 1}</td>
                  <td style={styles.td}>{row.branch}</td>
                  <td style={styles.td}>{row.occId}</td>
                  <td style={styles.td}>{row.wefFormatted}</td>
                  <td style={styles.td}>{row.irla}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer: page info and jump to page */}
      <div style={styles.footer}>
        <div style={{ color: 'var(--muted, #374151)' }}>
          Page <strong>{page}</strong> of <strong>{totalPages}</strong>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: 'var(--muted, #374151)' }}>
            Go to page:
            <input
              type="number"
              min={1}
              max={totalPages}
              value={page}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (Number.isNaN(v)) return;
                setPage(Math.min(Math.max(1, v), totalPages));
              }}
              style={styles.pageInput}
            />
          </label>

          <div style={{ color: 'var(--muted, #6b7280)', fontSize: 13 }}>
            Rows per page: <strong>{pageSize}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
