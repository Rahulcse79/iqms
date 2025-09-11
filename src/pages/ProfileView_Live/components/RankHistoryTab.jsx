// RankHistoryTab.jsx
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

/* Developer logging helper (no-ops in production) */
const devLog = (...args) => {
  if (process.env.NODE_ENV !== 'production') {
    try {
      // eslint-disable-next-line no-console
      console.debug('[RankHistoryTab]', ...args);
    } catch {}
  }
};

const devGroup = (label, fn) => {
  if (process.env.NODE_ENV === 'production') return;
  try {
    // eslint-disable-next-line no-console
    console.groupCollapsed(`[RankHistoryTab] ${label}`);
    fn();
    // eslint-disable-next-line no-console
    console.groupEnd();
  } catch {}
};

/* pick date raw from multiple possible keys */
const pickDateRaw = (row) => {
  if (!row) return null;
  const candidates = ['wef', 'rankdt', 'wef_date', 'fromDate', 'rankDate'];
  for (const k of candidates) {
    if (row[k]) {
      const d = new Date(row[k]);
      if (!Number.isNaN(d.getTime())) return d;
    }
  }
  return null;
};

const pickRankName = (row) => row?.rank_name ?? row?.rankName ?? row?.rank ?? '-';
const pickRemarks = (row) => row?.irla_action ?? row?.irla ?? row?.remarks ?? '-';

/* ---------------- Styles ---------------- */
const styles = {
  container: {
    padding: 20,
    fontFamily: "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
    color: '#111827',
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
  select: {
    padding: '6px 8px',
    borderRadius: 6,
    border: '1px solid #d1d5db',
    background: '#fff',
  },
  tableWrap: {
    overflowX: 'auto',
    borderRadius: 8,
    boxShadow: '0 1px 2px rgba(15,23,42,0.05)',
    border: '1px solid #e6eaea',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: 680,
  },
  thead: {
    background: '#f8fafc',
    color: '#0f172a',
    fontSize: 14,
    textAlign: 'left',
  },
  th: {
    padding: '12px 14px',
    borderBottom: '1px solid #e6eaea',
    fontWeight: 600,
  },
  thSortable: {
    cursor: 'pointer',
    userSelect: 'none',
  },
  td: {
    padding: '12px 14px',
    borderBottom: '1px solid #f1f5f9',
    fontSize: 14,
    verticalAlign: 'middle',
  },
  tbodyRowAlt: { background: '#fbfbfb' },
  navBtn: {
    padding: '6px 10px',
    borderRadius: 6,
    border: '1px solid #e2e8f0',
    background: '#fff',
    cursor: 'pointer',
  },
  pageInput: {
    width: 72,
    padding: '6px 8px',
    borderRadius: 6,
    border: '1px solid #d1d5db',
  },
  metaText: {
    fontSize: 13,
    color: '#374151',
  },
};

/* ---------------- Component ---------------- */
/**
 * Props:
 *  - items: [] (array of rank-history objects from reducer)
 *  - loading: boolean
 *  - error: any
 *
 * NOTE: I have not changed any functional behavior. Only added dev logging to
 * inspect incoming reducer data and to show intermediate parsed states.
 */
export default function RankHistoryTab({ items = [], loading, error }) {
  /* Hooks & state (always first) */
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [sortDir, setSortDir] = useState(null); // null | 'asc' | 'desc'

  // Quick prop-level log so you can see what's being passed from container/mapState
  devGroup('Props Snapshot', () => {
    devLog('loading:', loading);
    devLog('error:', error);
    devLog('items type:', Array.isArray(items) ? 'array' : typeof items);
    if (Array.isArray(items)) {
      // only show first 10 in table to avoid huge logs
      // eslint-disable-next-line no-console
      console.table(items.slice(0, 10));
    } else {
      devLog('items (non-array):', items);
    }
  });

  /* Data cleaning */
  const cleanedRows = useMemo(() => {
    if (!Array.isArray(items)) return [];
    const mapped = items.map((row, idx) => {
      devLog('Raw Rank Data (row):', row);
      const dateRaw = pickDateRaw(row);
      return {
        _idx: idx,
        rank: pickRankName(row),
        rankDateRaw: dateRaw, // Date object or null
        rankDateFormatted: dateRaw ? formatDate(dateRaw.toISOString()) : formatDate(row.wef ?? row.rankdt),
        remarks: pickRemarks(row),
        __raw: row,
      };
    });

    devGroup('cleanedRows sample', () => {
      // eslint-disable-next-line no-console
      console.table(mapped.slice(0, 10).map(r => ({
        _idx: r._idx,
        rank: r.rank,
        rankDateFormatted: r.rankDateFormatted,
        remarks: r.remarks,
      })));
    });

    return mapped;
  }, [items]);

  /* Sorting (rankDate only) */
  const sortedRows = useMemo(() => {
    if (!sortDir) return cleanedRows;
    const arr = [...cleanedRows];
    arr.sort((a, b) => {
      if (!a.rankDateRaw && !b.rankDateRaw) return 0;
      if (!a.rankDateRaw) return 1;
      if (!b.rankDateRaw) return -1;
      const diff = a.rankDateRaw.getTime() - b.rankDateRaw.getTime();
      return sortDir === 'asc' ? diff : -diff;
    });
    devLog('sortedRows direction:', sortDir, 'count:', arr.length);
    return arr;
  }, [cleanedRows, sortDir]);

  /* Pagination */
  const total = sortedRows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  // reset page on major change
  useEffect(() => {
    setPage(1);
  }, [items, pageSize, sortDir]);

  const startIndex = (page - 1) * pageSize;
  const pageRows = sortedRows.slice(startIndex, startIndex + pageSize);

  // Log page-level rows when they change
  useEffect(() => {
    devGroup(`Page ${page} Rows`, () => {
      devLog('startIndex:', startIndex);
      devLog('pageRows length:', pageRows.length);
      // eslint-disable-next-line no-console
      console.table(pageRows.map((r, i) => ({
        idx: startIndex + i + 1,
        rank: r.rank,
        rankDateFormatted: r.rankDateFormatted,
        remarks: r.remarks,
      })));
    });
  }, [pageRows, page, startIndex]);

  /* Handlers */
  const toggleSort = () => setSortDir((d) => (d === null ? 'asc' : d === 'asc' ? 'desc' : null));
  const onHeaderKey = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleSort();
    }
  };

  /* Conditional UI after hooks */
  devLog('Render check', { loading, error, itemsLength: Array.isArray(items) ? items.length : null, total });

  if (loading) return <p style={{ padding: 20 }}>Loading rank history...</p>;
  if (error) return <p style={{ padding: 20, color: 'red' }}>Error: {String(error)}</p>;
  if (!Array.isArray(items) || items.length === 0) return <p style={{ padding: 20 }}>No rank history available.</p>;

  const sortIcon = sortDir === 'asc' ? '▲' : sortDir === 'desc' ? '▼' : '↕';

  return (
    <div style={styles.container}>
      {/* Controls */}
      <div style={styles.controlsRow}>
        <div style={styles.leftControls}>
          <label style={{ fontSize: 14, color: '#374151' }}>
            Rows per page:{' '}
            <select
              aria-label="Rows per page"
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              style={styles.select}
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
          <button type="button" onClick={() => setPage(1)} disabled={page === 1} style={styles.navBtn} aria-label="First page">⏮</button>
          <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={styles.navBtn} aria-label="Previous page">◀ Prev</button>
          <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={styles.navBtn} aria-label="Next page">Next ▶</button>
          <button type="button" onClick={() => setPage(totalPages)} disabled={page === totalPages} style={styles.navBtn} aria-label="Last page">⏭</button>
        </div>
      </div>

      {/* Table */}
      <div style={styles.tableWrap}>
        <table style={styles.table} role="table" aria-label="Rank history table">
          <thead style={styles.thead}>
            <tr>
              <th style={{ ...styles.th, width: 80 }}>S No</th>
              <th style={styles.th}>Rank</th>

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
                  <span>Rank Date</span>
                  <span style={{ fontSize: 12, color: '#6b7280' }}>{sortIcon}</span>
                </div>
              </th>

              <th style={styles.th}>Remarks</th>
            </tr>
          </thead>

          <tbody>
            {pageRows.map((row, idx) => {
              const isAlt = (startIndex + idx) % 2 === 1;
              return (
                <tr key={`${row.__raw?.rank_name ?? row._idx}-${startIndex + idx}`} style={isAlt ? styles.tbodyRowAlt : undefined}>
                  <td style={styles.td}>{startIndex + idx + 1}</td>
                  <td style={styles.td}>{row.rank}</td>
                  <td style={styles.td}>{row.rankDateFormatted}</td>
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
