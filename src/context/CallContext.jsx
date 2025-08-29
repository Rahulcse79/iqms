// src/context/CallContext.jsx
import React, { createContext, useContext, useReducer, useMemo } from "react";

/**
 * Call states:
 *  - READY: no active or ringing call
 *  - RINGING_IN: incoming call ringing
 *  - IN_CALL: active call in progress
 *  - ON_HOLD: active call on hold
 *
 * Flags:
 *  - muted: boolean
 *  - dialString: string (for outbound; optional for agent flow)
 */

const CallContext = createContext(null);

const initialState = {
  state: "READY",
  muted: false,
  dialString: "",
  error: null,
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_ERROR":
      return { ...state, error: action.error || null };

    case "SET_DIAL_STRING":
      return { ...state, dialString: action.value.slice(0, 32), error: null };

    case "APPEND_DIGIT":
      return { ...state, dialString: (state.dialString + action.digit).slice(0, 32), error: null };

    case "BACKSPACE":
      return { ...state, dialString: state.dialString.slice(0, -1), error: null };

    case "CLEAR_DIAL":
      return { ...state, dialString: "", error: null };

    case "START_RINGING_IN":
      if (state.state !== "READY") return state;
      return { ...state, state: "RINGING_IN", error: null };

    case "ANSWER":
      if (state.state !== "RINGING_IN") return state;
      return { ...state, state: "IN_CALL", muted: false, error: null };

    case "REJECT":
      if (state.state !== "RINGING_IN") return state;
      return { ...state, state: "READY", error: null };

    case "HANGUP":
      if (state.state === "READY") return state;
      return { ...state, state: "READY", muted: false, error: null };

    case "MUTE":
      if (state.state !== "IN_CALL" && state.state !== "ON_HOLD") return state;
      return { ...state, muted: true, error: null };

    case "UNMUTE":
      if (state.state !== "IN_CALL" && state.state !== "ON_HOLD") return state;
      return { ...state, muted: false, error: null };

    case "HOLD":
      if (state.state !== "IN_CALL") return state;
      return { ...state, state: "ON_HOLD", error: null };

    case "RESUME":
      if (state.state !== "ON_HOLD") return state;
      return { ...state, state: "IN_CALL", error: null };

    default:
      return state;
  }
}

export function CallProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Simulated async helpers – wire these to your real SDK later
  const api = useMemo(() => {
    const safe = async (fn) => {
      try {
        dispatch({ type: "SET_ERROR", error: null });
        await fn();
      } catch (e) {
        dispatch({ type: "SET_ERROR", error: e?.message || "Unexpected error" });
      }
    };

    return {
      // Agent receives a call (simulate)
      simulateIncoming: () => dispatch({ type: "START_RINGING_IN" }),

      answer: () => safe(async () => dispatch({ type: "ANSWER" })),
      reject: () => safe(async () => dispatch({ type: "REJECT" })),
      hangup: () => safe(async () => dispatch({ type: "HANGUP" })),

      mute: () => safe(async () => dispatch({ type: "MUTE" })),
      unmute: () => safe(async () => dispatch({ type: "UNMUTE" })),

      hold: () => safe(async () => dispatch({ type: "HOLD" })),
      resume: () => safe(async () => dispatch({ type: "RESUME" })),

      // Transfer stubs (add your backend / SIP logic)
      blindTransfer: (target) =>
        safe(async () => {
          if (!target) throw new Error("Target required for blind transfer");
          // ...perform transfer...
        }),

      lineTransfer: (lineId) =>
        safe(async () => {
          if (!lineId) throw new Error("Line ID required for line transfer");
          // ...perform transfer...
        }),

      // Outbound dial (optional for agents)
      setDialString: (value) => dispatch({ type: "SET_DIAL_STRING", value }),
      appendDigit: (digit) => dispatch({ type: "APPEND_DIGIT", digit }),
      backspace: () => dispatch({ type: "BACKSPACE" }),
      clearDial: () => dispatch({ type: "CLEAR_DIAL" }),
    };
  }, []);

  return (
    <CallContext.Provider value={{ state, dispatch, api }}>
      {children}
    </CallContext.Provider>
  );
}

export function useCall() {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error("useCall must be used within CallProvider");
  return ctx;
}
