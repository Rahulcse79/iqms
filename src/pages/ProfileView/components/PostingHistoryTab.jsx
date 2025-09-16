// PostingHistoryTab.jsx
import React, { useState, useMemo, useEffect } from 'react';
import './PostingHistoryTab.css'; // optional: kept for any existing CSS overrides

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
    console.debug('[PostingHistoryTab]', ...args);
  }
};

/**
 * Pick a date value from a row checking many likely keys.
 * Returns a Date object or null.
 */
const pickDateRaw = (row) => {
  if (!row) return null;
  const candidates = [
    'wef',
    'wef_date',
    'fromDate',
    'from_date',
    'sors_prev_unit',
    'sors',
    'sorsdt',
    'tors',
    'tos',
    'wef',
  ];
  for (const k of candidates) {
    if (row[k]) {
      const d = new Date(row[k]);
      if (!Number.isNaN(d.getTime())) return d;
    }
  }
  return null;
};

/**
 * Pick a unit name from many possible fields
 */
const pickUnit = (row) => {
  return row?.abc ?? row?.unit ?? row?.unitcd ?? row?.unit_name ?? row?.unitName ?? '-';
};

/**
 * Pick an occ/document id
 */
const pickOcc = (row) => {
  return row?.occ_id ?? row?.occId ?? row?.docNo ?? row?.document_no ?? '-';
};

/* ---------------- Styles (inline for quick, consistent look) ---------------- */
const styles = {
  container: {
    padding: 20,
    fontFamily:
      "var(--font-family, 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial)",
    color: "var(--text, #111827)",
    background: "var(--bg, transparent)",
  },

  /* Controls row */
  controlsRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
    marginBottom: 12,
    flexWrap: "wrap",
  },

  leftControls: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    minWidth: 0,
  },

  /* Inputs / selects */
  select: {
    padding: "6px 8px",
    borderRadius: 6,
    border: "1px solid var(--border, #d1d5db)",
    background: "var(--surface, #fff)",
    color: "var(--text, #111827)",
    fontSize: 14,
    outline: "none",
  },

  /* Table wrapper */
  tableWrap: {
    overflowX: "auto",
    borderRadius: 8,
    boxShadow: "var(--shadow, 0 1px 2px rgba(15,23,42,0.05))",
    border: "1px solid var(--border, rgba(0,0,0,0.06))",
    background: "var(--surface, #fff)",
  },

  /* Table base */
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: 900, // keep layout on larger screens; responsive adjustments handled in CSS if needed
    fontSize: 14,
    color: "var(--text, #111827)",
  },

  thead: {
    background: "var(--surface-accent, #f8fafc)",
    color: "var(--text, #0f172a)",
    fontSize: 14,
    textAlign: "left",
    position: "sticky", // if using inline styles; note: 'top' needs to be set in wrapper when used
    top: 0,
    zIndex: 2,
  },

  th: {
    padding: "12px 14px",
    borderBottom: "1px solid var(--border, #e6eaea)",
    fontWeight: 600,
    color: "var(--text, #0f172a)",
    verticalAlign: "middle",
  },

  thSortable: {
    cursor: "pointer",
    userSelect: "none",
    // visual hint props (focus/hover should be done in CSS where pseudo selectors are available)
  },

  td: {
    padding: "12px 14px",
    borderBottom: "1px solid color-mix(in srgb, var(--border, #f1f5f9) 88%, transparent 12%)",
    fontSize: 14,
    verticalAlign: "middle",
    color: "var(--text, #111827)",
    background: "var(--surface, #fff)",
  },

  tbodyRowAlt: {
    background: "color-mix(in srgb, var(--surface, #fff) 88%, var(--surface-accent, #f8fafc) 12%)",
  },

  /* Pagination / nav */
  navBtn: {
    padding: "6px 10px",
    borderRadius: 6,
    border: "1px solid var(--border, #e2e8f0)",
    background: "var(--surface, #fff)",
    color: "var(--text, #111827)",
    cursor: "pointer",
    fontWeight: 600,
  },

  pageInput: {
    width: 72,
    padding: "6px 8px",
    borderRadius: 6,
    border: "1px solid var(--border, #d1d5db)",
    background: "var(--surface, #fff)",
    color: "var(--text, #111827)",
  },

  /* Small responsive helpers (JS object can't define media queries — keep fallback sizes here) */
  tableMinWidthLarge: 900,
  tableMinWidthMedium: 720,
  tableMinWidthSmall: 460,

  /* subtle accessibility helpers */
  focusRing: {
    outline: "none",
    boxShadow: "0 6px 20px color-mix(in srgb, var(--primary, #3b82f6) 12%, transparent 88%)",
  },
};


/* ---------------- Component ---------------- */
export default function PostingHistoryTab({ items = [], loading, error }) {
  /* ------------- Hooks & State ------------- */
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [sortDir, setSortDir] = useState(null); // null | 'asc' | 'desc'

  /* ------------- Data cleaning & normalization ------------- */
  const cleanedRows = useMemo(() => {
    if (!Array.isArray(items)) return [];
    return items.map((row, idx) => {
      devLog('Raw Posting Data:', row);

      const fromDateRaw = pickDateRaw(row);
      return {
        _idx: idx,
        sNoOriginal: idx + 1,
        unit: pickUnit(row),
        fromDateRaw, // Date object or null
        fromDateFormatted: fromDateRaw ? formatDate(fromDateRaw.toISOString()) : formatDate(row.wef ?? row.sors ?? row.sorsdt ?? row.tors ?? row.tos),
        rate: row.rate ?? row.pay ?? '-',
        occId: pickOcc(row),
        irla: row.irla ?? row.irla_action ?? '-',
        remarks: row.remarks ?? row.note ?? row.remark ?? '-',
        __raw: row,
      };
    });
  }, [items]);

  /* ------------- Sorting (on fromDateRaw) ------------- */
  const sortedRows = useMemo(() => {
    if (!sortDir) return cleanedRows;
    const copy = [...cleanedRows];
    copy.sort((a, b) => {
      // missing dates go to end
      if (!a.fromDateRaw && !b.fromDateRaw) return 0;
      if (!a.fromDateRaw) return 1;
      if (!b.fromDateRaw) return -1;
      const diff = a.fromDateRaw.getTime() - b.fromDateRaw.getTime();
      return sortDir === 'asc' ? diff : -diff;
    });
    return copy;
  }, [cleanedRows, sortDir]);

  /* ------------- Pagination ------------- */
  const total = sortedRows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  useEffect(() => {
    setPage(1);
  }, [items, pageSize, sortDir]);

  const startIndex = (page - 1) * pageSize;
  const pageRows = sortedRows.slice(startIndex, startIndex + pageSize);

  /* ------------- Handlers ------------- */
  const toggleSort = () => setSortDir((d) => (d === null ? 'asc' : d === 'asc' ? 'desc' : null));
  const onHeaderKey = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSort(); } };

  /* ------------- Early UI states (after hooks) ------------- */
  if (loading) return <p style={{ padding: 20 }}>Loading posting history...</p>;
  if (error) return <p style={{ padding: 20, color: 'red' }}>Error: {String(error)}</p>;
  if (!Array.isArray(items) || items.length === 0) return <p style={{ padding: 20 }}>No posting history available.</p>;

  /* ------------- Render ------------- */
  const sortIcon = sortDir === 'asc' ? '▲' : sortDir === 'desc' ? '▼' : '↕';

  return (
    <div style={styles.container}>
      {/* Controls */}
      <div style={styles.controlsRow}>
        <div style={styles.leftControls}>
          <label style={{ color: '#374151', fontSize: 14 }}>
            Rows per page:{' '}
            <select
              aria-label="Rows per page"
              style={styles.select}
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </label>

          <div style={{ color: '#374151', fontSize: 13 }}>
            Showing <strong>{total === 0 ? 0 : startIndex + 1}</strong> - <strong>{Math.min(total, startIndex + pageRows.length)}</strong> of <strong>{total}</strong>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button type="button" style={styles.navBtn} onClick={() => setPage(1)} disabled={page === 1} aria-label="First page">⏮</button>
          <button type="button" style={styles.navBtn} onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} aria-label="Previous page">◀ Prev</button>
          <button type="button" style={styles.navBtn} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} aria-label="Next page">Next ▶</button>
          <button type="button" style={styles.navBtn} onClick={() => setPage(totalPages)} disabled={page === totalPages} aria-label="Last page">⏭</button>
        </div>
      </div>

      {/* Table */}
      <div style={styles.tableWrap}>
        <table style={styles.table} role="table" aria-label="Posting history table">
          <thead style={styles.thead}>
            <tr>
              <th style={{ ...styles.th, width: 80 }}>S No</th>
              <th style={styles.th}>Unit</th>

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
                  <span>From Date</span>
                  <span style={{ fontSize: 12, color: '#6b7280' }}>{sortIcon}</span>
                </div>
              </th>

              <th style={styles.th}>Rate</th>
              <th style={styles.th}>Occ ID</th>
              <th style={styles.th}>IRLA</th>
              <th style={styles.th}>Remarks</th>
            </tr>
          </thead>

          <tbody>
            {pageRows.map((row, idx) => {
              const isAlt = (startIndex + idx) % 2 === 1;
              return (
                <tr key={`${row.occId ?? row._idx}-${startIndex + idx}`} style={isAlt ? styles.tbodyRowAlt : undefined}>
                  <td style={styles.td}>{startIndex + idx + 1}</td>
                  <td style={styles.td}>{row.unit}</td>
                  <td style={styles.td}>{row.fromDateFormatted}</td>
                  <td style={styles.td}>{row.rate}</td>
                  <td style={styles.td}>{row.occId}</td>
                  <td style={styles.td}>{row.irla}</td>
                  <td style={styles.td}>{row.remarks}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ color: '#374151' }}>
          Page <strong>{page}</strong> of <strong>{totalPages}</strong>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: '#374151' }}>
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

          <div style={{ color: '#6b7280', fontSize: 13 }}>
            Rows per page: <strong>{pageSize}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
