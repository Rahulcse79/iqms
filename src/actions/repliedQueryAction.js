import { fetchPagedIncremental } from "../utils/fetchPagedIncremental";
import {
  REPLIED_QUERY_REQUEST,
  REPLIED_QUERY_SUCCESS,
  REPLIED_QUERY_FAIL,
} from "../constants/appConstants";

const REPLIED_STORAGE_KEY = "repliedQueries_v1";

/** ---- Storage Helpers ---- */
function safeGetFromStorage() {
  try {
    const raw = localStorage.getItem(REPLIED_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function safeSaveToStorage(items) {
  try {
    localStorage.setItem(REPLIED_STORAGE_KEY, JSON.stringify(items || []));
  } catch (e) {
    console.warn("Failed to save repliedQueries to storage:", e);
  }
}

/**
 * fetchRepliedQueries:
 *  - resolves after first page arrives
 *  - continues fetching remaining in background
 */
export const fetchRepliedQueries = () => async (dispatch) => {
  dispatch({ type: REPLIED_QUERY_REQUEST });

  return new Promise((resolve, reject) => {
    let firstPageResolved = false;

    fetchPagedIncremental(
      "http://sampoorna.cao.local/afcao/ipas/ivrs/repliedQuery",
      {
        onPage: (items, all) => {
          safeSaveToStorage(all);
          dispatch({ type: REPLIED_QUERY_SUCCESS, payload: [...all] });

          if (!firstPageResolved) {
            firstPageResolved = true;
            resolve({ firstPageCount: items.length });
          }
        },
      }
    ).catch((err) => {
      if (!firstPageResolved) {
        dispatch({
          type: REPLIED_QUERY_FAIL,
          payload: err?.message || "Failed to fetch replied queries",
        });
        reject(err);
      } else {
        console.error(
          "Replied incremental fetch failed after first page:",
          err
        );
        dispatch({
          type: REPLIED_QUERY_FAIL,
          payload: err?.message || "Background fetch failed",
        });
      }
    });
  });
};

// Background refresh (always waits for full completion)
export const refreshRepliedQueries = () => async (dispatch) => {
  dispatch({ type: REPLIED_QUERY_REQUEST });

  try {
    await fetchPagedIncremental(
      "http://sampoorna.cao.local/afcao/ipas/ivrs/repliedQuery",
      {
        onPage: (items, all) => {
          safeSaveToStorage(all);
          dispatch({ type: REPLIED_QUERY_SUCCESS, payload: [...all] });
        },
      }
    );
  } catch (err) {
    dispatch({
      type: REPLIED_QUERY_FAIL,
      payload: err?.message || "Refresh failed",
    });
    throw err;
  }
};

export { safeGetFromStorage };
