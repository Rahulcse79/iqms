import React from 'react';
import "./queriesHistory.css"

const Form_API_TOKEN =
  process.env.REACT_APP_IRLA_API_TOKEN ||
  'IVRSuiyeUnekIcnmEWxnmrostooUZxXYPibnvIVRS';

const API_URL = 'http://175.25.5.7/API/controller.php?ivrsIqmsActionDet';

export default function QueryHistorytab({ docId, isActive }) {
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [refreshKey, setRefreshKey] = React.useState(0);

  const handleRetry = React.useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  React.useEffect(() => {
    if (!docId || !isActive) {
      setRows([]);
      setError('');
      return;
    }

    const controller = new AbortController();
    const signal = controller.signal;

    const params = new URLSearchParams();
    params.set('docId', String(docId));
    params.set('api_token', String(Form_API_TOKEN));

    setLoading(true);
    setError('');

    fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      },
      body: params.toString(),
      signal,
    })
      .then(async (res) => {
        const isJson = res.headers.get('content-type')?.includes('application/json');
        const data = isJson ? await res.json() : null;
        if (!res.ok) {
          throw new Error(data?.message || `HTTP ${res.status}`);
        }
        if (!data || typeof data !== 'object') {
          throw new Error('Unexpected response format');
        }
        if (data.success !== true || !Array.isArray(data.data)) {
          throw new Error(data?.message || 'API indicated failure or missing data array');
        }
        setRows(data.data);
      })
      .catch((err) => {
        if (err?.name === 'AbortError') return;
        setError(err?.message || 'Request failed');
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [docId, refreshKey, isActive]);

  return (
    <div
      role="tabpanel"
      aria-label="Query History"
      className="qh__panel"
    >
      <header className="qh__header">
        <h3 className="qh__title">Query History</h3>
        <div className="qh__controls">
          <button
            type="button"
            className="qh__btn"
            onClick={handleRetry}
            disabled={loading}
            title="Reload"
          >
            {loading ? 'Loading…' : 'Reload'}
          </button>
        </div>
      </header>

      {error ? (
        <div className="qh__state qh__state--error">
          <p className="qh__state-text">Error: {error}</p>
          <button type="button" className="qh__btn qh__btn--danger" onClick={handleRetry}>
            Try again
          </button>
        </div>
      ) : loading ? (
        <div className="qh__skeleton">
          <div className="qh__skeleton-row" />
          <div className="qh__skeleton-row" />
          <div className="qh__skeleton-row" />
        </div>
      ) : rows.length === 0 ? (
        <div className="qh__state qh__state--empty">
          <p className="qh__state-text">No actions found for this document.</p>
        </div>
      ) : (
        <div className="qh__table-wrap">
          <table className="qh__table">
            <thead>
              <tr>
                <th>SLNO</th>
                <th>Activity</th>
                <th>Action By</th>
                <th>Action Pers</th>
                <th>Date</th>
                <th>Time</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr key={r.ACTION_ID || r.SLNO || idx}>
                  <td>{r.SLNO || '-'}</td>
                  <td className="qh__cell--wrap">{r.ACTIVITY || '-'}</td>
                  <td className="qh__cell--wrap">{r.ACTION_BY || '-'}</td>
                  <td className="qh__cell--wrap">{r.ACTION_PERS || '-'}</td>
                  <td>{r.FMT_ACTN_DATE_DDMM || r.FMT_ACTN_DATE || r.ACTION_DATE || '-'}</td>
                  <td>{r.FMT_ACTION_TIME || '-'}</td>
                  <td className="qh__cell--wrap">{r.REMARKS || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
