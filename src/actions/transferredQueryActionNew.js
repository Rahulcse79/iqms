// NEW TRANSFERRED QUERY ACTION - Add this as a new file: transferredQueryActionNew.js
// or add these methods to your existing transferredQueryAction.js

import {
  TRANSFERRED_QUERY_REQUEST,
  TRANSFERRED_SUCCESS,
  TRANSFERRED_FAIL,
} from "../constants/appConstants";

const TRANSFERRED_STORAGE_KEY_NEW = "transferredQueries_v2_new";

function safeLoadTransferredStorageNew() {
  try {
    const raw = localStorage.getItem(TRANSFERRED_STORAGE_KEY_NEW);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.warn("Failed to read TRANSFERRED storage (NEW):", e);
    return {};
  }
}

function safeSaveTransferredToStorageNew(pendingWith, items) {
  try {
    const store = safeLoadTransferredStorageNew();
    store[pendingWith] = items || [];
    localStorage.setItem(TRANSFERRED_STORAGE_KEY_NEW, JSON.stringify(store));
  } catch (e) {
    console.warn("Failed to save TRANSFERRED to storage (NEW):", e);
  }
}

/**
 * NEW API: Fetch transferred queries using the updated ivrsIqmsListing API
 * @param {Object} params - API parameters
 * @param {string} params.moduleCat - Module category (e.g., "1")
 * @param {string} params.penWith - Pending with designation (e.g., "U1A")
 * @param {string} params.cell - Cell allocation string (e.g., "'501','502','503'")
 */
export const fetchTransferredQueriesNew =
  ({ moduleCat, cell, designationFlags }) =>
  async (dispatch) => {
    if (!designationFlags || designationFlags.length === 0) {
      console.warn(
        "No valid designation flags provided for transferred queries. Skipping fetch."
      );
      return { designationFlags: [], items: [], apiVersion: "NEW" };
    }

    // Since we now fetch for multiple flags, we'll dispatch for each one
    // or aggregate them. For simplicity, let's fetch for the first valid flag.
    const penWith = designationFlags[0];

    dispatch({
      type: TRANSFERRED_QUERY_REQUEST,
      meta: { pendingWith: penWith, apiVersion: "NEW" },
    });

    try {
      console.log("🔄 Fetching transferred queries (NEW API):", {
        moduleCat,
        penWith,
        cell: cell.substring(0, 50) + "...",
      });

      const requestBody = {
        queryType: "TRANSFER_QUERY",
        MODULE_CAT: moduleCat,
        PEN_WITH: penWith, // Use the designation flag
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
        `✅ Transferred queries (NEW API) fetched for ${penWith}:`,
        data?.data?.length || 0,
        "items"
      );

      // Ensure we have an items array
      const items = data?.data || [];

      // Save to storage and dispatch success
      safeSaveTransferredToStorageNew(penWith, items);
      dispatch({
        type: TRANSFERRED_SUCCESS,
        payload: { pendingWith: penWith, items: [...items] },
        meta: { apiVersion: "NEW" },
      });

      return { pendingWith: penWith, items: items, apiVersion: "NEW" };
    } catch (error) {
      console.error(
        "❌ Failed to fetch transferred queries (NEW API) for",
        penWith,
        ":",
        error
      );

      dispatch({
        type: TRANSFERRED_FAIL,
        payload: error?.message || String(error),
        meta: { pendingWith: penWith, apiVersion: "NEW" },
      });

      throw error;
    }
  };

/**
 * NEW API: Refresh transferred queries using the updated API
 * Used by Refresh button / Topbar manual refresh
 */
export const refreshTransferredQueriesNew =
  ({ moduleCat, penWith, cell }) =>
  async (dispatch) => {
    console.log("🔄 Refreshing transferred queries (NEW API) for:", penWith);

    // Clear existing data first
    safeSaveTransferredToStorageNew(penWith, []);

    // Fetch fresh data
    return dispatch(fetchTransferredQueriesNew({ moduleCat, penWith, cell }));
  };

/**
 * NEW API: Load transferred queries from storage (for offline/cached access)
 */
export const loadTransferredQueriesFromStorageNew =
  (pendingWith) => (dispatch) => {
    try {
      const store = safeLoadTransferredStorageNew();
      const items = store[pendingWith] || [];

      console.log(
        `📦 Loading transferred queries (NEW API) from storage for ${pendingWith}:`,
        items.length,
        "items"
      );

      dispatch({
        type: TRANSFERRED_SUCCESS,
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
        "❌ Failed to load transferred queries (NEW API) from storage:",
        error
      );
      dispatch({
        type: TRANSFERRED_FAIL,
        payload: "Failed to load from storage: " + error?.message,
        meta: { pendingWith: pendingWith, apiVersion: "NEW" },
      });
      throw error;
    }
  };

/**
 * NEW API: Get transferred queries count from storage without dispatching
 */
export const getTransferredQueriesCountNew = (pendingWith) => {
  try {
    const store = safeLoadTransferredStorageNew();
    const items = store[pendingWith] || [];
    return items.length;
  } catch (error) {
    console.warn("Failed to get transferred queries count (NEW API):", error);
    return 0;
  }
};

/**
 * NEW API: Clear all transferred queries from storage
 */
export const clearTransferredQueriesStorageNew = () => {
  try {
    localStorage.removeItem(TRANSFERRED_STORAGE_KEY_NEW);
    console.log("🗑️ Cleared transferred queries storage (NEW API)");
  } catch (error) {
    console.warn(
      "Failed to clear transferred queries storage (NEW API):",
      error
    );
  }
};
