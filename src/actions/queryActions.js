// src/actions/queryActions.js
import api from "../utils/axiosInstance";
import {
  SEARCH_QUERY_REQUEST,
  SEARCH_QUERY_SUCCESS,
  SEARCH_QUERY_FAIL,
  SEARCH_QUERY_ID_REQUEST,
  SEARCH_QUERY_ID_SUCCESS,
  SEARCH_QUERY_ID_FAIL,
  CLEAR_QUERY_RESULTS,
  FAQ_REQUEST, FAQ_SUCCESS, FAQ_FAIL, CLEAR_FAQ_RESULTS,
    FRQ_QRY_REQUEST,
  FRQ_QRY_SUCCESS,
  FRQ_QRY_FAIL,
  CLEAR_FRQ_QRY_RESULTS,
} from "../constants/queryConstants";

export const fetchFaq = (options = {}) => (dispatch, getState) => {
  const {
    slot = undefined,
    key = undefined,
    force = false,
    cacheTTL = 5 * 60 * 1000, // 5 minutes
    retries = 2,
    retryDelay = 500,
    notifyOnCancel = false,
  } = options;

  const requestId = `faq_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const meta = { slot, key, requestId };

  // derive bucket key similar to reducer
  const makeKey = (m) => {
    if (!m) return "default";
    if (m.slot !== undefined && m.slot !== null) return `slot${m.slot}`;
    if (m.key) return `${m.key}`;
    return "default";
  };
  const bucketKey = makeKey(meta);

  // cache check
  try {
    const state = typeof getState === "function" ? getState() : null;
    const bucket = state?.faq?.byKey?.[bucketKey] || state?.faqReducer?.byKey?.[bucketKey] || null; // support different reducer names
    if (!force && bucket?.lastFetched) {
      const last = new Date(bucket.lastFetched).getTime ? new Date(bucket.lastFetched).getTime() : Number(bucket.lastFetched) || 0;
      if (Date.now() - last < cacheTTL && Array.isArray(bucket.items) && bucket.items.length > 0) {
        // return cached data immediately (no network call)
        return Promise.resolve({ items: bucket.items, cached: true, meta });
      }
    }
  } catch (e) {
    // ignore cache inspection errors and continue with network call
    console.debug("fetchFaq: cache inspect failed", e);
  }

  // create abort controller for cancellation support
  const controller = new AbortController();
  const signal = controller.signal;

  // small helper sleep that respects abort
  const sleep = (ms) =>
    new Promise((resolve, reject) => {
      if (signal.aborted) return reject(new Error("aborted"));
      const t = setTimeout(() => {
        signal.removeEventListener("abort", onAbort);
        resolve();
      }, ms);
      function onAbort() {
        clearTimeout(t);
        reject(new Error("aborted"));
      }
      signal.addEventListener("abort", onAbort, { once: true });
    });

  // normalize axios/other error to a small object
  const normalizeError = (err) => {
    const isAbort = err?.code === "ERR_CANCELED" || err?.message === "aborted" || err?.name === "CanceledError" || err?.name === "AbortError";
    const status = err?.response?.status ?? null;
    const message =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      "Unable to fetch FAQ";
    return {
      message,
      status,
      isAbort,
      raw: err,
    };
  };

  // dispatch request (bucket-aware)
  dispatch({ type: FAQ_REQUEST, meta });

  // The promise returned to caller (with .cancel())
  const promise = (async () => {
    let attempt = 0;
    let lastError = null;

    while (attempt <= retries) {
      try {
        // NOTE: endpoint path is relative to your api baseURL. Adjust if needed.
        const { data } = await api.get("/WEB_FAQ", { signal });

        // normalize items
        const items = Array.isArray(data?.items) ? data.items : data?.items ? [data.items] : [];

        // dispatch success with bucket meta
        dispatch({
          type: FAQ_SUCCESS,
          payload: items,
          meta,
        });

        // return full data for callers (include raw for flexibility)
        return { ...data, items, meta };
      } catch (err) {
        const norm = normalizeError(err);
        lastError = norm;

        // If aborted, optionally dispatch a fail that marks canceled and then throw
        if (norm.isAbort) {
          if (notifyOnCancel) {
            dispatch({
              type: FAQ_FAIL,
              payload: { message: "Request cancelled by user", canceled: true },
              meta,
            });
          }
          // throw to let caller handle cancellation
          throw err;
        }

        // if we still have attempts left, wait with exponential backoff then retry
        attempt += 1;
        if (attempt <= retries) {
          const backoff = retryDelay * Math.pow(2, attempt - 1);
          try {
            await sleep(backoff);
          } catch (abortDuringSleep) {
            // aborted while sleeping
            if (notifyOnCancel) {
              dispatch({
                type: FAQ_FAIL,
                payload: { message: "Request cancelled by user", canceled: true },
                meta,
              });
            }
            throw abortDuringSleep;
          }
          continue; // next attempt
        }

        // no retries left -> dispatch fail and rethrow normalized error
        const payload = {
          message: norm.message,
          status: norm.status,
        };
        dispatch({
          type: FAQ_FAIL,
          payload,
          meta,
        });

        // attach normalized info to thrown error for caller convenience
        const thrown = new Error(payload.message);
        thrown.status = payload.status;
        thrown.raw = norm.raw;
        throw thrown;
      }
    }

    // if loop exits unexpectedly, throw last known error
    const thrown = new Error(lastError?.message || "Unknown error");
    thrown.raw = lastError?.raw || null;
    throw thrown;
  })();

  // attach cancel method so callers can abort: e.g. const p = dispatch(fetchFaq()); p.cancel();
  promise.cancel = () => {
    try {
      controller.abort();
    } catch (e) {
      console.debug("fetchFaq cancel failed", e);
    }
  };

  return promise;
};

// Search by Service No + Category (with slot tracking)
export const searchByServiceNoAndCategory = (serviceNo, category, slot) => async (dispatch) => {
  try {
    dispatch({ type: SEARCH_QUERY_REQUEST, meta: { slot } });

    const { data } = await api.get(`/searchQuery_SNO_CAT/${serviceNo}/1`);

    dispatch({
      type: SEARCH_QUERY_SUCCESS,
      payload: data.items || [],
      meta: { slot },
    });

    return data; // 👈 RETURN the API response so component can use it
  } catch (error) {
    dispatch({
      type: SEARCH_QUERY_FAIL,
      payload: error.message || "Something went wrong",
      meta: { slot },
    });

    throw error; // 👈 also rethrow so component can catch
  }
};

// Search by Query ID
export const searchByQueryId = (docId) => async (dispatch) => {
  try {
    dispatch({ type: SEARCH_QUERY_ID_REQUEST, meta: { slot: "doc" } });

    const { data } = await api.get(`/searchQuery_docId/${docId}`);

    dispatch({
      type: SEARCH_QUERY_ID_SUCCESS,
      payload: {
        items: data.items || [],
        count: data.count || 0,
        hasMore: data.hasMore || false,
        limit: data.limit || 0,
        offset: data.offset || 0,
      },
      meta: { slot: "doc" },
    });
  } catch (error) {
    dispatch({
      type: SEARCH_QUERY_ID_FAIL,
      payload: error.response?.data?.message || error.message || "Something went wrong",
      meta: { slot: "doc" },
    });
  }
};

// Clear all slots
export const clearQueryResults = () => (dispatch) => {
  dispatch({ type: CLEAR_QUERY_RESULTS });
};


function makeKey(meta) {
  if (!meta) return "default";
  if (meta.slot !== undefined && meta.slot !== null) return `slot${meta.slot}`;
  if (meta.topic !== undefined && meta.topic !== null) return `topic${meta.topic}`;
  if (meta.key) return String(meta.key);
  return "default";
}

function normalizeSuccessPayload(payload) {
  if (!payload) return { items: [], total: 0 };
  if (Array.isArray(payload)) return { items: payload, total: payload.length };
  if (Array.isArray(payload.items)) return { items: payload.items, total: payload.count ?? payload.items.length };
  return { items: [payload], total: 1 };
}

function normalizeError(err) {
  if (!err) return { message: "Unknown error", status: null, raw: err, isAbort: false };
  const isAbort =
    err?.code === "ERR_CANCELED" ||
    err?.name === "CanceledError" ||
    err?.name === "AbortError" ||
    err?.message === "aborted";
  const message =
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    (typeof err === "string" ? err : "Unable to fetch data");
  const status = err?.response?.status ?? err?.status ?? null;
  return { message, status, raw: err, isAbort };
}

export const fetchFrqQueryCount = (moduleCat, options = {}) => (dispatch, getState) => {
  if (moduleCat === undefined || moduleCat === null) {
    return Promise.reject(new Error("moduleCat is required"));
  }

  const {
    slot = undefined,
    key = undefined,
    force = false,
    cacheTTL = 5 * 60 * 1000,
    retries = 2,
    retryDelay = 500,
    notifyOnCancel = false,
  } = options;

  const meta = { slot, key, moduleCat };
  const bucketKey = makeKey(meta);
  const requestId = `frq_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const metaWithRequestId = { ...meta, requestId };

  // check cache
  try {
    const state = typeof getState === "function" ? getState() : null;
    const roots = state?.frqQry ?? state?.frqQryReducer ?? state?.frqQryState ?? state;
    const bucket = roots?.byKey?.[bucketKey] ?? null;
    if (!force && bucket?.lastFetched) {
      let last = 0;
      try {
        last = new Date(bucket.lastFetched).getTime ? new Date(bucket.lastFetched).getTime() : Number(bucket.lastFetched) || 0;
      } catch (e) {
        last = 0;
      }
      if (Date.now() - last < cacheTTL && Array.isArray(bucket.items) && bucket.items.length > 0) {
        // return cached data synchronously
        return Promise.resolve({ items: bucket.items, cached: true, meta: metaWithRequestId });
      }
    }
  } catch (e) {
    // ignore cache inspection errors
    // console.debug("fetchFrqQueryCount: cache inspect failed", e);
  }

  const controller = new AbortController();
  const signal = controller.signal;

  // helper sleep respecting abort
  const sleep = (ms) =>
    new Promise((resolve, reject) => {
      if (signal.aborted) return reject(new Error("aborted"));
      const t = setTimeout(() => {
        signal.removeEventListener("abort", onAbort);
        resolve();
      }, ms);
      function onAbort() {
        clearTimeout(t);
        reject(new Error("aborted"));
      }
      signal.addEventListener("abort", onAbort, { once: true });
    });

  // dispatch request
  dispatch({ type: FRQ_QRY_REQUEST, meta: metaWithRequestId });

  const promise = (async () => {
    let attempt = 0;
    let lastErr = null;
    const url = `/frqQueryCount/${encodeURIComponent(moduleCat)}`;

    while (attempt <= retries) {
      try {
        const { data } = await api.get(url, { signal });
        // normalize items (API returns items array in sample)
        const items = Array.isArray(data?.items) ? data.items : data?.items ? [data.items] : [];
        // dispatch success
        dispatch({
          type: FRQ_QRY_SUCCESS,
          payload: items,
          meta: metaWithRequestId,
        });
        return { ...data, items, meta: metaWithRequestId };
      } catch (err) {
        const norm = normalizeError(err);
        lastErr = norm;
        // if aborted
        if (norm.isAbort) {
          if (notifyOnCancel) {
            dispatch({
              type: FRQ_QRY_FAIL,
              payload: { message: "Request cancelled by user", canceled: true },
              meta: metaWithRequestId,
            });
          }
          throw err;
        }

        attempt += 1;
        if (attempt <= retries) {
          // exponential backoff
          const backoff = retryDelay * Math.pow(2, attempt - 1);
          try {
            await sleep(backoff);
          } catch (abortDuringSleep) {
            if (notifyOnCancel) {
              dispatch({
                type: FRQ_QRY_FAIL,
                payload: { message: "Request cancelled by user", canceled: true },
                meta: metaWithRequestId,
              });
            }
            throw abortDuringSleep;
          }
          continue; // retry
        }

        // no retries left -> dispatch fail and throw
        const payload = { message: norm.message, status: norm.status };
        dispatch({
          type: FRQ_QRY_FAIL,
          payload,
          meta: metaWithRequestId,
        });

        const thrown = new Error(payload.message);
        thrown.status = payload.status;
        thrown.raw = norm.raw;
        throw thrown;
      }
    }

    // loop fell through (shouldn't)
    const thrown = new Error(lastErr?.message || "Unknown error");
    thrown.raw = lastErr?.raw || null;
    throw thrown;
  })();

  // attach cancel
  promise.cancel = () => {
    try {
      controller.abort();
    } catch (e) {
      // ignore
    }
  };

  return promise;
};

/* -------------------------------------------------------------------------- */
/* Clear action                                                                */
/* -------------------------------------------------------------------------- */

export const clearFrqQryResults = () => (dispatch) => {
  dispatch({ type: CLEAR_FRQ_QRY_RESULTS });
};

export default {
  fetchFrqQueryCount,
  clearFrqQryResults,
};