import React, { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import "./QueryView.css";
import Comparison from "../Comparison";
import PORDATA from "../ProfileView/components/PORDataBankTab";
import QueryDetails from "./QueryDetails";
import PersonalDetails from "../ProfileView/components/PersonalDetails";
import IRLAVIEW from "../ProfileView/components/IRLAHistoryTab";
import GCIHistory from "../ProfileView/components/GCIHistoryTab";
import { fetchPersonalData } from "../../actions/ProfileAction";
import { useDispatch, useSelector } from "react-redux";
import { UserRoleLabel } from "../../constants/Enum";
import ProfileView from "../ProfileView/ProfileView";

// Enhanced ResizablePanel Component
const ResizablePanel = ({ onBack }) => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const row = location.state?.row || null;
  const fallbackPath = location.state?.from || "/view/queries/incoming";
  const isQueryRoute = location.pathname.includes("/view/query/");
  const BASENAME = process.env.PUBLIC_URL || "/app2";
  const hasForcedExitRef = useRef(false);

  const [queryType, setQueryType] = useState("Personal Data Issue");

  // Panel state management
  const [panelState, setPanelState] = useState({
    leftWidth: 50,
    isLeftCollapsed: false,
    isRightCollapsed: false,
    isResizing: false,
    lastLeftWidth: 50,
    lastRightWidth: 50,
  });

  // Refs for DOM manipulation
  const containerRef = useRef(null);
  const isResizingRef = useRef(false);
  const startXRef = useRef(0);
  const startLeftWidthRef = useRef(50);

  // Redux setup
  const dispatch = useDispatch();
  const personalDataState = useSelector((state) => state.personalData);
  const { loading, error, data: personalData } = personalDataState;
  const enableCache = location.pathname.includes("view/query");

  // Draft state for caching
  const [draft, setDraft] = useState({
    replyText: "",
    forwardOption: "",
    transferSection: "",
  });

  // Query parameters
  const searchParams = new URLSearchParams(location.search);
  const category = searchParams.get("category");
  const queryValue = searchParams.get("q");

  // Storage keys
  const STORAGE_KEY = "queryDrafts_v2";
  const PANEL_LAYOUT_KEY = `panelLayout_${id}`;

  // Helper functions
  const getCategoryCode = (category) => {
    const entry = Object.entries(UserRoleLabel).find(
      ([code, label]) => label.toLowerCase() === String(category).toLowerCase()
    );
    return entry ? Number(entry[0]) : null;
  };

  // Save panel layout to localStorage
  const savePanelLayout = useCallback(
    (layout) => {
      try {
        if (enableCache && id) {
          localStorage.setItem(PANEL_LAYOUT_KEY, JSON.stringify(layout));
        }
      } catch (error) {
        console.warn("Failed to save panel layout:", error);
      }
    },
    [enableCache, id, PANEL_LAYOUT_KEY]
  );

  // Load panel layout from localStorage
  const loadPanelLayout = useCallback(() => {
    try {
      if (enableCache && id) {
        const saved = localStorage.getItem(PANEL_LAYOUT_KEY);
        return saved ? JSON.parse(saved) : null;
      }
    } catch (error) {
      console.warn("Failed to load panel layout:", error);
    }
    return null;
  }, [enableCache, id, PANEL_LAYOUT_KEY]);

  // Initialize panel layout
  useEffect(() => {
    const savedLayout = loadPanelLayout();
    if (savedLayout) {
      setPanelState((prevState) => ({
        ...prevState,
        ...savedLayout,
      }));
    }
  }, [loadPanelLayout]);

  // Save layout when it changes
  useEffect(() => {
    savePanelLayout(panelState);
  }, [panelState, savePanelLayout]);

  // Fetch personal data
  useEffect(() => {
    if (queryValue && category) {
      const catCode = getCategoryCode(category);
      if (catCode !== null) {
        dispatch(fetchPersonalData(queryValue, catCode));
      }
    }
  }, [queryValue, category, dispatch]);

  // Load draft from localStorage
  useEffect(() => {
    if (enableCache && id) {
      try {
        const allDrafts = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
        if (allDrafts[id]) {
          setDraft(allDrafts[id]);
        }
      } catch (error) {
        console.warn("Failed to load draft:", error);
      }
    }
  }, [id, enableCache]);

  // Resize handlers with error handling and performance optimization
  const handleMouseDown = useCallback(
    (e) => {
      if (e.button !== 0) return; // Only left mouse button

      e.preventDefault();
      e.stopPropagation();

      isResizingRef.current = true;
      startXRef.current = e.clientX;
      startLeftWidthRef.current = panelState.leftWidth;

      setPanelState((prev) => ({ ...prev, isResizing: true }));

      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      // Add event listeners with passive options for better performance
      document.addEventListener("mousemove", handleMouseMove, {
        passive: false,
      });
      document.addEventListener("mouseup", handleMouseUp, { once: true });

      // Accessibility: Announce resize start
      const announcement = document.createElement("div");
      announcement.setAttribute("aria-live", "polite");
      announcement.setAttribute("class", "sr-only");
      announcement.textContent = "Panel resize started";
      document.body.appendChild(announcement);
      setTimeout(() => document.body.removeChild(announcement), 1000);
    },
    [panelState.leftWidth]
  );

  const handleMouseMove = useCallback((e) => {
    if (!isResizingRef.current || !containerRef.current) return;

    requestAnimationFrame(() => {
      try {
        const containerRect = containerRef.current.getBoundingClientRect();
        const deltaX = e.clientX - startXRef.current;
        const containerWidth = containerRect.width;
        const deltaPercentage = (deltaX / containerWidth) * 100;

        let newLeftWidth = startLeftWidthRef.current + deltaPercentage;

        // Enforce minimum and maximum constraints
        const minWidth = 10; // Minimum 10%
        const maxWidth = 90; // Maximum 90%

        newLeftWidth = Math.max(minWidth, Math.min(maxWidth, newLeftWidth));

        setPanelState((prev) => ({
          ...prev,
          leftWidth: newLeftWidth,
          isLeftCollapsed: false,
          isRightCollapsed: false,
          lastLeftWidth: newLeftWidth,
          lastRightWidth: 100 - newLeftWidth,
        }));
      } catch (error) {
        console.error("Error during panel resize:", error);
      }
    });
  }, []);

  const handleMouseUp = useCallback(() => {
    isResizingRef.current = false;

    setPanelState((prev) => ({ ...prev, isResizing: false }));

    document.body.style.cursor = "";
    document.body.style.userSelect = "";

    document.removeEventListener("mousemove", handleMouseMove);

    // Accessibility: Announce resize end
    const announcement = document.createElement("div");
    announcement.setAttribute("aria-live", "polite");
    announcement.setAttribute("class", "sr-only");
    announcement.textContent = "Panel resize completed";
    document.body.appendChild(announcement);
    setTimeout(() => document.body.removeChild(announcement), 1000);
  }, [handleMouseMove]);

  // Touch event handlers for mobile support
  const handleTouchStart = useCallback(
    (e) => {
      const touch = e.touches[0];
      if (!touch) return;

      isResizingRef.current = true;
      startXRef.current = touch.clientX;
      startLeftWidthRef.current = panelState.leftWidth;

      setPanelState((prev) => ({ ...prev, isResizing: true }));

      document.addEventListener("touchmove", handleTouchMove, {
        passive: false,
      });
      document.addEventListener("touchend", handleTouchEnd, { once: true });
    },
    [panelState.leftWidth]
  );

  const handleTouchMove = useCallback((e) => {
    if (!isResizingRef.current || !containerRef.current) return;

    e.preventDefault();
    const touch = e.touches[0];
    if (!touch) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const deltaX = touch.clientX - startXRef.current;
    const containerWidth = containerRect.width;
    const deltaPercentage = (deltaX / containerWidth) * 100;

    let newLeftWidth = startLeftWidthRef.current + deltaPercentage;
    newLeftWidth = Math.max(10, Math.min(90, newLeftWidth));

    setPanelState((prev) => ({
      ...prev,
      leftWidth: newLeftWidth,
      isLeftCollapsed: false,
      isRightCollapsed: false,
      lastLeftWidth: newLeftWidth,
      lastRightWidth: 100 - newLeftWidth,
    }));
  }, []);

  const handleTouchEnd = useCallback(() => {
    isResizingRef.current = false;
    setPanelState((prev) => ({ ...prev, isResizing: false }));
    document.removeEventListener("touchmove", handleTouchMove);
  }, [handleTouchMove]);

  // Panel control functions
  const toggleLeftPanel = useCallback(() => {
    setPanelState((prev) => {
      const newState = {
        ...prev,
        isLeftCollapsed: !prev.isLeftCollapsed,
        isRightCollapsed: false,
      };

      if (!newState.isLeftCollapsed) {
        newState.leftWidth = prev.lastLeftWidth || 50;
      }

      return newState;
    });
  }, []);

  const toggleRightPanel = useCallback(() => {
    setPanelState((prev) => ({
      ...prev,
      isRightCollapsed: !prev.isRightCollapsed,
      isLeftCollapsed: false,
    }));
  }, []);

  // Update the showBothPanels function to resetPanels
  const resetPanels = useCallback(() => {
    setPanelState((prev) => ({
      ...prev,
      isLeftCollapsed: false,
      isRightCollapsed: false,
      leftWidth: 50, // Always reset to exactly 50:50
      lastLeftWidth: 50,
      lastRightWidth: 50,
    }));
  }, []);

  // Keyboard event handler for accessibility
  const handleKeyDown = useCallback(
    (e) => {
      if (document.activeElement?.classList.contains("resize-handle")) {
        let newLeftWidth = panelState.leftWidth;

        switch (e.key) {
          case "ArrowLeft":
            e.preventDefault();
            newLeftWidth = Math.max(10, panelState.leftWidth - 5);
            break;
          case "ArrowRight":
            e.preventDefault();
            newLeftWidth = Math.min(90, panelState.leftWidth + 5);
            break;
          case "Home":
            e.preventDefault();
            newLeftWidth = 10;
            break;
          case "End":
            e.preventDefault();
            newLeftWidth = 90;
            break;
          case "Enter":
          case " ":
            e.preventDefault();
            newLeftWidth = 50;
            break;
          default:
            return;
        }

        setPanelState((prev) => ({
          ...prev,
          leftWidth: newLeftWidth,
          lastLeftWidth: newLeftWidth,
          lastRightWidth: 100 - newLeftWidth,
          isLeftCollapsed: false,
          isRightCollapsed: false,
        }));
      }
    },
    [panelState.leftWidth]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Calculate panel styles
  const getLeftPanelStyle = () => {
    if (panelState.isLeftCollapsed) return { width: "0%", minWidth: 0 };
    if (panelState.isRightCollapsed) return { width: "100%" };
    return { width: `${panelState.leftWidth}%` };
  };

  const getRightPanelStyle = () => {
    if (panelState.isRightCollapsed) return { width: "0%", minWidth: 0 };
    if (panelState.isLeftCollapsed) return { width: "100%" };
    return { width: `${100 - panelState.leftWidth}%` };
  };

  const handleClose = useCallback(() => {
    navigate(fallbackPath, { replace: true });

    // Safety: force navigation to ensure the view disappears even if React routing misbehaves
    const targetHref = `${window.location.origin}${BASENAME}${fallbackPath.startsWith("/") ? "" : "/"}${fallbackPath}`;
    setTimeout(() => window.location.replace(targetHref), 50);
  }, [BASENAME, fallbackPath, navigate]);

  // Ensure we clean up global listeners if the component unmounts mid-drag
  useEffect(() => {
    return () => {
      isResizingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  // If the router says we are no longer on a query route but this component is still mounted,
  // force a hard refresh to the current URL to drop this view.
  useEffect(() => {
    if (!isQueryRoute && !hasForcedExitRef.current) {
      hasForcedExitRef.current = true;
      setTimeout(() => {
        window.location.replace(window.location.href);
      }, 50);
    }
    if (isQueryRoute) {
      hasForcedExitRef.current = false;
    }
  }, [isQueryRoute]);

  // Guard: if the URL is no longer a query route, render nothing (prevents stale view)
  if (!isQueryRoute) return null;

  const renderRightPanel = () => {
    switch (queryType) {
      case "Personal Data Issue":
        return (
          <PersonalDetails
            data={personalData && !error ? personalData : null}
            loading={loading}
            error={
              error ||
              (personalData && personalData.error ? personalData.error : null)
            }
          />
        );
      case "Pay Related Issue":
        return <IRLAVIEW />;
      case "Comparison Issue":
        return <Comparison />;
      case "Allowance Related Issue":
        return <GCIHistory />;
      case "POR Issue":
        return <PORDATA sno={queryValue} cat={getCategoryCode(category)} />;
      case "Profile View":
        return (
          <ProfileView servNo={queryValue} cat={getCategoryCode(category)}/>
        );
      default:
        return null;
    }
  };

  if (!row) {
    return (
      <div className="qview-container">
        <div className="qview-card">
          <h3>Query details not found</h3>
          <button className="btn" onClick={() => navigate(-1)}>
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="qview-container resizable-container" ref={containerRef}>
      {/* Close button */}
      <button
        className="close-btn"
        onClick={handleClose}
        aria-label="Close panel"
      >
        ✕
      </button>

      {/* Panel control bar */}
      <div
        className="panel-controls"
        role="toolbar"
        aria-label="Panel controls"
      >
        <button
          className={`control-btn ${
            panelState.isLeftCollapsed ? "inactive" : "active"
          }`}
          onClick={toggleLeftPanel}
          aria-label={
            panelState.isLeftCollapsed ? "Show left panel" : "Hide left panel"
          }
          title={
            panelState.isLeftCollapsed ? "Show left panel" : "Hide left panel"
          }
        >
          <span className="icon-left-panel">⟸</span>
        </button>

        <button
          className="control-btn reset-btn"
          onClick={resetPanels}
          aria-label="Reset panels to 50:50 split"
          title="Reset panels to default 50:50 split"
        >
          <span className="icon-reset">⟲</span>
        </button>

        <button
          className={`control-btn ${
            panelState.isRightCollapsed ? "inactive" : "active"
          }`}
          onClick={toggleRightPanel}
          aria-label={
            panelState.isRightCollapsed
              ? "Show right panel"
              : "Hide right panel"
          }
          title={
            panelState.isRightCollapsed
              ? "Show right panel"
              : "Hide right panel"
          }
        >
          <span className="icon-right-panel">⟹</span>
        </button>
      </div>

      {/* Left Panel */}
      <div
        className={`left-panel ${
          panelState.isLeftCollapsed ? "collapsed" : ""
        }`}
        style={getLeftPanelStyle()}
        role="region"
        aria-label="Query details panel"
        aria-hidden={panelState.isLeftCollapsed}
      >
        {!panelState.isLeftCollapsed && (
          <QueryDetails
            queryId={id}
            enableCache={enableCache}
            {...(enableCache ? { draft, setDraft } : {})}
            onBack={handleClose}
          />
        )}
      </div>

      {/* Resize Handle */}
      {!panelState.isLeftCollapsed && !panelState.isRightCollapsed && (
        <div
          className={`resize-handle ${panelState.isResizing ? "resizing" : ""}`}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize panels"
          aria-valuenow={Math.round(panelState.leftWidth)}
          aria-valuemin={10}
          aria-valuemax={90}
          tabIndex={0}
          title="Drag to resize panels, use arrow keys for fine adjustment"
        >
          <div className="resize-handle-inner">
            <div className="resize-grip"></div>
          </div>
        </div>
      )}

      {/* Right Panel */}
      <div
        className={`right-panel ${
          panelState.isRightCollapsed ? "collapsed" : ""
        }`}
        style={getRightPanelStyle()}
        role="region"
        aria-label="Query type panel"
        aria-hidden={panelState.isRightCollapsed}
      >
        {!panelState.isRightCollapsed && (
          <>
            <div className="form-group">
              <label style={{ color: "var(--text)" }}>Type of Query</label>
              <select
                value={queryType}
                onChange={(e) => setQueryType(e.target.value)}
                aria-label="Select query type"
              >
                <option value="Personal Data Issue">Personal Data Issue</option>
                <option value="Pay Related Issue">Pay Related Issue</option>
                <option value="Comparison Issue">Comparison Issue</option>
                <option value="Allowance Related Issue">
                  Allowance Related Issue
                </option>
                <option value="POR Issue">POR Issue</option>
                <option value="Profile View">Profile View</option>
              </select>
            </div>

            <div className="panel-content">{renderRightPanel()}</div>
          </>
        )}
      </div>
    </div>
  );
};

export default ResizablePanel;
