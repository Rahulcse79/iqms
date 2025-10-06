import React, { useState, useMemo, useEffect } from 'react';

const devLog = (...args) => {
  if (process.env.NODE_ENV !== 'production') {
    try {
      console.debug('[RankHistoryTab]', ...args);
    } catch {}
  }
};

const devGroup = (label, fn) => {
  if (process.env.NODE_ENV === 'production') return;
  try {
    console.groupCollapsed(`[RankHistoryTab] ${label}`);
    fn();
    console.groupEnd();
  } catch {}
};

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

const styles = {
  container: {
    padding: '20px',
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
  select: {
    padding: '6px 8px',
    borderRadius: 6,
    border: '1px solid var(--border, #d1d5db)',
    background: 'var(--surface, #fff)',
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
    minWidth: 680,
    fontSize: 14,
    color: 'var(--text, #111827)',
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
  },
  thSortable: {
    cursor: 'pointer',
    userSelect: 'none',
  },
  td: {
    padding: '12px 14px',
    borderBottom: '1px solid color-mix(in srgb, var(--border, #f1f5f9) 80%, transparent 20%)',
    fontSize: 14,
    verticalAlign: 'middle',
    color: 'var(--text, #111827)',
    background: 'transparent',
  },
  tbodyRowAlt: {
    background: 'color-mix(in srgb, var(--surface, #ffffff) 92%, var(--glass, rgba(0,0,0,0.02)) 8%)',
  },
  navBtn: {
    padding: '6px 10px',
    borderRadius: 6,
    border: '1px solid var(--border, #e2e8f0)',
    background: 'var(--surface, #fff)',
    color: 'var(--text, #111827)',
    cursor: 'pointer',
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


export default function RankHistoryTab({ items = [], loading, error }) {
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [sortDir, setSortDir] = useState('desc');

  devGroup('Props Snapshot', () => {
    devLog('loading:', loading);
    devLog('error:', error);
    devLog('items type:', Array.isArray(items) ? 'array' : typeof items);
    if (Array.isArray(items)) {
      console.table(items.slice(0, 10));
    } else {
      devLog('items (non-array):', items);
    }
  });

  const cleanedRows = useMemo(() => {
    if (!Array.isArray(items)) return [];
    const mapped = items.map((row, idx) => {
      devLog('Raw Rank Data (row):', row);
      const dateRaw = pickDateRaw(row);
      return {
        _idx: idx,
        rank: pickRankName(row),
        rankDateRaw: dateRaw, 
        rankDateFormatted: dateRaw ? (dateRaw.toISOString()) : (row.wef ?? row.rankdt),
        remarks: pickRemarks(row),
        __raw: row,
      };
    });

    devGroup('cleanedRows sample', () => {
      console.table(
        mapped.slice(0, 10).map((r) => ({
          _idx: r._idx,
          rank: r.rank,
          rankDateFormatted: r.rankDateFormatted,
          remarks: r.remarks,
        }))
      );
    });

    return mapped;
  }, [items]);

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

  useEffect(() => {
    devGroup(`Page ${page} Rows`, () => {
      devLog('startIndex:', startIndex);
      devLog('pageRows length:', pageRows.length);
      console.table(
        pageRows.map((r, i) => ({
          idx: startIndex + i + 1,
          rank: r.rank,
          rankDateFormatted: r.rankDateFormatted,
          remarks: r.remarks,
        }))
      );
    });
  }, [pageRows, page, startIndex]);

  const toggleSort = () => setSortDir((d) => (d === null ? 'asc' : d === 'asc' ? 'desc' : null));
  const onHeaderKey = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleSort();
    }
  };

  devLog('Render check', { loading, error, itemsLength: Array.isArray(items) ? items.length : null, total });

  if (loading) return <p style={{ padding: 20 }}>Loading rank history...</p>;
  if (error) return <p style={{ padding: 20, color: 'var(--danger, red)' }}>Error: {String(error)}</p>;
  if (!Array.isArray(items) || items.length === 0) return <p style={{ padding: 20 }}>No rank history available.</p>;

  const sortIcon = sortDir === 'asc' ? '▲' : sortDir === 'desc' ? '▼' : '↕';

  return (
    <div style={styles.container} className="rank-history-container">
      <style>{`
        .rank-history-table tbody tr:hover {
          background: color-mix(in srgb, var(--surface-accent, #f8fafc) 85%, transparent 15%);
          transition: background 140ms ease;
        }

        /* Make the table more compact on very small screens */
        @media (max-width: 680px) {
          .rank-history-table td, .rank-history-table th {
            padding: 8px 10px !important;
            font-size: 13px !important;
          }
          .rank-history-table { min-width: 0 !important; }
        }

        /* allow horizontal scrolling but keep header visible (visual smoothing) */
        .rank-history-scroll {
          -webkit-overflow-scrolling: touch;
        }
      `}</style>

      <div style={styles.controlsRow}>
        <div style={styles.leftControls}>
          <label style={{ fontSize: 14, color: 'var(--muted, #374151)', display: 'flex', gap: 8, alignItems: 'center' }}>
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
          <button
            type="button"
            onClick={() => setPage(1)}
            disabled={page === 1}
            style={{
              ...styles.navBtn,
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
              ...styles.navBtn,
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
              ...styles.navBtn,
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
              ...styles.navBtn,
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
      <div style={styles.tableWrap} className="rank-history-scroll" aria-live="polite">
        <table
          style={styles.table}
          role="table"
          aria-label="Rank history table"
          className="rank-history-table"
        >
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
                  key={`${row.__raw?.rank_name ?? row._idx}-${startIndex + idx}`}
                  style={isAlt ? styles.tbodyRowAlt : undefined}
                >
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
      <div
        style={{
          marginTop: 12,
          display: 'flex',
          justifyContent: 'space-between',
          gap: 12,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ color: 'var(--muted, #374151)' }}>
          Page <strong>{page}</strong> of <strong>{totalPages}</strong>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label
            style={{
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              fontSize: 13,
              color: 'var(--muted, #374151)',
            }}
          >
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
