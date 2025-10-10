import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchABCCodes, getGCIHistory } from "../../../actions/ProfileAction";
import "./GCIHistoryTab.css";

export default function GCIHistoryTab() {
  const dispatch = useDispatch();

  // ABC codes slice
  const {
    items: abcItems = [],
    loading: abcLoading = false,
    error: abcError = null,
  } = useSelector((state) => state.abcCodes || {});

  // personalData slice -> get serviceNo & category
  const personalData = useSelector((state) => state.personalData?.personalData || null);
  const serviceNo = personalData?.sno ?? personalData?.serviceNo ?? "";
  const category = personalData?.cat ?? personalData?.category ?? "1";

  // gci history slice
  const {
    items: gciItems = [],
    loading: gciLoading = false,
    error: gciError = null,
    meta: gciMeta = null,
  } = useSelector((state) => state.profileView?.gciHistory || {});

  const [selectedAbc, setSelectedAbc] = useState("");
  const [localError, setLocalError] = useState("");

  // Load ABC codes if not present
  useEffect(() => {
    if ((!Array.isArray(abcItems) || abcItems.length === 0) && !abcLoading) {
      // fetchABCCodes returns a promise in your actions; swallow rejections here
      dispatch(fetchABCCodes()).catch(() => {});
    }
  }, [dispatch, abcItems, abcLoading]);

  // Helper: format ISO date to local readable date
  const formatDate = (iso) => {
    if (!iso) return "-";
    try {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return "-";
      return d.toLocaleDateString();
    } catch {
      return "-";
    }
  };

  // Determine whether the API served from cache
  const isFromCache = useMemo(() => {
    return gciMeta?.fromCache === true;
  }, [gciMeta]);

  // Compute raw columns from the first row (safe-check)
  const rawColumns = useMemo(() => {
    if (!Array.isArray(gciItems) || gciItems.length === 0) return [];
    const first = gciItems[0];
    return Object.keys(first);
  }, [gciItems]);

  // Deduplicate porno if identical to occ_id for all rows
  const displayedColumns = useMemo(() => {
    if (!Array.isArray(gciItems) || gciItems.length === 0) return rawColumns;
    const hasOcc = rawColumns.includes("occ_id");
    const hasPor = rawColumns.includes("porno") || rawColumns.includes("porno_no") || rawColumns.includes("por_no");
    // handle common variant keys: prefer exact 'porno', fallback names if needed
    // We'll check exact 'porno' first
    if (rawColumns.includes("occ_id") && rawColumns.includes("porno")) {
      const allSame = gciItems.every((row) => {
        const a = (row.occ_id ?? "").toString().trim();
        const b = (row.porno ?? "").toString().trim();
        // If both empty, not considered same; require both non-empty and identical
        return a !== "" && b !== "" && a === b;
      });
      if (allSame) {
        return rawColumns.filter((c) => c !== "porno");
      }
    }
    // No dedupe performed -> return rawColumns
    return rawColumns;
  }, [gciItems, rawColumns]);

  // Column label mapping for nicer header names
  const colLabels = {
    abc: "ABC",
    occ_id: "Occ. ID",
    porno: "POR No",
    porno_no: "POR No",
    por_no: "POR No",
    wef: "WEF",
    rate: "Rate",
    irla: "IRLA",
    // fallback will use the raw column key
  };

  // Submit handler - user explicit fetch
  const handleSubmit = async (e) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    setLocalError("");

    if (!selectedAbc) {
      setLocalError("Please select an ABC code before submitting.");
      return;
    }
    if (!serviceNo) {
      setLocalError("Service number unavailable — open Personal Details and fetch profile first.");
      return;
    }

    // dispatch and ignore rejection here to avoid unhandled promise
    dispatch(getGCIHistory(serviceNo, selectedAbc)).catch(() => {});
  };

  const clearSelection = () => {
    setSelectedAbc("");
    setLocalError("");
    // Optionally, you could dispatch an action to clear the gciHistory slice if you have one.
    // e.g. dispatch(clearGCIHistory());
  };

  return (
    <div style={{ padding: 16 }}>
      <h3 style={{ marginTop: 0 }}>GCI History</h3>

      {!serviceNo ? (
        <div style={{ marginBottom: 12, color: "var(--red, #b91c1c)" }}>
          No service number available — open Personal Details and fetch profile first.
        </div>
      ) : (
        <div style={{ marginBottom: 12, color: "var(--text)" }}>
          Service No: <strong>{serviceNo}</strong> • Category: <strong>{category}</strong>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ marginBottom: 12 }}>
        <label htmlFor="gci-abc-select" style={{ color: "var(--text)", display: "block", marginBottom: 6 }}>
          Select ABC code
        </label>

        {abcLoading ? (
          <div>Loading codes...</div>
        ) : abcError ? (
          <div style={{ color: "var(--red, #b91c1c)" }}>Error loading codes: {String(abcError)}</div>
        ) : (
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <select
              id="gci-abc-select"
              value={selectedAbc}
              onChange={(e) => {
                setSelectedAbc(e.target.value);
                setLocalError("");
              }}
              disabled={!Array.isArray(abcItems) || abcItems.length === 0}
              style={{
                padding: "8px 10px",
                borderRadius: 6,
                border: "1px solid var(--border, #d1d5db)",
                background: "var(--surface-accent, #fff)",
                color: "var(--text)",
                minWidth: 220,
              }}
              aria-label="Select ABC code"
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
              type="submit"
              disabled={!selectedAbc || !serviceNo}
              style={{
                padding: "8px 12px",
                borderRadius: 6,
                border: "none",
                background: selectedAbc && serviceNo ? "var(--primary, #0ea5a4)" : "var(--surface-accent, #f3f4f6)",
                color: selectedAbc && serviceNo ? "var(--surface, #fff)" : "var(--muted, #94a3b8)",
                cursor: selectedAbc && serviceNo ? "pointer" : "not-allowed",
              }}
              aria-disabled={!selectedAbc || !serviceNo}
            >
              Submit
            </button>

            <button
              type="button"
              onClick={clearSelection}
              disabled={!selectedAbc}
              style={{
                padding: "8px 10px",
                borderRadius: 6,
                border: "1px solid var(--border, #d1d5db)",
                background: "transparent",
                color: "var(--text)",
                cursor: selectedAbc ? "pointer" : "not-allowed",
              }}
            >
              Clear
            </button>

            {selectedAbc && <div style={{ color: "var(--text)" }}>Selected: <strong>{selectedAbc}</strong></div>}
          </div>
        )}
      </form>

      {localError && <div style={{ color: "var(--red, #b91c1c)", marginBottom: 8 }}>{localError}</div>}

      <div style={{ marginTop: 12 }}>
        {gciLoading ? (
          <div>Loading GCI history...</div>
        ) : gciError ? (
          <div style={{ color: "var(--red, #b91c1c)" }}>Error fetching GCI history: {String(gciError)}</div>
        ) : !selectedAbc ? (
          <div style={{ color: "var(--muted)" }}>Please select an ABC code and click <strong>Submit</strong> to view GCI history.</div>
        ) : Array.isArray(gciItems) && gciItems.length === 0 ? (
          <div>No GCI history records found for selected code.</div>
        ) : (
          <div>
            {isFromCache && <div style={{ color: "var(--green, #065f46)", marginBottom: 6 }}>Served from cache</div>}

            <div style={{ overflowX: "auto", border: "1px solid var(--border, #e6eaea)", borderRadius: 8 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
                <thead style={{ background: "var(--surface)", color: "var(--text)" }}>
                  <tr>
                    {displayedColumns.map((col) => (
                      <th
                        key={col}
                        style={{
                          padding: "8px 12px",
                          borderBottom: "1px solid var(--border, #e6eaea)",
                          textAlign: "left",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {colLabels[col] ?? col}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {gciItems.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid var(--surface-accent, #f1f5f9)" }}>
                      {displayedColumns.map((col) => {
                        let raw = row[col];
                        // If 'wef' is a date-ish key, format it nicely
                        if (col.toLowerCase() === "wef") {
                          raw = formatDate(raw);
                        } else if (raw === null || typeof raw === "undefined") {
                          raw = "-";
                        } else if (typeof raw === "object") {
                          raw = JSON.stringify(raw);
                        } else {
                          raw = String(raw);
                        }

                        return (
                          <td key={col} style={{ padding: "8px 12px", verticalAlign: "top", whiteSpace: "normal" }}>
                            {raw}
                          </td>
                        );
                      })}
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
