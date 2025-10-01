// NEW REPLIED QUERY ACTION - Add this as a new file: repliedQueryActionNew.js
// or add these methods to your existing repliedQueryAction.js

import {
  REPLIED_QUERY_REQUEST,
  REPLIED_QUERY_SUCCESS,
  REPLIED_QUERY_FAIL,
} from "../constants/appConstants";

const REPLIED_STORAGE_KEY_NEW = "repliedQueries_v2_new";

function safeLoadRepliedStorageNew() {
  try {
    const raw = localStorage.getItem(REPLIED_STORAGE_KEY_NEW);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.warn("Failed to read REPLIED storage (NEW):", e);
    return {};
  }
}

function safeSaveRepliedToStorageNew(subSection, items) {
  try {
    const store = safeLoadRepliedStorageNew();
    store[subSection] = items || [];
    localStorage.setItem(REPLIED_STORAGE_KEY_NEW, JSON.stringify(store));
  } catch (e) {
    console.warn("Failed to save REPLIED to storage (NEW):", e);
  }
}

/**
 * NEW API: Fetch replied queries using the updated ivrsIqmsListing API
 * @param {Object} params - API parameters
 * @param {string} params.moduleCat - Module category (e.g., "1")
 * @param {string} params.subSection - Sub section (e.g., "CQC")
 * @param {string} params.cell - Cell allocation string (e.g., "'501','502','503'")
 */
export const fetchRepliedQueriesNew =
  ({ moduleCat, subSection, cell }) =>
  async (dispatch) => {
    const storageKey = subSection || "DEFAULT";
    dispatch({
      type: REPLIED_QUERY_REQUEST,
      meta: { subSection: storageKey, apiVersion: "NEW" },
    });

    try {
      console.log("🔄 Fetching replied queries (NEW API):", {
        moduleCat,
        subSection,
        cell: cell.substring(0, 50) + "...", // Truncate for logging
      });

      const requestBody = {
        queryType: "REPLIED_QUERY",
        MODULE_CAT: moduleCat,
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
        `✅ Replied queries (NEW API) fetched for ${subSection}:`,
        data?.data?.length || 0,
        "items"
      );

      // Ensure we have an items array
      const items = data?.data || [];

      // Save to storage and dispatch success
      safeSaveRepliedToStorageNew(storageKey, items);
      dispatch({
        type: REPLIED_QUERY_SUCCESS,
        payload: { subSection: storageKey, items: [...items] },
        meta: { apiVersion: "NEW" },
      });

      return { subSection: storageKey, items: items, apiVersion: "NEW" };
    } catch (error) {
      console.error(
        "❌ Failed to fetch replied queries (NEW API) for",
        subSection,
        ":",
        error
      );

      dispatch({
        type: REPLIED_QUERY_FAIL,
        payload: error?.message || String(error),
        meta: { subSection: storageKey, apiVersion: "NEW" },
      });

      throw error;
    }
  };

/**
 * NEW API: Refresh replied queries using the updated API
 * Used by Refresh button / Topbar manual refresh
 */
export const refreshRepliedQueriesNew =
  ({ moduleCat, subSection, cell }) =>
  async (dispatch) => {
    const storageKey = subSection || "DEFAULT";
    console.log("🔄 Refreshing replied queries (NEW API) for:", subSection);

    // Clear existing data first
    safeSaveRepliedToStorageNew(storageKey, []);

    // Fetch fresh data
    return dispatch(fetchRepliedQueriesNew({ moduleCat, subSection, cell }));
  };

/**
 * NEW API: Load replied queries from storage (for offline/cached access)
 */
export const loadRepliedQueriesFromStorageNew = (subSection) => (dispatch) => {
  try {
    const storageKey = subSection || "DEFAULT";
    const store = safeLoadRepliedStorageNew();
    const items = store[storageKey] || [];

    console.log(
      `📦 Loading replied queries (NEW API) from storage for ${subSection}:`,
      items.length,
      "items"
    );

    dispatch({
      type: REPLIED_QUERY_SUCCESS,
      payload: { subSection: storageKey, items: [...items] },
      meta: { fromStorage: true, apiVersion: "NEW" },
    });

    return {
      subSection: storageKey,
      items: items,
      fromStorage: true,
      apiVersion: "NEW",
    };
  } catch (error) {
    console.error(
      "❌ Failed to load replied queries (NEW API) from storage:",
      error
    );
    dispatch({
      type: REPLIED_QUERY_FAIL,
      payload: "Failed to load from storage: " + error?.message,
      meta: { subSection: subSection || "DEFAULT", apiVersion: "NEW" },
    });
    throw error;
  }
};

/**
 * NEW API: Get replied queries count from storage without dispatching
 */
export const getRepliedQueriesCountNew = (subSection) => {
  try {
    const storageKey = subSection || "DEFAULT";
    const store = safeLoadRepliedStorageNew();
    const items = store[storageKey] || [];
    return items.length;
  } catch (error) {
    console.warn("Failed to get replied queries count (NEW API):", error);
    return 0;
  }
};

/**
 * NEW API: Clear all replied queries from storage
 */
export const clearRepliedQueriesStorageNew = () => {
  try {
    localStorage.removeItem(REPLIED_STORAGE_KEY_NEW);
    console.log("🗑️ Cleared replied queries storage (NEW API)");
  } catch (error) {
    console.warn("Failed to clear replied queries storage (NEW API):", error);
  }
};
