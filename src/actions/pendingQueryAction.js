// src/actions/pendingQueryAction.js
import { fetchPagedIncremental } from "../utils/fetchPagedIncremental";
import {
  PENDING_QUERY_REQUEST,
  PENDING_QUERY_SUCCESS,
  PENDING_QUERY_FAIL,
} from "../constants/appConstants";

const PENDING_STORAGE_KEY = "pendingQueries_v1"; // we'll store an object keyed by pendingWith

function safeLoadPendingStorage() {
  try {
    const raw = localStorage.getItem(PENDING_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.warn("Failed to read pending storage:", e);
    return {};
  }
}

function safeSavePendingToStorage(pendingWith, items) {
  try {
    const store = safeLoadPendingStorage();
    store[pendingWith] = items || [];
    localStorage.setItem(PENDING_STORAGE_KEY, JSON.stringify(store));
  } catch (e) {
    console.warn("Failed to save pending to storage:", e);
  }
}

/**
 * fetchPendingQueries:
 *  - dispatches PENDING_QUERY_REQUEST (meta: pendingWith)
 *  - dispatches PENDING_QUERY_SUCCESS repeatedly as pages arrive (payload: { pendingWith, items })
 *  - resolves to caller as soon as first page is available (so login can proceed)
 *  - continues fetching remaining pages in background
 */
export const fetchPendingQueries = ({ cat = 1, pendingWith }) => async (dispatch) => {
  dispatch({ type: PENDING_QUERY_REQUEST, meta: { pendingWith } });

  const url = `http://sampoorna.cao.local/afcao/ipas/ivrs/pendingQuery/${encodeURIComponent(cat)}/${encodeURIComponent(
    pendingWith
  )}`;

  return new Promise((resolve, reject) => {
    let firstPageResolved = false;

    fetchPagedIncremental(url, {
      onPage: (items, all) => {
        // Save incremental accumulation to storage and dispatch to redux
        safeSavePendingToStorage(pendingWith, all);
        dispatch({
          type: PENDING_QUERY_SUCCESS,
          payload: { pendingWith, items: [...all] },
        });

        if (!firstPageResolved) {
          firstPageResolved = true;
          resolve({ pendingWith, firstPageCount: items.length });
        }
      },
    }).catch((err) => {
      if (!firstPageResolved) {
        dispatch({ type: PENDING_QUERY_FAIL, payload: err?.message || String(err), meta: { pendingWith } });
        reject(err);
      } else {
        // If first page was already delivered, background failure: log and dispatch failure meta
        console.error("Pending incremental fetch failed after first page for", pendingWith, err);
        dispatch({ type: PENDING_QUERY_FAIL, payload: err?.message || String(err), meta: { pendingWith } });
      }
    });
  });
};

/**
 * refreshPendingQueries:
 *  - used by Refresh button / Topbar manual refresh
 *  - waits for full completion and updates storage/redux as pages arrive
 */
export const refreshPendingQueries = ({ cat = 1, pendingWith }) => async (dispatch) => {
  dispatch({ type: PENDING_QUERY_REQUEST, meta: { pendingWith } });
  const url = `http://sampoorna.cao.local/afcao/ipas/ivrs/pendingQuery/${encodeURIComponent(cat)}/${encodeURIComponent(
    pendingWith
  )}`;

  try {
    await fetchPagedIncremental(url, {
      onPage: (items, all) => {
        safeSavePendingToStorage(pendingWith, all);
        dispatch({ type: PENDING_QUERY_SUCCESS, payload: { pendingWith, items: [...all] } });
      },
    });
  } catch (err) {
    dispatch({ type: PENDING_QUERY_FAIL, payload: err?.message || String(err), meta: { pendingWith } });
    throw err;
  }
};
