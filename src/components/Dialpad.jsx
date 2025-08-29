import React, { useEffect, useRef, useState } from "react";
import "./Dialpad.css";
import { FaChevronCircleUp, FaPhoneAlt, FaRegWindowMinimize } from "react-icons/fa";
import { BiTransferAlt } from "react-icons/bi";
import { MdBackspace, MdOutlineCallEnd, MdTransferWithinAStation } from "react-icons/md";
import { ImPhoneHangUp } from "react-icons/im";
import { LuMinimize2 } from "react-icons/lu";
import { IoCallSharp, IoCloseSharp } from "react-icons/io5";
import { GrClear } from "react-icons/gr";
import { FiPhoneCall } from "react-icons/fi";

const AGENT_STATUSES = {
  ONLINE: "Online",
  ON_CALL: "On Call",
  BREAK: "Break",
  PAUSE: "Pause",
  REGISTERED: "Registered",
};

export default function Dialpad() {
  // --- STATE MANAGEMENT ---
  const [mode, setMode] = useState("sidebar"); // 'sidebar', 'bottom', 'floating'
  const [isExpanded, setIsExpanded] = useState(true); // Unified expanded/collapsed state
  const [number, setNumber] = useState("");
  const [isIncoming, setIsIncoming] = useState(false);
  const [inCall, setInCall] = useState(false);

  // New state for agent status
  const [agentStatus, setAgentStatus] = useState(AGENT_STATUSES.ONLINE);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  // Floating mode state
  const [isDragging, setIsDragging] = useState(false);
  const [floatPos, setFloatPos] = useState({ x: 0, y: 0 });
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const floatRef = useRef(null);

  // Sidebar gesture state
  const [isHeaderDragging, setIsHeaderDragging] = useState(false);
  const headerStartRef = useRef({ x: 0, y: 0 });
  const headerDeltaRef = useRef({ x: 0, y: 0 });

  // Minimized floating state
  const [floatingMinimized, setFloatingMinimized] = useState(false);
  const statusDropdownRef = useRef(null);

  // --- EFFECTS ---

  // Effect to handle clicks outside the status dropdown to close it
  useEffect(() => {
    function handleClickOutside(event) {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setIsStatusDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);


  // Effect to initialize position when entering floating mode
  useEffect(() => {
    if (mode === "floating") {
      setIsExpanded(true); // Always expand when going into float mode
      const margin = 16;
      const width = 360;
      const height = 520; // Adjusted height for new status dropdown
      const x = window.innerWidth - width - margin;
      const y = window.innerHeight - height - margin;
      setFloatPos({ x: Math.max(8, x), y: Math.max(8, y) });
      setFloatingMinimized(false);
    }
  }, [mode]);

  // Global mouse/touch handlers for dragging the floating panel
  useEffect(() => {
    function onMove(e) {
      if (!isDragging) return;
      // **BUG FIX**: Correctly access clientX/Y for touch events
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      const nx = clientX - dragOffsetRef.current.x;
      const ny = clientY - dragOffsetRef.current.y;
      const width = floatRef.current ? floatRef.current.offsetWidth : 360;
      const height = floatRef.current ? floatRef.current.offsetHeight : 520;
      const maxX = window.innerWidth - width - 8;
      const maxY = window.innerHeight - height - 8;
      setFloatPos({
        x: Math.min(Math.max(8, nx), maxX),
        y: Math.min(Math.max(8, ny), maxY),
      });
    }

    function onUp() {
      setIsDragging(false);
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [isDragging]);

  // Handler for sliding down sidebar to collapse
  useEffect(() => {
    function onMove(e) {
      if (!isHeaderDragging) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      headerDeltaRef.current = {
        x: clientX - headerStartRef.current.x,
        y: clientY - headerStartRef.current.y,
      };
    }
    function onUp() {
      if (isHeaderDragging) {
        if (headerDeltaRef.current.y > 60) {
          setMode("bottom");
          setIsExpanded(false);
        }
      }
      setIsHeaderDragging(false);
      headerDeltaRef.current = { x: 0, y: 0 };
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [isHeaderDragging]);


  // --- HANDLERS ---

  const onDigit = (d) => setNumber((n) => (n + d).slice(0, 32));
  const onBackspace = () => setNumber((n) => n.slice(0, -1));
  const onClear = () => setNumber("");

  const onDial = () => {
    if (!number.trim()) return;
    setIsIncoming(false);
    setInCall(true);
    setAgentStatus(AGENT_STATUSES.ON_CALL);
  };

  const onAnswer = () => {
    setIsIncoming(false);
    setInCall(true);
    setAgentStatus(AGENT_STATUSES.ON_CALL);
  };

  const onDecline = () => {
    setIsIncoming(false);
    setInCall(false);
    setAgentStatus(AGENT_STATUSES.ONLINE);
  };

  const onEndCall = () => {
    setInCall(false);
    setAgentStatus(AGENT_STATUSES.ONLINE);
  };

  const onBlindTransfer = () => console.log("Blind Transfer triggered");
  const onConsentTransfer = () => console.log("Consent Transfer triggered");

  // Window controls
  const onClose = () => {
    setMode("bottom");
    setIsExpanded(false);
    setFloatingMinimized(false);
  };

  const onMinimize = () => {
    if (mode === "floating") {
      const margin = 16;
      const width = 320;
      const height = 84;
      const x = window.innerWidth - width - margin;
      const y = window.innerHeight - height - margin;
      setFloatPos({ x: Math.max(8, x), y: Math.max(8, y) });
      setFloatingMinimized(true);
    } else {
      setMode("bottom");
      setIsExpanded(false);
    }
  };

  const onFreeToggle = () => {
    if (mode === "floating") {
      setMode("bottom");
      setIsExpanded(false);
    } else {
      setMode("floating");
    }
  };

  // Drag handlers
  const startFloatDrag = (e) => {
    if (mode !== "floating") return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    dragOffsetRef.current = { x: clientX - floatPos.x, y: clientY - floatPos.y };
    setIsDragging(true);
    setFloatingMinimized(false);
  };

  const startHeaderDrag = (e) => {
    if (mode !== "sidebar") return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    headerStartRef.current = { x: clientX, y: clientY };
    setIsHeaderDragging(true);
  };
  
  // --- RENDER LOGIC ---

  const containerClass = [
    "dp-root",
    `dp--${mode}`,
    isExpanded ? "dp--expanded" : "dp--collapsed",
    floatingMinimized ? "dp--minimized" : "",
  ]
    .filter(Boolean)
    .join(" ");

  // The main dialpad panel UI
  const DialpadPanel = (
    <div className="dp-panel">
      <div
        className="dp-header"
        onMouseDown={mode === "floating" ? startFloatDrag : startHeaderDrag}
        onTouchStart={mode === "floating" ? startFloatDrag : startHeaderDrag}
      >
        <div className="dp-header-left">
          <div className="dp-drag-hint" />
          <div className="dp-title">Dialpad</div>
        </div>
        <div className="dp-header-actions">
          <IconButton title="Free" onClick={onFreeToggle} kind="ghost">
            <LuMinimize2 active={mode === "floating"} />
          </IconButton>
          <IconButton title="Minimize" onClick={onMinimize} kind="ghost">
            <FaRegWindowMinimize />
          </IconButton>
          <IconButton title="Close" onClick={onClose} kind="ghost">
            <IoCloseSharp />
          </IconButton>
        </div>
      </div>

      <div className="dp-content">
        {/* Agent Status Dropdown */}
        <div className="dp-status-container" ref={statusDropdownRef}>
          <button
            className="dp-status-toggle"
            onClick={() => setIsStatusDropdownOpen((v) => !v)}
          >
            <span className={`dp-status-dot dp-status--${agentStatus.toLowerCase().replace(' ', '-')}`} />
            {agentStatus}
            <FaChevronCircleUp up={isStatusDropdownOpen} />
          </button>
          {isStatusDropdownOpen && (
            <div className="dp-status-dropdown">
              {Object.values(AGENT_STATUSES).map((status) => (
                <button
                  key={status}
                  className="dp-status-option"
                  onClick={() => {
                    setAgentStatus(status);
                    setIsStatusDropdownOpen(false);
                  }}
                >
                  {status}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Number Input */}
        <div className="dp-input-row">
          <input
            className="dp-input"
            type="tel"
            placeholder="Enter number"
            value={number}
            onChange={(e) => setNumber(e.target.value.replace(/[^\d*#]/g, "").slice(0, 32))}
          />
          <IconButton onClick={onBackspace} title="Backspace" kind="secondary">
            <MdBackspace />
          </IconButton>
          <IconButton onClick={onClear} title="Clear" kind="secondary">
            <GrClear />
          </IconButton>
        </div>

        {/* Keypad */}
        <div className="dp-keypad">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"].map((d) => (
            <button key={d} className="dp-key" onClick={() => onDigit(d)}>
              <span className="dp-key-digit">{d}</span>
            </button>
          ))}
        </div>

        {/* Call Action Buttons */}
        <div className="dp-actions-container">
          {!inCall && !isIncoming && (
            <button
              className={`dp-cta dp-cta--primary ${!number && "dp-cta--disabled"}`}
              disabled={!number}
              onClick={onDial}
            >
              <FaPhoneAlt /> Dial
            </button>
          )}

          {isIncoming && !inCall && (
            <div className="dp-row">
              <button className="dp-cta dp-cta--accept" onClick={onAnswer}>
                <FiPhoneCall /> Answer
              </button>
              <button className="dp-cta dp-cta--decline" onClick={onDecline}>
                <MdOutlineCallEnd /> Decline
              </button>
            </div>
          )}

          {inCall && (
            <div className="dp-in-call-actions">
              <button className="dp-cta dp-cta--ghost" onClick={onBlindTransfer}>
                <BiTransferAlt /> Blind Transfer
              </button>
              <button className="dp-cta dp-cta--ghost" onClick={onConsentTransfer}>
                <MdTransferWithinAStation /> Consent Transfer
              </button>
              <button className="dp-cta dp-cta--decline" onClick={onEndCall}>
                <ImPhoneHangUp /> End Call
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
  
  // Collapsed view for the right-side bar
  const CollapsedTab = (
      <div className="dp-collapsed-tab">
          <button onClick={() => setIsExpanded(true)}>
              <IoCallSharp />
              <span>Show Dialpad</span>
          </button>
      </div>
  );

  return (
    <div
      className={containerClass}
      ref={mode === "floating" ? floatRef : null}
      style={mode === "floating" ? { transform: `translate(${floatPos.x}px, ${floatPos.y}px)` } : {}}
    >
      {/* Sidebar: Fully expanded on the right */}
      {mode === 'sidebar' && DialpadPanel}
      
      {/* Bottom Mode: Collapsed tab on the right, expands into full panel */}
      {mode === 'bottom' && (isExpanded ? DialpadPanel : CollapsedTab)}
      
      {/* Floating Mode: Draggable panel */}
      {mode === 'floating' && (
        floatingMinimized ? (
          <div className="dp-mini" onClick={() => setFloatingMinimized(false)} title="Restore Dialpad">
            <FaPhoneAlt />
            <span>Dialpad</span>
          </div>
        ) : (
          DialpadPanel
        )
      )}
    </div>
  );
}


// --- ATOMIC COMPONENTS & ICONS ---

function IconButton({ children, onClick, title, kind = "ghost" }) {
  // **BUG FIX**: Corrected className to use template literals
  return (
    <button className={`dp-ctrl dp-ctrl--${kind}`} onClick={onClick} title={title} aria-label={title}>
      {children}
    </button>
  );
}