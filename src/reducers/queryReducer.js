// queryReducers.js
// Corrected reducers file for query, faq and frqQry reducers + selectors

import {
  SEARCH_QUERY_REQUEST,
  SEARCH_QUERY_SUCCESS,
  SEARCH_QUERY_FAIL,
  CLEAR_QUERY_RESULTS,
  FAQ_REQUEST,
  FAQ_SUCCESS,
  FAQ_FAIL,
  CLEAR_FAQ_RESULTS,
  FRQ_QRY_REQUEST,
  FRQ_QRY_SUCCESS,
  FRQ_QRY_FAIL,
  CLEAR_FRQ_QRY_RESULTS,
} from "../constants/queryConstants";

/* -----------------------------
   Initial states
   ----------------------------- */

const initialSlotState = { loading: false, items: [], error: null };

const initialState = {
  slot1: { ...initialSlotState },
  slot2: { ...initialSlotState },
  slot3: { ...initialSlotState },
};

const initialFrqState = {
  byKey: {},
  lastUpdated: null,
};

const initialFaqState = {
  byKey: {},
  lastUpdated: null,
};

/* -----------------------------
   Helpers
   ----------------------------- */

/**
 * Unified makeKey used by multiple reducers.
 * Priority: meta.slot -> `slot${n}`, meta.topic -> `topic${topic}`, meta.key -> key, fallback 'default'
 */
function makeKey(meta) {
  if (!meta) return "default";
  if (meta.slot !== undefined && meta.slot !== null) return `slot${meta.slot}`;
  if (meta.topic !== undefined && meta.topic !== null) return `topic${meta.topic}`;
  if (meta.key) return String(meta.key);
  return "default";
}

/**
 * Normalize success payload (most APIs return { items: [...] } but sometimes payload
 * may be the array itself). Returns { items: Array, total: number }.
 */
function normalizeSuccessPayload(payload) {
  if (!payload) return { items: [], total: 0 };
  if (Array.isArray(payload)) return { items: payload, total: payload.length };
  if (Array.isArray(payload.items)) return { items: payload.items, total: payload.count ?? payload.items.length };
  return { items: [payload], total: 1 };
}

/**
 * Normalize error payload into simple { message, status, raw }
 */
function normalizeError(payload) {
  if (!payload) return { message: "Unknown error", status: null, raw: payload };
  if (typeof payload === "string") return { message: payload, status: null, raw: payload };
  const message = payload.message || payload.error || payload.msg || "Something went wrong";
  const status = payload.status ?? payload.code ?? null;
  return { message, status, raw: payload };
}

/* -----------------------------
   queryReducer (slot-based)
   ----------------------------- */

export const queryReducer = (state = initialState, action = {}) => {
  const { type, payload, meta } = action;

  // defensive slot key derivation (default to slot1 for safety)
  const slotKey = meta && meta.slot !== undefined && meta.slot !== null ? `slot${meta.slot}` : "slot1";

  switch (type) {
    case SEARCH_QUERY_REQUEST:
      return {
        ...state,
        [slotKey]: { ...state[slotKey], loading: true, error: null, items: [] },
      };

    case SEARCH_QUERY_SUCCESS:
      return {
        ...state,
        [slotKey]: { loading: false, items: payload || [], error: null },
      };

    case SEARCH_QUERY_FAIL:
      return {
        ...state,
        [slotKey]: { loading: false, items: [], error: payload },
      };

    case CLEAR_QUERY_RESULTS:
      return initialState;

    default:
      return state;
  }
};

/* -----------------------------
   faqReducer (bucketed by key/topic/slot)
   ----------------------------- */

export const faqReducer = (state = initialFaqState, action = {}) => {
  const { type, payload, meta } = action;
  const key = makeKey(meta);

  switch (type) {
    case FAQ_REQUEST: {
      const prevBucket = state.byKey[key] || {};

      return {
        ...state,
        byKey: {
          ...state.byKey,
          [key]: {
            // keep previous items until new data arrives to avoid flicker
            ...prevBucket,
            loading: true,
            error: null,
            items: prevBucket.items || [],
            requestId: meta?.requestId || null,
            requestedAt: new Date().toISOString(),
          },
        },
      };
    }

    case FAQ_SUCCESS: {
      const items = Array.isArray(payload) ? payload : payload ? [payload] : [];

      return {
        ...state,
        byKey: {
          ...state.byKey,
          [key]: {
            loading: false,
            items,
            error: null,
            lastFetched: new Date().toISOString(),
            requestId: meta?.requestId || null,
            total: items.length,
          },
        },
        lastUpdated: new Date().toISOString(),
      };
    }

    case FAQ_FAIL: {
      const prevBucket = state.byKey[key] || {};

      return {
        ...state,
        byKey: {
          ...state.byKey,
          [key]: {
            ...prevBucket,
            loading: false,
            items: prevBucket.items || [],
            error: payload || { message: "Unknown error" },
            failedAt: new Date().toISOString(),
            requestId: meta?.requestId || null,
          },
        },
      };
    }

    case CLEAR_FAQ_RESULTS:
      return initialFaqState;

    default:
      return state;
  }
};

/* -----------------------------
   frqQryReducer (industrial-grade)
   ----------------------------- */

export const frqQryReducer = (state = initialFrqState, action = {}) => {
  const { type, payload, meta } = action;

  switch (type) {
    case FRQ_QRY_REQUEST: {
      const key = makeKey(meta);
      const prevBucket = state.byKey[key] || {};

      return {
        ...state,
        byKey: {
          ...state.byKey,
          [key]: {
            // keep previous items until new data arrives to prevent flicker
            items: prevBucket.items || [],
            loading: true,
            error: null,
            requestId: meta?.requestId || null,
            requestedAt: new Date().toISOString(),
            // preserve any other metadata already present
            ...prevBucket,
          },
        },
      };
    }

    case FRQ_QRY_SUCCESS: {
      const key = makeKey(meta);
      const { items, total } = normalizeSuccessPayload(payload);
      return {
        ...state,
        byKey: {
          ...state.byKey,
          [key]: {
            loading: false,
            items,
            error: null,
            requestId: meta?.requestId || null,
            lastFetched: new Date().toISOString(),
            total: typeof total === "number" ? total : items.length,
          },
        },
        lastUpdated: new Date().toISOString(),
      };
    }

    case FRQ_QRY_FAIL: {
      const key = makeKey(meta);
      const prevBucket = state.byKey[key] || {};
      const err = normalizeError(payload);
      return {
        ...state,
        byKey: {
          ...state.byKey,
          [key]: {
            ...prevBucket,
            loading: false,
            items: prevBucket.items || [],
            error: err,
            failedAt: new Date().toISOString(),
            requestId: meta?.requestId || null,
          },
        },
      };
    }

    case CLEAR_FRQ_QRY_RESULTS:
      return initialFrqState;

    default:
      return state;
  }
};

export default frqQryReducer;

/* -----------------------------
   Selectors
   ----------------------------- */

/**
 * Get bucket state by meta-like object (slot/key)
 * rootState should be the redux root; these selectors attempt common mount paths:
 * - rootState.frqQry
 * - rootState.frqQryReducer
 * - rootState.frqQryState
 * - rootState (fallback)
 */
export function selectBucket(rootState, meta) {
  const roots = rootState?.frqQry ?? rootState?.frqQryReducer ?? rootState?.frqQryState ?? rootState;
  const key = makeKey(meta);
  return roots?.byKey?.[key] ?? null;
}

export function selectItems(rootState, meta) {
  const b = selectBucket(rootState, meta);
  return b?.items ?? [];
}

export function selectLoading(rootState, meta) {
  const b = selectBucket(rootState, meta);
  return !!b?.loading;
}

export function selectError(rootState, meta) {
  const b = selectBucket(rootState, meta);
  return b?.error ?? null;
}
