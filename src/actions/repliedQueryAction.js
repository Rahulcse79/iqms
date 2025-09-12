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
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function safeSaveToStorage(items) {
  try {
    localStorage.setItem(REPLIED_STORAGE_KEY, JSON.stringify(items || []));
  } catch (e) {
    console.warn("Failed to save repliedQueries to storage:", e);
  }
}

function safeClearRepliedStorage() {
  try {
    localStorage.removeItem(REPLIED_STORAGE_KEY);
  } catch (e) {
    console.warn("Failed to clear repliedQueries storage:", e);
  }
}

function safeSave(items) {
  try {
    localStorage.setItem(REPLIED_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn("Failed to save replied queries:", e);
  }
}

export const fetchRepliedQueries = () => async (dispatch) => {
  dispatch({ type: REPLIED_QUERY_REQUEST });

  try {
    let firstPageDone = false;

    await fetchPagedIncremental(
      "http://sampoorna.cao.local/afcao/ipas/ivrs/repliedQuery",
      {
        onPage: (items, all) => {
          safeSaveToStorage(all);
          dispatch({ type: REPLIED_QUERY_SUCCESS, payload: [...all] });

          // unblock login after first page
          if (!firstPageDone) {
            firstPageDone = true;
          }
        },
      }
    );
  } catch (err) {
    dispatch({
      type: REPLIED_QUERY_FAIL,
      payload: err.message || "Failed to fetch replied queries",
    });
  }
};

// Background refresh (no blocking loader)
export const refreshRepliedQueries = () => async (dispatch) => {
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
    console.error("Silent refresh failed:", err.message);
  }
};

export { safeGetFromStorage };
