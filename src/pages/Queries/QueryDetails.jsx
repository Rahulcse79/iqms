import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./QueryDetails.css";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import ConfirmDialog from "../../components/ConfirmDialog";
import {
  getCurrentActiveRole,
  fetchTransferToVerifierOption,
  fetchTransferToSubsectionOptions,
  submitIqmsReply,
  validateReplyPermission,
  fetchQueriesForRoleNew,
  getDesignationFlags,
} from "../../utils/helpers";
import QueryHistorytab from "./QueryHistorytab";
import { useDispatch } from "react-redux";
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
  const [permissionCheck, setPermissionCheck] = useState({
    canReply: false,
    reason: "",
    isLoading: true,
    debug: {},
  });

  // State for post-submission refresh
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshProgress, setRefreshProgress] = useState({});

  // ENHANCED: Submission state management
  const [submitState, setSubmitState] = useState({
    step: "idle",
    error: null,
    progress: {},
  });

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
  const activeRole = getCurrentActiveRole();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

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

  useEffect(() => {
    if (!item) return;
    const validation = validateReplyPermission(item, activeRole);
    setPermissionCheck({
      canReply: validation.canTakeAction,
      reason: validation.reason,
      isLoading: false,
      debug: validation.debug,
    });
  }, [item, activeRole]);

  useEffect(() => {
    const loadVerifierOption = async () => {
      if (!item?.pending_with || !permissionCheck.canReply) return;
      setLoadingVerifierOption(true);
      try {
        const option = await fetchTransferToVerifierOption(item.pending_with);
        setVerifierOption(option);
      } catch (err) {
        setApiErrors((prev) => ({ ...prev, verifier: err.message }));
      } finally {
        setLoadingVerifierOption(false);
      }
    };
    loadVerifierOption();
  }, [item?.pending_with, permissionCheck.canReply]);

  useEffect(() => {
    const loadSubsectionOptions = async () => {
      if (
        localDraft.forwardOption !== "Transfer to Sub-Section" ||
        !item?.doc_id ||
        !permissionCheck.canReply
      ) {
        setSubsectionOptions([]);
        return;
      }
      setLoadingSubsectionOptions(true);
      try {
        const options = await fetchTransferToSubsectionOptions(item.doc_id);
        setSubsectionOptions(options);
      } catch (err) {
        setApiErrors((prev) => ({ ...prev, subsection: err.message }));
      } finally {
        setLoadingSubsectionOptions(false);
      }
    };
    loadSubsectionOptions();
  }, [localDraft.forwardOption, item?.doc_id, permissionCheck.canReply]);

  const handleChange = (field, value) => {
    localSetDraft((prev) => {
      const newDraft = { ...prev, [field]: value };
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
    setFormError("");
    if (!permissionCheck.canReply) {
      setFormError(permissionCheck.reason);
      return;
    }
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
    setShowConfirmDialog(true);
  };

  const handleConfirmSubmit = async () => {
    setSubmitState({ step: "submitting", error: null, progress: {} });
    try {
      // Step 1: Submit the reply
      const result = await submitIqmsReply({
        queryId: item.doc_id,
        replyText: localDraft.replyText,
        forwardOption: localDraft.forwardOption,
        transferSection: localDraft.transferSection,
        pendingWith: item.pending_with,
        verifierOption: verifierOption,
        subsectionOptions: subsectionOptions,
      });
      if (!result.success)
        throw new Error(result.error.message || "Submission failed.");

      // Step 2: Mark as submitted and clear draft
      setSubmitState({ step: "submitted", error: null, progress: {} });
      if (enableCache) {
        const allDrafts = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
        delete allDrafts[queryId];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allDrafts));
      }
      localSetDraft({ replyText: "", forwardOption: "", transferSection: "" });

      // Step 3: Wait for user to see the success message
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Step 4: Refresh all user queries
      setSubmitState((prev) => ({ ...prev, step: "refreshing" }));
      const flags = await getDesignationFlags(activeRole);
      await fetchQueriesForRoleNew(
        dispatch,
        activeRole,
        flags,
        (progress) => setSubmitState((prev) => ({ ...prev, progress })),
        (error) => console.warn("Non-critical refresh error:", error)
      );

      // Step 5: Mark as completed
      setSubmitState((prev) => ({ ...prev, step: "completed" }));
      queryClient.invalidateQueries({ queryKey: ["query", queryId] });

      // Step 6: Wait and navigate back
      await new Promise((resolve) => setTimeout(resolve, 1500));
      navigate(-1);
    } catch (err) {
      console.error("❌ Submission or Refresh process failed:", err);
      setSubmitState({ step: "error", error: err.message, progress: {} });
    }
  };

  const handleCloseDialog = () => {
    if (
      submitState.step !== "submitting" &&
      submitState.step !== "refreshing"
    ) {
      setShowConfirmDialog(false);
      setSubmitState({ step: "idle", error: null, progress: {} });
    }
  };

  const getDialogTitle = () => {
    switch (submitState.step) {
      case "submitting":
        return "Submitting...";
      case "submitted":
      case "refreshing":
        return "Refreshing Data...";
      case "completed":
        return "Success!";
      case "error":
        return "Submission Failed";
      default:
        return "Confirm Submission";
    }
  };

  // This effect handles the post-submission flow
  useEffect(() => {
    if (!submitState.success) return;

    const handlePostSubmit = async () => {
      // 1. Wait 2 seconds to show success message
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // 2. Start refreshing
      setIsRefreshing(true);
      console.log("🔄 Starting post-submission data refresh...");

      try {
        setRefreshProgress({ step: "fetching", taskName: "designation flags" });
        const flags = await getDesignationFlags(activeRole);

        const fetchResult = await fetchQueriesForRoleNew(
          dispatch,
          activeRole,
          flags,
          (progress) => {
            setRefreshProgress({
              step: "fetching",
              ...progress,
            });
          },
          (error) => {
            console.warn(
              "Non-critical error during post-submit refresh:",
              error
            );
          }
        );

        if (fetchResult.success) {
          setRefreshProgress({
            step: "completed",
            successful: fetchResult.successful,
            total: fetchResult.total,
          });
          console.log(`✅ Post-submit refresh complete.`);
        } else {
          throw new Error("Query refresh failed with some errors.");
        }
      } catch (error) {
        console.error("❌ Critical error during post-submit refresh:", error);
        setRefreshProgress({ step: "error", error: error.message });
      } finally {
        // 3. Wait a bit to show final status, then close dialog and navigate back
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setIsRefreshing(false);
        setShowConfirmDialog(false);
        navigate(-1);
      }
    };

    handlePostSubmit();
  }, [submitState.success, dispatch, activeRole, onBack, navigate]);

  const getDialogContent = () => {
    switch (submitState.step) {
      case "submitting":
        return (
          <div className="dialog-content-centered">
            Submitting your reply... Please wait.
          </div>
        );
      case "submitted":
      case "refreshing":
        const {
          taskName = "tasks",
          current = 0,
          total = 0,
        } = submitState.progress;
        return (
          <div className="success-message">
            ✅ Reply submitted! Refreshing {taskName} ({current}/{total})...
          </div>
        );
      case "completed":
        return (
          <div className="success-message">
            ✅ Refresh complete! Navigating back...
          </div>
        );
      case "error":
        return (
          <div className="error-details">
            <p>The submission failed:</p>
            <div className="error-detail">{submitState.error}</div>
            <button
              className="btn btn-secondary"
              onClick={handleCloseDialog}
              style={{ marginTop: "1rem" }}
            >
              Close
            </button>
          </div>
        );
      default:
        // This is the initial view of the dialog before submission starts.
        return (
          <div className="confirmation-details">
            <p>
              <strong>Are you sure you want to submit this reply?</strong>
            </p>
            <div className="submission-summary">
              <div className="summary-item">
                <strong>Action:</strong>{" "}
                {localDraft.forwardOption === "Transfer to Supervisor" &&
                verifierOption
                  ? verifierOption.DESCRIPTION
                  : localDraft.forwardOption === "Transfer to Sub-Section" &&
                    localDraft.transferSection
                  ? subsectionOptions.find(
                      (opt) => opt.ACTIVITY === localDraft.transferSection
                    )?.DESCRIPTION
                  : localDraft.forwardOption}
              </div>
              <div className="summary-item">
                <strong>Reply Length:</strong>{" "}
                {localDraft.replyText.trim().length} characters
              </div>
            </div>
            <div className="warning-note">
              <small>⚠️ This action cannot be undone.</small>
            </div>
          </div>
        );
    }
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

  const pers = item.pers;

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
        <div style={{ display: activeTab === 'details' ? 'block' : 'none' }}>
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
              <div>
                <strong>Person:</strong> {pers || "N/A"}
              </div>
            </div>

            {/* Query Body */}
            <div className="query-body-card">
              <h3>Query</h3>
              <div className="query-body">{renderMultiline(rawQueryText)}</div>
            </div>

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
                    <div className="history-text">
                      {renderMultiline(h.text)}
                    </div>
                    <hr className="separator" />
                  </div>
                ))
              ) : (
                <div className="panel-empty">No history available</div>
              )}
            </div>

            {/* Enhanced Reply Form with Permission Check */}
            <div className="form-section">
              {/* Permission Status Display */}
              {permissionCheck.isLoading ? (
                <div className="permission-loading">
                  <div className="loading-spinner"></div>
                  <span>Checking permissions...</span>
                </div>
              ) : !permissionCheck.canReply ? (
                <div className="permission-denied">
                  <div className="permission-icon">🔒</div>
                  <div className="permission-message">
                    <h4>Reply Not Available</h4>
                    <p>{permissionCheck.reason}</p>
                    {process.env.NODE_ENV === "development" && (
                      <details className="debug-info">
                        <summary>Debug Info (dev only)</summary>
                        <div>
                          <strong>Pending With:</strong>{" "}
                          {permissionCheck.debug.pendingWith}
                        </div>
                        <div>
                          <strong>User Role:</strong>{" "}
                          {permissionCheck.debug.userRole}
                        </div>
                        <div>
                          <strong>User Level:</strong>{" "}
                          {permissionCheck.debug.userLevel}
                        </div>
                        <div>
                          <strong>Query Level:</strong>{" "}
                          {permissionCheck.debug.extractedLevel}
                        </div>
                        <div>
                          <strong>Valid Role:</strong>{" "}
                          {permissionCheck.debug.hasValidRole ? "Yes" : "No"}
                        </div>
                        <div>
                          <strong>Valid Pending With:</strong>{" "}
                          {permissionCheck.debug.hasValidPendingWith
                            ? "Yes"
                            : "No"}
                        </div>
                      </details>
                    )}
                  </div>
                </div>
              ) : (
                <div className="permission-granted">
                  <div className="permission-icon">✅</div>
                  <div className="permission-message">
                    <h4>Reply Available</h4>
                    <p>{permissionCheck.reason}</p>
                  </div>
                </div>
              )}

              {/* Reply Form - Only show if user has permission */}
              {permissionCheck.canReply && (
                <>
                  <div className="form-group">
                    <label>Reply</label>
                    <textarea
                      placeholder="Type your reply..."
                      value={localDraft.replyText}
                      onChange={(e) =>
                        handleChange("replyText", e.target.value)
                      }
                      rows="6"
                      disabled={submitState.loading}
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      Reply & Forward To
                      {loadingVerifierOption && (
                        <span className="loading-indicator">⏳</span>
                      )}
                      {apiErrors.verifier && (
                        <span
                          className="error-indicator"
                          title={apiErrors.verifier}
                        >
                          ⚠️
                        </span>
                      )}
                    </label>
                    <select
                      value={localDraft.forwardOption}
                      onChange={(e) =>
                        handleChange("forwardOption", e.target.value)
                      }
                      disabled={loadingVerifierOption || submitState.loading}
                    >
                      <option value="">--Select--</option>
                      {verifierOption && (
                        <option value="Transfer to Supervisor">
                          {verifierOption.DESCRIPTION} (Transfer to Supervisor)
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
                          <span className="loading-indicator">⏳</span>
                        )}
                        {apiErrors.subsection && (
                          <span
                            className="error-indicator"
                            title={apiErrors.subsection}
                          >
                            ⚠️
                          </span>
                        )}
                      </label>
                      <select
                        value={localDraft.transferSection}
                        onChange={(e) =>
                          handleChange("transferSection", e.target.value)
                        }
                        disabled={
                          loadingSubsectionOptions || submitState.loading
                        }
                      >
                        <option value="">--Select Sub-Section--</option>
                        {subsectionOptions.map((option, index) => (
                          <option key={index} value={option.ACTIVITY}>
                            {option.DESCRIPTION}
                          </option>
                        ))}
                      </select>
                      {subsectionOptions.length > 0 && (
                        <div className="options-count">
                          {subsectionOptions.length} subsection
                          {subsectionOptions.length !== 1 ? "s" : ""} available
                        </div>
                      )}
                    </div>
                  )}

                  <div className="form-actions">
                    {formError && <div className="form-error">{formError}</div>}

                    {/* Enhanced: Show submission error separately */}
                    {submitState.error && !showConfirmDialog && (
                      <div className="submit-error">
                        <div className="error-icon">❌</div>
                        <div className="error-text">{submitState.error}</div>
                      </div>
                    )}

                    <button
                      className="btn primary"
                      onClick={handleSubmit}
                      disabled={
                        loadingVerifierOption ||
                        loadingSubsectionOptions ||
                        submitState.loading ||
                        !permissionCheck.canReply
                      }
                    >
                      {submitState.loading ? "Processing..." : "Submit"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* History Tab */}
        <div style={{ display: activeTab === 'history' ? 'block' : 'none' }}>
          <QueryHistorytab docId={queryId} isActive={activeTab === 'history'} />
        </div>
      </div>

      {/* ENHANCED: Confirmation Dialog */}
      <ConfirmDialog
        open={showConfirmDialog}
        onConfirm={handleConfirmSubmit}
        onCancel={handleCloseDialog}
        loading={
          submitState.step === "submitting" || submitState.step === "refreshing"
        }
        error={submitState.error}
        title={getDialogTitle()}
      >
        {getDialogContent()}
      </ConfirmDialog>
    </div>
  );
};

export default QueryDetails;
