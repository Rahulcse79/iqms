// components/GCIHistoryTab.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchABCCodes, getGCIHistory } from "../../../actions/ProfileAction";

/**
 * GCIHistoryTab
 * - reads abcCodes from state.abcCodes
 * - reads personal serviceNo/category from state.personalData.personalData
 * - reads gci history from state.profileView.gciHistory
 */
export default function GCIHistoryTab() {
  const dispatch = useDispatch();

  // ABC codes slice
  const { items: abcItems = [], loading: abcLoading = false, error: abcError = null } =
    useSelector((state) => state.abcCodes || {});

  // personal data (service number & category) - comes from fetchPersonalData
  const personalData = useSelector((state) => state.personalData?.personalData || null);
  const serviceNo = personalData?.sno ?? personalData?.serviceNo ?? "";
  const category = personalData?.cat ?? personalData?.category ?? "1";

  // gci history slice from profileView
  const {
    items: gciItems = [],
    loading: gciLoading = false,
    error: gciError = null,
    meta: gciMeta = null,
  } = useSelector((state) => state.profileView?.gciHistory || {});

  // local selected code (abccd)
  const [selectedAbc, setSelectedAbc] = useState("");

  // Load abc codes once (if not loaded)
  useEffect(() => {
    if ((!Array.isArray(abcItems) || abcItems.length === 0) && !abcLoading) {
      dispatch(fetchABCCodes()).catch(() => {
        // fetch errors handled in reducer
      });
    }
  }, [dispatch]);

  // When user selects a code, fetch gci history for the selected code
  useEffect(() => {
    if (!selectedAbc) return;
    if (!serviceNo) {
      // No service number available - show friendly message in console and return.
      // Do not throw — UI will show missing service number.
      // eslint-disable-next-line no-console
      console.warn("[GCIHistoryTab] No service number available; cannot fetch GCI history.");
      return;
    }

    // dispatch the thunk; caching is handled within action/reducer
    dispatch(getGCIHistory(serviceNo, category, selectedAbc)).catch(() => {
      // errors are captured in reducer; optional further handling here
    });
  }, [selectedAbc, serviceNo, category, dispatch]);

  // Derived display helpers
  const isFromCache = useMemo(() => {
    // If gciMeta has no direct fromCache info, the reducer does not mark it;
    // action sets meta.cacheKey and reducer populates cache.
    // We can detect by matching last cached key if desired — for simplicity, show when payload had come from cache in action.meta
    // But we don't store that flag in meta consistently — best to say "served from cache" only when gciMeta?.fromCache === true
    return gciMeta?.fromCache === true;
  }, [gciMeta]);

  // Helpers: generic table rendering of gciItems
  const tableColumns = useMemo(() => {
    if (!Array.isArray(gciItems) || gciItems.length === 0) return [];
    // use keys from first item (stable)
    return Object.keys(gciItems[0]);
  }, [gciItems]);

  // UI: handle clearing selection
  const clearSelection = () => {
    setSelectedAbc("");
    // Optionally we could clear displayed gciItems by dispatching an action
    // but better to keep cached data for UX. If you want to clear results visually:
    // dispatch({ type: GCI_HISTORY_SUCCESS, payload: { items: [] }, meta: { cacheKey: null } })
  };

  return (
    <div style={{ padding: 16 }}>
      <h3>GCI History</h3>

      {/* Service number check */}
      {!serviceNo ? (
        <div style={{ marginBottom: 12, color: "#b91c1c" }}>
          No service number available — open Personal Details and fetch profile first.
        </div>
      ) : (
        <div style={{ marginBottom: 12, color: "#374151" }}>
          Service No: <strong>{serviceNo}</strong> • Category: <strong>{category}</strong>
        </div>
      )}

      {/* ABC Codes Dropdown */}
      <div style={{ marginBottom: 12 }}>
        <label htmlFor="gci-abc-select" style={{ display: "block", marginBottom: 6 }}>
          Select ABC code
        </label>

        {abcLoading ? (
          <div>Loading codes...</div>
        ) : abcError ? (
          <div style={{ color: "red" }}>Error loading codes: {String(abcError)}</div>
        ) : (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select
              id="gci-abc-select"
              value={selectedAbc}
              onChange={(e) => setSelectedAbc(e.target.value)}
              disabled={!Array.isArray(abcItems) || abcItems.length === 0}
              style={{ padding: "8px 10px", borderRadius: 6, border: "1px solid #d1d5db" }}
            >
              <option value="">-- Select code --</option>
              {Array.isArray(abcItems) && abcItems.length > 0 ? (
                abcItems.map((c) => (
                  <option key={c.abccd} value={c.abccd}>
                    {c.abccd} — {c.description}
                  </option>
                ))
              ) : (
                <option disabled>No codes</option>
              )}
            </select>

            <button
              type="button"
              onClick={clearSelection}
              disabled={!selectedAbc}
              style={{ padding: "8px 10px", borderRadius: 6 }}
            >
              Clear
            </button>

            {selectedAbc && <div style={{ color: "#6b7280" }}>Selected: <strong>{selectedAbc}</strong></div>}
          </div>
        )}
      </div>

      {/* Show GCI results */}
      <div style={{ marginTop: 12 }}>
        {gciLoading ? (
          <div>Loading GCI history...</div>
        ) : gciError ? (
          <div style={{ color: "red" }}>Error fetching GCI history: {String(gciError)}</div>
        ) : !selectedAbc ? (
          <div style={{ color: "#374151" }}>Please select an ABC code to view GCI history.</div>
        ) : Array.isArray(gciItems) && gciItems.length === 0 ? (
          <div>No GCI history records found for selected code.</div>
        ) : (
          <div>
            {isFromCache && <div style={{ color: "#065f46", marginBottom: 6 }}>Served from cache</div>}

            <div style={{ overflowX: "auto", border: "1px solid #e6eaea", borderRadius: 8 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead style={{ background: "#f8fafc" }}>
                  <tr>
                    {tableColumns.map((col) => (
                      <th key={col} style={{ padding: "8px 12px", borderBottom: "1px solid #e6eaea", textAlign: "left" }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {gciItems.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      {tableColumns.map((col) => (
                        <td key={col} style={{ padding: "8px 12px", verticalAlign: "top" }}>
                          {(() => {
                            const v = row[col];
                            if (v === null || typeof v === "undefined") return "-";
                            if (typeof v === "object") return JSON.stringify(v);
                            return String(v);
                          })()}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
