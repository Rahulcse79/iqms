// src/components/Dialpad/Dialpad.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useCall } from "../../context/CallContext";
import "./Dialpad.css";

/**
 * Floating, draggable, resizable dialpad with bounds:
 *  - Cannot overlap Topbar (top bound = .topbar bottom)
 *  - Cannot leave viewport on any side
 *  - Persists {x,y,w,h,collapsed} in localStorage
 */

const STORAGE_KEY = "dialpad@v1";

const DEFAULT_W = 340;
const DEFAULT_H = 460;
const MIN_W = 280;
const MIN_H = 260;
const MAX_W = 520;
const MAX_H = 640;

function useTopbarBottom() {
  const [top, setTop] = useState(0);

  const compute = useCallback(() => {
    const el = document.querySelector(".topbar");
    if (!el) return setTop(0);
    const rect = el.getBoundingClientRect();
    // Because .topbar is sticky at top: 0, its bottom is our forbidden zone
    setTop(Math.max(0, rect.bottom));
  }, []);

  useEffect(() => {
    compute();
    const ro = new ResizeObserver(compute);
    const el = document.querySelector(".topbar");
    if (el) ro.observe(el);
    window.addEventListener("scroll", compute, { passive: true });
    window.addEventListener("resize", compute);
    return () => {
      if (el) ro.unobserve(el);
      ro.disconnect();
      window.removeEventListener("scroll", compute);
      window.removeEventListener("resize", compute);
    };
  }, [compute]);

  return top;
}

function clamp(v, min, max) {
  return Math.min(Math.max(v, min), max);
}

function usePersistentState() {
  const load = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      return data;
    } catch {
      return null;
    }
  };
  const save = (data) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {}
  };
  return { load, save };
}

export default function Dialpad() {
  const { state, api } = useCall();
  const call = state; // alias
  const topbarBottom = useTopbarBottom();
  const { load, save } = usePersistentState();

  const init = useMemo(() => {
    const saved = load();
    const w = clamp(saved?.w ?? DEFAULT_W, MIN_W, MAX_W);
    const h = clamp(saved?.h ?? DEFAULT_H, MIN_H, MAX_H);
    const padding = 16;
    return {
      w,
      h,
      x: clamp(saved?.x ?? window.innerWidth - w - padding, 0, Math.max(0, window.innerWidth - w)),
      y: clamp(
        saved?.y ?? window.innerHeight - h - padding,
        topbarBottom,
        Math.max(topbarBottom, window.innerHeight - h)
      ),
      collapsed: !!saved?.collapsed,
    };
    // eslint-disable-next-line
  }, []);

  const [pos, setPos] = useState({ x: init.x, y: init.y });
  const [size, setSize] = useState({ w: init.w, h: init.h });
  const [collapsed, setCollapsed] = useState(init.collapsed);
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);

  const rootRef = useRef(null);
  const dragRef = useRef({ sx: 0, sy: 0, ox: 0, oy: 0 });
  const resizeRef = useRef({ sw: 0, sh: 0, sx: 0, sy: 0 });

  // Clamp within viewport & below topbar
  const clampAndSetPos = useCallback(
    (nx, ny, w = size.w, h = size.h) => {
      const maxX = Math.max(0, window.innerWidth - w);
      const maxY = Math.max(topbarBottom, window.innerHeight - h);
      setPos({
        x: clamp(nx, 0, maxX),
        y: clamp(ny, topbarBottom, maxY),
      });
    },
    [size.w, size.h, topbarBottom]
  );

  const clampAndSetSize = useCallback(
    (nw, nh, x = pos.x, y = pos.y) => {
      const w = clamp(nw, MIN_W, Math.min(MAX_W, window.innerWidth));
      const h = clamp(nh, MIN_H, Math.min(MAX_H, window.innerHeight - topbarBottom));
      setSize({ w, h });
      // if size grows past bounds, nudge position back into view
      const maxX = Math.max(0, window.innerWidth - w);
      const maxY = Math.max(topbarBottom, window.innerHeight - h);
      setPos({
        x: clamp(x, 0, maxX),
        y: clamp(y, topbarBottom, maxY),
      });
    },
    [pos.x, pos.y, topbarBottom]
  );

  // Persist
  useEffect(() => {
    save({ x: pos.x, y: pos.y, w: size.w, h: size.h, collapsed });
  }, [pos, size, collapsed, save]);

  // Re-clamp on window resize or topbar change
  useEffect(() => {
    const onResize = () => {
      clampAndSetSize(size.w, size.h, pos.x, pos.y);
      clampAndSetPos(pos.x, pos.y, size.w, size.h);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [clampAndSetPos, clampAndSetSize, pos.x, pos.y, size.w, size.h]);

  // Dragging
  const onHeaderPointerDown = (e) => {
    if (e.button !== 0) return;
    setDragging(true);
    dragRef.current = { sx: e.clientX, sy: e.clientY, ox: pos.x, oy: pos.y };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };
const onPointerMove = useCallback((e) => {
  if (!dragging) return;
  const dx = e.clientX - dragRef.current.sx;
  const dy = e.clientY - dragRef.current.sy;
  clampAndSetPos(dragRef.current.ox + dx, dragRef.current.oy + dy);
}, [dragging, clampAndSetPos]);

  const onPointerUp = () => {
    setDragging(false);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
  };

  // Resizing (bottom-right handle)
  const onResizePointerDown = (e) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    setResizing(true);
    resizeRef.current = { sw: size.w, sh: size.h, sx: e.clientX, sy: e.clientY };
    window.addEventListener("pointermove", onResizeMove);
    window.addEventListener("pointerup", onResizeUp);
  };
  const onResizeMove = (e) => {
    if (!resizing) return;
    const dw = e.clientX - resizeRef.current.sx;
    const dh = e.clientY - resizeRef.current.sy;
    clampAndSetSize(resizeRef.current.sw + dw, resizeRef.current.sh + dh);
  };
  const onResizeUp = () => {
    setResizing(false);
    window.removeEventListener("pointermove", onResizeMove);
    window.removeEventListener("pointerup", onResizeUp);
  };

  // Collapse / Expand / Maximize
  const toggleCollapse = () => setCollapsed((c) => !c);
  const maximize = () => {
    const padding = 16;
    clampAndSetSize(DEFAULT_W, DEFAULT_H, window.innerWidth - DEFAULT_W - padding, window.innerHeight - DEFAULT_H - padding);
    setCollapsed(false);
  };

  // Keyboard input when focused
  const onKeyDown = (e) => {
    const k = e.key;
    if ("0123456789*#".includes(k)) {
      api.appendDigit(k);
      e.stopPropagation();
      e.preventDefault();
    } else if (k === "Backspace") {
      api.backspace();
      e.preventDefault();
    }
  };

  // Call control helpers with guards
  const can = {
    answer: call.state === "RINGING_IN",
    reject: call.state === "RINGING_IN",
    hangup: call.state !== "READY",
    mute: (call.state === "IN_CALL" || call.state === "ON_HOLD") && !state.muted,
    unmute: (call.state === "IN_CALL" || call.state === "ON_HOLD") && state.muted,
    hold: call.state === "IN_CALL",
    resume: call.state === "ON_HOLD",
    blindTransfer: call.state === "IN_CALL" || call.state === "ON_HOLD",
    lineTransfer: call.state === "IN_CALL" || call.state === "ON_HOLD",
  };

  const statusText = (() => {
    switch (call.state) {
      case "READY": return "Ready";
      case "RINGING_IN": return "Incoming call…";
      case "IN_CALL": return state.muted ? "In call (Muted)" : "In call";
      case "ON_HOLD": return "On hold";
      default: return call.state;
    }
  })();

  return (
    <div
      ref={rootRef}
      className={`dialpad ${dragging ? "is-dragging" : ""} ${collapsed ? "is-collapsed" : ""}`}
      style={{ width: size.w, height: collapsed ? 56 : size.h, transform: `translate(${pos.x}px, ${pos.y}px)` }}
      role="dialog"
      aria-label="Dialpad"
      tabIndex={0}
      onKeyDown={onKeyDown}
    >
      <div className="dialpad__header" onPointerDown={onHeaderPointerDown} aria-grabbed={dragging} aria-label="Dialpad header (drag to move)">
        <div className="dialpad__title">Agent Dialpad</div>
        <div className="dialpad__header-actions">
          <button className="dp-btn dp-btn-ghost" onClick={toggleCollapse} aria-label={collapsed ? "Expand dialpad" : "Collapse dialpad"}>
            {collapsed ? "▣" : "▭"}
          </button>
          <button className="dp-btn dp-btn-ghost" onClick={maximize} aria-label="Reset size & position">⤢</button>
        </div>
      </div>

      {/* Status bar */}
      {!collapsed && (
        <div className={`dialpad__status dialpad__status--${call.state.toLowerCase()}`} title={call.error || ""}>
          <span>{statusText}</span>
          {state.error && <span className="dialpad__error"> • {state.error}</span>}
        </div>
      )}

      {/* Body */}
      {!collapsed && (
        <div className="dialpad__body">
          {call.state === "READY" && (
            <>
              <Display />
              <Keypad />
              <div className="dialpad__actions">
                <CallButton />
              </div>
            </>
          )}

          {call.state === "RINGING_IN" && (
            <div className="dialpad__ringing">
              <button className="dp-btn dp-btn-success" onClick={api.answer} disabled={!can.answer} aria-label="Answer incoming call">Answer</button>
              <button className="dp-btn dp-btn-danger" onClick={api.reject} disabled={!can.reject} aria-label="Reject incoming call">Reject</button>
            </div>
          )}

          {(call.state === "IN_CALL" || call.state === "ON_HOLD") && (
            <>
              <InCallPanel
                muted={state.muted}
                can={can}
                onMute={api.mute}
                onUnmute={api.unmute}
                onHold={api.hold}
                onResume={api.resume}
                onHangup={api.hangup}
                onBlindTransfer={api.blindTransfer}
                onLineTransfer={api.lineTransfer}
              />
            </>
          )}
        </div>
      )}

      {/* Resize handle */}
      {!collapsed && <div className="dialpad__resize" onPointerDown={onResizePointerDown} aria-label="Resize dialpad" />}
    </div>
  );
}

/** Subcomponents */
function Display() {
  const { state, api } = useCall();
  return (
    <div className="dialpad__display" aria-live="polite">
      <input
        value={state.dialString}
        onChange={(e) => api.setDialString(e.target.value.replace(/[^\d*#]/g, ""))}
        placeholder="Enter number"
        inputMode="tel"
        aria-label="Dialed number"
      />
      <div className="dialpad__display-actions">
        <button className="dp-btn dp-btn-ghost" onClick={api.backspace} aria-label="Backspace">⌫</button>
        <button className="dp-btn dp-btn-ghost" onClick={api.clearDial} aria-label="Clear">✕</button>
      </div>
    </div>
  );
}

function Keypad() {
  const { api } = useCall();
  const keys = ["1","2","3","4","5","6","7","8","9","*","0","#"];
  return (
    <div className="dialpad__keygrid" role="group" aria-label="Dialpad keys">
      {keys.map((k) => (
        <button
          key={k}
          className="dp-key"
          onClick={() => api.appendDigit(k)}
          aria-label={`Digit ${k}`}
        >
          {k}
        </button>
      ))}
    </div>
  );
}

function CallButton() {
  const { state } = useCall();
  const canCall = state.dialString.length > 0;
  // Wire up outbound when needed; for agent-only inbound you can hide this.
  const fakeOutbound = () => alert(`(demo) Outbound call to ${state.dialString} — integrate SDK here`);
  return (
    <button className="dp-btn dp-btn-primary" onClick={fakeOutbound} disabled={!canCall} aria-label="Call">
      Call
    </button>
  );
}

function InCallPanel({ muted, can, onMute, onUnmute, onHold, onResume, onHangup, onBlindTransfer, onLineTransfer }) {
  const handleBlind = async () => {
    const target = prompt("Blind transfer to number:");
    if (target) await onBlindTransfer(target);
  };
  const handleLine = async () => {
    const lineId = prompt("Line transfer (line ID or extension):");
    if (lineId) await onLineTransfer(lineId);
  };
  return (
    <div className="dialpad__incall">
      <div className="dialpad__incall-row">
        <button className="dp-btn dp-btn-secondary" onClick={muted ? onUnmute : onMute} disabled={muted ? !can.unmute : !can.mute} aria-label={muted ? "Unmute" : "Mute"}>
          {muted ? "Unmute" : "Mute"}
        </button>
        <button className="dp-btn dp-btn-secondary" onClick={can.hold ? onHold : onResume} disabled={!(can.hold || can.resume)} aria-label={can.hold ? "Hold" : "Resume"}>
          {can.hold ? "Hold" : "Resume"}
        </button>
        <button className="dp-btn dp-btn-warning" onClick={handleBlind} disabled={!can.blindTransfer} aria-label="Blind transfer">
          Blind Transfer
        </button>
      </div>
      <div className="dialpad__incall-row">
        <button className="dp-btn dp-btn-warning" onClick={handleLine} disabled={!can.lineTransfer} aria-label="Line transfer">
          Line Transfer
        </button>
        <button className="dp-btn dp-btn-danger" onClick={onHangup} disabled={!can.hangup} aria-label="Disconnect">
          Disconnect
        </button>
      </div>
    </div>
  );
}
