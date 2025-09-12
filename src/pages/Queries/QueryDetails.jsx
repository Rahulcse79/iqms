import React, { useState, useEffect } from "react";
import axios from "axios";
import "./QueryDetails.css";
import { useQuery } from "@tanstack/react-query";
import ConfirmDialog from "../../components/ConfirmDialog";

const STORAGE_KEY = "queryDrafts_v2";

/**
 * Helpers
 */
const decodeHtml = (html) => {
  if (!html && html !== "") return html;
  try {
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
  } catch {
    return html;
  }
};

const tryParseDate = (dateStr) => {
  if (!dateStr) return null;
  const direct = new Date(dateStr);
  if (!isNaN(direct.getTime())) return direct;

  const replaced = dateStr.replace(/-/g, " ");
  const parsed2 = new Date(replaced);
  if (!isNaN(parsed2.getTime())) return parsed2;

  return null;
};

const formatDateFlexible = (dateStr) => {
  if (!dateStr) return "N/A";
  const parsed = tryParseDate(dateStr);
  if (parsed) return parsed.toLocaleString();
  return dateStr;
};

/**
 * Fetch query details
 */
const fetchQueryDetails = async (queryId) => {
  const url = `http://sampoorna.cao.local/afcao/ipas/ivrs/queryDetails/${queryId}`;
  const { data } = await axios.get(url);

  if (!data || !Array.isArray(data.items) || data.items.length === 0) {
    return null;
  }

  const raw = data.items[0];
  let parsedJsonArray = [];
  try {
    parsedJsonArray = raw.json_data ? JSON.parse(raw.json_data) : [];
  } catch {
    parsedJsonArray = [];
  }

  const details =
    Array.isArray(parsedJsonArray) && parsedJsonArray.length > 0
      ? parsedJsonArray[0]
      : {};

  const history = [];

  if (details["Adjutant Reply"] || details["Adjutant Reply Date"]) {
    history.push({
      by: "Adjutant",
      text: details["Adjutant Reply"] || "",
      date: details["Adjutant Reply Date"] || null,
    });
  }

  if (details["SAO Reply"] || details["SAO Reply Dated"]) {
    history.push({
      by: "SAO",
      text: details["SAO Reply"] || "",
      date: details["SAO Reply Dated"] || null,
    });
  }

  const wings = details.wings_reply || {};
  const wingDateMap = {};
  Object.keys(wings).forEach((k) => {
    if (/\bdate$/i.test(k)) {
      const prefix = k.replace(/\s*Date$/i, "").trim();
      wingDateMap[prefix] = wings[k];
    }
  });
  Object.keys(wings).forEach((k) => {
    if (/\bdate$/i.test(k)) return;
    const prefix = k;
    const date = wingDateMap[prefix] || null;
    history.push({ by: prefix, text: wings[k], date });
  });

  history.sort((a, b) => {
    const da = tryParseDate(a.date);
    const db = tryParseDate(b.date);
    if (da && db) return db - da;
    if (da) return -1;
    if (db) return 1;
    return 0;
  });

  return { ...raw, details, parsedJsonArray, history };
};

const QueryDetails = ({
  queryId,
  draft,
  setDraft,
  enableCache = false,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState("details");
  const [formError, setFormError] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const [internalDraft, setInternalDraft] = useState({
    replyText: "",
    forwardOption: "",
    transferSection: "",
  });

  const localDraft = enableCache ? draft : internalDraft;
  const localSetDraft = enableCache ? setDraft : setInternalDraft;

  useEffect(() => {
    if (enableCache && queryId) {
      const allDrafts = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      if (allDrafts[queryId]) {
        localSetDraft(allDrafts[queryId]);
      }
    }
  }, [queryId, enableCache, localSetDraft]);

  const { data: item, isLoading, isError, error } = useQuery({
    queryKey: ["query", queryId],
    queryFn: () => fetchQueryDetails(queryId),
    enabled: !!queryId,
    retry: 2,
    staleTime: 1000 * 60 * 5,
  });

  const handleChange = (field, value) => {
    localSetDraft((prev) => {
      const newDraft = { ...prev, [field]: value };
      if (enableCache) {
        const allDrafts = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
        allDrafts[queryId] = newDraft;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allDrafts));
      }
      return newDraft;
    });
  };

  const handleSubmit = () => {
    if (!localDraft.replyText.trim()) {
      setFormError("Reply cannot be empty.");
      return;
    }
    if (!localDraft.forwardOption) {
      setFormError("Please select an option from 'Reply / Forward To'.");
      return;
    }
    if (
      localDraft.forwardOption === "Transfer to Sub-Section" &&
      !localDraft.transferSection
    ) {
      setFormError("Please select a sub-section.");
      return;
    }

    setFormError("");
    setShowConfirmDialog(true);
  };

  const handleConfirmSubmit = () => {
    console.log("Submitted:", localDraft);

    if (enableCache) {
      const allDrafts = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      delete allDrafts[queryId];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allDrafts));
    }

    localSetDraft({ replyText: "", forwardOption: "", transferSection: "" });
    setShowConfirmDialog(false);
  };

  if (isLoading) return <div className="qdetails-container">Loading...</div>;
  if (isError)
    return (
      <div className="qdetails-container">
        <div className="qdetails-card">
          <h3>Error fetching query: {error?.message || "Unknown error"}</h3>
          {onBack && (
            <button className="btn" onClick={onBack}>
              Back
            </button>
          )}
        </div>
      </div>
    );
  if (!item) return <div className="qdetails-container">No data found</div>;

  const details = item.details || {};
  const subject =
    decodeHtml(details.Subject || details.subject || item.subject || "");
  const submitDate = details.submit_date || item.submit_date || "";
  const queryBy =
    details["Query by"] ||
    details["Query By"] ||
    details["QueryBy"] ||
    item.pers ||
    "N/A";
  const serviceNo = item.sno || details["Pers Details"] || "N/A";
  const pendingWith =
    item.pen_with_cap ||
    item.pending_with ||
    details["pending_with"] ||
    "N/A";

  const unit = decodeHtml(details.unit || item.unit || "");
  const head = decodeHtml(details.head || item.head || "");
  const porRef = decodeHtml(
    details["POR Reference(s)"] ||
      details["POR References"] ||
      details["POR Reference"] ||
      ""
  );
  const voip =
    details["VoIP"] ||
    details.VoIP ||
    details.voip ||
    item.VoIP ||
    item.voip ||
    "";

  const rawQueryText =
    details["Query Details"] ||
    details["Query details"] ||
    details["QueryDetails"] ||
    "";

  const renderMultiline = (text) => {
    if (!text && text !== "") return null;
    const decoded = decodeHtml(text || "");
    return decoded.split(/\r?\n/).map((line, i) => (
      <p key={i} style={{ margin: "6px 0" }}>
        {line}
      </p>
    ));
  };

  return (
    <div className="qdetails-container split-active">
      {onBack && (
        <button className="btn back-btn" onClick={onBack}>
          ← Back
        </button>
      )}

      <div className="query-details-page">
        <h2 className="page-title">View Query Status</h2>

        {/* Tabs */}
        <div className="tab-header">
          <button
            className={`tab-btn ${activeTab === "details" ? "active" : ""}`}
            onClick={() => setActiveTab("details")}
          >
            Query Details
          </button>
          <button
            className={`tab-btn ${activeTab === "history" ? "active" : ""}`}
            onClick={() => setActiveTab("history")}
          >
            Query History
          </button>
        </div>

        {/* Query Details */}
        {activeTab === "details" && (
          <div className="query-details">
            <div className="header-card">
              <h2 className="subject">{subject || "N/A"}</h2>
              <span className="query-id">Query ID: {item.doc_id}</span>
            </div>

            <div className="details-card">
              <div>
                <strong>Query By:</strong> {queryBy}
              </div>
              <div>
                <strong>Service No:</strong> {serviceNo}
              </div>
              <div>
                <strong>Category:</strong> {item.cat ?? "N/A"}
              </div>
              <div>
                <strong>Pending With:</strong> {pendingWith}
              </div>
              <div>
                <strong>Date:</strong> {formatDateFlexible(submitDate)}
              </div>

              <hr style={{ margin: "12px 0" }} />

              <div>
                <strong>Unit:</strong> {unit || "N/A"}
              </div>
              <div>
                <strong>Head:</strong> {head || "N/A"}
              </div>
              <div>
                <strong>POR Reference(s):</strong> {porRef || "N/A"}
              </div>
              <div>
                <strong>VoIP:</strong> {voip || "N/A"}
              </div>
            </div>

            {/* Query Body */}
            <div className="query-body-card">
              <h3>Query</h3>
              <div className="query-body">{renderMultiline(rawQueryText)}</div>
            </div>

            {/* Wings Reply */}
            {details.wings_reply && (
              <div className="wings-card">
                <h4>Wings Replies</h4>
                {Object.keys(details.wings_reply).length === 0 ? (
                  <div>No wings replies</div>
                ) : (
                  Object.keys(details.wings_reply)
                    .filter((k) => !/\bdate$/i.test(k))
                    .map((k, idx) => {
                      const dateKey = `${k} Date`;
                      const dateVal =
                        details.wings_reply[dateKey] ||
                        details.wings_reply[`${k} Date`] ||
                        null;
                      return (
                        <div key={idx} className="wings-entry">
                          <strong>{k}:</strong>
                          <div style={{ marginTop: 6 }}>
                            {renderMultiline(details.wings_reply[k])}
                          </div>
                          {dateVal && (
                            <div
                              style={{
                                marginTop: 6,
                                fontSize: 12,
                                color: "#666",
                              }}
                            >
                              <em>{formatDateFlexible(dateVal)}</em>
                            </div>
                          )}
                        </div>
                      );
                    })
                )}
              </div>
            )}

            {/* Reply Form */}
            <div className="form-section">
              <div className="form-group">
                <label>Reply</label>
                <textarea
                  placeholder="Type your reply..."
                  value={localDraft.replyText}
                  onChange={(e) => handleChange("replyText", e.target.value)}
                  rows={6}
                />
              </div>

              <div className="form-group">
                <label>Reply / Forward To</label>
                <select
                  value={localDraft.forwardOption}
                  onChange={(e) => handleChange("forwardOption", e.target.value)}
                >
                  <option value="">--Select--</option>
                  <option value="Transfer to Supervisor">
                    Transfer to Supervisor
                  </option>
                  <option value="Transfer to Sub-Section">
                    Transfer to Sub-Section
                  </option>
                </select>
              </div>

              {localDraft.forwardOption === "Transfer to Sub-Section" && (
                <div className="form-group">
                  <label>Select Sub-Section</label>
                  <select
                    value={localDraft.transferSection}
                    onChange={(e) =>
                      handleChange("transferSection", e.target.value)
                    }
                  >
                    <option value="">--Select Sub-Section--</option>
                    <option value="Section A">Section A</option>
                    <option value="Section B">Section B</option>
                    <option value="Section C">Section C</option>
                  </select>
                </div>
              )}

              <div className="form-actions">
                {formError && <div className="form-error">{formError}</div>}
                <button className="btn primary" onClick={handleSubmit}>
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <div className="query-history">
            <h3>Previous Replies</h3>
            {item.history && item.history.length > 0 ? (
              item.history.map((h, i) => (
                <div key={i} className="history-entry">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <strong>{h.by}</strong>
                    {h.date && (
                      <span style={{ fontSize: 12, color: "#666" }}>
                        {formatDateFlexible(h.date)}
                      </span>
                    )}
                  </div>
                  <div style={{ marginTop: 6 }}>{renderMultiline(h.text)}</div>
                  <hr style={{ margin: "12px 0" }} />
                </div>
              ))
            ) : (
              <div>No history available</div>
            )}
          </div>
        )}
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={showConfirmDialog}
        onConfirm={handleConfirmSubmit}
        onCancel={() => setShowConfirmDialog(false)}
      />
    </div>
  );
};

export default QueryDetails;
