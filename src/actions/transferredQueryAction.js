// src/actions/transferredQueryAction.js
import { fetchPagedIncremental } from "../utils/fetchPagedIncremental";
import {
  TRANSFERRED_QUERY_REQUEST,
  TRANSFERRED_SUCCESS,
  TRANSFERRED_FAIL,
} from "../constants/appConstants";

const TRANSFERRED_STORAGE_KEY = "transferredQueries_v1";

function safeLoadTransferredStorage() {
  try {
    const raw = localStorage.getItem(TRANSFERRED_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.warn("Failed to read TRANSFERRED storage:", e);
    return {};
  }
}

function safeSaveTransferredToStorage(pendingWith, items) {
  try {
    const store = safeLoadTransferredStorage();
    store[pendingWith] = items || [];
    localStorage.setItem(TRANSFERRED_STORAGE_KEY, JSON.stringify(store));
  } catch (e) {
    console.warn("Failed to save TRANSFERRED to storage:", e);
  }
}

/**
 * fetchPendingQueries:
 *  - dispatches TRANSFERRED_QUERY_REQUEST (meta: pendingWith)
 *  - dispatches TRANSFERRED_QUERY_SUCCESS repeatedly as pages arrive (payload: { pendingWith, items })
 *  - resolves to caller as soon as first page is available (so login can proceed)
 *  - continues fetching remaining pages in background
 */
export const fetchTransferredQueries =
  ({ cat = 1, pendingWith }) =>
  async (dispatch) => {
    dispatch({ type: TRANSFERRED_QUERY_REQUEST, meta: { pendingWith } });

    const url = `http://sampoorna.cao.local/afcao/ipas/ivrs/transferredQuery/${encodeURIComponent(
      cat
    )}/${encodeURIComponent(pendingWith)}`;

    return new Promise((resolve, reject) => {
      let firstPageResolved = false;

      fetchPagedIncremental(url, {
        onPage: (items, all) => {
          // Save incremental accumulation to storage and dispatch to redux
          safeSaveTransferredToStorage(pendingWith, all);
          dispatch({
            type: TRANSFERRED_SUCCESS,
            payload: { pendingWith, items: [...all] },
          });

          if (!firstPageResolved) {
            firstPageResolved = true;
            resolve({ pendingWith, firstPageCount: items.length });
          }
        },
      }).catch((err) => {
        if (!firstPageResolved) {
          dispatch({
            type: TRANSFERRED_FAIL,
            payload: err?.message || String(err),
            meta: { pendingWith },
          });
          reject(err);
        } else {
          // If first page was already delivered, background failure: log and dispatch failure meta
          console.error(
            "Transferred incremental fetch failed after first page for",
            pendingWith,
            err
          );
          dispatch({
            type: TRANSFERRED_FAIL,
            payload: err?.message || String(err),
            meta: { pendingWith },
          });
        }
      });
    });
  };

/**
 * refreshPendingQueries:
 *  - used by Refresh button / Topbar manual refresh
 *  - waits for full completion and updates storage/redux as pages arrive
 */
export const refreshTransferredQueries =
  ({ cat = 1, pendingWith }) =>
  async (dispatch) => {
    dispatch({ type: TRANSFERRED_QUERY_REQUEST, meta: { pendingWith } });
    const url = `http://sampoorna.cao.local/afcao/ipas/ivrs/transferredQuery/${encodeURIComponent(
      cat
    )}/${encodeURIComponent(pendingWith)}`;

    try {
      await fetchPagedIncremental(url, {
        onPage: (items, all) => {
          safeSaveTransferredToStorage(pendingWith, all);
          dispatch({
            type: TRANSFERRED_SUCCESS,
            payload: { pendingWith, items: [...all] },
          });
        },
      });
    } catch (err) {
      dispatch({
        type: TRANSFERRED_FAIL,
        payload: err?.message || String(err),
        meta: { pendingWith },
      });
      throw err;
    }
  };
