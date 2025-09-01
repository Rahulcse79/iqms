// reducers/ProfileReducers.js
import {
  DEBUG_REDUX_LOGS,
  FETCH_PERSONAL_DATA_REQUEST,
  FETCH_PERSONAL_DATA_SUCCESS,
  FETCH_PERSONAL_DATA_FAIL,
  RANK_HISTORY_REQUEST,
  RANK_HISTORY_SUCCESS,
  RANK_HISTORY_FAIL,
  TRADE_HISTORY_REQUEST,
  TRADE_HISTORY_SUCCESS,
  TRADE_HISTORY_FAIL,
  POSTING_HISTORY_REQUEST,
  POSTING_HISTORY_SUCCESS,
  POSTING_HISTORY_FAIL,
  // Keeping for parity with your constants file
  FETCH_ABC_REQUEST,
  FETCH_ABC_SUCCESS,
  FETCH_ABC_FAILURE,
  GCI_HISTORY_REQUEST,
  GCI_HISTORY_SUCCESS,
  GCI_HISTORY_FAIL,
} from "../constants/ProfileConstants";

/** Local reducer logger */
const rlog = {
  hit(type, extra) {
    if (!DEBUG_REDUX_LOGS) return;
    try {
      // eslint-disable-next-line no-console
      console.groupCollapsed(`[reducer] ${type}`);
      if (extra) {
        // eslint-disable-next-line no-console
        console.log("payload/meta:", extra);
      }
      // eslint-disable-next-line no-console
      console.groupEnd();
    } catch {}
  },
};

// Separate initial states so slices don’t clobber each other
const personalInitial = {
  loading: false,
  personalData: null,
  error: null,
  repliedQueries: [],
};

const profileViewInitial = {
  rankHistory: { loading: false, items: [], meta: null, error: null },
  tradeHistory: { loading: false, items: [], meta: null, error: null },
  postingHistory: { loading: false, items: [], meta: null, error: null },
};

/* -------------------- Personal Data Reducer -------------------- */
export const personalDataReducer = (state = personalInitial, action) => {
  switch (action.type) {
    case FETCH_PERSONAL_DATA_REQUEST: {
      rlog.hit(action.type);
      return { ...state, loading: true, error: null };
    }
    case FETCH_PERSONAL_DATA_SUCCESS: {
      rlog.hit(action.type, { received: !!action.payload });
      return {
        ...state,
        loading: false,
        personalData: action.payload,
        error: null,
      };
    }
    case FETCH_PERSONAL_DATA_FAIL: {
      rlog.hit(action.type, action.payload);
      return {
        ...state,
        loading: false,
        personalData: null,
        error: action.payload,
      };
    }
    default:
      return state;
  }
};

/* ------------- Rank / Trade / Posting (Profile View) ---------- */
export const ProfileViewReducer = (state = profileViewInitial, action) => {
  switch (action.type) {
    /* ------------------ RANK HISTORY ------------------ */
    case RANK_HISTORY_REQUEST: {
      rlog.hit(action.type);
      return {
        ...state,
        rankHistory: { ...state.rankHistory, loading: true, error: null },
      };
    }
    case RANK_HISTORY_SUCCESS: {
      rlog.hit(action.type, {
        count: action.payload?.count,
        items: Array.isArray(action.payload?.items)
          ? action.payload.items.length
          : 0,
      });
      return {
        ...state,
        rankHistory: {
          ...state.rankHistory,
          loading: false,
          items: Array.isArray(action.payload?.items)
            ? action.payload.items
            : [],
          meta: action.payload || null,
          error: null,
        },
      };
    }
    case RANK_HISTORY_FAIL: {
      rlog.hit(action.type, action.payload);
      return {
        ...state,
        rankHistory: {
          ...state.rankHistory,
          loading: false,
          error: action.payload,
        },
      };
    }

    /* ------------------ TRADE HISTORY ----------------- */
    case TRADE_HISTORY_REQUEST: {
      rlog.hit(action.type);
      return {
        ...state,
        tradeHistory: { ...state.tradeHistory, loading: true, error: null },
      };
    }
    case TRADE_HISTORY_SUCCESS: {
      rlog.hit(action.type, {
        count: action.payload?.count,
        items: Array.isArray(action.payload?.items)
          ? action.payload.items.length
          : 0,
      });
      return {
        ...state,
        tradeHistory: {
          ...state.tradeHistory,
          loading: false,
          items: Array.isArray(action.payload?.items)
            ? action.payload.items
            : [],
          meta: action.payload || null,
          error: null,
        },
      };
    }
    case TRADE_HISTORY_FAIL: {
      rlog.hit(action.type, action.payload);
      return {
        ...state,
        tradeHistory: {
          ...state.tradeHistory,
          loading: false,
          error: action.payload,
        },
      };
    }

    /* ----------------- POSTING HISTORY ---------------- */
    case POSTING_HISTORY_REQUEST: {
      rlog.hit(action.type);
      return {
        ...state,
        postingHistory: { ...state.postingHistory, loading: true, error: null },
      };
    }
    case POSTING_HISTORY_SUCCESS: {
      rlog.hit(action.type, {
        count: action.payload?.count,
        items: Array.isArray(action.payload?.items)
          ? action.payload.items.length
          : 0,
      });
      return {
        ...state,
        postingHistory: {
          ...state.postingHistory,
          loading: false,
          items: Array.isArray(action.payload?.items)
            ? action.payload.items
            : [],
          meta: action.payload || null,
          error: null,
        },
      };
    }
    case POSTING_HISTORY_FAIL: {
      rlog.hit(action.type, action.payload);
      return {
        ...state,
        postingHistory: {
          ...state.postingHistory,
          loading: false,
          error: action.payload,
        },
      };
    }

    case GCI_HISTORY_REQUEST: {
      // optional cacheKey in action.meta
      return {
        ...state,
        gciHistory: {
          ...state.gciHistory,
          loading: true,
          error: null,
        },
      };
    }

    case GCI_HISTORY_SUCCESS: {
      const cacheKey = action?.meta?.cacheKey ?? null;
      const payload = action.payload || {};
      const items = Array.isArray(payload.items)
        ? payload.items
        : (payload || []).items ?? [];
      const newCache = { ...(state.gciHistory.cache || {}) };

      if (cacheKey) {
        newCache[cacheKey] = payload;
      }

      return {
        ...state,
        gciHistory: {
          ...state.gciHistory,
          loading: false,
          items: items,
          meta: payload || null,
          error: null,
          cache: newCache,
        },
      };
    }

    case GCI_HISTORY_FAIL:
      return {
        ...state,
        gciHistory: {
          ...state.gciHistory,
          loading: false,
          error: action.payload ?? "Failed to fetch GCI history",
        },
      };

    default:
      return state;
  }
};

export const abcCodesReducer = (state = personalInitial, action) => {
  console.log("[Reducer] abcCodesReducer Action:", action.type);

  switch (action.type) {
    case FETCH_ABC_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case FETCH_ABC_SUCCESS:
      console.log("[Reducer] Payload:", action.payload);
      return {
        ...state,
        loading: false,
        items: action.payload.items || [],
        meta: {
          hasMore: action.payload.hasMore,
          limit: action.payload.limit,
          offset: action.payload.offset,
          count: action.payload.count,
          links: action.payload.links,
        },
        error: null,
      };

    case FETCH_ABC_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    default:
      return state;
  }
};

// Import breadcrumb
try {
  if (DEBUG_REDUX_LOGS) {
    // eslint-disable-next-line no-console
    console.log("[reducer] ProfileReducers loaded");
  }
} catch {}
