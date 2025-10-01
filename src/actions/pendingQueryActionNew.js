// NEW PENDING QUERY ACTION - Add this as a new file: pendingQueryActionNew.js
// or add these methods to your existing pendingQueryAction.js

import {
  PENDING_QUERY_REQUEST,
  PENDING_QUERY_SUCCESS,
  PENDING_QUERY_FAIL,
} from "../constants/appConstants";

const PENDING_STORAGE_KEY_NEW = "pendingQueries_v2_new";

function safeLoadPendingStorageNew() {
  try {
    const raw = localStorage.getItem(PENDING_STORAGE_KEY_NEW);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.warn("Failed to read PENDING storage (NEW):", e);
    return {};
  }
}

function safeSavePendingToStorageNew(pendingWith, items) {
  try {
    const store = safeLoadPendingStorageNew();
    store[pendingWith] = items || [];
    localStorage.setItem(PENDING_STORAGE_KEY_NEW, JSON.stringify(store));
  } catch (e) {
    console.warn("Failed to save PENDING to storage (NEW):", e);
  }
}

/**
 * NEW API: Fetch pending queries using the updated ivrsIqmsListing API
 * @param {Object} params - API parameters
 * @param {string} params.moduleCat - Module category (e.g., "1")
 * @param {string} params.penWith - Pending with designation (e.g., "U1A")
 * @param {string} params.subSection - Sub section (e.g., "CQC")
 * @param {string} params.cell - Cell allocation string (e.g., "'501','502','503'")
 */
export const fetchPendingQueriesNew =
  ({ moduleCat, penWith, subSection, cell }) =>
  async (dispatch) => {
    dispatch({
      type: PENDING_QUERY_REQUEST,
      meta: { pendingWith: penWith, apiVersion: "NEW" },
    });

    try {
      const correctedPenWith = "U" + penWith.slice(1);

      console.log(
        `🔄 Fetching pending queries (NEW API) for corrected code: ${correctedPenWith}`
      );

      console.log("🔄 Fetching pending queries (NEW API):", {
        moduleCat,
        penWith,
        subSection,
        cell: cell.substring(0, 50) + "...", // Truncate for logging
      });

      const requestBody = {
        queryType: "PENDING_QUERY",
        MODULE_CAT: moduleCat,
        PEN_WITH: correctedPenWith,
        SUB_SECTION: subSection,
        CELL: cell,
        api_token: "IVRSuiyeUnekIcnmEWxnmrostooUZxXYPibnvIVRS",
      };

      const response = await fetch(
        "http://175.25.5.7/API/controller.php?ivrsIqmsListing",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
          timeout: 30000,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(
        `✅ Pending queries (NEW API) fetched for ${penWith}:`,
        data?.data?.length || 0,
        "items"
      );

      // Ensure we have an items array
      const items = data?.items || data?.data || [];

      // Save to storage and dispatch success
      safeSavePendingToStorageNew(penWith, items);
      dispatch({
        type: PENDING_QUERY_SUCCESS,
        payload: { pendingWith: penWith, items: [...items] },
        meta: { apiVersion: "NEW" },
      });

      return { pendingWith: penWith, items: items, apiVersion: "NEW" };
    } catch (error) {
      console.error(
        "❌ Failed to fetch pending queries (NEW API) for",
        penWith,
        ":",
        error
      );

      dispatch({
        type: PENDING_QUERY_FAIL,
        payload: error?.message || String(error),
        meta: { pendingWith: penWith, apiVersion: "NEW" },
      });

      throw error;
    }
  };

/**
 * NEW API: Refresh pending queries using the updated API
 * Used by Refresh button / Topbar manual refresh
 */
export const refreshPendingQueriesNew =
  ({ moduleCat, penWith, subSection, cell }) =>
  async (dispatch) => {
    console.log("🔄 Refreshing pending queries (NEW API) for:", penWith);

    // Clear existing data first
    safeSavePendingToStorageNew(penWith, []);

    // Fetch fresh data
    return dispatch(
      fetchPendingQueriesNew({ moduleCat, penWith, subSection, cell })
    );
  };

/**
 * NEW API: Load pending queries from storage (for offline/cached access)
 */
export const loadPendingQueriesFromStorageNew = (pendingWith) => (dispatch) => {
  try {
    const store = safeLoadPendingStorageNew();
    const items = store[pendingWith] || [];

    console.log(
      `📦 Loading pending queries (NEW API) from storage for ${pendingWith}:`,
      items.length,
      "items"
    );

    dispatch({
      type: PENDING_QUERY_SUCCESS,
      payload: { pendingWith: pendingWith, items: [...items] },
      meta: { fromStorage: true, apiVersion: "NEW" },
    });

    return {
      pendingWith: pendingWith,
      items: items,
      fromStorage: true,
      apiVersion: "NEW",
    };
  } catch (error) {
    console.error(
      "❌ Failed to load pending queries (NEW API) from storage:",
      error
    );
    dispatch({
      type: PENDING_QUERY_FAIL,
      payload: "Failed to load from storage: " + error?.message,
      meta: { pendingWith: pendingWith, apiVersion: "NEW" },
    });
    throw error;
  }
};

/**
 * NEW API: Get pending queries count from storage without dispatching
 */
export const getPendingQueriesCountNew = (pendingWith) => {
  try {
    const store = safeLoadPendingStorageNew();
    const items = store[pendingWith] || [];
    return items.length;
  } catch (error) {
    console.warn("Failed to get pending queries count (NEW API):", error);
    return 0;
  }
};

/**
 * NEW API: Clear all pending queries from storage
 */
export const clearPendingQueriesStorageNew = () => {
  try {
    localStorage.removeItem(PENDING_STORAGE_KEY_NEW);
    console.log("🗑️ Cleared pending queries storage (NEW API)");
  } catch (error) {
    console.warn("Failed to clear pending queries storage (NEW API):", error);
  }
};
