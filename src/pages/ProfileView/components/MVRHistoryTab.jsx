import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';

// Default base (from your example)
const DEFAULT_BASE = 'http://sampoorna.cao.local/afcao/ipas/ivrs/mvrHistory';

export default function MVRHistoryTab({ serviceNo, baseUrl = DEFAULT_BASE }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [links, setLinks] = useState([]);
  const [meta, setMeta] = useState({ offset: 0, limit: 10, count: 0 });

  const buildDefaultUrl = (svc) => `${baseUrl}/${encodeURIComponent(svc)}`;

  const load = useCallback(
    async (href = null, append = false) => {
      if (!serviceNo) {
        setItems([]);
        setHasMore(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const url = href || buildDefaultUrl(serviceNo);
        const resp = await axios.get(url);
        const data = resp.data || {};

        const newItems = Array.isArray(data.items) ? data.items : [];
        setItems((prev) => (append ? [...prev, ...newItems] : newItems));
        setHasMore(Boolean(data.hasMore));
        setLinks(Array.isArray(data.links) ? data.links : []);
        setMeta({
          offset: data.offset ?? 0,
          limit: data.limit ?? 10,
          count: data.count ?? (append ? items.length + newItems.length : newItems.length),
        });
      } catch (err) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          'Failed to fetch MVR history. Check network / CORS / base URL.';
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [serviceNo, baseUrl, items.length]
  );

  useEffect(() => {
    load(null, false);
  }, [serviceNo]);

  const handleLoadMore = async () => {
    const nextHref = links.find((l) => l.rel === 'next')?.href;
    if (nextHref) {
      await load(nextHref, true);
    } else {
      const nextOffset = meta.offset + meta.limit;
      const href = `${buildDefaultUrl(serviceNo)}?offset=${nextOffset}`;
      await load(href, true);
    }
  };

  if (!serviceNo) {
    return (
      <div className="mvr-empty">
        No service number provided. Pass <code>serviceNo</code> prop to fetch MVR history.
      </div>
    );
  }

  return (
    <div className="mvr-root" style={{ fontFamily: 'system-ui, sans-serif' }}>
      <div
        className="mvr-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <h3 style={{ margin: 0 }}>MVR History — {serviceNo}</h3>
        <div style={{ display: 'flex', gap: 8 }}>
        </div>
      </div>

      {loading && items.length === 0 && <div>Loading...</div>}
      {error && (
        <div className="mvr-error" style={{ color: 'crimson', marginBottom: 8 }}>
          Error: {error}
        </div>
      )}

      {items.length === 0 && !loading && !error && <div>No records found.</div>}

      {items.length > 0 && (
        <div className="mvr-table-wrap" style={{ overflowX: 'auto' }}>
          <table
            className="mvr-table"
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              minWidth: 980,
            }}
          >
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #ddd' }}>
                  occ_id
                </th>
                <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #ddd' }}>
                  description
                </th>
                <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #ddd' }}>
                  from
                </th>
                <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #ddd' }}>
                  to
                </th>
                <th style={{ textAlign: 'right', padding: 8, borderBottom: '1px solid #ddd' }}>
                  oldrate
                </th>
                <th style={{ textAlign: 'right', padding: 8, borderBottom: '1px solid #ddd' }}>
                  newrate
                </th>
                <th style={{ textAlign: 'right', padding: 8, borderBottom: '1px solid #ddd' }}>
                  amount
                </th>
                <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #ddd' }}>
                  status
                </th>
                <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #ddd' }}>
                  transtype
                </th>
                <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #ddd' }}>
                  porno
                </th>
                <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #ddd' }}>
                  pers
                </th>
                <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #ddd' }}>
                  src
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={`${it.occ_id ?? idx}-${idx}`} style={{ borderBottom: '1px solid #f1f1f1' }}>
                  <td style={{ padding: 8 }}>{it.occ_id ?? '-'}</td>
                  <td style={{ padding: 8 }} title={it.hashcheck ?? ''}>
                    {it.description ?? '-'}
                  </td>
                  <td style={{ padding: 8 }}>{(it.fmdt)}</td>
                  <td style={{ padding: 8 }}>{(it.todt)}</td>
                  <td style={{ padding: 8, textAlign: 'right' }}>{it.oldrate ?? '-'}</td>
                  <td style={{ padding: 8, textAlign: 'right' }}>{it.newrate ?? '-'}</td>
                  <td style={{ padding: 8, textAlign: 'right' }}>{it.amount ?? '-'}</td>
                  <td style={{ padding: 8 }}>{it.status ?? '-'}</td>
                  <td style={{ padding: 8 }}>{it.transtype ?? '-'}</td>
                  <td style={{ padding: 8 }}>{it.porno ?? '-'}</td>
                  <td style={{ padding: 8 }}>{it.pers ?? '-'}</td>
                  <td style={{ padding: 8 }}>{it.src ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div
        className="mvr-footer"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 12,
          alignItems: 'center',
        }}
      >
        <div>
          Showing {items.length} record{items.length !== 1 ? 's' : ''}
          {meta.count ? ` — count: ${meta.count}` : ''}
        </div>

        <div>
          {hasMore ? (
            <button onClick={handleLoadMore} disabled={loading}>
              {loading ? 'Loading...' : 'Load more'}
            </button>
          ) : (
            <button onClick={() => load(null, false)} disabled={loading}>
              Refresh
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

MVRHistoryTab.propTypes = {
  serviceNo: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  baseUrl: PropTypes.string,
};
