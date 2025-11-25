// repliedQueryActionNew.js
import {
  REPLIED_QUERY_REQUEST,
  REPLIED_QUERY_SUCCESS,
  REPLIED_QUERY_FAIL,
  REPLIED_QUERY_HYDRATE, // Make sure this constant exists in appConstants.js
} from "../constants/appConstants";
import { loadRepliedQueries, saveRepliedQueries } from "../utils/storage"; // Import from storage.js

/**
 * Format cell allocation for API
 * @param {string} cellAlloted - Cell allocation string from activeRole
 * @returns {string} - Formatted cell string for API
 */
export const formatCellAllocation = (cellAlloted) => {
  if (!cellAlloted) return "";
  // If already formatted with quotes, return as is
  if (cellAlloted.includes("'")) return cellAlloted;
  // Split by comma and wrap each in quotes
  const cells = cellAlloted.split(",").map((cell) => cell.trim());
  const formatted = cells.map((cell) => `'${cell}'`).join(",");
  console.log(`📝 Formatted cells: ${cellAlloted} -> ${formatted}`);
  return formatted;
};

/**
 * Hydrate replied queries from IndexedDB on app start
 * This loads existing data without making API calls
 */
export const hydrateRepliedQueriesFromStorage =
  (subSection) => async (dispatch) => {
    try {
      const store = await loadRepliedQueries();
      const items = store[subSection] || [];
      console.log(
        `💧 Hydrating ${subSection} with ${items.length} items from IndexedDB`
      );

      dispatch({
        type: REPLIED_QUERY_HYDRATE,
        payload: { subSection, items },
      });

      return items;
    } catch (error) {
      console.error("❌ Failed to hydrate from IndexedDB:", error);
      return [];
    }
  };

/**
 * Fetch replied queries from API
 */
export const fetchRepliedQueriesNew =
  ({ moduleCat, subSection, cell, activeRole }) =>
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
      });

      const requestBody = {
        queryType: "REPLIED_QUERY",
        MODULE_CAT: moduleCat,
        SUB_SECTION: subSection,
        CELL: formatCellAllocation(activeRole?.CELL_ALLOTED || cell),
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
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      let items = [];

      if (data.success && Array.isArray(data.data)) {
        items = data.data;
        console.log(
          `✅ Fetched ${items.length} replied queries (NEW API) for ${subSection}`
        );
      } else {
        console.warn("⚠️ API responded with no data or error:", data);
        items = [];
      }

      // Save to IndexedDB (async - non-blocking)
      const store = await loadRepliedQueries();
      store[storageKey] = items;
      await saveRepliedQueries(store);

      dispatch({
        type: REPLIED_QUERY_SUCCESS,
        payload: items, // Changed to just items for simpler reducer
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
 * Refresh replied queries (wrapper for fetchRepliedQueriesNew)
 */
export const refreshRepliedQueriesNew =
  ({ moduleCat, subSection, cell, activeRole }) =>
  async (dispatch) => {
    console.log("🔄 Refreshing replied queries (NEW API) for:", subSection);
    return dispatch(
      fetchRepliedQueriesNew({ moduleCat, subSection, cell, activeRole })
    );
  };

/**
 * Get replied queries count from IndexedDB
 */
export const getRepliedQueriesCountNew = async (subSection) => {
  try {
    const store = await loadRepliedQueries();
    const items = store[subSection] || [];
    return items.length;
  } catch (error) {
    console.warn("Failed to get replied queries count (NEW API):", error);
    return 0;
  }
};

/**
 * Clear all replied queries from IndexedDB
 */
export const clearRepliedQueriesStorageNew = async () => {
  try {
    const { clearRepliedQueries } = await import("../utils/storage");
    await clearRepliedQueries();
    console.log("🗑️ Cleared replied queries storage (NEW API)");
  } catch (error) {
    console.warn("Failed to clear replied queries storage (NEW API):", error);
  }
};
