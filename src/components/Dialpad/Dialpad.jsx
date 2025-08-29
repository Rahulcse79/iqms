// src/components/Dialpad/Dialpad.jsx
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { useCall } from "../../context/CallContext";
import "./Dialpad.css";

const STORAGE_KEY = "dialpad@v1";

const DEFAULT_W = 340;
const DEFAULT_H = 460;
const MIN_W = 280;
const MIN_H = 260;
const MAX_W = 520;
const MAX_H = 640;
const PADDING = 16;

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function useTopbarBottom() {
  const [top, setTop] = useState(0);
  const compute = useCallback(() => {
    const el = document.querySelector(".topbar");
    if (!el) return setTop(0);
    const rect = el.getBoundingClientRect();
    setTop(Math.max(0, rect.bottom));
  }, []);
  useEffect(() => {
    compute();
    let ro;
    const el = document.querySelector(".topbar");
    if (el && typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(compute);
      ro.observe(el);
    }
    window.addEventListener("scroll", compute, { passive: true });
    window.addEventListener("resize", compute);
    return () => {
      if (ro && el) ro.unobserve(el);
      if (ro) ro.disconnect();
      window.removeEventListener("scroll", compute);
      window.removeEventListener("resize", compute);
    };
  }, [compute]);
  return top;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
function saveState(s) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {}
}

export default function Dialpad() {
  const { state, api } = useCall();
  const call = state;
  const topbarBottom = useTopbarBottom();

  // init using topbarBottom (so it respects sticky topbar)
  const init = useMemo(() => {
    const saved = loadState();
    const w = clamp(
      saved?.w ?? DEFAULT_W,
      MIN_W,
      Math.min(MAX_W, window.innerWidth)
    );
    const h = clamp(
      saved?.h ?? DEFAULT_H,
      MIN_H,
      Math.min(
        MAX_H,
        Math.max(MIN_H, window.innerHeight - topbarBottom - PADDING)
      )
    );
    const xDefault = Math.max(0, window.innerWidth - w - PADDING);
    const yDefault = Math.max(topbarBottom, window.innerHeight - h - PADDING);
    const x = clamp(
      saved?.x ?? xDefault,
      0,
      Math.max(0, window.innerWidth - w)
    );
    const y = clamp(
      saved?.y ?? yDefault,
      topbarBottom,
      Math.max(topbarBottom, window.innerHeight - h)
    );
    return { w, h, x, y, collapsed: !!saved?.collapsed };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topbarBottom]);

  const [pos, setPos] = useState({ x: init.x, y: init.y });
  const [size, setSize] = useState({ w: init.w, h: init.h });
  const [collapsed, setCollapsed] = useState(init.collapsed);
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);

  // refs used by pointer handlers to avoid stale closures
  const rootRef = useRef(null);
  const headerRef = useRef(null);
  const resizeRefElm = useRef(null);

  const dragRef = useRef({ sx: 0, sy: 0, ox: 0, oy: 0, pointerId: null });
  const resizingRef = useRef({ sw: 0, sh: 0, sx: 0, sy: 0, pointerId: null });
  const draggingRef = useRef(false);
  const resizingActiveRef = useRef(false);

  // clamp helpers (use current size)
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
      const h = clamp(
        nh,
        MIN_H,
        Math.min(
          MAX_H,
          Math.max(MIN_H, window.innerHeight - topbarBottom - PADDING)
        )
      );
      setSize({ w, h });
      // nudge position into view if needed
      const maxX = Math.max(0, window.innerWidth - w);
      const maxY = Math.max(topbarBottom, window.innerHeight - h);
      setPos({
        x: clamp(x, 0, maxX),
        y: clamp(y, topbarBottom, maxY),
      });
    },
    [pos.x, pos.y, topbarBottom]
  );

  // persist
  useEffect(() => {
    saveState({ x: pos.x, y: pos.y, w: size.w, h: size.h, collapsed });
  }, [pos, size, collapsed]);

  // Auto-expand dialpad on incoming/ongoing call
  useEffect(() => {
    if (["RINGING_IN", "IN_CALL", "ON_HOLD"].includes(call.state)) {
      resetPosition(); // pop it to bottom-right in default size
      setCollapsed(false);
    }
  }, [call.state]);

  // --- Dragging with pointer capture ---
  const pointerMoveDrag = useCallback(
    (ev) => {
      if (!draggingRef.current) return;
      const dx = ev.clientX - dragRef.current.sx;
      const dy = ev.clientY - dragRef.current.sy;
      clampAndSetPos(dragRef.current.ox + dx, dragRef.current.oy + dy);
    },
    [clampAndSetPos]
  );

  const pointerUpDrag = useCallback(
    (ev) => {
      draggingRef.current = false;
      setDragging(false);
      document.body.style.userSelect = "";
      try {
        // release pointer capture (safe if headerRef exists)
        if (
          headerRef.current &&
          ev &&
          ev.pointerId != null &&
          headerRef.current.releasePointerCapture
        ) {
          headerRef.current.releasePointerCapture(ev.pointerId);
        } else if (
          headerRef.current &&
          dragRef.current.pointerId != null &&
          headerRef.current.releasePointerCapture
        ) {
          headerRef.current.releasePointerCapture(dragRef.current.pointerId);
        }
      } catch {}
      window.removeEventListener("pointermove", pointerMoveDrag);
      window.removeEventListener("pointerup", pointerUpDrag);
    },
    [pointerMoveDrag]
  );

  const onHeaderPointerDown = useCallback(
    (e) => {
      // ignore right/middle button & ignore when clicking interactive controls inside header
      if (e.button !== 0) return;
      // do not start drag when target is a button or input (so header action clicks still work)
      const target = e.target;
      if (
        target &&
        (target.closest("button") ||
          target.closest("input") ||
          target.closest("a"))
      ) {
        return;
      }
      e.preventDefault();
      draggingRef.current = true;
      setDragging(true);
      dragRef.current = {
        sx: e.clientX,
        sy: e.clientY,
        ox: pos.x,
        oy: pos.y,
        pointerId: e.pointerId,
      };
      document.body.style.userSelect = "none";
      // pointer capture so move events stay with this element
      try {
        headerRef.current?.setPointerCapture?.(e.pointerId);
      } catch {}
      window.addEventListener("pointermove", pointerMoveDrag);
      window.addEventListener("pointerup", pointerUpDrag);
    },
    [pos.x, pos.y, pointerMoveDrag, pointerUpDrag]
  );

  // --- Resizing with pointer capture ---
  const pointerMoveResize = useCallback(
    (ev) => {
      if (!resizingActiveRef.current) return;
      const dw = ev.clientX - resizingRef.current.sx;
      const dh = ev.clientY - resizingRef.current.sy;
      clampAndSetSize(
        resizingRef.current.sw + dw,
        resizingRef.current.sh + dh,
        pos.x,
        pos.y
      );
    },
    [clampAndSetSize, pos.x, pos.y]
  );

  const pointerUpResize = useCallback(
    (ev) => {
      resizingActiveRef.current = false;
      setResizing(false);
      document.body.style.userSelect = "";
      try {
        if (
          resizeRefElm.current &&
          ev &&
          ev.pointerId != null &&
          resizeRefElm.current.releasePointerCapture
        ) {
          resizeRefElm.current.releasePointerCapture(ev.pointerId);
        } else if (
          resizeRefElm.current &&
          resizingRef.current.pointerId != null &&
          resizeRefElm.current.releasePointerCapture
        ) {
          resizeRefElm.current.releasePointerCapture(
            resizingRef.current.pointerId
          );
        }
      } catch {}
      window.removeEventListener("pointermove", pointerMoveResize);
      window.removeEventListener("pointerup", pointerUpResize);
    },
    [pointerMoveResize]
  );

  const onResizePointerDown = useCallback(
    (e) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      resizingActiveRef.current = true;
      setResizing(true);
      resizingRef.current = {
        sw: size.w,
        sh: size.h,
        sx: e.clientX,
        sy: e.clientY,
        pointerId: e.pointerId,
      };
      document.body.style.userSelect = "none";
      try {
        resizeRefElm.current?.setPointerCapture?.(e.pointerId);
      } catch {}
      window.addEventListener("pointermove", pointerMoveResize);
      window.addEventListener("pointerup", pointerUpResize);
    },
    [size.w, size.h, pointerMoveResize, pointerUpResize]
  );

  // window resize: re-clamp
  useEffect(() => {
    const onWinResize = () => {
      clampAndSetSize(size.w, size.h, pos.x, pos.y);
      clampAndSetPos(pos.x, pos.y, size.w, size.h);
    };
    window.addEventListener("resize", onWinResize);
    return () => window.removeEventListener("resize", onWinResize);
  }, [clampAndSetPos, clampAndSetSize, pos.x, pos.y, size.w, size.h]);

  // keyboard: simple numeric input support + Escape to collapse
  const onKeyDown = (e) => {
    if (e.key === "Escape") {
      setCollapsed(true);
    } else if ("0123456789*#".includes(e.key)) {
      api.appendDigit(e.key);
      e.preventDefault();
    } else if (e.key === "Backspace") {
      api.backspace();
      e.preventDefault();
    }
  };

  // small helpers
  const toggleCollapse = () => setCollapsed((c) => !c);
  const maximize = () => {
    const w = DEFAULT_W;
    const h = DEFAULT_H;
    const x = Math.max(0, window.innerWidth - w - PADDING);
    const y = Math.max(topbarBottom, window.innerHeight - h - PADDING);
    setSize({ w, h });
    setPos({ x, y });
    setCollapsed(false);
  };

  const resetPosition = () => {
    const w = clamp(DEFAULT_W, MIN_W, window.innerWidth);
    const h = clamp(
      DEFAULT_H,
      MIN_H,
      Math.min(MAX_H, window.innerHeight - topbarBottom - PADDING)
    );
    const x = Math.max(0, window.innerWidth - w - PADDING);
    const y = Math.max(topbarBottom, window.innerHeight - h - PADDING);
    setSize({ w, h });
    setPos({ x, y });
    setCollapsed(false);
  };

  // compute frame style - when collapsed we dock bottom-right explicitly
  const frameStyle = collapsed
    ? {
        width: 280,
        height: 56,
        left: "auto",
        top: "auto",
        right: PADDING,
        bottom: PADDING,
        transform: "none",
      }
    : {
        width: size.w,
        height: size.h,
        left: 0,
        top: 0,
        right: "auto",
        bottom: "auto",
        transform: `translate(${pos.x}px, ${pos.y}px)`,
      };

  // small "can" guards for UI buttons
  const can = {
    answer: call.state === "RINGING_IN",
    reject: call.state === "RINGING_IN",
    hangup: call.state !== "READY",
    mute:
      (call.state === "IN_CALL" || call.state === "ON_HOLD") && !state.muted,
    unmute:
      (call.state === "IN_CALL" || call.state === "ON_HOLD") && state.muted,
    hold: call.state === "IN_CALL",
    resume: call.state === "ON_HOLD",
    blindTransfer: call.state === "IN_CALL" || call.state === "ON_HOLD",
    lineTransfer: call.state === "IN_CALL" || call.state === "ON_HOLD",
  };

  const statusText = (() => {
    switch (call.state) {
      case "READY":
        return "Ready";
      case "RINGING_IN":
        return "Incoming call…";
      case "IN_CALL":
        return state.muted ? "In call (Muted)" : "In call";
      case "ON_HOLD":
        return "On hold";
      default:
        return call.state;
    }
  })();

  return (
    <div
      ref={rootRef}
      className={`dialpad ${dragging ? "is-dragging" : ""} ${
        collapsed ? "is-collapsed" : ""
      }`}
      role="dialog"
      aria-label="Dialpad"
      tabIndex={0}
      onKeyDown={onKeyDown}
      style={{
        position: "fixed",
        zIndex: 999,
        ...frameStyle,
      }}
    >
      <div
        className="dialpad__header"
        ref={headerRef}
        onPointerDown={onHeaderPointerDown}
        aria-grabbed={dragging}
        aria-label="Dialpad header (drag to move)"
      >
        <div className="dialpad__title">Agent Dialpad</div>
        <div className="dialpad__header-actions">
          <button
            className="dp-btn dp-btn-ghost"
            onClick={toggleCollapse}
            aria-label={collapsed ? "Expand dialpad" : "Collapse dialpad"}
            title={collapsed ? "Expand" : "Minimize"}
            disabled={["RINGING_IN", "IN_CALL", "ON_HOLD"].includes(call.state)} // 🚫 disable collapse
          >
            {collapsed ? "▣" : "▭"}
          </button>

          <button
            className="dp-btn dp-btn-ghost"
            onClick={maximize}
            aria-label="Reset size & position"
            title="Reset"
          >
            ⤢
          </button>
        </div>
      </div>

      {/* Status bar */}
      {!collapsed && (
        <div
          className={`dialpad__status dialpad__status--${call.state.toLowerCase()}`}
          title={call.error || ""}
        >
          <span>{statusText}</span>
          {state.error && (
            <span className="dialpad__error"> • {state.error}</span>
          )}
        </div>
      )}

      {/* Body */}
      {!collapsed && (
        <div className="dialpad__body" style={{ overflow: "auto" }}>
          {call.state === "READY" && (
            <>
              <Display api={api} state={state} />
              <Keypad api={api} />
              <div className="dialpad__actions">
                <CallButton state={state} />
              </div>
            </>
          )}

          {call.state === "RINGING_IN" && (
            <div className="dialpad__ringing">
              <button
                className="dp-btn dp-btn-success"
                onClick={api.answer}
                disabled={!can.answer}
                aria-label="Answer incoming call"
              >
                Answer
              </button>
              <button
                className="dp-btn dp-btn-danger"
                onClick={api.reject}
                disabled={!can.reject}
                aria-label="Reject incoming call"
              >
                Reject
              </button>
            </div>
          )}

          {(call.state === "IN_CALL" || call.state === "ON_HOLD") && (
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
          )}
        </div>
      )}

      {/* Resize handle (always present when expanded) */}
      {!collapsed && (
        <div
          ref={resizeRefElm}
          className="dialpad__resize"
          onPointerDown={onResizePointerDown}
          aria-label="Resize dialpad"
          title="Drag to resize"
        />
      )}
    </div>
  );
}

/** Subcomponents (kept local & simple) */

function Display({ api, state }) {
  return (
    <div className="dialpad__display" aria-live="polite">
      <input
        value={state.dialString}
        onChange={(e) =>
          api.setDialString(e.target.value.replace(/[^\d*#]/g, ""))
        }
        placeholder="Enter number"
        inputMode="tel"
        aria-label="Dialed number"
      />
      <div className="dialpad__display-actions">
        <button
          className="dp-btn dp-btn-ghost"
          onClick={api.backspace}
          aria-label="Backspace"
        >
          ⌫
        </button>
        <button
          className="dp-btn dp-btn-ghost"
          onClick={api.clearDial}
          aria-label="Clear"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

function Keypad({ api }) {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"];
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

function CallButton({ state }) {
  const canCall = state.dialString.length > 0;
  const fakeOutbound = () =>
    alert(`(demo) Outbound call to ${state.dialString} — integrate SDK here`);
  return (
    <button
      className="dp-btn dp-btn-primary"
      onClick={fakeOutbound}
      disabled={!canCall}
      aria-label="Call"
    >
      Call
    </button>
  );
}

function InCallPanel({
  muted,
  can,
  onMute,
  onUnmute,
  onHold,
  onResume,
  onHangup,
  onBlindTransfer,
  onLineTransfer,
}) {
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
        <button
          className="dp-btn dp-btn-secondary"
          onClick={muted ? onUnmute : onMute}
          disabled={muted ? !can.unmute : !can.mute}
        >
          {muted ? "Unmute" : "Mute"}
        </button>
        <button
          className="dp-btn dp-btn-secondary"
          onClick={can.hold ? onHold : onResume}
          disabled={!(can.hold || can.resume)}
        >
          {can.hold ? "Hold" : "Resume"}
        </button>
        <button
          className="dp-btn dp-btn-warning"
          onClick={handleBlind}
          disabled={!can.blindTransfer}
        >
          Blind Transfer
        </button>
      </div>
      <div className="dialpad__incall-row">
        <button
          className="dp-btn dp-btn-warning"
          onClick={handleLine}
          disabled={!can.lineTransfer}
        >
          Line Transfer
        </button>
        <button
          className="dp-btn dp-btn-danger"
          onClick={onHangup}
          disabled={!can.hangup}
        >
          Disconnect
        </button>
      </div>
    </div>
  );
}
