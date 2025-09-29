import React, { useState, useEffect } from "react";
import axios from "axios";
import "./QueryDetails.css";
import { useQuery } from "@tanstack/react-query";
import ConfirmDialog from "../../components/ConfirmDialog";
import {
  getCurrentActiveRole,
  fetchTransferToVerifierOption,
  fetchTransferToSubsectionOptions,
} from "../../utils/helpers";

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

  // API-driven dropdown states
  const [verifierOption, setVerifierOption] = useState(null);
  const [subsectionOptions, setSubsectionOptions] = useState([]);
  const [loadingVerifierOption, setLoadingVerifierOption] = useState(false);
  const [loadingSubsectionOptions, setLoadingSubsectionOptions] =
    useState(false);
  const [apiErrors, setApiErrors] = useState({
    verifier: null,
    subsection: null,
  });

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

  const {
    data: item,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["query", queryId],
    queryFn: () => fetchQueryDetails(queryId),
    enabled: !!queryId,
    retry: 2,
    staleTime: 1000 * 60 * 5,
  });

  // Load verifier option when query data is available
  useEffect(() => {
    const loadVerifierOption = async () => {
      if (!item?.pending_with) return;

      setLoadingVerifierOption(true);
      setApiErrors((prev) => ({ ...prev, verifier: null }));

      try {
        const option = await fetchTransferToVerifierOption(item.pending_with);
        setVerifierOption(option);
        console.log("📋 Verifier option loaded:", option.DESCRIPTION);
      } catch (error) {
        console.error("❌ Failed to load verifier option:", error);
        setApiErrors((prev) => ({ ...prev, verifier: error.message }));
        setVerifierOption(null);
      } finally {
        setLoadingVerifierOption(false);
      }
    };

    loadVerifierOption();
  }, [item?.pending_with]);

  // Load subsection options when "Transfer to Sub-Section" is selected
  useEffect(() => {
    const loadSubsectionOptions = async () => {
      if (
        localDraft.forwardOption !== "Transfer to Sub-Section" ||
        !item?.doc_id
      ) {
        setSubsectionOptions([]);
        return;
      }

      setLoadingSubsectionOptions(true);
      setApiErrors((prev) => ({ ...prev, subsection: null }));

      try {
        const options = await fetchTransferToSubsectionOptions(item.doc_id);
        setSubsectionOptions(options);
        console.log("📋 Subsection options loaded:", options.length, "options");
      } catch (error) {
        console.error("❌ Failed to load subsection options:", error);
        setApiErrors((prev) => ({ ...prev, subsection: error.message }));
        setSubsectionOptions([]);
      } finally {
        setLoadingSubsectionOptions(false);
      }
    };

    loadSubsectionOptions();
  }, [localDraft.forwardOption, item?.doc_id]);

  const handleChange = (field, value) => {
    localSetDraft((prev) => {
      const newDraft = { ...prev, [field]: value };

      // Reset transfer section when forward option changes
      if (field === "forwardOption" && value !== "Transfer to Sub-Section") {
        newDraft.transferSection = "";
      }

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

    // Get selected subsection details if applicable
    if (
      localDraft.forwardOption === "Transfer to Sub-Section" &&
      localDraft.transferSection
    ) {
      const selectedSubsection = subsectionOptions.find(
        (option) => option.ACTIVITY === localDraft.transferSection
      );
      console.log("Selected subsection details:", selectedSubsection);
    }

    if (enableCache) {
      const allDrafts = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      delete allDrafts[queryId];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allDrafts));
    }

    localSetDraft({ replyText: "", forwardOption: "", transferSection: "" });
    setShowConfirmDialog(false);
  };

  if (isLoading)
    return (
      <div style={{ color: "var(--text)" }} className="qdetails-container">
        Loading...
      </div>
    );
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
  const subject = decodeHtml(
    details.Subject || details.subject || item.subject || ""
  );
  const submitDate = details.submit_date || item.submit_date || "";
  const queryBy =
    details["Query by"] ||
    details["Query By"] ||
    details["QueryBy"] ||
    item.pers ||
    "N/A";
  const serviceNo = item.sno || details["Pers Details"] || "N/A";
  const pendingWith =
    item.pen_with_cap || item.pending_with || details["pending_with"] || "N/A";

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

              <hr className="separator" />

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
                  <div className="panel-empty">No wings replies</div>
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
                          <div className="wings-reply">
                            {renderMultiline(details.wings_reply[k])}
                          </div>
                          {dateVal && (
                            <div className="wings-date">
                              <em>{formatDateFlexible(dateVal)}</em>
                            </div>
                          )}
                        </div>
                      );
                    })
                )}
              </div>
            )}

            {/* Enhanced Reply Form with Dynamic Dropdowns */}
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
                <label>
                  Reply / Forward To
                  {loadingVerifierOption && (
                    <span className="loading-indicator"> 🔄</span>
                  )}
                  {apiErrors.verifier && (
                    <span
                      className="error-indicator"
                      title={apiErrors.verifier}
                    >
                      {" "}
                      ⚠️
                    </span>
                  )}
                </label>
                <select
                  value={localDraft.forwardOption}
                  onChange={(e) =>
                    handleChange("forwardOption", e.target.value)
                  }
                  disabled={loadingVerifierOption}
                >
                  <option value="">--Select--</option>
                  {verifierOption && (
                    <option value="Transfer to Supervisor">
                      {verifierOption.DESCRIPTION || "Transfer to Supervisor"}
                    </option>
                  )}
                  <option value="Transfer to Sub-Section">
                    Transfer to Sub-Section
                  </option>
                </select>
              </div>

              {localDraft.forwardOption === "Transfer to Sub-Section" && (
                <div className="form-group">
                  <label>
                    Select Sub-Section
                    {loadingSubsectionOptions && (
                      <span className="loading-indicator"> 🔄</span>
                    )}
                    {apiErrors.subsection && (
                      <span
                        className="error-indicator"
                        title={apiErrors.subsection}
                      >
                        {" "}
                        ⚠️
                      </span>
                    )}
                  </label>
                  <select
                    value={localDraft.transferSection}
                    onChange={(e) =>
                      handleChange("transferSection", e.target.value)
                    }
                    disabled={loadingSubsectionOptions}
                  >
                    <option value="">--Select Sub-Section--</option>
                    {subsectionOptions.map((option, index) => (
                      <option key={index} value={option.ACTIVITY}>
                        {option.DESCRIPTION}
                      </option>
                    ))}
                  </select>

                  {/* Show count of available options */}
                  {subsectionOptions.length > 0 && (
                    <div className="options-count">
                      {subsectionOptions.length} subsection
                      {subsectionOptions.length !== 1 ? "s" : ""} available
                    </div>
                  )}
                </div>
              )}

              {/* Show active role info for debugging */}
              {process.env.NODE_ENV === "development" && (
                <div className="debug-info">
                  <details>
                    <summary>Debug Info (dev only)</summary>
                    <div>
                      <strong>Active Role:</strong>{" "}
                      {getCurrentActiveRole()?.PORTFOLIO_NAME || "Not found"}
                    </div>
                    <div>
                      <strong>Pending With:</strong> {item.pending_with}
                    </div>
                    <div>
                      <strong>Doc ID:</strong> {item.doc_id}
                    </div>
                  </details>
                </div>
              )}

              <div className="form-actions">
                {formError && <div className="form-error">{formError}</div>}
                <button
                  className="btn primary"
                  onClick={handleSubmit}
                  disabled={loadingVerifierOption || loadingSubsectionOptions}
                >
                  {loadingVerifierOption || loadingSubsectionOptions
                    ? "Loading..."
                    : "Submit"}
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
                  <div className="history-meta">
                    <strong>{h.by}</strong>
                    {h.date && (
                      <span className="small-muted">
                        {formatDateFlexible(h.date)}
                      </span>
                    )}
                  </div>
                  <div className="history-text">{renderMultiline(h.text)}</div>
                  <hr className="separator" />
                </div>
              ))
            ) : (
              <div className="panel-empty">No history available</div>
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
